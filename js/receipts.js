// ============================================================
// RECEIPT MODULE – Generate, Download PDF, Print
// ============================================================

// Updated school details
const SCHOOL_INFO = {
  name: 'Morning Glory English Academy',
  address: 'Dikhkem Nepali Subba Gaon, West Karbi Anglong 782448 Assam',
  code: 'MGEA/2025/001',
  phone: '+91 0000000001',
  email: 'info@mgea.edu.in',
  website: 'www.mgea.edu.in'
};

// ============================================================
// SHOW RECEIPT (Modal)
// ============================================================

function showReceipt(id) {
  const fee = window.FEE_RECORDS.find(f => f.id === id);
  if (!fee) {
    window.showToast('Fee record not found', 'error');
    return;
  }

  const student = window.STUDENTS.find(s => s.id === fee.studentId);
  const name = student ? student.name : 'Unknown';
  const studentClass = student ? `${student.class}${student.section}` : 'N/A';

  const receiptNumber = `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const statusClass = fee.status === 'paid' ? 'status-paid' : (fee.status === 'pending' ? 'status-pending' : 'status-overdue');

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
        <h3>Fee Receipt</h3>
        <span class="receipt-number"># ${receiptNumber}</span>
      </div>
      <div class="receipt-details-grid">
        <div><strong>Student:</strong> ${name}</div>
        <div><strong>Class:</strong> ${studentClass}</div>
        <div><strong>Fee Type:</strong> ${fee.feeType}</div>
        <div><strong>Date:</strong> ${date}</div>
        <div><strong>Amount:</strong> ₹${(fee.amount || 0).toLocaleString()}</div>
        <div><strong>Paid:</strong> ₹${(fee.paid || 0).toLocaleString()}</div>
        <div><strong>Pending:</strong> ₹${(fee.pending || 0).toLocaleString()}</div>
        <div><strong>Status:</strong> <span class="status-badge ${statusClass}">${fee.status}</span></div>
      </div>
      <div class="receipt-footer">
        This is a system‑generated receipt. No signature required.
        <br />Thank you for your payment.
      </div>
    </div>
  `;

  window.openModal('Fee Receipt', `
    ${receiptHTML}
    <div class="receipt-actions" style="display:flex; gap:0.75rem; justify-content:flex-end; margin-top:0.75rem; border-top:1px solid var(--gray-200); padding-top:0.75rem;">
      <button onclick="window.downloadReceiptPDF('${id}')" class="btn btn-primary" style="font-size:0.85rem; padding:0.4rem 1rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>
        Download PDF
      </button>
      <button onclick="window.print()" class="btn btn-secondary" style="font-size:0.85rem; padding:0.4rem 1rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M18 9H6"/><path d="M18 5v4H6V5"/><rect x="6" y="13" width="12" height="8"/><path d="M18 17h-4"/><path d="M10 17h-2"/></svg>
        Print
      </button>
    </div>
  `, 'Close', () => {
    window.closeModal();
  });

  const modalConfirm = document.getElementById('modalConfirm');
  if (modalConfirm) {
    modalConfirm.textContent = 'Close';
    window.modalCallback = () => { window.closeModal(); };
  }

  window._receiptData = {
    fee,
    student,
    name,
    studentClass,
    receiptNumber,
    date,
    statusClass,
    receiptHTML
  };
}

// ============================================================
// DOWNLOAD RECEIPT AS PDF
// ============================================================

