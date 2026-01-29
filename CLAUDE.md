# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keposhka Labeler is a local web application for labeling images of the fictional "Keposhka" language. Users draw bounding boxes around characters and type a translation sentence once - the app automatically assigns letters to boxes using spatial ordering (left-to-right, top-to-bottom).

## Tech Stack

- **Backend**: FastAPI + Uvicorn, managed with `uv`
- **Frontend**: React + Vite + TypeScript, Tailwind CSS + Shadcn/UI, react-konva for canvas, zustand for state

## Commands

### Backend
```bash
cd backend
uv run uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Architecture

### API Endpoints
- `GET /api/images` - Lists images from local directory
- `POST /api/save` - Saves annotations in YOLO format (.txt)

### Frontend Key Components
- `StageBoard.tsx` - Main Konva canvas for drawing boxes
- `BoxTransformer.tsx` - Handles box resize/transform
- `UrlImage.tsx` - Loads background image
- `EditorPanel.tsx` - Sidebar with text input and file list
- `sorter.ts` - Core algorithm that orders boxes spatially and assigns labels

### Core Logic: Auto-sorting Algorithm (sorter.ts)
1. Groups boxes into "rows" if Y-coordinate difference < threshold (~20px)
2. Sorts boxes left-to-right within each row
3. Maps input text characters to sorted boxes sequentially
4. Alerts if text length doesn't match box count

### Data Flow
- Boxes drawn on canvas are stored in zustand store
- User types translation text in sidebar
- Sorter assigns each character to corresponding box
- On save, pixel coordinates are normalized (0-1) for YOLO format

## Configuration

Frontend uses Vite proxy (`/api` -> `http://127.0.0.1:8000`) to avoid CORS issues during development.
