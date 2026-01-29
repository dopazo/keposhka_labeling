# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keposhka Labeler is a local web application for labeling images of the fictional "Keposhka" language. Users draw bounding boxes around characters and type a translation sentence once - the app automatically assigns letters to boxes using spatial ordering (left-to-right, top-to-bottom).

## Tech Stack

- **Backend**: FastAPI + Uvicorn, managed with `uv`
- **Frontend**: React + Vite + TypeScript, Tailwind CSS + Shadcn/UI, react-konva for canvas, zustand for state, managed with `bun`

## Commands

### Backend
```bash
cd backend
uv run uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
bun install
bun run dev
```

## Architecture

### API Endpoints
- `GET /api/images` - Lists images from `/data/images` directory
- `GET /api/annotations/{filename}` - Returns existing annotation metadata if available
- `POST /api/save` - Saves annotations as YOLO `.txt` and metadata `.json` files

### Frontend Key Components
- `StageBoard.tsx` - Main Konva canvas for drawing/selecting/deleting boxes
- `BoxTransformer.tsx` - Handles box resize/transform via Konva Transformer
- `UrlImage.tsx` - Loads and auto-fits background image
- `EditorPanel.tsx` - Sidebar with multiline text input and file list
- `ReferencePanel.tsx` - Right panel for Keposhka alphabet reference image
- `BoxContextMenu.tsx` - Right-click menu to set charCount (1/2/3 for digraphs)

### Core Logic

**sorter.ts - Auto-sorting Algorithm:**
1. Groups boxes into "rows" using dynamic threshold (~30% of average box height)
2. Sorts boxes left-to-right within each row
3. Consumes `charCount` characters per box (skipping spaces)
4. Validates: total text chars (excluding spaces) must equal sum of all `charCount`

**validator.ts - Keposhka Alphabet:**
- 70 valid characters: 0-9, A-Z (case-sensitive), plus digraphs (CH, ch, GH, gh, SH, sh, TH, th)
- `labelToClassId(label)` - converts character to YOLO class index (0-69)
- `classIdToLabel(classId)` - converts YOLO class index to character

### Data Flow
- Boxes drawn on canvas stored in zustand store with `{id, x, y, width, height, charCount, label}`
- User types translation in textarea; sorter assigns labels to boxes in real-time
- Visual feedback: green border = assigned, red dashed = unassigned
- On save: pixel coords normalized to 0-1 for YOLO format

### Output Files (per image)
- `.txt` - YOLO format: `class x_center y_center width height` (all normalized 0-1)
- `.json` - Full metadata for re-editing: boxes with pixel coords, charCount, labels, original text

## Configuration

Frontend uses Vite proxy (`/api` -> `http://127.0.0.1:8000`) to avoid CORS issues during development.

## Key Behaviors

- **Digraphs**: Right-click a box to mark it as 2+ characters (for CH, SH, TH, GH)
- **Spaces**: Automatically skipped during label assignment (no boxes for spaces)
- **Multiline text**: Each line maps to a row of boxes (separated by Enter)
- **Re-annotation**: Opening a previously annotated image loads boxes and text from `.json`
- **Save shortcut**: Shift+Enter saves and advances to next pending image

## When designing

This section guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

### Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

### Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
