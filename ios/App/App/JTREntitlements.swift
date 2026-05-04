import Foundation

// MARK: - Pay Grade

/// JTR-aligned military pay grade enumeration.
/// Raw values are lowercase, no-hyphen to allow string-based lookups.
enum PayGrade: String, Codable, CaseIterable, Hashable {
    case e1, e2, e3, e4, e5, e6, e7, e8, e9
    case w1, w2, w3, w4, w5
    case o1, o2, o3, o4, o5, o6, o7, o8, o9, o10
    case o1e, o2e, o3e   // Prior-enlisted officers

    /// Formatted display string: "E-5", "O-3", "W-2", "O-3E".
    var displayName: String {
        let raw = rawValue.uppercased()
        // Handle prior-enlisted suffix: "O1E" → "O-1E"
        if raw.count == 3 && raw.last == "E" {
            let letter = String(raw.prefix(1))
            let number = String(raw.dropFirst(1).dropLast(1))
            return "\(letter)-\(number)E"
        }
        let letter = String(raw.prefix(1))
        let number = String(raw.dropFirst(1))
        return "\(letter)-\(number)"
    }

    /// Accepts hyphenated ("E-5"), unhyphenated ("E5"), or lowercase ("e5").
    init?(normalizing raw: String) {
        let cleaned = raw.lowercased().replacingOccurrences(of: "-", with: "")
        self.init(rawValue: cleaned)
    }
}

// MARK: - JTR Weight Allowance (Table 5-7, FY 2025/2026)

/// Returns authorized HHG weight in pounds based on pay grade and dependency status.
/// Source: Joint Travel Regulations Table 5-7.
func jtrAuthorizedWeight(for grade: PayGrade, hasDependents: Bool) -> Int {
    switch grade {
    case .o6, .o7, .o8, .o9, .o10:
        return 18_000
    case .o5, .w5:
        return hasDependents ? 17_500 : 16_000
    case .o4, .w4:
        return hasDependents ? 17_000 : 14_000
    case .o3, .w3, .o3e:
        return hasDependents ? 14_500 : 13_000
    case .o2, .w2, .o2e:
        return hasDependents ? 13_500 : 12_500
    case .o1, .w1, .o1e:
        return hasDependents ? 12_000 : 10_000
    case .e9:
        return hasDependents ? 15_000 : 13_000
    case .e8:
        return hasDependents ? 14_000 : 12_000
    case .e7:
        return hasDependents ? 13_000 : 11_000
    case .e6:
        return hasDependents ? 11_000 :  8_000
    case .e5:
        return hasDependents ?  9_000 :  7_000
    case .e4:
        return hasDependents ?  8_000 :  7_000
    case .e1, .e2, .e3:
        return hasDependents ?  8_000 :  5_000
    }
}

// MARK: - Pro-Gear Limits (JTR Ch. 5)

/// Professional Books, Papers & Equipment (PBP&E) — authorized in addition to HHG weight.
let jtrProGearMemberLimit = 2_000
let jtrProGearSpouseLimit  =   500

// MARK: - PCS Entitlements Namespace

enum PCSEntitlements {

    // MARK: Weight Allowance

    struct WeightAllowance {
        let payGrade:      PayGrade
        let withDependents: Bool

        var authorized:   Int { jtrAuthorizedWeight(for: payGrade, hasDependents: withDependents) }
        var proGearMember: Int { jtrProGearMemberLimit }
        var proGearSpouse: Int { withDependents ? jtrProGearSpouseLimit : 0 }
        var total:         Int { authorized + proGearMember + proGearSpouse }
    }

    // MARK: Travel Reimbursement (FY 2024–2026 rates)

    enum TravelReimbursement {
        /// Monetary Allowance in Lieu of Transportation — per mile.
        static let maltRatePerMile:     Double = 0.20
        /// Service member per diem daily rate.
        static let smPerDiem:           Double = 166.00
        /// Dependent age 12+ (75 % of SM rate).
        static let depOver12PerDiem:    Double = 124.50
        /// Dependent under 12 (50 % of SM rate).
        static let depUnder12PerDiem:   Double =  83.00

        /// JTR rule: 1 day per 350 miles; add 1 day if remainder ≥ 51 miles.
        /// Minimum 1 day for trips ≤ 400 miles.
        static func travelDays(for miles: Int) -> Int {
            guard miles > 400 else { return 1 }
            let base      = miles / 350
            let remainder = miles % 350
            return remainder >= 51 ? base + 1 : base
        }

        static func maltEstimate(miles: Int) -> Double {
            Double(miles) * maltRatePerMile
        }

        /// Total per-diem estimate for the full authorized travel period.
        static func perDiemEstimate(miles: Int,
                                    depsOver12: Int  = 0,
                                    depsUnder12: Int = 0) -> Double {
            let days  = Double(travelDays(for: miles))
            let sm    = smPerDiem          * days
            let dep12p = depOver12PerDiem  * Double(depsOver12)  * days
            let dep12m = depUnder12PerDiem * Double(depsUnder12) * days
            return sm + dep12p + dep12m
        }
    }
}

// MARK: - Means of Travel (DD 1351-2 Block 15 codes)

enum MeansOfTravel: String, CaseIterable, Codable {
    case privateAuto    = "PA"
    case commercialAuto = "CA"
    case commercialAir  = "CP"
    case governmentAir  = "GP"

