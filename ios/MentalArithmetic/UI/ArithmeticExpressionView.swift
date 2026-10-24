import UIKit

/// One native, accessible expression. Addition uses aligned vertical columns;
/// multiplication retains the owner's horizontal digit arrangement.
final class ArithmeticExpressionView: UIView {
    var fontSize: CGFloat
    private let stack = AppTheme.stack(spacing: 5)

    init(fontSize: CGFloat = 60, identifier: String? = nil) {
        self.fontSize = fontSize
        super.init(frame: .zero)
        accessibilityIdentifier = identifier
        accessibilityTraits = .staticText
        isAccessibilityElement = true
        translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: centerXAnchor),
            stack.leadingAnchor.constraint(greaterThanOrEqualTo: leadingAnchor),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: trailingAnchor),
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }

    required init?(coder: NSCoder) { fatalError("Use init(fontSize:identifier:)") }

    func configure(left: String, right: String, operation: ArithmeticOperation,
                   selected: [String] = [], result: String? = nil) {
        stack.arrangedSubviews.forEach { stack.removeArrangedSubview($0); $0.removeFromSuperview() }
        var selectedDescription = [String]()
        let spoken = "\(left) \(operation == .addition ? "plus" : "times") \(right)"
        if operation == .addition {
            stack.axis = .vertical
            stack.alignment = .trailing
            let first = operand(left, side: "left", selected: selected, descriptions: &selectedDescription)
            let second = operand(right, side: "right", selected: selected, descriptions: &selectedDescription)
            let secondRow = AppTheme.stack(axis: .horizontal, spacing: 12, alignment: .firstBaseline)
            let plus = AppTheme.label("+", size: fontSize)
            plus.isAccessibilityElement = false
            secondRow.addArrangedSubview(plus)
            secondRow.addArrangedSubview(second)
            stack.addArrangedSubview(first)
            stack.addArrangedSubview(secondRow)
            let rule = UIView()
            rule.translatesAutoresizingMaskIntoConstraints = false
            rule.backgroundColor = AppTheme.ink
            stack.addArrangedSubview(rule)
            NSLayoutConstraint.activate([
                rule.heightAnchor.constraint(equalToConstant: 2),
                rule.widthAnchor.constraint(equalTo: stack.widthAnchor)
            ])
            if let result {
                let answer = AppTheme.label(result, size: fontSize)
                answer.isAccessibilityElement = false
                stack.addArrangedSubview(answer)
            }
        } else {
            stack.axis = .horizontal
            stack.alignment = .center
            let text = "\(left) × \(right)" + (result.map { " = \($0)" } ?? "")
            let expression = AppTheme.label(text, size: fontSize)
            expression.isAccessibilityElement = false
            expression.numberOfLines = 1
            expression.adjustsFontSizeToFitWidth = true
            expression.minimumScaleFactor = 0.3
            let attributed = NSMutableAttributedString(string: text, attributes: [.font: AppTheme.font(fontSize), .foregroundColor: AppTheme.ink])
            for (side, operand, offset) in [("left", left, 0), ("right", right, left.count + 3)] {
                for (index, digit) in operand.enumerated() where selected.contains("\(side):\(index)") {
                    attributed.addAttributes(highlightAttributes, range: NSRange(location: offset + index, length: 1))
                    selectedDescription.append("\(side) operand, position \(index + 1), digit \(digit)")
                }
            }
            expression.attributedText = attributed
            stack.addArrangedSubview(expression)
        }
        accessibilityLabel = spoken + (result.map { " equals \($0)" } ?? "")
        if !selectedDescription.isEmpty {
            accessibilityLabel = (accessibilityLabel ?? spoken) + ". Selected digits: " + selectedDescription.joined(separator: "; ")
        }
        invalidateIntrinsicContentSize()
    }

    private var highlightAttributes: [NSAttributedString.Key: Any] {
        [.font: AppTheme.font(fontSize, bold: true), .backgroundColor: AppTheme.highlight,
         .underlineStyle: NSUnderlineStyle.single.rawValue]
    }

    private func operand(_ text: String, side: String, selected: [String], descriptions: inout [String]) -> UILabel {
        let label = AppTheme.label(text, size: fontSize)
        label.isAccessibilityElement = false
        label.numberOfLines = 1
        label.textAlignment = .right
        let value = NSMutableAttributedString(string: text, attributes: [.font: AppTheme.font(fontSize), .foregroundColor: AppTheme.ink])
        for (index, digit) in text.enumerated() where selected.contains("\(side):\(index)") {
            value.addAttributes(highlightAttributes, range: NSRange(location: index, length: 1))
            descriptions.append("\(side) operand, position \(index + 1), digit \(digit)")
        }
        label.attributedText = value
        return label
    }
}
