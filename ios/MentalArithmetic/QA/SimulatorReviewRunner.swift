#if DEBUG
import UIKit

/// Local simulator integration harness. This file is entirely absent from a
/// Release binary. It exercises actual UIKit control actions and the actual
/// UITextField delegate; it does not claim to reproduce physical keyboard or
/// external accessibility automation. Those XCUITests are shipped separately.
@MainActor
final class SimulatorReviewRunner {
    private let window: UIWindow
    private let scenario: String
    private var cases = [[String: Any]]()
    private var checks = [String]()
    private var root: RootViewController { window.rootViewController as! RootViewController }

    static func startIfRequested(window: UIWindow) {
        guard let scenario = ProcessInfo.processInfo.environment["MENTAL_ARITHMETIC_QA_SCENARIO"],
              !scenario.isEmpty else { return }
        Task { @MainActor in
            let runner = SimulatorReviewRunner(window: window, scenario: scenario)
            await runner.run()
        }
    }

    private init(window: UIWindow, scenario: String) { self.window = window; self.scenario = scenario }

    private func run() async {
        await settle()
        do {
            if scenario == "suite" {
                await record("01 automatic submission, input rejection, score and timing") { try await self.practiceRound() }
                await record("02 four practice configurations and operation switching") { try await self.practiceConfigurations() }
                await record("03 confirmed 18 × 18 carry sequence") { try self.confirmedEighteen() }
                await record("04 four available random lesson examples") { try self.randomLessons() }
                await record("05 rotation, partial entry, keyboard and timer layout") { try await self.rotation() }
                await record("06 local privacy policy") { try await self.privacy() }
                await record("07 three-digit multiplication groups and carries") { try self.threeDigitMultiplication() }
                await record("08 four available instructional walkthroughs") { try self.instructionalLessons() }
                resetRoot()
                try chooseMode(0)
                try chooseFixedExample(lessonID: "multiplication-3", index: 0)
                try press("final-answer")
            } else {
                resetRoot()
                switch scenario {
                case "review-setup": break
                case "review-catalog": try chooseMode(0)
                case "review-privacy": try press("privacy-policy")
                case "review-practice":
                    try choosePracticeOperation(1)
                    try chooseDigitCount(3)
                    try press("practice-start")
                    await settle(0.2)
                    try edit(try currentAnswer())
                case "review-score": try await practiceRound()
                case "review-learn18":
                    try chooseMode(0)
                    try chooseFixedExample(lessonID: "multiplication-2", index: 1)
                    try press("stage-last")
                    try press("step-next")
                case "review-learn3":
                    try chooseMode(0)
                    try chooseFixedExample(lessonID: "multiplication-3", index: 0)
                    for _ in 0..<2 { try press("step-next") }
                case "review-addition2":
                    try chooseMode(0)
                    try chooseFixedExample(lessonID: "addition-2", index: 0)
                case "review-help":
                    try chooseMode(0)
                    try press("lesson-multiplication-2")
                    try checkLearnHelp()
                    let help = try control("lesson-help", as: UIButton.self)
                    var ancestor = help.superview
                    while let view = ancestor {
                        if let scroll = view as? UIScrollView {
                            let expression = try control("lesson-expression", as: ArithmeticExpressionView.self)
                            let reviewFrame = help.convert(help.bounds, to: scroll)
                                .union(expression.convert(expression.bounds, to: scroll)).insetBy(dx: 0, dy: -16)
                            scroll.scrollRectToVisible(reviewFrame, animated: false)
                            break
                        }
                        ancestor = view.superview
                    }
                default: throw Failure("Unknown QA scenario \(scenario)")
                }
                await settle()
            }
            writeReport(error: nil)
        } catch {
            writeReport(error: String(describing: error))
        }
    }

    private func record(_ name: String, operation: () async throws -> Void) async {
        resetRoot()
        checks = []
        let started = ProcessInfo.processInfo.systemUptime
        var record: [String: Any] = ["name": name]
        do {
            try await operation()
            record["status"] = "passed"
        } catch let skipped as Skipped {
            record["status"] = "skipped"
            record["reason"] = skipped.description
        } catch {
            record["status"] = "failed"
            record["error"] = String(describing: error)
        }
        record["checks"] = checks
        record["durationMs"] = (ProcessInfo.processInfo.systemUptime - started) * 1000
        cases.append(record)
    }

