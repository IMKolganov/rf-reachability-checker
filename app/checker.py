from __future__ import annotations

import re
import socket
import ssl
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from typing import Any
from urllib.parse import urlparse

DEFAULT_PORTS = (443, 80)
_PROBE_TIMEOUT = 8.0

_TARGET_RE = re.compile(
    r"^(?:https?://)?(?P<host>[a-zA-Z0-9][a-zA-Z0-9.\-]{0,253}[a-zA-Z0-9]?)(?::(?P<port>\d{1,5}))?(?:/.*)?$",
)


@dataclass(frozen=True)
class DnsResult:
    ok: bool
    addresses: list[str]
    latency_ms: float | None
    error: str | None = None


@dataclass(frozen=True)
class PortResult:
    port: int
    ok: bool
    latency_ms: float | None
    error: str | None = None


_MAX_BODY_PREVIEW = 300
_HTML_TAG_RE = re.compile(r"<[^>]+>")


@dataclass(frozen=True)
class HttpResult:
    ok: bool
    url: str
    status_code: int | None
    latency_ms: float | None
    bytes_read: int
    content_type: str | None = None
    body_preview: str | None = None
    error: str | None = None

    @property
    def response_summary(self) -> str | None:
        if self.status_code is None and self.error:
            return self.error
        if self.status_code is None:
            return None
        if self.body_preview:
            return f"code {self.status_code}, response: {self.body_preview}"
        return f"code {self.status_code}"


@dataclass(frozen=True)
class CheckResult:
    input: str
    host: str
    reachable: bool
    summary: str
    probe_from: str
    dns: DnsResult
    ports: list[PortResult]
    http: HttpResult | None

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        if self.http is not None:
            payload["http"] = asdict(self.http)
            payload["http"]["response_summary"] = self.http.response_summary
        payload["ports"] = [asdict(p) for p in self.ports]
        payload["dns"] = asdict(self.dns)
        return payload


def parse_target(raw: str) -> tuple[str, int | None, str | None]:
    value = raw.strip()
    if not value:
        raise ValueError("empty target")

    if value.startswith("http://") or value.startswith("https://"):
        parsed = urlparse(value)
        if not parsed.hostname:
            raise ValueError("invalid host or URL")
        return parsed.hostname, parsed.port, value

    match = _TARGET_RE.match(value)
    if not match:
        raise ValueError("invalid host or URL")

    host = match.group("host")
    port_raw = match.group("port")
    return host, int(port_raw) if port_raw else None, None


def _body_preview(raw: bytes, content_type: str | None) -> str:
    text = raw.decode("utf-8", errors="replace").strip()
    if not text:
        return ""

    is_html = "html" in (content_type or "").lower() or text.lstrip().startswith("<")
    if is_html:
        text = _HTML_TAG_RE.sub(" ", text)
        text = re.sub(r"\s+", " ", text).strip()

    if len(text) > _MAX_BODY_PREVIEW:
        return text[:_MAX_BODY_PREVIEW] + "..."
    return text


def _http_result(
    *,
    ok: bool,
    url: str,
    status_code: int | None,
    latency_ms: float | None,
    body: bytes,
    content_type: str | None,
    error: str | None = None,
) -> HttpResult:
    preview = _body_preview(body, content_type) if body else None
    return HttpResult(
        ok=ok,
        url=url,
        status_code=status_code,
        latency_ms=latency_ms,
        bytes_read=len(body),
        content_type=content_type,
        body_preview=preview or None,
        error=error,
    )


def _resolve(host: str) -> DnsResult:
    started = time.perf_counter()
    try:
        infos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
        addresses = sorted({item[4][0] for item in infos})
        latency_ms = round((time.perf_counter() - started) * 1000, 1)
        return DnsResult(ok=bool(addresses), addresses=addresses, latency_ms=latency_ms)
    except OSError as exc:
        return DnsResult(ok=False, addresses=[], latency_ms=None, error=str(exc))


def _probe_tcp(host: str, port: int, timeout: float) -> PortResult:
    started = time.perf_counter()
    try:
        with socket.create_connection((host, port), timeout=timeout):
            latency_ms = round((time.perf_counter() - started) * 1000, 1)
            return PortResult(port=port, ok=True, latency_ms=latency_ms)
    except OSError as exc:
        return PortResult(port=port, ok=False, latency_ms=None, error=str(exc))


def _probe_http(url: str, timeout: float) -> HttpResult:
    started = time.perf_counter()
    request = urllib.request.Request(url, method="GET", headers={"User-Agent": "rf-reachability-checker/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=timeout, context=ssl.create_default_context()) as response:
            body = response.read(8192)
            latency_ms = round((time.perf_counter() - started) * 1000, 1)
            content_type = response.headers.get("Content-Type")
            return _http_result(
                ok=True,
                url=url,
                status_code=response.status,
                latency_ms=latency_ms,
                body=body,
                content_type=content_type,
            )
    except urllib.error.HTTPError as exc:
        latency_ms = round((time.perf_counter() - started) * 1000, 1)
        body = exc.read(8192)
        content_type = exc.headers.get("Content-Type") if exc.headers else None
        return _http_result(
            ok=True,
            url=url,
            status_code=exc.code,
            latency_ms=latency_ms,
            body=body,
            content_type=content_type,
            error=str(exc),
        )
    except Exception as exc:  # noqa: BLE001
        return _http_result(
            ok=False,
            url=url,
            status_code=None,
            latency_ms=None,
            body=b"",
            content_type=None,
            error=str(exc),
        )


def check_target(raw: str, probe_from: str = "rf-probe") -> CheckResult:
    host, explicit_port, probe_url = parse_target(raw)

    dns = _resolve(host)
    connect_host = dns.addresses[0] if dns.addresses else host

    ports_to_check: list[int]
    if explicit_port is not None:
        ports_to_check = [explicit_port]
    else:
        ports_to_check = list(DEFAULT_PORTS)

    port_results = [_probe_tcp(connect_host, port, _PROBE_TIMEOUT) for port in ports_to_check]

    http_result: HttpResult | None = None
    if probe_url:
        http_result = _probe_http(probe_url, _PROBE_TIMEOUT)
    elif explicit_port in (443, None) or 443 in ports_to_check:
        https_url = f"https://{host}/" if explicit_port is None else f"https://{host}:{explicit_port}/"
        http_result = _probe_http(https_url, _PROBE_TIMEOUT)
    elif explicit_port == 80:
        http_result = _probe_http(f"http://{host}/", _PROBE_TIMEOUT)

    signals: list[bool] = []
    if dns.ok:
        signals.extend(p.ok for p in port_results)
    if http_result is not None:
        signals.append(http_result.ok)

    if not dns.ok:
        reachable = False
        summary = "DNS failed"
    elif any(signals):
        reachable = True
        summary = "reachable"
    else:
        reachable = False
        summary = "unreachable"

    return CheckResult(
        input=raw.strip(),
        host=host,
        reachable=reachable,
        summary=summary,
        probe_from=probe_from,
        dns=dns,
        ports=port_results,
        http=http_result,
    )
