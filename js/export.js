// ============================================================
// EXPORT MODULE – PDF, Excel, CSV
// ============================================================

// ============================================================
// GET FILTERED DATA FOR EACH MODULE
// ============================================================

function getFilteredData(module) {
  switch (module) {
    case 'students': {
      const filter = document.getElementById('studentFilter')?.value || 'all';
      const search = document.getElementById('studentSearch')?.value || '';
      let data = window.STUDENTS || [];
      if (filter !== 'all') {
        data = data.filter(s => s.class === parseInt(filter));
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        data = data.filter(s => s.name.toLowerCase().includes(q));
      }
      return data;
    }
    case 'teachers': {
      const filter = document.getElementById('staffFilter')?.value || 'all';
      const search = document.getElementById('staffSearch')?.value || '';
      let data = window.TEACHERS || [];
      if (filter !== 'all') {
        data = data.filter(t => t.role === filter);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        data = data.filter(t => t.name.toLowerCase().includes(q) || t.subDepartment.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
      }
      return data;
    }
    case 'fees': {
      const statusFilter = document.getElementById('feeStatusFilter')?.value || 'all';
      const search = document.getElementById('feeUniversalSearch')?.value || '';
      const classFilter = document.getElementById('feeClassFilter')?.value || 'all';
      const sectionFilter = document.getElementById('feeSectionFilter')?.value || 'all';
      let data = window.FEE_RECORDS || [];
      if (statusFilter !== 'all') {
        data = data.filter(f => f.status === statusFilter);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        data = data.filter(f => {
          const student = window.STUDENTS.find(s => s.id === f.studentId);
          if (!student) return false;
          return student.name.toLowerCase().includes(q) ||
                 (student.admissionNo && student.admissionNo.toLowerCase().includes(q)) ||
                 (student.roll && student.roll.toString().includes(q)) ||
                 (student.mobile && student.mobile.includes(q)) ||
                 (student.guardian && student.guardian.toLowerCase().includes(q));
        });
      }
      if (classFilter !== 'all') {
        const classNum = parseInt(classFilter);
        data = data.filter(f => {
          const s = window.STUDENTS.find(st => st.id === f.studentId);
          return s && s.class === classNum;
        });
      }
      if (sectionFilter !== 'all') {
        data = data.filter(f => {
          const s = window.STUDENTS.find(st => st.id === f.studentId);
          return s && s.section === sectionFilter;
        });
      }
      return data;
    }
    case 'salary': {
      const statusFilter = document.getElementById('salaryFilter')?.value || 'all';
      const search = document.getElementById('salarySearch')?.value || '';
      let data = window.SALARY_RECORDS || [];
      if (statusFilter !== 'all') {
        data = data.filter(s => s.status === statusFilter);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        data = data.filter(s => s.employeeName.toLowerCase().includes(q));
      }
      return data;
    }
    default:
      return [];
  }
}

// ============================================================
// BUILD HEADERS AND ROWS
// ============================================================

function buildExportData(module, data) {
  let headers = [];
  let rows = [];
  let title = '';

  switch (module) {
    case 'students':
      title = 'Student List';
      headers = ['#', 'Name', 'Class', 'Section', 'Roll No', 'Admission No', 'Mobile', 'Guardian', 'Fee Status'];
      rows = data.map((s, idx) => [idx+1, s.name, s.class, s.section, s.roll, s.admissionNo || '', s.mobile || '', s.guardian || '', s.feeStatus]);
      break;
    case 'teachers':
      title = 'Teachers & Staff';
      headers = ['#', 'Name', 'Role', 'Designation', 'Sub-Department', 'Email'];
      rows = data.map((t, idx) => [idx+1, t.name, t.role, t.designation, t.subDepartment, t.email]);
      break;
    case 'fees':
      title = 'Fee Records';
      headers = ['#', 'Student', 'Class', 'Fee Type', 'Amount', 'Paid', 'Pending', 'Status'];
      rows = data.map((f, idx) => {
        const student = window.STUDENTS.find(s => s.id === f.studentId);
        const studentName = student ? student.name : 'Unknown';
        const studentClass = student ? `${student.class}${student.section}` : 'N/A';
        return [idx+1, studentName, studentClass, f.feeType, f.amount, f.paid, f.pending, f.status];
      });
      break;
    case 'salary':
      title = 'Salary Records';
      headers = ['#', 'Employee', 'Role', 'Month', 'Year', 'Amount', 'Status', 'Payment Method'];
      rows = data.map((s, idx) => [idx+1, s.employeeName, s.role, s.month, s.year, s.amount, s.status, s.paymentMethod || '—']);
      break;
    default:
      return null;
  }

  return { title, headers, rows };
}

// ============================================================
// EXPORT TO PDF
// ============================================================

function exportToPDF(module) {
  const data = getFilteredData(module);
  if (data.length === 0) {
    window.showToast('No data to export', 'info');
    return;
  }

  const exportData = buildExportData(module, data);
  if (!exportData) return;

  const { title, headers, rows } = exportData;

  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    window.showToast('jsPDF library not loaded', 'error');
    return;
  }

  window.showToast('Generating PDF...', 'info');

  const doc = new jsPDF('landscape', 'mm', 'a4');
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 10, right: 10 },
    tableWidth: 'auto',
  });

  const fileName = `${module}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
  window.showToast('PDF exported successfully', 'success');
}

// ============================================================
// EXPORT TO EXCEL
// ============================================================

function exportToExcel(module) {
  const data = getFilteredData(module);
  if (data.length === 0) {
    window.showToast('No data to export', 'info');
    return;
  }

  const exportData = buildExportData(module, data);
  if (!exportData) return;

  const { headers, rows } = exportData;
  const fullData = [headers, ...rows];

  const XLSX = window.XLSX;
  if (!XLSX) {
    window.showToast('XLSX library not loaded', 'error');
    return;
  }

  window.showToast('Generating Excel...', 'info');

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(fullData);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const fileName = `${module}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  window.showToast('Excel exported successfully', 'success');
}

