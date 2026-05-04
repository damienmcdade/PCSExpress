import SwiftUI

// MARK: - Data Model

struct InventoryItem: Identifiable, Codable {
    var id: UUID = UUID()
    var name: String
    var category: ItemCategory
    var purchaseYear: Int
    var replacementValue: Double

    enum ItemCategory: String, CaseIterable, Codable {
        case electronics = "Electronics"
        case furniture   = "Furniture"
        case appliances  = "Appliances"
        case clothing    = "Clothing"
        case tools       = "Tools / Equipment"
        case other       = "Other"

        /// Standard annual depreciation rate by category.
        var annualDepreciationRate: Double {
            switch self {
            case .electronics: return 0.25
            case .furniture:   return 0.10
            case .appliances:  return 0.15
            case .clothing:    return 0.20
            case .tools:       return 0.10
            case .other:       return 0.15
            }
        }

        var sfSymbol: String {
            switch self {
            case .electronics: return "laptopcomputer"
            case .furniture:   return "bed.double.fill"
            case .appliances:  return "washer.fill"
            case .clothing:    return "tshirt.fill"
            case .tools:       return "wrench.and.screwdriver.fill"
            case .other:       return "shippingbox.fill"
            }
        }
    }

    var ageInYears: Int {
        max(0, Calendar.current.component(.year, from: Date()) - purchaseYear)
    }

    var depreciatedValue: Double {
        // Maximum 80 % depreciation cap so total loss is never claimed at zero.
        let depreciation = min(0.80, Double(ageInYears) * category.annualDepreciationRate)
        return replacementValue * (1.0 - depreciation)
    }
}

// MARK: - Main View

/// Section 508-compliant Housing Claims manager.
///
/// Tracks the 180-day loss/damage report window and 9-month full-replacement-value
/// deadline through the Defense Personal Property System (DPS), provides a digital
/// inventory recorder, and estimates depreciated vs. full replacement values.
struct HousingClaimsView: View {

    @State private var moveDate: Date = Calendar.current.date(
        byAdding: .month, value: -1, to: Date()) ?? Date()
    @State private var inventoryItems: [InventoryItem] = []
    @State private var showingAddItem: Bool = false

    @State private var newItemName: String = ""
    @State private var newItemCategory: InventoryItem.ItemCategory = .electronics
    @State private var newItemYear: Int = {
        Calendar.current.component(.year, from: Date()) - 2
    }()
    @State private var newItemValueText: String = ""

    @Environment(\.dismiss) private var dismiss

    private var damageReportDeadline: Date {
        Calendar.current.date(byAdding: .day, value: 180, to: moveDate) ?? moveDate
    }
    private var fullValueDeadline: Date {
        Calendar.current.date(byAdding: .month, value: 9, to: moveDate) ?? moveDate
    }

