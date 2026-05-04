import SwiftUI

// MARK: - Data Models

struct PetExpense: Identifiable, Codable {
    var id: UUID = UUID()
    var description: String
    var amount: Double
    var category: PetExpenseCategory
    var isReimbursable: Bool

    enum PetExpenseCategory: String, CaseIterable, Codable {
        case quarantine = "Quarantine"
        case microchip  = "Microchip"
        case healthCert = "Health Certificate"
        case transport  = "Transport"
        case kennel     = "Kennel / Crate"
        case titerTest  = "Titer Test"
        case other      = "Other"

        var sfSymbol: String {
            switch self {
            case .quarantine: return "building.2.fill"
            case .microchip:  return "cpu.fill"
            case .healthCert: return "doc.text.fill"
            case .transport:  return "airplane"
            case .kennel:     return "square.fill"
            case .titerTest:  return "drop.fill"
            case .other:      return "ellipsis.circle.fill"
            }
        }
    }
}

struct PetDestination: Identifiable {
    let id: String
    let name: String
    let requirements: [String]
    let leadTimeWeeks: Int
    let notes: String
}

// MARK: - Main View

/// Section 508-compliant Pet Relocation tracker.
///
/// Tracks JTR reimbursement limits (CONUS $550 / OCONUS $2,000 as of Jan 2024),
/// country-specific import compliance timelines, and Dogs on Deployment resources.
struct PetRelocationView: View {

    @State private var isOCONUS: Bool = false
    @State private var expenses: [PetExpense] = []
    @State private var showingAddExpense: Bool = false
    @State private var selectedDestinationID: String = "conus"

    @State private var newDescription: String = ""
    @State private var newAmountText: String = ""
    @State private var newCategory: PetExpense.PetExpenseCategory = .healthCert
    @State private var newIsReimbursable: Bool = true

    @Environment(\.dismiss) private var dismiss

    private var reimbursementCap: Double { isOCONUS ? 2_000.0 : 550.0 }

    private var reimbursableTotal: Double {
        expenses.filter(\.isReimbursable).reduce(0) { $0 + $1.amount }
    }

    private var remaining: Double { max(0, reimbursementCap - reimbursableTotal) }
    private var overage: Double   { max(0, reimbursableTotal - reimbursementCap) }

    private var selectedDestination: PetDestination {
        PetRelocationView.destinations.first { $0.id == selectedDestinationID }
            ?? PetRelocationView.destinations[0]
    }

    // MARK: - Body

