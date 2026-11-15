"""
Facial Biometric Assessment Guide
Builds one self-contained HTML file from the frontend folder.

Author: Dee Williamson
November 2026

Run with:  python tools/build_single_file.py
Output:    dist/facial-biometric-assessment-guide.html

The single file needs no server and no internet connection.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
OUTPUT = ROOT / "dist" / "facial-biometric-assessment-guide.html"


def read(relative_path: str) -> str:
    return (FRONTEND / relative_path).read_text(encoding="utf-8")


def build() -> Path:
    html = read("index.html")

    def inline_style(match):
        return "<style>\n" + read(match.group(1)) + "</style>"

    def inline_script(match):
        # A closing script tag inside the code would end the block early.
        code = read(match.group(1)).replace("</script", "<\\/script")
        return "<script>\n" + code + "</script>"

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_style, html)
    html = re.sub(r'<script src="([^"]+)"></script>', inline_script, html)

    OUTPUT.parent.mkdir(exist_ok=True)
    OUTPUT.write_text(html, encoding="utf-8")
    return OUTPUT


if __name__ == "__main__":
    print(f"Built {build().relative_to(ROOT)}")