    private func practiceRound() async throws {
        try chooseDigitCount(2)
        try press("practice-start")
        await settle(0.25)
        let first = try text("practice-problem")
        let expected = try currentAnswer()
        try edit(String(expected.dropLast()))
        try require(try text("practice-problem") == first, "Partial input does not submit")
        let partial = try control("answer-field", as: UITextField.self).text
        try edit("a")
        try require(try control("answer-field", as: UITextField.self).text == partial, "Non-ASCII-decimal transaction rejected")
        try edit(String(expected.suffix(1)))
        try require(try text("practice-problem") != first, "Correct answer immediately advances without Enter")
        try require(try control("previous-time", as: UILabel.self).textColor.isEqual(UIColor.black), "Correct previous time is black")
        await settle(0.4)
        let second = try text("practice-problem")
        let secondAnswer = try currentAnswer()
        let nines = String(repeating: "9", count: secondAnswer.count)
        try edit(nines == secondAnswer ? String(repeating: "0", count: secondAnswer.count) : nines)
        try require(try text("practice-problem") != second, "Incorrect answer immediately advances")
        try require(try control("previous-time", as: UILabel.self).textColor.isEqual(AppTheme.incorrect), "Incorrect previous time is red")
        for _ in 2..<10 {
            await settle(0.12)
            try edit(try currentAnswer())
        }
        try require(try control("round-score", as: UILabel.self).text == "9 / 10", "Final score includes all ten answers")
        let maximum = try displayedTime("maximum-time")
        let minimum = try displayedTime("minimum-time")
        let average = try displayedTime("average-time")
        try require(minimum <= average && average <= maximum, "Minimum ≤ mean ≤ maximum")
        try require(maximum >= 0.3 && minimum >= 0.1, "Displayed round timing contains the real elapsed intervals")
        try require(!(try control("practice-start", as: UIButton.self)).isHidden, "New round waits for manual start")
        try chooseMode(0)
        try chooseMode(1)
        try require(try displayedTime("maximum-time") == maximum, "Completed round survives a Learn visit")
        if scenario == "suite" {
            try press("practice-start")
            try require(!isVisible(try control("round-score", as: UILabel.self)), "Starting another round hides completed score")
            try require(try control("previous-time", as: UILabel.self).isHidden, "Starting another round clears previous time")
        }
    }

    private func practiceConfigurations() async throws {
        let digits = try control("digit-count-control", as: UISegmentedControl.self)
        try require(digits.numberOfSegments == 1 && digits.titleForSegment(at: 0) == "2"
                    && digits.selectedSegmentIndex == 0, "Addition starts with only two-digit operands")
        for priorDigits in [1, 3] {
            try choosePracticeOperation(1)
            try require(digits.numberOfSegments == 3
                        && (0..<3).compactMap { digits.titleForSegment(at: $0) } == ["1", "2", "3"],
                        "Multiplication retains all three digit choices")
            try chooseDigitCount(priorDigits)
            try choosePracticeOperation(0)
            try require(digits.numberOfSegments == 1 && digits.titleForSegment(at: 0) == "2"
                        && digits.selectedSegmentIndex == 0,
                        "Switching multiplication \(priorDigits) to addition selects two digits")
        }
        for (operation, digitCount) in [(0, 2), (1, 1), (1, 2), (1, 3)] {
            resetRoot()
            try choosePracticeOperation(operation)
            try chooseDigitCount(digitCount)
            try press("practice-start")
            let expression = try text("practice-problem")
            let operands = numbers(expression)
            try require(operands.count == 2 && operands.allSatisfy { String($0).count == digitCount }, "Practice range \(operation):\(digitCount)")
            try require(expression.contains(operation == 0 ? "plus" : "times"), "Selected operation \(operation):\(digitCount)")
            try edit(try currentAnswer())
            try require(try text("practice-problem") != expression, "Configuration accepts correct answer \(operation):\(digitCount)")
        }
    }

    private func choosePracticeOperation(_ index: Int) throws {
        let operation = try control("operation-control", as: UISegmentedControl.self)
        operation.selectedSegmentIndex = index
        operation.sendActions(for: .valueChanged)
        window.layoutIfNeeded()
    }

