// ============================================================
// REPORTS & ANALYTICS – Charts, KPIs, Filters
// ============================================================

let chartInstances = {};

// ============================================================
// RENDER ANALYTICS DASHBOARD
// ============================================================

function renderAnalytics() {
  const students = window.STUDENTS || [];
  const teachers = window.TEACHERS || [];
  const fees = window.FEE_RECORDS || [];
  const salary = window.SALARY_RECORDS || [];
  const payments = window.PAYMENTS || [];

  // --- KPI Cards ---
  const totalStudents = students.length;
  const totalTeachers = teachers.filter(t => t.role === 'teacher').length;
  const totalStaff = teachers.filter(t => t.role === 'staff').length;
  const totalCollected = fees.reduce((sum, f) => sum + (f.paid || 0), 0);
  const totalPending = fees.reduce((sum, f) => sum + (f.pending || 0), 0);
  const totalSalaryPaid = salary.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalSalaryPending = salary.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.amount || 0), 0);
  const overdueCount = fees.filter(f => f.status === 'overdue').length;

  const statsGrid = document.getElementById('analyticsStatsGrid');
  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card"><span class="stat-label">Total Students</span><span class="stat-value">${totalStudents}</span></div>
      <div class="stat-card"><span class="stat-label">Total Teachers</span><span class="stat-value">${totalTeachers}</span></div>
      <div class="stat-card"><span class="stat-label">Total Staff</span><span class="stat-value">${totalStaff}</span></div>
      <div class="stat-card"><span class="stat-label">Fee Collected</span><span class="stat-value">₹${totalCollected.toLocaleString()}</span></div>
      <div class="stat-card"><span class="stat-label">Pending Fees</span><span class="stat-value">₹${totalPending.toLocaleString()}</span></div>
      <div class="stat-card"><span class="stat-label">Overdue</span><span class="stat-value">${overdueCount}</span></div>
      <div class="stat-card"><span class="stat-label">Salary Paid</span><span class="stat-value">₹${totalSalaryPaid.toLocaleString()}</span></div>
      <div class="stat-card"><span class="stat-label">Salary Pending</span><span class="stat-value">₹${totalSalaryPending.toLocaleString()}</span></div>
    `;
  }

  // --- Charts ---
  renderCharts();
}

// ============================================================
// CHART RENDERING
// ============================================================

function renderCharts() {
  const students = window.STUDENTS || [];
  const teachers = window.TEACHERS || [];
  const fees = window.FEE_RECORDS || [];
  const payments = window.PAYMENTS || [];

  // Destroy existing chart instances
  Object.values(chartInstances).forEach(chart => chart.destroy());
  chartInstances = {};

  // 1. Students per Class (Bar chart)
  const classCounts = {};
  students.forEach(s => { classCounts[s.class] = (classCounts[s.class] || 0) + 1; });
  const classes = Object.keys(classCounts).sort((a, b) => a - b);
  const counts = classes.map(c => classCounts[c]);

  const ctx1 = document.getElementById('chartStudentsByClass');
  if (ctx1 && typeof Chart !== 'undefined') {
    chartInstances.studentsByClass = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: classes.map(c => `Class ${c}`),
        datasets: [{
          label: 'Students',
          data: counts,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // 2. Fee Collection Trend (Line chart – dummy monthly data)
  // For a real trend, we'd need payment dates. We'll use dummy data for demo.
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  // If we have payments with dates, we can aggregate; otherwise use dummy.
  // Let's try to extract from payments if available.
  let monthlyData = months.map(m => 0);
  if (payments.length > 0) {
    // Simple: group by month name (or month index)
    const now = new Date();
    const currentYear = now.getFullYear();
    for (let i = 0; i < 6; i++) {
      const m = now.getMonth() - i;
      const monthName = new Date(currentYear, m).toLocaleString('default', { month: 'short' });
      // Sum payments for that month (simplified: only if same year)
      const sum = payments
        .filter(p => {
          const d = new Date(p.date);
          return d.getMonth() === m && d.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      monthlyData[5 - i] = sum;
    }
  } else {
    // Fallback dummy
    monthlyData = [5000, 7000, 6000, 9000, 8000, 12000];
  }

  const ctx2 = document.getElementById('chartFeeTrend');
  if (ctx2 && typeof Chart !== 'undefined') {
    chartInstances.feeTrend = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Fee Collected (₹)',
          data: monthlyData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // 3. Fee Status Distribution (Pie chart)
  const paid = fees.filter(f => f.status === 'paid').length;
  const pending = fees.filter(f => f.status === 'pending').length;
  const overdue = fees.filter(f => f.status === 'overdue').length;

  const ctx3 = document.getElementById('chartFeeStatus');
  if (ctx3 && typeof Chart !== 'undefined') {
    chartInstances.feeStatus = new Chart(ctx3, {
      type: 'pie',
      data: {
        labels: ['Paid', 'Pending', 'Overdue'],
        datasets: [{
          data: [paid, pending, overdue],
          backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  // 4. Teacher vs Staff (Donut chart)
  const teacherCount = teachers.filter(t => t.role === 'teacher').length;
  const staffCount = teachers.filter(t => t.role === 'staff').length;

  const ctx4 = document.getElementById('chartTeacherStaff');
  if (ctx4 && typeof Chart !== 'undefined') {
    chartInstances.teacherStaff = new Chart(ctx4, {
      type: 'doughnut',
      data: {
        labels: ['Teachers', 'Staff'],
        datasets: [{
          data: [teacherCount, staffCount],
          backgroundColor: ['#3b82f6', '#94a3b8'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}

// ============================================================
// FILTER HANDLERS
// ============================================================

function applyAnalyticsFilters() {
  // For now, just re-render with same data.
  // Later we can filter students by class, date range, etc.
  renderAnalytics();
  window.showToast('Filters applied', 'info');
}

function resetAnalyticsFilters() {
  document.getElementById('analyticsYear').value = '2025';
  document.getElementById('analyticsStartDate').value = '';
  document.getElementById('analyticsEndDate').value = '';
  document.getElementById('analyticsClass').value = 'all';
  document.getElementById('analyticsStatus').value = 'all';
  renderAnalytics();
  window.showToast('Filters reset', 'info');
}

// ============================================================
// EXPORT FUNCTIONS (Placeholders)
// ============================================================

function exportAnalyticsPDF() {
  window.showToast('PDF export coming soon', 'info');
}

function exportAnalyticsExcel() {
  window.showToast('Excel export coming soon', 'info');
}

// ============================================================
// EVENT BINDINGS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const applyBtn = document.getElementById('analyticsApplyBtn');
  if (applyBtn) applyBtn.addEventListener('click', applyAnalyticsFilters);

  const resetBtn = document.getElementById('analyticsResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetAnalyticsFilters);

  const pdfBtn = document.getElementById('exportAnalyticsPdf');
  if (pdfBtn) pdfBtn.addEventListener('click', exportAnalyticsPDF);

  const excelBtn = document.getElementById('exportAnalyticsExcel');
  if (excelBtn) excelBtn.addEventListener('click', exportAnalyticsExcel);
});

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderAnalytics = renderAnalytics;
window.applyAnalyticsFilters = applyAnalyticsFilters;
window.resetAnalyticsFilters = resetAnalyticsFilters;
