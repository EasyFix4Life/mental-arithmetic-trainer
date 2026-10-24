import Foundation

enum ArithmeticOperation: String, CaseIterable, Codable {
    case addition, multiplication
    var title: String { self == .addition ? "Addition" : "Multiplication" }
    var symbol: String { self == .addition ? "+" : "×" }
}

enum OperandDigits: Int, CaseIterable, Codable {
    case one = 1, two = 2, three = 3
    var range: ClosedRange<Int> {
        switch self {
        case .one: return 1...9 // Existing provisional practice policy excludes zero.
        case .two: return 10...99
        case .three: return 100...999
        }
    }
}

struct PracticeSettings: Equatable {
    let operation: ArithmeticOperation
    let digitCount: OperandDigits
    static let initial = PracticeSettings(operation: .addition, digitCount: .one)
}

struct ArithmeticProblem: Equatable {
    let id: String
    let operation: ArithmeticOperation
    let left: Int
    let right: Int
    var answer: String { String(operation == .addition ? left + right : left * right) }
    var expectedDigits: Int { answer.count }
    var unorderedKey: String { "\(min(left, right)),\(max(left, right))" }
}

enum PracticeError: Error, Equatable {
    case invalidRoundLength, incompatibleProblem, duplicatePair, invalidRandomSample
}

enum InputPolicy {
    /// Provisional: each new editing transaction belongs to the problem active
    /// when it arrives. A later physical key is not swallowed or retroactively
    /// attached to the answer that just completed. Enter never submits.
    static let afterSubmission = "current-problem"
    static let allowPartialBackspace = true

    static func isDecimalEntry(_ value: String) -> Bool {
        value.utf8.allSatisfy { $0 >= 48 && $0 <= 57 }
    }

    /// UIKit NSRange values are UTF-16 offsets. Reject the entire invalid insert,
    /// including non-ASCII numerals, rather than converting it to a valid answer.
    static func insertDigits(current: String, inserted: String, range: NSRange) -> String? {
        guard isDecimalEntry(inserted), let replacement = Range(range, in: current) else { return nil }
        return current.replacingCharacters(in: replacement, with: inserted)
    }

    static func assess(problem: ArithmeticProblem, input: String) -> Bool? {
        guard isDecimalEntry(input), input.count >= problem.expectedDigits else { return nil }
        return input == problem.answer // Exact comparison preserves leading-zero/overlong errors.
    }
}

enum Timing {
    /// Only completed tenths are displayed; raw milliseconds remain in state.
    static func formatTenths(_ elapsedMs: Double) -> String {
        String(format: "%.1f", locale: Locale(identifier: "en_US_POSIX"), floor(max(0, elapsedMs) / 100) / 10)
    }
}

enum RoundGenerator {
    static let roundLength = 10

    static func generate(settings: PracticeSettings, rng: () -> Double = { Double.random(in: 0..<1) }) -> [ArithmeticProblem] {
        let range = settings.digitCount.range
        let width = range.count
        let pairCount = width * (width + 1) / 2
        var replacements = [Int: Int]()
        var problems = [ArithmeticProblem]()
        // Partial Fisher-Yates samples the upper triangle without replacement.
        // Exactly ten iterations terminate even with a pathological constant RNG.
        for index in 0..<roundLength {
            let remaining = pairCount - index
            let selectedIndex = randomIndex(size: remaining, sample: rng())
            let selectedPair = replacements[selectedIndex] ?? selectedIndex
            let lastIndex = remaining - 1
            replacements[selectedIndex] = replacements[lastIndex] ?? lastIndex
            replacements.removeValue(forKey: lastIndex)
            let pair = pairAt(selectedPair, range: range)
            let reverse = randomIndex(size: 2, sample: rng()) != 0
            problems.append(ArithmeticProblem(id: "\(settings.operation.rawValue)-\(settings.digitCount.rawValue)-\(index)", operation: settings.operation,
                left: reverse ? pair.1 : pair.0, right: reverse ? pair.0 : pair.1))
        }
        return problems
    }

    private static func randomIndex(size: Int, sample: Double) -> Int {
        if !sample.isFinite || sample <= 0 { return 0 }
        if sample >= 1 { return size - 1 }
        return Int(floor(sample * Double(size)))
    }

