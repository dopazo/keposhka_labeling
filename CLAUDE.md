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
