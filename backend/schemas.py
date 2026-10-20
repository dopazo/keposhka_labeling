"""
Pydantic models for Keposhka Labeler API
"""
from pydantic import BaseModel


class Box(BaseModel):
    """Bounding box model"""
    id: str
    label: str
    char_count: int
    x: float
    y: float
    w: float
    h: float


class Annotation(BaseModel):
    """Annotation payload for saving"""
    filename: str
    image_width: int
    image_height: int
    translated_text: str
    boxes: list[Box]
    status: str = "done"  # 'pending' or 'done'


class ImageInfo(BaseModel):
    """Image metadata for listing"""
    filename: str
    width: int
    height: int
    status: str  # 'pending' or 'done'
    has_text: bool = False  # True if a translation was already saved (even as draft)
