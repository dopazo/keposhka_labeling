// Runs the REAL labeler sorter (frontend/src/lib/sorter.ts, copied next to this file by review_boxes.py)
// on candidate annotations and prints, per image and slider value, how many boxes would get the wrong letter.
//
// Input: a folder of <stem>.json files shaped { translatedText, boxes: [...], expected: { [boxId]: "letter(s)" } }
// Output: one JSON object on stdout.
import { assignLabels, estimateTiltDegrees } from './lib/sorter';
import { readFileSync, readdirSync } from 'node:fs';

const dir = process.argv[2];
const SLIDER_VALUES = [0.5, 0.7, 1.0, 1.5, 2.0];
const out: Record<string, unknown> = {};

for (const f of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
  const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf-8'));
  const boxes = d.boxes.map((b: any) => ({ ...b, label: '' }));
  const sliders: Record<string, { wrong: number; balanced: boolean }> = {};
  for (const m of SLIDER_VALUES) {
    const r = assignLabels(boxes, d.translatedText, m);
    const wrong = r.boxes.filter(
      (b: any) => (b.label ?? '').toLowerCase() !== String(d.expected[b.id]).toLowerCase()
    ).length;
    sliders[String(m)] = { wrong, balanced: r.isBalanced };
  }
  out[f.replace(/\.json$/, '')] = { n: boxes.length, tilt: estimateTiltDegrees(boxes), sliders };
}
console.log(JSON.stringify(out));
