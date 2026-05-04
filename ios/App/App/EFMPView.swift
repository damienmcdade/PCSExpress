import SwiftUI

// MARK: - Data Model

struct EFMPTask: Identifiable, Codable {
    var id: UUID = UUID()
    var title: String
    var detail: String
    var category: EFMPCategory
    var isComplete: Bool
    var isMandatory: Bool

    enum EFMPCategory: String, CaseIterable, Codable {
        case enrollment = "Enrollment"
        case medicalDocs = "Medical Docs"
        case housing    = "Housing"
        case education  = "Education"
        case transfer   = "Transfer"

        var sfSymbol: String {
            switch self {
            case .enrollment: return "person.crop.circle.fill"
            case .medicalDocs: return "doc.text.fill"
            case .housing:    return "house.fill"
            case .education:  return "graduationcap.fill"
            case .transfer:   return "arrow.triangle.2.circlepath"
            }
        }

        /// Section 508 / WCAG AA-compliant colors (≥4.5:1 contrast on white).
        var color: Color {
            switch self {
            case .enrollment: return Color(red: 0.07, green: 0.36, blue: 0.55)
            case .medicalDocs: return Color(red: 0.62, green: 0.08, blue: 0.08)
            case .housing:    return Color(red: 0.09, green: 0.43, blue: 0.18)
            case .education:  return Color(red: 0.28, green: 0.18, blue: 0.55)
            case .transfer:   return Color(red: 0.46, green: 0.24, blue: 0.00)
            }
        }
    }
}

// MARK: - Manager

final class EFMPChecklistManager: ObservableObject {
    @Published var tasks: [EFMPTask] = EFMPChecklistManager.defaultTasks
    @Published var selectedCategory: EFMPTask.EFMPCategory? = nil

    var filteredTasks: [EFMPTask] {
        guard let cat = selectedCategory else { return tasks }
        return tasks.filter { $0.category == cat }
    }

    var completedCount: Int { tasks.filter(\.isComplete).count }
    var mandatoryCount: Int { tasks.filter(\.isMandatory).count }
    var mandatoryDone: Int  { tasks.filter { $0.isMandatory && $0.isComplete }.count }
    var completionPct: Double {
        tasks.isEmpty ? 0 : Double(completedCount) / Double(tasks.count)
    }

    func toggleCompletion(for id: UUID) {
        guard let idx = tasks.firstIndex(where: { $0.id == id }) else { return }
        tasks[idx].isComplete.toggle()
    }

    // MARK: Default Task List

