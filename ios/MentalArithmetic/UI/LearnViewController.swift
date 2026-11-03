import UIKit

/// Preserve whole words at the largest text settings. The heading still scales
/// with Dynamic Type, fitting only an otherwise unbreakable word to its line.
private final class WalkthroughHeadingLabel: UILabel {
    init() {
        super.init(frame: .zero)
        text = "Instructional walkthrough"
        textColor = AppTheme.ink
        font = AppTheme.font(21, bold: true)
        numberOfLines = 0
        lineBreakMode = .byWordWrapping
        adjustsFontForContentSizeCategory = false
        accessibilityIdentifier = "walkthrough-heading"
        translatesAutoresizingMaskIntoConstraints = false
    }
    required init?(coder: NSCoder) { fatalError("Use init()") }
    override func layoutSubviews() {
        super.layoutSubviews()
        guard bounds.width > 0 else { return }
        let base = UIFont(name: "Baskerville-Bold", size: 21) ?? UIFont.boldSystemFont(ofSize: 21)
        let intended = UIFontMetrics(forTextStyle: .body).scaledFont(for: base, compatibleWith: traitCollection)
        let longest = (text ?? "").split(separator: " ").map { (String($0) as NSString).size(withAttributes: [.font: intended]).width }.max() ?? 1
        let size = intended.pointSize * min(1, bounds.width / max(1, longest))
        if abs(font.pointSize - size) > 0.25 { font = intended.withSize(size) }
    }
}

final class LearnViewController: UIViewController {
    private let scroll = UIScrollView()
    private let content = AppTheme.stack(spacing: 20)
    private var lesson = LessonCatalog.lessons[0]
    private var randomProblem: WorkedExample!
    private var randomExample: AuthoredExample?
    private var selectedExample: AuthoredExample?
    private var stepIndex = 0
    private var isOpen = false
    private var lessonButtons = [String: UIButton]()
    private var catalogRows = [UIStackView]()
    private var walkthroughHeader: UIStackView?
    private var groupedStageLayoutSignature: String?
    private let heading = AppTheme.label(size: 28, identifier: "lesson-title")
    private let status = AppTheme.label(size: 17, identifier: "lesson-status")
    private let exampleMenu = AppTheme.button("Worked example", identifier: "worked-example-menu", action: {})
    private lazy var random = AppTheme.button("New random example", identifier: "random-example") { [weak self] in
        self?.newRandomExample()
    }
    private let problemRow = AppTheme.stack(spacing: 16)
    private let expression = ArithmeticExpressionView(fontSize: 60, identifier: "lesson-expression")
    private lazy var help = AppTheme.button("Click Here to Learn How!", identifier: "lesson-help") { [weak self] in
        guard let self else { return }
        self.isOpen.toggle()
        self.render()
        if self.isOpen { self.showWalkthrough() }
    }
    private let walkthrough = AppTheme.stack(spacing: 20)
    private let stages = AppTheme.stack(spacing: 8)
    private let stepContent = AppTheme.stack(spacing: 16)
    private let navigation = AppTheme.stack(axis: .horizontal, spacing: 12, alignment: .center)
    private let position = AppTheme.label(size: 18, identifier: "step-position", mathematics: true)
    private lazy var back = AppTheme.button("Back", identifier: "step-back") { [weak self] in self?.move(-1) }
    private lazy var nextButton = AppTheme.button("Next", identifier: "step-next") { [weak self] in self?.move(1) }

    private var currentExample: AuthoredExample? { selectedExample ?? randomExample }
    private var currentProblem: WorkedExample { selectedExample?.example ?? randomProblem }
    private var currentSteps: [InstructionStep] { currentExample?.steps ?? [] }
    private var screenCount: Int { currentSteps.count + (currentExample?.finalAnswer != nil ? 1 : 0) }

