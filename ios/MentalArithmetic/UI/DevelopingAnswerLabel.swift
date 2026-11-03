import UIKit

/// Equal-width Arial places render only the provided developing-answer string.
/// Empty squares remain empty boxes; no digit or place-value is calculated here.
final class DevelopingAnswerLabel: UILabel {
    override var intrinsicContentSize: CGSize {
        let face = font ?? AppTheme.mathFont(28)
        let cell = max(("0" as NSString).size(withAttributes: [.font: face]).width + 12, 32)
        return CGSize(width: cell * CGFloat(text?.count ?? 0), height: face.lineHeight + 16)
    }

    override func drawText(in rect: CGRect) {
        guard let text, !text.isEmpty else { return }
        let face = font ?? AppTheme.mathFont(28)
        let cell = min(rect.width / CGFloat(text.count), max(("0" as NSString).size(withAttributes: [.font: face]).width + 12, 32))
        let start = max(0, rect.width - cell * CGFloat(text.count))
        for (index, digit) in text.enumerated() {
            let box = CGRect(x: start + CGFloat(index) * cell, y: 1, width: cell, height: rect.height - 2).insetBy(dx: 1, dy: 1)
            AppTheme.ink.setStroke()
            let path = UIBezierPath(rect: box)
            path.lineWidth = VisualTokens.controlBorder
            path.stroke()
            if digit != "□" {
                let glyph = String(digit) as NSString
                let size = glyph.size(withAttributes: [.font: face])
                glyph.draw(at: CGPoint(x: box.midX - size.width / 2, y: box.midY - size.height / 2),
                           withAttributes: [.font: face, .foregroundColor: AppTheme.ink])
            }
        }
    }
}