    static let defaultTasks: [EFMPTask] = [

        // Enrollment
        EFMPTask(title: "Request EFMP Eligibility Screening",
                 detail: "Contact your installation's EFMP office to initiate screening for any family member with special medical or educational needs.",
                 category: .enrollment, isComplete: false, isMandatory: true),
        EFMPTask(title: "Complete DD Form 2792",
                 detail: "Family Member Medical Summary — must be completed by a physician or licensed provider. Required for all EFMP enrollees.",
                 category: .enrollment, isComplete: false, isMandatory: true),
        EFMPTask(title: "Complete DD Form 2792-1",
                 detail: "Special Education / Early Intervention Summary — required if the family member receives special education or EIS services.",
                 category: .enrollment, isComplete: false, isMandatory: false),
        EFMPTask(title: "Submit EFMP Enrollment Package",
                 detail: "Submit all required forms to the Military Treatment Facility (MTF) for review and official enrollment determination.",
                 category: .enrollment, isComplete: false, isMandatory: true),

        // Medical Docs
        EFMPTask(title: "Gather Current Medical Records",
                 detail: "Collect complete medical records, therapy evaluations, specialist notes, and medication lists from all current providers.",
                 category: .medicalDocs, isComplete: false, isMandatory: true),
        EFMPTask(title: "Request Medical Records Transfer",
                 detail: "Request official transfer of all medical records to the gaining MTF. Allow 30–60 days for processing.",
                 category: .medicalDocs, isComplete: false, isMandatory: true),
        EFMPTask(title: "Obtain 90-Day Medication Supply",
                 detail: "Secure a 90-day supply of all medications and obtain transferable prescriptions from current providers for continuity of care.",
                 category: .medicalDocs, isComplete: false, isMandatory: false),
        EFMPTask(title: "Document Durable Medical Equipment (DME)",
                 detail: "Inventory and photograph all DME. Verify that equivalent equipment and services are available at the gaining installation.",
                 category: .medicalDocs, isComplete: false, isMandatory: false),

        // Housing
        EFMPTask(title: "Submit EFMP Housing Priority Request",
                 detail: "EFMP families receive priority placement on housing waitlists. Submit documentation to the gaining installation's housing office early.",
                 category: .housing, isComplete: false, isMandatory: false),
        EFMPTask(title: "Verify Accessibility Requirements",
                 detail: "Confirm available housing units meet ADA / Section 504 accessibility standards for the family member's specific needs.",
                 category: .housing, isComplete: false, isMandatory: false),
        EFMPTask(title: "Coordinate Temporary Lodging Accommodations",
                 detail: "If accessible TLF units are needed, notify the gaining installation's lodging office and EFMP coordinator in advance.",
                 category: .housing, isComplete: false, isMandatory: false),

        // Education
        EFMPTask(title: "Contact School Liaison Officer (SLO)",
                 detail: "The SLO at the gaining installation facilitates enrollment in DoDEA or local public schools and coordinates IEP / 504 plan transfers.",
                 category: .education, isComplete: false, isMandatory: true),
        EFMPTask(title: "Transfer Current IEP or 504 Plan",
                 detail: "Request a certified copy of the current IEP or 504 plan from the current school district. Provide to the gaining district before the first school day.",
                 category: .education, isComplete: false, isMandatory: false),
        EFMPTask(title: "Research Early Intervention Services (EIS)",
                 detail: "For children under age 3, research Part C Early Intervention programs available in the gaining installation's community.",
                 category: .education, isComplete: false, isMandatory: false),
        EFMPTask(title: "Request Extended School Year (ESY) Documentation",
                 detail: "If the family member qualifies for ESY services, request documentation and notify the gaining school district of eligibility before summer.",
                 category: .education, isComplete: false, isMandatory: false),

        // Transfer
        EFMPTask(title: "EFMP Reassignment Screening (OCONUS)",
                 detail: "OCONUS PCS orders trigger an automatic EFMP reassignment screening to verify the gaining location has adequate services. Allow extra time.",
                 category: .transfer, isComplete: false, isMandatory: false),
        EFMPTask(title: "Connect with ACS / EFMP-M Case Manager",
                 detail: "Army Community Service (ACS) EFMP-M managers provide relocation coordination. Contact the gaining installation's ACS office before arrival.",
                 category: .transfer, isComplete: false, isMandatory: false),
        EFMPTask(title: "Re-Enroll at Gaining MTF",
                 detail: "Update EFMP enrollment with the gaining MTF within 30 days of arrival. Bring all documentation and medical records from the losing installation.",
                 category: .transfer, isComplete: false, isMandatory: true),
    ]
}

// MARK: - Main View

/// Section 508-compliant EFMP specialized checklist.
///
/// Covers Exceptional Family Member Program enrollment, medical documentation,
/// housing coordination, education transfers, and installation-to-installation handoff.
struct EFMPView: View {

    @StateObject private var manager = EFMPChecklistManager()
    @Environment(\.dismiss) private var dismiss

