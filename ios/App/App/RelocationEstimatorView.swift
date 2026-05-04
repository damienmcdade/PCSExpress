import SwiftUI

/// Section 508-compliant JTR Relocation Estimator.
///
/// Allows a service member to select their pay grade and dependent status
/// to see authorized HHG weight limits and travel reimbursement estimates
/// per the Joint Travel Regulations (JTR), Chapter 5.
///
/// All results are computed offline — no network call required.
struct RelocationEstimatorView: View {

    @State private var payGrade:     PayGrade
    @State private var hasDependents: Bool
    @State private var depsOver12:   Int = 0
    @State private var depsUnder12:  Int = 0
    @State private var distanceText: String = ""
    @FocusState private var distanceFocused: Bool
    @Environment(\.dismiss) private var dismiss

    init(initialPayGrade: PayGrade = .e5, initialHasDependents: Bool = false) {
        _payGrade      = State(initialValue: initialPayGrade)
        _hasDependents = State(initialValue: initialHasDependents)
    }

    // MARK: - Computed properties

    private var distanceMiles: Int { Int(distanceText) ?? 0 }

    private var weightAllowance: PCSEntitlements.WeightAllowance {
        PCSEntitlements.WeightAllowance(payGrade: payGrade, withDependents: hasDependents)
    }

    private var travelDays: Int {
        distanceMiles > 0 ? PCSEntitlements.TravelReimbursement.travelDays(for: distanceMiles) : 0
    }

    private var maltEstimate: Double {
        distanceMiles > 0 ? PCSEntitlements.TravelReimbursement.maltEstimate(miles: distanceMiles) : 0
    }

    private var perDiemEstimate: Double {
        guard distanceMiles > 0 else { return 0 }
        return PCSEntitlements.TravelReimbursement.perDiemEstimate(
            miles:       distanceMiles,
            depsOver12:  hasDependents ? depsOver12  : 0,
            depsUnder12: hasDependents ? depsUnder12 : 0
        )
    }

    // MARK: - Body

    var body: some View {
        NavigationView {
            Form {
                profileSection
                if hasDependents { dependentCountSection }
                distanceSection
                weightSection
                if distanceMiles > 0 { reimbursementSection }
                disclaimerSection
            }
            .navigationTitle("Relocation Estimator")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") { dismiss() }
                        .accessibilityLabel("Close relocation estimator")
                }
                ToolbarItem(placement: .keyboard) {
                    Button("Done") { distanceFocused = false }
                }
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Sections

    private var profileSection: some View {
        Section {
            Picker("Pay Grade", selection: $payGrade) {
                ForEach(PayGrade.allCases, id: \.self) { grade in
                    Text(grade.displayName).tag(grade)
                }
            }
            .accessibilityLabel("Pay grade")
            .accessibilityHint("Select your current military pay grade")

            Toggle("Traveling with Dependents", isOn: $hasDependents)
                .accessibilityLabel("Traveling with dependents")
                .accessibilityHint("Enable if traveling with spouse or children")
        } header: {
            Text("Service Member Profile")
        }
    }

    private var dependentCountSection: some View {
        Section {
            Stepper(value: $depsOver12, in: 0...12) {
                HStack {
                    Text("Age 12 or older")
                    Spacer()
                    Text("\(depsOver12)")
                        .foregroundStyle(.secondary)
                        .monospacedDigit()
                }
            }
            .accessibilityLabel("\(depsOver12) dependent\(depsOver12 == 1 ? "" : "s") age 12 or older")
            .accessibilityHint("Per diem at 75 percent of service member rate. Double-tap and swipe to adjust.")

            Stepper(value: $depsUnder12, in: 0...12) {
                HStack {
                    Text("Under age 12")
                    Spacer()
                    Text("\(depsUnder12)")
                        .foregroundStyle(.secondary)
                        .monospacedDigit()
                }
            }
            .accessibilityLabel("\(depsUnder12) dependent\(depsUnder12 == 1 ? "" : "s") under age 12")
            .accessibilityHint("Per diem at 50 percent of service member rate. Double-tap and swipe to adjust.")
        } header: {
            Text("Dependents")
        }
    }

    private var distanceSection: some View {
        Section {
            HStack {
                Text("Driving Distance")
                Spacer()
                TextField("0", text: $distanceText)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.trailing)
                    .frame(width: 80)
                    .focused($distanceFocused)
                    .accessibilityLabel("Driving distance in miles")
                    .accessibilityHint("Enter total one-way driving distance to new duty station")
                Text("mi")
                    .foregroundStyle(.secondary)
            }
        } header: {
            Text("Travel Distance (Optional)")
        } footer: {
            Text("Leave blank to see weight allowances only.")
                .font(.caption)
        }
    }

