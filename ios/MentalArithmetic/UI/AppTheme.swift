import UIKit

/// Keep native segmented semantics while preventing the system's automatic
/// pill radius from replacing this preview's shared four-point geometry.
final class ScholarlySegmentedControl: UISegmentedControl {
    override func layoutSubviews() {
        super.layoutSubviews()
        layer.cornerRadius = VisualTokens.cornerRadius
        layer.borderWidth = VisualTokens.controlBorder
        layer.borderColor = AppTheme.ink.cgColor
        clipsToBounds = true
    }
}

@MainActor
enum AppTheme {
    static let background = VisualTokens.paper
    static let ink = VisualTokens.ink
    static let border = VisualTokens.ink
    static let highlight = VisualTokens.field
    static let incorrect = VisualTokens.ink

    nonisolated static func font(_ size: CGFloat, bold: Bool = false) -> UIFont {
        let name = bold ? "Baskerville-Bold" : VisualTokens.textFontName
        let descriptor = UIFont.systemFont(ofSize: size, weight: bold ? .bold : .regular).fontDescriptor.withDesign(.serif)!
        let base = UIFont(name: name, size: size) ?? UIFont(descriptor: descriptor, size: size)
        return UIFontMetrics(forTextStyle: .body).scaledFont(for: base)
    }

    nonisolated static func mathFont(_ size: CGFloat, bold: Bool = false,
                                     compatibleWith traits: UITraitCollection? = nil,
                                     maximumPointSize: CGFloat? = nil) -> UIFont {
        let base = UIFont(name: bold ? "Arial-BoldMT" : VisualTokens.mathFontName, size: size)
            ?? UIFont.systemFont(ofSize: size, weight: bold ? .bold : .regular)
        if let maximumPointSize { return UIFontMetrics(forTextStyle: .body).scaledFont(for: base, maximumPointSize: maximumPointSize, compatibleWith: traits) }
        return UIFontMetrics(forTextStyle: .body).scaledFont(for: base, compatibleWith: traits)
    }

    static func accent(for stage: MultiplicationStage?) -> UIColor {
        switch stage {
        case .first: VisualTokens.first
        case .inside: VisualTokens.inside
        case .outside: VisualTokens.outside
        case .last: VisualTokens.last
        case nil: ink
        }
    }

    static func label(_ text: String = "", size: CGFloat = 18, bold: Bool = false,
                      identifier: String? = nil, mathematics: Bool = false) -> UILabel {
        let label = UILabel()
        label.text = text
        label.font = mathematics ? mathFont(size, bold: bold) : font(size, bold: bold)
        label.textColor = ink
        label.numberOfLines = 0
        label.accessibilityIdentifier = identifier
        label.adjustsFontForContentSizeCategory = true
        label.translatesAutoresizingMaskIntoConstraints = false
        if !mathematics, !text.isEmpty {
            let styled = NSMutableAttributedString(string: text, attributes: [.font: font(size, bold: bold)])
            let pattern = #"[0-9□]+(?:\s*[+×=−]\s*[0-9□]+)*"#
            if let regex = try? NSRegularExpression(pattern: pattern) {
                for match in regex.matches(in: text, range: NSRange(text.startIndex..., in: text)) {
                    styled.addAttribute(.font, value: mathFont(size, bold: bold), range: match.range)
                }
            }
            label.attributedText = styled
        }
        return label
    }

