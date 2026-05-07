// Dynamic PCS Task Generator
export const generatePCSTasks = (user, order) => {
  const tasks = [];
  const baseDate = new Date(order.effective_date);
  const rank = user.rank;
  const dependents = user.dependents || 0;
  const isOCONUS = order.move_type === 'OCONUS';

  // Orders Tasks (Day 1-30)
  tasks.push({
    id: `${order.id}-orders-review`,
    task_name: 'Review Orders',
    task_type: 'orders',
    deadline: addDays(baseDate, 7),
    priority: 'high',
    description: 'Review official PCS order details and enter only required profile fields',
    rank_required: null,
    dependents_required: 0,
    is_oconus: false,
    dependencies: []
  });

  tasks.push({
    id: `${order.id}-orders-verify`,
    task_name: 'Verify Orders Details',
    task_type: 'orders',
    deadline: addDays(baseDate, 14),
    priority: 'high',
    description: 'Confirm effective date, rank, and dependencies',
    rank_required: null,
    dependents_required: 0,
    is_oconus: false,
    dependencies: [`${order.id}-orders-review`]
  });

  // HHG Tasks (Day 15-45)
  tasks.push({
    id: `${order.id}-hhg-schedule`,
    task_name: 'Schedule Household Goods (HHG)',
    task_type: 'hhg',
    deadline: addDays(baseDate, 30),
    priority: 'high',
    description: 'Contact TMO to schedule HHG pickup',
    rank_required: null,
    dependents_required: 0,
    is_oconus: false,
    dependencies: [`${order.id}-orders-verify`]
  });

  tasks.push({
    id: `${order.id}-hhg-inventory`,
    task_name: 'Inventory Household Goods',
    task_type: 'hhg',
    deadline: addDays(baseDate, 25),
    priority: 'medium',
    description: 'Prepare list of items for shipment',
    rank_required: null,
    dependents_required: 0,
    is_oconus: false,
    dependencies: [`${order.id}-hhg-schedule`]
  });

  // Travel Tasks (Day 20-45)
  tasks.push({
    id: `${order.id}-travel-book`,
    task_name: 'Book Travel (Flights)',
    task_type: 'travel',
    deadline: addDays(baseDate, 35),
    priority: 'high',
    description: 'Book transportation to new duty station',
    rank_required: null,
    dependents_required: 0,
    is_oconus: true, // More urgent for OCONUS
    dependencies: [`${order.id}-orders-verify`]
  });

  if (dependents > 0) {
    tasks.push({
      id: `${order.id}-travel-dependents`,
      task_name: 'Arrange Dependent Travel',
      task_type: 'travel',
      deadline: addDays(baseDate, 35),
      priority: 'high',
      description: `Arrange travel for ${dependents} dependent(s)`,
      rank_required: null,
      dependents_required: dependents,
      is_oconus: true,
      dependencies: [`${order.id}-travel-book`]
    });
  }

  // Medical Tasks (Day 10-40)
  tasks.push({
    id: `${order.id}-medical-dental`,
    task_name: 'Complete Medical & Dental Clearance',
    task_type: 'medical',
    deadline: addDays(baseDate, 20),
    priority: 'high',
    description: 'Get medical and dental clearance from current base',
    rank_required: null,
    dependents_required: dependents,
    is_oconus: isOCONUS,
    dependencies: [`${order.id}-orders-verify`]
  });

  if (dependents > 0) {
    tasks.push({
      id: `${order.id}-dependent-medical`,
      task_name: 'Dependent Medical Screening',
      task_type: 'medical',
      deadline: addDays(baseDate, 20),
      priority: 'high',
      description: `Medical screening for ${dependents} dependent(s)`,
      rank_required: null,
      dependents_required: dependents,
      is_oconus: isOCONUS,
      dependencies: [`${order.id}-orders-verify`]
    });
  }

  // OCONUS-specific tasks
  if (isOCONUS) {
    tasks.push({
      id: `${order.id}-passport`,
      task_name: 'Obtain/Renew Passport',
      deadline: addDays(baseDate, 60),
      priority: 'high',
      description: 'Ensure valid passport for OCONUS movement',
      rank_required: null,
      dependents_required: dependents,
      is_oconus: true,
      dependencies: [`${order.id}-orders-verify`]
    });

    if (dependents > 0) {
      tasks.push({
        id: `${order.id}-dependent-passport`,
        task_name: 'Dependent Passports',
        deadline: addDays(baseDate, 60),
        priority: 'high',
        description: `Passports for ${dependents} dependent(s)`,
        rank_required: null,
        dependents_required: dependents,
        is_oconus: true,
        dependencies: [`${order.id}-orders-verify`]
      });
    }

    tasks.push({
      id: `${order.id}-visa`,
      task_name: 'Apply for Visa (if required)',
      deadline: addDays(baseDate, 45),
      priority: 'high',
      description: 'Obtain visa for destination country',
      rank_required: null,
      dependents_required: 0,
      is_oconus: true,
      dependencies: [`${order.id}-passport`]
    });

    tasks.push({
      id: `${order.id}-opsec`,
      task_name: 'OPSEC Briefing',
      deadline: addDays(baseDate, 10),
      priority: 'medium',
      description: 'Complete operational security briefing for OCONUS',
      rank_required: null,
      dependents_required: 0,
      is_oconus: true,
      dependencies: [`${order.id}-orders-verify`]
    });
  }

  // Financial Tasks (Day 30-60)
  tasks.push({
    id: `${order.id}-finance-estimate`,
    task_name: 'Request Financial Estimate',
    task_type: 'reimbursement',
    deadline: addDays(baseDate, 35),
    priority: 'high',
    description: 'Get DLA, TLE, and HHG estimates from finance',
    rank_required: null,
    dependents_required: 0,
    is_oconus: false,
    dependencies: [`${order.id}-orders-verify`]
  });

  tasks.push({
    id: `${order.id}-tds`,
    task_name: 'TDS (Temporary Duty Station) Claim',
    task_type: 'reimbursement',
    deadline: addDays(baseDate, 60),
    priority: 'medium',
    description: 'Submit temporary lodging and meal receipts',
    rank_required: null,
    dependents_required: 0,
    is_oconus: false,
    dependencies: [`${order.id}-travel-book`]
  });

  // Rank-specific tasks
  if (['O1', 'O2', 'O3', 'O4', 'O5', 'O6'].includes(rank.substring(0, 2))) {
    tasks.push({
      id: `${order.id}-reporting`,
      task_name: 'Report to New Commander',
      task_type: 'orders',
      deadline: addDays(baseDate, 1),
      priority: 'high',
      description: 'In-process and report to gaining commander',
      rank_required: 'O1+',
      dependents_required: 0,
      is_oconus: false,
      dependencies: [`${order.id}-travel-book`]
    });
  }

  return tasks;
};

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Risk calculation
export const calculateReadinessScore = (tasks, completedTasks) => {
  if (tasks.length === 0) return 0;
  const completed = completedTasks.length;
  const overdue = tasks.filter(t => new Date(t.deadline) < new Date() && !completedTasks.includes(t.id)).length;
  
  const completionRate = (completed / tasks.length) * 100;
  const overduepenalty = overdue * 10;
  
  return Math.max(0, Math.round(completionRate - overduepenalty));
};

export const identifyRisks = (tasks, completedTasks, order) => {
  const risks = [];
  const now = new Date();

  // Check for overdue tasks
  tasks.forEach(task => {
    if (!completedTasks.includes(task.id)) {
      const deadline = new Date(task.deadline);
      const daysOverdue = Math.ceil((now - deadline) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue > 0) {
        risks.push({
          type: 'overdue_task',
          severity: daysOverdue > 14 ? 'critical' : 'warning',
          task: task.task_name,
          daysOverdue
        });
      } else if (daysOverdue > -7) {
        risks.push({
          type: 'deadline_approaching',
          severity: 'warning',
          task: task.task_name,
          daysUntilDeadline: Math.abs(daysOverdue)
        });
      }
    }
  });

  // Check critical path
  const criticalTasks = ['orders-review', 'hhg-schedule', 'travel-book'];
  const incompleteCritical = tasks.filter(t =>
    criticalTasks.some(ct => t.id.includes(ct)) && !completedTasks.includes(t.id)
  );

  if (incompleteCritical.length > 0) {
    risks.push({
      type: 'critical_path_delay',
      severity: 'critical',
      count: incompleteCritical.length
    });
  }

  return risks;
};
