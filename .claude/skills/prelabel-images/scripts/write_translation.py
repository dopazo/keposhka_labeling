#!/usr/bin/env python3
"""
Write (or update) the translation of an image as a PENDING annotation, without boxes.
The labeler then shows the image with a pencil mark and the text already filled in.

Usage:
  uv run --with pillow python write_translation.py --stem mcr_keposhka_guide --text "MCR\nKEPOSHKA\nGUIDE"
  uv run --with pillow python write_translation.py --stem foo --text-file text.txt

Safety: never touches an annotation whose status is 'done'; never wipes existing boxes
(use --force to replace the text of a pending annotation that already has boxes).
Options: --ann-dir PATH (default backend/data/annotations; handy for dry runs)
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[4]
IMG_DIR = ROOT / "backend" / "data" / "images"


def displayed_size(path: Path) -> tuple[int, int]:
    """Size as the browser (and therefore the labeler canvas) shows it: EXIF rotation applied."""
    with Image.open(path) as im:
        w, h = im.size
        if im.getexif().get(274) in (5, 6, 7, 8):
            w, h = h, w
    return w, h


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--stem", required=True, help="image file name without extension")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--text", help='translation; write line breaks as \\n')
    g.add_argument("--text-file", type=Path)
    ap.add_argument("--ann-dir", type=Path, default=ROOT / "backend" / "data" / "annotations")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    text = args.text.replace("\\n", "\n") if args.text is not None else args.text_file.read_text(encoding="utf-8").strip("\n")
    hits = [p for p in IMG_DIR.iterdir() if p.stem == args.stem and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".gif"}]
    if not hits:
        sys.exit(f"no supported image with stem '{args.stem}' in {IMG_DIR}")
    img = hits[0]
    w, h = displayed_size(img)

    out = args.ann_dir / f"{args.stem}.json"
    boxes = []
    if out.exists():
        old = json.loads(out.read_text(encoding="utf-8"))
        if old.get("status") == "done":
            sys.exit(f"{out.name} is already 'done' - refusing to touch it")
        if old.get("boxes") and not args.force:
            sys.exit(f"{out.name} already has {len(old['boxes'])} boxes - use --force to replace only the text")
        boxes = old.get("boxes", [])
    out.write_text(json.dumps({"filename": img.name, "translatedText": text, "imageWidth": w, "imageHeight": h,
                               "status": "pending", "boxes": boxes}, ensure_ascii=False, indent=2), encoding="utf-8")
    letters = len("".join(text.split()))
    print(f"wrote {out}  ({w}x{h}, {letters} letters/digits, status pending, {len(boxes)} boxes kept)")


if __name__ == "__main__":
    main()