    private var weightSection: some View {
        Section {
            resultRow(
                label: "Authorized HHG Weight",
                value: formatLbs(weightAllowance.authorized),
                color: .blue,
                a11yLabel: "\(weightAllowance.authorized) pounds authorized household goods"
            )
            resultRow(
                label: "Member Pro-Gear",
                value: formatLbs(weightAllowance.proGearMember),
                color: .secondary,
                a11yLabel: "\(weightAllowance.proGearMember) pounds member professional gear"
            )
            if hasDependents {
                resultRow(
                    label: "Spouse Pro-Gear",
                    value: formatLbs(weightAllowance.proGearSpouse),
                    color: .secondary,
                    a11yLabel: "\(weightAllowance.proGearSpouse) pounds spouse professional gear"
                )
            }
            resultRow(
                label: "Total with Pro-Gear",
                value: formatLbs(weightAllowance.total),
                color: Color(red: 0.07, green: 0.36, blue: 0.55),
                bold: true,
                a11yLabel: "\(weightAllowance.total) pounds total including professional gear"
            )
        } header: {
            Text("HHG Weight — \(payGrade.displayName)")
                .accessibilityLabel("Household goods weight allowance for pay grade \(payGrade.displayName)")
        }
    }

    @ViewBuilder
    private var reimbursementSection: some View {
        Section {
            resultRow(
                label: "Authorized Travel Days",
                value: "\(travelDays) day\(travelDays == 1 ? "" : "s")",
                color: Color(red: 0.09, green: 0.43, blue: 0.18),
                a11yLabel: "\(travelDays) authorized travel days for \(distanceMiles) miles"
            )
            resultRow(
                label: "MALT Estimate",
                value: formatCurrency(maltEstimate),
                color: Color(red: 0.09, green: 0.43, blue: 0.18),
                a11yLabel: "MALT estimate \(formatCurrency(maltEstimate))"
            )
            resultRow(
                label: "Per Diem Estimate",
                value: formatCurrency(perDiemEstimate),
                color: Color(red: 0.09, green: 0.43, blue: 0.18),
                a11yLabel: "Per diem estimate \(formatCurrency(perDiemEstimate))"
            )
            resultRow(
                label: "Total Travel Estimate",
                value: formatCurrency(maltEstimate + perDiemEstimate),
                color: Color(red: 0.07, green: 0.36, blue: 0.55),
                bold: true,
                a11yLabel: "Total travel estimate \(formatCurrency(maltEstimate + perDiemEstimate))"
            )
        } header: {
            Text("Travel Reimbursement (\(distanceMiles) mi)")
        } footer: {
            Text("MALT $0.20/mi · SM per diem $166/day · Dep 12+ $124.50/day · Dep under 12 $83/day")
                .font(.caption2)
        }
    }

    private var disclaimerSection: some View {
        Section {
            Text("Estimates use FY 2024–2026 JTR rates. Actual entitlements are determined by your Finance / S4 office. BAH requires a real-time network lookup and is not available offline.")
                .font(.caption)
                .foregroundStyle(.secondary)
        } header: {
            Text("Disclaimer")
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Disclaimer: Estimates use JTR rates. Actual entitlements are determined by your Finance or S4 office.")
    }

    // MARK: - Helpers

    private func resultRow(label: String, value: String,
                           color: Color, bold: Bool = false,
                           a11yLabel: String) -> some View {
        HStack {
            Text(label)
                .font(bold ? .body.weight(.semibold) : .body)
            Spacer()
            Text(value)
                .font(bold ? .body.weight(.bold) : .body)
                .foregroundStyle(color)
                .monospacedDigit()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(a11yLabel)
    }

    private func formatLbs(_ lbs: Int) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        return (f.string(from: NSNumber(value: lbs)) ?? "\(lbs)") + " lbs"
    }

    private func formatCurrency(_ amount: Double) -> String {
        String(format: "$%.2f", amount)
    }
}

// MARK: - Preview

#Preview {
    RelocationEstimatorView(initialPayGrade: .e7, initialHasDependents: true)
}
