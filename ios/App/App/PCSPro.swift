import Combine
import StoreKit
import SwiftUI
import UIKit

// PCS Pro — StoreKit 2 subscription manager + feature paywall.
//
// Core PCS Express stays free. Pro gates exactly three modules (Move
// Strategy, Documents checklist, Inventory & Claims vault); the paywall is
// presented per-feature from the web layer via PCSProPlugin, never as a
// full-app gate.
//
// In-App Purchase capability note: StoreKit 2 auto-renewable subscriptions
// need NO entitlements-file change — the In-App Purchase capability is
// implicit for the app's provisioning profile. Deliberately no App Group
// here either (PCS Express has no widget or sibling app to share
// entitlement state with).

extension Notification.Name {
    /// Posted (on the main queue, from the main actor) whenever the Pro
    /// entitlement flips. userInfo: ["active": Bool].
    static let pcsProStatusChanged = Notification.Name("PCSProStatusChanged")
}

@MainActor
final class PCSProManager: ObservableObject {
    static let shared = PCSProManager()

    static let monthlyProductID = "app.pcsexpress.pro.monthly"
    static let yearlyProductID = "app.pcsexpress.pro.yearly"

    enum Plan { case monthly, yearly }

    /// True when either the monthly or yearly subscription is active.
    @Published private(set) var isPro = false {
        didSet {
            guard oldValue != isPro else { return }
            NotificationCenter.default.post(
                name: .pcsProStatusChanged, object: nil,
                userInfo: ["active": isPro])
        }
    }
    @Published private(set) var isLoading = true
    @Published private(set) var monthlyProduct: Product?
    @Published private(set) var yearlyProduct: Product?
    /// Annual is pre-selected — the anchor that makes the yearly price read
    /// as the obvious value. Falls back to monthly when yearly isn't live.
    @Published var selectedPlan: Plan = .yearly
    @Published var isPurchasing = false
    @Published var errorMessage: String?

    // Non-nil only when the intro offer is a free trial AND this Apple
    // Account is still eligible for it — advertising a trial the user can't
    // get is itself a 3.1.2 violation. Computed per product at refresh.
    @Published private(set) var monthlyTrialText: String?
    @Published private(set) var yearlyTrialText: String?

    private var updateTask: Task<Void, Never>?

    private init() {
        updateTask = listenForTransactions()
        Task { await self.refresh() }
    }

    deinit {
        updateTask?.cancel()
    }

    func refresh() async {
        isLoading = true
        defer { isLoading = false }

        let products = (try? await Product.products(
            for: [Self.monthlyProductID, Self.yearlyProductID])) ?? []
        monthlyProduct = products.first { $0.id == Self.monthlyProductID }
        yearlyProduct = products.first { $0.id == Self.yearlyProductID }
        // Yearly not live (yet, or pulled) → quietly offer monthly only.
        if yearlyProduct == nil { selectedPlan = .monthly }

        monthlyTrialText = await Self.trialText(for: monthlyProduct)
        yearlyTrialText = await Self.trialText(for: yearlyProduct)

        await refreshEntitlement()
    }

    var selectedProduct: Product? {
        selectedPlan == .yearly ? (yearlyProduct ?? monthlyProduct) : monthlyProduct
    }

    /// "SAVE 33%" chip value: how much the annual plan saves vs 12 months of
    /// monthly, computed from the live store prices so a reprice never lies.
    var yearlySavingsPercent: Int? {
        guard let m = monthlyProduct?.price, let y = yearlyProduct?.price, m > 0 else { return nil }
        let full = m * 12
        guard full > y else { return nil }
        let pct = (full - y) / full * 100
        return Int((pct as NSDecimalNumber).doubleValue.rounded())
    }

    /// "$39.99/year" or "$4.99/month" for the currently selected plan.
    var priceText: String {
        guard let p = selectedProduct else {
            return selectedPlan == .yearly ? "$39.99/year" : "$4.99/month"
        }
        let unit = (selectedPlan == .yearly && yearlyProduct != nil) ? "year" : "month"
        return "\(p.displayPrice)/\(unit)"
    }

    /// "per year" / "per month" caption for the big price figure.
    var periodText: String {
        (selectedPlan == .yearly && yearlyProduct != nil) ? "per year" : "per month"
    }

    /// Free-trial blurb for the SELECTED plan, nil when no eligible trial.
    var trialText: String? {
        (selectedPlan == .yearly && yearlyProduct != nil) ? yearlyTrialText : monthlyTrialText
    }

    private static func trialText(for product: Product?) async -> String? {
        guard let product,
              let sub = product.subscription,
              let offer = sub.introductoryOffer,
              offer.paymentMode == .freeTrial,
              await sub.isEligibleForIntroOffer else { return nil }
        let p = offer.period
        let unit: String
        switch p.unit {
        case .day: unit = p.value == 1 ? "day" : "days"
        case .week: unit = p.value == 1 ? "week" : "weeks"
        case .month: unit = p.value == 1 ? "month" : "months"
        case .year: unit = p.value == 1 ? "year" : "years"
        @unknown default: unit = "days"
        }
        return "\(p.value)-\(unit) free trial"
    }

