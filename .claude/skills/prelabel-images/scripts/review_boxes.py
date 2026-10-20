#!/usr/bin/env python3
"""
Review (and optionally write) the boxes a subagent produced for each image.

Input in the work folder: manifest.json (from prepare_workdir.py) and out_<n>.json per image:
    [ {"c": "<letters this box covers: 'a' or a digraph 'th'>", "x": int, "y": int, "w": int, "h": int}, ... ]
in reading order, boxes tight around each glyph.

For every image this script:
  1. checks the letters the boxes cover equal the translation saved in the annotation (spaces ignored),
     digraph boxes are th/sh/ch/gh, boxes lie inside the image, and warns about size outliers / overlaps;
  2. adds a margin (default 10% of the glyph height per side) to imitate the hand-drawn box style;
  3. runs the REAL sorter.ts (needs `bun`) and reports how many boxes would get the wrong letter at
     several slider values - the labeler assigns letters from the text by position, so this must be 0 at 1.0;
  4. writes an overlay PNG you MUST look at before applying;
  5. with --apply (and only if every check passed) writes the boxes into the annotation as PENDING:
     label "", charCount = letters covered. It never marks 'done' and never writes the YOLO .txt.

Usage:
  uv run --with pillow --with numpy python review_boxes.py --workdir W            # review all, write nothing
  uv run --with pillow --with numpy python review_boxes.py --workdir W 1 3        # only images 1 and 3
  uv run --with pillow --with numpy python review_boxes.py --workdir W --apply    # write the ones that pass
Options: --margin 0.10   --ann-dir PATH (default backend/data/annotations)   --skip-sorter-check (blocks --apply)
"""
import argparse
import json
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
LIB = ROOT / "frontend" / "src" / "lib"
HERE = Path(__file__).resolve().parent
DIGRAPHS = {"th", "sh", "ch", "gh"}


