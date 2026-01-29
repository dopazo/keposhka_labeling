"""
Utility functions for saving YOLO and JSON files
"""
import json
from pathlib import Path
from typing import List

from schemas import Box


# Keposhka alphabet (70 characters, index = YOLO class)
KEPOSHKA_ALPHABET = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',  # 0-9
    'A', 'a', 'B', 'b', 'C', 'c', 'CH', 'ch',          # 10-17
    'D', 'd', 'E', 'e', 'F', 'f', 'G', 'g', 'GH', 'gh', # 18-27
    'H', 'h', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l',  # 28-37
    'M', 'm', 'N', 'n', 'O', 'o', 'P', 'p', 'Q', 'q',  # 38-47
    'R', 'r', 'S', 's', 'SH', 'sh', 'T', 't', 'TH', 'th', # 48-57
    'U', 'u', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y',  # 58-67
    'Z', 'z'                                            # 68-69
]


def label_to_class_id(label: str) -> int:
    """Convert label to YOLO class ID"""
    try:
        return KEPOSHKA_ALPHABET.index(label)
    except ValueError:
        raise ValueError(f"Invalid label: {label}")


def save_yolo_format(
    filename: str,
    boxes: List[Box],
    image_width: int,
    image_height: int,
    output_dir: Path
) -> None:
    """
    Save annotations in YOLO format (.txt)
    Format: class x_center_norm y_center_norm width_norm height_norm
    """
    output_path = output_dir / f"{Path(filename).stem}.txt"

    with open(output_path, 'w') as f:
        for box in boxes:
            # Convert to YOLO class
            class_id = label_to_class_id(box.label)

            # Convert pixel coords to normalized (0-1)
            x_center_norm = (box.x + box.w / 2) / image_width
            y_center_norm = (box.y + box.h / 2) / image_height
            width_norm = box.w / image_width
            height_norm = box.h / image_height

            # Write YOLO line
            f.write(f"{class_id} {x_center_norm:.6f} {y_center_norm:.6f} {width_norm:.6f} {height_norm:.6f}\n")


def save_json_metadata(
    filename: str,
    translated_text: str,
    boxes: List[Box],
    image_width: int,
    image_height: int,
    output_dir: Path
) -> None:
    """
    Save full metadata in JSON format for re-editing
    """
    output_path = output_dir / f"{Path(filename).stem}.json"

    metadata = {
        "filename": filename,
        "translatedText": translated_text,
        "imageWidth": image_width,
        "imageHeight": image_height,
        "boxes": [
            {
                "id": box.id,
                "x": box.x,
                "y": box.y,
                "width": box.w,
                "height": box.h,
                "charCount": box.char_count,
                "label": box.label
            }
            for box in boxes
        ]
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)


def generate_classes_file(output_dir: Path) -> None:
    """
    Generate classes.txt file with all Keposhka characters
    """
    classes_path = output_dir / "classes.txt"

    with open(classes_path, 'w', encoding='utf-8') as f:
        for char in KEPOSHKA_ALPHABET:
            f.write(f"{char}\n")
