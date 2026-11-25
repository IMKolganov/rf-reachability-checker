import io
import ssl
from urllib.error import HTTPError, URLError

import pytest

from app.checker import _body_preview, _probe_http, check_target, parse_target


def test_parse_target_host():
    assert parse_target("google.com") == ("google.com", None, None)


def test_parse_target_ip():
    assert parse_target("8.8.8.8") == ("8.8.8.8", None, None)


def test_parse_target_url():
    assert parse_target("https://www.google.com/") == (
        "www.google.com",
        None,
        "https://www.google.com/",
    )


def test_parse_target_with_port():
    assert parse_target("example.com:8443") == ("example.com", 8443, None)


def test_parse_target_invalid():
    with pytest.raises(ValueError):
        parse_target("   ")


def test_body_preview_strips_html():
    raw = b"<html><body><h1>Hello</h1><p>world</p></body></html>"
    preview = _body_preview(raw, "text/html")
    assert "<" not in preview
    assert "Hello" in preview
    assert "world" in preview


@pytest.mark.parametrize(
    ("reason", "error_kind"),
    [
        (TimeoutError("_ssl.c:1115: The handshake operation timed out"), "tls_timeout"),
        (TimeoutError("timed out"), "timeout"),
        (ssl.SSLCertVerificationError("certificate verify failed"), "tls_certificate"),
        (ssl.SSLError("wrong version number"), "tls_error"),
        (ConnectionRefusedError("connection refused"), "connection_error"),
    ],
)
def test_probe_http_classifies_connection_failure(monkeypatch, reason, error_kind):
    def fail_to_open(*args, **kwargs):
        raise URLError(reason)

    monkeypatch.setattr("app.checker.urllib.request.urlopen", fail_to_open)

    result = _probe_http("https://example.test/", timeout=0.1)

    assert not result.ok
    assert result.status_code is None
    assert result.error_kind == error_kind
    assert str(reason) in result.error


def test_probe_http_preserves_status_when_body_read_fails(monkeypatch):
    class SlowBody(io.BytesIO):
        def read(self, size):
            raise TimeoutError("read timed out")

    def open_with_http_error(request, **kwargs):
        raise HTTPError(request.full_url, 503, "Unavailable", None, SlowBody())

    monkeypatch.setattr("app.checker.urllib.request.urlopen", open_with_http_error)

    result = _probe_http("https://example.test/", timeout=0.1)

    assert result.ok
    assert result.status_code == 503
    assert result.error_kind is None
    assert result.body_error == "read timed out"
    assert result.response_summary == "code 503"


def test_check_localhost():
    result = check_target("127.0.0.1", probe_from="test")
    assert result.host == "127.0.0.1"
    assert isinstance(result.reachable, bool)