    // MARK: - Body

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                progressBanner
                categoryFilter
                taskList
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("EFMP Checklist")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") { dismiss() }
                        .accessibilityLabel("Close EFMP checklist")
                }
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Sub-views

    private var progressBanner: some View {
        let pct   = manager.completionPct
        let label = "\(manager.completedCount) of \(manager.tasks.count) tasks complete, " +
                    "\(Int(pct * 100)) percent. " +
                    "\(manager.mandatoryDone) of \(manager.mandatoryCount) mandatory complete."
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Progress: \(manager.completedCount)/\(manager.tasks.count)")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Text("Mandatory: \(manager.mandatoryDone)/\(manager.mandatoryCount)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 5)
                        .fill(Color(.systemGray5))
                        .frame(height: 10)
                    RoundedRectangle(cornerRadius: 5)
                        .fill(Color(red: 0.07, green: 0.36, blue: 0.55))
                        .frame(width: geo.size.width * pct, height: 10)
                        .animation(.easeInOut(duration: 0.3), value: pct)
                }
            }
            .frame(height: 10)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(.secondarySystemGroupedBackground))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityAddTraits(.updatesFrequently)
    }

    private var categoryFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                filterPill(label: "All", category: nil)
                ForEach(EFMPTask.EFMPCategory.allCases, id: \.self) { cat in
                    filterPill(label: cat.rawValue, category: cat)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
        }
        .background(Color(.secondarySystemGroupedBackground))
        .accessibilityLabel("Filter EFMP tasks by category")
    }

    private func filterPill(label: String,
                            category: EFMPTask.EFMPCategory?) -> some View {
        let isSelected = manager.selectedCategory == category
        let accent     = category?.color ?? Color(red: 0.07, green: 0.36, blue: 0.55)
        return Button {
            manager.selectedCategory = category
        } label: {
            Text(label)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(isSelected ? .white : accent)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(Capsule().fill(isSelected ? accent : Color(.systemGray6)))
        }
        .accessibilityLabel("\(label) filter")
        .accessibilityHint(isSelected ? "Currently selected" : "Double-tap to filter by \(label)")
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }

    private var taskList: some View {
        List {
            if manager.filteredTasks.isEmpty {
                Text("All tasks complete in this category!")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .listRowBackground(Color.clear)
                    .accessibilityLabel("All tasks complete in this category")
            } else {
                ForEach(manager.filteredTasks) { task in
                    EFMPTaskRow(task: task,
                                onToggle: { manager.toggleCompletion(for: task.id) })
                }
            }
        }
        .listStyle(.insetGrouped)
        .animation(.easeInOut(duration: 0.2), value: manager.filteredTasks.map(\.id))
    }
}

// MARK: - Task Row

private struct EFMPTaskRow: View {

    let task: EFMPTask
    let onToggle: () -> Void

    @ScaledMetric(relativeTo: .body) private var minHeight: CGFloat = 56

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            mandatoryBadge.padding(.top, 3)

            VStack(alignment: .leading, spacing: 3) {
                Text(task.title)
                    .font(.body.weight(.semibold))
                    .strikethrough(task.isComplete)
                    .foregroundStyle(task.isComplete ? .tertiary : .primary)

                Text(task.detail)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)

                Label(task.category.rawValue, systemImage: task.category.sfSymbol)
                    .font(.caption)
                    .foregroundStyle(task.category.color)
                    .accessibilityHidden(true)
            }

            Spacer(minLength: 0)

            // Toggle — minimum 44×44 pt per HIG and Section 508.
            Button(action: onToggle) {
                Image(systemName: task.isComplete
                      ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(task.isComplete
                                     ? Color(red: 0.09, green: 0.43, blue: 0.18)
                                     : Color(.systemGray3))
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel(task.isComplete ? "Mark incomplete" : "Mark complete")
            .accessibilityHint("Double-tap to toggle completion for \(task.title)")
        }
        .padding(.vertical, 4)
        .frame(minHeight: minHeight)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(rowA11yLabel)
        .accessibilityHint("Double-tap to toggle completion")
        .accessibilityAddTraits(task.isComplete ? [.isButton, .isSelected] : .isButton)
    }

    @ViewBuilder
    private var mandatoryBadge: some View {
        if task.isMandatory {
            Text("M")
                .font(.system(size: 8, weight: .black))
                .foregroundStyle(.white)
                .frame(width: 18, height: 18)
                .background(Color(red: 0.62, green: 0.08, blue: 0.08))
                .clipShape(Circle())
                .accessibilityHidden(true)
        } else {
            Circle()
                .fill(Color(.systemGray5))
                .frame(width: 18, height: 18)
                .accessibilityHidden(true)
        }
    }

    private var rowA11yLabel: String {
        [
            task.title,
            task.detail,
            task.category.rawValue,
            task.isMandatory ? "Mandatory" : "Optional",
            task.isComplete  ? "Complete"  : "Incomplete",
        ].joined(separator: ". ")
    }
}

// MARK: - Preview

#Preview {
    EFMPView()
}
