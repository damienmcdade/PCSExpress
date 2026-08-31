import XCTest
import StoreKit
import StoreKitTest
import SwiftUI
@testable import App

/// Renders the production PCS Pro paywall (PCSProPaywallView) with real
/// StoreKit-test products and writes PNGs for the App Store Connect
/// subscription review screenshot. Run:
///   xcodebuild test -scheme App -only-testing:AppTests/PaywallScreenshotTests
@MainActor
final class PaywallScreenshotTests: XCTestCase {

    func testRenderPaywallScreenshot() async throws {
        let cfgPath = ProcessInfo.processInfo.environment["STOREKIT_CONFIG"]
            ?? "/Users/damiengantt-mcdade/PCSExpress/ios/App/App/Products.storekit"
        let session = try SKTestSession(contentsOf: URL(fileURLWithPath: cfgPath))
        session.resetToDefaultState()
        session.disableDialogs = true

        // Direct fetch first — surfaces the underlying StoreKit error.
        do {
            let direct = try await Product.products(
                for: ["app.pcsexpress.pro.monthly", "app.pcsexpress.pro.yearly"])
            print("SCREENSHOT-DIAG direct products: \(direct.map(\.id))")
        } catch {
            print("SCREENSHOT-DIAG products error: \(error)")
        }

        // Let the manager pick up the test-session products.
        var tries = 0
        await PCSProManager.shared.refresh()
        while (PCSProManager.shared.yearlyProduct == nil
               || PCSProManager.shared.monthlyProduct == nil) && tries < 24 {
            try await Task.sleep(nanoseconds: 250_000_000)
            await PCSProManager.shared.refresh()
            tries += 1
        }
        print("SCREENSHOT-DIAG manager monthly=\(String(describing: PCSProManager.shared.monthlyProduct?.id)) yearly=\(String(describing: PCSProManager.shared.yearlyProduct?.id))")

        // Mount the real paywall in a window — drawHierarchy renders the
        // full UIKit-backed tree (ScrollView included), unlike ImageRenderer.
        let size = CGSize(width: 428, height: 926)
        let host = UIHostingController(rootView: PCSProPaywallView(onClose: nil))
        let window = UIWindow(frame: CGRect(origin: .zero, size: size))
        window.rootViewController = host
        window.windowLevel = .alert + 1
        window.makeKeyAndVisible()
        host.view.layoutIfNeeded()

        // Give SwiftUI a few runloop turns to settle async state.
        for _ in 0..<12 {
            try await Task.sleep(nanoseconds: 250_000_000)
        }

        let fmt = UIGraphicsImageRendererFormat()
        fmt.scale = 3
        fmt.opaque = true
        let shot = UIGraphicsImageRenderer(bounds: window.bounds, format: fmt).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        try shot.pngData()!.write(to: URL(fileURLWithPath: "/tmp/pcs_paywall_framed.png"))

        // Also capture the lower half (scrolled) for a stitched/full view if needed.
        if let scrollView = findScrollView(in: host.view) {
            let maxOffset = max(0, scrollView.contentSize.height - scrollView.bounds.height)
            scrollView.setContentOffset(CGPoint(x: 0, y: maxOffset), animated: false)
            for _ in 0..<4 { try await Task.sleep(nanoseconds: 150_000_000) }
            let shot2 = UIGraphicsImageRenderer(bounds: window.bounds, format: fmt).image { _ in
                window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
            }
            try shot2.pngData()!.write(to: URL(fileURLWithPath: "/tmp/pcs_paywall_bottom.png"))
        }

        if PCSProManager.shared.monthlyProduct == nil { print("SCREENSHOT-DIAG rendering with fallback display values (StoreKitTest served no products)") }
        
    }

    private func findScrollView(in view: UIView) -> UIScrollView? {
        if let sv = view as? UIScrollView { return sv }
        for sub in view.subviews {
            if let found = findScrollView(in: sub) { return found }
        }
        return nil
    }
}
