import XCTest
@testable import MentalArithmetic

final class PracticeEngineTests: XCTestCase {
    private struct AcceptanceData: Decodable {
        struct ArithmeticRow: Decodable {
            let operation: ArithmeticOperation
            let digitCount: OperandDigits
            let operands: [Int]
            let expectedAnswer: Int
            let expectedDigits: Int
            let exactCorrectInput: String
            let sameLengthWrongInput: String
        }
        struct InputRow: Decodable {
            let id: String
            let operation: ArithmeticOperation
            let operands: [Int]
            let input: String
            let expectedDigits: Int
            let shouldSubmit: Bool
            let expectedOutcome: String?
        }
        struct ScoreRow: Decodable { let correctCount: Int; let display: String }
        let arithmeticExamples: [ArithmeticRow]
        let inputCases: [InputRow]
        let roundScoringCases: [ScoreRow]
    }

    private var supplied: AcceptanceData {
        get throws { try JSONDecoder().decode(AcceptanceData.self, from: Data(SuppliedAcceptanceData.json.utf8)) }
    }

    private let settings = PracticeSettings(operation: .multiplication, digitCount: .two)
    private func fixtures(_ settings: PracticeSettings) -> [ArithmeticProblem] {
        (0..<10).map { ArithmeticProblem(id: "fixture-\($0)", operation: settings.operation, left: 10, right: 10 + $0) }
    }

    func testSuppliedArithmeticExamples() throws {
        for row in try supplied.arithmeticExamples {
            let p = ArithmeticProblem(id: "fixture", operation: row.operation, left: row.operands[0], right: row.operands[1])
            XCTAssertEqual(p.answer, String(row.expectedAnswer))
            XCTAssertEqual(p.expectedDigits, row.expectedDigits)
            XCTAssertEqual(InputPolicy.assess(problem: p, input: row.exactCorrectInput), true)
            XCTAssertEqual(InputPolicy.assess(problem: p, input: row.sameLengthWrongInput), false)
            XCTAssertEqual(InputPolicy.assess(problem: p, input: row.exactCorrectInput + "0"), false)
            XCTAssertEqual(InputPolicy.assess(problem: p, input: "0" + row.exactCorrectInput.dropFirst()), false)
            for length in 0..<row.expectedDigits {
                XCTAssertNil(InputPolicy.assess(problem: p, input: String(row.exactCorrectInput.prefix(length))))
            }
        }
    }

    func testSuppliedInputCases() throws {
        for row in try supplied.inputCases {
            let p = ArithmeticProblem(id: row.id, operation: row.operation, left: row.operands[0], right: row.operands[1])
            XCTAssertEqual(p.expectedDigits, row.expectedDigits, row.id)
            let result = InputPolicy.assess(problem: p, input: row.input)
            XCTAssertEqual(result != nil, row.shouldSubmit, row.id)
            XCTAssertEqual(result, row.expectedOutcome.map { $0 == "correct" }, row.id)
        }
    }

    func testSuppliedScoreCases() throws {
        for row in try supplied.roundScoringCases {
            let s = RoundSnapshot(phase: .finished, settings: settings, problem: nil, index: 10,
                answeredCount: 10, correctCount: row.correctCount, previous: nil, timingSummary: nil)
            XCTAssertEqual(s.scoreText, row.display)
        }
    }

    func testInvalidTransactionsAreRejectedWhole() {
        let p = ArithmeticProblem(id: "100", operation: .multiplication, left: 10, right: 10)
        for input in [" 100", "100 ", "\t100", "\n100", "100\n", "+100", "-100", "100.0", "1,00", "1e2", "0x64", "١٠٠", "１００", "1a00", "100🧮", "1 00"] {
            XCTAssertFalse(InputPolicy.isDecimalEntry(input), input)
            XCTAssertNil(InputPolicy.assess(problem: p, input: input), input)
        }
        XCTAssertTrue(InputPolicy.isDecimalEntry(""))
        XCTAssertTrue(InputPolicy.isDecimalEntry("0123456789"))
    }

