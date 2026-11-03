import UIKit

/// A static reading of the existing carry fields. The whole authored carry value
/// stays together; this presentation does not compute or infer place values.
final class CarryRouteView: UIStackView {
    init(step: InstructionStep) {
        super.init(frame: .zero)
        axis = .vertical; spacing = 12
        isLayoutMarginsRelativeArrangement = true
        layoutMargins = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        layer.borderColor = AppTheme.accent(for: step.stageName).cgColor
        layer.borderWidth = VisualTokens.controlBorder
        layer.cornerRadius = VisualTokens.cornerRadius
        accessibilityIdentifier = "carry-route"
        translatesAutoresizingMaskIntoConstraints = false
        let current = step.stepLabel ?? step.navigationLabel ?? step.stageName?.rawValue ?? "Current calculation"
        if let carry = step.carryIn {
            addRoute(source: step.carryFromLabel ?? step.carryFromStepId ?? "Previous calculation",
                     value: carry, destination: current, direction: "Incoming carry", accent: AppTheme.accent(for: step.stageName))
        }
        if let carry = step.carryOut {
            addRoute(source: current, value: carry,
                     destination: step.carryToLabel ?? step.carryToStepId ?? "Next calculation", direction: "Outgoing carry", accent: AppTheme.accent(for: step.stageName))
        }
    }

    required init(coder: NSCoder) { fatalError("Use init(step:)") }

    private func addRoute(source: String, value: String, destination: String, direction: String, accent: UIColor) {
        addArrangedSubview(AppTheme.label(direction, size: 16, bold: true))
        let from = AppTheme.label("From: " + source, size: 17)
        addArrangedSubview(from)
        let carry = AppTheme.label("↓  " + value + "  ↓", size: 28, bold: true, identifier: "carry-route-value", mathematics: true)
        carry.textColor = accent
        carry.accessibilityLabel = "Carry \(value) from \(source) to \(destination)"
        addArrangedSubview(carry)
        addArrangedSubview(AppTheme.label("To: " + destination, size: 17))
    }
}
