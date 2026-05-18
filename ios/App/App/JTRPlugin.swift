// Gated by ENABLE_NATIVE_JTR_PLUGIN. The plugin was authored against
// an older Capacitor SDK and uses APIs that the Capacitor 8 SPM build
// no longer exposes (`call.reject`/`call.resolve` signatures and
// `bridge.viewController`). No JavaScript code in `src/` references
// `JTRPlugin`, so the plugin is currently dead native code blocking
// the Swift compile in CI. Wrap-and-gate keeps the source for a
// future Capacitor-8 port without forcing a deletion. Re-enable by
// adding `ENABLE_NATIVE_JTR_PLUGIN` to OTHER_SWIFT_FLAGS in the
// App target's Build Settings, after porting the API calls.
#if ENABLE_NATIVE_JTR_PLUGIN
import Capacitor
import Foundation
import SwiftUI

/// Capacitor plugin — exposes the full JTR compliance engine to the React web layer.
///
/// JavaScript usage (import via @capacitor/core Plugins):
///
///   // Weight allowance lookup
///   const wa = await JTRPlugin.getWeightAllowance({ payGrade: 'E-6', hasDependents: true });
///   // → { payGrade, authorizedLbs, proGearMemberLbs, proGearSpouseLbs, totalWithProGearLbs }
///
///   // Travel reimbursement estimate
///   const tr = await JTRPlugin.calculateTravelReimbursement({ miles: 850, depsOver12: 1 });
///   // → { authorizedTravelDays, maltEstimate, perDiemEstimate, totalEstimate }
///
///   // PCS milestones with computed deadlines
///   const ml = await JTRPlugin.getMilestones({ reportDateISO: '2025-09-01T00:00:00Z' });
///   // → { milestones: [{ id, title, detail, isMandatory, deadlineISO, daysUntil, isOverdue }] }
///
///   // Offline cache
///   await JTRPlugin.saveToOfflineCache({ key: 'profile.json', jsonData: '{"name":"Smith"}' });
///   const { jsonData, found } = await JTRPlugin.loadFromOfflineCache({ key: 'profile.json' });
///
///   // Present native SwiftUI views
///   await JTRPlugin.showRelocationEstimator({ payGrade: 'E-6', hasDependents: true });
///   await JTRPlugin.showMilestoneChecklist({ reportDateISO: '2025-09-01T00:00:00Z' });
///   await JTRPlugin.showPetRelocation({});
///   await JTRPlugin.showEFMPChecklist({});
///   await JTRPlugin.showHousingClaims({});
@objc(JTRPlugin)
public class JTRPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier    = "JTRPlugin"
    public let jsName        = "JTRPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getWeightAllowance",          returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "calculateTravelReimbursement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getMilestones",               returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveToOfflineCache",          returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadFromOfflineCache",        returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCacheInventory",           returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showRelocationEstimator",     returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showMilestoneChecklist",      returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showPetRelocation",           returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showEFMPChecklist",           returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showHousingClaims",           returnType: CAPPluginReturnPromise),
    ]

    // MARK: - Weight Allowance

    @objc func getWeightAllowance(_ call: CAPPluginCall) {
        guard let gradeRaw = call.getString("payGrade"),
              let grade    = PayGrade(normalizing: gradeRaw) else {
            call.reject("Invalid or missing 'payGrade'. Expected format: 'E-5', 'O-3', 'W-2'.")
            return
        }
        let hasDeps = call.getBool("hasDependents") ?? false
        let wa      = PCSEntitlements.WeightAllowance(payGrade: grade, withDependents: hasDeps)

        call.resolve([
            "payGrade":            grade.displayName,
            "hasDependents":       hasDeps,
            "authorizedLbs":       wa.authorized,
            "proGearMemberLbs":    wa.proGearMember,
            "proGearSpouseLbs":    wa.proGearSpouse,
            "totalWithProGearLbs": wa.total,
        ])
    }

    // MARK: - Travel Reimbursement

    @objc func calculateTravelReimbursement(_ call: CAPPluginCall) {
        guard let miles = call.getInt("miles"), miles > 0 else {
            call.reject("Missing or invalid 'miles' (must be a positive integer).")
            return
        }
        let depsOver12  = call.getInt("depsOver12")  ?? 0
        let depsUnder12 = call.getInt("depsUnder12") ?? 0

        let days    = PCSEntitlements.TravelReimbursement.travelDays(for: miles)
        let malt    = PCSEntitlements.TravelReimbursement.maltEstimate(miles: miles)
        let perDiem = PCSEntitlements.TravelReimbursement.perDiemEstimate(
            miles:       miles,
            depsOver12:  depsOver12,
            depsUnder12: depsUnder12
        )

        call.resolve([
            "miles":                miles,
            "authorizedTravelDays": days,
            "maltEstimate":         malt,
            "perDiemEstimate":      perDiem,
            "totalEstimate":        malt + perDiem,
            "maltRatePerMile":      PCSEntitlements.TravelReimbursement.maltRatePerMile,
            "smPerDiemRate":        PCSEntitlements.TravelReimbursement.smPerDiem,
            "depOver12Rate":        PCSEntitlements.TravelReimbursement.depOver12PerDiem,
            "depUnder12Rate":       PCSEntitlements.TravelReimbursement.depUnder12PerDiem,
        ])
    }

    // MARK: - Milestones

    @objc func getMilestones(_ call: CAPPluginCall) {
        let fmt = ISO8601DateFormatter()
        let reportDate: Date
        if let isoStr = call.getString("reportDateISO"),
           let parsed = fmt.date(from: isoStr) {
            reportDate = parsed
        } else {
            reportDate = Calendar.current.date(byAdding: .month, value: 3, to: Date()) ?? Date()
        }

        let milestones: [[String: Any]] = PCSChecklistManager.defaultMilestones.map { m in
            let deadline  = m.deadline(relativeTo: reportDate)
            let daysUntil = Calendar.current
                .dateComponents([.day], from: Date(), to: deadline).day ?? 0
            return [
                "id":          m.id.uuidString,
                "title":       m.title,
                "detail":      m.detail,
                "isMandatory": m.isMandatory,
                "isCompleted": m.isCompleted,
                "deadlineISO": fmt.string(from: deadline),
                "daysUntil":   daysUntil,
                "isOverdue":   daysUntil < 0 && !m.isCompleted,
            ]
        }
        call.resolve([
            "reportDateISO": fmt.string(from: reportDate),
            "milestones":    milestones,
        ])
    }

    // MARK: - Offline Cache

    @objc func saveToOfflineCache(_ call: CAPPluginCall) {
        guard let keyRaw  = call.getString("key"),
              let cacheKey = OfflineCacheManager.CacheKey(rawValue: keyRaw),
              let jsonStr  = call.getString("jsonData") else {
            call.reject("Missing required parameters: 'key' and 'jsonData'.")
            return
        }
        DispatchQueue.global(qos: .utility).async {
            do {
                let wrapper = RawJSONWrapper(json: jsonStr)
                try OfflineCacheManager.shared.save(wrapper, for: cacheKey)
                call.resolve(["saved": true, "bytes": jsonStr.utf8.count])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func loadFromOfflineCache(_ call: CAPPluginCall) {
        guard let keyRaw  = call.getString("key"),
              let cacheKey = OfflineCacheManager.CacheKey(rawValue: keyRaw) else {
            call.reject("Missing or invalid 'key' parameter.")
            return
        }
        DispatchQueue.global(qos: .utility).async {
            do {
                let wrapper = try OfflineCacheManager.shared.load(RawJSONWrapper.self, for: cacheKey)
                let age     = OfflineCacheManager.shared.cacheAge(for: cacheKey)
                var result: [String: Any] = ["jsonData": wrapper.json, "found": true]
                if let age = age {
                    result["cachedAtISO"] = ISO8601DateFormatter().string(from: age)
                }
                call.resolve(result)
            } catch {
                // Item not found is a normal non-error state; resolve with found: false.
                call.resolve(["jsonData": "", "found": false])
            }
        }
    }

    @objc func getCacheInventory(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .utility).async {
            let inventory = OfflineCacheManager.shared.cacheInventory()
            let result = inventory.reduce(into: [String: Int]()) { dict, pair in
                dict[pair.key.rawValue] = pair.value
            }
            call.resolve(["inventory": result])
        }
    }

    // MARK: - Native View Presentation

    @objc func showRelocationEstimator(_ call: CAPPluginCall) {
        let gradeRaw = call.getString("payGrade") ?? "e5"
        let grade    = PayGrade(normalizing: gradeRaw) ?? .e5
        let hasDeps  = call.getBool("hasDependents") ?? false

        DispatchQueue.main.async { [weak self] in
            let view     = RelocationEstimatorView(initialPayGrade: grade,
                                                   initialHasDependents: hasDeps)
            let hosting  = UIHostingController(rootView: view)
            hosting.modalPresentationStyle = .formSheet
            self?.bridge?.viewController?.present(hosting, animated: true) {
                call.resolve(["presented": true])
            }
        }
    }

    @objc func showMilestoneChecklist(_ call: CAPPluginCall) {
        let fmt = ISO8601DateFormatter()
        let reportDate: Date?
        if let isoStr = call.getString("reportDateISO") {
            reportDate = fmt.date(from: isoStr)
        } else {
            reportDate = nil
        }

        DispatchQueue.main.async { [weak self] in
            let view    = PCSMilestoneView(initialReportDate: reportDate)
            let hosting = UIHostingController(rootView: view)
            hosting.modalPresentationStyle = .pageSheet
            self?.bridge?.viewController?.present(hosting, animated: true) {
                call.resolve(["presented": true])
            }
        }
    }

    @objc func showPetRelocation(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            let view    = PetRelocationView()
            let hosting = UIHostingController(rootView: view)
            hosting.modalPresentationStyle = .pageSheet
            self?.bridge?.viewController?.present(hosting, animated: true) {
                call.resolve(["presented": true])
            }
        }
    }

    @objc func showEFMPChecklist(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            let view    = EFMPView()
            let hosting = UIHostingController(rootView: view)
            hosting.modalPresentationStyle = .pageSheet
            self?.bridge?.viewController?.present(hosting, animated: true) {
                call.resolve(["presented": true])
            }
        }
    }

    @objc func showHousingClaims(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            let view    = HousingClaimsView()
            let hosting = UIHostingController(rootView: view)
            hosting.modalPresentationStyle = .pageSheet
            self?.bridge?.viewController?.present(hosting, animated: true) {
                call.resolve(["presented": true])
            }
        }
    }
}
#endif // ENABLE_NATIVE_JTR_PLUGIN
