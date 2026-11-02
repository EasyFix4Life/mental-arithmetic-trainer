import XCTest
@testable import MentalArithmetic

final class LessonTests: XCTestCase {
    func testCatalogContainsOnlyFourAvailableInstructionCategories() {
        XCTAssertEqual(LessonCatalog.lessons.map(\.id), ["multiplication-1", "addition-2", "multiplication-2", "multiplication-3"])
        for lesson in LessonCatalog.lessons {
            XCTAssertTrue(lesson.hasAuthoredProcedure)
            XCTAssertEqual(lesson.examples.count, lesson.id == "multiplication-2" ? 2 : 1)
            XCTAssertFalse(lesson.authoredStatus.contains("pending"))
        }
    }

    func testRandomExamplesCoverAllDigitSizesAndOperations() throws {
        for lesson in LessonCatalog.lessons {
            for _ in 0..<100 {
                let example = try RandomExamples.generateProblem(operation: lesson.operation, digitCount: lesson.digitCount)
                XCTAssertEqual(example.operation, lesson.operation)
                XCTAssertEqual(example.operands.count, 2)
                XCTAssertTrue(lesson.digitCount.range.contains(Int(example.left)!))
                XCTAssertTrue(lesson.digitCount.range.contains(Int(example.right)!))
            }
        }
    }

    func testNoImmediateUnorderedRepeatEvenWithConstantRNGAndUpperBound() throws {
        for digits in OperandDigits.allCases {
            let first = try RandomExamples.generateProblem(operation: .addition, digitCount: digits, rng: { 0 })
            let second = try RandomExamples.generateProblem(operation: .addition, digitCount: digits, previous: first, rng: { 0 })
            XCTAssertEqual(first.left, String(digits.range.lowerBound))
            XCTAssertEqual(second.right, String(digits.range.lowerBound + 1))
            let max = String(digits.range.upperBound)
            let upper = try RandomExamples.generateProblem(operation: .multiplication, digitCount: digits,
                previous: WorkedExample(left: max, right: max, operation: .multiplication), rng: { 0.99999999 })
            XCTAssertEqual(upper.left, max)
            XCTAssertEqual(upper.right, String(digits.range.lowerBound))
            var samples = [0.0, 0.5]
            let asymmetric = try RandomExamples.generateProblem(operation: .addition, digitCount: digits, rng: { samples.removeFirst() })
            let reversed = WorkedExample(left: asymmetric.right, right: asymmetric.left, operation: .addition)
            samples = [0.0, 0.5]
            let next = try RandomExamples.generateProblem(operation: .addition, digitCount: digits, previous: reversed, rng: { samples.removeFirst() })
            XCTAssertNotEqual(next.right, asymmetric.right)
        }
    }

    func testRandomExamplesRejectInvalidInjectedSamples() {
        for sample in [-1.0, 1.0, Double.nan, Double.infinity] {
            XCTAssertThrowsError(try RandomExamples.generateProblem(operation: .addition, digitCount: .one, rng: { sample }))
        }
    }

    func testExactConfirmedTwelveTimesTwelveTrace() throws {
        let e = try XCTUnwrap(ConfirmedExamples.multiplication.first)
        XCTAssertEqual(e.id, "12-times-12")
        XCTAssertEqual(e.example.operands, ["12", "12"])
        XCTAssertEqual(e.finalAnswer, "144")
        XCTAssertEqual(e.steps.map(\.stageName), [.first, .inside, .outside, .last])
        XCTAssertEqual(e.steps.map(\.intermediateResult), ["1", "2", "4", "4"])
        XCTAssertEqual(e.steps.map(\.visibleResultDigits), ["1□□", "1□□", "14□", "144"])
        XCTAssertEqual(e.steps[2].operationDisplay, "2 × 1 = 2; 2 + 2")
        XCTAssertEqual(e.steps[3].narration, "Product = 144.")
    }

