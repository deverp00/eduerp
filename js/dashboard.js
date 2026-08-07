// ============================================================
// DASHBOARD MODULE
// ============================================================

function renderDashboard() {
  const students = window.STUDENTS || [];
  const teachers = window.TEACHERS || [];
  const fees = window.FEE_RECORDS || [];
  const salary = window.SALARY_RECORDS || [];
  const activities = window.ACTIVITIES || [];

  // Calculate KPIs
  const totalStudents = students.length;
  const totalTeachers = teachers.filter(t => t.role === 'teacher').length;
  const totalStaff = teachers.filter(t => t.role === 'staff').length;
  const totalCollected = fees.reduce((sum, f) => sum + (f.paid || 0), 0);
  const totalPending = fees.reduce((sum, f) => sum + (f.pending || 0), 0);
  const totalSalaryPaid = salary.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalSalaryPending = salary.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.amount || 0), 0);

  // Stats grid
  const statsGrid = document.getElementById('statsGrid');
  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card"><span class="stat-label">Total Students</span><span class="stat-value">${totalStudents}</span></div>
      <div class="stat-card"><span class="stat-label">Total Teachers</span><span class="stat-value">${totalTeachers}</span></div>
      <div class="stat-card"><span class="stat-label">Total Staff</span><span class="stat-value">${totalStaff}</span></div>
      <div class="stat-card"><span class="stat-label">Fee Collected</span><span class="stat-value">₹${totalCollected.toLocaleString()}</span></div>
      <div class="stat-card"><span class="stat-label">Pending Fees</span><span class="stat-value">₹${totalPending.toLocaleString()}</span></div>
      <div class="stat-card"><span class="stat-label">Salary Paid</span><span class="stat-value">₹${totalSalaryPaid.toLocaleString()}</span></div>
      <div class="stat-card"><span class="stat-label">Salary Pending</span><span class="stat-value">₹${totalSalaryPending.toLocaleString()}</span></div>
    `;
  }

  // Recent activities
  const activityContainer = document.getElementById('recentActivities');
  if (activityContainer) {
    if (activities.length === 0) {
      activityContainer.innerHTML = `<p style="color: var(--gray-500); font-size: 0.9rem;">No recent activities.</p>`;
    } else {
      activityContainer.innerHTML = activities.map(act => `
        <div class="activity-item">
          <div class="activity-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="activity-content">
            <div class="activity-text">${act.text || 'No details'}</div>
            <div class="activity-time">${act.time || 'Just now'}</div>
          </div>
        </div>
      `).join('');
    }
  }
}

// ============================================================
// QUICK ACTION BUTTONS
// ============================================================

document.querySelectorAll('.quick-action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    switch (action) {
      case 'addStudent':
        if (window.showAddStudentModal) window.showAddStudentModal();
        break;
      case 'addTeacher':
        if (window.showAddStaffModal) window.showAddStaffModal();
        break;
      case 'addSalary':
        if (window.showAddSalaryModal) window.showAddSalaryModal();
        break;
      case 'viewFees':
        if (window.navigateTo) window.navigateTo('fees');
        break;
      default:
        console.warn('Unknown action:', action);
    }
  });
});

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderDashboard = renderDashboard;
