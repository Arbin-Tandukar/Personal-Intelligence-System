"""Run script for the Personal Intelligence System (PIS)."""

import os
import sys
import socket

# Add current dir to python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import uvicorn


def get_local_ip():
    """Discover primary local LAN IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    # Binding to 0.0.0.0 allows access from mobile devices on the same Wi-Fi
    host = os.environ.get("HOST", "0.0.0.0")
    local_ip = get_local_ip()

    print("\n" + "=" * 65)
    print("  PERSONAL INTELLIGENCE SYSTEM (PIS) — LOCAL COMMAND CENTER")
    print("=" * 65)
    print(f"  • PC Browser     : http://localhost:{port}")
    print(f"  • Mobile Access  : http://{local_ip}:{port}")
    print(f"  • API Docs       : http://localhost:{port}/docs")
    print(f"  • Demo User      : demo / password123")
    print("=" * 65 + "\n")

    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