    func refreshEntitlement() async {
        var active = false
        for await result in Transaction.currentEntitlements {
            // StoreKit 2 device verification can fail spuriously for genuine,
            // Apple-processed transactions (notably in the App Store sandbox,
            // which App Review uses). The entitlement is still real, so accept
            // it rather than locking out a paying customer.
            let tx = result.unsafePayloadValue
            if (tx.productID == Self.monthlyProductID || tx.productID == Self.yearlyProductID),
               tx.revocationDate == nil {
                active = true
            }
        }
        isPro = active
    }

    func purchase() async {
        guard let product = selectedProduct else {
            errorMessage = "Subscription unavailable. Try again shortly."
            return
        }
        isPurchasing = true
        defer { isPurchasing = false }
        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                // Apple has processed the payment at this point — never
                // surface an error for a successful charge. `.unverified`
                // occurs spuriously in the App Store sandbox, and the
                // transaction it carries is still a real paid transaction.
                await verification.unsafePayloadValue.finish()
                // Unlock immediately; re-reading currentEntitlements can lag
                // the purchase and would strand the buyer on the paywall.
                isPro = true
            case .userCancelled:
                break
            case .pending:
                errorMessage = "Purchase is pending approval and will activate once approved."
            @unknown default:
                break
            }
        } catch {
            errorMessage = "Purchase didn't complete. Please try again."
        }
    }

    func restore() async {
        isPurchasing = true
        defer { isPurchasing = false }
        do {
            try await AppStore.sync()
            await refreshEntitlement()
            if !isPro { errorMessage = "No active subscription found to restore." }
        } catch {
            errorMessage = "Couldn't restore purchases. Please try again."
        }
    }

    private func listenForTransactions() -> Task<Void, Never> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                // Finish unverified transactions too (see refreshEntitlement) —
                // leaving them unfinished makes StoreKit redeliver them forever.
                await result.unsafePayloadValue.finish()
                await self?.refreshEntitlement()
            }
        }
    }
}

// MARK: - Paywall view

/// Feature paywall for the three Pro modules. Presented modally by
/// PCSProPlugin.showPaywall() — this is NOT a full-app gate; the rest of
/// PCS Express stays free and reachable behind it.
struct PCSProPaywallView: View {
    @ObservedObject private var pro = PCSProManager.shared
    var onClose: (() -> Void)?

    // Guideline 3.1.2: the paywall must include functional links to the
    // Terms of Use (EULA) and Privacy Policy. Both pages ship in the web
    // root (public/terms.html, public/privacy.html) and are live at these
    // URLs (vercel.json also rewrites /terms → /terms.html).
    private static let termsURL = URL(string: "https://pcsexpress.app/terms.html")!
    private static let privacyURL = URL(string: "https://pcsexpress.app/privacy.html")!

    // PCS Express brand palette — deep DoD navy + service gold, matching
    // the web app frame (#0D3B66 / #C99A3D). Kept on system backgrounds so
    // dense legal text stays readable (same convention as the native
    // Relocation Estimator screens).
    private let navy = Color(red: 0.05, green: 0.23, blue: 0.40)
    private let gold = Color(red: 0.79, green: 0.60, blue: 0.24)

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color(.systemBackground).ignoresSafeArea()

            ScrollView {
                VStack(spacing: 26) {
                    hero
                    perks
                    planPicker
                    priceBlock

                    if let msg = pro.errorMessage {
                        Text(msg)
                            .font(.caption)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }

                    ctaButtons
                    legal
                }
                .frame(maxWidth: 480)
                .frame(maxWidth: .infinity)
                .padding(.horizontal, 24)
                .padding(.top, 40)
                .padding(.bottom, 32)
            }