    func testExactConfirmedEighteenTimesEighteenTraceAndCarryRoutes() throws {
        let e = try XCTUnwrap(ConfirmedExamples.multiplication.last)
        XCTAssertEqual(e.id, "18-times-18")
        XCTAssertEqual(e.example.operands, ["18", "18"])
        XCTAssertEqual(e.finalAnswer, "324")
        XCTAssertEqual(e.steps.map(\.stageName), [.first, .inside, .outside, .last, .last, .last])
        XCTAssertEqual(e.steps.map(\.intermediateResult), ["1", "8", "16", "64", "22", "3"])
        XCTAssertEqual(e.steps.map(\.visibleResultDigits), ["□□□", "□□□", "□□□", "□□4", "□24", "324"])
        XCTAssertEqual(e.steps[3].carryOut, "6")
        XCTAssertEqual(e.steps[3].carryToStepId, e.steps[4].id)
        XCTAssertEqual(e.steps[4].carryIn, "6")
        XCTAssertEqual(e.steps[4].carryOut, "2")
        XCTAssertEqual(e.steps[4].carryToStepId, e.steps[5].id)
        XCTAssertEqual(e.steps[5].carryIn, "2")
        XCTAssertEqual(e.steps[3].narration, "Write 4, carry 6 to 16.")
        XCTAssertEqual(e.steps[4].narration, "16 + 6 = 22. Write 2, carry 2 to the first 1.")
        XCTAssertEqual(e.steps[5].narration, "1 + 2 = 3. Product = 324.")
    }

    func testAll8100TwoDigitProductsAndCarryRoutes() throws {
        var count = 0
        for left in 10...99 {
            for right in 10...99 {
                let e = try MultiplicationExamples.create(left: left, right: right)
                XCTAssertEqual(e.finalAnswer, String(left * right), "\(left) × \(right)")
                XCTAssertEqual(e.steps.last?.visibleResultDigits, e.finalAnswer)
                XCTAssertEqual(Array(e.steps.prefix(4)).map(\.stageName), [.first, .inside, .outside, .last])
                XCTAssertTrue(e.steps.dropFirst(4).allSatisfy { $0.stageName == .last })
                XCTAssertEqual(Set(e.steps.map(\.id)).count, e.steps.count)
                for step in e.steps {
                    XCTAssertEqual(step.visibleResultDigits?.count, e.finalAnswer?.count)
                    for ref in step.highlightedDigitRefs ?? [] {
                        XCTAssertTrue(["left:0", "left:1", "right:0", "right:1"].contains(ref))
                    }
                    if let target = step.carryToStepId {
                        let next = try XCTUnwrap(e.steps.first { $0.id == target })
                        XCTAssertEqual(next.carryFromStepId, step.id)
                        XCTAssertEqual(next.carryIn, step.carryOut)
                        XCTAssertGreaterThan(Int(step.carryOut!)!, 0)
                    }
                    if let origin = step.carryFromStepId {
                        XCTAssertEqual(e.steps.first { $0.id == origin }?.carryToStepId, step.id)
                    }
                }
                count += 1
            }
        }
        XCTAssertEqual(count, 8100)
    }

    func testGeneratedEighteenCarryDirectionsAndZeroOnesDigits() throws {
        let e = try MultiplicationExamples.create(left: 18, right: 18)
        XCTAssertEqual(e.steps[3].carryOut, "6")
        XCTAssertEqual(e.steps[4].operationDisplay, "16 + 6")
        XCTAssertEqual(e.steps[4].carryOut, "2")
        XCTAssertEqual(e.steps[5].operationDisplay, "1 + 2")
        let zero = try MultiplicationExamples.create(left: 90, right: 54)
        XCTAssertEqual(zero.finalAnswer, "4860")
        XCTAssertEqual(zero.steps.last?.visibleResultDigits, "4860")
        let max = try MultiplicationExamples.create(left: 99, right: 99)
        XCTAssertEqual(max.finalAnswer, "9801")
        XCTAssertEqual(max.steps[4].intermediateResult, "170")
        XCTAssertEqual(max.steps[5].intermediateResult, "98")
    }

    func testMultiplicationTraceRejectsOutOfScopeOperands() {
        for (left, right) in [(9, 10), (10, 9), (100, 10), (10, 100), (-12, 12)] {
            XCTAssertThrowsError(try MultiplicationExamples.create(left: left, right: right))
        }
    }

