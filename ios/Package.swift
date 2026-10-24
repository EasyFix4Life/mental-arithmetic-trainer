// swift-tools-version: 6.0
import PackageDescription

// Portable verification of the exact Foundation-only app core. UIKit is built
// separately by MentalArithmetic.xcodeproj for iPhone and iPad.
let package = Package(
    name: "MentalArithmeticCoreVerification",
    platforms: [.macOS(.v13), .iOS(.v17)],
    products: [.library(name: "MentalArithmetic", targets: ["MentalArithmetic"])],
    targets: [
        .target(name: "MentalArithmetic", path: "MentalArithmetic/Core"),
        .testTarget(name: "MentalArithmeticTests", dependencies: ["MentalArithmetic"], path: "MentalArithmeticTests")
    ],
    swiftLanguageModes: [.v5]
)
