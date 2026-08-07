// ... (all existing code remains unchanged up to showSalaryReceipt)

// ============================================================
// SALARY RECEIPT (with name fallback)
// ============================================================

function showSalaryReceipt(id) {
  const salary = window.SALARY_RECORDS.find(s => s.id === id);
  if (!salary) {
    window.showToast('Salary record not found', 'error');
    return;
  }

  // Find teacher using stored employeeId (human-readable ID) or fallback to teacher ID, then name
  let teacher = null;
  if (salary.employeeId) {
    teacher = window.TEACHERS.find(t => t.employeeId === salary.employeeId);
  }
  if (!teacher) {
    teacher = window.TEACHERS.find(t => t.id === salary.employeeId);
  }
  if (!teacher) {
    // Fallback: search by name (last resort)
    teacher = window.TEACHERS.find(t => t.name === salary.employeeName);
  }
  if (!teacher) {
    window.showToast('Teacher not found for this salary record', 'error');
    return;
  }

  const displayEmployeeId = salary.employeeId || teacher.employeeId || 'N/A';
  const receiptNo = salary.receiptNo || `SAL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const date = salary.paymentDate ? new Date(salary.paymentDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const amountInWords = numberToWords(salary.amount);
  const academicYear = window.ACADEMIC_YEAR || '2025-26';

  const receiptHTML = `
    <div class="receipt-wrapper" id="receiptContent">
      <div class="school-header">
        <h2 class="school-name">${SCHOOL_INFO.name}</h2>
        <p class="school-address">${SCHOOL_INFO.address}</p>
        <p class="school-contact">
          <strong>School Code:</strong> ${SCHOOL_INFO.code} &nbsp;|&nbsp;
          <strong>Phone:</strong> ${SCHOOL_INFO.phone} &nbsp;|&nbsp;
          <strong>Email:</strong> ${SCHOOL_INFO.email} &nbsp;|&nbsp;
          <strong>Web:</strong> ${SCHOOL_INFO.website}
        </p>
      </div>
      <div class="receipt-title">
        <h3>Salary Receipt</h3>
        <span class="receipt-number"># ${receiptNo}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.5rem;">
        <span><strong>Date:</strong> ${date}</span>
        <span><strong>Academic Year:</strong> ${academicYear}</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem 1rem; background:#f8fafc; padding:0.5rem 1rem; border-radius:6px; margin-bottom:0.75rem; font-size:0.85rem;">
        <div><strong>Teacher:</strong> ${teacher.name}</div>
        <div><strong>Employee ID:</strong> ${displayEmployeeId}</div>
        <div><strong>Designation:</strong> ${teacher.designation || 'N/A'}</div>
        <div><strong>Month:</strong> ${salary.month} ${salary.year}</div>
      </div>
      <div class="receipt-details-grid">
        <div><strong>Amount:</strong> ₹${salary.amount.toLocaleString()}</div>
        <div><strong>Status:</strong> <span class="status-badge status-${salary.status}">${salary.status}</span></div>
        <div><strong>Payment Method:</strong> ${salary.paymentMethod || 'N/A'}</div>
        <div><strong>Amount in Words:</strong> ${amountInWords}</div>
      </div>
      <div class="receipt-footer">
        This is a system‑generated salary receipt. No signature required.
        <br />Thank you for your service.
      </div>
    </div>
  `;

  window.openModal('Salary Receipt', `
    ${receiptHTML}
    <div class="receipt-actions" style="display:flex; gap:0.75rem; justify-content:flex-end; margin-top:0.75rem; border-top:1px solid var(--gray-200); padding-top:0.75rem;">
      <button onclick="window.print()" class="btn btn-secondary" style="font-size:0.85rem; padding:0.4rem 1rem;">Print</button>
    </div>
  `, 'Close', () => { window.closeModal(); });

  const modalConfirm = document.getElementById('modalConfirm');
  if (modalConfirm) {
    modalConfirm.textContent = 'Close';
    window.modalCallback = () => { window.closeModal(); };
  }
}
