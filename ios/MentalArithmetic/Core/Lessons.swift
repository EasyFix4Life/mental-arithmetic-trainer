import Foundation

enum MultiplicationStage: String, CaseIterable, Codable {
    case first = "First", inside = "Inside", outside = "Outside", last = "Last"
}

struct WorkedExample: Equatable, Codable {
    let operands: [String]
    let operation: ArithmeticOperation
    var left: String { operands[0] }
    var right: String { operands[1] }
    init(left: String, right: String, operation: ArithmeticOperation) {
        operands = [left, right]
        self.operation = operation
    }
}

struct InstructionStep: Equatable, Codable {
    let id: String
    var stageName: MultiplicationStage? = nil
    var navigationLabel: String? = nil
    var stepLabel: String? = nil
    var highlightedDigitRefs: [String]? = nil
    var operationDisplay: String? = nil
    var calculationTerms: [CalculationTerm]? = nil
    var intermediateResult: String? = nil
    var carryIn: String? = nil
    var carryOut: String? = nil
    var carryFromStepId: String? = nil
    var carryToStepId: String? = nil
    var carryFromLabel: String? = nil
    var carryToLabel: String? = nil
    var visibleResultDigits: String? = nil
    var narration: String? = nil
}

struct CalculationTerm: Equatable, Codable {
    let left: String
    let right: String
    let operation: ArithmeticOperation
}

struct AuthoredExample: Equatable, Codable {
    let id: String
    let title: String
    let example: WorkedExample
    let steps: [InstructionStep]
    let finalAnswer: String?
}

struct InstructionalLesson: Equatable {
    let id: String
    let title: String
    let operation: ArithmeticOperation
    let digitCount: OperandDigits
    let authoredStatus: String
    let examples: [AuthoredExample]
    var hasAuthoredProcedure: Bool { !examples.isEmpty }
}

enum LessonCatalog {
    /// Historical instruction fixtures retain the owner's described methodology. Only 12×12 and
    /// 18×18 are individually owner-confirmed worked traces; the other examples
    /// are generated from the subsequently described general method.
    static let allLessons = [
        InstructionalLesson(id: "multiplication-1", title: "Single-digit multiplication", operation: .multiplication,
            digitCount: .one, authoredStatus: "Owner-described method; generated instructions",
            examples: [try! MultiplicationExamples.create(left: 8, right: 7, digitCount: .one)]),
        InstructionalLesson(id: "addition-2", title: "Two-digit addition", operation: .addition,
            digitCount: .two, authoredStatus: "Owner-described method; generated instructions",
            examples: [try! AdditionExamples.create(left: 58, right: 67, digitCount: .two)]),
        InstructionalLesson(id: "multiplication-2", title: "Two-digit multiplication", operation: .multiplication,
            digitCount: .two, authoredStatus: "Two owner-confirmed worked examples", examples: ConfirmedExamples.multiplication),
        InstructionalLesson(id: "multiplication-3", title: "Three-digit multiplication", operation: .multiplication,
            digitCount: .three, authoredStatus: "Owner-described method; generated instructions",
            examples: [try! MultiplicationExamples.create(left: 123, right: 456, digitCount: .three)]),
    ]

    /// Learn availability is independent of Practice choices. Historical addition
    /// and three-digit methods remain in allLessons for reusable engine tests.
    static let lessons = allLessons.filter { isAvailable(operation: $0.operation, digitCount: $0.digitCount) }

    static func isAvailable(operation: ArithmeticOperation, digitCount: OperandDigits) -> Bool {
        operation == .multiplication && [.one, .two].contains(digitCount)
    }
}

enum RandomExamples {
    static func generateProblem(operation: ArithmeticOperation, digitCount: OperandDigits,
                                previous: WorkedExample? = nil,
                                rng: () -> Double = { Double.random(in: 0..<1) }) throws -> WorkedExample {
        let range = digitCount.range
        func draw() throws -> Int {
            let sample = rng()
            guard sample.isFinite, sample >= 0, sample < 1 else { throw PracticeError.invalidRandomSample }
            return range.lowerBound + Int(floor(sample * Double(range.count)))
        }
        let left = try draw()
        var right = try draw()
        if let previous = previous, previous.operation == operation,
           (previous.left == String(left) && previous.right == String(right)
            || previous.left == String(right) && previous.right == String(left)) {
            right = right == range.upperBound ? range.lowerBound : right + 1
        }
        return WorkedExample(left: String(left), right: String(right), operation: operation)
    }
}

