// ============================================================
// RECEIPT MODULE – Generate, Download PDF, Print
// ============================================================

// ============================================================
// UTILITY: Number to Words (Indian numbering)
// ============================================================

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const lakh = Math.floor(num / 100000);
  const remainder = num % 100000;
  const thousand = Math.floor(remainder / 1000);
  const hundred = Math.floor((remainder % 1000) / 100);
  const rest = remainder % 100;

  let words = '';
  if (lakh > 0) {
    words += (lakh >= 20) ? tens[Math.floor(lakh/10)] + ' ' + ones[lakh%10] : ones[lakh];
    words += ' Lakh ';
  }
  if (thousand > 0) {
    words += (thousand >= 20) ? tens[Math.floor(thousand/10)] + ' ' + ones[thousand%10] : ones[thousand];
    words += ' Thousand ';
  }
  if (hundred > 0) {
    words += ones[hundred] + ' Hundred ';
  }
  if (rest > 0) {
    if (rest < 20) words += ones[rest];
    else words += tens[Math.floor(rest/10)] + ' ' + ones[rest%10];
  }
  return words.trim() + ' Rupees Only';
}

// ============================================================
// GET SCHOOL INFO FROM SETTINGS
// ============================================================

function getSchoolInfo() {
  const s = window.SETTINGS || {
    schoolName: '[Your School Name]',
    schoolAddress: '[Your School Address]',
    schoolCode: '[Your School Code]',
    schoolPhone: '[Your Contact Number]',
    schoolEmail: '[Your Email]',
    schoolWebsite: '[Your Website]',
    receiptFooter: 'This is a system-generated receipt. No signature required.',
    receiptThankYou: 'Thank you for your payment.',
    currencySymbol: '₹',
  };
  return s;
}

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
  if (!student) {
    window.showToast('Student not found', 'error');
    return;
  }

  const s = getSchoolInfo();
  const receiptNumber = fee.receiptNo || `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const payment = window.PAYMENTS.find(p => p.studentId === student.id && p.amount === fee.amount && p.status === fee.status);
  const paymentMethod = payment ? payment.method : 'N/A';
  const statusClass = fee.status === 'paid' ? 'status-paid' : (fee.status === 'pending' ? 'status-pending' : 'status-overdue');
  const amountInWords = numberToWords(fee.amount);
  const academicYear = window.SETTINGS?.academicYear || '2025-26';
  const displayId = fee.feeId || fee.id || 'N/A';

  const receiptHTML = `
    <div class="receipt-wrapper" id="receiptContent">
      <div class="school-header">
        <h2 class="school-name">${s.schoolName}</h2>
        <p class="school-address">${s.schoolAddress}</p>
        <p class="school-contact">
          <strong>School Code:</strong> ${s.schoolCode} &nbsp;|&nbsp;
          <strong>Phone:</strong> ${s.schoolPhone} &nbsp;|&nbsp;
          <strong>Email:</strong> ${s.schoolEmail} &nbsp;|&nbsp;
          <strong>Web:</strong> ${s.schoolWebsite}
        </p>
      </div>
      <div class="receipt-title">
        <h3>Fee Receipt</h3>
        <span class="receipt-number"># ${receiptNumber}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.5rem;">
        <span><strong>Date:</strong> ${date}</span>
        <span><strong>Academic Year:</strong> ${academicYear}</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem 1rem; background:#f8fafc; padding:0.5rem 1rem; border-radius:6px; margin-bottom:0.75rem; font-size:0.85rem;">
        <div><strong>Student:</strong> ${student.name}</div>
        <div><strong>Class:</strong> ${student.class}${student.section}</div>
        <div><strong>Roll No:</strong> ${student.roll}</div>
        <div><strong>Admission No:</strong> ${student.admissionNo || 'N/A'}</div>
        <div><strong>Guardian:</strong> ${student.guardian || 'N/A'}</div>
        <div><strong>Fee Type:</strong> ${fee.feeType}</div>
        <div><strong>Fee ID:</strong> ${displayId}</div>
      </div>
      <div class="receipt-details-grid">
        <div><strong>Amount:</strong> ${s.currencySymbol}${fee.amount.toLocaleString()}</div>
        <div><strong>Paid:</strong> ${s.currencySymbol}${fee.paid.toLocaleString()}</div>
        <div><strong>Pending:</strong> ${s.currencySymbol}${fee.pending.toLocaleString()}</div>
        <div><strong>Status:</strong> <span class="status-badge ${statusClass}">${fee.status}</span></div>
        <div><strong>Payment Method:</strong> ${paymentMethod}</div>
        <div><strong>Amount in Words:</strong> ${amountInWords}</div>
      </div>
      <div class="receipt-footer">
        ${s.receiptFooter}
        <br />${s.receiptThankYou}
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
  `, 'Close', () => { window.closeModal(); });

  const modalConfirm = document.getElementById('modalConfirm');
  if (modalConfirm) {
    modalConfirm.textContent = 'Close';
    window.modalCallback = () => { window.closeModal(); };
  }
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
  if (!student) {
    window.showToast('Student not found', 'error');
    return;
  }

  const s = getSchoolInfo();
  const receiptNumber = fee.receiptNo || `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const payment = window.PAYMENTS.find(p => p.studentId === student.id && p.amount === fee.amount && p.status === fee.status);
  const paymentMethod = payment ? payment.method : 'N/A';
  const amountInWords = numberToWords(fee.amount);
  const academicYear = window.SETTINGS?.academicYear || '2025-26';
  const displayId = fee.feeId || fee.id || 'N/A';

  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    window.showToast('jsPDF library not loaded', 'error');
    return;
  }

  window.showToast('Generating PDF...', 'info');

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  let y = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(s.schoolName, pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(s.schoolAddress, pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `School Code: ${s.schoolCode}  |  Phone: ${s.schoolPhone}  |  Email: ${s.schoolEmail}  |  Web: ${s.schoolWebsite}`,
    pageWidth / 2, y, { align: 'center' }
  );
  y += 8;

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Fee Receipt', margin, y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`# ${receiptNumber}`, pageWidth - margin, y, { align: 'right' });
  y += 6;

  doc.setFontSize(9);
  doc.text(`Date: ${date}`, margin, y);
  doc.text(`Academic Year: ${academicYear}`, pageWidth - margin, y, { align: 'right' });
  y += 6;

  const studentRows = [
    ['Student', student.name],
    ['Class', `${student.class}${student.section}`],
    ['Roll No', student.roll],
    ['Admission No', student.admissionNo || 'N/A'],
    ['Guardian', student.guardian || 'N/A'],
    ['Fee Type', fee.feeType],
    ['Fee ID', displayId]
  ];
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y - 2, pageWidth - 2*margin, studentRows.length * 7 + 4, 'F');
  studentRows.forEach((row, idx) => {
    const cy = y + idx * 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(row[0], margin + 2, cy + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(row[1], 70, cy + 5);
  });
  y += studentRows.length * 7 + 4;

  const feeRows = [
    ['Amount', `${s.currencySymbol}${fee.amount.toLocaleString()}`],
    ['Paid', `${s.currencySymbol}${fee.paid.toLocaleString()}`],
    ['Pending', `${s.currencySymbol}${fee.pending.toLocaleString()}`],
    ['Status', fee.status.toUpperCase()],
    ['Payment Method', paymentMethod],
    ['Amount in Words', amountInWords]
  ];
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y - 2, pageWidth - 2*margin, feeRows.length * 7 + 4, 'F');
  feeRows.forEach((row, idx) => {
    const cy = y + idx * 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(row[0], margin + 2, cy + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(row[1], 70, cy + 5);
  });
  y += feeRows.length * 7 + 6;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(s.receiptFooter, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(s.receiptThankYou, pageWidth / 2, y, { align: 'center' });

  const fileName = `Receipt_${student.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
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
    if (!student) {
      window.showToast('Student not found', 'error');
      return;
    }
    const s = getSchoolInfo();
    const receiptNumber = payment.receiptNo || `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const date = new Date(payment.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const academicYear = window.SETTINGS?.academicYear || '2025-26';
    const amountInWords = numberToWords(payment.amount);
    const statusClass = payment.status === 'paid' ? 'status-paid' : 'status-pending';
    const displayId = payment.paymentId || payment.id || 'N/A';

    const receiptHTML = `
      <div class="receipt-wrapper" id="receiptContent">
        <div class="school-header">
          <h2 class="school-name">${s.schoolName}</h2>
          <p class="school-address">${s.schoolAddress}</p>
          <p class="school-contact">
            <strong>School Code:</strong> ${s.schoolCode} &nbsp;|&nbsp;
            <strong>Phone:</strong> ${s.schoolPhone} &nbsp;|&nbsp;
            <strong>Email:</strong> ${s.schoolEmail} &nbsp;|&nbsp;
            <strong>Web:</strong> ${s.schoolWebsite}
          </p>
        </div>
        <div class="receipt-title">
          <h3>Payment Receipt</h3>
          <span class="receipt-number"># ${receiptNumber}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.5rem;">
          <span><strong>Date:</strong> ${date}</span>
          <span><strong>Academic Year:</strong> ${academicYear}</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem 1rem; background:#f8fafc; padding:0.5rem 1rem; border-radius:6px; margin-bottom:0.75rem; font-size:0.85rem;">
          <div><strong>Student:</strong> ${student.name}</div>
          <div><strong>Class:</strong> ${student.class}${student.section}</div>
          <div><strong>Roll No:</strong> ${student.roll}</div>
          <div><strong>Admission No:</strong> ${student.admissionNo || 'N/A'}</div>
          <div><strong>Guardian:</strong> ${student.guardian || 'N/A'}</div>
          <div><strong>Month:</strong> ${payment.month || 'N/A'}</div>
          <div><strong>Payment ID:</strong> ${displayId}</div>
        </div>
        <div class="receipt-details-grid">
          <div><strong>Amount:</strong> ${s.currencySymbol}${payment.amount.toLocaleString()}</div>
          <div><strong>Method:</strong> ${payment.method || 'N/A'}</div>
          <div><strong>Status:</strong> <span class="status-badge ${statusClass}">${payment.status}</span></div>
          <div><strong>Amount in Words:</strong> ${amountInWords}</div>
        </div>
        <div class="receipt-footer">
          ${s.receiptFooter}
          <br />${s.receiptThankYou}
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

// ============================================================
// REPRINT RECEIPT
// ============================================================

function reprintReceipt(id) {
  viewReceipt(id);
  setTimeout(() => { window.print(); }, 500);
}

// ============================================================
// PRINT LAST RECEIPT FOR STUDENT
// ============================================================

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
// MIGRATION COORDINATOR
// ============================================================

async function migrateReceiptIds() {
  console.log('Checking receipt dependencies...');
  let totalMigrated = 0;
  if (window.migrateFeeIds) {
    const feeCount = await window.migrateFeeIds();
    totalMigrated += feeCount || 0;
  } else {
    console.warn('migrateFeeIds not found – skipping fee ID migration.');
  }
  if (window.migratePaymentIds) {
    const paymentCount = await window.migratePaymentIds();
    totalMigrated += paymentCount || 0;
  } else {
    console.warn('migratePaymentIds not found – skipping payment ID migration.');
  }
  console.log('Receipt migration completed. ' + totalMigrated + ' records updated.');
  return totalMigrated;
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.showReceipt = showReceipt;
window.downloadReceiptPDF = downloadReceiptPDF;
window.viewReceipt = viewReceipt;
window.reprintReceipt = reprintReceipt;
window.printLastReceipt = printLastReceipt;
window.migrateReceiptIds = migrateReceiptIds;