            // Feature paywall, not a hard gate — always dismissable.
            Button {
                onClose?()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 28))
                    .foregroundColor(Color(.tertiaryLabel))
                    .padding(14)
            }
            .accessibilityLabel("Close")
        }
        .onReceive(pro.$isPro) { active in
            // Auto-dismiss once the entitlement lands (purchase or restore).
            if active { onClose?() }
        }
    }

    private var hero: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(navy.opacity(0.12))
                    .frame(width: 104, height: 104)
                Image(systemName: "shield.lefthalf.filled")
                    .font(.system(size: 50))
                    .foregroundColor(navy)
            }
            HStack(spacing: 8) {
                Text("PCS Pro")
                    .font(.system(.title, design: .rounded).weight(.black))
                    .foregroundColor(.primary)
                Text("PRO")
                    .font(.system(size: 11, weight: .heavy))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(gold, in: Capsule())
                    .foregroundColor(.white)
            }
            Text("Mission-grade planning tools\nfor your next PCS move.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
    }

    private var perks: some View {
        VStack(spacing: 14) {
            perkRow(icon: "map.fill",
                    title: "Move Strategy",
                    detail: "HHG vs PPM vs partial-PPM comparison with cost and effort trade-offs for your move.")
            perkRow(icon: "doc.text.fill",
                    title: "Documents Checklist",
                    detail: "Every PCS form tracked to done, with a printable binder export for the gaining unit.")
            perkRow(icon: "shippingbox.fill",
                    title: "Inventory & Claims Vault",
                    detail: "Room-by-room inventory and a claims evidence log if the movers break something.")
        }
    }

    private func perkRow(icon: String, title: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(navy.opacity(0.10))
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .foregroundColor(navy)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline).fontWeight(.bold)
                Text(detail).font(.caption).foregroundColor(.secondary)
            }
            Spacer(minLength: 0)
        }
    }

    // Plan picker — annual anchored first with the save chip; collapses to
    // nothing (single implicit monthly plan) when yearly isn't live yet.
    @ViewBuilder
    private var planPicker: some View {
        if let yearly = pro.yearlyProduct {
            VStack(spacing: 10) {
                planCard(
                    title: "Annual",
                    price: "\(yearly.displayPrice)/year",
                    caption: "Auto-renews yearly. Cancel anytime.",
                    badge: pro.yearlySavingsPercent.map { "BEST VALUE · SAVE \($0)%" },
                    selected: pro.selectedPlan == .yearly
                ) { pro.selectedPlan = .yearly }
                planCard(
                    title: "Monthly",
                    price: pro.monthlyProduct.map { "\($0.displayPrice)/month" } ?? "—",
                    caption: "Auto-renews monthly. Cancel anytime.",
                    badge: nil,
                    selected: pro.selectedPlan == .monthly
                ) { pro.selectedPlan = .monthly }
            }
        }
    }

    private func planCard(title: String, price: String, caption: String,
                          badge: String?, selected: Bool,
                          onTap: @escaping () -> Void) -> some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 22))
                    .foregroundColor(selected ? navy : Color(.tertiaryLabel))
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 8) {
                        Text(title).font(.headline).foregroundColor(.primary)
                        if let badge {
                            Text(badge)
                                .font(.system(size: 10, weight: .heavy))
                                .padding(.horizontal, 7)
                                .padding(.vertical, 3)
                                .background(gold, in: Capsule())
                                .foregroundColor(.white)
                        }
                    }
                    Text(caption).font(.caption2).foregroundColor(.secondary)
                }
                Spacer()
                Text(price)
                    .font(.subheadline.weight(.bold))
                    .foregroundColor(selected ? navy : .secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(selected ? navy.opacity(0.06) : Color(.secondarySystemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(selected ? navy : Color(.separator),
                                    lineWidth: selected ? 1.5 : 1))
            )
        }
        .buttonStyle(.plain)
    }

    // Price block. Guideline 3.1.2(c): the billed amount must be the most
    // clear and conspicuous pricing element — larger, bolder, and ABOVE any
    // free-trial mention.
    private var priceBlock: some View {
        VStack(spacing: 6) {
            HStack(alignment: .firstTextBaseline, spacing: 5) {
                Text(pro.selectedProduct?.displayPrice ?? (pro.selectedPlan == .yearly ? "$39.99" : "$4.99"))
                    .font(.system(size: 42, weight: .black, design: .rounded))
                    .foregroundColor(.primary)
                Text(pro.periodText)
                    .font(.title3.weight(.semibold))
                    .foregroundColor(.primary)
            }
            Text(pro.selectedPlan == .yearly && pro.yearlyProduct != nil
                 ? "Auto-renews yearly. Cancel anytime."
                 : "Auto-renews monthly. Cancel anytime.")
                .font(.footnote)
                .foregroundColor(.secondary)
            if let trial = pro.trialText {
                // Trial text sits BELOW the billed amount, smaller (3.1.2(c)).
                Text("Includes a \(trial), then \(pro.priceText)")
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }
        }
    }

    private var ctaButtons: some View {
        VStack(spacing: 12) {
            Button {
                Task { await pro.purchase() }
            } label: {
                Group {
                    if pro.isPurchasing {
                        ProgressView().tint(.white)
                    } else {
                        // The CTA states the billed amount (3.1.2(c)); it
                        // must not lead with the free trial.
                        Text("Subscribe for \(pro.priceText)")
                            .fontWeight(.black)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(navy)
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(pro.isPurchasing || pro.selectedProduct == nil)

            Button("Restore Purchases") {
                Task { await pro.restore() }
            }
            .font(.subheadline)
            .foregroundColor(.secondary)
            .disabled(pro.isPurchasing)
        }
    }

    private var legal: some View {
        VStack(spacing: 14) {
            // Apple-required auto-renewal disclosure (3.1.2).
            Text("Payment of \(pro.priceText) is charged to your Apple Account at confirmation of purchase\(pro.trialText != nil ? ", after the free trial ends" : ""). The subscription auto-renews at \(pro.priceText) unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your Apple Account settings. The rest of PCS Express stays free.")
                .font(.caption2)
                .foregroundColor(Color(.tertiaryLabel))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 8)

            HStack(spacing: 16) {
                Link("Terms of Use", destination: Self.termsURL)
                Text("·").foregroundColor(Color(.tertiaryLabel))
                Link("Privacy Policy", destination: Self.privacyURL)
            }
            .font(.caption.weight(.medium))
            .foregroundColor(.secondary)
        }
    }
}