enum LessonError: Error { case invalidOperands }

enum MultiplicationExamples {
    static func create(left: Int, right: Int, digitCount: OperandDigits) throws -> AuthoredExample {
        guard digitCount.range.contains(left), digitCount.range.contains(right) else { throw LessonError.invalidOperands }
        if digitCount == .two { return try create(left: left, right: right) }
        let a = String(left).compactMap(\.wholeNumberValue)
        let b = String(right).compactMap(\.wholeNumberValue)
        // Three-digit central order is precisely the owner's latest sequence:
        // first×last, last×first, middle×middle. The groups are calculated left
        // to right; carries resolve from the right as in the confirmed 18×18.
        let pairs: [[(Int, Int)]] = digitCount == .one ? [[(0, 0)]] : [
            [(0, 0)], [(0, 1), (1, 0)], [(0, 2), (2, 0), (1, 1)],
            [(1, 2), (2, 1)], [(2, 2)],
        ]
        let groups = pairs.enumerated().map { index, group -> InstructionGroup in
            let expression = group.map { "\(a[$0.0]) × \(b[$0.1])" }.joined(separator: " + ")
            let result = group.reduce(0) { $0 + a[$1.0] * b[$1.1] }
            let refs = group.flatMap { ["left:\($0.0)", "right:\($0.1)"] }
            var terms: [CalculationTerm]? = nil
            if group.count > 1 {
                let products = group.map { a[$0.0] * b[$0.1] }
                var calculations = group.map { CalculationTerm(left: String(a[$0.0]), right: String(b[$0.1]), operation: .multiplication) }
                var accumulated = products[0]
                for product in products.dropFirst() {
                    calculations.append(CalculationTerm(left: String(accumulated), right: String(product), operation: .addition))
                    accumulated += product
                }
                terms = calculations
            }
            return InstructionGroup(label: "Step \(index + 1)", expression: expression, result: result,
                digitRefs: refs.reduce(into: [String]()) { if !$0.contains($1) { $0.append($1) } }, calculationTerms: terms)
        }
        return PositionalInstructions.make(left: left, right: right, operation: .multiplication, groups: groups)
    }