    var description: String {
        switch self {
        case .privateAuto:    return "Private Vehicle (Owner/Operator)"
        case .commercialAuto: return "Rental Car / Taxi / Rideshare"
        case .commercialAir:  return "Commercial Airline"
        case .governmentAir:  return "Government Air (Rotator)"
        }
    }
}

// MARK: - Reason for Stop (DD 1351-2 Block 15 codes)

enum ReasonForStop: String, CaseIterable, Codable {
    case authorizedDelay = "AD"
    case awaitingTrans   = "AT"
    case leave           = "LV"
    case missionComplete = "MC"

    var description: String {
        switch self {
        case .authorizedDelay: return "Authorized Delay (In-Route)"
        case .awaitingTrans:   return "Awaiting Transportation"
        case .leave:           return "Personal Leave"
        case .missionComplete: return "Arrival at New Duty Station"
        }
    }
}

// MARK: - DD Form 1351-2 Data Model

struct DD1351_2_Voucher: Codable {
    /// DoD policy: Electronic Funds Transfer is the standard payment mode.
    let paymentMode: String = "EFT"
    let splitDisbursementAmount: Double?
    let travelerName:     String
    let travelerPayGrade: PayGrade
    /// Last 4 digits only — full SSN must be stored separately via KeychainDocumentService.
    let ssnLast4: String

    struct TravelLeg: Codable {
        let date:          Date
        let location:      String          // "City, State ZIP"
        let modeOfTravel:  MeansOfTravel
        let reasonForStop: ReasonForStop
        let lodgingCost:   Double?
        let pocMiles:      Int?
    }

    struct ExpenseItem: Codable {
        let date:        Date
        let description: String
        let amount:      Double
        /// JTR: receipts required for expenses ≥ $75.
        var requiresReceipt: Bool { amount >= 75.0 }
    }

    var itinerary: [TravelLeg]
    var expenses:  [ExpenseItem]

    var totalExpenses: Double { expenses.reduce(0) { $0 + $1.amount } }
}

// MARK: - PCS Milestone Engine

struct PCSMilestone: Identifiable, Codable {
    let id:              UUID
    let title:           String
    let detail:          String
    /// Days before RNLTD that this milestone should be complete.
    /// Negative values = days *after* RNLTD arrival.
    let daysBeforeRNLTD: Int
    let isMandatory:     Bool
    var isCompleted:     Bool

    init(title: String, detail: String,
         daysBeforeRNLTD: Int, isMandatory: Bool, isCompleted: Bool = false) {
        self.id             = UUID()
        self.title          = title
        self.detail         = detail
        self.daysBeforeRNLTD = daysBeforeRNLTD
        self.isMandatory    = isMandatory
        self.isCompleted    = isCompleted
    }

    func deadline(relativeTo reportDate: Date) -> Date {
        Calendar.current.date(byAdding: .day,
                              value: -daysBeforeRNLTD,
                              to: reportDate) ?? reportDate
    }
}

// MARK: - PCS Checklist Manager

final class PCSChecklistManager: ObservableObject {
    @Published var milestones:  [PCSMilestone]
    @Published var reportDate:  Date

    init(reportDate: Date? = nil) {
        self.milestones = PCSChecklistManager.defaultMilestones
        self.reportDate = reportDate
            ?? Calendar.current.date(byAdding: .month, value: 3, to: Date())
            ?? Date()
    }

    static let defaultMilestones: [PCSMilestone] = [
        PCSMilestone(title: "Orders Verification",
                     detail: "Upload orders and verify RNLTD / reporting instructions.",
                     daysBeforeRNLTD: 120, isMandatory: true),
        PCSMilestone(title: "EFMP Screening",
                     detail: "Mandatory medical screening for all traveling dependents.",
                     daysBeforeRNLTD: 90, isMandatory: true),
        PCSMilestone(title: "TMO / DPS Application",
                     detail: "Schedule HHG pickup in the Defense Personal Property System.",
                     daysBeforeRNLTD: 75, isMandatory: true),
        PCSMilestone(title: "PPM (DITY) Setup",
                     detail: "If doing a Personally Procured Move, arrange weight tickets.",
                     daysBeforeRNLTD: 60, isMandatory: false),
        PCSMilestone(title: "Housing Notification",
                     detail: "Provide 30-day notice to current on-post housing or landlord.",
                     daysBeforeRNLTD: 35, isMandatory: true),
        PCSMilestone(title: "In-Processing Appointment",
                     detail: "Schedule in-processing at gaining unit S1 / personnel office.",
                     daysBeforeRNLTD: 14, isMandatory: true),
        PCSMilestone(title: "Travel Voucher Submission",
                     detail: "Submit DD Form 1351-2 to Finance via the app's export feature.",
                     daysBeforeRNLTD: -5, isMandatory: true),
    ]

    var completedCount:  Int { milestones.filter(\.isCompleted).count }
    var mandatoryCount:  Int { milestones.filter(\.isMandatory).count }
    var mandatoryDone:   Int { milestones.filter { $0.isMandatory && $0.isCompleted }.count }
    var completionPct:   Double {
        milestones.isEmpty ? 0 : Double(completedCount) / Double(milestones.count)
    }

    func toggleCompletion(for id: UUID) {
        guard let idx = milestones.firstIndex(where: { $0.id == id }) else { return }
        milestones[idx].isCompleted.toggle()
    }
}