    private static func pairAt(_ supplied: Int, range: ClosedRange<Int>) -> (Int, Int) {
        var index = supplied
        var first = range.lowerBound
        var rowLength = range.count
        while index >= rowLength {
            index -= rowLength
            first += 1
            rowLength -= 1
        }
        return (first, first + index)
    }
}

struct PreviousResult: Equatable {
    let correct: Bool
    let elapsedMs: Double
}

struct RoundTimingSummary: Equatable {
    let minimumMs: Double
    let maximumMs: Double
    let averageMs: Double
}

enum RoundPhase { case idle, active, finished }

struct RoundSnapshot: Equatable {
    let phase: RoundPhase
    let settings: PracticeSettings
    let problem: ArithmeticProblem?
    let index: Int
    let answeredCount: Int
    let correctCount: Int
    let previous: PreviousResult?
    let timingSummary: RoundTimingSummary?
    var scoreText: String { "\(correctCount) / \(RoundGenerator.roundLength)" }
}

/// UI-independent synchronous state machine. Value snapshots are immutable.
/// The UIKit controller keeps this instance when switching Learn/Practice tabs.
final class RoundController {
    typealias Clock = () -> Double
    typealias Generator = (PracticeSettings) throws -> [ArithmeticProblem]
    private let clock: Clock
    private let generator: Generator
    private var startedAt: Double
    private var roundNumber = 0
    private var problems = [ArithmeticProblem]()
    private var durationsMs = [Double]()
    private(set) var snapshot = RoundSnapshot(phase: .idle, settings: .initial, problem: nil,
        index: 0, answeredCount: 0, correctCount: 0, previous: nil, timingSummary: nil)

    init(clock: @escaping Clock = { ProcessInfo.processInfo.systemUptime * 1000 }, generator: Generator? = nil) {
        self.clock = clock
        self.generator = generator ?? { RoundGenerator.generate(settings: $0) }
        self.startedAt = clock()
    }

    func start(settings: PracticeSettings) throws {
        // Generate and validate before mutating a running/completed round.
        let generated = try generator(settings)
        guard generated.count == RoundGenerator.roundLength else { throw PracticeError.invalidRoundLength }
        var pairs = Set<String>()
        for problem in generated {
            guard problem.operation == settings.operation,
                  settings.digitCount.range.contains(problem.left),
                  settings.digitCount.range.contains(problem.right) else { throw PracticeError.incompatibleProblem }
            guard pairs.insert(problem.unorderedKey).inserted else { throw PracticeError.duplicatePair }
        }
        roundNumber += 1
        problems = generated.enumerated().map { index, problem in
            ArithmeticProblem(id: "\(roundNumber):\(index)", operation: problem.operation, left: problem.left, right: problem.right)
        }
        durationsMs = []
        snapshot = RoundSnapshot(phase: .active, settings: settings, problem: problems[0], index: 0,
            answeredCount: 0, correctCount: 0, previous: nil, timingSummary: nil)
        startedAt = clock()
    }

    /// Only the current problem ID can be accepted, at most once. A whole
    /// overlong edit submits exactly one wrong answer and discards its suffix.
    @discardableResult
    func submit(problemID: String, input: String) -> Bool {
        let current = snapshot
        guard current.phase == .active, let problem = current.problem, problem.id == problemID,
              let correct = InputPolicy.assess(problem: problem, input: input) else { return false }
        let duration = elapsed()
        durationsMs.append(duration)
        let count = current.answeredCount + 1
        let correctCount = current.correctCount + (correct ? 1 : 0)
        if count == RoundGenerator.roundLength {
            snapshot = RoundSnapshot(phase: .finished, settings: current.settings, problem: nil,
                index: count, answeredCount: count, correctCount: correctCount, previous: nil,
                timingSummary: RoundTimingSummary(minimumMs: durationsMs.min()!, maximumMs: durationsMs.max()!,
                    averageMs: durationsMs.reduce(0, +) / Double(count)))
        } else {
            snapshot = RoundSnapshot(phase: .active, settings: current.settings, problem: problems[count],
                index: count, answeredCount: count, correctCount: correctCount,
                previous: PreviousResult(correct: correct, elapsedMs: duration), timingSummary: nil)
            startedAt = clock()
        }
        return true
    }

    func elapsed() -> Double { snapshot.phase == .active ? max(0, clock() - startedAt) : 0 }
}
