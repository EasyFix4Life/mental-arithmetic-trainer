import UIKit

/// Native Arial mathematics. Existing digit references drive selection and the
/// optional static connector; the view never infers an instructional algorithm.
final class ArithmeticExpressionView: UIView {
    var fontSize: CGFloat
    private let stack = AppTheme.stack(spacing: 5)
    private let connector = UIView()
    private let connectorStroke = CAShapeLayer()
    private let columnStroke = CAShapeLayer()
    private var equation: UILabel?
    private var operandLabels = [String: UILabel]()
    private var pairingRefs = [String]()
    private var displayText = ""
    private var leftOperand = ""
    private var rightOperand = ""
    private var currentOperation = ArithmeticOperation.multiplication
    private var selectionColor = AppTheme.ink
    private var configuration: (String, String, ArithmeticOperation, [String], String?, UIColor?, Bool)?

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
            stack.leadingAnchor.constraint(greaterThanOrEqualTo: leadingAnchor, constant: 8),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: trailingAnchor, constant: -8),
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
        connector.accessibilityIdentifier = "pair-connector"
        connector.isAccessibilityElement = false
        connector.translatesAutoresizingMaskIntoConstraints = false
        connector.layer.addSublayer(connectorStroke)
        connectorStroke.fillColor = UIColor.clear.cgColor
        connectorStroke.lineWidth = VisualTokens.emphasisBorder
        layer.addSublayer(columnStroke)
        columnStroke.fillColor = UIColor.clear.cgColor
        columnStroke.lineWidth = VisualTokens.emphasisBorder
    }

    required init?(coder: NSCoder) { fatalError("Use init(fontSize:identifier:)") }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        if previousTraitCollection?.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory,
           let c = configuration {
            configure(left: c.0, right: c.1, operation: c.2, selected: c.3, result: c.4, accent: c.5, connectPair: c.6)
        }
    }

    func configure(left: String, right: String, operation: ArithmeticOperation,
                   selected: [String] = [], result: String? = nil,
                   accent: UIColor? = nil, connectPair: Bool = false) {
        configuration = (left, right, operation, selected, result, accent, connectPair)
        stack.arrangedSubviews.forEach { stack.removeArrangedSubview($0); $0.removeFromSuperview() }
        equation = nil; operandLabels = [:]
        leftOperand = left; rightOperand = right; currentOperation = operation
        selectionColor = accent ?? AppTheme.ink
        pairingRefs = connectPair && selected.count == 2 ? selected : []
        var selectedDescription = [String]()
        let spoken = "\(left) \(operation == .addition ? "plus" : "times") \(right)"
        stack.axis = .vertical
        if operation == .addition {
            stack.alignment = .trailing
            let first = operand(left, side: "left", selected: selected, descriptions: &selectedDescription)
            let second = operand(right, side: "right", selected: selected, descriptions: &selectedDescription)
            let secondRow = AppTheme.stack(axis: .horizontal, spacing: 12, alignment: .firstBaseline)
            let plus = AppTheme.label("+", size: fontSize, mathematics: true)
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
                rule.heightAnchor.constraint(equalToConstant: VisualTokens.controlBorder),
                rule.widthAnchor.constraint(equalTo: stack.widthAnchor)
            ])
            if let result {
                let answer = AppTheme.label(result, size: fontSize, mathematics: true)
                answer.isAccessibilityElement = false
                stack.addArrangedSubview(answer)
            }
        } else {
            stack.alignment = .fill
            let text = "\(left) × \(right)" + (result.map { " = \($0)" } ?? "")
            displayText = text
            let expression = AppTheme.label(text, size: fontSize, mathematics: true)
            expression.isAccessibilityElement = false
            expression.numberOfLines = 1
            expression.textAlignment = .center
            expression.adjustsFontSizeToFitWidth = true
            expression.minimumScaleFactor = 0.3
            let attributed = NSMutableAttributedString(string: text, attributes: [.font: AppTheme.mathFont(fontSize, compatibleWith: traitCollection), .foregroundColor: AppTheme.ink])
            for (side, operand, offset) in [("left", left, 0), ("right", right, left.count + 3)] {
                for (index, digit) in operand.enumerated() where selected.contains("\(side):\(index)") {
                    attributed.addAttributes(highlightAttributes, range: NSRange(location: offset + index, length: 1))
                    selectedDescription.append("\(side) operand, position \(index + 1), digit \(digit)")
                }
            }
            expression.attributedText = attributed
            equation = expression
            stack.addArrangedSubview(expression)
        }
        if !pairingRefs.isEmpty {
            stack.addArrangedSubview(connector)
            connector.heightAnchor.constraint(equalToConstant: 16).isActive = true
            connector.widthAnchor.constraint(equalTo: stack.widthAnchor).isActive = true
        }
        connectorStroke.strokeColor = selectionColor.cgColor
        columnStroke.strokeColor = selectionColor.cgColor
        accessibilityLabel = spoken + (result.map { " equals \($0)" } ?? "")
        if !selectedDescription.isEmpty {
            accessibilityLabel = (accessibilityLabel ?? spoken) + ". Selected digits: " + selectedDescription.joined(separator: "; ")
        }
        invalidateIntrinsicContentSize()
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // UIStackView resolves its arranged descendants after the containing
        // view. Resolve those frames before drawing the static glyph connector.
        stack.layoutIfNeeded()
        connectorStroke.frame = connector.bounds
        columnStroke.frame = bounds
        columnStroke.path = nil
        guard pairingRefs.count == 2 else { connectorStroke.path = nil; return }
        let path = UIBezierPath()
        if currentOperation == .multiplication, let label = equation {
            let font = label.font ?? AppTheme.mathFont(fontSize, compatibleWith: traitCollection)
            let fullWidth = (displayText as NSString).size(withAttributes: [.font: font]).width
            let scale = min(1, label.bounds.width / max(1, fullWidth))
            let origin = label.convert(CGPoint(x: max(0, (label.bounds.width - fullWidth * scale) / 2), y: 0), to: connector).x
            let centers = pairingRefs.compactMap { ref -> CGFloat? in
                let parts = ref.split(separator: ":")
                guard parts.count == 2, let index = Int(parts[1]) else { return nil }
                let offset = parts[0] == "left" ? index : leftOperand.count + 3 + index
                guard offset < displayText.count else { return nil }
                let prefix = String(displayText.prefix(offset))
                let digit = String(displayText.dropFirst(offset).prefix(1))
                return origin + ((prefix as NSString).size(withAttributes: [.font: font]).width
                    + (digit as NSString).size(withAttributes: [.font: font]).width / 2) * scale
            }.sorted()
            if centers.count == 2 {
                path.move(to: CGPoint(x: centers[0], y: 0)); path.addLine(to: CGPoint(x: centers[0], y: 10))
                path.addLine(to: CGPoint(x: centers[1], y: 10)); path.addLine(to: CGPoint(x: centers[1], y: 0))
            }
        } else if currentOperation == .addition {
            // Place-aligned column bracket beside the actual selected glyphs.
            // No new arithmetic term or named instructional stage is inferred.
            let points = pairingRefs.compactMap { ref -> CGPoint? in
                let parts = ref.split(separator: ":")
                guard parts.count == 2, let index = Int(parts[1]),
                      let label = operandLabels[String(parts[0])], let text = label.text else { return nil }
                let font = label.font ?? AppTheme.mathFont(fontSize, compatibleWith: traitCollection)
                let width = (text as NSString).size(withAttributes: [.font: font]).width
                let scale = min(1, label.bounds.width / max(1, width))
                let prefix = (String(text.prefix(index)) as NSString).size(withAttributes: [.font: font]).width * scale
                return label.convert(CGPoint(x: max(0, label.bounds.width - width * scale) + prefix - 4,
                                             y: label.bounds.midY), to: self)
            }.sorted { $0.y < $1.y }
            if points.count == 2 {
                let column = UIBezierPath()
                column.move(to: CGPoint(x: points[0].x + 3, y: points[0].y)); column.addLine(to: points[0])
                column.addLine(to: points[1]); column.addLine(to: CGPoint(x: points[1].x + 3, y: points[1].y))
                columnStroke.path = column.cgPath
            }
        }
        CATransaction.begin(); CATransaction.setDisableActions(true)
        connectorStroke.path = path.cgPath
        CATransaction.commit()
    }

    private var highlightAttributes: [NSAttributedString.Key: Any] {
        [.font: AppTheme.mathFont(fontSize, bold: true, compatibleWith: traitCollection), .foregroundColor: selectionColor,
         .underlineStyle: NSUnderlineStyle.single.rawValue]
    }

    private func operand(_ text: String, side: String, selected: [String], descriptions: inout [String]) -> UILabel {
        let label = AppTheme.label(text, size: fontSize, mathematics: true)
        label.isAccessibilityElement = false
        label.numberOfLines = 1
        label.textAlignment = .right
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.3
        let value = NSMutableAttributedString(string: text, attributes: [.font: AppTheme.mathFont(fontSize, compatibleWith: traitCollection), .foregroundColor: AppTheme.ink])
        for (index, digit) in text.enumerated() where selected.contains("\(side):\(index)") {
            value.addAttributes(highlightAttributes, range: NSRange(location: index, length: 1))
            descriptions.append("\(side) operand, position \(index + 1), digit \(digit)")
        }
        label.attributedText = value
        operandLabels[side] = label
        return label
    }
}
