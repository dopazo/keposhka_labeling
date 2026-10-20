# Prompt template: transcription subagent (one per image)

Launch with the Agent tool: `subagent_type: "general-purpose"`, `model: "sonnet"`, all images in ONE message so
they run in parallel. Replace the `{...}` placeholders. Keep the "blind" rules: the subagent must not see the
existing annotations (that is why it only gets the work folder).

---

Task: transcribe text written in "Keposhka", a fictional alphabet (a substitution cipher: each glyph stands for
one Latin letter or digit; the message is in English).

Files (use ONLY these two; open them with Read, which shows images):
- {WORKDIR}\reference.png -> glyph-to-letter table. Upper and lower case have different glyphs; Th, Sh, Ch and Gh
  have a single glyph each; digits 0-9 are at the bottom.
- {WORKDIR}\img_{N}.{EXT} -> the photo ({W} x {H} px, already upright: do NOT rotate it).

{SCENE_NOTES}
<!-- Optional, one or two lines about THIS image. Examples:
     "A photo of a stage screen; the white glyph text may be tilted 10-16 degrees or seen at an angle."
     "A collage: Latin words (e.g. 'The', 'Guide') appear between three large red glyph rows. The Latin words are
      NOT Keposhka; you may use them as a hint but must decode every glyph yourself and tell me if they disagree."
     "Ignore the tiny paragraphs on the right screen: out of scope." -->

Rules:
- Do not read or search any other file or folder (no sibling projects, no annotations). This is a blind test and
  opening other files invalidates it.
- Decode glyph by glyph with the table. Knowing the message is English may break ties between similar glyphs
  (K/M/R, d/o, S/m...); when you use that, say so. Do NOT "fix" a word that is not English: some strings are
  codes or names (e.g. "MOAT PPAR 80" is read literally).
- Keep upper/lower case as the glyph shows it and the visual line breaks as seen in the photo. Do not guess case
  from position in the line: say it is uncertain instead.
- Write each digraph (Th/Sh/Ch/Gh glyph) as normal letters ("Th", "sh"...) and say how many glyphs it is.
- Leave out every sign that is not in the table ("#", ":", ".", ",", "-"). Digits are kept.

Deliver exactly: (1) the final transcription in a code block, one block line per visual line; (2) a list of
doubtful characters with their position (line, word) and the alternative; (3) confidence 0-100 % per line.
Be brief and do not repeat the table. You may crop/zoom with Python (`uv run --with pillow python ...`) and keep
intermediate files only in {WORKDIR}\work_T{N}\.

---

## What to do with the answer (parent agent)

1. Compare it with the Latin words in the image, if any, and with existing annotations of the same sign (the
   "MOAT PPAR NN" screens repeat: same rule number = same text). Differences are not automatically errors: crop
   the glyphs and decide. Sonnet caught real mislabels in `rule_62` this way ("There"/"familial").
2. Doubtful glyphs: zoom on them yourself (crop x4 with PIL, compare with `reference.png`).
3. Write it with `scripts/write_translation.py`; mention the uncertain letters to the user.
