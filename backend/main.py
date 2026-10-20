"""
Keposhka Labeler - FastAPI Backend
"""
import json
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image

from schemas import Annotation, ImageInfo
from utils import save_yolo_format, save_json_metadata, generate_classes_file

app = FastAPI(title="Keposhka Labeler API")

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
DATA_DIR = Path(__file__).parent / "data"
IMAGES_DIR = DATA_DIR / "images"
ANNOTATIONS_DIR = DATA_DIR / "annotations"
REFERENCE_DIR = DATA_DIR / "reference"

# Ensure directories exist
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
ANNOTATIONS_DIR.mkdir(parents=True, exist_ok=True)
REFERENCE_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files for images
app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")


@app.on_event("startup")
async def startup_event():
    """Generate classes.txt on startup"""
    generate_classes_file(ANNOTATIONS_DIR)
    print(f"✓ Generated classes.txt in {ANNOTATIONS_DIR}")


@app.get("/api/images", response_model=List[ImageInfo])
async def list_images():
    """
    List all images from the images directory with their metadata
    Returns status from annotation JSON if exists, 'pending' otherwise
    """
    images = []

    # Supported image extensions
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'}

    for img_path in IMAGES_DIR.iterdir():
        if img_path.suffix.lower() not in image_extensions:
            continue

        # Check if annotation exists and read status from it
        annotation_path = ANNOTATIONS_DIR / f"{img_path.stem}.json"
        status = "pending"
        has_text = False
        if annotation_path.exists():
            try:
                with open(annotation_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    status = metadata.get("status", "done")  # Default to done for legacy files
                    has_text = bool(metadata.get("translatedText", "").strip())
            except Exception:
                status = "done"  # If can't read, assume done (legacy)

        # Get image dimensions
        try:
            with Image.open(img_path) as img:
                width, height = img.size
                # Phone photos store rotation in EXIF (orientations 5-8 swap axes).
                # Browsers display them rotated, so report the displayed size.
                if img.getexif().get(274) in (5, 6, 7, 8):
                    width, height = height, width

            images.append(ImageInfo(
                filename=img_path.name,
                width=width,
                height=height,
                status=status,
                has_text=has_text
            ))
        except Exception as e:
            print(f"Error reading image {img_path}: {e}")
            continue

    # Sort by filename
    images.sort(key=lambda x: x.filename)

    return images


@app.get("/api/annotations/{filename}")
async def get_annotation(filename: str):
    """
    Get existing annotation metadata for an image
    Returns the JSON metadata if it exists, otherwise 404
    """
    # Remove extension from filename
    stem = Path(filename).stem
    annotation_path = ANNOTATIONS_DIR / f"{stem}.json"

    if not annotation_path.exists():
        raise HTTPException(status_code=404, detail="Annotation not found")

    try:
        with open(annotation_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        return metadata
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading annotation: {str(e)}")


@app.post("/api/save")
async def save_annotation(annotation: Annotation):
    """
    Save annotation in both YOLO format (.txt) and JSON metadata (.json)
    YOLO format is only saved when status is 'done'
    """
    try:
        # Save YOLO format only if status is 'done'
        if annotation.status == "done":
            save_yolo_format(
                annotation.filename,
                annotation.boxes,
                annotation.image_width,
                annotation.image_height,
                ANNOTATIONS_DIR
            )

        # Save JSON metadata (always, includes status)
        save_json_metadata(
            annotation.filename,
            annotation.translated_text,
            annotation.boxes,
            annotation.image_width,
            annotation.image_height,
            ANNOTATIONS_DIR,
            annotation.status
        )

        return {"status": "success", "message": "Annotation saved successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving annotation: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