    #if DEBUG
    /// Deterministic fixture setup for the local native integration runner.
    /// Actual navigation and answers still exercise the normal UIKit controls.
    func qaSelectFixedExample(lessonID: String, exampleIndex: Int) -> Bool {
        guard let requested = LessonCatalog.lessons.first(where: { $0.id == lessonID }),
              requested.examples.indices.contains(exampleIndex) else { return false }
        selectLesson(requested)
        selectedExample = requested.examples[exampleIndex]
        isOpen = true
        stepIndex = 0
        render()
        showWalkthrough()
        return true
    }
    func qaSelectGeneratedExample(left: Int, right: Int) throws {
        selectLesson(LessonCatalog.lessons.first { $0.id == "multiplication-2" }!)
        selectedExample = try MultiplicationExamples.create(left: left, right: right)
        isOpen = true
        stepIndex = 0
        render()
        showWalkthrough()
    }
    #endif

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = AppTheme.background
        build()
        generateRandom()
        render()
    }

    private func build() {
        scroll.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scroll)
        scroll.addSubview(content)
        let width = content.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor, constant: -40)
        width.priority = UILayoutPriority(999)
        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: view.topAnchor),
            scroll.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            scroll.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            content.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor, constant: 16),
            content.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor, constant: -32),
            content.centerXAnchor.constraint(equalTo: scroll.frameLayoutGuide.centerXAnchor),
            width,
            content.widthAnchor.constraint(lessThanOrEqualToConstant: 860)
        ])
        content.addArrangedSubview(AppTheme.label("Learn", size: 32))
        let catalog = AppTheme.stack(spacing: 8)
        for pairStart in stride(from: 0, to: LessonCatalog.lessons.count, by: 2) {
            let row = AppTheme.stack(axis: traitCollection.preferredContentSizeCategory.isAccessibilityCategory ? .vertical : .horizontal, spacing: 8)
            row.distribution = .fillEqually
            for index in pairStart..<min(pairStart + 2, LessonCatalog.lessons.count) {
                let item = LessonCatalog.lessons[index]
                let button = AppTheme.button(item.title, identifier: "lesson-\(item.id)") { [weak self] in
                    self?.selectLesson(item)
                }
                button.configuration?.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
                    var attributes = incoming
                    attributes.font = AppTheme.font(16)
                    return attributes
                }
                lessonButtons[item.id] = button
                row.addArrangedSubview(button)
            }
            catalogRows.append(row)
            catalog.addArrangedSubview(row)
        }
        content.addArrangedSubview(catalog)
        content.addArrangedSubview(heading)
        content.addArrangedSubview(status)
        content.addArrangedSubview(exampleMenu)
        content.addArrangedSubview(random)
        expression.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        problemRow.addArrangedSubview(help)
        problemRow.addArrangedSubview(expression)
        help.configuration?.image = UIImage(systemName: "questionmark.circle", withConfiguration:
            UIImage.SymbolConfiguration(pointSize: 30, weight: .bold))
        help.configuration?.imagePadding = 12
        help.configuration?.imagePlacement = .leading
        help.configuration?.titleAlignment = .center
        help.configuration?.contentInsets = NSDirectionalEdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16)
        help.configuration?.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var attributes = incoming
            attributes.font = AppTheme.font(20, bold: true)
            return attributes
        }
        help.titleLabel?.lineBreakMode = .byWordWrapping
        help.heightAnchor.constraint(greaterThanOrEqualToConstant: 64).isActive = true
        help.layer.cornerRadius = VisualTokens.cornerRadius
        help.layer.borderWidth = VisualTokens.emphasisBorder
        help.backgroundColor = VisualTokens.field
        help.accessibilityLabel = "Click Here to Learn How!"
        help.accessibilityHint = "Opens the instructional walkthrough for this lesson."
        content.addArrangedSubview(problemRow)
        let header = AppTheme.stack(axis: traitCollection.preferredContentSizeCategory.isAccessibilityCategory ? .vertical : .horizontal, spacing: 16, alignment: .fill)
        walkthroughHeader = header
        navigation.axis = traitCollection.preferredContentSizeCategory.isAccessibilityCategory ? .vertical : .horizontal
        let walkthroughHeading = WalkthroughHeadingLabel()
        header.addArrangedSubview(walkthroughHeading)
        let close = AppTheme.button("Close", identifier: "close-walkthrough") { [weak self] in
            self?.isOpen = false
            self?.render()
        }
        close.setContentCompressionResistancePriority(.required, for: .horizontal)
        header.addArrangedSubview(close)
        walkthrough.addArrangedSubview(header)
        walkthrough.addArrangedSubview(stages)
        walkthrough.addArrangedSubview(stepContent)
        position.textAlignment = .center
        navigation.addArrangedSubview(back)
        navigation.addArrangedSubview(position)
        navigation.addArrangedSubview(nextButton)
        position.setContentHuggingPriority(.defaultLow, for: .horizontal)
        walkthrough.addArrangedSubview(navigation)
        content.addArrangedSubview(walkthrough)
        content.addArrangedSubview(AppTheme.button("Privacy", identifier: "privacy-policy") { [weak self] in
            guard let self else { return }
            self.present(UINavigationController(rootViewController: PrivacyViewController()), animated: false)
        })
    }

    private func selectLesson(_ next: InstructionalLesson) {
        lesson = next
        selectedExample = nil
        stepIndex = 0
        isOpen = false
        generateRandom()
        render()
    }

    private func generateRandom(previous displayed: WorkedExample? = nil) {
        let previous = displayed ?? randomProblem
        do {
            randomProblem = try RandomExamples.generateProblem(operation: lesson.operation,
                digitCount: lesson.digitCount, previous: previous)
            if lesson.hasAuthoredProcedure {
                randomExample = try LessonExamples.create(example: randomProblem)
            } else {
                randomExample = nil
            }
        } catch {
            assertionFailure("Valid lesson settings must generate an example: \(error)")
        }
    }

    private func newRandomExample() {
        let previous = currentProblem
        selectedExample = nil
        stepIndex = 0
        generateRandom(previous: previous)
        render()
    }

    private func render() {
        heading.text = lesson.title
        status.text = lesson.hasAuthoredProcedure
            ? "Open the walkthrough to explore this example."
            : "The authored instructional steps for this lesson are pending."
        for (id, button) in lessonButtons { AppTheme.selected(id == lesson.id, button: button) }
        exampleMenu.isHidden = lesson.examples.isEmpty
        if !lesson.examples.isEmpty {
            let randomAction = UIAction(title: "Random: \(randomProblem.left) \(randomProblem.operation.symbol) \(randomProblem.right)",
                                        state: selectedExample == nil ? .on : .off) { [weak self] _ in
                self?.newRandomExample()
            }
            let authored = lesson.examples.map { item in
                UIAction(title: item.title, state: selectedExample?.id == item.id ? .on : .off) { [weak self] _ in
                    self?.selectedExample = item
                    self?.stepIndex = 0
                    self?.render()
                }
            }
            exampleMenu.menu = UIMenu(title: "Worked example", children: [randomAction] + authored)
            exampleMenu.showsMenuAsPrimaryAction = true
            exampleMenu.configuration?.title = selectedExample?.title ?? "Random: \(randomProblem.left) \(randomProblem.operation.symbol) \(randomProblem.right)"
        }
        configureExpression(expression, problem: currentProblem, selected: [])
        // Keep the complete example/help group together when the walkthrough
        // replaces it, without imposing a fixed button width on scroll content.
        expression.isHidden = false
        problemRow.isHidden = isOpen && !currentSteps.isEmpty
        help.accessibilityLabel = "Click Here to Learn How!"
        help.accessibilityValue = isOpen ? "Expanded" : "Collapsed"
        walkthrough.isHidden = !isOpen
        renderStep()
    }

    private func renderStep() {
        stages.arrangedSubviews.forEach { stages.removeArrangedSubview($0); $0.removeFromSuperview() }
        stepContent.arrangedSubviews.forEach { stepContent.removeArrangedSubview($0); $0.removeFromSuperview() }
        let steps = currentSteps
        let finalAnswer = currentExample?.finalAnswer
        let isFinal = finalAnswer != nil && stepIndex == steps.count
        let currentStep = steps.indices.contains(stepIndex) ? steps[stepIndex] : nil
        let stageRow = AppTheme.stack(axis: traitCollection.preferredContentSizeCategory.isAccessibilityCategory ? .vertical : .horizontal, spacing: 8)
        stageRow.distribution = .fillEqually
        var shownLabels = Set<String>()
        var namedButtons = [MultiplicationStage: UIButton]()
        let grouped = lesson.id == "multiplication-2"
            && Set(steps.compactMap(\.stageName)) == Set(MultiplicationStage.allCases)
        for (index, step) in steps.enumerated() {
            guard let title = step.stageName?.rawValue ?? step.navigationLabel,
                  shownLabels.insert(title).inserted else { continue }
            let identifier = "stage-" + title.lowercased().replacingOccurrences(of: " ", with: "-")
            let button = AppTheme.button(title, identifier: identifier) { [weak self] in
                self?.stepIndex = index
                self?.renderStep()
            }
            button.configuration?.contentInsets = NSDirectionalEdgeInsets(top: 8, leading: 4, bottom: 8, trailing: 4)
            button.configuration?.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
                var attributes = incoming
                attributes.font = AppTheme.font(16)
                return attributes
            }
            if grouped, let stage = step.stageName {
                AppTheme.namedStage(stage, current: currentStep?.stageName == stage && !isFinal, button: button, traits: view.window?.traitCollection ?? traitCollection)
                namedButtons[stage] = button
            } else {
                AppTheme.selected((currentStep?.stageName?.rawValue ?? currentStep?.navigationLabel) == title && !isFinal, button: button, accent: AppTheme.accent(for: step.stageName))
                stageRow.addArrangedSubview(button)
            }
        }
        if !stageRow.arrangedSubviews.isEmpty { stages.addArrangedSubview(stageRow) }
        var finalButton: UIButton?
        if let finalAnswer {
            let final = AppTheme.button("Final Answer: \(finalAnswer)", identifier: "final-answer") { [weak self] in
                guard let self else { return }
                self.stepIndex = self.currentSteps.count
                self.renderStep()
            }
            if grouped {
                AppTheme.finalAnswer(finalAnswer, current: isFinal, button: final)
                finalButton = final
            } else {
                AppTheme.selected(isFinal, button: final)
                stages.addArrangedSubview(final)
            }
        }
        if grouped {
            let layout = namedStageLayout(answer: finalAnswer ?? "")
            groupedStageLayoutSignature = "\(layout.wide)-\(layout.middleStacked)"
            stages.addArrangedSubview(MultiplicationStageGroupView(buttons: namedButtons, finalButton: finalButton,
                wide: layout.wide, enlarged: traitCollection.preferredContentSizeCategory.isAccessibilityCategory,
                middleStacked: layout.middleStacked, productMinimum: layout.productMinimum, resultMinimum: layout.resultMinimum,
                traits: view.window?.traitCollection ?? traitCollection))
        } else { groupedStageLayoutSignature = nil }
        if isFinal, let finalAnswer {
            stepContent.addArrangedSubview(AppTheme.label("Final Answer", size: 22, bold: true))
            let result = ArithmeticExpressionView(fontSize: 44, identifier: "final-answer-expression")
            result.configure(left: currentProblem.left, right: currentProblem.right,
                             operation: currentProblem.operation, result: finalAnswer)
            stepContent.addArrangedSubview(result)
        } else if let step = currentStep {
            if let stage = step.stageName?.rawValue ?? step.navigationLabel {
                let label = AppTheme.label(stage, size: 22, bold: true, identifier: "stage-heading")
                label.textColor = AppTheme.accent(for: step.stageName)
                stepContent.addArrangedSubview(label)
            }
            if let title = step.stepLabel { stepContent.addArrangedSubview(AppTheme.label(title, size: 19)) }
            let selectedExpression = ArithmeticExpressionView(fontSize: 58, identifier: "instruction-expression")
            selectedExpression.configure(left: currentProblem.left, right: currentProblem.right, operation: currentProblem.operation,
                                         selected: step.highlightedDigitRefs ?? [], accent: AppTheme.accent(for: step.stageName),
                                         connectPair: hasExplicitPairing(step: step, problem: currentProblem))
            stepContent.addArrangedSubview(selectedExpression)
            if let narration = step.narration { stepContent.addArrangedSubview(AppTheme.label(narration, size: 20, identifier: "step-narration")) }
            if let terms = step.calculationTerms, !terms.isEmpty {
                stepContent.addArrangedSubview(AppTheme.label("Calculation", size: 15))
                for (index, term) in terms.enumerated() {
                    let calculation = ArithmeticExpressionView(fontSize: 38, identifier: index == 0 ? "step-operation" : "step-operation-\(index)")
                    calculation.configure(left: term.left, right: term.right, operation: term.operation)
                    stepContent.addArrangedSubview(calculation)
                }
            } else {
                addDetail("Calculation", step.operationDisplay, identifier: "step-operation")
            }
            addDetail("Intermediate result", step.intermediateResult, identifier: "step-intermediate-result")
            if step.carryIn != nil || step.carryOut != nil { stepContent.addArrangedSubview(CarryRouteView(step: step)) }
            addDetail("Answer digits so far", step.visibleResultDigits, identifier: "step-result-digits")
            addDetail("Carry in", step.carryIn, identifier: "carry-in")
            addDetail("Carry out", step.carryOut, identifier: "carry-out")
            addDetail("Carry from", step.carryFromLabel, identifier: "carry-from")
            addDetail("Carry to", step.carryToLabel, identifier: "carry-to")
        } else {
            stepContent.addArrangedSubview(AppTheme.label("The authored instructional steps for this lesson are pending.",
                                                        size: 18, identifier: "walkthrough-status"))
        }
        navigation.isHidden = screenCount == 0
        position.text = screenCount > 0 ? "\(stepIndex + 1) / \(screenCount)" : ""
        back.isEnabled = stepIndex > 0
        nextButton.isEnabled = stepIndex < screenCount - 1
    }

    private func addDetail(_ heading: String, _ value: String?, identifier: String) {
        guard let value else { return }
        let row = AppTheme.stack(spacing: 5)
        row.addArrangedSubview(AppTheme.label(heading, size: 15))
        if identifier == "step-result-digits" {
            let answer = DevelopingAnswerLabel()
            answer.text = value
            answer.font = AppTheme.mathFont(28)
            answer.adjustsFontForContentSizeCategory = true
            answer.accessibilityIdentifier = identifier
            answer.accessibilityLabel = value
            answer.accessibilityHint = "Answer digits so far"
            answer.translatesAutoresizingMaskIntoConstraints = false
            answer.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
            row.addArrangedSubview(answer)
        } else {
            row.addArrangedSubview(AppTheme.label(value, size: 26, identifier: identifier,
                mathematics: !["carry-from", "carry-to"].contains(identifier)))
        }
        stepContent.addArrangedSubview(row)
    }

    /// Decide from the complete measured diagram, not a width breakpoint alone.
    /// Each value below is typography/spacing only; no arithmetic is performed.
    private func namedStageLayout(answer: String) -> (wide: Bool, middleStacked: Bool, productMinimum: CGFloat, resultMinimum: CGFloat) {
        let traits = view.window?.traitCollection ?? traitCollection
        let base = UIFont(name: "Baskerville-Bold", size: 16) ?? UIFont.boldSystemFont(ofSize: 16)
        let text = UIFontMetrics(forTextStyle: .body).scaledFont(for: base, compatibleWith: traits)
        let digits = AppTheme.mathFont(16, bold: true, compatibleWith: traits)
        func word(_ value: String, font: UIFont) -> CGFloat { ceil((value as NSString).size(withAttributes: [.font: font]).width) }
        let widths = MultiplicationStage.allCases.map { word($0.rawValue, font: text) + 32 }
        let plus = word("+", font: AppTheme.mathFont(22, bold: true, compatibleWith: traits))
        let middle = widths[1] + widths[2] + plus + 16 + 16
        let ampersands = word("&", font: AppTheme.mathFont(20, compatibleWith: traits)) * 2
        let product = widths[0] + middle + widths[3] + ampersands + 32 + 24
        let final = word("Final Answer: ", font: text) + word(answer, font: digits) + 32
        let result = final + word("=", font: AppTheme.mathFont(28, compatibleWith: traits)) + 8
        let enlarged = traits.preferredContentSizeCategory.isAccessibilityCategory
        let wide = !enlarged && content.bounds.width >= max(760, product + result + 12 + 4)
        return (wide, enlarged || (!wide && middle > content.bounds.width - 24), product, result)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        if let previous = groupedStageLayoutSignature {
            let layout = namedStageLayout(answer: currentExample?.finalAnswer ?? "")
            if previous != "\(layout.wide)-\(layout.middleStacked)" { renderStep() }
        }
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        if previousTraitCollection?.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory {
            for row in catalogRows { row.axis = traitCollection.preferredContentSizeCategory.isAccessibilityCategory ? .vertical : .horizontal }
            walkthroughHeader?.axis = traitCollection.preferredContentSizeCategory.isAccessibilityCategory ? .vertical : .horizontal
            navigation.axis = traitCollection.preferredContentSizeCategory.isAccessibilityCategory ? .vertical : .horizontal
            if isViewLoaded { render() }
        }
    }

    /// Draw a connector only when the existing single calculation explicitly
    /// agrees with exactly one selected digit from each operand. Carry sums and
    /// multi-product groups remain unconnected rather than implying a new pair.
    private func hasExplicitPairing(step: InstructionStep, problem: WorkedExample) -> Bool {
        guard let refs = step.highlightedDigitRefs, refs.count == 2,
              let leftRef = refs.first(where: { $0.hasPrefix("left:") }),
              let rightRef = refs.first(where: { $0.hasPrefix("right:") }),
              let leftIndex = Int(leftRef.dropFirst(5)), let rightIndex = Int(rightRef.dropFirst(6)),
              leftIndex < problem.left.count, rightIndex < problem.right.count,
              let operation = step.operationDisplay else { return false }
        let left = Array(problem.left)[leftIndex], right = Array(problem.right)[rightIndex]
        let prefix = "\(left) \(problem.operation.symbol) \(right)"
        guard operation.hasPrefix(prefix) else { return false }
        let remainder = String(operation.dropFirst(prefix.count))
        return remainder.isEmpty || remainder.hasPrefix(" = ") || remainder.hasPrefix("; ")
    }

    private func move(_ direction: Int) {
        let index = stepIndex + direction
        guard index >= 0 && index < screenCount else { return }
        stepIndex = index
        renderStep()
        showWalkthrough()
    }

    private func showWalkthrough() {
        view.layoutIfNeeded()
        let desired = walkthrough.convert(walkthrough.bounds, to: scroll).minY - 12
        let maximum = max(0, scroll.contentSize.height - scroll.bounds.height + scroll.adjustedContentInset.bottom)
        scroll.setContentOffset(CGPoint(x: 0, y: min(max(0, desired), maximum)), animated: false)
    }

    private func configureExpression(_ view: ArithmeticExpressionView, problem: WorkedExample, selected: [String]) {
        view.configure(left: problem.left, right: problem.right, operation: problem.operation, selected: selected)
    }
}
