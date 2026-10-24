#!/usr/bin/env python3
"""Create opaque App Store PNGs from the preserved native simulator captures.

The AppKit helper preserves each decoded RGB sample, removing only an entirely
opaque alpha channel. Raw screenshots stay unchanged. No screen is redrawn or resized.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import zlib


def validate_png(path: Path) -> tuple[int, int, int]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Not a PNG: {path}")
    offset = 8
    compressed = bytearray()
    ended = False
    while offset < len(data):
        length = struct.unpack(">I", data[offset:offset + 4])[0]
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + length]
        checksum = struct.unpack(">I", data[offset + 8 + length:offset + 12 + length])[0]
        if zlib.crc32(kind + payload) != checksum:
            raise ValueError(f"Invalid {kind!r} checksum: {path}")
        if kind == b"IDAT":
            compressed.extend(payload)
        if kind == b"IEND":
            ended = True
        offset += length + 12
    if not ended or offset != len(data):
        raise ValueError(f"Incomplete PNG: {path}")
    zlib.decompress(compressed)
    width, height = struct.unpack(">II", data[16:24])
    return width, height, data[25]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path, help="Folder containing a native screenshot manifest")
    args = parser.parse_args()
    manifest_path = args.directory / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    destination = args.directory / "Upload"
    destination.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="mental-arithmetic-opaque-") as temporary:
        converter = Path(temporary) / "OpaqueScreenshot"
        subprocess.run(["xcrun", "swiftc", str(Path(__file__).with_name("OpaqueScreenshot.swift")), "-o", str(converter)], check=True)
        for item in manifest["screenshots"]:
            convert_item(item, args.directory, destination, converter)
    manifest["uploadCopiesReadyForOwnerReview"] = True
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")


def convert_item(item: dict, directory: Path, destination: Path, converter: Path) -> None:
    source = directory / item["file"]
    expected = validate_png(source)
    target = destination / item["file"]
    target.unlink(missing_ok=True)
    result = subprocess.run([str(converter), str(source), str(target)],
                            text=True, capture_output=True, check=True)
    actual = validate_png(target)
    if actual[:2] != expected[:2] or actual[2] in (4, 6):
        raise ValueError(f"Dimensions changed or alpha remains: {target}")
    item["uploadFile"] = str(target.relative_to(directory))
    item["uploadSHA256"] = hashlib.sha256(target.read_bytes()).hexdigest()
    item["uploadHasAlphaChannel"] = False
    item["uploadNormalization"] = "AppKit PNG decode/encode; each RGB sample preserved; unused opaque alpha removed; no redraw or resizing"
    item["uploadValidation"] = "PNG chunk CRCs and decompression passed; dimensions preserved"
    print(f"Opaque App Store PNG: {target} ({actual[0]} × {actual[1]})", flush=True)

if __name__ == "__main__":
    main()
