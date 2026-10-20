# Prompt template: box-location subagent (one per image, AFTER the translation is saved)

Launch with the Agent tool: `subagent_type: "general-purpose"`, `model: "sonnet"`, all images in ONE message.
The translation must already be final: the subagent needs it to know how many boxes to make and which glyphs are
digraphs. Replace the `{...}` placeholders.

---

Task: locate the exact bounding box of every glyph of a text written in "Keposhka" (a fictional alphabet) in an
image. The text is already transcribed; your job is ONLY the location.

Files (use ONLY these; open them with Read, which shows images):
- {WORKDIR}\reference.png -> glyph table (helps to tell glyphs apart and to recognise digraphs).
- {WORKDIR}\img_{N}.{EXT} -> the image, {W} x {H} px (already upright: do NOT rotate it).

Text in the image (only the Keposhka glyphs; ignore everything else; the signs "#", ":", "." and "," get NO box):
{TEXT_LINES}
(Line breaks in this text do NOT match the visual lines of the image; the visual lines are the ones you see.
Spaces get no box; digits do.)
{SCOPE_NOTES}
<!-- Optional. Examples:
     "Only locate the three big red rows (3 + 8 + 5 boxes). No boxes on the black Latin words or on the screen."
     "The last glyph is cut by the right edge of the image: still give it a box, clipped to the edge." -->

Digraphs: Keposhka has ONE glyph for each of Th, Sh, Ch and Gh. Every "th", "sh", "ch" or "gh" in the text is
normally a single glyph and gets a single box (put both letters in "c"). Check each one visually: if the photo
shows two separate glyphs instead (for example S and H side by side in "KEPOSHKA"), make two boxes. The letters
covered by your boxes must add up to exactly the number of letters and digits of the text (no spaces).
Expected number of boxes: {EXPECTED_BOXES}.

Deliver a JSON file at {WORKDIR}\out_{N}.json: a list, in reading order (visual lines top to bottom, left to
right), of objects {"c": "<letters of the text this box covers, e.g. "a" or "th">", "x": <int>, "y": <int>,
"w": <int>, "h": <int>} where (x, y) is the top-left corner and w, h the width and height, all in pixels of the
{W}x{H} image (origin top-left). Boxes TIGHT around the glyph, no extra margin (the margin is added later).

Recommended method (Python with `uv run --with pillow --with numpy --with scipy python ...`):
1. look at the whole image and find the text block (glyphs are usually white on a dark screen, or dark red on paper);
2. segment with a brightness/colour threshold + connected components (close the gaps first if the glyphs are made
   of LED dots), crop and magnify line by line; the text may be tilted;
3. match every component to its letter in reading order, merging pieces of the same glyph and splitting glyphs
   that touch (cut at the brightness valley);
4. DRAW the boxes on magnified crops, look at them with Read and fix what is off.
Keep intermediate files only in {WORKDIR}\work_B{N}\.

Rules: blind test. Do not read or search any other file or folder (no sibling projects, no annotations). Do not
use detectors or trained models: only your own vision and measurements with PIL/numpy/scipy.

When done answer only: the JSON path, the number of boxes, the sum of letters covered, and where you doubt most
(line and word).

---

## What to do with the answer (parent agent)

Run `scripts/review_boxes.py` (no `--apply` first), LOOK at every overlay, then apply. See SKILL.md step 6.
