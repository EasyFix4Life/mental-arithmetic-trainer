import UIKit

/// Visual grouping of the existing four named stages. Literal ampersands only connect the
/// controls; no additional mathematical operation or instructional step is made.
final class MultiplicationStageGroupView: UIStackView {
    let product = AppTheme.stack(spacing: 8)
    let middle = AppTheme.stack(spacing: 8)
    let result = AppTheme.stack(spacing: 8)

    init(buttons: [MultiplicationStage: UIButton], finalButton: UIButton?, wide: Bool, enlarged: Bool,
         middleStacked: Bool, productMinimum: CGFloat, resultMinimum: CGFloat, traits: UITraitCollection) {
        super.init(frame: .zero)
        axis = wide ? .horizontal : .vertical
        alignment = wide ? .center : .fill
        spacing = 12
        translatesAutoresizingMaskIntoConstraints = false
        accessibilityIdentifier = "multiplication-stage-group"
        product.axis = wide ? .horizontal : .vertical
        product.alignment = wide ? .center : .fill
        product.accessibilityIdentifier = "stage-product-group"
        product.isLayoutMarginsRelativeArrangement = true
        product.layoutMargins = UIEdgeInsets(top: 12, left: 12, bottom: 12, right: 12)
        product.layer.borderWidth = VisualTokens.controlBorder
        product.layer.borderColor = AppTheme.ink.cgColor
        product.layer.cornerRadius = VisualTokens.cornerRadius
        product.isAccessibilityElement = false
        product.accessibilityContainerType = .semanticGroup
        product.accessibilityLabel = "First, Inside plus Outside, Last"
        product.shouldGroupAccessibilityChildren = true

        middle.axis = middleStacked ? .vertical : .horizontal
        middle.alignment = middleStacked ? .fill : .center
        middle.accessibilityIdentifier = "stage-middle-group"
        middle.isLayoutMarginsRelativeArrangement = true
        middle.layoutMargins = UIEdgeInsets(top: 8, left: 8, bottom: 8, right: 8)
        middle.layer.borderWidth = VisualTokens.controlBorder
        middle.layer.borderColor = VisualTokens.inside.cgColor
        middle.layer.cornerRadius = VisualTokens.cornerRadius
        middle.isAccessibilityElement = false
        middle.accessibilityContainerType = .semanticGroup
        middle.accessibilityLabel = "Inside plus Outside"
        middle.shouldGroupAccessibilityChildren = true
        if let first = buttons[.first] { product.addArrangedSubview(first) }
        product.addArrangedSubview(connection("&", identifier: "stage-connection-first", traits: traits))
        if let inside = buttons[.inside] { middle.addArrangedSubview(inside) }
        let plus = AppTheme.label("+", size: 22, bold: true, identifier: "stage-middle-plus", mathematics: true)
        plus.font = AppTheme.mathFont(22, bold: true, compatibleWith: traits)
        plus.widthAnchor.constraint(greaterThanOrEqualToConstant: ceil(("+" as NSString).size(withAttributes: [.font: plus.font!]).width)).isActive = true
        plus.textAlignment = .center
        plus.textColor = VisualTokens.inside
        plus.isAccessibilityElement = false
        // Decorative labels must be allowed to stretch in stacked layouts;
        // required horizontal hugging would force the whole lesson to shrink.
        plus.setContentHuggingPriority(.defaultHigh, for: .horizontal)
        middle.addArrangedSubview(plus)
        if let outside = buttons[.outside] { middle.addArrangedSubview(outside) }
        product.addArrangedSubview(middle)
        product.addArrangedSubview(connection("&", identifier: "stage-connection-last", traits: traits))
        if let last = buttons[.last] { product.addArrangedSubview(last) }
        addArrangedSubview(product)
        if wide { product.widthAnchor.constraint(greaterThanOrEqualToConstant: productMinimum).isActive = true }

        if let finalButton {
            result.axis = enlarged ? .vertical : .horizontal
            result.alignment = .fill
            let equals = AppTheme.label("=", size: 28, identifier: "stage-equals", mathematics: true)
            equals.font = AppTheme.mathFont(28, compatibleWith: traits)
            equals.widthAnchor.constraint(greaterThanOrEqualToConstant: ceil(("=" as NSString).size(withAttributes: [.font: equals.font!]).width)).isActive = true
            equals.textAlignment = .center
            equals.isAccessibilityElement = false
            equals.setContentHuggingPriority(.defaultHigh, for: .horizontal)
            result.addArrangedSubview(equals)
            result.addArrangedSubview(finalButton)
            addArrangedSubview(result)
            if wide { result.widthAnchor.constraint(greaterThanOrEqualToConstant: resultMinimum).isActive = true }
        }
        if let first = buttons[.first], let last = buttons[.last] {
            product.accessibilityElements = [first, middle, last]
        }
        if let inside = buttons[.inside], let outside = buttons[.outside] {
            middle.accessibilityElements = [inside, outside]
        }
        accessibilityElements = finalButton.map { [product, $0] } ?? [product]
    }

    required init(coder: NSCoder) { fatalError("Use init(buttons:finalButton:wide:enlarged:)") }

    private func connection(_ glyph: String, identifier: String, traits: UITraitCollection) -> UILabel {
        let label = AppTheme.label(glyph, size: 20, identifier: identifier, mathematics: true)
        label.font = AppTheme.mathFont(20, compatibleWith: traits)
        label.widthAnchor.constraint(greaterThanOrEqualToConstant: ceil((glyph as NSString).size(withAttributes: [.font: label.font!]).width)).isActive = true
        label.textAlignment = .center
        label.isAccessibilityElement = false
        label.setContentHuggingPriority(.defaultHigh, for: .horizontal)
        return label
    }
}