    private var daysUntilDamage: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: damageReportDeadline).day ?? 0
    }
    private var daysUntilFullValue: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: fullValueDeadline).day ?? 0
    }

    private var totalReplacement: Double { inventoryItems.reduce(0) { $0 + $1.replacementValue } }
    private var totalDepreciated: Double  { inventoryItems.reduce(0) { $0 + $1.depreciatedValue  } }

    private let dateFmt: DateFormatter = {
        let f = DateFormatter(); f.dateStyle = .medium; return f
    }()

    private var currentYear: Int { Calendar.current.component(.year, from: Date()) }

    // MARK: - Body

    var body: some View {
        NavigationView {
            Form {
                moveDateSection
                deadlinesSection
                valueSection
                inventorySection
                if showingAddItem { addItemSection }
                resourcesSection
                disclaimerSection
            }
            .navigationTitle("Housing Claims")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") { dismiss() }
                        .accessibilityLabel("Close housing claims")
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(showingAddItem ? "Cancel" : "Add Item") {
                        showingAddItem.toggle()
                    }
                    .accessibilityLabel(showingAddItem ? "Cancel adding item" : "Add inventory item")
                }
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Sections

    private var moveDateSection: some View {
        Section {
            DatePicker("HHG Pickup Date",
                       selection: $moveDate,
                       in: ...Date(),
                       displayedComponents: .date)
                .accessibilityLabel("Household goods pickup date")
                .accessibilityHint("All claims deadlines are calculated from this date")
        } header: {
            Text("Move Date — HHG Pickup")
        } footer: {
            Text("Set to the date your household goods were picked up by the moving company.")
                .font(.caption)
        }
    }

    private var deadlinesSection: some View {
        Section {
            deadlineRow(
                title: "Damage Report Deadline",
                subtitle: "Loss / Damage Notification to TSP",
                deadline: damageReportDeadline,
                daysRemaining: daysUntilDamage,
                detail: "180-day window from pickup date to file a loss or damage report with your Transportation Service Provider (TSP)."
            )
            deadlineRow(
                title: "Full Replacement Value Deadline",
                subtitle: "DPS Claims Submission",
                deadline: fullValueDeadline,
                daysRemaining: daysUntilFullValue,
                detail: "9-month deadline to file for full replacement value through the Defense Personal Property System (DPS). Missing this window limits recovery to depreciated value."
            )
        } header: {
            Text("Claims Deadlines — HomeSafe Alliance / DPS")
        }
    }

    private var valueSection: some View {
        Section {
            valueRow("Total Full Replacement Value",
                     amount: totalReplacement,
                     color: Color(red: 0.07, green: 0.36, blue: 0.55),
                     bold: true,
                     a11y: "Total full replacement value \(formatCurrency(totalReplacement))")
            valueRow("Estimated Depreciated Value",
                     amount: totalDepreciated,
                     color: .secondary,
                     a11y: "Estimated depreciated value \(formatCurrency(totalDepreciated))")
            valueRow("Potential FRV Exposure",
                     amount: totalReplacement - totalDepreciated,
                     color: Color(red: 0.46, green: 0.24, blue: 0.00),
                     a11y: "Potential exposure between full replacement and depreciated value \(formatCurrency(totalReplacement - totalDepreciated))")
        } header: {
            Text("Replacement Value Calculator")
        } footer: {
            Text("File within the 9-month window to claim full replacement value (FRV). Depreciated value reflects standard DoD depreciation schedules.")
                .font(.caption)
        }
    }

    private var inventorySection: some View {
        Section {
            if inventoryItems.isEmpty {
                Text("No items added. Tap \"Add Item\" to record high-value items before your move.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .accessibilityLabel("No inventory items added yet")
            } else {
                ForEach(inventoryItems) { item in
                    inventoryItemRow(item)
                }
                .onDelete { indexSet in
                    inventoryItems.remove(atOffsets: indexSet)
                }
            }
        } header: {
            Text("Digital Inventory (\(inventoryItems.count) items)")
        } footer: {
            Text("Record high-value items before pickup. Capture \"before\" photos and videos of each item to document its pre-move condition.")
                .font(.caption)
        }
    }

    @ViewBuilder
    private var addItemSection: some View {
        Section {
            TextField("Item Name", text: $newItemName)
                .accessibilityLabel("Item name")
            Picker("Category", selection: $newItemCategory) {
                ForEach(InventoryItem.ItemCategory.allCases, id: \.self) { cat in
                    Text(cat.rawValue).tag(cat)
                }
            }
            .accessibilityLabel("Item category for depreciation calculation")
            Stepper("Purchase Year: \(newItemYear)",
                    value: $newItemYear,
                    in: 1970...currentYear)
                .accessibilityLabel("Purchase year \(newItemYear)")
                .accessibilityHint("Swipe to adjust year. Used to calculate estimated depreciation.")
            HStack {
                Text("Replacement Value")
                Spacer()
                Text("$").foregroundStyle(.secondary)
                TextField("0.00", text: $newItemValueText)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
                    .frame(width: 100)
                    .accessibilityLabel("Current replacement cost in dollars")
            }
            Button("Add to Inventory") {
                let value = Double(newItemValueText) ?? 0
                let item = InventoryItem(
                    name: newItemName.isEmpty ? newItemCategory.rawValue : newItemName,
                    category: newItemCategory,
                    purchaseYear: newItemYear,
                    replacementValue: value
                )
                inventoryItems.append(item)
                newItemName      = ""
                newItemValueText = ""
                newItemCategory  = .electronics
                newItemYear      = currentYear - 2
                showingAddItem   = false
            }
            .disabled(newItemValueText.isEmpty)
            .accessibilityLabel("Confirm and add inventory item")
        } header: {
            Text("New Inventory Item")
        }
    }

    private var resourcesSection: some View {
        Section {
            VStack(alignment: .leading, spacing: 6) {
                Label("Defense Personal Property System (DPS)",
                      systemImage: "globe")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color(red: 0.07, green: 0.36, blue: 0.55))
                Text("Log in to move.mil to file claims, track your shipment status, and submit documentation through the official DPS portal.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.vertical, 4)
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Defense Personal Property System. Log in to move.mil to file claims and track shipments.")

            VStack(alignment: .leading, spacing: 6) {
                Label("HomeSafe Alliance", systemImage: "building.2.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color(red: 0.07, green: 0.36, blue: 0.55))
                Text("HomeSafe Alliance is the prime contractor for the $17B Global Household Goods Contract (GHC). Contact them directly for claims coordination and TSP escalation.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.vertical, 4)
            .accessibilityElement(children: .combine)
            .accessibilityLabel("HomeSafe Alliance. Prime contractor for the Global Household Goods Contract. Contact for claims support.")
        } header: {
            Text("Resources")
        }
    }

    private var disclaimerSection: some View {
        Section {
            Text("Deadlines and depreciation rates are estimates based on DoD/DPS policy. Actual recovery amounts are determined by your TSP and DPS adjudication. Document all damage with time-stamped photos before, during, and after the move.")
                .font(.caption)
                .foregroundStyle(.secondary)
        } header: {
            Text("Disclaimer")
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Disclaimer: Verify entitlements through DPS and your Transportation Service Provider.")
    }

    // MARK: - Row Helpers

    private func deadlineRow(title: String, subtitle: String,
                             deadline: Date, daysRemaining: Int,
                             detail: String) -> some View {
        let statusColor: Color = {
            if daysRemaining < 0  { return Color(red: 0.62, green: 0.08, blue: 0.08) }
            if daysRemaining < 30 { return Color(red: 0.46, green: 0.24, blue: 0.00) }
            return Color(red: 0.09, green: 0.43, blue: 0.18)
        }()
        let statusText: String = {
            if daysRemaining < 0  { return "\(abs(daysRemaining))d overdue" }
            if daysRemaining == 0 { return "Due today" }
            return "\(daysRemaining) days remaining"
        }()

        return VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.body.weight(.semibold))
                    Text(subtitle).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(dateFmt.string(from: deadline))
                        .font(.subheadline).foregroundStyle(statusColor)
                    Text(statusText)
                        .font(.caption.weight(daysRemaining < 30 ? .bold : .regular))
                        .foregroundStyle(statusColor)
                }
            }
            Text(detail)
                .font(.caption).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title). \(detail). Deadline \(dateFmt.string(from: deadline)). \(statusText).")
    }

    private func valueRow(_ label: String, amount: Double,
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

    private func inventoryItemRow(_ item: InventoryItem) -> some View {
        HStack(spacing: 12) {
            Image(systemName: item.category.sfSymbol)
                .foregroundStyle(Color(red: 0.07, green: 0.36, blue: 0.55))
                .frame(width: 24)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name).font(.body.weight(.semibold))
                Text("\(item.category.rawValue) · \(item.ageInYears == 0 ? "This year" : "\(item.ageInYears)yr old")")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(formatCurrency(item.replacementValue))
                    .font(.subheadline.weight(.semibold))
                Text("dep: \(formatCurrency(item.depreciatedValue))")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            "\(item.name), \(item.category.rawValue), \(item.ageInYears) years old, " +
            "replacement value \(formatCurrency(item.replacementValue)), " +
            "depreciated value \(formatCurrency(item.depreciatedValue))"
        )
    }

    // MARK: - Helpers

    private func formatCurrency(_ amount: Double) -> String { String(format: "$%.2f", amount) }
}

// MARK: - Preview

#Preview {
    HousingClaimsView()
}
