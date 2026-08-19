#!/usr/bin/env python3
from __future__ import annotations

import ftplib
import io
import sys
from dataclasses import dataclass
from enum import Enum
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
CREDS = ROOT / "deploy" / "credentials.local.env"
HTTP_CGI_ROOT = ROOT / "http-cgi"

UPLOAD_DIRS = ("app", "static", "templates")
UPLOAD_FILES = ("wsgi.py", "requirements.txt")
HOSTING_FILES = (
    (ROOT / "deploy" / "conf.d" / "wsgi", "conf.d/wsgi"),
    (ROOT / "deploy" / "remote-setup.sh", "rf-reachability/deploy/remote-setup.sh"),
)


class TransportMethod(str, Enum):
    SFTP = "sftp"
    FTP = "ftp"


@dataclass(frozen=True)
class ConnectionConfig:
    host: str
    username: str
    password: str
    remote_dir: str
    ftp_port: int
    sftp_ports: tuple[int, ...]


@dataclass(frozen=True)
class ProbeResult:
    method: TransportMethod | None
    detail: str


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def build_config(env: dict[str, str]) -> ConnectionConfig:
    host = env.get("FTP_HOST") or env["SSH_HOST"]
    sftp_ports_raw = env.get("SFTP_PORTS", env.get("SSH_PORT", "2222,22"))
    sftp_ports = tuple(int(p.strip()) for p in sftp_ports_raw.split(",") if p.strip())
    remote_dir = env.get("FTP_REMOTE_DIR", "/rf-reachability/").strip("/") or "rf-reachability"
    return ConnectionConfig(
        host=host,
        username=env["FTP_LOGIN"],
        password=env["FTP_PASSWORD"],
        remote_dir=remote_dir,
        ftp_port=int(env.get("FTP_PORT", "21")),
        sftp_ports=sftp_ports,
    )


def _normalize_remote_dir(remote_dir: str) -> str:
    return remote_dir.strip("/") or "rf-reachability"


def probe_sftp(config: ConnectionConfig) -> ProbeResult:
    try:
        import paramiko
    except ImportError:
        return ProbeResult(None, "paramiko not installed")

    errors: list[str] = []
    for port in config.sftp_ports:
        transport = None
        sftp = None
        try:
            transport = paramiko.Transport((config.host, port))
            transport.connect(username=config.username, password=config.password)
            sftp = paramiko.SFTPClient.from_transport(transport)
            if sftp is None:
                raise RuntimeError("SFTP subsystem unavailable")
            sftp.listdir(".")
            return ProbeResult(TransportMethod.SFTP, f"ok on port {port}")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"port {port}: {exc}")
        finally:
            if sftp is not None:
                sftp.close()
            if transport is not None:
                transport.close()

    return ProbeResult(None, "; ".join(errors))


def probe_ftp(config: ConnectionConfig) -> ProbeResult:
    ftp = None
    try:
        ftp = ftplib.FTP(timeout=15)
        ftp.connect(config.host, config.ftp_port)
        ftp.login(config.username, config.password)
        ftp.nlst()
        return ProbeResult(TransportMethod.FTP, f"ok on port {config.ftp_port}")
    except Exception as exc:  # noqa: BLE001
        return ProbeResult(None, str(exc))
    finally:
        if ftp is not None:
            try:
                ftp.quit()
            except Exception:  # noqa: BLE001
                pass


def choose_transport(config: ConnectionConfig) -> tuple[TransportMethod, str]:
    print(f"Probing SFTP on {config.host} ports {config.sftp_ports}...")
    sftp_result = probe_sftp(config)
    print(f"  SFTP: {sftp_result.detail}")

    print(f"Probing FTP on {config.host}:{config.ftp_port}...")
    ftp_result = probe_ftp(config)
    print(f"  FTP:  {ftp_result.detail}")

    if sftp_result.method is not None:
        return sftp_result.method, sftp_result.detail
    if ftp_result.method is not None:
        return ftp_result.method, ftp_result.detail

    raise RuntimeError(
        "No working upload transport. "
        f"SFTP: {sftp_result.detail}; FTP: {ftp_result.detail}",
    )


