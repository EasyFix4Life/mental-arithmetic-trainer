import AppKit
import Foundation

// File-format conversion only. Preserve every decoded RGB sample and refuse
// genuinely transparent input instead of compositing or redrawing the app.
guard CommandLine.arguments.count == 3 else {
    fatalError("Usage: OpaqueScreenshot source.png destination.png")
}
let sourceURL = URL(fileURLWithPath: CommandLine.arguments[1])
let destinationURL = URL(fileURLWithPath: CommandLine.arguments[2])
guard let source = NSBitmapImageRep(data: try Data(contentsOf: sourceURL)),
      source.bitsPerSample == 8, !source.isPlanar,
      (3...4).contains(source.samplesPerPixel),
      let sourceData = source.bitmapData,
      let output = NSBitmapImageRep(bitmapDataPlanes: nil,
          pixelsWide: source.pixelsWide, pixelsHigh: source.pixelsHigh,
          bitsPerSample: 8, samplesPerPixel: 3, hasAlpha: false,
          isPlanar: false, colorSpaceName: source.colorSpaceName,
          bytesPerRow: source.pixelsWide * 3, bitsPerPixel: 24),
      let destinationData = output.bitmapData else {
    fatalError("Expected an 8-bit RGB/RGBA native screenshot")
}
let stride = source.bitsPerPixel / 8
let alphaFirst = source.hasAlpha && source.bitmapFormat.contains(.alphaFirst)
for y in 0..<source.pixelsHigh {
    for x in 0..<source.pixelsWide {
        let inputOffset = y * source.bytesPerRow + x * stride
        let outputOffset = y * output.bytesPerRow + x * 3
        if source.hasAlpha {
            let alpha = sourceData[inputOffset + (alphaFirst ? 0 : 3)]
            guard alpha == 255 else { fatalError("Screenshot contains non-opaque pixels; no automatic compositing is permitted") }
        }
        let colorOffset = inputOffset + (alphaFirst ? 1 : 0)
        for channel in 0..<3 { destinationData[outputOffset + channel] = sourceData[colorOffset + channel] }
    }
}
guard let encoded = output.representation(using: .png, properties: [:]) else {
    fatalError("Unable to encode opaque PNG")
}
try encoded.write(to: destinationURL, options: .atomic)
print("Preserved RGB pixels at \(source.pixelsWide) × \(source.pixelsHigh); removed unused alpha")
