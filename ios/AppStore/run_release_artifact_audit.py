#!/usr/bin/env python3
"""Test the packaged simulator Release app without changing its bundle.

An external simulator-only library drives the app's real UIKit controls and
text-field delegate. This is not physical keyboard or external XCUITest input.
The app executable's SHA-256 is checked before installation and after execution.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import subprocess
import tempfile
import time


def command(*arguments: str) -> str:
    result = subprocess.run(arguments, text=True, capture_output=True, check=True)
    return result.stdout.strip()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--device", required=True)
    parser.add_argument("--app", required=True, type=Path)
    parser.add_argument("--expected-version", required=True)
    parser.add_argument("--expected-build")
    parser.add_argument("--scope", choices=["full", "ampersand-header"], default="full")
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    info = plistlib.loads((args.app / "Info.plist").read_bytes())
    binary = args.app / info["CFBundleExecutable"]
    before = hashlib.sha256(binary.read_bytes()).hexdigest()
    devices = json.loads(command("xcrun", "simctl", "list", "devices", "--json"))["devices"]
    device = next(item for group in devices.values() for item in group if item["udid"] == args.device)
    if device["state"] != "Booted":
        command("xcrun", "simctl", "boot", args.device)
    command("xcrun", "simctl", "bootstatus", args.device, "-b")
    command("xcrun", "simctl", "install", args.device, str(args.app.resolve()))
    container = Path(command("xcrun", "simctl", "get_app_container", args.device, info["CFBundleIdentifier"], "data"))
    installed = Path(command("xcrun", "simctl", "get_app_container", args.device, info["CFBundleIdentifier"], "app"))
    result_path = container / "Documents/qa-release-artifact-audit.json"
    phase_path = container / "Documents/qa-release-artifact-audit-phase.json"
    result_path.unlink(missing_ok=True)
    phase_path.unlink(missing_ok=True)
    with tempfile.TemporaryDirectory(prefix="mental-arithmetic-release-audit-") as temporary:
        library = Path(temporary) / "ReleaseArtifactAudit.dylib"
        sdk = command("xcrun", "--sdk", "iphonesimulator", "--show-sdk-path")
        command("xcrun", "clang", "-dynamiclib", "-target", "arm64-apple-ios17.0-simulator", "-isysroot", sdk,
                "-fobjc-arc", "-framework", "UIKit", "-framework", "Foundation",
                "-framework", "CoreGraphics", "-framework", "QuartzCore",
                str(Path(__file__).with_name("ReleaseArtifactAudit.m")), "-o", str(library))
        environment = os.environ.copy()
        environment["SIMCTL_CHILD_DYLD_INSERT_LIBRARIES"] = str(library)
        environment["SIMCTL_CHILD_RELEASE_AUDIT_EXPECT_VERSION"] = args.expected_version
        environment["SIMCTL_CHILD_RELEASE_AUDIT_EXPECT_BUILD"] = args.expected_build or info["CFBundleVersion"]
        environment["SIMCTL_CHILD_RELEASE_AUDIT_SCOPE"] = args.scope
        launch = subprocess.run(["xcrun", "simctl", "launch", "--terminate-running-process", args.device,
                                 info["CFBundleIdentifier"]], env=environment, text=True, capture_output=True)
        if launch.returncode:
            raise RuntimeError(launch.stderr or launch.stdout)
        deadline = time.monotonic() + 50
        seen = set()
        while not result_path.exists():
            if time.monotonic() > deadline:
                raise TimeoutError(f"No external Release audit result at {result_path}")
            if phase_path.exists():
                phase = json.loads(phase_path.read_text())["phase"]
                if phase not in seen:
                    command("xcrun", "simctl", "io", args.device, "screenshot", str((args.output / f"{phase}.png").resolve()))
                    seen.add(phase)
            time.sleep(0.05)
        report = json.loads(result_path.read_text())
    report["device"] = device
    report["downloadedBinarySHA256"] = before
    report["installedBinarySHA256"] = hashlib.sha256((installed / info["CFBundleExecutable"]).read_bytes()).hexdigest()
    report["appBinaryUnchanged"] = hashlib.sha256(binary.read_bytes()).hexdigest() == before == report["installedBinarySHA256"]
    report["expectedVersion"] = args.expected_version
    report["expectedBuild"] = args.expected_build or info["CFBundleVersion"]
    report["requestedScope"] = args.scope
    report["sourceApp"] = str(args.app.resolve())
    args.report.write_text(json.dumps(report, indent=2) + "\n")
    if report["status"] != "passed" or not report["appBinaryUnchanged"]:
        raise RuntimeError(json.dumps(report, indent=2))
    command("xcrun", "simctl", "io", args.device, "screenshot", str((args.output / ("final.png" if args.scope == "ampersand-header" else "privacy.png")).resolve()))
    print(f"Packaged Release {report['version']} ({report['build']}): {report['passedChecks']} checks passed; executable unchanged", flush=True)


if __name__ == "__main__":
    main()
