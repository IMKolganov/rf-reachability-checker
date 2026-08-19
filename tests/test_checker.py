import pytest

from app.checker import _body_preview, check_target, parse_target


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


def test_check_localhost():
    result = check_target("127.0.0.1", probe_from="test")
    assert result.host == "127.0.0.1"
    assert isinstance(result.reachable, bool)
