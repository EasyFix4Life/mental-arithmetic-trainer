import UIKit

final class PrivacyViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Privacy"
        view.backgroundColor = AppTheme.background
        navigationController?.navigationBar.tintColor = AppTheme.ink
        navigationItem.rightBarButtonItem = UIBarButtonItem(systemItem: .done,
            primaryAction: UIAction { [weak self] _ in self?.dismiss(animated: false) })
        let text = UITextView()
        text.translatesAutoresizingMaskIntoConstraints = false
        text.backgroundColor = .clear
        text.textColor = AppTheme.ink
        text.font = AppTheme.font(20)
        text.isEditable = false
        text.isSelectable = true
        text.accessibilityIdentifier = "privacy-policy-text"
        text.text = """
        Mental Arithmetic works entirely on your device.

        The app has no accounts, advertisements, analytics, tracking, or app network requests. It does not request access to your contacts, photos, camera, microphone, or location.

        Your current practice score and answer times stay in memory during the current session. They are not sent anywhere or saved as a history. They reset when the app process exits.

        The app does not collect personal data.
        """
        view.addSubview(text)
        NSLayoutConstraint.activate([
            text.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            text.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            text.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            text.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16)
        ])
    }
}