    private func chooseDigitCount(_ value: Int) throws {
        let digits = try control("digit-count-control", as: UISegmentedControl.self)
        guard let index = (0..<digits.numberOfSegments).first(where: { digits.titleForSegment(at: $0) == String(value) }) else {
            throw Failure("Unavailable practice digit count \(value)")
        }
        digits.selectedSegmentIndex = index
    }

    private func confirmedEighteen() throws {
        try chooseMode(0)
        try chooseFixedExample(lessonID: "multiplication-2", index: 1)
        try press("stage-last")
        try require(try text("step-intermediate-result") == "64", "Last: 8 × 8 = 64")
        try require(try text("carry-out") == "6", "Carry six from Last")
        try press("step-next")
        try require(try text("step-intermediate-result") == "22", "Middle: 16 + 6 = 22")
        try require(try text("carry-out") == "2", "Carry two to First")
        try press("step-next")
        try require(try text("step-intermediate-result") == "3", "First: 1 + 2 = 3")
        try press("step-next")
        try require(try text("final-answer-expression") == "18 times 18 equals 324", "Final answer follows Last")
        try require(!(try control("step-next", as: UIButton.self)).isEnabled, "No screen after final answer")
    }

    private func randomLessons() throws {
        try chooseMode(0)
        try require(try text("lesson-title") == "Two-digit addition", "Learn initially selects two-digit addition")
        try require(LessonCatalog.lessons.map(\.id) == ["multiplication-1", "addition-2", "multiplication-2", "multiplication-3"],
                    "Learn contains exactly the four available categories")
        try require(find("lesson-addition-1") == nil && find("lesson-addition-3") == nil,
                    "Single- and three-digit addition are absent from Learn")
        for lesson in LessonCatalog.lessons {
            try press("lesson-\(lesson.id)")
            try checkLearnHelp()
            let original = try text("lesson-expression")
            let operands = numbers(original)
            try require(operands.count == 2 && operands.allSatisfy { String($0).count == lesson.digitCount.rawValue }, "Learn range \(lesson.id)")
            try require(try control("worked-example-menu", as: UIButton.self).configuration?.title
                        == "Random: \(operands[0]) \(lesson.operation.symbol) \(operands[1])",
                        "Random menu label uses the selected arithmetic operation \(lesson.id)")
            try press("random-example")
            try require(try text("lesson-expression") != original, "New random example \(lesson.id)")
        }
    }

    private func checkLearnHelp() throws {
        let help = try control("lesson-help", as: UIButton.self)
        try require(help.configuration?.title == "Click Here to Learn How!", "Learn button displays the requested wording")
        try require(help.accessibilityLabel == "Click Here to Learn How!", "Learn button's accessible name includes its visible wording")
        try require(help.configuration?.image != nil, "Learn button retains a prominent question mark")
        try require(help.bounds.height >= 64, "Learn button has a large touch target")
        try require(help.bounds.width >= min(window.bounds.width - 40, 860) - 2, "Learn button uses the available readable width")
        let frame = help.convert(help.bounds, to: window)
        try require(frame.minX >= 0 && frame.maxX <= window.bounds.width + 1, "Learn button stays within horizontal screen bounds")
        guard let label = help.titleLabel else { throw Failure("Missing Learn button title") }
        let needed = label.sizeThatFits(CGSize(width: label.bounds.width, height: .greatestFiniteMagnitude))
        try require(label.bounds.width > 100 && label.bounds.height >= needed.height - 1,
                    "Learn button title wraps without clipping")
    }

