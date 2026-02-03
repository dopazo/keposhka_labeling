#!/usr/bin/env python3
"""
Validate YOLO Labels Script

This script reads YOLO annotation files (.txt) and their corresponding images,
draws blue rectangles on the images based on the bounding box coordinates,
and saves the annotated images to a validation folder.

Usage:
    cd backend
    uv run python validate_labels.py

The script will:
1. Read all .txt files from data/annotations/
2. Find the corresponding image in data/images/
3. Draw blue rectangles based on YOLO coordinates
4. Save the result to data/validated/
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# Directories
DATA_DIR = Path(__file__).parent / "data"
IMAGES_DIR = DATA_DIR / "images"
ANNOTATIONS_DIR = DATA_DIR / "annotations"
VALIDATED_DIR = DATA_DIR / "validated"

# Keposhka alphabet (same as utils.py)
KEPOSHKA_ALPHABET = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'a', 'B', 'b', 'C', 'c', 'CH', 'ch',
    'D', 'd', 'E', 'e', 'F', 'f', 'G', 'g', 'GH', 'gh',
    'H', 'h', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l',
    'M', 'm', 'N', 'n', 'O', 'o', 'P', 'p', 'Q', 'q',
    'R', 'r', 'S', 's', 'SH', 'sh', 'T', 't', 'TH', 'th',
    'U', 'u', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y',
    'Z', 'z'
]


def class_id_to_label(class_id: int) -> str:
    """Convert YOLO class ID to label"""
    if 0 <= class_id < len(KEPOSHKA_ALPHABET):
        return KEPOSHKA_ALPHABET[class_id]
    return "?"


def find_image_for_annotation(stem: str) -> Path | None:
    """Find the image file that matches the annotation stem"""
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif']

    for ext in image_extensions:
        img_path = IMAGES_DIR / f"{stem}{ext}"
        if img_path.exists():
            return img_path
        # Try uppercase extension
        img_path = IMAGES_DIR / f"{stem}{ext.upper()}"
        if img_path.exists():
            return img_path

    return None


def parse_yolo_line(line: str) -> tuple[int, float, float, float, float] | None:
    """
    Parse a YOLO annotation line.
    Returns (class_id, x_center, y_center, width, height) all normalized.
    """
    parts = line.strip().split()
    if len(parts) != 5:
        return None

    try:
        class_id = int(parts[0])
        x_center = float(parts[1])
        y_center = float(parts[2])
        width = float(parts[3])
        height = float(parts[4])
        return (class_id, x_center, y_center, width, height)
    except ValueError:
        return None


def draw_boxes_on_image(image_path: Path, annotation_path: Path, output_path: Path) -> bool:
    """
    Draw blue rectangles on the image based on YOLO annotations.
    Returns True if successful, False otherwise.
    """
    try:
        # Open image
        img = Image.open(image_path)
        img_width, img_height = img.size

        # Convert to RGB if necessary (for PNG with transparency)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        draw = ImageDraw.Draw(img)

        # Try to load a font for labels, fall back to default
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
        except (OSError, IOError):
            font = ImageFont.load_default()

        # Read annotations
        with open(annotation_path, 'r') as f:
            lines = f.readlines()

        box_count = 0
        for line in lines:
            parsed = parse_yolo_line(line)
            if parsed is None:
                continue

            class_id, x_center_norm, y_center_norm, width_norm, height_norm = parsed

            # Convert normalized coordinates to pixel coordinates
            x_center = x_center_norm * img_width
            y_center = y_center_norm * img_height
            box_width = width_norm * img_width
            box_height = height_norm * img_height

            # Calculate corners
            x1 = x_center - box_width / 2
            y1 = y_center - box_height / 2
            x2 = x_center + box_width / 2
            y2 = y_center + box_height / 2

            # Draw blue rectangle (outline)
            blue_color = (0, 100, 255)  # RGB blue
            draw.rectangle([x1, y1, x2, y2], outline=blue_color, width=2)

            # Draw label text above the box
            label = class_id_to_label(class_id)

            # Draw text background for better visibility
            text_bbox = draw.textbbox((x1, y1 - 18), label, font=font)
            draw.rectangle(text_bbox, fill=blue_color)
            draw.text((x1, y1 - 18), label, fill=(255, 255, 255), font=font)

            box_count += 1

        # Save the annotated image
        img.save(output_path, quality=95)

        return True, box_count

    except Exception as e:
        print(f"  Error processing {image_path.name}: {e}")
        return False, 0


def main():
    """Main function to validate all labeled images"""
    print("=" * 60)
    print("Keposhka Label Validator")
    print("=" * 60)

    # Ensure directories exist
    if not IMAGES_DIR.exists():
        print(f"\nError: Images directory not found: {IMAGES_DIR}")
        print("Make sure to place your images in backend/data/images/")
        sys.exit(1)

    if not ANNOTATIONS_DIR.exists():
        print(f"\nError: Annotations directory not found: {ANNOTATIONS_DIR}")
        print("No annotations to validate yet.")
        sys.exit(1)

    # Create validated directory
    VALIDATED_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nOutput folder: {VALIDATED_DIR}")

    # Find all .txt annotation files
    txt_files = list(ANNOTATIONS_DIR.glob("*.txt"))

    # Exclude classes.txt
    txt_files = [f for f in txt_files if f.name != "classes.txt"]

    if not txt_files:
        print("\nNo annotation files (.txt) found to validate.")
        print("Label some images first using the web application.")
        sys.exit(0)

    print(f"\nFound {len(txt_files)} annotation file(s) to validate.\n")

    success_count = 0
    error_count = 0
    total_boxes = 0

    for txt_path in sorted(txt_files):
        stem = txt_path.stem

        # Find corresponding image
        img_path = find_image_for_annotation(stem)

        if img_path is None:
            print(f"[SKIP] {stem}.txt - No matching image found")
            error_count += 1
            continue

        # Output path
        output_path = VALIDATED_DIR / f"{stem}_validated.png"

        # Draw boxes and save
        success, box_count = draw_boxes_on_image(img_path, txt_path, output_path)

        if success:
            print(f"[OK]   {stem} - {box_count} boxes drawn")
            success_count += 1
            total_boxes += box_count
        else:
            error_count += 1

    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"  Processed: {success_count} image(s)")
    print(f"  Errors:    {error_count}")
    print(f"  Total boxes drawn: {total_boxes}")
    print(f"\nValidated images saved to: {VALIDATED_DIR}")
    print("\nOpen the validated images to verify the bounding boxes are correct.")


if __name__ == "__main__":
    main()
