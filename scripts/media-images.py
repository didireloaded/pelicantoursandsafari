"""Regenerate catalogue assets from the already-used WIKINAM photographs.

Requires Pillow with WebP/AVIF support. No permission/license claim is made;
the operator must confirm publication rights before release.
"""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
import json

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public/images"
BASE = "https://www.wikinam.org/html/ctc/cl/tours-and-safaris-operators/264/windhoek-061/pelican-tours-and-safaris/img/showcase/1920/"
NAMES = ["rhino", "leopard", "zebra", "oryx", "hippo", "hyena", "baboon", "sea-lions", "car-safari-scene", "nature-landscape", "savanna-plains-sunset", "quiver-tree-sunset"]


def convert(name):
    url = f"{BASE}{name}.jpg"
    with urlopen(Request(url, headers={"User-Agent": "Pelican asset preparation"}), timeout=45) as response:
        source = response.read()
    image = ImageOps.exif_transpose(Image.open(BytesIO(source))).convert("RGB")
    derivatives = []
    for width in (640, 1280, 1920):
        target_width = min(width, image.width)
        resized = image.resize((target_width, round(image.height * target_width / image.width)), Image.Resampling.LANCZOS)
        for format_name in ("WEBP", "AVIF"):
            path = OUTPUT / f"{name}-{width}.{format_name.lower()}"
            resized.save(path, format=format_name, quality=90 if format_name == "WEBP" else 75)
            derivatives.append({"file": path.name, "width": resized.width, "height": resized.height, "bytes": path.stat().st_size})
    return {"name": name, "source": url, "sourceBytes": len(source), "sourceSha256": sha256(source).hexdigest(), "width": image.width, "height": image.height, "quality": {"webp": 90, "avif": 75}, "rights": "Publication permission/license unconfirmed; verify with the operator and source owner before release.", "derivatives": derivatives}


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        entries = list(pool.map(convert, NAMES))
    (OUTPUT / "manifest.json").write_text(json.dumps(entries, indent=2) + "\n")
    print(json.dumps({"sourceBytes": sum(x["sourceBytes"] for x in entries), "derivedBytes": sum(y["bytes"] for x in entries for y in x["derivatives"]), "images": len(entries)}))