    /// Generalized from the exact First → Inside → Outside → Last procedure and
    /// right-to-left carry direction confirmed for 12 × 12 and 18 × 18.
    static func create(left: Int, right: Int) throws -> AuthoredExample {
        guard (10...99).contains(left), (10...99).contains(right) else { throw LessonError.invalidOperands }
        let leftFirst = left / 10, leftLast = left % 10
        let rightFirst = right / 10, rightLast = right % 10
        // Inside selects the adjacent inner digits; Outside selects the outer digits.
        let first = leftFirst * rightFirst, inside = leftLast * rightFirst, outside = leftFirst * rightLast
        let middle = inside + outside, last = leftLast * rightLast
        let unitsDigit = last % 10, carryToMiddle = last / 10
        let resolvedMiddle = middle + carryToMiddle
        let tensDigit = resolvedMiddle % 10, carryToFirst = resolvedMiddle / 10
        let resolvedFirst = first + carryToFirst
        let finalAnswer = "\(resolvedFirst)\(tensDigit)\(unitsDigit)"
        let prefix = "random-\(left)-times-\(right)"
        let blank = String(repeating: "□", count: finalAnswer.count)
        let unitsOnly = String(repeating: "□", count: finalAnswer.count - 1) + String(unitsDigit)
        let lastTwo = String(repeating: "□", count: finalAnswer.count - 2) + "\(tensDigit)\(unitsDigit)"
        let needsMiddleStep = carryToMiddle > 0 || carryToFirst > 0
        var steps = [
            InstructionStep(id: "\(prefix)-first", stageName: .first,
                highlightedDigitRefs: ["left:0", "right:0"], operationDisplay: "\(leftFirst) × \(rightFirst)",
                intermediateResult: String(first), visibleResultDigits: blank),
            InstructionStep(id: "\(prefix)-inside", stageName: .inside,
                highlightedDigitRefs: ["left:1", "right:0"], operationDisplay: "\(leftLast) × \(rightFirst)",
                intermediateResult: String(inside), visibleResultDigits: blank),
            InstructionStep(id: "\(prefix)-outside", stageName: .outside,
                highlightedDigitRefs: ["left:0", "right:1"], operationDisplay: "\(leftFirst) × \(rightLast) = \(outside); \(inside) + \(outside)",
                calculationTerms: [CalculationTerm(left: String(leftFirst), right: String(rightLast), operation: .multiplication),
                    CalculationTerm(left: String(inside), right: String(outside), operation: .addition)],
                intermediateResult: String(middle), visibleResultDigits: blank,
                narration: "Combine Inside and Outside: \(inside) + \(outside) = \(middle)."),
            InstructionStep(id: "\(prefix)-last", stageName: .last,
                highlightedDigitRefs: ["left:1", "right:1"], operationDisplay: "\(leftLast) × \(rightLast)",
                intermediateResult: String(last),
                carryOut: carryToMiddle > 0 ? String(carryToMiddle) : nil,
                carryToStepId: carryToMiddle > 0 ? "\(prefix)-middle-carry" : nil,
                carryToLabel: carryToMiddle > 0 ? "Inside + Outside (\(middle))" : nil,
                visibleResultDigits: needsMiddleStep ? unitsOnly : finalAnswer,
                narration: carryToMiddle > 0 ? "Write \(unitsDigit), carry \(carryToMiddle) to \(middle)."
                    : needsMiddleStep ? "Write \(unitsDigit)." : "Product = \(finalAnswer)."),
        ]
        if needsMiddleStep {
            let operationDisplay = carryToMiddle > 0 ? "\(middle) + \(carryToMiddle)" : "\(inside) + \(outside)"
            steps.append(InstructionStep(id: "\(prefix)-middle-carry", stageName: .last,
                stepLabel: carryToMiddle > 0 ? "Carry to the middle" : "Complete the middle",
                highlightedDigitRefs: [], operationDisplay: operationDisplay,
                calculationTerms: [CalculationTerm(left: String(carryToMiddle > 0 ? middle : inside),
                    right: String(carryToMiddle > 0 ? carryToMiddle : outside), operation: .addition)],
                intermediateResult: String(resolvedMiddle),
                carryIn: carryToMiddle > 0 ? String(carryToMiddle) : nil,
                carryOut: carryToFirst > 0 ? String(carryToFirst) : nil,
                carryFromStepId: carryToMiddle > 0 ? "\(prefix)-last" : nil,
                carryToStepId: carryToFirst > 0 ? "\(prefix)-first-carry" : nil,
                carryFromLabel: carryToMiddle > 0 ? "Last (\(last))" : nil,
                carryToLabel: carryToFirst > 0 ? "First (\(first))" : nil,
                visibleResultDigits: carryToFirst > 0 ? lastTwo : finalAnswer,
                narration: carryToFirst > 0
                    ? "\(operationDisplay) = \(resolvedMiddle). Write \(tensDigit), carry \(carryToFirst) to the first \(first)."
                    : "\(middle) + \(carryToMiddle) = \(resolvedMiddle). Write \(tensDigit). Product = \(finalAnswer)."))
        }
        if carryToFirst > 0 {
            steps.append(InstructionStep(id: "\(prefix)-first-carry", stageName: .last,
                stepLabel: "Complete the answer", highlightedDigitRefs: ["left:0", "right:0"],
                operationDisplay: "\(first) + \(carryToFirst)",
                calculationTerms: [CalculationTerm(left: String(first), right: String(carryToFirst), operation: .addition)],
                intermediateResult: String(resolvedFirst),
                carryIn: String(carryToFirst), carryFromStepId: "\(prefix)-middle-carry",
                carryFromLabel: "Inside + Outside (\(resolvedMiddle))", visibleResultDigits: finalAnswer,
                narration: "\(first) + \(carryToFirst) = \(resolvedFirst). Product = \(finalAnswer)."))
        }
        return AuthoredExample(id: prefix, title: "\(left) × \(right) — random example",
            example: WorkedExample(left: String(left), right: String(right), operation: .multiplication),
            steps: steps, finalAnswer: finalAnswer)
    }
}
