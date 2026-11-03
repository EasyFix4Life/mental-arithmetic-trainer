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
                await record("02 three practice configurations and operation switching") { try await self.practiceConfigurations() }
                await record("03 confirmed 18 × 18 carry sequence") { try self.confirmedEighteen() }
                await record("04 two available random lesson examples") { try self.randomLessons() }
                await record("05 rotation, partial entry, keyboard and timer layout") { try await self.rotation() }
                await record("06 local privacy policy") { try await self.privacy() }
                await record("07 removed options stay absent") { try self.removedOptions() }
                await record("08 two available instructional walkthroughs") { try self.instructionalLessons() }
                await record("09 corrected Inside and Outside for 82 × 76") { try self.correctedCrossProducts() }
                await record("10 scholarly visual tokens, pairings and monochrome feedback") { try await self.scholarlyVisuals() }
                await record("11 enlarged text and accessible layout") { try await self.enlargedText() }
                await record("12 grouped named stages, equal emphasis, logical actions and separate final box") { try self.groupedStages() }
                resetRoot()
                try chooseMode(0)
                try chooseFixedExample(lessonID: "multiplication-2", index: 0)
                try press("final-answer")
            } else {
                resetRoot()
                switch scenario {
                case "review-setup": break
                case "review-catalog": try chooseMode(0)
                case "review-privacy": try press("privacy-policy")
                case "review-practice":
                    try choosePracticeOperation(1)
                    try chooseDigitCount(2)
                    try press("practice-start")
                    await settle(0.2)
                    try edit(try currentAnswer())
                case "review-score": try await practiceRound()
                case "review-learn18":
                    try chooseMode(0)
                    try chooseFixedExample(lessonID: "multiplication-2", index: 1)
                    try press("stage-last")
                    try press("step-next")
                case "review-carry-route":
                    try chooseMode(0)
                    try chooseFixedExample(lessonID: "multiplication-2", index: 1)
                    try press("stage-last")
                    try press("step-next")
                case "review-carry13":
                    try chooseMode(0)
                    guard let learn = root.children.compactMap({ $0 as? LearnViewController }).first else { throw Failure("Missing Learn controller") }
                    try learn.qaSelectGeneratedExample(left: 99, right: 59)
                    try press("stage-last"); try press("step-next")
                case "review-practice-wrong":
                    try chooseDigitCount(2)
                    try press("practice-start")
                    await settle(0.2)
                    let expected = try currentAnswer()
                    try edit(String(repeating: "0", count: expected.count))
                case "review-large-practice":
                    window.traitOverrides.preferredContentSizeCategory = .accessibilityExtraExtraExtraLarge
                    resetRoot()
                    try chooseDigitCount(2); try press("practice-start")
                    await settle(0.2)
                    let expected = try currentAnswer()
                    try edit(String(repeating: "0", count: expected.count))
                case "review-large-middle", "review-large-final":
                    window.traitOverrides.preferredContentSizeCategory = .accessibilityExtraExtraExtraLarge
                    resetRoot(); try chooseMode(0)
                    try chooseFixedExample(lessonID: "multiplication-2", index: 0)
                    try press(scenario == "review-large-final" ? "final-answer" : "stage-inside")
                    await settle()
                    scrollReviewElementToTop(scenario == "review-large-final" ? "stage-last" : "stage-middle-group")
                case "review-large-type":
                    window.traitOverrides.preferredContentSizeCategory = .accessibilityExtraExtraExtraLarge
                    resetRoot()
                    try chooseMode(0)
                    try chooseFixedExample(lessonID: "multiplication-2", index: 0)
                    try press("stage-inside")
                case "review-learn1":
                    try chooseMode(0)
                    try press("lesson-multiplication-1")
                    try press("lesson-help")
                case "review-addition-practice":
                    try choosePracticeOperation(0)
                case "review-inside82", "review-outside82", "review-first82", "review-last82", "review-final82":
                    try chooseMode(0)
                    guard let learn = root.children.first(where: { $0 is LearnViewController }) as? LearnViewController else { throw Failure("Missing Learn controller") }
                    try learn.qaSelectGeneratedExample(left: 82, right: 76)
                    let targets = ["review-inside82": "stage-inside", "review-outside82": "stage-outside", "review-first82": "stage-first", "review-last82": "stage-last", "review-final82": "final-answer"]
                    try press(targets[scenario]!)
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
        try require(isBlack(try control("previous-time", as: UILabel.self).textColor), "Incorrect previous time is black")
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
        for priorDigits in [1, 2] {
            try choosePracticeOperation(1)
            try require(digits.numberOfSegments == 2
                        && (0..<2).compactMap { digits.titleForSegment(at: $0) } == ["1", "2"],
                        "Multiplication exposes only one and two digits")
            try chooseDigitCount(priorDigits)
            try choosePracticeOperation(0)
            try require(digits.numberOfSegments == 1 && digits.titleForSegment(at: 0) == "2"
                        && digits.selectedSegmentIndex == 0,
                        "Switching multiplication \(priorDigits) to addition selects two digits")
        }
        for (operation, digitCount) in [(0, 2), (1, 1), (1, 2)] {
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
        try require(try text("lesson-title") == "Single-digit multiplication", "Learn initially selects its first available lesson")
        try require(LessonCatalog.lessons.map(\.id) == ["multiplication-1", "multiplication-2"],
                    "Learn contains exactly single- and two-digit multiplication")
        try require(find("lesson-addition-1") == nil && find("lesson-addition-2") == nil && find("lesson-addition-3") == nil && find("lesson-multiplication-3") == nil,
                    "All addition and three-digit multiplication are absent from Learn")
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
        try chooseDigitCount(2)
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
        let problem = try control("practice-problem", as: ArithmeticExpressionView.self)
        let initialMath = problem.convert(problem.bounds, to: window)
        try require(initialMath.maxY <= fieldFrame.minY + 1, "Landscape mathematics does not overlap answer or live timer")
        try edit(String(answer.dropFirst()))
        try require(try text("practice-problem") != original, "Rotated input still submits correctly")
        window.traitOverrides.preferredContentSizeCategory = .accessibilityExtraExtraExtraLarge
        await settle(0.25)
        let enlargedMath = problem.convert(problem.bounds, to: window)
        let enlargedField = field.convert(field.bounds, to: window)
        let previous = try control("previous-time", as: UILabel.self)
        let enlargedPrevious = previous.convert(previous.bounds, to: window)
        try require(enlargedMath.maxY <= enlargedField.minY + 1 && enlargedMath.minY >= enlargedPrevious.maxY - 1,
                    "Landscape enlarged mathematics avoids feedback, answer and timer: math=\(enlargedMath), field=\(enlargedField), previous=\(enlargedPrevious)")
        window.traitOverrides.preferredContentSizeCategory = .large
        scene.requestGeometryUpdate(.iOS(interfaceOrientations: .portrait))
        await settle(0.5)
    }

    private func privacy() async throws {
        try press("privacy-policy")
        await settle()
        try require(try text("privacy-policy-text").contains("does not collect personal data"), "Local privacy policy opens without an account or network")
    }

    private func removedOptions() throws {
        try chooseMode(0)
        try require(try text("lesson-title") == "Single-digit multiplication", "Default Learn lesson is available M1")
        for id in ["addition-1", "addition-2", "addition-3", "multiplication-3"] {
            try require(find("lesson-" + id) == nil, "Removed Learn option is absent: \(id)")
        }
        try chooseMode(1)
        try choosePracticeOperation(1)
        let digits = try control("digit-count-control", as: UISegmentedControl.self)
        try require((0..<digits.numberOfSegments).compactMap { digits.titleForSegment(at: $0) } == ["1", "2"], "Practice has no three-digit multiplication choice")
        try choosePracticeOperation(0)
        try require((0..<digits.numberOfSegments).compactMap { digits.titleForSegment(at: $0) } == ["2"], "Two-digit addition remains in Practice")
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

    private func correctedCrossProducts() throws {
        try chooseMode(0)
        guard let learn = root.children.compactMap({ $0 as? LearnViewController }).first else { throw Failure("Missing Learn controller") }
        try learn.qaSelectGeneratedExample(left: 82, right: 76)
        try press("stage-inside")
        try require(try text("step-operation") == "2 × 7", "82 × 76 Inside is 2 × 7")
        try require(try text("step-intermediate-result") == "14", "Inside result is 14")
        let inside = try control("instruction-expression", as: ArithmeticExpressionView.self).accessibilityLabel ?? ""
        try require(inside.contains("left operand, position 2, digit 2") && inside.contains("right operand, position 1, digit 7"), "Inside highlights inner digits 2 and 7")
        try press("stage-outside")
        let operation = try control("step-operation", as: ArithmeticExpressionView.self).accessibilityLabel
        try require(operation == "8 times 6", "82 × 76 Outside is 8 × 6")
        try require(try text("step-intermediate-result") == "62", "Combine Inside and Outside: 14 + 48 = 62")
        let outside = try control("instruction-expression", as: ArithmeticExpressionView.self).accessibilityLabel ?? ""
        try require(outside.contains("left operand, position 1, digit 8") && outside.contains("right operand, position 2, digit 6"), "Outside highlights outer digits 8 and 6")
        try require(try text("step-narration") == "Combine Inside and Outside: 14 + 48 = 62.", "Narration uses the corrected cross-product order")
        try press("final-answer")
        try require((try control("final-answer-expression", as: ArithmeticExpressionView.self)).accessibilityLabel == "82 times 76 equals 6232", "Corrected walkthrough retains final answer 6232")
    }

    private func isBlack(_ color: UIColor) -> Bool {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        return color.getRed(&r, green: &g, blue: &b, alpha: &a) && r == 0 && g == 0 && b == 0 && a == 1
    }
    private func isWhite(_ color: UIColor) -> Bool {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        return color.getRed(&r, green: &g, blue: &b, alpha: &a) && r == 1 && g == 1 && b == 1 && a == 1
    }

    private func scholarlyVisuals() async throws {
        try require(root.view.backgroundColor!.isEqual(VisualTokens.paper), "Exact ivory paper background")
        try require(VisualTokens.inside.isEqual(VisualTokens.outside), "Inside and Outside share muted violet")
        try require((try control("practice-start", as: UIButton.self)).configuration?.background.cornerRadius == 4, "Restrained four-point corners")
        try require(isBlack((try control("practice-start", as: UIButton.self)).configuration?.baseForegroundColor ?? .clear), "Practice controls use black ink")
        try chooseDigitCount(2)
        try press("practice-start")
        await settle(0.2)
        let expected = try currentAnswer()
        try edit(String(repeating: "0", count: expected.count))
        let time = try control("previous-time", as: UILabel.self)
        let cue = try control("previous-incorrect-cue", as: UILabel.self)
        try require(isBlack(time.textColor) && isBlack(cue.textColor), "Incorrect feedback is entirely black")
        try require(time.text?.range(of: #"^[0-9]+\.[0-9]$"#, options: .regularExpression) != nil, "Numeric previous-time content is unchanged")
        try require(isVisible(cue) && cue.text == "×" && time.superview!.layer.borderWidth == 2, "Incorrect feedback has a visible black cross and emphasized border")
        try require(isWhite((try control("answer-field", as: UITextField.self)).backgroundColor!), "White answer field")
        for id in ["previous-time", "live-time"] {
            let label = try control(id, as: UILabel.self)
            try require(label.font.fontName.contains("Arial"), "Arial mathematics: \(id)")
        }
        try chooseMode(0)
        guard let learn = root.children.compactMap({ $0 as? LearnViewController }).first else { throw Failure("Missing Learn controller") }
        try learn.qaSelectGeneratedExample(left: 82, right: 76)
        for (stage, indices) in [("inside", [1, 5]), ("outside", [0, 6])] {
            try press("stage-" + stage)
            let expression = try control("instruction-expression", as: ArithmeticExpressionView.self)
            let label = descendants(in: expression).compactMap { $0 as? UILabel }.first!
            for index in indices {
                let color = label.attributedText?.attribute(.foregroundColor, at: index, effectiveRange: nil) as? UIColor
                try require(color?.isEqual(VisualTokens.inside) == true, "\(stage) selected digit uses canonical violet")
            }
            let connector = try control("pair-connector", as: UIView.self)
            let stroke = connector.layer.sublayers?.compactMap { $0 as? CAShapeLayer }.first
            try require(stroke?.path?.boundingBox.width ?? 0 > 20 && stroke?.path?.boundingBox.height ?? 0 >= 10, "\(stage) has a complete static single-pair bracket")
            try require(stroke?.strokeColor == VisualTokens.inside.cgColor, "\(stage) connector uses the same muted violet")
            try require((try control("stage-heading", as: UILabel.self)).font.fontName.contains("Baskerville"), "Scholarly serif stage heading")
            try require(expression.accessibilityLabel!.contains("Selected digits:"), "Pair selection retains accessible descriptions")
        }
        try chooseFixedExample(lessonID: "multiplication-2", index: 1)
        try press("stage-last"); try press("step-next")
        try require(find("carry-route") != nil, "Carry origin and destination route is present")
        try require(descendants(in: window).compactMap { $0 as? UILabel }.contains { $0.accessibilityIdentifier == "carry-route-value" && $0.text?.contains("6") == true }, "Whole incoming carry value is visible")
        try require(find("step-result-digits") is DevelopingAnswerLabel, "Developing answer uses aligned Arial slots")
        try press("step-next")
        try require(find("pair-connector") == nil, "Carry completion does not imply multiplying the earlier digit pair again")
        try learn.qaSelectGeneratedExample(left: 99, right: 59)
        try press("stage-last"); try press("step-next")
        try require(try text("carry-out") == "13", "Authored multi-digit carry is thirteen")
        try require(descendants(in: window).compactMap { $0 as? UILabel }.contains { $0.accessibilityIdentifier == "carry-route-value" && $0.text?.contains("13") == true }, "Carry route preserves the whole two-digit carry thirteen")
    }

    private func scrollReviewElementToTop(_ identifier: String) {
        guard let target = find(identifier) else { return }
        var ancestor = target.superview
        while let view = ancestor {
            if let scroll = view as? UIScrollView {
                let position = target.convert(target.bounds, to: scroll).minY - 12
                let maximum = max(0, scroll.contentSize.height - scroll.bounds.height + scroll.adjustedContentInset.bottom)
                scroll.setContentOffset(CGPoint(x: 0, y: min(max(0, position), maximum)), animated: false)
                return
            }
            ancestor = view.superview
        }
    }

    private func logicalStageIDs(_ view: UIView) -> [String] {
        if view is UIButton { return view.accessibilityIdentifier.map { [$0] } ?? [] }
        let children = view.accessibilityElements as? [UIView] ?? view.subviews
        return children.flatMap { logicalStageIDs($0) }
    }

    private func assertGroupedStages(answer: String) throws {
        let product = try control("stage-product-group", as: UIStackView.self)
        let middle = try control("stage-middle-group", as: UIStackView.self)
        let plus = try control("stage-middle-plus", as: UILabel.self)
        let equals = try control("stage-equals", as: UILabel.self)
        let final = try control("final-answer", as: UIButton.self)
        try require(middle.isDescendant(of: product), "Middle section remains inside the outer stage enclosure")
        try require(plus.text == "+" && plus.isDescendant(of: middle), "The middle visibly joins Inside and Outside with plus")
        for glyph in [plus, equals] {
            let width = ((glyph.text ?? "") as NSString).size(withAttributes: [.font: glyph.font!]).width
            try require(glyph.bounds.width >= width - 1, "Plus and equals glyphs remain fully visible")
        }
        let middleButtons = descendants(in: middle).compactMap { $0 as? UIButton }
        try require(middleButtons.map(\.accessibilityIdentifier) == ["stage-inside", "stage-outside"], "Inside and Outside remain two distinct middle buttons")
        try require(!final.isDescendant(of: product) && !equals.isDescendant(of: product) && equals.text == "=", "Equals and Final Answer are outside the stage enclosure")
        try require(!product.isAccessibilityElement && !middle.isAccessibilityElement, "Semantic grouping does not collapse interactive stage buttons")
        let group = try control("multiplication-stage-group", as: UIStackView.self)
        try require(logicalStageIDs(group) == ["stage-first", "stage-inside", "stage-outside", "stage-last", "final-answer"], "Logical accessible action order is First Inside Outside Last Final Answer")
        var faces = [UIFont]()
        var insets = [NSDirectionalEdgeInsets]()
        for stage in MultiplicationStage.allCases {
            let button = try control("stage-" + stage.rawValue.lowercased(), as: UIButton.self)
            try require(button.isDescendant(of: product), "\(stage.rawValue) remains inside the stage enclosure")
            try require(button.layer.borderWidth == 2, "\(stage.rawValue) has an equal two-point border")
            try require(button.backgroundColor?.isEqual(AppTheme.stageFill(for: stage)) == true, "\(stage.rawValue) uses its light matching fill")
            guard let label = button.titleLabel else { throw Failure("Missing stage title") }
            let face = label.attributedText?.attribute(.font, at: 0, effectiveRange: nil) as? UIFont ?? label.font!
            faces.append(face); insets.append(button.configuration!.contentInsets)
            try require((label.attributedText?.size().width ?? label.intrinsicContentSize.width) <= label.bounds.width + 1, "\(stage.rawValue) remains a whole readable word")
            try require(face.fontName.contains("Baskerville") && face.fontName.contains("Bold"), "\(stage.rawValue) is bold scholarly text")
            try require(button.bounds.height >= 44, "\(stage.rawValue) preserves its minimum target")
        }
        try require(faces.allSatisfy { $0.fontName == faces[0].fontName && abs($0.pointSize - faces[0].pointSize) < 0.1 }, "All four boxes share font and size in every selection state")
        try require(insets.allSatisfy { $0 == insets[0] }, "All four boxes share padding")
        try require(final.accessibilityLabel == "Final Answer: " + answer, "Final Answer caption uses the requested casing and result")
        if let styled = final.titleLabel?.attributedText {
            let range = (styled.string as NSString).range(of: answer, options: .backwards)
            try require(range.location != NSNotFound, "Final box displays the result digits")
            let face = styled.attribute(.font, at: range.location, effectiveRange: nil) as? UIFont
            try require(face?.fontName.contains("Arial") == true, "Final box result digits use Arial")
        } else { throw Failure("Missing styled Final Answer caption") }
        for id in ["stage-connection-first", "stage-connection-last"] {
            let arrow = try control(id, as: UILabel.self)
            try require(arrow.text == "&" && arrow.transform.isIdentity && !arrow.isAccessibilityElement, "Literal upright ampersands visually connect the stages")
        }
    }

    private func groupedStages() throws {
        try chooseMode(0)
        guard let learn = root.children.compactMap({ $0 as? LearnViewController }).first else { throw Failure("Missing Learn controller") }
        try learn.qaSelectGeneratedExample(left: 82, right: 76)
        for stage in MultiplicationStage.allCases {
            try press("stage-" + stage.rawValue.lowercased())
            try require(try text("stage-heading") == stage.rawValue, "Direct stage selection remains: \(stage.rawValue)")
            try assertGroupedStages(answer: "6232")
        }
        try press("final-answer")
        try require(try text("final-answer-expression") == "82 times 76 equals 6232", "Separate final box opens the existing final answer directly")
        try assertGroupedStages(answer: "6232")
        try press("step-back")
        try require(find("step-intermediate-result") != nil, "Back from Final Answer returns to the existing last instruction screen")
        try press("step-next")
        try require(find("final-answer-expression") != nil, "Next still reaches the final answer after the last instruction")
        for id in ["multiplication-1"] {
            try press("lesson-" + id); try press("lesson-help")
            try require(find("stage-product-group") == nil, "Numbered lesson keeps generic navigation: \(id)")
        }
    }

    private func enlargedText() async throws {
        window.traitOverrides.preferredContentSizeCategory = .accessibilityExtraExtraExtraLarge
        defer { window.traitOverrides.preferredContentSizeCategory = .large; resetRoot() }
        resetRoot()
        try chooseMode(0)
        try chooseFixedExample(lessonID: "multiplication-2", index: 0)
        try press("stage-inside")
        await settle()
        let heading = try control("stage-heading", as: UILabel.self)
        try require(heading.font.pointSize > 22, "Dynamic Type scales explanatory headings")
        let expression = try control("instruction-expression", as: ArithmeticExpressionView.self)
        try require(expression.bounds.width <= window.bounds.width && expression.bounds.width > 0, "Enlarged equation remains within the viewport width")
        for name in ["inside", "outside", "first", "last"] {
            let button = try control("stage-" + name, as: UIButton.self)
            try require(button.bounds.width > 100 && button.bounds.height >= 44, "Accessible stage target remains usable: \(name)")
            let label = button.titleLabel!
            try require(label.intrinsicContentSize.height <= button.bounds.height + 1, "Enlarged stage text is not clipped: \(name)")
        }
        let walkthroughHeading = try control("walkthrough-heading", as: UILabel.self)
        let longestHeading = ("Instructional" as NSString).size(withAttributes: [.font: walkthroughHeading.font!]).width
        try require(longestHeading <= walkthroughHeading.bounds.width + 1, "Largest-text walkthrough heading preserves whole words")
        try assertGroupedStages(answer: "144")
        let middle = try control("stage-middle-group", as: UIStackView.self)
        try require(middle.axis == .vertical, "Enlarged middle pair stacks inside the same outline")
        let final = try control("final-answer", as: UIButton.self)
        let needed = final.titleLabel!.sizeThatFits(CGSize(width: final.titleLabel!.bounds.width, height: .greatestFiniteMagnitude))
        try require(final.titleLabel!.bounds.height >= needed.height - 1, "Enlarged Final Answer caption wraps without clipping")
        resetRoot()
        try chooseDigitCount(2); try press("practice-start")
        await settle(0.2)
        let expected = try currentAnswer()
        try edit(String(repeating: "0", count: expected.count))
        await settle()
        let problem = try control("practice-problem", as: ArithmeticExpressionView.self)
        let answer = try control("answer-field", as: UITextField.self)
        let live = try control("live-time", as: UILabel.self)
        let previous = try control("previous-time", as: UILabel.self)
        let mathRect = problem.convert(problem.bounds, to: window)
        let answerRect = answer.convert(answer.bounds, to: window)
        let liveRect = live.convert(live.bounds, to: window)
        let previousRect = previous.convert(previous.bounds, to: window)
        try require(mathRect.maxY <= answerRect.minY + 1 && mathRect.minY >= previousRect.maxY - 1, "Enlarged Practice mathematics stays between previous feedback and answer entry: math=\(mathRect), answer=\(answerRect), previous=\(previousRect), base=\(problem.fontSize), traits=\(problem.traitCollection.preferredContentSizeCategory.rawValue), windowTraits=\(window.traitCollection.preferredContentSizeCategory.rawValue), font72=\(AppTheme.mathFont(72, compatibleWith: window.traitCollection).pointSize)")
        try require(answerRect.minX >= 0 && liveRect.maxX <= window.bounds.width + 1, "Enlarged answer and live timer stay within viewport")
        try require(answer.font!.fontName.contains("Arial") && isBlack(previous.textColor), "Enlarged Practice retains Arial and black feedback")
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
            "build": Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") ?? "unknown",
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
