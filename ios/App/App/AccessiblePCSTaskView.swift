import SwiftUI

// MARK: - Data model

struct PCSTask: Identifiable {
    let id: UUID
    var title: String
    var detail: String
    var category: TaskCategory
    var isComplete: Bool
    var dueDate: Date?

    enum TaskCategory: String, CaseIterable {
        case housing     = "Housing"
        case finance     = "Finance"
        case medical     = "Medical"
        case vehicle     = "Vehicle"
        case schools     = "Schools"
        case admin       = "Admin"

        var sfSymbol: String {
            switch self {
            case .housing:  return "house.fill"
            case .finance:  return "dollarsign.circle.fill"
            case .medical:  return "cross.case.fill"
            case .vehicle:  return "car.fill"
            case .schools:  return "graduationcap.fill"
            case .admin:    return "doc.fill"
            }
        }

        /// Section 508 / WCAG AA-compliant colors (≥4.5:1 contrast on white background).
        var color: Color {
            switch self {
            case .housing:  return Color(red: 0.07, green: 0.36, blue: 0.55)   // #12 5C8D
            case .finance:  return Color(red: 0.09, green: 0.43, blue: 0.18)   // #176E2E
            case .medical:  return Color(red: 0.62, green: 0.08, blue: 0.08)   // #9E1414
            case .vehicle:  return Color(red: 0.46, green: 0.24, blue: 0.00)   // #753D00
            case .schools:  return Color(red: 0.28, green: 0.18, blue: 0.55)   // #472E8D
            case .admin:    return Color(red: 0.08, green: 0.38, blue: 0.43)   // #15616E
            }
        }
    }
}

// MARK: - Main dashboard view

/// Section 508-compliant PCS task dashboard.
/// Supports Dynamic Type (all text uses scaled system fonts), VoiceOver labels,
/// and keyboard/Switch Control navigation.
struct AccessiblePCSTaskView: View {

    @State private var tasks: [PCSTask] = PCSTask.samples
    @State private var selectedCategory: PCSTask.TaskCategory? = nil
    @State private var showCompleted = true

    // Dynamic Type scaling for layout spacing.
    @ScaledMetric(relativeTo: .body) private var rowMinHeight: CGFloat = 52

    private var filteredTasks: [PCSTask] {
        tasks.filter { task in
            (selectedCategory == nil || task.category == selectedCategory) &&
            (showCompleted || !task.isComplete)
        }
    }

