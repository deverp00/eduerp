// ============================================================
// REPORTS & ANALYTICS – Charts, KPIs, Filters, Export
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

  // 2. Fee Collection Trend (Line chart – real payment data)
  let monthlyData = [];
  let monthLabels = [];
  if (payments.length > 0) {
    const now = new Date();
    const currentYear = now.getFullYear();
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const m = now.getMonth() - i;
      const monthName = new Date(currentYear, m).toLocaleString('default', { month: 'short' });
      monthLabels.push(monthName);
      const sum = payments
        .filter(p => {
          const d = new Date(p.date);
          return d.getMonth() === m && d.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      monthlyData.push(sum);
    }
  } else {
    // No payments – show empty data with a message
    monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    monthlyData = [0, 0, 0, 0, 0, 0];
  }

  const ctx2 = document.getElementById('chartFeeTrend');
  if (ctx2 && typeof Chart !== 'undefined') {
    chartInstances.feeTrend = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: monthLabels,
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
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `₹${ctx.raw.toLocaleString()}` } }
        },
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
// EXPORT FUNCTIONS
// ============================================================

function exportAnalyticsPDF() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    window.showToast('jsPDF library not loaded', 'error');
    return;
  }

  window.showToast('Generating PDF...', 'info');

  // Capture the analytics page content (without the export buttons)
  const content = document.querySelector('#page-analytics .analytics-filters')?.parentNode;
  if (!content) {
    window.showToast('Analytics content not found', 'error');
    return;
  }

  // Use html2canvas to capture the analytics page
  const container = document.createElement('div');
  container.style.cssText = 'padding:20px; background:white;';
  container.appendChild(content.cloneNode(true));
  document.body.appendChild(container);

  html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('Analytics_Dashboard.pdf');
    window.showToast('PDF exported successfully', 'success');
    document.body.removeChild(container);
  }).catch(err => {
    console.error('PDF export error:', err);
    window.showToast('PDF export failed', 'error');
    document.body.removeChild(container);
  });
}

function exportAnalyticsExcel() {
  const XLSX = window.XLSX;
  if (!XLSX) {
    window.showToast('XLSX library not loaded', 'error');
    return;
  }

  const kpiData = [
    ['Metric', 'Value'],
    ['Total Students', window.STUDENTS.length],
    ['Total Teachers', window.TEACHERS.filter(t => t.role === 'teacher').length],
    ['Total Staff', window.TEACHERS.filter(t => t.role === 'staff').length],
    ['Fee Collected', window.FEE_RECORDS.reduce((s, f) => s + (f.paid || 0), 0)],
    ['Pending Fees', window.FEE_RECORDS.reduce((s, f) => s + (f.pending || 0), 0)],
    ['Overdue Records', window.FEE_RECORDS.filter(f => f.status === 'overdue').length],
    ['Salary Paid', window.SALARY_RECORDS.filter(s => s.status === 'paid').reduce((s, rec) => s + (rec.amount || 0), 0)],
    ['Salary Pending', window.SALARY_RECORDS.filter(s => s.status === 'pending').reduce((s, rec) => s + (rec.amount || 0), 0)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(kpiData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');
  XLSX.writeFile(wb, 'Analytics_Dashboard.xlsx');
  window.showToast('Excel exported successfully', 'success');
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
window.exportAnalyticsPDF = exportAnalyticsPDF;
window.exportAnalyticsExcel = exportAnalyticsExcel;
