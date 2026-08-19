from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from deploy.upload import (
    ConnectionConfig,
    TransportMethod,
    build_config,
    choose_transport,
    probe_ftp,
)


def test_build_config_normalizes_remote_dir():
    env = {
        "FTP_HOST": "ftp.example.test",
        "FTP_LOGIN": "user",
        "FTP_PASSWORD": "pass",
        "FTP_REMOTE_DIR": "/http/",
        "SSH_PORT": "2222",
    }
    config = build_config(env)
    assert config.host == "ftp.example.test"
    assert config.remote_dir == "http"
    assert config.sftp_ports == (2222,)


def test_choose_transport_prefers_sftp():
    config = ConnectionConfig(
        host="host.test",
        username="user",
        password="pass",
        remote_dir="http",
        ftp_port=21,
        sftp_ports=(2222, 22),
    )

    with patch("deploy.upload.probe_sftp", return_value=MagicMock(method=TransportMethod.SFTP, detail="ok on port 2222")), patch(
        "deploy.upload.probe_ftp",
        return_value=MagicMock(method=TransportMethod.FTP, detail="ok on port 21"),
    ):
        method, detail = choose_transport(config)

    assert method is TransportMethod.SFTP
    assert detail == "ok on port 2222"


def test_choose_transport_falls_back_to_ftp():
    config = ConnectionConfig(
        host="host.test",
        username="user",
        password="pass",
        remote_dir="http",
        ftp_port=21,
        sftp_ports=(2222,),
    )

    with patch("deploy.upload.probe_sftp", return_value=MagicMock(method=None, detail="failed")), patch(
        "deploy.upload.probe_ftp",
        return_value=MagicMock(method=TransportMethod.FTP, detail="ok on port 21"),
    ):
        method, detail = choose_transport(config)

    assert method is TransportMethod.FTP


def test_probe_ftp_success():
    config = ConnectionConfig(
        host="ftp.example.test",
        username="user",
        password="pass",
        remote_dir="http",
        ftp_port=21,
        sftp_ports=(2222,),
    )

    ftp = MagicMock()
    with patch("deploy.upload.ftplib.FTP", return_value=ftp):
        result = probe_ftp(config)

    assert result.method is TransportMethod.FTP
    ftp.connect.assert_called_once_with(config.host, 21)
    ftp.login.assert_called_once_with(config.username, config.password)
    ftp.nlst.assert_called_once()


def test_choose_transport_raises_when_none_available():
    config = ConnectionConfig(
        host="host.test",
        username="user",
        password="pass",
        remote_dir="http",
        ftp_port=21,
        sftp_ports=(2222,),
    )

    with patch("deploy.upload.probe_sftp", return_value=MagicMock(method=None, detail="sftp fail")), patch(
        "deploy.upload.probe_ftp",
        return_value=MagicMock(method=None, detail="ftp fail"),
    ):
        with pytest.raises(RuntimeError, match="No working upload transport"):
            choose_transport(config)
