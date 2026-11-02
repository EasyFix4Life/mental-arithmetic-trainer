import UIKit

final class PracticeViewController: UIViewController, UITextFieldDelegate {
    var onActiveChange: ((Bool) -> Void)?

    private let controller = RoundController()
    private let setupScroll = UIScrollView()
    private let setup = AppTheme.stack(spacing: 28, alignment: .center)
    private let titleLabel = AppTheme.label("Mental Arithmetic", size: 32)
    private let scoreLabel = AppTheme.label(size: 76, identifier: "round-score")
    private let summary = AppTheme.stack(axis: .horizontal, spacing: 12)
    private let maximum = AppTheme.label(size: 24, identifier: "maximum-time")
    private let minimum = AppTheme.label(size: 24, identifier: "minimum-time")
    private let average = AppTheme.label(size: 24, identifier: "average-time")
    private let operation = UISegmentedControl(items: ["Addition", "Multiplication"])
    private let digits = UISegmentedControl(items: ["2"])
    private var digitChoices = PracticeSettings.availableDigits(for: .addition)
    private lazy var startButton = AppTheme.button("Start", identifier: "practice-start") { [weak self] in
        self?.startRound()
    }
    private let exercise = UIView()
    private let previous = AppTheme.label(size: 30, identifier: "previous-time")
    private let problem = ArithmeticExpressionView(fontSize: 72, identifier: "practice-problem")
    private let answer = UITextField()
    private let live = AppTheme.label("0.0", size: 30, identifier: "live-time")
    private let answerRow = AppTheme.stack(axis: .horizontal, spacing: 16, alignment: .center)
    private var timer: Timer?
    private var previousTop: NSLayoutConstraint!
    private var answerBottom: NSLayoutConstraint!
    private var answerMinimumHeight: NSLayoutConstraint!
    private var availableTop: NSLayoutConstraint!
    private var availableBottom: NSLayoutConstraint!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = AppTheme.background
        buildSetup()
        buildExercise()
        render()
    }

    isolated deinit { timer?.invalidate() }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        let compact = view.bounds.height < 400
        let size: CGFloat = compact ? (controller.snapshot.problem?.operation == .addition ? 26 : 40) : 72
        if problem.fontSize != size, let current = controller.snapshot.problem {
            problem.fontSize = size
            problem.configure(left: String(current.left), right: String(current.right), operation: current.operation)
        }
        previous.font = AppTheme.font(compact ? 20 : 30)
        answer.font = AppTheme.font(compact ? 32 : 46)
        live.font = AppTheme.font(compact ? 24 : 30)
        previousTop.constant = compact ? 4 : 16
        answerBottom.constant = compact ? -8 : -16
        answerMinimumHeight.constant = compact ? 44 : 60
        availableTop.constant = compact ? 4 : 12
        availableBottom.constant = compact ? -4 : -12
    }

    private func buildSetup() {
        setupScroll.translatesAutoresizingMaskIntoConstraints = false
        setupScroll.alwaysBounceVertical = false
        setupScroll.keyboardDismissMode = .none
        view.addSubview(setupScroll)
        setupScroll.addSubview(setup)
        let width = setup.widthAnchor.constraint(equalTo: setupScroll.frameLayoutGuide.widthAnchor, constant: -40)
        width.priority = .defaultHigh
        let center = setup.centerYAnchor.constraint(equalTo: setupScroll.frameLayoutGuide.centerYAnchor)
        center.priority = .defaultLow
        NSLayoutConstraint.activate([
            setupScroll.topAnchor.constraint(equalTo: view.topAnchor),
            setupScroll.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            setupScroll.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            setupScroll.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            setup.centerXAnchor.constraint(equalTo: setupScroll.frameLayoutGuide.centerXAnchor),
            width,
            setup.widthAnchor.constraint(lessThanOrEqualToConstant: 650),
            setup.topAnchor.constraint(greaterThanOrEqualTo: setupScroll.contentLayoutGuide.topAnchor, constant: 24),
            setup.bottomAnchor.constraint(lessThanOrEqualTo: setupScroll.contentLayoutGuide.bottomAnchor, constant: -24),
            center
        ])
        titleLabel.textAlignment = .center
        scoreLabel.textAlignment = .center
        scoreLabel.accessibilityLabel = "Round score"
        setup.addArrangedSubview(titleLabel)
        setup.addArrangedSubview(scoreLabel)
        summary.distribution = .fillEqually
        for (heading, value) in [("Maximum time", maximum), ("Minimum time", minimum), ("Average time", average)] {
            let column = AppTheme.stack(spacing: 8, alignment: .center)
            let label = AppTheme.label(heading, size: 15)
            label.textAlignment = .center
            value.textAlignment = .center
            value.numberOfLines = 1
            value.adjustsFontSizeToFitWidth = true
            value.minimumScaleFactor = 0.55
            column.addArrangedSubview(label)
            column.addArrangedSubview(value)
            summary.addArrangedSubview(column)
        }
        setup.addArrangedSubview(summary)
        summary.widthAnchor.constraint(equalTo: setup.widthAnchor).isActive = true
        let settings = AppTheme.stack(spacing: 24)
        for (label, control) in [("Operation", operation), ("Digits per operand", digits)] {
            let field = AppTheme.stack(spacing: 10)
            field.addArrangedSubview(AppTheme.label(label))
            control.selectedSegmentIndex = 0
            control.translatesAutoresizingMaskIntoConstraints = false
            control.selectedSegmentTintColor = AppTheme.highlight
            control.setTitleTextAttributes([.font: AppTheme.font(18), .foregroundColor: AppTheme.ink], for: .normal)
            control.heightAnchor.constraint(equalToConstant: 48).isActive = true
            field.addArrangedSubview(control)
            settings.addArrangedSubview(field)
        }
        operation.accessibilityIdentifier = "operation-control"
        operation.accessibilityLabel = "Operation"
        digits.accessibilityIdentifier = "digit-count-control"
        digits.accessibilityLabel = "Digits per operand"
        operation.addTarget(self, action: #selector(operationChanged), for: .valueChanged)
        setup.addArrangedSubview(settings)
        settings.widthAnchor.constraint(equalTo: setup.widthAnchor).isActive = true
        setup.addArrangedSubview(startButton)
        setup.addArrangedSubview(AppTheme.button("Privacy", identifier: "privacy-policy") { [weak self] in
            guard let self else { return }
            let privacy = UINavigationController(rootViewController: PrivacyViewController())
            self.present(privacy, animated: false)
        })
    }

    private func buildExercise() {
        exercise.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(exercise)
        let answerWidth = answer.widthAnchor.constraint(equalTo: exercise.widthAnchor, multiplier: 0.56)
        answerWidth.priority = .defaultHigh
        NSLayoutConstraint.activate([
            exercise.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            exercise.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            exercise.topAnchor.constraint(equalTo: view.topAnchor),
            exercise.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        exercise.addSubview(previous)
        exercise.addSubview(problem)
        answer.delegate = self
        answer.keyboardType = .numberPad
        answer.returnKeyType = .default
        answer.autocorrectionType = .no
        answer.autocapitalizationType = .none
        answer.spellCheckingType = .no
        answer.smartQuotesType = .no
        answer.smartDashesType = .no
        answer.smartInsertDeleteType = .no
        answer.textContentType = nil
        answer.font = AppTheme.font(46)
        answer.textColor = AppTheme.ink
        answer.tintColor = AppTheme.ink
        answer.textAlignment = .right
        answer.accessibilityIdentifier = "answer-field"
        answer.accessibilityLabel = "Answer"
        answer.translatesAutoresizingMaskIntoConstraints = false
        let underline = UIView()
        underline.backgroundColor = AppTheme.border
        underline.translatesAutoresizingMaskIntoConstraints = false
        answer.addSubview(underline)
        NSLayoutConstraint.activate([
            underline.heightAnchor.constraint(equalToConstant: 2),
            underline.leadingAnchor.constraint(equalTo: answer.leadingAnchor),
            underline.trailingAnchor.constraint(equalTo: answer.trailingAnchor),
            underline.bottomAnchor.constraint(equalTo: answer.bottomAnchor)
        ])
        live.numberOfLines = 1
        live.textAlignment = .right
        live.accessibilityLabel = "Current elapsed seconds"
        live.setContentCompressionResistancePriority(.required, for: .horizontal)
        answerRow.addArrangedSubview(answer)
        answerRow.addArrangedSubview(live)
        exercise.addSubview(answerRow)
        let available = UILayoutGuide()
        exercise.addLayoutGuide(available)
        previousTop = previous.topAnchor.constraint(equalTo: exercise.safeAreaLayoutGuide.topAnchor, constant: 16)
        answerBottom = answerRow.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor, constant: -16)
        answerMinimumHeight = answer.heightAnchor.constraint(greaterThanOrEqualToConstant: 60)
        availableTop = available.topAnchor.constraint(equalTo: previous.bottomAnchor, constant: 12)
        availableBottom = available.bottomAnchor.constraint(equalTo: answerRow.topAnchor, constant: -12)
        NSLayoutConstraint.activate([
            previousTop,
            previous.leadingAnchor.constraint(equalTo: exercise.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            previous.trailingAnchor.constraint(lessThanOrEqualTo: exercise.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            answerRow.trailingAnchor.constraint(equalTo: exercise.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            answerRow.leadingAnchor.constraint(greaterThanOrEqualTo: exercise.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            answerBottom,
            answerWidth,
            answer.widthAnchor.constraint(lessThanOrEqualToConstant: 290),
            answerMinimumHeight,
            live.widthAnchor.constraint(greaterThanOrEqualToConstant: 64),
            availableTop,
            availableBottom,
            available.leadingAnchor.constraint(equalTo: exercise.leadingAnchor),
            available.trailingAnchor.constraint(equalTo: exercise.trailingAnchor),
            problem.centerXAnchor.constraint(equalTo: available.centerXAnchor),
            problem.centerYAnchor.constraint(equalTo: available.centerYAnchor),
            problem.leadingAnchor.constraint(equalTo: exercise.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            problem.trailingAnchor.constraint(equalTo: exercise.safeAreaLayoutGuide.trailingAnchor, constant: -20)
        ])
    }

    @objc private func operationChanged() {
        let previous = digitChoices.indices.contains(digits.selectedSegmentIndex)
            ? digitChoices[digits.selectedSegmentIndex] : .two
        let selectedOperation: ArithmeticOperation = operation.selectedSegmentIndex == 0 ? .addition : .multiplication
        let selection = PracticeSettings.appSelection(operation: selectedOperation, digitCount: previous)
        digitChoices = PracticeSettings.availableDigits(for: selectedOperation)
        digits.removeAllSegments()
        for (index, value) in digitChoices.enumerated() {
            digits.insertSegment(withTitle: String(value.rawValue), at: index, animated: false)
        }
        digits.selectedSegmentIndex = digitChoices.firstIndex(of: selection.digitCount) ?? 0
    }

    private func startRound() {
        let selected = digitChoices.indices.contains(digits.selectedSegmentIndex)
            ? digitChoices[digits.selectedSegmentIndex] : .two
        let settings = PracticeSettings.appSelection(
            operation: operation.selectedSegmentIndex == 0 ? .addition : .multiplication, digitCount: selected)
        do {
            try controller.start(settings: settings)
            render()
            answer.becomeFirstResponder()
        } catch {
            let alert = UIAlertController(title: "Could not start round", message: error.localizedDescription, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            present(alert, animated: false)
        }
    }

    private func render() {
        timer?.invalidate()
        timer = nil
        let state = controller.snapshot
        let active = state.phase == .active && state.problem != nil
        setupScroll.isHidden = active
        exercise.isHidden = !active
        answer.isEnabled = active
        answer.text = ""
        live.text = "0.0"
        live.accessibilityValue = "0.0"
        previous.isHidden = !active || state.previous == nil
        onActiveChange?(active)
        if active, let current = state.problem {
            problem.configure(left: String(current.left), right: String(current.right), operation: current.operation)
            answer.accessibilityHint = "Submits automatically after \(current.expectedDigits) digits."
            if let last = state.previous {
                let time = Timing.formatTenths(last.elapsedMs)
                previous.text = time
                previous.textColor = last.correct ? .black : AppTheme.incorrect
                previous.accessibilityLabel = "Previous answer \(last.correct ? "correct" : "incorrect"), \(time) seconds"
            }
            let timer = Timer(timeInterval: 0.05, repeats: true) { [weak self] _ in
                // This timer is installed only on RunLoop.main below.
                MainActor.assumeIsolated {
                    guard let self, self.controller.snapshot.phase == .active else { return }
                    let time = Timing.formatTenths(self.controller.elapsed())
                    self.live.text = time
                    self.live.accessibilityValue = time
                }
            }
            RunLoop.main.add(timer, forMode: .common)
            self.timer = timer
        } else {
            answer.resignFirstResponder()
            let finished = state.phase == .finished
            titleLabel.isHidden = finished
            scoreLabel.isHidden = !finished
            scoreLabel.text = "\(state.correctCount) / 10"
            scoreLabel.accessibilityValue = "\(state.correctCount) out of 10"
            summary.isHidden = !finished
            if let timing = state.timingSummary {
                maximum.text = Timing.formatTenths(timing.maximumMs) + " s"
                minimum.text = Timing.formatTenths(timing.minimumMs) + " s"
                average.text = Timing.formatTenths(timing.averageMs) + " s"
            }
            startButton.configuration?.title = finished ? "Start Another Round" : "Start"
        }
    }

    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange,
                   replacementString string: String) -> Bool {
        // Keep the same isolated transaction policy as the web app: a single
        // overlong paste is one wrong answer; later key events own the next problem.
        guard controller.snapshot.phase == .active,
              let current = controller.snapshot.problem,
              InputPolicy.isDecimalEntry(string),
              let text = textField.text,
              let swiftRange = Range(range, in: text) else { return false }
        let candidate = text.replacingCharacters(in: swiftRange, with: string)
        guard InputPolicy.isDecimalEntry(candidate) else { return false }
        if controller.submit(problemID: current.id, input: candidate) {
            render()
            return false
        }
        return true
    }

    func textFieldShouldReturn(_ textField: UITextField) -> Bool { false }
}
