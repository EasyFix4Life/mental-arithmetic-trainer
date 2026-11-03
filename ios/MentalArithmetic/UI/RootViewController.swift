import UIKit

final class RootViewController: UIViewController {
    private let mode = ScholarlySegmentedControl(items: ["Learn", "Practice"])
    private let modeContainer = UIView()
    private let container = UIView()
    private lazy var practice = PracticeViewController()
    private lazy var learn = LearnViewController()
    private var displayed: UIViewController?
    private var modeHeight: NSLayoutConstraint!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = AppTheme.background
        view.tintColor = AppTheme.ink
        mode.selectedSegmentIndex = 1
        mode.accessibilityIdentifier = "mode-control"
        AppTheme.styleSegments(mode)
        mode.addTarget(self, action: #selector(changeMode), for: .valueChanged)
        mode.translatesAutoresizingMaskIntoConstraints = false
        modeContainer.translatesAutoresizingMaskIntoConstraints = false
        container.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(modeContainer)
        modeContainer.addSubview(mode)
        view.addSubview(container)
        modeHeight = modeContainer.heightAnchor.constraint(equalToConstant: 60)
        NSLayoutConstraint.activate([
            modeContainer.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            modeContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            modeContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            modeHeight,
            mode.centerXAnchor.constraint(equalTo: modeContainer.centerXAnchor),
            mode.topAnchor.constraint(equalTo: modeContainer.topAnchor, constant: 8),
            mode.widthAnchor.constraint(equalTo: modeContainer.widthAnchor, constant: -48),
            mode.heightAnchor.constraint(equalToConstant: 44),
            container.topAnchor.constraint(equalTo: modeContainer.bottomAnchor),
            container.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            container.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            container.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
        ])
        practice.onActiveChange = { [weak self] active in
            guard let self else { return }
            self.modeContainer.isHidden = active
            self.modeHeight.constant = active ? 0 : 60
            self.view.layoutIfNeeded()
        }
        show(practice)
    }

    @objc private func changeMode() {
        show(mode.selectedSegmentIndex == 0 ? learn : practice)
    }

    private func show(_ controller: UIViewController) {
        guard displayed !== controller else { return }
        displayed?.willMove(toParent: nil)
        displayed?.view.removeFromSuperview()
        displayed?.removeFromParent()
        addChild(controller)
        container.addSubview(controller.view)
        controller.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            controller.view.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            controller.view.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            controller.view.topAnchor.constraint(equalTo: container.topAnchor),
            controller.view.bottomAnchor.constraint(equalTo: container.bottomAnchor)
        ])
        controller.didMove(toParent: self)
        displayed = controller
    }
}