    private var completedCount: Int { tasks.filter(\.isComplete).count }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                progressHeader
                categoryFilter
                taskList
            }
            .navigationTitle("PCS Checklist")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    showCompletedToggle
                }
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Sub-views

    /// Progress bar with VoiceOver announcement of overall completion status.
    private var progressHeader: some View {
        let pct  = tasks.isEmpty ? 0.0 : Double(completedCount) / Double(tasks.count)
        let label = "\(completedCount) of \(tasks.count) tasks complete, \(Int(pct * 100)) percent"
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Overall Progress")
                    .font(.headline)
                Spacer()
                Text("\(completedCount)/\(tasks.count)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(.systemGray5))
                        .frame(height: 12)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(red: 0.07, green: 0.36, blue: 0.55))
                        .frame(width: geo.size.width * pct, height: 12)
                }
            }
            .frame(height: 12)
        }
        .padding()
        // Single VoiceOver element for the whole header section.
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityAddTraits(.updatesFrequently)
    }

    /// Horizontally scrolling category filter pills.
    private var categoryFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                filterPill(label: "All", category: nil)
                ForEach(PCSTask.TaskCategory.allCases, id: \.self) { cat in
                    filterPill(label: cat.rawValue, category: cat)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
        }
        .accessibilityLabel("Filter tasks by category")
    }

    private func filterPill(label: String, category: PCSTask.TaskCategory?) -> some View {
        let isSelected = selectedCategory == category
        return Button {
            selectedCategory = category
        } label: {
            Text(label)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(isSelected ? .white : Color(red: 0.07, green: 0.36, blue: 0.55))
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(
                    Capsule()
                        .fill(isSelected
                              ? Color(red: 0.07, green: 0.36, blue: 0.55)
                              : Color(.systemGray6))
                )
        }
        .accessibilityLabel("\(label) filter")
        .accessibilityHint(isSelected ? "Currently selected" : "Double-tap to filter by \(label)")
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }

    private var taskList: some View {
        List {
            if filteredTasks.isEmpty {
                Text(showCompleted ? "No tasks in this category." : "All tasks complete!")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .listRowBackground(Color.clear)
                    .accessibilityLabel(showCompleted ? "No tasks in this category" : "All tasks complete")
            } else {
                ForEach($tasks) { $task in
                    if filteredTasks.contains(where: { $0.id == task.id }) {
                        TaskRow(task: $task, minHeight: rowMinHeight)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .animation(.easeInOut(duration: 0.2), value: filteredTasks.map(\.id))
    }

    private var showCompletedToggle: some View {
        Button {
            showCompleted.toggle()
        } label: {
            Image(systemName: showCompleted ? "eye.fill" : "eye.slash.fill")
                .imageScale(.large)
        }
        .accessibilityLabel(showCompleted ? "Hide completed tasks" : "Show completed tasks")
        .accessibilityHint("Double-tap to toggle visibility of completed tasks")
    }
}

// MARK: - Task row

/// Individual task row — fully accessible as a single interactive element.
private struct TaskRow: View {

    @Binding var task: PCSTask
    let minHeight: CGFloat
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .none
        return f
    }()

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            // Category icon — hidden from VoiceOver (redundant; label covers it).
            Image(systemName: task.category.sfSymbol)
                .foregroundStyle(task.category.color)
                .font(.title3)
                .frame(width: 28, height: 28)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 3) {
                Text(task.title)
                    .font(.body.weight(.semibold))
                    .strikethrough(task.isComplete)
                    .foregroundStyle(task.isComplete ? .secondary : .primary)

                Text(task.detail)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)

                if let due = task.dueDate {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .imageScale(.small)
                            .accessibilityHidden(true)
                        Text("Due \(dateFormatter.string(from: due))")
                            .font(.caption)
                    }
                    .foregroundStyle(dueDateColor(for: due))
                }
            }

            Spacer()

            // Completion toggle — minimum 44×44 pt tap target per HIG / Section 508.
            Button {
                task.isComplete.toggle()
            } label: {
                Image(systemName: task.isComplete
                      ? "checkmark.circle.fill"
                      : "circle")
                    .font(.title2)
                    .foregroundStyle(task.isComplete
                                     ? Color(red: 0.09, green: 0.43, blue: 0.18)
                                     : Color(.systemGray3))
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel(task.isComplete ? "Mark incomplete" : "Mark complete")
            .accessibilityHint("Double-tap to toggle completion for \(task.title)")
        }
        .padding(.vertical, 6)
        .frame(minHeight: minHeight)
        // Combine the entire row into one VoiceOver element for efficient navigation.
        .accessibilityElement(children: .combine)
        .accessibilityLabel(rowAccessibilityLabel)
        .accessibilityHint("Double-tap to toggle completion")
        .accessibilityAddTraits(task.isComplete ? [.isButton, .isSelected] : .isButton)
    }

    private var rowAccessibilityLabel: String {
        var parts = [task.category.rawValue, task.title, task.detail]
        if let due = task.dueDate {
            parts.append("Due \(dateFormatter.string(from: due))")
        }
        parts.append(task.isComplete ? "Complete" : "Incomplete")
        return parts.joined(separator: ", ")
    }

    private func dueDateColor(for date: Date) -> Color {
        let days = Calendar.current.dateComponents([.day], from: Date(), to: date).day ?? 0
        if days < 0  { return Color(red: 0.62, green: 0.08, blue: 0.08) }  // overdue
        if days < 7  { return Color(red: 0.46, green: 0.24, blue: 0.00) }  // soon
        return .secondary
    }
}

// MARK: - Sample data

extension PCSTask {
    static let samples: [PCSTask] = [
        PCSTask(id: UUID(), title: "Submit Housing Application",
                detail: "Apply for on-post housing or BAH approval at gaining installation.",
                category: .housing, isComplete: false,
                dueDate: Calendar.current.date(byAdding: .day, value: 30, to: Date())),
        PCSTask(id: UUID(), title: "Update DEERS/ID Cards",
                detail: "Update family member information at nearest ID card facility.",
                category: .admin, isComplete: false,
                dueDate: Calendar.current.date(byAdding: .day, value: 14, to: Date())),
        PCSTask(id: UUID(), title: "Schedule Medical Records Transfer",
                detail: "Request transfer of all family medical records to gaining MTF.",
                category: .medical, isComplete: true, dueDate: nil),
        PCSTask(id: UUID(), title: "File DPS Shipment",
                detail: "Schedule household goods pickup through Defense Personal Property System.",
                category: .admin, isComplete: false,
                dueDate: Calendar.current.date(byAdding: .day, value: -3, to: Date())),
        PCSTask(id: UUID(), title: "Enroll Children in EFMP",
                detail: "Complete Exceptional Family Member Program enrollment if applicable.",
                category: .medical, isComplete: false, dueDate: nil),
        PCSTask(id: UUID(), title: "Research Schools",
                detail: "Contact School Liaison Officer at gaining installation.",
                category: .schools, isComplete: false,
                dueDate: Calendar.current.date(byAdding: .day, value: 45, to: Date())),
        PCSTask(id: UUID(), title: "Vehicle Shipment / POV",
                detail: "Schedule POV shipment or plan driving route to new duty station.",
                category: .vehicle, isComplete: false,
                dueDate: Calendar.current.date(byAdding: .day, value: 21, to: Date())),
        PCSTask(id: UUID(), title: "Update TSP / Thrift Savings Plan",
                detail: "Verify allotment and beneficiary information with finance.",
                category: .finance, isComplete: false, dueDate: nil),
    ]
}

// MARK: - Preview

#Preview {
    AccessiblePCSTaskView()
}
