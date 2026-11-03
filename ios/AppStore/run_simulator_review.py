#!/usr/bin/env python3
"""Run the DEBUG native integration harness and capture real simulator screens.

This does not use or replace XCUITest physical keyboard/accessibility automation.
The app's QA entry point is compiled out of Release. Only the specified local
simulator and the app's own container are touched.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import struct
import subprocess
import time


def command(*arguments: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["xcrun", "simctl", *arguments], text=True, capture_output=True, check=check)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--device", required=True, help="Owned simulator UDID")
    parser.add_argument("--app", required=True, type=Path, help="Built Debug-iphonesimulator .app")
    parser.add_argument("--bundle-id", default="local.jeff.mentalarithmetic")
    parser.add_argument("--output", required=True, type=Path, help="Real simulator PNG review assets")
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    devices = json.loads(command("list", "devices", "--json").stdout)["devices"]
    device = next(item for group in devices.values() for item in group if item["udid"] == args.device)
    if device["state"] != "Booted":
        command("boot", args.device)
    command("bootstatus", args.device, "-b")
    command("install", args.device, str(args.app.resolve()))
    container = Path(command("get_app_container", args.device, args.bundle_id, "data").stdout.strip())

    def scenario(name: str) -> dict:
        result_path = container / "Documents" / f"qa-{name}.json"
        result_path.unlink(missing_ok=True)
        environment = os.environ.copy()
        environment["SIMCTL_CHILD_MENTAL_ARITHMETIC_QA_SCENARIO"] = name
        subprocess.run(["xcrun", "simctl", "launch", "--terminate-running-process", args.device, args.bundle_id],
                       env=environment, check=True, capture_output=True, text=True)
        deadline = time.monotonic() + 35
        while not result_path.exists():
            if time.monotonic() > deadline:
                raise TimeoutError(f"No native report for {name}; container={container}")
            time.sleep(0.2)
        result = json.loads(result_path.read_text())
        if result["status"] != "passed":
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(json.dumps(result, indent=2) + "\n")
            raise RuntimeError(json.dumps(result, indent=2))
        return result

    report = scenario("suite")
    print(f"Native UIKit integration: {report['passed']}/{report['total']} passed, {report.get('skipped', 0)} skipped on {device['name']}", flush=True)
    screenshots = []
    for fixture, filename in [
        ("review-setup", "01-practice-setup"),
        ("review-practice", "02-practice-live-keyboard"),
        ("review-score", "03-score-and-round-times"),
        ("review-learn18", "04-confirmed-two-digit-carry"),
        ("review-learn1", "05-single-digit-multiplication"),
        ("review-addition-practice", "06-two-digit-addition-practice"),
        ("review-catalog", "07-learn-catalog"),
        ("review-privacy", "08-version-and-privacy"),
        ("review-inside82", "09-corrected-inside"),
        ("review-outside82", "10-corrected-outside"),
        ("review-carry-route", "11-static-carry-route"),
        ("review-practice-wrong", "12-monochrome-incorrect-feedback"),
        ("review-large-type", "13-enlarged-text"),
        ("review-carry13", "14-multidigit-carry"),
        ("review-large-practice", "15-enlarged-practice"),
        ("review-first82", "16-group-first"),
        ("review-last82", "17-group-last"),
        ("review-final82", "18-group-final-answer"),
        ("review-large-middle", "19-enlarged-middle-group"),
        ("review-large-final", "20-enlarged-final-box"),
    ]:
        native_result = scenario(fixture)
        target = args.output / f"{filename}.png"
        command("io", args.device, "screenshot", str(target.resolve()))
        data = target.read_bytes()
        width, height, depth, color_type = struct.unpack(">IIBB", data[16:26])
        screenshots.append({
            "file": target.name, "scenario": fixture,
            "width": width, "height": height, "bitDepth": depth,
            "pngColorType": color_type, "hasAlphaChannel": color_type in (4, 6),
            "sha256": hashlib.sha256(data).hexdigest(),
            "modified": False, "nativeReport": native_result,
        })
        print(f"Captured {filename}.png ({width} × {height})", flush=True)
    report["device"] = device
    report["screenshots"] = screenshots
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + "\n")
    manifest = {
        "status": "local-native-simulator-review-assets-not-uploaded",
        "device": device,
        "screenshots": screenshots,
        "source": "Actual native app running on the specified Simulator; simctl io screenshot",
        "fixtureSetup": "DEBUG-only native review harness; Release excludes this code",
        "officialSpecifications": "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/",
        "publicationChecks": ["Review final content and metadata", "Verify required device sizes", "Ensure no alpha channel", "Sign and submit through the owner's developer account"],
    }
    (args.output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
