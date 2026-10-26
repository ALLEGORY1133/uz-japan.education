from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator

IMAGE_MAX_MB = 8
VIDEO_MAX_MB = 200


def validate_image_size(f):
    if f.size > IMAGE_MAX_MB * 1024 * 1024:
        raise ValidationError(f"Rasm hajmi {IMAGE_MAX_MB} MB dan oşmasligi kerak.")


def validate_video_size(f):
    if f.size > VIDEO_MAX_MB * 1024 * 1024:
        raise ValidationError(f"Video hajmi {VIDEO_MAX_MB} MB dan oşmasligi kerak.")


image_extensions = FileExtensionValidator(["jpg", "jpeg", "png", "webp", "avif"])
video_extensions = FileExtensionValidator(["mp4", "webm"])
# Galereya va slayder uchun: rasm ham, video ham
media_extensions = FileExtensionValidator(["jpg", "jpeg", "png", "webp", "avif", "mp4", "webm"])


def validate_media_size(f):
    name = f.name.lower()
    if name.endswith((".mp4", ".webm")):
        validate_video_size(f)
    else:
        validate_image_size(f)
