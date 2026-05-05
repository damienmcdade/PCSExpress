//
//  PCSMilestoneView.swift
//  PCS Express
//
//  Purpose: Section 508-compliant PCS milestone checklist with local accountability logging.
//  Third-party dependencies: SwiftUI.
//

import SwiftUI

/// Section 508-compliant PCS Compliance Checklist.
///
/// Presents JTR-aligned PCS milestones with deadlines calculated dynamically
/// from the service member's RNLTD (Report No Later Than Date).
/// Conforms to: Dynamic Type, VoiceOver, minimum 44×44 pt tap targets.
struct PCSMilestoneView: View {

    @StateObject private var manager: PCSChecklistManager
    @Environment(\.dismiss) private var dismiss

    init(initialReportDate: Date? = nil) {
        _manager = StateObject(wrappedValue: PCSChecklistManager(reportDate: initialReportDate))
    }

    // MARK: - Body

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                rnltdHeader
                progressBanner
                milestoneList
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("PCS Compliance")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") { dismiss() }
                        .accessibilityLabel("Close PCS compliance checklist")
                }
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Sub-views

    private var rnltdHeader: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("RNLTD — REPORT NO LATER THAN DATE")
                .font(.caption2.weight(.bold))
                .foregroundStyle(.secondary)
            DatePicker("Report Date",
                       selection: $manager.reportDate,
                       displayedComponents: .date)
                .labelsHidden()
                .accessibilityLabel("Report no later than date")
                .accessibilityHint("All milestone deadlines are recalculated from this date")
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(.secondarySystemGroupedBackground))
    }

    private var progressBanner: some View {
        let pct   = manager.completionPct
        let label = "\(manager.completedCount) of \(manager.milestones.count) milestones complete, " +
                    "\(Int(pct * 100)) percent. " +
                    "\(manager.mandatoryDone) of \(manager.mandatoryCount) mandatory complete."
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Progress: \(manager.completedCount)/\(manager.milestones.count)")
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
                        .fill(Color(red: 0.09, green: 0.43, blue: 0.18))
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

    private var milestoneList: some View {
        List {
            ForEach(manager.milestones) { milestone in
                MilestoneRow(
                    milestone:  milestone,
                    deadline:   milestone.deadline(relativeTo: manager.reportDate),
                    onToggle:   {
                        manager.toggleCompletion(for: milestone.id)
                        AuditLogger.shared.record("pcs_milestone_status_change", details: [
                            "milestone": milestone.title,
                            "id": milestone.id.uuidString,
                        ])
                    }
                )
            }
        }
        .listStyle(.insetGrouped)
        .animation(.easeInOut(duration: 0.2), value: manager.milestones.map(\.isCompleted))
    }
}

// MARK: - Milestone Row

private struct MilestoneRow: View {

    let milestone: PCSMilestone
    let deadline:  Date
    let onToggle:  () -> Void

    @ScaledMetric(relativeTo: .body) private var minHeight: CGFloat = 56

    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        return f
    }()

    private var daysUntil: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: deadline).day ?? 0
    }

    private var statusColor: Color {
        if milestone.isCompleted { return Color(red: 0.09, green: 0.43, blue: 0.18) }
        if daysUntil < 0         { return Color(red: 0.62, green: 0.08, blue: 0.08) }
        if daysUntil < 14        { return Color(red: 0.46, green: 0.24, blue: 0.00) }
        return .secondary
    }

    private var deadlineSummary: String {
        if milestone.isCompleted { return "Complete" }
        if daysUntil < 0  { return "\(abs(daysUntil))d overdue" }
        if daysUntil == 0 { return "Due today" }
        return "Due \(dateFormatter.string(from: deadline))"
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            mandatoryBadge
                .padding(.top, 3)

            VStack(alignment: .leading, spacing: 3) {
                Text(milestone.title)
                    .font(.body.weight(.semibold))
                    .strikethrough(milestone.isCompleted)
                    .foregroundStyle(milestone.isCompleted ? .tertiary : .primary)

                Text(milestone.detail)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .imageScale(.small)
                        .accessibilityHidden(true)
                    Text(deadlineSummary)
                        .font(daysUntil < 0 && !milestone.isCompleted
                              ? .caption.weight(.bold)
                              : .caption)
                }
                .foregroundStyle(statusColor)
            }

            Spacer(minLength: 0)

            // Toggle — minimum 44×44 pt per HIG and Section 508.
            Button(action: onToggle) {
                Image(systemName: milestone.isCompleted
                      ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(milestone.isCompleted
                                     ? Color(red: 0.09, green: 0.43, blue: 0.18)
                                     : Color(.systemGray3))
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel(milestone.isCompleted ? "Mark incomplete" : "Mark complete")
            .accessibilityHint("Double-tap to toggle completion for \(milestone.title)")
        }
        .padding(.vertical, 4)
        .frame(minHeight: minHeight)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(rowAccessibilityLabel)
        .accessibilityHint("Double-tap to toggle completion")
        .accessibilityAddTraits(milestone.isCompleted ? [.isButton, .isSelected] : .isButton)
    }

    @ViewBuilder
    private var mandatoryBadge: some View {
        if milestone.isMandatory {
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

    private var rowAccessibilityLabel: String {
        let parts: [String] = [
            milestone.title,
            milestone.detail,
            milestone.isMandatory ? "Mandatory" : "Optional",
            deadlineSummary,
            milestone.isCompleted ? "Complete" : "Incomplete",
        ]
        return parts.joined(separator: ". ")
    }
}

// MARK: - Preview

#Preview {
    PCSMilestoneView()
}
