import UIKit

final class LearnViewController: UIViewController {
    private let scroll = UIScrollView()
    private let content = AppTheme.stack(spacing: 20)
    private var lesson = LessonCatalog.lessons.first(where: { $0.id == "addition-2" })!
    private var randomProblem: WorkedExample!
    private var randomExample: AuthoredExample?
    private var selectedExample: AuthoredExample?
    private var stepIndex = 0
    private var isOpen = false
    private var lessonButtons = [String: UIButton]()
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
    private let position = AppTheme.label(size: 18, identifier: "step-position")
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
            let row = AppTheme.stack(axis: .horizontal, spacing: 8)
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
        help.layer.cornerRadius = 8
        help.layer.borderWidth = 2
        help.backgroundColor = AppTheme.highlight
        help.accessibilityLabel = "Click Here to Learn How!"
        help.accessibilityHint = "Opens the instructional walkthrough for this lesson."
        content.addArrangedSubview(problemRow)
        let header = AppTheme.stack(axis: .horizontal, spacing: 16, alignment: .center)
        let walkthroughHeading = AppTheme.label("Instructional walkthrough", size: 21, bold: true)
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
        let stageRow = AppTheme.stack(axis: .horizontal, spacing: 6)
        stageRow.distribution = .fillEqually
        var shownLabels = Set<String>()
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
            AppTheme.selected((currentStep?.stageName?.rawValue ?? currentStep?.navigationLabel) == title && !isFinal, button: button)
            stageRow.addArrangedSubview(button)
        }
        if !stageRow.arrangedSubviews.isEmpty { stages.addArrangedSubview(stageRow) }
        if let finalAnswer {
            let final = AppTheme.button("Final answer: \(finalAnswer)", identifier: "final-answer") { [weak self] in
                guard let self else { return }
                self.stepIndex = self.currentSteps.count
                self.renderStep()
            }
            AppTheme.selected(isFinal, button: final)
            stages.addArrangedSubview(final)
        }
        if isFinal, let finalAnswer {
            stepContent.addArrangedSubview(AppTheme.label("Final answer", size: 22, bold: true))
            let result = ArithmeticExpressionView(fontSize: 44, identifier: "final-answer-expression")
            result.configure(left: currentProblem.left, right: currentProblem.right,
                             operation: currentProblem.operation, result: finalAnswer)
            stepContent.addArrangedSubview(result)
        } else if let step = currentStep {
            if let stage = step.stageName?.rawValue ?? step.navigationLabel {
                stepContent.addArrangedSubview(AppTheme.label(stage, size: 22, bold: true))
            }
            if let title = step.stepLabel { stepContent.addArrangedSubview(AppTheme.label(title, size: 19)) }
            let selectedExpression = ArithmeticExpressionView(fontSize: 58, identifier: "instruction-expression")
            configureExpression(selectedExpression, problem: currentProblem, selected: step.highlightedDigitRefs ?? [])
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
        row.addArrangedSubview(AppTheme.label(value, size: 26, identifier: identifier))
        stepContent.addArrangedSubview(row)
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
