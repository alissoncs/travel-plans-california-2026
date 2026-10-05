"""Serve o site localmente (e na rede Wi-Fi, para abrir no celular).

O index.html é escrito como fragmento (formato de Artifact); aqui ele é envolvido
no esqueleto <!doctype html> antes de ser entregue.

Uso: python scripts/servir.py [porta]
"""
import http.server
import socket
import sys
from functools import partial
from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / "site"
ESQUELETO = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head><body>
{conteudo}
</body></html>"""


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?")[0] in ("/", "/index.html"):
            corpo = ESQUELETO.format(conteudo=(SITE / "index.html").read_text(encoding="utf-8")).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(corpo)))
            self.end_headers()
            self.wfile.write(corpo)
        else:
            super().do_GET()


def ip_local():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except OSError:
        return "localhost"


if __name__ == "__main__":
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    servidor = http.server.ThreadingHTTPServer(("0.0.0.0", porta), partial(Handler, directory=str(SITE)))
    print(f"Computador: http://localhost:{porta}\nCelular (mesmo Wi-Fi): http://{ip_local()}:{porta}")
    servidor.serve_forever()