    static func button(_ title: String, identifier: String? = nil,
                       action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system)
        var configuration = UIButton.Configuration.plain()
        configuration.title = title
        configuration.cornerStyle = .fixed
        configuration.background.cornerRadius = VisualTokens.cornerRadius
        configuration.background.backgroundColor = VisualTokens.field
        configuration.baseForegroundColor = ink
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16)
        configuration.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var attributes = incoming
            attributes.font = font(18)
            return attributes
        }
        button.configuration = configuration
        button.backgroundColor = VisualTokens.field
        button.layer.borderColor = border.cgColor
        button.layer.borderWidth = VisualTokens.controlBorder
        button.layer.cornerRadius = VisualTokens.cornerRadius
        button.titleLabel?.numberOfLines = 0
        button.titleLabel?.lineBreakMode = .byWordWrapping
        button.titleLabel?.adjustsFontForContentSizeCategory = true
        button.accessibilityIdentifier = identifier
        button.translatesAutoresizingMaskIntoConstraints = false
        button.heightAnchor.constraint(greaterThanOrEqualToConstant: VisualTokens.minimumTarget).isActive = true
        button.addAction(UIAction { _ in action() }, for: .touchUpInside)
        return button
    }

    static func stack(axis: NSLayoutConstraint.Axis = .vertical, spacing: CGFloat = 16,
                      alignment: UIStackView.Alignment = .fill) -> UIStackView {
        let stack = UIStackView()
        stack.axis = axis
        stack.spacing = spacing
        stack.alignment = alignment
        stack.translatesAutoresizingMaskIntoConstraints = false
        return stack
    }

    static func selected(_ selected: Bool, button: UIButton, accent: UIColor? = nil) {
        let color = accent ?? ink
        button.isSelected = selected
        button.layer.borderColor = color.cgColor
        button.layer.borderWidth = selected ? VisualTokens.emphasisBorder : VisualTokens.controlBorder
        button.backgroundColor = VisualTokens.field
        button.configuration?.baseForegroundColor = color
        button.configuration?.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var attributes = incoming
            attributes.foregroundColor = color
            attributes.font = font(16, bold: selected)
            attributes.underlineStyle = selected ? .single : []
            return attributes
        }
        button.accessibilityTraits = selected ? [.button, .selected] : .button
    }

    static func stageFill(for stage: MultiplicationStage) -> UIColor {
        switch stage {
        case .first: VisualTokens.firstFill
        case .inside: VisualTokens.insideFill
        case .outside: VisualTokens.outsideFill
        case .last: VisualTokens.lastFill
        }
    }

    /// The four stage controls share weight, geometry and light fill strength.
    /// Selection adds an underline/trait, never a different weight or border.
    static func namedStage(_ stage: MultiplicationStage, current: Bool, button: UIButton, traits: UITraitCollection? = nil) {
        let color = accent(for: stage)
        let fill = stageFill(for: stage)
        button.isSelected = current
        button.layer.borderColor = color.cgColor
        button.layer.borderWidth = VisualTokens.emphasisBorder
        button.layer.cornerRadius = VisualTokens.cornerRadius
        button.backgroundColor = fill
        button.configuration?.background.backgroundColor = fill
        button.configuration?.background.backgroundColorTransformer = UIConfigurationColorTransformer { _ in fill }
        button.configuration?.contentInsets = NSDirectionalEdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16)
        button.configuration?.baseForegroundColor = color
        button.configuration?.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var attributes = incoming
            attributes.foregroundColor = color
            attributes.font = font(16, bold: true)
            attributes.underlineStyle = current ? .single : []
            return attributes
        }
        button.accessibilityTraits = current ? [.button, .selected] : .button
        let baseFace = UIFont(name: "Baskerville-Bold", size: 16) ?? UIFont.boldSystemFont(ofSize: 16)
        let readableFace = UIFontMetrics(forTextStyle: .body).scaledFont(for: baseFace, compatibleWith: traits)
        let readableWidth = (stage.rawValue as NSString).size(withAttributes: [.font: readableFace]).width + 32
        button.widthAnchor.constraint(greaterThanOrEqualToConstant: ceil(readableWidth)).isActive = true
    }

    static func finalAnswer(_ answer: String, current: Bool, button: UIButton) {
        let caption = "Final Answer: " + answer
        let styled = NSMutableAttributedString(string: caption, attributes: [.font: font(16, bold: true), .foregroundColor: ink])
        if let range = caption.range(of: answer, options: .backwards) {
            styled.addAttribute(.font, value: mathFont(16, bold: true), range: NSRange(range, in: caption))
        }
        if current { styled.addAttribute(.underlineStyle, value: NSUnderlineStyle.single.rawValue, range: NSRange(location: 0, length: styled.length)) }
        button.isSelected = current
        button.configuration?.titleTextAttributesTransformer = nil
        button.configuration?.attributedTitle = AttributedString(styled)
        button.configuration?.contentInsets = NSDirectionalEdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16)
        button.configuration?.baseForegroundColor = ink
        button.layer.borderColor = ink.cgColor
        button.layer.borderWidth = VisualTokens.emphasisBorder
        button.backgroundColor = VisualTokens.field
        button.accessibilityLabel = caption
        button.accessibilityTraits = current ? [.button, .selected] : .button
        let textFace = UIFont(name: "Baskerville-Bold", size: 16) ?? UIFont.boldSystemFont(ofSize: 16)
        let digitFace = UIFont(name: "Arial-BoldMT", size: 16) ?? UIFont.boldSystemFont(ofSize: 16)
        let minimumWidth = ("Final Answer: " as NSString).size(withAttributes: [.font: textFace]).width
            + (answer as NSString).size(withAttributes: [.font: digitFace]).width + 32
        button.widthAnchor.constraint(greaterThanOrEqualToConstant: ceil(minimumWidth)).isActive = true
    }

    static func styleSegments(_ control: UISegmentedControl, mathematics: Bool = false) {
        control.backgroundColor = VisualTokens.field
        control.selectedSegmentTintColor = VisualTokens.field
        let image = UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1)).image { context in
            VisualTokens.field.setFill(); context.fill(CGRect(x: 0, y: 0, width: 1, height: 1))
        }
        control.setBackgroundImage(image, for: .normal, barMetrics: .default)
        control.setBackgroundImage(image, for: .selected, barMetrics: .default)
        let divider = UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1)).image { context in
            ink.setFill(); context.fill(CGRect(x: 0, y: 0, width: 1, height: 1))
        }
        for left: UIControl.State in [.normal, .selected] {
            for right: UIControl.State in [.normal, .selected] {
                control.setDividerImage(divider, forLeftSegmentState: left, rightSegmentState: right, barMetrics: .default)
            }
        }
        control.layer.borderWidth = VisualTokens.controlBorder
        control.layer.borderColor = ink.cgColor
        control.layer.cornerRadius = VisualTokens.cornerRadius
        control.clipsToBounds = true
        let normalBase = UIFont(name: mathematics ? VisualTokens.mathFontName : VisualTokens.textFontName, size: 18)!
        let boldBase = UIFont(name: mathematics ? "Arial-BoldMT" : "Baskerville-Bold", size: 18)!
        // Native segmented choices stay single-line; cap their scaled font to
        // the readable width while surrounding labels and scroll content scale.
        let normal = UIFontMetrics.default.scaledFont(for: normalBase, maximumPointSize: 24)
        let bold = UIFontMetrics.default.scaledFont(for: boldBase, maximumPointSize: 24)
        control.setTitleTextAttributes([.font: normal, .foregroundColor: ink], for: .normal)
        control.setTitleTextAttributes([.font: bold, .foregroundColor: ink,
                                       .underlineStyle: NSUnderlineStyle.single.rawValue], for: .selected)
    }
}
