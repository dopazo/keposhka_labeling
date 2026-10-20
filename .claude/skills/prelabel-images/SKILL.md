---
name: prelabel-images
description: Pre-label new Keposhka images for the labeler. Uses Sonnet subagents to transcribe the glyph text and to locate every character box, then saves them as PENDING annotations so the human only reviews, fixes letters and nudges boxes. Use when new images are added to backend/data/images, when the user asks to pre-label / auto-label / transcribe / "apply the procedure" to images, or when the sidebar shows pending images without text.
---

# Pre-label new Keposhka images

The labeler needs, per image, the translation text and one box per glyph; the sorter then assigns letters to
boxes by position. Doing both by hand is slow. This skill produces them with subagents and leaves the result as
**`pending`**, so a person opens the image (pencil mark in the list), checks it and nudges boxes.

**Hard rules**
- Never set `status: "done"` and never write the YOLO `.txt`: those are produced only when a person presses
  COMPLETE in the app. Pre-labels must not reach training without review.
- Never modify an annotation that is already `done` (the scripts refuse). If you find an error in a done
  annotation, tell the user; if it is fixed, the detector project's `labels.cache` files must be deleted (file
  sizes do not change, so Ultralytics would keep using the old labels).
- `backend/data/` is git-ignored: annotations are not versioned. Do not commit them.

## Models for the subagents

Use **Sonnet** (`model: "sonnet"` in the Agent tool) for both steps, one subagent per image, all launched in one
message so they run in parallel. Measured in blind tests on this dataset:

| Model | Transcription | Box location |
|---|---|---|
| **Sonnet** (recommended) | 55/56 letters on a hard stage photo, 6/7 on a 7-letter word in a difficult photo; on 5 repeated signs it matched the existing labels in 3, misread one header, and was right in the two places it differed (real mislabels in `rule_62`) | Right glyph for 594/594 boxes in 7 stage photos, plus 16 title + 11 LED-header boxes in a collage; median centre offset 1-6 % of a glyph size vs. hand-drawn boxes; IoU 0.55-0.65 tight, 0.76-0.85 with the 10 % margin |
| Haiku | **Not recommended**: 4/7 on a 7-letter word, produced no transcription for the 56-letter photo and wrongly claimed it was rotated 180 deg | Not tested |
| Larger than Sonnet | Not tested. Only worth a second opinion on one specific image when Sonnet reports low confidence (e.g. glyphs under ~12 px) | Not tested |

Cost seen: about 55-100k tokens and 0.5-5 minutes per image and step (the 205-glyph image was the heaviest).
Your own review (below) is the second line of defence; do not skip it.

## Workflow

Run commands from the project root (`keposhka_labeling/`). Python through `uv run --with pillow ...`.

**0. Inventory.** Pending images without an annotation are the candidates (the API lists them; or just run step 1
without names). The labeler lists only `.jpg .jpeg .png .bmp .gif`: a `webp` (or other format) must be imported as
PNG first: `prepare_workdir.py --add <path>`. Videos (`.mp4`) are not images: extract frames first if wanted.

**1. Blind work folder** (outside the repo, in the system temp dir):
```
uv run --with pillow python .claude/skills/prelabel-images/scripts/prepare_workdir.py [names | --add PATH]
```
It writes `img_N` copies with the **EXIF rotation applied** (phone photos are stored sideways: the browser shows
them rotated, so box coordinates must use the rotated frame), the alphabet `reference.png` and `manifest.json`.
Subagents only get this folder, so they never see existing annotations.

**2. Transcription.** One Sonnet subagent per image with `prompts/transcribe.md`. Add a scene note if useful
(collage, tilt, tiny text to ignore).

**3. Review the translation, then save it.**
- Compare with existing annotations of the same sign: the stage screens repeat ("MOAT PPAR 17", "62"...), same
  number = same text. Differences are not automatic errors: crop the glyphs (x4) and decide.
- Zoom on every glyph the subagent flagged. Case is the weakest point (M/m, O/o, S/s, K/k, U/u look alike):
  keep the existing convention and list the uncertain ones for the user.
- Save: `scripts/write_translation.py --stem <name> --text "line1\nline2"` (creates a pending annotation with no boxes).

**4. Decide the scope** before locating boxes. Skip text the detector cannot learn from: glyphs under ~12 px,
LED-dot paragraphs in perspective, parts hidden by people or cut off. Say so to the user instead of labelling
them badly. A glyph only slightly cut by the image edge can get a box clipped to the edge.

**5. Boxes.** One Sonnet subagent per image with `prompts/boxes.md` (needs the final text). Each writes
`out_N.json` in the work folder.

**6. Review the boxes, then write them.**
```
uv run --with pillow --with numpy python .claude/skills/prelabel-images/scripts/review_boxes.py --workdir <WORKDIR>
```
It checks that the letters covered equal the text, digraph boxes are `th/sh/ch/gh`, boxes lie inside the image,
adds the 10 % margin, runs the **real `sorter.ts`** (needs `bun`) and writes `overlays/boxes_N.png`.
**Open every overlay with Read** and check that each box sits on its glyph. Only then add `--apply` (it writes
only images that passed every check, as `pending`, `label: ""`, `charCount` 2 for digraphs).

**7. Verify and report.** `list_images()` should show the images as `pending` with `has_text`; no `.txt` files
were created. Tell the user: images done, the uncertain letters (with line/word), what you skipped and why,
anything odd about the order (see below), and that nothing is committed.

## Text conventions

- One string per image; letters are consumed in **reading order, ignoring spaces and line breaks**.
- Omit signs that are not in the alphabet: `# : . , -`. Keep digits.
- Read strings literally: `MOAT PPAR 80` is not English and must not be "corrected" (a subagent read `PPAI` once:
  same glyphs as every other header, so it was `PPAR`).
- `th sh ch gh` are normally ONE glyph and one box (`charCount` 2); but check: in `KEPOSHKA` the S and H are
  separate glyphs (the Sh digraph glyph is a distinct shape, see `reference.png`).

## Pitfalls learned

- **Latin text inside the image leaks the answer** (e.g. a "WANTED" sign, collage captions). Fine for new data;
  just do not use such images to measure a model.
- **The sorter orders the whole image with one text.** Photos tilted 10-16 deg are handled (it straightens the
  text first), but two blocks at similar height (a small header beside a title row) merge into one row. If the
  check at slider 1.0 fails, write the text in the order the sorter reads (`review_boxes.py` prints which slider
  values work), or leave the extra block out. Slider 0.5-0.7 splits rows more eagerly; the default is 1.0.
- Glyphs that touch (`r`/`n`, `u`/`m`) are cut by the subagent at the brightness valley: those are the boxes a
  reviewer will most likely nudge. Tilted text makes neighbouring boxes overlap a little: normal.
- Hand-drawn boxes are looser than glyph-tight boxes; the 10 % margin (of glyph height, per side) made the two
  styles agree (IoU 0.76-0.85). Use `--margin` if a different style is wanted.
- `review_boxes.py` rewrites `cand/` and `overlays/` on every run; re-run it after replacing an `out_N.json`.
- `python` console on Windows: set `PYTHONIOENCODING=utf-8` if output has non-ASCII characters.

## Files

- `scripts/prepare_workdir.py` - blind folder, EXIF straightening, webp import (`--add`).
- `scripts/write_translation.py` - saves a pending annotation with the text (refuses `done`; keeps boxes).
- `scripts/review_boxes.py` + `scripts/sorter_check.ts` - checks, margin, real-sorter test, overlays, `--apply`.
- `prompts/transcribe.md`, `prompts/boxes.md` - subagent prompt templates and what to do with their answers.