def run_sorter_check(work: Path, cand: Path) -> dict | None:
    bun = shutil.which("bun")
    if not bun:
        print("  ! bun not found on PATH - cannot run the real sorter check")
        return None
    test = work / "sorter_test"
    (test / "lib").mkdir(parents=True, exist_ok=True)
    for name in ("sorter", "validator", "types"):
        shutil.copy(LIB / f"{name}.ts", test / "lib" / f"{name}.ts")
    (test / "tsconfig.json").write_text(json.dumps({"compilerOptions": {
        "baseUrl": ".", "paths": {"@/*": ["./*"]}, "module": "ESNext", "moduleResolution": "bundler",
        "target": "ES2022", "strict": True, "skipLibCheck": True}}), encoding="utf-8")
    shutil.copy(HERE / "sorter_check.ts", test / "check.ts")
    res = subprocess.run([bun, "run", "check.ts", cand.as_posix()], cwd=test, capture_output=True, text=True)
    if res.returncode != 0:
        print("  ! sorter check failed to run:\n" + res.stderr[-800:])
        return None
    return json.loads(res.stdout.strip().splitlines()[-1])


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("only", nargs="*", type=int, help="image numbers to review (default: all with an out_<n>.json)")
    ap.add_argument("--workdir", required=True, type=Path)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--margin", type=float, default=0.10)
    ap.add_argument("--ann-dir", type=Path, default=ROOT / "backend" / "data" / "annotations")
    ap.add_argument("--skip-sorter-check", action="store_true")
    args = ap.parse_args()

    work = args.workdir
    manifest = json.loads((work / "manifest.json").read_text(encoding="utf-8"))
    (work / "cand").mkdir(exist_ok=True)
    (work / "overlays").mkdir(exist_ok=True)
    for old in (work / "cand").glob("*.json"):
        old.unlink()

    review = {}  # stem -> dict(entry, problems, boxes)
    for e in manifest:
        n, stem = e["n"], e["stem"]
        if args.only and n not in args.only:
            continue
        f = work / f"out_{n}.json"
        print(f"\n=== img_{n}  {e['filename']}  ({e['width']}x{e['height']})")
        if not f.exists():
            print("  out file missing - skipped")
            continue
        ann_path = args.ann_dir / f"{stem}.json"
        if not ann_path.exists():
            print(f"  no annotation yet: write the translation first (write_translation.py) - skipped")
            continue
        ann = json.loads(ann_path.read_text(encoding="utf-8"))
        if ann.get("status") == "done":
            print("  annotation is already 'done' - skipped")
            continue
        raw = json.loads(f.read_text(encoding="utf-8"))
        W, H = e["width"], e["height"]
        text = "".join(ann["translatedText"].split())
        problems = []

        cover = "".join(str(r["c"]) for r in raw)
        if cover.lower() != text.lower():
            k = next((i for i, (a, b) in enumerate(zip(cover.lower(), text.lower())) if a != b), min(len(cover), len(text)))
            problems.append(f"letters covered by the boxes differ from the text (boxes {len(cover)} vs text {len(text)}; "
                            f"first difference at letter {k}: boxes ...{cover[max(k-6,0):k+6]!r} vs text ...{text[max(k-6,0):k+6]!r})")
        bad_dig = [r["c"] for r in raw if len(str(r["c"])) > 1 and str(r["c"]).lower() not in DIGRAPHS]
        if bad_dig:
            problems.append(f"multi-letter boxes that are not digraphs: {bad_dig}")
        outside = [i for i, r in enumerate(raw) if r["w"] <= 0 or r["h"] <= 0 or r["x"] < 0 or r["y"] < 0
                   or r["x"] + r["w"] > W or r["y"] + r["h"] > H]
        if outside:
            problems.append(f"boxes outside the image or degenerate (indexes {outside[:10]})")

        hs = np.array([r["h"] for r in raw]); ws = np.array([r["w"] for r in raw])
        odd = [(i, r["c"]) for i, r in enumerate(raw) if abs(r["h"] - np.median(hs)) > 0.5 * np.median(hs)]
        print(f"  boxes: {len(raw)} | digraph boxes: {sum(len(str(r['c'])) > 1 for r in raw)} | median glyph {np.median(ws):.0f}x{np.median(hs):.0f}px")
        if odd:
            print(f"  note: height far from the median in {len(odd)} boxes (often legit: j, y, f...): {odd[:6]}")

        boxes = []
        for r in raw:
            pad = args.margin * r["h"]
            x0, y0 = max(0, r["x"] - pad), max(0, r["y"] - pad)
            x1, y1 = min(W, r["x"] + r["w"] + pad), min(H, r["y"] + r["h"] + pad)
            boxes.append({"id": str(uuid.uuid4()), "x": round(x0, 1), "y": round(y0, 1), "width": round(x1 - x0, 1),
                          "height": round(y1 - y0, 1), "charCount": len(str(r["c"])), "label": ""})
        json.dump({"translatedText": ann["translatedText"], "boxes": boxes,
                   "expected": {b["id"]: str(r["c"]) for b, r in zip(boxes, raw)}},
                  open(work / "cand" / f"{stem}.json", "w", encoding="utf-8"), ensure_ascii=False)

        im = Image.open(work / e["work_image"]).convert("RGB")
        dr = ImageDraw.Draw(im)
        lw = max(2, round(max(W, H) / 700))
        for b in boxes:
            dr.rectangle([b["x"], b["y"], b["x"] + b["width"], b["y"] + b["height"]], outline=(255, 0, 0), width=lw)
        bx0 = min(b["x"] for b in boxes) - 40; by0 = min(b["y"] for b in boxes) - 40
        bx1 = max(b["x"] + b["width"] for b in boxes) + 40; by1 = max(b["y"] + b["height"] for b in boxes) + 40
        crop = im.crop((max(0, bx0), max(0, by0), min(W, bx1), min(H, by1)))
        s = min(1.0, 1900 / crop.height, 1500 / crop.width)
        crop = crop.resize((max(1, int(crop.width * s)), max(1, int(crop.height * s))), Image.LANCZOS)
        overlay = work / "overlays" / f"boxes_{n}.png"
        crop.save(overlay)
        print(f"  overlay (LOOK AT IT): {overlay}")
        review[stem] = {"n": n, "ann_path": ann_path, "ann": ann, "boxes": boxes, "problems": problems}

    if not review:
        sys.exit("\nnothing to review")

    sorter = None if args.skip_sorter_check else run_sorter_check(work, work / "cand")
    print("\n--- real sorter check (boxes that would get the WRONG letter; slider default is 1.0) ---")
    for stem, r in review.items():
        if sorter is None or stem not in sorter:
            r["problems"].append("real sorter check not available")
            print(f"  {stem}: not checked")
            continue
        s = sorter[stem]
        row = "  ".join(f"x{m}:{v['wrong']}" for m, v in sorted(s["sliders"].items(), key=lambda kv: float(kv[0])))
        print(f"  {stem}: tilt {s['tilt']:+.2f} deg | {row} | balanced@1.0={s['sliders']['1']['balanced']}")
        if s["sliders"]["1"]["wrong"] != 0 or not s["sliders"]["1"]["balanced"]:
            ok = [m for m, v in s["sliders"].items() if v["wrong"] == 0]
            r["problems"].append("the labeler sorter would assign wrong letters at the default slider 1.0"
                                 + (f" (works at slider {ok})" if ok else " (works at no slider value)")
                                 + " - check text order vs. block layout, mixed blocks at similar height, extreme tilt")

    print("\n--- verdict ---")
    for stem, r in review.items():
        if r["problems"]:
            print(f"  {stem}: PROBLEMS")
            for p in r["problems"]:
                print(f"     - {p}")
        else:
            print(f"  {stem}: OK ({len(r['boxes'])} boxes)")
            if args.apply:
                a = r["ann"]
                a["boxes"] = r["boxes"]
                a["status"] = "pending"
                r["ann_path"].write_text(json.dumps(a, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"     WROTE {len(r['boxes'])} boxes -> {r['ann_path'].name} (status pending)")
    if not args.apply:
        print("\nnothing written (re-run with --apply after looking at the overlays)")


if __name__ == "__main__":
    main()
