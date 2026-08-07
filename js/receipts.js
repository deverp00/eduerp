// ============================================================
// RECEIPT MODULE – Professional Fee Receipt with PDF/Print
// ============================================================

// School details – update with your actual info
const SCHOOL_INFO = {
  name: 'Morning Glory English Academy',
  address: 'Dikhkem Nepali Subba Gaon, West Karbi Anglong 782448 Assam',
  code: 'MGEA/2025/001',
  phone: '+91 0000000001',
  email: 'info@mgea.edu.in',
  website: 'www.mgea.edu.in'
};

// ============================================================
// UTILITY: Convert Number to Words (Indian Rupees)
// ============================================================

function amountToWords(amount) {
  if (amount === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const num = Math.round(amount);
  if (num === 0) return 'Zero';
  let words = '';
  const crore = Math.floor(num / 10000000);
  if (crore > 0) {
    words += ones[crore] + ' Crore ';
  }
  const lakh = Math.floor((num % 10000000) / 100000);
  if (lakh > 0) {
    if (lakh < 20) words += ones[lakh] + ' Lakh ';
    else {
      words += tens[Math.floor(lakh / 10)] + (lakh % 10 ? ' ' + ones[lakh % 10] : '') + ' Lakh ';
    }
  }
  const thousand = Math.floor((num % 100000) / 1000);
  if (thousand > 0) {
    if (thousand < 20) words += ones[thousand] + ' Thousand ';
    else {
      words += tens[Math.floor(thousand / 10)] + (thousand % 10 ? ' ' + ones[thousand % 10] : '') + ' Thousand ';
    }
  }
  const hundred = Math.floor((num % 1000) / 100);
  if (hundred > 0) {
    words += ones[hundred] + ' Hundred ';
  }
  const remainder = num % 100;
  if (remainder > 0) {
    if (remainder < 20) words += ones[remainder];
    else {
      words += tens[Math.floor(remainder / 10)] + (remainder % 10 ? ' ' + ones[remainder % 10] : '');
    }
  }
  return words.trim() + ' Rupees Only';
}

// ============================================================
// GENERATE RECEIPT PDF (for both Fee Records & Payments)
// ============================================================

function downloadReceiptPDF(id) {
  // Try to find as fee record first, then as payment
  let fee = window.FEE_RECORDS.find(f => f.id === id);
  let payment = null;
  if (!fee) {
    payment = window.PAYMENTS.find(p => p.id === id);
    if (!payment) {
      window.showToast('Record not found', 'error');
      return;
    }
  }

  // Determine student
  const studentId = fee ? fee.studentId : payment.studentId;
  const student = window.STUDENTS.find(s => s.id === studentId);
  const studentName = student ? student.name : 'Unknown';
  const studentClass = student ? `${student.class}${student.section}` : 'N/A';
  const admissionNo = student ? student.admissionNo || 'N/A' : 'N/A';
  const rollNo = student ? student.roll || 'N/A' : 'N/A';
  const academicYear = document.getElementById('feeSession')?.value || '2025-26';
  const receiptNo = fee ? `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}` : payment.receiptNo;
  const date = fee ? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) :
                     new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const amount = fee ? fee.amount : payment.amount;
  const paid = fee ? fee.paid : payment.amount;
  const status = fee ? fee.status : payment.status;
  const method = fee ? 'N/A' : (payment.method || 'N/A');

  // Build fee particulars – for a fee record, one line; for a payment, one line
  const feeItems = [];
  if (fee) {
    feeItems.push({ sl: 1, particulars: fee.feeType, period: 'As per fee structure', amount: fee.amount });
  } else {
    feeItems.push({ sl: 1, particulars: 'Payment', period: payment.month || 'N/A', amount: payment.amount });
  }

  // ------------------------------------------------------------
  // Generate PDF using jsPDF and autoTable
  // ------------------------------------------------------------
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    window.showToast('jsPDF library not loaded', 'error');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  let y = 20;

  // --- School Header ---
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

  // --- Receipt Title ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('FEE RECEIPT', pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Receipt No & Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Receipt No: ${receiptNo}`, margin, y);
  doc.text(`Date: ${date}`, pageWidth - margin, y, { align: 'right' });
  y += 8;

  // --- Student Details Table (2 columns) ---
  const studentRows = [
    ['Student Name', studentName, 'Class', studentClass],
    ['Roll No.', rollNo, 'Section', student.section || 'N/A'],
    ['Admission No.', admissionNo, 'Academic Year', academicYear],
  ];

  doc.autoTable({
    startY: y,
    head: [],
    body: studentRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold', textColor: [71, 85, 105] },
      1: { cellWidth: 55 },
      2: { cellWidth: 35, fontStyle: 'bold', textColor: [71, 85, 105] },
      3: { cellWidth: 55 }
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  y = doc.lastAutoTable.finalY + 6;

  // --- Fee Particulars Table ---
  const feeHeaders = [['Sl. No.', 'Fee Particulars', 'Month / Period', 'Amount (₹)']];
  const feeRows = feeItems.map(item => [item.sl, item.particulars, item.period, item.amount.toLocaleString()]);

  doc.autoTable({
    startY: y,
    head: feeHeaders,
    body: feeRows,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 50 },
      3: { cellWidth: 40, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  y = doc.lastAutoTable.finalY + 6;

  // --- Total & Amount in Words ---
  const total = feeItems.reduce((sum, item) => sum + item.amount, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Total: ₹${total.toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const words = amountToWords(total);
  doc.text(`Amount in Words: ${words}`, margin, y);
  y += 8;

  // --- Payment Details ---
  const paymentRows = [
    ['Payment Method:', method, 'Payment Status:', status.toUpperCase()],
    ['Remarks:', 'System generated receipt', '', ''],
  ];

  doc.autoTable({
    startY: y,
    head: [],
    body: paymentRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold', textColor: [71, 85, 105] },
      1: { cellWidth: 50 },
      2: { cellWidth: 30, fontStyle: 'bold', textColor: [71, 85, 105] },
      3: { cellWidth: 60 }
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  y = doc.lastAutoTable.finalY + 8;

  // --- Footer ---
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated receipt. No signature required.', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('Thank you for your payment.', pageWidth / 2, y, { align: 'center' });

  // --- Signature (right side) ---
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const signX = pageWidth - margin - 30;
  doc.line(signX, y + 8, signX + 35, y + 8);
  doc.text('Authorized Signatory', signX + 5, y + 14);

  // --- Save PDF ---
  const fileName = `Receipt_${studentName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
  window.showToast('Receipt PDF downloaded successfully', 'success');
}

// ============================================================
// SHOW RECEIPT IN MODAL (consistent design)
// ============================================================

function showReceipt(id) {
  // Find fee or payment
  let fee = window.FEE_RECORDS.find(f => f.id === id);
  let payment = null;
  if (!fee) {
    payment = window.PAYMENTS.find(p => p.id === id);
    if (!payment) {
      window.showToast('Record not found', 'error');
      return;
    }
  }

  const studentId = fee ? fee.studentId : payment.studentId;
  const student = window.STUDENTS.find(s => s.id === studentId);
  const name = student ? student.name : 'Unknown';
  const studentClass = student ? `${student.class}${student.section}` : 'N/A';
  const admissionNo = student ? student.admissionNo || 'N/A' : 'N/A';
  const rollNo = student ? student.roll || 'N/A' : 'N/A';
  const academicYear = document.getElementById('feeSession')?.value || '2025-26';
  const receiptNo = fee ? `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}` : payment.receiptNo;
  const date = fee ? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) :
                     new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const amount = fee ? fee.amount : payment.amount;
  const status = fee ? fee.status : payment.status;
  const method = fee ? 'N/A' : (payment.method || 'N/A');

  let feeItems = [];
  if (fee) {
    feeItems.push({ sl: 1, particulars: fee.feeType, period: 'As per fee structure', amount: fee.amount });
  } else {
    feeItems.push({ sl: 1, particulars: 'Payment', period: payment.month || 'N/A', amount: payment.amount });
  }
  const total = feeItems.reduce((sum, item) => sum + item.amount, 0);
  const words = amountToWords(total);

  const rowsHTML = feeItems.map(item => `
    <tr>
      <td>${item.sl}</td>
      <td>${item.particulars}</td>
      <td>${item.period}</td>
      <td style="text-align:right;">₹${item.amount.toLocaleString()}</td>
    </tr>
  `).join('');

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
      <div style="text-align:center; margin:6px 0;">
        <h3 style="margin:0; font-size:1.2rem; color:#334155;">FEE RECEIPT</h3>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:8px;">
        <span><strong>Receipt No:</strong> ${receiptNo}</span>
        <span><strong>Date:</strong> ${date}</span>
      </div>
      <table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-bottom:8px;">
        <tr>
          <td style="padding:2px 4px; font-weight:bold; color:#475569; width:25%;">Student Name</td>
          <td style="padding:2px 4px; width:25%;">${name}</td>
          <td style="padding:2px 4px; font-weight:bold; color:#475569; width:25%;">Class</td>
          <td style="padding:2px 4px; width:25%;">${studentClass}</td>
        </tr>
        <tr>
          <td style="padding:2px 4px; font-weight:bold; color:#475569;">Roll No.</td>
          <td style="padding:2px 4px;">${rollNo}</td>
          <td style="padding:2px 4px; font-weight:bold; color:#475569;">Section</td>
          <td style="padding:2px 4px;">${student ? student.section || 'N/A' : 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:2px 4px; font-weight:bold; color:#475569;">Admission No.</td>
          <td style="padding:2px 4px;">${admissionNo}</td>
          <td style="padding:2px 4px; font-weight:bold; color:#475569;">Academic Year</td>
          <td style="padding:2px 4px;">${academicYear}</td>
        </tr>
      </table>
      <table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-bottom:8px; border:1px solid #e2e8f0;">
        <thead style="background:#3b82f6; color:white;">
          <tr>
            <th style="padding:4px 6px; text-align:center;">Sl. No.</th>
            <th style="padding:4px 6px; text-align:left;">Fee Particulars</th>
            <th style="padding:4px 6px; text-align:left;">Month / Period</th>
            <th style="padding:4px 6px; text-align:right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
          <tr style="font-weight:bold; background:#f1f5f9;">
            <td colspan="3" style="padding:4px 6px; text-align:right;">Total</td>
            <td style="padding:4px 6px; text-align:right;">₹${total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <div style="font-size:0.85rem; margin:6px 0;">
        <strong>Amount in Words:</strong> ${words}
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin:6px 0;">
        <div>
          <strong>Payment Method:</strong> ${method}<br>
          <strong>Payment Status:</strong> <span class="status-badge status-${status}">${status}</span><br>
          <strong>Remarks:</strong> System generated receipt
        </div>
        <div style="text-align:right;">
          <div style="border-top:1px solid #475569; width:120px; margin:16px auto 0;"></div>
          Authorized Signatory
        </div>
      </div>
      <div class="receipt-footer">
        This is a computer-generated receipt. No signature required.<br>Thank you for your payment.
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
// VIEW / REPRINT / PRINT LAST RECEIPT (for Payment History)
// ============================================================

function viewReceipt(id) {
  // Try payment first, then fee
  let payment = window.PAYMENTS.find(p => p.id === id);
  if (payment) {
    showReceipt(id);
    return;
  }
  let fee = window.FEE_RECORDS.find(f => f.id === id);
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
// EXPOSE GLOBALLY
// ============================================================

window.showReceipt = showReceipt;
window.downloadReceiptPDF = downloadReceiptPDF;
window.viewReceipt = viewReceipt;
window.reprintReceipt = reprintReceipt;
window.printLastReceipt = printLastReceipt;
window.SCHOOL_INFO = SCHOOL_INFO;
