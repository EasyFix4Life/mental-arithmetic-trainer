#!/usr/bin/env python3
"""Export this project's real XCUITest screenshots without redrawing them.

Usage: python3 ios/AppStore/export_screenshots.py result.xcresult destination
DEVELOPER_DIR may select the Xcode used to read the result bundle.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile


NAMES = (
    "01-random-example-catalog",
    "02-practice-active",
    "03-round-score-and-times",
    "04-confirmed-multiplication-carry",
    "05-confirmed-multiplication-final-answer",
    "06-local-privacy-policy",
    "07-three-digit-multiplication-final-answer",
    "08-three-digit-addition-final-answer",
    "09-practice-landscape-keyboard",
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("result_bundle", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    args.destination.mkdir(parents=True, exist_ok=True)
    records = []
    with tempfile.TemporaryDirectory(prefix="mental-arithmetic-screenshots-") as temporary:
        temporary_path = Path(temporary)
        subprocess.run([
            "xcrun", "xcresulttool", "export", "attachments",
            "--path", str(args.result_bundle.resolve()),
            "--output-path", temporary,
        ], check=True)
        tests = json.loads((temporary_path / "manifest.json").read_text())
        selected = {}
        for test in tests:
            for attachment in test.get("attachments", []):
                readable = attachment["suggestedHumanReadableName"]
                name = next((item for item in NAMES if item in readable), None)
                if name is None or attachment["isAssociatedWithFailure"]:
                    continue
                if name not in selected or attachment.get("timestamp", 0) > selected[name][1].get("timestamp", 0):
                    selected[name] = (test, attachment)
        for name, (test, attachment) in sorted(selected.items()):
            source = temporary_path / attachment["exportedFileName"]
            data = source.read_bytes()
            if data[:8] != b"\x89PNG\r\n\x1a\n":
                raise ValueError(f"Expected an unmodified PNG screenshot: {source}")
            width, height, depth, color_type = struct.unpack(">IIBB", data[16:26])
            target = args.destination / f"{name}.png"
            shutil.copyfile(source, target)
            records.append({
                "file": target.name,
                "testIdentifier": test["testIdentifier"],
                "deviceName": attachment["deviceName"],
                "deviceId": attachment["deviceId"],
                "timestamp": attachment.get("timestamp"),
                "width": width,
                "height": height,
                "bitDepth": depth,
                "pngColorType": color_type,
                "hasAlphaChannel": color_type in (4, 6),
                "sha256": hashlib.sha256(data).hexdigest(),
                "source": "XCUIScreen.main.screenshot() test attachment",
                "modified": False,
            })
    if not records:
        raise RuntimeError("The result bundle did not contain this project's successful screenshot attachments.")
    manifest = {
        "status": "local-simulator-review-assets-not-uploaded",
        "resultBundle": str(args.result_bundle.resolve()),
        "screenshots": records,
        "officialSpecifications": "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/",
        "publicationChecks": [
            "Review final instructional content and metadata",
            "Choose the desired actual app screens",
            "Verify required iPhone and 13-inch iPad dimensions",
            "Ensure screenshots have no alpha channel",
        ],
    }
    (args.destination / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"destination": str(args.destination.resolve()), "screenshots": len(records)}, indent=2))


if __name__ == "__main__":
    main()
