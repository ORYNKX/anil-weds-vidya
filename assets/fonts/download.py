"""Download the latin subsets of the Google Fonts used by the invitation.

Run from anywhere:  python assets/fonts/download.py
Writes self-hosted .woff2 files plus a local fonts.css next to this script.
"""
import re
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
FAMILIES = (
    "family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400"
    "&family=Montserrat:wght@300;400;500;600&display=swap"
)
URL = f"https://fonts.googleapis.com/css2?{FAMILIES}"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

request = urllib.request.Request(URL, headers={"User-Agent": UA})
css = urllib.request.urlopen(request, timeout=60).read().decode("utf-8")

blocks = re.findall(r"/\* latin \*/\s*@font-face\s*\{(.*?)\}", css, re.S)
out = []
for block in blocks:
    family = re.search(r"font-family:\s*'([^']+)'", block).group(1)
    style = re.search(r"font-style:\s*(\w+)", block).group(1)
    weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
    url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
    filename = f"{family.lower().replace(' ', '-')}-{weight}-{style}.woff2"
    data = urllib.request.urlopen(url, timeout=60).read()
    (HERE / filename).write_bytes(data)
    print(f"{filename} {len(data) // 1024} KB", flush=True)
    out.append(
        "@font-face {\n"
        f"  font-family: '{family}';\n"
        f"  font-style: {style};\n"
        f"  font-weight: {weight};\n"
        "  font-display: swap;\n"
        f"  src: url('{filename}') format('woff2');\n"
        "  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, "
        "U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, "
        "U+FEFF, U+FFFD;\n"
        "}\n"
    )

(HERE / "fonts.css").write_text("\n".join(out), encoding="utf-8")
print("wrote fonts.css", flush=True)