// ============================================================
// EXPORT TO CSV
// ============================================================

function exportToCSV(module) {
  const data = getFilteredData(module);
  if (data.length === 0) {
    window.showToast('No data to export', 'info');
    return;
  }

  const exportData = buildExportData(module, data);
  if (!exportData) return;

  const { headers, rows } = exportData;

  window.showToast('Generating CSV...', 'info');

  // Build CSV content
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.join(',') + '\n';
  });

  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${module}_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  window.showToast('CSV exported successfully', 'success');
}

// ============================================================
// EVENT BINDINGS
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  // Students export buttons
  document.querySelectorAll('[data-module="students"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const type = this.dataset.export;
      if (type === 'pdf') exportToPDF('students');
      else if (type === 'excel') exportToExcel('students');
      else if (type === 'csv') exportToCSV('students');
    });
  });

  // Teachers export buttons
  document.querySelectorAll('[data-module="teachers"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const type = this.dataset.export;
      if (type === 'pdf') exportToPDF('teachers');
      else if (type === 'excel') exportToExcel('teachers');
      else if (type === 'csv') exportToCSV('teachers');
    });
  });

  // Fees export buttons
  const feePdfBtn = document.getElementById('feeExportPdf');
  if (feePdfBtn) feePdfBtn.addEventListener('click', () => exportToPDF('fees'));
  const feeExcelBtn = document.getElementById('feeExportExcel');
  if (feeExcelBtn) feeExcelBtn.addEventListener('click', () => exportToExcel('fees'));
  const feeCsvBtn = document.getElementById('feeExportCsv');
  if (feeCsvBtn) feeCsvBtn.addEventListener('click', () => exportToCSV('fees'));

  // Salary export buttons
  document.querySelectorAll('[data-module="salary"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const type = this.dataset.export;
      if (type === 'pdf') exportToPDF('salary');
      else if (type === 'excel') exportToExcel('salary');
      else if (type === 'csv') exportToCSV('salary');
    });
  });

  // Analytics exports are handled in analytics.js
});

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
window.exportToCSV = exportToCSV;