    func testReplacementDeletionAndAtomicInsertion() {
        XCTAssertEqual(InputPolicy.insertDigits(current: "12", inserted: "34", range: NSRange(location: 1, length: 1)), "134")
        XCTAssertEqual(InputPolicy.insertDigits(current: "12", inserted: "", range: NSRange(location: 1, length: 1)), "1")
        XCTAssertEqual(InputPolicy.insertDigits(current: "", inserted: "1009", range: NSRange(location: 0, length: 0)), "1009")
        XCTAssertNil(InputPolicy.insertDigits(current: "1", inserted: "00x", range: NSRange(location: 1, length: 0)))
        XCTAssertNil(InputPolicy.insertDigits(current: "1", inserted: "1", range: NSRange(location: 3, length: 0)))
        XCTAssertEqual(InputPolicy.afterSubmission, "current-problem")
        XCTAssertTrue(InputPolicy.allowPartialBackspace)
    }

    func testSixConfigurationsHaveTenUniqueUnorderedInRangePairs() {
        for operation in ArithmeticOperation.allCases {
            for digits in OperandDigits.allCases {
                for _ in 0..<50 {
                    let selected = PracticeSettings(operation: operation, digitCount: digits)
                    let round = RoundGenerator.generate(settings: selected)
                    XCTAssertEqual(round.count, 10)
                    XCTAssertEqual(Set(round.map(\.unorderedKey)).count, 10)
                    XCTAssertEqual(Set(round.map(\.id)).count, 10)
                    for problem in round {
                        XCTAssertEqual(problem.operation, operation)
                        XCTAssertTrue(digits.range.contains(problem.left))
                        XCTAssertTrue(digits.range.contains(problem.right))
                    }
                }
            }
        }
        XCTAssertEqual(OperandDigits.one.range, 1...9)
        XCTAssertEqual(OperandDigits.two.range, 10...99)
        XCTAssertEqual(OperandDigits.three.range, 100...999)
    }

    func testGeneratorTerminatesWithPathologicalRNG() {
        for operation in ArithmeticOperation.allCases {
            for digits in OperandDigits.allCases {
                for value in [0.0, 1.0, -1.0, Double.nan, Double.infinity, -Double.infinity] {
                    var samples = 0
                    let round = RoundGenerator.generate(settings: PracticeSettings(operation: operation, digitCount: digits), rng: { samples += 1; return value })
                    XCTAssertEqual(samples, 20)
                    XCTAssertEqual(Set(round.map(\.unorderedKey)).count, 10)
                }
            }
        }
    }

    func testSquaresRemainEligibleAndOperandOrderCanReverse() {
        let s = PracticeSettings(operation: .multiplication, digitCount: .one)
        let forward = RoundGenerator.generate(settings: s, rng: { 0 })
        XCTAssertEqual(forward.first?.left, 1)
        XCTAssertEqual(forward.first?.right, 1)
        var call = 0
        let reversed = RoundGenerator.generate(settings: s, rng: { call += 1; return call.isMultiple(of: 2) ? 0.99 : 0 })
        XCTAssertEqual(forward.map(\.unorderedKey), reversed.map(\.unorderedKey))
        XCTAssertEqual(forward[1].left, reversed[1].right)
        XCTAssertEqual(forward[1].right, reversed[1].left)
    }

    func testIdleNeedsManualStart() throws {
        let controller = RoundController(generator: fixtures)
        XCTAssertEqual(controller.snapshot.phase, .idle)
        XCTAssertNil(controller.snapshot.problem)
        XCTAssertNil(controller.snapshot.timingSummary)
        XCTAssertFalse(controller.submit(problemID: "1:0", input: "100"))
        XCTAssertEqual(controller.elapsed(), 0)
        try controller.start(settings: settings)
        XCTAssertEqual(controller.snapshot.phase, .active)
        XCTAssertEqual(controller.snapshot.problem?.id, "1:0")
        XCTAssertEqual(controller.snapshot.index, 0)
    }