    func testOwnerSpecifiedThreeDigitGroupOrderAndCarrySequence() throws {
        let e = try MultiplicationExamples.create(left: 123, right: 456, digitCount: .three)
        XCTAssertEqual(e.finalAnswer, "56088")
        XCTAssertEqual(e.steps.map(\.navigationLabel), ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 5", "Step 5", "Step 5", "Step 5"])
        XCTAssertEqual(e.steps.prefix(5).map(\.intermediateResult), ["4", "13", "28", "27", "18"])
        XCTAssertEqual(e.steps.prefix(5).map(\.operationDisplay), ["1 × 4", "1 × 5 + 2 × 4", "1 × 6 + 3 × 4 + 2 × 5", "2 × 6 + 3 × 5", "3 × 6"])
        XCTAssertEqual(e.steps.dropFirst(5).map(\.operationDisplay), ["27 + 1", "28 + 2", "13 + 3", "4 + 1"])
        XCTAssertEqual(e.steps.map(\.visibleResultDigits), ["□□□□□", "□□□□□", "□□□□□", "□□□□□", "□□□□8", "□□□88", "□□088", "□6088", "56088"])
        XCTAssertTrue(e.steps.allSatisfy { $0.stageName == nil })
    }

    func testThreeDigitMultiplicationBoundaryAndDeterministicVariedProducts() throws {
        let bounds = [100, 101, 109, 110, 199, 505, 900, 909, 990, 999]
        var pairs = bounds.flatMap { left in bounds.map { (left, $0) } }
        var state: UInt64 = 0x12345678
        func sample() -> Int {
            state = state &* 6364136223846793005 &+ 1442695040888963407
            return 100 + Int((state >> 32) % 900)
        }
        for _ in 0..<2000 { pairs.append((sample(), sample())) }
        for (left, right) in pairs {
            let e = try MultiplicationExamples.create(left: left, right: right, digitCount: .three)
            XCTAssertEqual(e.finalAnswer, String(left * right))
            XCTAssertEqual(e.steps.last?.visibleResultDigits, e.finalAnswer)
            XCTAssertEqual(e.steps.count, 9)
            let steps = Dictionary(uniqueKeysWithValues: e.steps.map { ($0.id, $0) })
            for step in e.steps {
                for ref in step.highlightedDigitRefs ?? [] {
                    XCTAssertTrue(["left:0", "left:1", "left:2", "right:0", "right:1", "right:2"].contains(ref))
                }
                if let target = step.carryToStepId {
                    XCTAssertEqual(steps[target]?.carryIn, step.carryOut)
                    XCTAssertEqual(steps[target]?.carryFromStepId, step.id)
                }
                if let source = step.carryFromStepId {
                    XCTAssertEqual(steps[source]?.carryToStepId, step.id)
                }
            }
        }
        let max = try MultiplicationExamples.create(left: 999, right: 999, digitCount: .three)
        XCTAssertEqual(max.steps.prefix(5).map(\.intermediateResult), ["81", "162", "243", "162", "81"])
        XCTAssertEqual(max.steps.dropFirst(5).map(\.intermediateResult), ["170", "260", "188", "99"])
        XCTAssertEqual(max.finalAnswer, "998001")
    }

    func testAllSingleDigitMultiplicationTraces() throws {
        for left in 1...9 {
            for right in 1...9 {
                let e = try MultiplicationExamples.create(left: left, right: right, digitCount: .one)
                XCTAssertEqual(e.finalAnswer, String(left * right))
                XCTAssertEqual(e.steps.count, 1)
                XCTAssertEqual(e.steps[0].navigationLabel, "Step 1")
                XCTAssertEqual(e.steps[0].operationDisplay, "\(left) × \(right)")
                XCTAssertEqual(e.steps[0].visibleResultDigits, e.finalAnswer)
            }
        }
    }

    func testAllOneAndTwoDigitAdditionTraces() throws {
        for digits in [OperandDigits.one, .two] {
            for left in digits.range {
                for right in digits.range {
                    let e = try AdditionExamples.create(left: left, right: right, digitCount: digits)
                    XCTAssertEqual(e.finalAnswer, String(left + right))
                    XCTAssertEqual(e.steps.last?.visibleResultDigits, e.finalAnswer)
                    XCTAssertEqual(e.steps.count, digits.rawValue * 2 - 1)
                    XCTAssertTrue(e.steps.allSatisfy { $0.calculationTerms?.allSatisfy { $0.operation == .addition } == true })
                    for step in e.steps {
                        if let target = step.carryToStepId {
                            let next = try XCTUnwrap(e.steps.first { $0.id == target })
                            XCTAssertEqual(next.carryFromStepId, step.id)
                            XCTAssertEqual(next.carryIn, step.carryOut)
                        }
                    }
                }
            }
        }
    }

    func testAdditionGroupOrderVerticalTermsAndCarries() throws {
        let two = try AdditionExamples.create(left: 58, right: 67, digitCount: .two)
        XCTAssertEqual(two.steps.prefix(2).map(\.intermediateResult), ["11", "15"])
        XCTAssertEqual(two.steps[0].calculationTerms, [CalculationTerm(left: "5", right: "6", operation: .addition)])
        XCTAssertEqual(two.steps[1].calculationTerms, [CalculationTerm(left: "8", right: "7", operation: .addition)])
        XCTAssertEqual(two.steps[2].calculationTerms, [CalculationTerm(left: "11", right: "1", operation: .addition)])
        XCTAssertEqual(two.steps[1].visibleResultDigits, "□□5")
        XCTAssertEqual(two.steps[2].visibleResultDigits, "125")
        let three = try AdditionExamples.create(left: 587, right: 678, digitCount: .three)
        XCTAssertEqual(three.steps.prefix(3).map(\.intermediateResult), ["11", "15", "15"])
        XCTAssertEqual(three.steps.dropFirst(3).map(\.intermediateResult), ["16", "12"])
        XCTAssertEqual(three.steps.map(\.navigationLabel), ["Step 1", "Step 2", "Step 3", "Step 3", "Step 3"])
        XCTAssertEqual(three.finalAnswer, "1265")
    }

    func testThreeDigitAdditionBoundaryAndVariedExamples() throws {
        let bounds = [100, 101, 109, 110, 199, 505, 900, 909, 990, 999]
        for left in bounds {
            for right in 100...999 {
                let e = try AdditionExamples.create(left: left, right: right, digitCount: .three)
                XCTAssertEqual(e.finalAnswer, String(left + right))
                XCTAssertEqual(e.steps.last?.visibleResultDigits, e.finalAnswer)
                XCTAssertEqual(e.steps.count, 5)
            }
        }
        let max = try AdditionExamples.create(left: 999, right: 999, digitCount: .three)
        XCTAssertEqual(max.finalAnswer, "1998")
        XCTAssertEqual(max.steps.map(\.intermediateResult), ["18", "18", "18", "19", "19"])
    }

    func testGenericExampleDispatchesAllAvailableConfigurations() throws {
        for lesson in LessonCatalog.lessons {
            let source = try RandomExamples.generateProblem(operation: lesson.operation, digitCount: lesson.digitCount, rng: { 0.78 })
            let e = try LessonExamples.create(example: source)
            let a = Int(source.left)!, b = Int(source.right)!
            XCTAssertEqual(e.finalAnswer, String(lesson.operation == .addition ? a + b : a * b))
            XCTAssertFalse(e.steps.isEmpty)
            XCTAssertEqual(e.example, source)
        }
        XCTAssertThrowsError(try LessonExamples.create(example: WorkedExample(left: "1", right: "10", operation: .addition)))
        XCTAssertThrowsError(try LessonExamples.create(example: WorkedExample(left: "abcd", right: "1000", operation: .multiplication)))
        XCTAssertThrowsError(try AdditionExamples.create(left: 99, right: 100, digitCount: .two))
        XCTAssertThrowsError(try MultiplicationExamples.create(left: 99, right: 100, digitCount: .three))
    }
}
