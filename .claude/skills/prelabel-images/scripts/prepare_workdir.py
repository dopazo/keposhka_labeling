#!/usr/bin/env python3
"""
Prepare a blind work folder for the prelabel-images skill.

For each selected image it writes a straightened copy (EXIF rotation applied, so pixel
coordinates match what the labeler shows) under a neutral name (img_1, img_2, ...) plus a
copy of the alphabet reference, and a manifest.json. Subagents work ONLY from this folder, so
they never see the existing annotations.

Usage (from anywhere):
  uv run --with pillow python prepare_workdir.py                      # all images with no annotation yet
  uv run --with pillow python prepare_workdir.py a.jpg b.png          # specific images (name or stem)
  uv run --with pillow python prepare_workdir.py --add C:/x/new.webp  # first import an image the labeler
                                                                      # cannot read (webp, tiff...) as PNG
Options: --workdir PATH (default: a new folder in the system temp dir)
"""
import argparse
import json
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[4]  # scripts -> prelabel-images -> skills -> .claude -> project root
IMG_DIR = ROOT / "backend" / "data" / "images"
ANN_DIR = ROOT / "backend" / "data" / "annotations"
REFERENCE = IMG_DIR / "keposhka_abecedario.png"
LABELER_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".gif"}  # what backend/main.py lists


def import_image(src: Path) -> Path:
    """Convert an image the labeler cannot list (e.g. webp) to PNG inside the images folder."""
    dst = IMG_DIR / f"{src.stem}.png"
    if dst.exists():
        sys.exit(f"refusing to overwrite existing {dst}")
    Image.open(src).convert("RGB").save(dst)
    print(f"imported {src.name} -> {dst.name}")
    return dst


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("images", nargs="*", help="image names or stems inside backend/data/images")
    ap.add_argument("--add", action="append", default=[], metavar="PATH", help="import an external image as PNG first")
    ap.add_argument("--workdir", type=Path)
    args = ap.parse_args()

    if not REFERENCE.exists():
        sys.exit(f"alphabet reference not found: {REFERENCE} (ask the user for the reference image)")

    chosen = [import_image(Path(p)) for p in args.add]
    if args.images:
        for name in args.images:
            hits = [p for p in IMG_DIR.iterdir() if p.name == name or p.stem == name]
            if not hits:
                sys.exit(f"not found in {IMG_DIR}: {name}")
            chosen.append(hits[0])
    elif not args.add:
        chosen = sorted(p for p in IMG_DIR.iterdir()
                        if p.suffix.lower() in LABELER_EXTS and not (ANN_DIR / f"{p.stem}.json").exists())
    if not chosen:
        sys.exit("no images to prepare (everything already has an annotation)")

    work = args.workdir or Path(tempfile.gettempdir()) / f"prelabel_{time.strftime('%Y%m%d_%H%M%S')}"
    work.mkdir(parents=True, exist_ok=True)
    Image.open(REFERENCE).convert("RGB").save(work / "reference.png")

    manifest = []
    for n, src in enumerate(chosen, 1):
        im = Image.open(src)
        orientation = im.getexif().get(274)
        im = ImageOps.exif_transpose(im)
        ext = ".jpg" if src.suffix.lower() in {".jpg", ".jpeg"} else ".png"
        out = work / f"img_{n}{ext}"
        if ext == ".jpg":
            im.convert("RGB").save(out, quality=95)
        else:
            im.convert("RGB").save(out)
        manifest.append({"n": n, "filename": src.name, "stem": src.stem, "work_image": out.name,
                         "width": im.width, "height": im.height, "exif_orientation": orientation})
        print(f"img_{n}{ext} <- {src.name}  {im.width}x{im.height}" + (f"  (EXIF orientation {orientation} applied)" if orientation not in (None, 1) else ""))
    (work / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"\nworkdir: {work}\nmanifest: {work / 'manifest.json'}")


if __name__ == "__main__":
    main()
