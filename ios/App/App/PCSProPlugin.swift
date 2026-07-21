import Capacitor
import SwiftUI
import UIKit

/// Capacitor plugin — exposes the PCS Pro subscription state and the
/// feature paywall to the React web layer. Live (not compile-gated):
/// written against the Capacitor 8 SPM plugin API and registered via
/// "PCSProPlugin" in packageClassList in capacitor.config.json.
///
/// JavaScript usage:
///   const plugin = window.Capacitor?.Plugins?.PCSProPlugin;
///   const { active, loading } = await plugin.getStatus();
///   const { active } = await plugin.showPaywall(); // resolves after dismissal
///   const { active } = await plugin.restore();
///   plugin.addListener('prostatus', ({ active }) => { ... });
@objc(PCSProPlugin)
public class PCSProPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "PCSProPlugin"
    public let jsName = "PCSProPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showPaywall", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
    ]

    private var statusObserver: NSObjectProtocol?

    public override func load() {
        // Relay entitlement changes (purchase, restore, renewal, revocation)
        // to the web layer as a "prostatus" plugin event.
        statusObserver = NotificationCenter.default.addObserver(
            forName: .pcsProStatusChanged, object: nil, queue: .main
        ) { [weak self] note in
            let active = (note.userInfo?["active"] as? Bool) ?? false
            self?.notifyListeners("prostatus", data: ["active": active])
        }
        // Touch the shared manager so the entitlement check starts at app
        // boot rather than on first getStatus() call.
        Task { @MainActor in _ = PCSProManager.shared }
    }

    deinit {
        if let statusObserver {
            NotificationCenter.default.removeObserver(statusObserver)
        }
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        Task { @MainActor in
            let pro = PCSProManager.shared
            call.resolve(["active": pro.isPro, "loading": pro.isLoading])
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task { @MainActor in
            let pro = PCSProManager.shared
            await pro.restore()
            call.resolve(["active": pro.isPro])
        }
    }

    @objc func showPaywall(_ call: CAPPluginCall) {
        Task { @MainActor in
            let pro = PCSProManager.shared
            if pro.isPro {
                call.resolve(["active": true])
                return
            }
            guard let base = self.bridge?.viewController else {
                call.reject("No view controller available to present the paywall")
                return
            }
            // Present above whatever is currently on screen (e.g. a native
            // module sheet), not under it.
            var top = base
            while let presented = top.presentedViewController { top = presented }

            let host = PaywallHostingController(rootView: PCSProPaywallView(onClose: nil))
            host.rootView = PCSProPaywallView(onClose: { [weak host] in
                host?.dismiss(animated: true)
            })
            host.modalPresentationStyle = .formSheet
            // Resolve only after the sheet is fully gone — covers the close
            // button, auto-dismiss on purchase, AND interactive swipe-down.
            host.onDismiss = {
                Task { @MainActor in
                    call.resolve(["active": PCSProManager.shared.isPro])
                }
            }
            top.present(host, animated: true)
        }
    }
}

/// Storyboard root view controller. Registers the in-app PCSProPlugin
/// durably: `npx cap sync` regenerates packageClassList in the copied
/// ios/App/App/capacitor.config.json from npm plugin sources only, so a
/// hand-added first-party entry is silently dropped on every sync. The
/// config entry is still kept (it works between syncs and documents
/// intent); this hook is the guarantee. Guarded so the plugin is never
/// registered twice when the config entry IS present.
@objc(AppViewController)
class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        if bridge?.plugin(withName: "PCSProPlugin") == nil {
            bridge?.registerPluginInstance(PCSProPlugin())
        }
    }
}

/// UIHostingController that reports its own dismissal exactly once —
/// viewDidDisappear fires for programmatic dismissal and for the user's
/// interactive swipe-down alike.
private final class PaywallHostingController: UIHostingController<PCSProPaywallView> {
    var onDismiss: (() -> Void)?

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        if isBeingDismissed || presentingViewController == nil {
            onDismiss?()
            onDismiss = nil
        }
    }
}