function downloadReceiptPDF(id) {
  const fee = window.FEE_RECORDS.find(f => f.id === id);
  if (!fee) {
    window.showToast('Fee record not found', 'error');
    return;
  }

  const student = window.STUDENTS.find(s => s.id === fee.studentId);
  const name = student ? student.name : 'Unknown';
  const studentClass = student ? `${student.class}${student.section}` : 'N/A';
  const receiptNumber = `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    window.showToast('jsPDF library not loaded', 'error');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  let y = 20;

  // School Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(SCHOOL_INFO.name, pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(SCHOOL_INFO.address, pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `School Code: ${SCHOOL_INFO.code}  |  Phone: ${SCHOOL_INFO.phone}  |  Email: ${SCHOOL_INFO.email}  |  Web: ${SCHOOL_INFO.website}`,
    pageWidth / 2, y, { align: 'center' }
  );
  y += 8;

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Receipt Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Fee Receipt', margin, y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`# ${receiptNumber}`, pageWidth - margin, y, { align: 'right' });
  y += 8;

  // Fee Details
  const rows = [
    ['Student', name],
    ['Class', studentClass],
    ['Fee Type', fee.feeType],
    ['Date', date],
    ['Amount', `₹${(fee.amount || 0).toLocaleString()}`],
    ['Paid', `₹${(fee.paid || 0).toLocaleString()}`],
    ['Pending', `₹${(fee.pending || 0).toLocaleString()}`],
    ['Status', fee.status.toUpperCase()]
  ];

  const col1X = margin;
  const col2X = 70;
  const rowHeight = 7;
  let rowY = y;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, rowY - 2, pageWidth - 2 * margin, rows.length * rowHeight + 4, 'F');

  rows.forEach((row, idx) => {
    const currentY = rowY + idx * rowHeight;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(row[0], col1X + 2, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(row[1], col2X, currentY + 5);

    if (row[0] === 'Status') {
      const statusColor = fee.status === 'paid' ? [34, 197, 94] : (fee.status === 'pending' ? [234, 179, 8] : [239, 68, 68]);
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setTextColor(255, 255, 255);
      const textWidth = doc.getTextWidth(row[1]) + 4;
      const rectX = col2X - 1;
      const rectY = currentY + 1;
      doc.roundedRect(rectX, rectY, textWidth + 6, 6, 1.5, 1.5, 'F');
      doc.text(row[1], rectX + 3, currentY + 5);
    }
  });

  y = rowY + rows.length * rowHeight + 6;

  // Footer
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('This is a system‑generated receipt. No signature required.', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('Thank you for your payment.', pageWidth / 2, y, { align: 'center' });

  const fileName = `Receipt_${name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
  window.showToast('Receipt PDF downloaded successfully', 'success');
}

// ============================================================
// VIEW RECEIPT (from Payment History)
// ============================================================

function viewReceipt(id) {
  let payment = window.PAYMENTS.find(p => p.id === id);
  if (payment) {
    const student = window.STUDENTS.find(s => s.id === payment.studentId);
    const name = student ? student.name : 'Unknown';
    const studentClass = student ? `${student.class}${student.section}` : 'N/A';
    const receiptNumber = payment.receiptNo;
    const date = new Date(payment.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const statusClass = payment.status === 'paid' ? 'status-paid' : 'status-pending';

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
          <h3>Payment Receipt</h3>
          <span class="receipt-number"># ${receiptNumber}</span>
        </div>
        <div class="receipt-details-grid">
          <div><strong>Student:</strong> ${name}</div>
          <div><strong>Class:</strong> ${studentClass}</div>
          <div><strong>Amount:</strong> ₹${(payment.amount || 0).toLocaleString()}</div>
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Month:</strong> ${payment.month || 'N/A'}</div>
          <div><strong>Method:</strong> ${payment.method || 'N/A'}</div>
          <div><strong>Status:</strong> <span class="status-badge ${statusClass}">${payment.status}</span></div>
        </div>
        <div class="receipt-footer">
          This is a system‑generated receipt. No signature required.
          <br />Thank you for your payment.
        </div>
      </div>
    `;

    window.openModal('Payment Receipt', `
      ${receiptHTML}
      <div class="receipt-actions" style="display:flex; gap:0.75rem; justify-content:flex-end; margin-top:0.75rem; border-top:1px solid var(--gray-200); padding-top:0.75rem;">
        <button onclick="window.print()" class="btn btn-secondary" style="font-size:0.85rem; padding:0.4rem 1rem;">Print</button>
      </div>
    `, 'Close', () => { window.closeModal(); });
    return;
  }

  const fee = window.FEE_RECORDS.find(f => f.id === id);
  if (fee) {
    showReceipt(id);
    return;
  }

  window.showToast('No receipt found', 'error');
}

function reprintReceipt(id) {
  viewReceipt(id);
  setTimeout(() => { window.print(); }, 500);
}

function printLastReceipt(studentId) {
  const payments = window.PAYMENTS.filter(p => p.studentId === studentId);
  if (payments.length === 0) {
    window.showToast('No payment history found', 'info');
    return;
  }
  const lastPayment = payments[payments.length - 1];
  viewReceipt(lastPayment.id);
  setTimeout(() => { window.print(); }, 500);
}

// ============================================================
// EXPOSE
// ============================================================

window.showReceipt = showReceipt;
window.downloadReceiptPDF = downloadReceiptPDF;
window.viewReceipt = viewReceipt;
window.reprintReceipt = reprintReceipt;
window.printLastReceipt = printLastReceipt;
window.SCHOOL_INFO = SCHOOL_INFO;