    private func rotation() async throws {
        try choosePracticeOperation(1)
        try chooseDigitCount(3)
        try press("practice-start")
        await settle()
        let original = try text("practice-problem")
        let answer = try currentAnswer()
        try edit(String(answer.prefix(1)))
        guard let scene = window.windowScene else { throw Failure("Missing UIWindowScene") }
        scene.requestGeometryUpdate(.iOS(interfaceOrientations: .landscapeLeft))
        await settle(0.75)
        if !scene.interfaceOrientation.isLandscape && UIDevice.current.userInterfaceIdiom == .pad {
            try require(try text("practice-problem") == original, "iPad geometry request preserves active problem")
            try require(try control("answer-field", as: UITextField.self).text == String(answer.prefix(1)), "iPad geometry request preserves partial answer")
            throw Skipped(description: "The iPad simulator did not apply the programmatic landscape geometry request. Physical iPad rotation and landscape keyboard layout remain unverified.")
        }
        try require(scene.interfaceOrientation.isLandscape, "Window scene rotates to landscape")
        try require(try text("practice-problem") == original, "Rotation preserves active problem")
        try require(try control("answer-field", as: UITextField.self).text == String(answer.prefix(1)), "Rotation preserves partial answer")
        let field = try control("answer-field", as: UITextField.self)
        let timer = try control("live-time", as: UILabel.self)
        let fieldFrame = field.convert(field.bounds, to: window)
        let timerFrame = timer.convert(timer.bounds, to: window)
        try require(field.isFirstResponder, "Answer retains numeric keyboard focus")
        try require(timerFrame.minX >= fieldFrame.maxX && abs(timerFrame.midY - fieldFrame.midY) <= 35, "Live timer remains beside answer")
        try require(window.bounds.contains(fieldFrame) && window.bounds.contains(timerFrame), "Answer and timer stay inside landscape window")
        try edit(String(answer.dropFirst()))
        try require(try text("practice-problem") != original, "Rotated input still submits correctly")
        scene.requestGeometryUpdate(.iOS(interfaceOrientations: .portrait))
        await settle(0.5)
    }

    private func privacy() async throws {
        try press("privacy-policy")
        await settle()
        try require(try text("privacy-policy-text").contains("does not collect personal data"), "Local privacy policy opens without an account or network")
    }

    private func threeDigitMultiplication() throws {
        try chooseMode(0)
        try chooseFixedExample(lessonID: "multiplication-3", index: 0)
        for (index, value) in ["4", "13", "28", "27", "18", "28", "30", "16", "5"].enumerated() {
            try require(try text("step-intermediate-result") == value, "123 × 456 screen \(index + 1): \(value)")
            try press("step-next")
        }
        try require(try text("final-answer-expression") == "123 times 456 equals 56088", "Three-digit final answer is 56088")
    }

    private func instructionalLessons() throws {
        try chooseMode(0)
        for lesson in LessonCatalog.lessons {
            try press("lesson-\(lesson.id)")
            let problem = try text("lesson-expression")
            let answer = try answerForExpression(problem)
            try press("lesson-help")
            try require(find("step-operation") != nil, "Instructional calculation present \(lesson.id)")
            let instruction = try control("instruction-expression", as: ArithmeticExpressionView.self)
            try require(instruction.bounds.width >= min(window.bounds.width - 40, 860) - 2,
                        "Walkthrough keeps the available readable width \(lesson.id)")
            if lesson.operation == .addition {
                let operands = numbers(problem).map(String.init)
                let labels = descendants(in: instruction).compactMap { $0 as? UILabel }
                guard let left = labels.first(where: { $0.text == operands[0] }),
                      let right = labels.first(where: { $0.text == operands[1] && $0 !== left }) else {
                    throw Failure("Missing vertical addition operand labels \(lesson.id)")
                }
                let leftEdge = left.convert(left.bounds, to: window).maxX
                let rightEdge = right.convert(right.bounds, to: window).maxX
                try require(abs(leftEdge - rightEdge) <= 1, "Vertical addition right edges align \(lesson.id)")
            }
            try press("final-answer")
            try require(try text("final-answer-expression").hasSuffix("equals \(answer)"), "Final answer correct \(lesson.id)")
        }
    }

    private func resetRoot() {
        window.rootViewController?.dismiss(animated: false)
        window.rootViewController = RootViewController()
        window.makeKeyAndVisible()
        root.loadViewIfNeeded()
        window.layoutIfNeeded()
    }

    private func chooseMode(_ index: Int) throws {
        let mode = try control("mode-control", as: UISegmentedControl.self)
        mode.selectedSegmentIndex = index
        mode.sendActions(for: .valueChanged)
        window.layoutIfNeeded()
    }

    private func chooseFixedExample(lessonID: String, index: Int) throws {
        guard let learn = root.children.compactMap({ $0 as? LearnViewController }).first,
              learn.qaSelectFixedExample(lessonID: lessonID, exampleIndex: index) else { throw Failure("Missing lesson fixture \(lessonID):\(index)") }
        window.layoutIfNeeded()
    }

    private func press(_ identifier: String) throws {
        let button = try control(identifier, as: UIButton.self)
        guard button.isEnabled else { throw Failure("Disabled control \(identifier)") }
        button.sendActions(for: .touchUpInside)
        window.layoutIfNeeded()
    }