    func testPartialInvalidDuplicateAndStaleInputsDoNotAdvanceOrResetTimer() throws {
        var now = 1000.25
        let controller = RoundController(clock: { now }, generator: fixtures)
        try controller.start(settings: settings)
        let first = try XCTUnwrap(controller.snapshot.problem)
        let initial = controller.snapshot
        now += 25.5
        for input in ["", "1", "10", "100x", "\n100"] {
            XCTAssertFalse(controller.submit(problemID: first.id, input: input))
            XCTAssertEqual(controller.snapshot, initial)
        }
        now += 99.5
        XCTAssertTrue(controller.submit(problemID: first.id, input: first.answer))
        XCTAssertEqual(controller.snapshot.previous, PreviousResult(correct: true, elapsedMs: 125))
        now += 50
        let secondSnapshot = controller.snapshot
        XCTAssertFalse(controller.submit(problemID: first.id, input: first.answer))
        XCTAssertFalse(controller.submit(problemID: "other", input: "110"))
        XCTAssertEqual(controller.snapshot, secondSnapshot)
        XCTAssertEqual(controller.elapsed(), 50)
    }

    func testCorrectAndWrongAcceptedAnswersAdvanceImmediately() throws {
        var now = 0.0
        let controller = RoundController(clock: { now }, generator: fixtures)
        try controller.start(settings: settings)
        let p = try XCTUnwrap(controller.snapshot.problem)
        now = 220
        XCTAssertTrue(controller.submit(problemID: p.id, input: p.answer))
        XCTAssertEqual(controller.snapshot.index, 1)
        XCTAssertEqual(controller.snapshot.correctCount, 1)
        XCTAssertEqual(controller.snapshot.previous, PreviousResult(correct: true, elapsedMs: 220))
        let next = try XCTUnwrap(controller.snapshot.problem)
        now += 530
        XCTAssertTrue(controller.submit(problemID: next.id, input: "000"))
        XCTAssertEqual(controller.snapshot.index, 2)
        XCTAssertEqual(controller.snapshot.correctCount, 1)
        XCTAssertEqual(controller.snapshot.previous, PreviousResult(correct: false, elapsedMs: 530))
    }

    func testAtomicOverlongSubmitsOnlyOneWrongAnswer() throws {
        let controller = RoundController(generator: fixtures)
        try controller.start(settings: settings)
        let p = try XCTUnwrap(controller.snapshot.problem)
        XCTAssertTrue(controller.submit(problemID: p.id, input: p.answer + "9"))
        XCTAssertEqual(controller.snapshot.answeredCount, 1)
        XCTAssertEqual(controller.snapshot.correctCount, 0)
        XCTAssertEqual(controller.snapshot.problem?.answer, "110")
        XCTAssertFalse(controller.submit(problemID: p.id, input: p.answer))
    }

