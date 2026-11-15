"""Fail-closed Railway startup; never used by local launchers."""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def prepare_environment():
    mount = os.environ.get("RAILWAY_VOLUME_MOUNT_PATH")
    if not mount or not Path(mount).is_mount():
        raise RuntimeError("Attach a Railway persistent volume at /data before deploying.")
    if Path(mount).resolve() != Path("/data"):
        raise RuntimeError("The configured persistent volume must be mounted at /data.")
    os.environ["CYTOZOE_DATA_DIR"] = mount
    os.environ["CYTOZOE_PUBLIC_READ_ONLY"] = "1"
    hosts = {"127.0.0.1", "localhost", "healthcheck.railway.app"}
    domain = os.environ.get("RAILWAY_PUBLIC_DOMAIN")
    if domain:
        hosts.add(domain)
    for host in os.environ.get("CYTOZOE_ALLOWED_HOSTS", "").split(","):
        host = host.strip()
        if host:
            if "*" in host or "/" in host or ":" in host:
                raise RuntimeError("Use exact hostnames only; wildcard public access is prohibited.")
            hosts.add(host)
    os.environ["CYTOZOE_ALLOWED_HOSTS"] = ",".join(sorted(hosts))


def main():
    prepare_environment()
    subprocess.run([sys.executable, "scripts/verify_data.py", "--strict"], cwd=ROOT, check=True)
    subprocess.run([sys.executable, "scripts/import_data.py", "--all"], cwd=ROOT, check=True)
    port = int(os.environ.get("PORT", "8000"))
    os.chdir(ROOT)
    os.execv(sys.executable, [sys.executable, "-m", "uvicorn", "app.public_demo:create_public_app",
                            "--factory", "--host", "0.0.0.0", "--port", str(port), "--workers", "1"])


if __name__ == "__main__":
    main()
