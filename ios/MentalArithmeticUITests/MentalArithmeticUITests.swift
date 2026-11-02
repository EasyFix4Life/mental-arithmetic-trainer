import XCTest

final class MentalArithmeticUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["practice-start"].waitForExistence(timeout: 10))
    }

    override func tearDownWithError() throws {
        app.terminate()
        XCUIDevice.shared.orientation = .portrait
    }

    func test01AutomaticSubmissionScoreAndRoundTiming() throws {
        app.segmentedControls["digit-count-control"].buttons["2"].tap()
        app.buttons["practice-start"].tap()
        let field = app.textFields["answer-field"]
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["maximum-time"].exists)
        XCTAssertFalse(app.segmentedControls["mode-control"].exists)

        let first = app.staticTexts["practice-problem"].label
        let expected = try answer(for: first)
        field.typeText(String(expected.dropLast()))
        XCTAssertEqual(app.staticTexts["practice-problem"].label, first, "Partial entries must not submit.")
        field.typeText(String(expected.suffix(1)))
        waitForProblemChange(from: first)
        XCTAssertTrue(app.staticTexts["previous-time"].label.contains("correct"))
        capture("02-practice-active")

        let second = app.staticTexts["practice-problem"].label
        let secondAnswer = try answer(for: second)
        let allNines = String(repeating: "9", count: secondAnswer.count)
        let incorrect = allNines == secondAnswer ? String(repeating: "0", count: secondAnswer.count) : allNines
        field.typeText(incorrect)
        waitForProblemChange(from: second)
        XCTAssertTrue(app.staticTexts["previous-time"].label.contains("incorrect"))
        for _ in 2..<10 {
            let question = app.staticTexts["practice-problem"].label
            field.typeText(try answer(for: question))
        }

        let score = app.staticTexts["round-score"]
        XCTAssertTrue(score.waitForExistence(timeout: 5))
        XCTAssertEqual(score.value as? String, "9 out of 10")
        XCTAssertFalse(field.exists)
        let maximum = try time("maximum-time")
        let minimum = try time("minimum-time")
        let average = try time("average-time")
        XCTAssertGreaterThanOrEqual(maximum, minimum)
        XCTAssertGreaterThanOrEqual(average, minimum)
        XCTAssertLessThanOrEqual(average, maximum)
        capture("03-round-score-and-times")

        let scoreValue = score.value as? String
        app.segmentedControls["mode-control"].buttons["Learn"].tap()
        app.segmentedControls["mode-control"].buttons["Practice"].tap()
        XCTAssertEqual(app.staticTexts["round-score"].value as? String, scoreValue)
        XCTAssertEqual(try time("maximum-time"), maximum)
        app.buttons["practice-start"].tap()
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["maximum-time"].exists)
        XCTAssertFalse(app.staticTexts["previous-time"].exists)
    }

    func test02FourPracticeConfigurationsUseTheirSelectedRanges() throws {
        for operation in ["Addition", "Multiplication"] {
            for digits in (operation == "Addition" || operation == "addition" ? [2] : [1, 2, 3]) {
                app.terminate()
                app.launch()
                app.segmentedControls["operation-control"].buttons[operation].tap()
                app.segmentedControls["digit-count-control"].buttons[String(digits)].tap()
                app.buttons["practice-start"].tap()
                let problem = app.staticTexts["practice-problem"]
                XCTAssertTrue(problem.waitForExistence(timeout: 5))
                let values = operands(in: problem.label)
                XCTAssertEqual(values.count, 2)
                XCTAssertTrue(values.allSatisfy { String($0).count == digits })
                XCTAssertTrue(problem.label.contains(operation == "Addition" ? "plus" : "times"))
                let previous = problem.label
                app.textFields["answer-field"].typeText(try answer(for: previous))
                waitForProblemChange(from: previous)
                XCTAssertTrue(app.staticTexts["previous-time"].label.contains("correct"))
            }
        }
    }

    func test03ConfirmedEighteenExamplePreservesCarrySequenceAndFinalAnswer() throws {
        selectLearnLesson("multiplication-2")
        reveal(app.buttons["worked-example-menu"])
        app.buttons["worked-example-menu"].tap()
        let example = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "18 × 18")).firstMatch
        XCTAssertTrue(example.waitForExistence(timeout: 3))
        example.tap()
        app.buttons["lesson-help"].tap()
        reveal(app.buttons["stage-last"])
        app.buttons["stage-last"].tap()
        reveal(app.staticTexts["step-intermediate-result"])
        XCTAssertEqual(app.staticTexts["step-intermediate-result"].label, "64")
        reveal(app.staticTexts["carry-out"])
        XCTAssertEqual(app.staticTexts["carry-out"].label, "6")
        reveal(app.buttons["step-next"])
        app.buttons["step-next"].tap()
        reveal(app.staticTexts["step-intermediate-result"])
        XCTAssertEqual(app.staticTexts["step-intermediate-result"].label, "22")
        reveal(app.staticTexts["carry-out"])
        XCTAssertEqual(app.staticTexts["carry-out"].label, "2")
        reveal(app.buttons["step-next"])
        app.buttons["step-next"].tap()
        reveal(app.staticTexts["step-intermediate-result"])
        XCTAssertEqual(app.staticTexts["step-intermediate-result"].label, "3")
        capture("04-confirmed-multiplication-carry")
        reveal(app.buttons["step-next"])
        app.buttons["step-next"].tap()
        reveal(app.staticTexts["final-answer-expression"])
        XCTAssertEqual(app.staticTexts["final-answer-expression"].label, "18 times 18 equals 324")
        XCTAssertFalse(app.buttons["step-next"].isEnabled)
        capture("05-confirmed-multiplication-final-answer")
    }

    func test04FourAvailableLessonPagesGenerateNewExamples() throws {
        app.segmentedControls["mode-control"].buttons["Learn"].tap()
        for operation in ["addition", "multiplication"] {
            for digits in (operation == "Addition" || operation == "addition" ? [2] : [1, 2, 3]) {
                let lessonButton = app.buttons["lesson-\(operation)-\(digits)"]
                reveal(lessonButton, direction: .down)
                lessonButton.tap()
                let expression = app.staticTexts["lesson-expression"]
                reveal(expression)
                let original = expression.label
                XCTAssertEqual(operands(in: original).count, 2)
                XCTAssertTrue(operands(in: original).allSatisfy { String($0).count == digits })
                let random = app.buttons["random-example"]
                reveal(random)
                random.tap()
                XCTAssertNotEqual(expression.label, original)
            }
        }
        capture("01-random-example-catalog")
    }

    func test05RotationKeepsActiveProblemPartialAnswerAndKeyboardLayout() throws {
        app.segmentedControls["operation-control"].buttons["Multiplication"].tap()
        app.segmentedControls["digit-count-control"].buttons["3"].tap()
        app.buttons["practice-start"].tap()
        let field = app.textFields["answer-field"]
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        let original = app.staticTexts["practice-problem"].label
        let expected = try answer(for: original)
        field.typeText(String(expected.prefix(1)))
        let entered = field.value as? String
        let portraitTime = app.staticTexts["live-time"].label
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["practice-problem"].label, original)
        XCTAssertEqual(field.value as? String, entered)
        let timer = app.staticTexts["live-time"]
        XCTAssertGreaterThan(timer.frame.minX, field.frame.minX)
        XCTAssertLessThanOrEqual(abs(timer.frame.midY - field.frame.midY), 35)
        let keyboard = app.keyboards.firstMatch
        if keyboard.exists { XCTAssertLessThanOrEqual(field.frame.maxY, keyboard.frame.minY + 2) }
        XCTAssertNotEqual(timer.label, portraitTime, "The timer must remain live through rotation.")
        capture("09-practice-landscape-keyboard")
        field.typeText(String(expected.dropFirst()))
        waitForProblemChange(from: original)
        XCTAssertTrue(app.staticTexts["previous-time"].label.contains("correct"))
    }

    func test06PrivacyPolicyIsAvailableWithoutNetworkOrAnAccount() throws {
        app.buttons["privacy-policy"].tap()
        XCTAssertTrue(app.navigationBars["Privacy"].waitForExistence(timeout: 3))
        let policy = app.textViews["privacy-policy-text"]
        XCTAssertTrue(policy.exists)
        XCTAssertTrue((policy.value as? String ?? policy.label).contains("does not collect personal data"))
        capture("06-local-privacy-policy")
    }

    func test07ThreeDigitMultiplicationUsesFiveGroupsAndRightToLeftCarries() throws {
        selectLearnLesson("multiplication-3")
        reveal(app.buttons["worked-example-menu"])
        app.buttons["worked-example-menu"].tap()
        let example = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "123 × 456")).firstMatch
        XCTAssertTrue(example.waitForExistence(timeout: 3))
        example.tap()
        app.buttons["lesson-help"].tap()
        for (index, result) in ["4", "13", "28", "27", "18", "28", "30", "16", "5"].enumerated() {
            let intermediate = app.staticTexts["step-intermediate-result"]
            XCTAssertTrue(intermediate.exists)
            XCTAssertEqual(intermediate.label, result, "Wrong intermediate result at screen \(index + 1).")
            if index == 4 {
                reveal(app.staticTexts["carry-out"])
                XCTAssertEqual(app.staticTexts["carry-out"].label, "1")
            }
            reveal(app.buttons["step-next"])
            app.buttons["step-next"].tap()
        }
        let final = app.staticTexts["final-answer-expression"]
        XCTAssertTrue(final.exists)
        XCTAssertEqual(final.label, "123 times 456 equals 56088")
        reveal(final)
        capture("07-three-digit-multiplication-final-answer")
    }

    func test08FourAvailableLessonPagesProvideWorkingInstructionsAndFinalAnswers() throws {
        app.segmentedControls["mode-control"].buttons["Learn"].tap()
        for operation in ["addition", "multiplication"] {
            for digits in (operation == "Addition" || operation == "addition" ? [2] : [1, 2, 3]) {
                let lesson = app.buttons["lesson-\(operation)-\(digits)"]
                reveal(lesson, direction: .down)
                lesson.tap()
                let expression = app.staticTexts["lesson-expression"]
                let expected = try answer(for: expression.label)
                let help = app.buttons["lesson-help"]
                reveal(help)
                XCTAssertEqual(help.label, "Click Here to Learn How!")
                XCTAssertGreaterThanOrEqual(help.frame.height, 64)
                XCTAssertLessThanOrEqual(help.frame.maxX, app.frame.maxX + 1)
                if operation == "multiplication" && digits == 2 { capture("09-prominent-learn-help") }
                help.tap()
                XCTAssertFalse(app.staticTexts["walkthrough-status"].exists, "Required instructions must be present.")
                XCTAssertTrue(app.staticTexts["step-operation"].exists)
                let finalButton = app.buttons["final-answer"]
                reveal(finalButton)
                XCTAssertTrue(finalButton.exists)
                XCTAssertTrue(finalButton.label.contains(expected))
                finalButton.tap()
                let final = app.staticTexts["final-answer-expression"]
                XCTAssertTrue(final.exists)
                XCTAssertTrue(final.label.hasSuffix("equals \(expected)"))
                if operation == "addition" && digits == 2 {
                    reveal(final)
                    capture("08-two-digit-addition-final-answer")
                }
            }
        }
    }

    func test09OnlyTwoDigitAdditionIsAvailableAfterSwitchingFromMultiplication() throws {
        let operation = app.segmentedControls["operation-control"]
        let digits = app.segmentedControls["digit-count-control"]
        XCTAssertEqual(digits.buttons.allElementsBoundByIndex.map(\.label), ["2"])
        for prior in ["1", "3"] {
            operation.buttons["Multiplication"].tap()
            XCTAssertEqual(digits.buttons.allElementsBoundByIndex.map(\.label), ["1", "2", "3"])
            digits.buttons[prior].tap()
            operation.buttons["Addition"].tap()
            XCTAssertEqual(digits.buttons.allElementsBoundByIndex.map(\.label), ["2"])
            XCTAssertTrue(digits.buttons["2"].isSelected)
        }
        app.segmentedControls["mode-control"].buttons["Learn"].tap()
        XCTAssertFalse(app.buttons["lesson-addition-1"].exists)
        XCTAssertFalse(app.buttons["lesson-addition-3"].exists)
        XCTAssertTrue(app.buttons["lesson-addition-2"].exists)
        for count in 1...3 { XCTAssertTrue(app.buttons["lesson-multiplication-\(count)"].exists) }
    }

    private func selectLearnLesson(_ id: String) {
        app.segmentedControls["mode-control"].buttons["Learn"].tap()
        let lesson = app.buttons["lesson-\(id)"]
        reveal(lesson)
        lesson.tap()
    }

    private func operands(in expression: String) -> [Int] {
        expression.components(separatedBy: CharacterSet.decimalDigits.inverted).compactMap(Int.init)
    }

    private func answer(for expression: String) throws -> String {
        let values = operands(in: expression)
        XCTAssertEqual(values.count, 2, "Expected two operands in \(expression)")
        guard values.count == 2 else { throw NSError(domain: "UITestExpression", code: 1) }
        return String(expression.contains("times") || expression.contains("×") ? values[0] * values[1] : values[0] + values[1])
    }

    private func waitForProblemChange(from old: String) {
        let condition = NSPredicate(format: "label != %@", old)
        expectation(for: condition, evaluatedWith: app.staticTexts["practice-problem"])
        waitForExpectations(timeout: 3)
    }

    private func time(_ identifier: String) throws -> Double {
        let element = app.staticTexts[identifier]
        XCTAssertTrue(element.exists)
        guard let value = Double(element.label.replacingOccurrences(of: " s", with: "")) else {
            throw NSError(domain: "UITestTiming", code: 1, userInfo: [NSLocalizedDescriptionKey: element.label])
        }
        return value
    }

    private enum ScrollDirection { case up, down }

    private func reveal(_ element: XCUIElement, direction: ScrollDirection = .up) {
        let scroll = app.scrollViews.firstMatch
        for _ in 0..<8 {
            if element.exists && element.isHittable { return }
            guard scroll.exists else { return }
            if element.exists && element.frame.maxY < scroll.frame.minY + 30 {
                scroll.swipeDown()
            } else if element.exists && element.frame.minY > scroll.frame.maxY - 30 {
                scroll.swipeUp()
            } else if direction == .up {
                scroll.swipeUp()
            } else {
                scroll.swipeDown()
            }
        }
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
