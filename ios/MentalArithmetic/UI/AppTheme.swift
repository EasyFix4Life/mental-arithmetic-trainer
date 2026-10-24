import UIKit

@MainActor
enum AppTheme {
    static let background = UIColor(red: 232 / 255, green: 215 / 255, blue: 181 / 255, alpha: 1)
    static let ink = UIColor(red: 36 / 255, green: 30 / 255, blue: 22 / 255, alpha: 1)
    static let border = UIColor(red: 104 / 255, green: 87 / 255, blue: 63 / 255, alpha: 1)
    static let highlight = UIColor(red: 217 / 255, green: 194 / 255, blue: 154 / 255, alpha: 1)
    static let incorrect = UIColor(red: 176 / 255, green: 0, blue: 0, alpha: 1)

    nonisolated static func font(_ size: CGFloat, bold: Bool = false) -> UIFont {
        UIFont(name: bold ? "Arial-BoldMT" : "ArialMT", size: size)
            ?? UIFont.systemFont(ofSize: size, weight: bold ? .bold : .regular)
    }

    static func label(_ text: String = "", size: CGFloat = 18, bold: Bool = false,
                      identifier: String? = nil) -> UILabel {
        let label = UILabel()
        label.text = text
        label.font = font(size, bold: bold)
        label.textColor = ink
        label.numberOfLines = 0
        label.accessibilityIdentifier = identifier
        label.adjustsFontForContentSizeCategory = true
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }

    static func button(_ title: String, identifier: String? = nil,
                       action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system)
        var configuration = UIButton.Configuration.plain()
        configuration.title = title
        configuration.baseForegroundColor = ink
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 12, leading: 12, bottom: 12, trailing: 12)
        configuration.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var attributes = incoming
            attributes.font = font(18)
            return attributes
        }
        button.configuration = configuration
        button.layer.borderColor = border.cgColor
        button.layer.borderWidth = 1
        button.layer.cornerRadius = 3
        button.titleLabel?.numberOfLines = 0
        button.accessibilityIdentifier = identifier
        button.translatesAutoresizingMaskIntoConstraints = false
        button.heightAnchor.constraint(greaterThanOrEqualToConstant: 48).isActive = true
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

    static func selected(_ selected: Bool, button: UIButton) {
        button.isSelected = selected
        button.layer.borderWidth = selected ? 2 : 1
        button.backgroundColor = selected ? highlight : .clear
        button.accessibilityTraits = selected ? [.button, .selected] : .button
    }
}