def iter_cgi_files() -> list[tuple[Path, str]]:
    items: list[tuple[Path, str]] = []
    for path in HTTP_CGI_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if "__pycache__" in path.parts or path.suffix == ".pyc":
            continue
        rel = path.relative_to(HTTP_CGI_ROOT).as_posix()
        items.append((path, rel))
    return items


def iter_local_files() -> list[tuple[Path, str]]:
    items: list[tuple[Path, str]] = []
    for dirname in UPLOAD_DIRS:
        base = ROOT / dirname
        for path in base.rglob("*"):
            if not path.is_file():
                continue
            if "__pycache__" in path.parts or path.suffix == ".pyc":
                continue
            rel = f"{dirname}/{path.relative_to(base).as_posix()}"
            items.append((path, rel))
    for filename in UPLOAD_FILES:
        items.append((ROOT / filename, filename))
    return items


def iter_hosting_files() -> list[tuple[Path, str]]:
    return [(local, remote) for local, remote in HOSTING_FILES if local.exists()]


def _ensure_sftp_dir(sftp, remote_path: str) -> None:
    parts = [part for part in PurePosixPath(remote_path).parts if part not in (".", "/")]
    current = PurePosixPath()
    for part in parts:
        current /= part
        current_str = current.as_posix()
        try:
            sftp.stat(current_str)
        except OSError:
            sftp.mkdir(current_str)


def upload_via_sftp(config: ConnectionConfig, detail: str) -> None:
    import paramiko

    port = int(detail.rsplit("port ", 1)[-1])
    transport = paramiko.Transport((config.host, port))
    transport.connect(username=config.username, password=config.password)
    sftp = paramiko.SFTPClient.from_transport(transport)
    if sftp is None:
        raise RuntimeError("SFTP subsystem unavailable")

    remote_root = _normalize_remote_dir(config.remote_dir)
    _ensure_sftp_dir(sftp, remote_root)

    try:
        for local_path, rel in iter_local_files():
            remote_path = f"{remote_root}/{rel}"
            _ensure_sftp_dir(sftp, str(PurePosixPath(remote_path).parent))
            sftp.put(str(local_path), remote_path)
            print(f"  uploaded {rel}")

        for local_path, remote_rel in iter_hosting_files():
            _ensure_sftp_dir(sftp, str(PurePosixPath(remote_rel).parent))
            sftp.put(str(local_path), remote_rel)
            print(f"  uploaded {remote_rel}")
    finally:
        sftp.close()
        transport.close()


def _ftp_cwd(ftp: ftplib.FTP, path: str) -> None:
    ftp.cwd("/")
    for part in PurePosixPath(path).parts:
        if part in (".", "/"):
            continue
        try:
            ftp.cwd(part)
        except ftplib.error_perm:
            ftp.mkd(part)
            ftp.cwd(part)


def _ftp_store(ftp: ftplib.FTP, local_path: Path, remote_rel: str) -> None:
    remote_dir = str(PurePosixPath(remote_rel).parent)
    if remote_dir not in (".", ""):
        _ftp_cwd(ftp, remote_dir)
    else:
        ftp.cwd("/")

    with local_path.open("rb") as handle:
        ftp.storbinary(f"STOR {PurePosixPath(remote_rel).name}", handle)