    var body: some View {
        NavigationView {
            Form {
                moveTypeSection
                reimbursementSection
                expensesSection
                if showingAddExpense { addExpenseSection }
                countryComplianceSection
                alternativeLogisticsSection
                disclaimerSection
            }
            .navigationTitle("Pet Relocation")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") { dismiss() }
                        .accessibilityLabel("Close pet relocation")
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(showingAddExpense ? "Cancel" : "Add Expense") {
                        showingAddExpense.toggle()
                    }
                    .accessibilityLabel(showingAddExpense
                                        ? "Cancel adding expense"
                                        : "Add a pet relocation expense")
                }
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Sections

    private var moveTypeSection: some View {
        Section {
            Toggle("OCONUS / Overseas Move", isOn: $isOCONUS)
                .accessibilityLabel("OCONUS overseas move toggle")
                .accessibilityHint("Enable for overseas moves. Reimbursement limit increases to $2,000.")
        } header: {
            Text("Move Type — JTR Ch. 5")
        } footer: {
            Text(isOCONUS
                 ? "OCONUS reimbursement limit: up to $2,000 (effective January 2024)."
                 : "CONUS reimbursement limit: up to $550 (effective January 2024).")
                .font(.caption)
        }
    }

    private var reimbursementSection: some View {
        Section {
            reimbursementRow("JTR Reimbursement Cap",
                             amount: reimbursementCap,
                             color: Color(red: 0.07, green: 0.36, blue: 0.55),
                             bold: true,
                             a11y: "JTR reimbursement cap \(formatCurrency(reimbursementCap))")
            reimbursementRow("Reimbursable Expenses",
                             amount: reimbursableTotal,
                             color: .primary,
                             a11y: "Total reimbursable expenses \(formatCurrency(reimbursableTotal))")
            if overage > 0 {
                reimbursementRow("Out-of-Pocket (Over Cap)",
                                 amount: overage,
                                 color: Color(red: 0.62, green: 0.08, blue: 0.08),
                                 bold: true,
                                 a11y: "Out of pocket over cap \(formatCurrency(overage))")
            } else {
                reimbursementRow("Remaining Allowance",
                                 amount: remaining,
                                 color: Color(red: 0.09, green: 0.43, blue: 0.18),
                                 a11y: "Remaining allowance \(formatCurrency(remaining))")
            }
        } header: {
            Text("Reimbursement Summary")
        }
    }

    private var expensesSection: some View {
        Section {
            if expenses.isEmpty {
                Text("No expenses added yet. Tap \"Add Expense\" to begin tracking.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .accessibilityLabel("No expenses added yet")
            } else {
                ForEach(expenses) { expense in
                    expenseRow(expense)
                }
                .onDelete { indexSet in
                    expenses.remove(atOffsets: indexSet)
                }
            }
        } header: {
            Text("Expenses")
        } footer: {
            Text("Reimbursable items include quarantine fees, microchipping, health certificates, and titer tests per JTR.")
                .font(.caption)
        }
    }

    @ViewBuilder
    private var addExpenseSection: some View {
        Section {
            TextField("Description", text: $newDescription)
                .accessibilityLabel("Expense description")
            Picker("Category", selection: $newCategory) {
                ForEach(PetExpense.PetExpenseCategory.allCases, id: \.self) { cat in
                    Text(cat.rawValue).tag(cat)
                }
            }
            .accessibilityLabel("Expense category")
            HStack {
                Text("Amount")
                Spacer()
                Text("$").foregroundStyle(.secondary)
                TextField("0.00", text: $newAmountText)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
                    .frame(width: 100)
                    .accessibilityLabel("Expense amount in dollars")
            }
            Toggle("Reimbursable under JTR", isOn: $newIsReimbursable)
                .accessibilityHint("Toggle on if this expense qualifies for JTR reimbursement")
            Button("Add Expense") {
                let amount = Double(newAmountText) ?? 0
                let item = PetExpense(
                    description: newDescription.isEmpty ? newCategory.rawValue : newDescription,
                    amount: amount,
                    category: newCategory,
                    isReimbursable: newIsReimbursable
                )
                expenses.append(item)
                newDescription = ""
                newAmountText  = ""
                newCategory    = .healthCert
                newIsReimbursable = true
                showingAddExpense = false
            }
            .disabled(newAmountText.isEmpty)
            .accessibilityLabel("Confirm and add expense")
        } header: {
            Text("New Expense")
        }
    }

    private var countryComplianceSection: some View {
        Section {
            Picker("Destination", selection: $selectedDestinationID) {
                ForEach(PetRelocationView.destinations) { dest in
                    Text(dest.name).tag(dest.id)
                }
            }
            .accessibilityLabel("Select destination country or region")

            VStack(alignment: .leading, spacing: 6) {
                Label("Lead Time: \(selectedDestination.leadTimeWeeks)+ weeks",
                      systemImage: "clock.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(leadTimeColor(weeks: selectedDestination.leadTimeWeeks))
                    .accessibilityLabel("Lead time \(selectedDestination.leadTimeWeeks) or more weeks")

                ForEach(selectedDestination.requirements, id: \.self) { req in
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "checkmark.circle")
                            .foregroundStyle(Color(red: 0.07, green: 0.36, blue: 0.55))
                            .imageScale(.small)
                            .accessibilityHidden(true)
                        Text(req)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }

                if !selectedDestination.notes.isEmpty {
                    Text(selectedDestination.notes)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(.top, 2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.vertical, 4)
        } header: {
            Text("Import Compliance")
        }
    }

    private var alternativeLogisticsSection: some View {
        Section {
            VStack(alignment: .leading, spacing: 8) {
                Label("Dogs on Deployment", systemImage: "pawprint.fill")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(Color(red: 0.46, green: 0.24, blue: 0.00))
                Text("Non-profit offering grants and foster networks for military families when commercial pet shipping costs reach $5,000–$10,000. Active duty, Reserve, and Guard members are eligible.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Contact your installation's Family Readiness Officer or visit dogsondeployment.org.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 4)
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Dogs on Deployment. Non-profit offering grants and foster networks for military pet relocation when costs exceed $5,000. Contact your Family Readiness Officer.")

            VStack(alignment: .leading, spacing: 4) {
                Label("Patriot Express Note", systemImage: "airplane")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                Text("Pets are generally not permitted on Patriot Express (Space-A) flights. Budget for commercial transport for OCONUS moves.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.vertical, 2)
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Patriot Express note. Pets are generally not permitted on Patriot Express flights. Plan for commercial transport.")
        } header: {
            Text("Alternative Logistics & Resources")
        }
    }

    private var disclaimerSection: some View {
        Section {
            Text("Reimbursement limits per JTR Ch. 5 effective January 2024. Import requirements are subject to change — verify with the destination country's embassy or USDA APHIS before travel. Actual entitlements confirmed by Finance / S4.")
                .font(.caption)
                .foregroundStyle(.secondary)
        } header: {
            Text("Disclaimer")
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Disclaimer: Verify import requirements and reimbursement limits with Finance and USDA APHIS.")
    }

    // MARK: - Row Helpers

    private func reimbursementRow(_ label: String, amount: Double,
                                  color: Color, bold: Bool = false,
                                  a11y: String) -> some View {
        HStack {
            Text(label).font(bold ? .body.weight(.semibold) : .body)
            Spacer()
            Text(formatCurrency(amount))
                .font(bold ? .body.weight(.bold) : .body)
                .foregroundStyle(color)
                .monospacedDigit()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(a11y)
    }

    private func expenseRow(_ expense: PetExpense) -> some View {
        HStack(spacing: 12) {
            Image(systemName: expense.category.sfSymbol)
                .foregroundStyle(Color(red: 0.46, green: 0.24, blue: 0.00))
                .frame(width: 24)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(expense.description).font(.body)
                HStack(spacing: 4) {
                    Text(expense.category.rawValue)
                        .font(.caption).foregroundStyle(.secondary)
                    if expense.isReimbursable {
                        Text("· Reimbursable")
                            .font(.caption)
                            .foregroundStyle(Color(red: 0.09, green: 0.43, blue: 0.18))
                    }
                }
            }
            Spacer()
            Text(formatCurrency(expense.amount))
                .font(.body.weight(.semibold))
                .monospacedDigit()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            "\(expense.description), \(expense.category.rawValue), \(formatCurrency(expense.amount))" +
            (expense.isReimbursable ? ", reimbursable" : "")
        )
    }

    // MARK: - Helpers

    private func formatCurrency(_ amount: Double) -> String { String(format: "$%.2f", amount) }

    private func leadTimeColor(weeks: Int) -> Color {
        if weeks >= 20 { return Color(red: 0.62, green: 0.08, blue: 0.08) }
        if weeks >= 8  { return Color(red: 0.46, green: 0.24, blue: 0.00) }
        return Color(red: 0.09, green: 0.43, blue: 0.18)
    }

    // MARK: - Destination Database

    static let destinations: [PetDestination] = [
        PetDestination(
            id: "conus",
            name: "CONUS (Continental US)",
            requirements: [
                "Current rabies vaccination required",
                "Health certificate from licensed veterinarian",
                "State-specific regulations may apply"
            ],
            leadTimeWeeks: 4,
            notes: "Most CONUS moves have minimal import requirements. Check destination state rules for any additional breed or quarantine restrictions."
        ),
        PetDestination(
            id: "japan",
            name: "Japan",
            requirements: [
                "Microchip (ISO 11784/11785) — must be implanted first",
                "Two rabies vaccinations after microchipping (30+ days apart)",
                "Rabies titer test (FAVN) — processed 4–6 weeks at approved lab",
                "180-day wait period after passing titer test",
                "USDA-endorsed health certificate within 10 days of departure"
            ],
            leadTimeWeeks: 32,
            notes: "Japan has a strict 180-day quarantine-avoidance protocol. Begin the process immediately upon receipt of orders. Failure to comply results in mandatory quarantine at owner's expense."
        ),
        PetDestination(
            id: "south_korea",
            name: "South Korea",
            requirements: [
                "Microchip (ISO 11784/11785)",
                "Current rabies vaccination (within 12 months)",
                "USDA-endorsed health certificate within 10 days of departure",
                "Quarantine inspection upon arrival (1–5 days typically)"
            ],
            leadTimeWeeks: 8,
            notes: "SOFA status may expedite some processes. Contact Camp Humphreys or Osan AB veterinary services early."
        ),
        PetDestination(
            id: "germany",
            name: "Germany / Europe (EU)",
            requirements: [
                "ISO microchip (15-digit)",
                "Rabies vaccination (valid and current)",
                "EU-format health certificate (USDA APHIS-endorsed)",
                "Pet passport issued by accredited veterinarian"
            ],
            leadTimeWeeks: 8,
            notes: "An EU Pet Passport simplifies travel within the EU after initial entry. USDA APHIS endorsement of the health certificate is required."
        ),
        PetDestination(
            id: "hawaii",
            name: "Hawaii",
            requirements: [
                "Microchip (ISO 11784/11785)",
                "Two rabies vaccinations (primary + booster 30+ days later)",
                "Rabies titer test ≥0.5 IU/mL at USDA-approved lab",
                "90-day wait after passing titer test (for 5-day-or-less program)",
                "Health certificate within 14 days of travel"
            ],
            leadTimeWeeks: 20,
            notes: "Hawaii maintains rabies-free status. The 5-day-or-less airport program avoids mandatory quarantine but requires advance preparation. Start immediately upon receiving orders."
        ),
        PetDestination(
            id: "guam",
            name: "Guam",
            requirements: [
                "Microchip (ISO standard)",
                "Current rabies vaccination",
                "USDA APHIS-endorsed health certificate",
                "Quarantine may apply based on country of origin"
            ],
            leadTimeWeeks: 8,
            notes: "Contact the Guam Department of Agriculture for the latest requirements. Quarantine facility capacity is limited — plan early."
        ),
    ]
}

// MARK: - Preview

#Preview {
    PetRelocationView()
}