    private func edit(_ inserted: String) throws {
        let field = try control("answer-field", as: UITextField.self)
        let original = field.text ?? ""
        let range = NSRange(location: original.utf16.count, length: 0)
        let allow = field.delegate?.textField?(field, shouldChangeCharactersIn: range, replacementString: inserted) ?? true
        if allow { field.text = original + inserted }
        window.layoutIfNeeded()
    }

    private func currentAnswer() throws -> String { try answerForExpression(text("practice-problem")) }

    private func answerForExpression(_ expression: String) throws -> String {
        let values = numbers(expression)
        guard values.count == 2 else { throw Failure("Expected two operands: \(expression)") }
        return String(expression.contains("times") ? values[0] * values[1] : values[0] + values[1])
    }

    private func numbers(_ expression: String) -> [Int] {
        expression.components(separatedBy: CharacterSet.decimalDigits.inverted).compactMap(Int.init)
    }

    private func displayedTime(_ identifier: String) throws -> Double {
        guard let value = Double(try text(identifier).replacingOccurrences(of: " s", with: "")) else { throw Failure("Invalid timing \(identifier)") }
        return value
    }

    private func find(_ identifier: String, in view: UIView? = nil) -> UIView? {
        let view = view ?? window
        if view.accessibilityIdentifier == identifier { return view }
        for child in view.subviews {
            if let found = find(identifier, in: child) { return found }
        }
        return nil
    }

    private func descendants(in view: UIView) -> [UIView] {
        view.subviews.flatMap { [$0] + descendants(in: $0) }
    }

    private func isVisible(_ view: UIView) -> Bool {
        var current: UIView? = view
        while let candidate = current {
            if candidate.isHidden || candidate.alpha == 0 { return false }
            current = candidate.superview
        }
        return view.window != nil
    }

    private func control<T: UIView>(_ identifier: String, as type: T.Type) throws -> T {
        guard let view = find(identifier) as? T else { throw Failure("Missing \(T.self) \(identifier)") }
        return view
    }

    private func text(_ identifier: String) throws -> String {
        guard let view = find(identifier) else { throw Failure("Missing text \(identifier)") }
        if let label = view as? UILabel { return label.accessibilityLabel ?? label.text ?? "" }
        if let textView = view as? UITextView { return textView.text }
        return view.accessibilityLabel ?? ""
    }

    private func require(_ condition: @autoclosure () throws -> Bool, _ message: String) throws {
        guard try condition() else { throw Failure(message) }
        checks.append(message)
    }

    private func settle(_ seconds: Double = 0.35) async {
        try? await Task.sleep(for: .seconds(seconds))
        window.layoutIfNeeded()
    }

    private func writeReport(error: String?) {
        let passed = cases.filter { $0["status"] as? String == "passed" }.count
        let skipped = cases.filter { $0["status"] as? String == "skipped" }.count
        let report: [String: Any] = [
            "kind": "debug-native-uikit-integration-and-review",
            "scenario": scenario,
            "status": error == nil && cases.allSatisfy { ["passed", "skipped"].contains($0["status"] as? String ?? "") } ? "passed" : "failed",
            "passed": passed,
            "skipped": skipped,
            "total": cases.count,
            "cases": cases,
            "error": error as Any? ?? NSNull(),
            "deviceModel": UIDevice.current.model,
            "systemVersion": UIDevice.current.systemVersion,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "version": Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") ?? "unknown",
            "window": ["width": window.bounds.width, "height": window.bounds.height],
            "limitations": ["Control actions and UITextFieldDelegate integration, not physical keyboard input or external XCUITest automation", "DEBUG-only fixture selection for individually specified worked examples", "No App Store distribution signature or physical-device test implied"]
        ]
        do {
            let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let output = directory.appendingPathComponent("qa-\(scenario).json")
            try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys]).write(to: output, options: .atomic)
            print("MENTAL_ARITHMETIC_QA_READY \(output.path)")
        } catch { print("MENTAL_ARITHMETIC_QA_ERROR \(error)") }
    }

    private struct Failure: Error, CustomStringConvertible {
        let description: String
        init(_ description: String) { self.description = description }
    }

    private struct Skipped: Error, CustomStringConvertible {
        let description: String
    }
}
#endif