    func testProvisionalNextPhysicalKeyTargetsCurrentProblem() throws {
        let generator: RoundController.Generator = { _ in
            let pairs = [(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (2, 2)]
            return pairs.map { ArithmeticProblem(id: "ignored", operation: .multiplication, left: $0.0, right: $0.1) }
        }
        let controller = RoundController(generator: generator)
        try controller.start(settings: PracticeSettings(operation: .multiplication, digitCount: .one))
        XCTAssertTrue(controller.submit(problemID: controller.snapshot.problem!.id, input: "1"))
        XCTAssertTrue(controller.submit(problemID: controller.snapshot.problem!.id, input: "2"))
        XCTAssertEqual(controller.snapshot.answeredCount, 2)
        XCTAssertEqual(controller.snapshot.correctCount, 2)
    }

    func testSummaryUsesRawTimesForAllTenIncludingIncorrectAnswers() throws {
        var now = 1000.25
        let controller = RoundController(clock: { now }, generator: fixtures)
        let durations = [99.25, 211.5, 78.75, 455.125, 300.875, 100.25, 600.5, 199.75, 805.125, 149.875]
        try controller.start(settings: settings)
        for (index, duration) in durations.enumerated() {
            XCTAssertNil(controller.snapshot.timingSummary)
            let p = try XCTUnwrap(controller.snapshot.problem)
            now += duration
            XCTAssertTrue(controller.submit(problemID: p.id, input: index.isMultiple(of: 2) ? p.answer : "000"))
        }
        let summary = try XCTUnwrap(controller.snapshot.timingSummary)
        XCTAssertEqual(controller.snapshot.phase, .finished)
        XCTAssertEqual(controller.snapshot.correctCount, 5)
        XCTAssertEqual(controller.snapshot.answeredCount, 10)
        XCTAssertNil(controller.snapshot.problem)
        XCTAssertNil(controller.snapshot.previous)
        XCTAssertEqual(summary.minimumMs, 78.75)
        XCTAssertEqual(summary.maximumMs, 805.125)
        XCTAssertEqual(summary.averageMs, 300.1, accuracy: 0.00001)
        XCTAssertEqual(Timing.formatTenths(summary.averageMs), "0.3")
    }

    func testCompletedSummaryIsStableAndRequiresManualRestart() throws {
        var now = 0.0
        let controller = RoundController(clock: { now }, generator: fixtures)
        try controller.start(settings: settings)
        let stale = try XCTUnwrap(controller.snapshot.problem)
        for _ in 0..<10 {
            let p = try XCTUnwrap(controller.snapshot.problem)
            now += 125.5
            XCTAssertTrue(controller.submit(problemID: p.id, input: p.answer))
        }
        let finished = controller.snapshot
        now += 60000
        XCTAssertEqual(controller.elapsed(), 0)
        XCTAssertFalse(controller.submit(problemID: stale.id, input: stale.answer))
        XCTAssertEqual(controller.snapshot, finished)
        XCTAssertEqual(finished.timingSummary, RoundTimingSummary(minimumMs: 125.5, maximumMs: 125.5, averageMs: 125.5))
        try controller.start(settings: settings)
        XCTAssertNil(controller.snapshot.timingSummary)
        XCTAssertNil(controller.snapshot.previous)
        XCTAssertEqual(controller.snapshot.answeredCount, 0)
        XCTAssertEqual(controller.snapshot.problem?.id, "2:0")
        XCTAssertFalse(controller.submit(problemID: stale.id, input: stale.answer))
        XCTAssertEqual(finished.phase, .finished) // Older value snapshot does not mutate.
    }

    func testGenerationFailurePreservesExistingStateAndTimer() throws {
        var bad = false
        var now = 0.0
        let controller = RoundController(clock: { now }, generator: { selected in
            bad ? [] : self.fixtures(selected)
        })
        try controller.start(settings: settings)
        let before = controller.snapshot
        bad = true
        now = 175
        XCTAssertThrowsError(try controller.start(settings: settings))
        XCTAssertEqual(controller.snapshot, before)
        XCTAssertEqual(controller.elapsed(), 175)
    }

    func testValidationRejectsCommutativeDuplicatesMismatchedRangesAndOperation() {
        var invalidRounds = [[ArithmeticProblem]]()
        var duplicate = fixtures(settings)
        duplicate[1] = ArithmeticProblem(id: "duplicate", operation: .multiplication, left: 10, right: 10)
        invalidRounds.append(duplicate)
        var reversed = fixtures(settings)
        reversed[2] = ArithmeticProblem(id: "reversed", operation: .multiplication, left: 11, right: 10)
        invalidRounds.append(reversed)
        var wrongRange = fixtures(settings)
        wrongRange[0] = ArithmeticProblem(id: "range", operation: .multiplication, left: 1, right: 10)
        invalidRounds.append(wrongRange)
        var wrongOperation = fixtures(settings)
        wrongOperation[0] = ArithmeticProblem(id: "operation", operation: .addition, left: 10, right: 10)
        invalidRounds.append(wrongOperation)
        for invalid in invalidRounds {
            let controller = RoundController(generator: { _ in invalid })
            XCTAssertThrowsError(try controller.start(settings: settings))
            XCTAssertEqual(controller.snapshot.phase, .idle)
        }
    }

    func testTimerDisplaysCompletedTenthsAndClampsNegativeClock() throws {
        for (value, expected) in [(-1.0, "0.0"), (0, "0.0"), (99.999, "0.0"), (100, "0.1"), (1499.99, "1.4"), (60000, "60.0")] {
            XCTAssertEqual(Timing.formatTenths(value), expected)
        }
        var now = 100.0
        let controller = RoundController(clock: { now }, generator: fixtures)
        try controller.start(settings: settings)
        now = 50
        XCTAssertEqual(controller.elapsed(), 0)
    }
}
