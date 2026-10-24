import Foundation

struct InstructionGroup {
    let label: String
    let expression: String
    let result: Int
    let digitRefs: [String]
    var calculationTerms: [CalculationTerm]? = nil
}

/// Shared display trace for an owner-specified list of positional groups. This
/// helper preserves all raw group results before resolving right-to-left carries.
enum PositionalInstructions {
    static func make(left: Int, right: Int, operation: ArithmeticOperation, groups: [InstructionGroup]) -> AuthoredExample {
        precondition(!groups.isEmpty)
        let value = operation == .addition ? left + right : left * right
        let finalAnswer = String(value)
        let prefix = "random-\(left)-\(operation.rawValue)-\(right)"
        let blank = String(repeating: "□", count: finalAnswer.count)
        let lastIndex = groups.count - 1
        let lastNavigation = groups[lastIndex].label
        var suffix = ""
        var pendingCarry = 0
        var steps = [InstructionStep]()
        for (index, group) in groups.enumerated() {
            let isLast = index == lastIndex
            var step = InstructionStep(id: "\(prefix)-group-\(index)", navigationLabel: group.label,
                highlightedDigitRefs: group.digitRefs, operationDisplay: group.expression,
                calculationTerms: group.calculationTerms,
                intermediateResult: String(group.result), visibleResultDigits: blank)
            if isLast {
                if lastIndex == 0 {
                    suffix = String(group.result)
                    step.visibleResultDigits = finalAnswer
                    step.narration = "\(operation == .addition ? "Sum" : "Product") = \(finalAnswer)."
                } else {
                    suffix = String(group.result % 10)
                    pendingCarry = group.result / 10
                    step.visibleResultDigits = String(repeating: "□", count: finalAnswer.count - suffix.count) + suffix
                    step.narration = "Write \(suffix)."
                    if pendingCarry > 0 {
                        step.carryOut = String(pendingCarry)
                        step.carryToStepId = "\(prefix)-resolve-\(lastIndex - 1)"
                        step.carryToLabel = "\(groups[lastIndex - 1].label) (\(groups[lastIndex - 1].result))"
                        step.narration = "Write \(suffix), carry \(pendingCarry) to \(groups[lastIndex - 1].result)."
                    }
                }
            }
            steps.append(step)
        }
        if lastIndex > 0 {
            for index in stride(from: lastIndex - 1, through: 0, by: -1) {
                let group = groups[index]
                let carryIn = pendingCarry
                let resolved = group.result + carryIn
                let record = index == 0 ? String(resolved) : String(resolved % 10)
                pendingCarry = index == 0 ? 0 : resolved / 10
                suffix = record + suffix
                let previousID = index == lastIndex - 1 ? "\(prefix)-group-\(lastIndex)" : "\(prefix)-resolve-\(index + 1)"
                var step = InstructionStep(id: "\(prefix)-resolve-\(index)", navigationLabel: lastNavigation,
                    stepLabel: index == 0 ? "Complete the answer" : "Complete \(group.label.lowercased())",
                    highlightedDigitRefs: group.digitRefs,
                    operationDisplay: carryIn > 0 ? "\(group.result) + \(carryIn)" : group.expression,
                    calculationTerms: carryIn > 0
                        ? [CalculationTerm(left: String(group.result), right: String(carryIn), operation: .addition)]
                        : group.calculationTerms,
                    intermediateResult: String(resolved),
                    carryIn: carryIn > 0 ? String(carryIn) : nil,
                    carryOut: pendingCarry > 0 ? String(pendingCarry) : nil,
                    carryFromStepId: carryIn > 0 ? previousID : nil,
                    carryToStepId: pendingCarry > 0 ? "\(prefix)-resolve-\(index - 1)" : nil,
                    carryFromLabel: carryIn > 0 ? (index == lastIndex - 1 ? "\(groups[lastIndex].label) (\(groups[lastIndex].result))" : "\(groups[index + 1].label)") : nil,
                    carryToLabel: pendingCarry > 0 ? "\(groups[index - 1].label) (\(groups[index - 1].result))" : nil,
                    visibleResultDigits: String(repeating: "□", count: max(0, finalAnswer.count - suffix.count)) + suffix)
                if index == 0 {
                    step.narration = "\(operation == .addition ? "Sum" : "Product") = \(finalAnswer)."
                } else if pendingCarry > 0 {
                    step.narration = "Write \(record), carry \(pendingCarry) to \(groups[index - 1].result)."
                } else {
                    step.narration = "Write \(record)."
                }
                steps.append(step)
            }
        }
        return AuthoredExample(id: prefix, title: "\(left) \(operation.symbol) \(right) — random example",
            example: WorkedExample(left: String(left), right: String(right), operation: operation),
            steps: steps, finalAnswer: finalAnswer)
    }
}

enum AdditionExamples {
    static func create(left: Int, right: Int, digitCount: OperandDigits) throws -> AuthoredExample {
        guard digitCount.range.contains(left), digitCount.range.contains(right) else { throw LessonError.invalidOperands }
        let a = String(left).compactMap(\.wholeNumberValue)
        let b = String(right).compactMap(\.wholeNumberValue)
        let groups = a.indices.map { index in
            InstructionGroup(label: "Step \(index + 1)", expression: "\(a[index]) + \(b[index])", result: a[index] + b[index],
                digitRefs: ["left:\(index)", "right:\(index)"],
                calculationTerms: [CalculationTerm(left: String(a[index]), right: String(b[index]), operation: .addition)])
        }
        return PositionalInstructions.make(left: left, right: right, operation: .addition, groups: groups)
    }
}

enum LessonExamples {
    static func create(example: WorkedExample) throws -> AuthoredExample {
        guard let left = Int(example.left), let right = Int(example.right),
              let digits = OperandDigits(rawValue: example.left.count), example.left.count == example.right.count else {
            throw LessonError.invalidOperands
        }
        return try example.operation == .addition
            ? AdditionExamples.create(left: left, right: right, digitCount: digits)
            : MultiplicationExamples.create(left: left, right: right, digitCount: digits)
    }
}