def upload_via_ftp(config: ConnectionConfig) -> None:
    ftp = ftplib.FTP(timeout=30)
    ftp.connect(config.host, config.ftp_port)
    ftp.login(config.username, config.password)
    remote_root = _normalize_remote_dir(config.remote_dir)
    _ftp_cwd(ftp, remote_root)

    try:
        for local_path, rel in iter_local_files():
            remote_dir = str(PurePosixPath(rel).parent)
            if remote_dir not in (".", ""):
                _ftp_cwd(ftp, f"{remote_root}/{remote_dir}")
            else:
                _ftp_cwd(ftp, remote_root)

            with local_path.open("rb") as handle:
                filename = PurePosixPath(rel).name
                ftp.storbinary(f"STOR {filename}", handle)
            print(f"  uploaded {rel}")

        for local_path, remote_rel in iter_hosting_files():
            _ftp_store(ftp, local_path, remote_rel)
            print(f"  uploaded {remote_rel}")
    finally:
        try:
            ftp.quit()
        except Exception:  # noqa: BLE001
            pass


def upload_cgi_via_ftp(config: ConnectionConfig) -> None:
    ftp = ftplib.FTP(timeout=30)
    ftp.connect(config.host, config.ftp_port)
    ftp.login(config.username, config.password)
    remote_root = "http"

    try:
        for local_path, rel in iter_cgi_files():
            _ftp_store(ftp, local_path, f"{remote_root}/{rel}")
            print(f"  uploaded {rel}")
            if rel.endswith(".cgi"):
                try:
                    _ftp_cwd(ftp, remote_root)
                    ftp.sendcmd(f"SITE CHMOD 755 {PurePosixPath(rel).name}")
                    print(f"  chmod 755 {rel}")
                except Exception:  # noqa: BLE001
                    pass
    finally:
        try:
            ftp.quit()
        except Exception:  # noqa: BLE001
            pass


def run_remote_setup(config: ConnectionConfig) -> None:
    try:
        import paramiko
    except ImportError as exc:
        raise RuntimeError("paramiko required for remote setup") from exc

    for port in config.sftp_ports:
        transport = None
        try:
            transport = paramiko.Transport((config.host, port))
            transport.connect(username=config.username, password=config.password)
            chan = transport.open_session()
            chan.exec_command("bash ~/rf-reachability/deploy/remote-setup.sh 2>&1")
            out = chan.makefile().read().decode()
            err = chan.makefile_stderr().read().decode()
            code = chan.recv_exit_status()
            print(out)
            if err.strip():
                print(err)
            if code == 0:
                print("Remote setup OK")
                return
            print(f"Remote setup exit {code} on port {port}")
        except Exception as exc:  # noqa: BLE001
            print(f"SSH port {port}: {exc}")
        finally:
            if transport is not None:
                transport.close()

    raise RuntimeError("remote setup failed on all SSH ports")


def deploy(probe_only: bool = False, cgi: bool = False, setup: bool = False) -> None:
    if not CREDS.exists():
        raise SystemExit(f"Missing {CREDS}. Copy deploy/credentials.example.env first.")

    config = build_config(load_env(CREDS))
    method, detail = choose_transport(config)

    print(f"Selected transport: {method.value} ({detail})")
    if probe_only:
        return

    if cgi:
        print(f"Deploying CGI bundle to {config.host}/http/ ...")
        if method is not TransportMethod.FTP:
            raise RuntimeError("CGI deploy currently supports FTP only")
        upload_cgi_via_ftp(config)
        print("Done. Open your site URL from deploy/credentials.local.env")
        return

    print(f"Deploying to {config.host}/{config.remote_dir}...")
    if method is TransportMethod.SFTP:
        upload_via_sftp(config, detail)
    else:
        upload_via_ftp(config)

    if setup:
        print("Running remote setup over SSH...")
        run_remote_setup(config)

    print("Done.")
    if not setup:
        print("Tip: python3 deploy/upload.py --cgi   (Apache CGI, no WSGI panel needed)")
        print("Tip: python3 deploy/upload.py --setup (WSGI; enable Python/WSGI in 1gb panel first)")


def main() -> None:
    probe_only = "--probe-only" in sys.argv
    cgi = "--cgi" in sys.argv
    setup = "--setup" in sys.argv
    deploy(probe_only=probe_only, cgi=cgi, setup=setup)


if __name__ == "__main__":
    main()
