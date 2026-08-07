// ============================================================
// RECEIPT MODULE – Professional Fee Receipt (Reference Design)
// ============================================================

// School details – update with your actual info
const SCHOOL_INFO = {
  name: 'Morning Glory English Academy',
  address: 'Dikhlem Nepali Subba Gaon, West Karbi Anglong, Assam',
  contact: '+91 0000000001',
  code: 'MGEA/2025/001',
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
// GENERATE RECEIPT PDF (exact match to reference design)
// ============================================================

function downloadReceiptPDF(id) {
  // Find as fee or payment
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
  const studentName = student ? student.name : 'Unknown';
  const studentClass = student ? student.class : 'N/A';
  const studentSection = student ? student.section : 'N/A';
  const rollNo = student ? student.roll : 'N/A';
  const admissionNo = student ? student.admissionNo || 'N/A' : 'N/A';
  const academicYear = document.getElementById('feeSession')?.value || '2026-27';

  const receiptNo = fee ? `FEE-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}` : payment.receiptNo;
  const date = fee ? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) :
                     new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const amount = fee ? fee.amount : payment.amount;
  const paid = fee ? fee.paid : payment.amount;
  const status = fee ? fee.status : payment.status;
  const method = fee ? 'N/A' : (payment.method || 'N/A');

  // Fee particulars – from fee record or single payment line
  let feeItems = [];
  if (fee) {
    feeItems.push({ sl: 1, particulars: fee.feeType, period: 'As per fee structure', amount: fee.amount });
  } else {
    feeItems.push({ sl: 1, particulars: 'Payment', period: payment.month || 'N/A', amount: payment.amount });
  }
  const total = feeItems.reduce((sum, item) => sum + item.amount, 0);
  const words = amountToWords(total);

  // ------------------------------------------------------------
  // Build PDF using jsPDF (with manual layout to match reference)
  // ------------------------------------------------------------
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    window.showToast('jsPDF library not loaded', 'error');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  let y = 20;

  // --- School Header (centered) ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(SCHOOL_INFO.name, pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(SCHOOL_INFO.address, pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(9);
  doc.text(`Contact: ${SCHOOL_INFO.contact}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // --- Horizontal line ---
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- Receipt Title (bordered) ---
  const title = 'Fee Receipt';
  const titleWidth = doc.getTextWidth(title) + 12;
  const titleX = (pageWidth - titleWidth) / 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(titleX, y - 3, titleWidth, 8);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, y + 4, { align: 'center' });
  y += 12;

  // --- Receipt Info (No. & Date) ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt No: ${receiptNo}`, margin, y);
  doc.text(`Date: ${date}`, pageWidth - margin, y, { align: 'right' });
  y += 8;

  // --- Student Details Table (with borders) ---
  const studentData = [
    ['Student Name', studentName, 'Class', studentClass],
    ['Roll No.', rollNo, 'Section', studentSection],
    ['Admission No.', admissionNo, 'Academic Year', academicYear]
  ];

  // Draw table manually for full border control
  const col1 = 25;
  const col2 = 50;
  const col3 = 25;
  const col4 = 50;
  const rowHeight = 7;
  let tableY = y;

  for (let i = 0; i < studentData.length; i++) {
    const row = studentData[i];
    const yPos = tableY + i * rowHeight;
    // Borders
    doc.rect(margin, yPos, col1, rowHeight);
    doc.rect(margin + col1, yPos, col2, rowHeight);
    doc.rect(margin + col1 + col2, yPos, col3, rowHeight);
    doc.rect(margin + col1 + col2 + col3, yPos, col4, rowHeight);
    // Text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], margin + 2, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], margin + col1 + 2, yPos + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], margin + col1 + col2 + 2, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(row[3], margin + col1 + col2 + col3 + 2, yPos + 5);
  }
  y = tableY + studentData.length * rowHeight + 6;

  // --- Fee Table ---
  const feeHeaders = ['Sl. No.', 'Fee Particulars', 'Month / Period', 'Amount (₹)'];
  const feeRows = feeItems.map(item => [item.sl, item.particulars, item.period, item.amount.toFixed(2)]);

  // Draw table
  const colWidths = [18, 70, 40, 40];
  let rowY = y;
  // Header
  doc.setFillColor(243, 243, 243);
  doc.rect(margin, rowY, colWidths[0], 8, 'F');
  doc.rect(margin + colWidths[0], rowY, colWidths[1], 8, 'F');
  doc.rect(margin + colWidths[0] + colWidths[1], rowY, colWidths[2], 8, 'F');
  doc.rect(margin + colWidths[0] + colWidths[1] + colWidths[2], rowY, colWidths[3], 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Sl. No.', margin + 2, rowY + 5);
  doc.text('Fee Particulars', margin + colWidths[0] + 2, rowY + 5);
  doc.text('Month / Period', margin + colWidths[0] + colWidths[1] + 2, rowY + 5);
  doc.text('Amount (₹)', margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, rowY + 5, { align: 'right' });
  rowY += 8;

  // Data rows
  feeRows.forEach((row, idx) => {
    const isLast = idx === feeRows.length - 1;
    doc.setFont('helvetica', 'normal');
    // Draw borders (all sides)
    doc.rect(margin, rowY, colWidths[0], 8);
    doc.rect(margin + colWidths[0], rowY, colWidths[1], 8);
    doc.rect(margin + colWidths[0] + colWidths[1], rowY, colWidths[2], 8);
    doc.rect(margin + colWidths[0] + colWidths[1] + colWidths[2], rowY, colWidths[3], 8);
    // Text
    doc.text(String(row[0]), margin + 2, rowY + 5);
    doc.text(row[1], margin + colWidths[0] + 2, rowY + 5);
    doc.text(row[2], margin + colWidths[0] + colWidths[1] + 2, rowY + 5);
    doc.text(row[3], margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, rowY + 5, { align: 'right' });
    rowY += 8;
  });

  // Total row (bold)
  const totalRowY = rowY;
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, totalRowY, colWidths[0], 8);
  doc.rect(margin + colWidths[0], totalRowY, colWidths[1], 8);
  doc.rect(margin + colWidths[0] + colWidths[1], totalRowY, colWidths[2], 8);
  doc.rect(margin + colWidths[0] + colWidths[1] + colWidths[2], totalRowY, colWidths[3], 8);
  doc.text('Total Paid', margin + colWidths[0] + colWidths[1] + 2, totalRowY + 5);
  doc.text(`₹ ${total.toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, totalRowY + 5, { align: 'right' });
  y = totalRowY + 8 + 6;

  // --- Amount in Words (bordered) ---
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  const wordsX = margin;
  const wordsY = y;
  const wordsWidth = pageWidth - 2 * margin;
  doc.rect(wordsX, wordsY, wordsWidth, 8);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Amount in Words: ${words}`, wordsX + 4, wordsY + 5);
  y += 12;

  // --- Payment Details ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Method: ${method}`, margin, y);
  y += 5;
  doc.text(`Payment Status: ${status.toUpperCase()}`, margin, y);
  y += 5;
  doc.text('Remarks: System generated receipt', margin, y);
  y += 12;

  // --- Footer (Thank you + Signature) ---
  const footerY = y;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you.', margin, footerY);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated receipt.', margin, footerY + 5);

  // Signature on the right
  const signX = pageWidth - margin - 40;
  doc.line(signX, footerY + 2, signX + 35, footerY + 2);
  doc.text('Authorized Signatory', signX + 2, footerY + 8);

  // --- Save PDF ---
  const fileName = `Receipt_${studentName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
  window.showToast('Receipt PDF downloaded successfully', 'success');
}

// ============================================================
// SHOW RECEIPT IN MODAL (matching the reference HTML)
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
  const studentName = student ? student.name : 'Unknown';
  const studentClass = student ? student.class : 'N/A';
  const studentSection = student ? student.section : 'N/A';
  const rollNo = student ? student.roll : 'N/A';
  const admissionNo = student ? student.admissionNo || 'N/A' : 'N/A';
  const academicYear = document.getElementById('feeSession')?.value || '2026-27';

  const receiptNo = fee ? `FEE-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}` : payment.receiptNo;
  const date = fee ? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) :
                     new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

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
      <td class="amount">₹ ${item.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  // Modal HTML – exactly matches the reference design
  const receiptHTML = `
    <style>
      .receipt-modal {
        font-family: Arial, Helvetica, sans-serif;
        color: #222;
        max-width: 800px;
        margin: auto;
        background: #fff;
        border: 1px solid #222;
        padding: 28px;
      }
      .receipt-modal .school-header {
        text-align: center;
        border-bottom: 2px solid #222;
        padding-bottom: 15px;
      }
      .receipt-modal .school-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .receipt-modal .school-header p {
        margin: 5px 0 0;
        font-size: 13px;
      }
      .receipt-modal .receipt-title {
        text-align: center;
        margin: 18px 0;
      }
      .receipt-modal .receipt-title h2 {
        display: inline-block;
        margin: 0;
        padding: 5px 18px;
        border: 1px solid #222;
        font-size: 16px;
        text-transform: uppercase;
      }
      .receipt-modal .receipt-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 18px;
        font-size: 13px;
      }
      .receipt-modal .student-details {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 18px;
      }
      .receipt-modal .student-details td {
        border: 1px solid #555;
        padding: 8px 10px;
        font-size: 13px;
      }
      .receipt-modal .student-details .label {
        font-weight: 600;
        width: 17%;
        background: #f7f7f7;
      }
      .receipt-modal .fee-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
      }
      .receipt-modal .fee-table th,
      .receipt-modal .fee-table td {
        border: 1px solid #333;
        padding: 9px 10px;
        font-size: 13px;
      }
      .receipt-modal .fee-table th {
        background: #f3f3f3;
        font-weight: 700;
        text-align: center;
      }
      .receipt-modal .fee-table td:first-child {
        text-align: center;
        width: 8%;
      }
      .receipt-modal .amount {
        text-align: right;
        width: 20%;
      }
      .receipt-modal .total-row td {
        font-weight: 700;
        font-size: 14px;
      }
      .receipt-modal .amount-words {
        margin-top: 15px;
        border: 1px solid #555;
        padding: 10px;
        font-size: 13px;
      }
      .receipt-modal .payment-details {
        margin-top: 15px;
        font-size: 13px;
      }
      .receipt-modal .payment-details p {
        margin: 5px 0;
      }
      .receipt-modal .footer {
        display: flex;
        justify-content: space-between;
        align-items: end;
        margin-top: 55px;
        font-size: 12px;
      }
      .receipt-modal .signature {
        text-align: center;
        min-width: 150px;
      }
      .receipt-modal .signature-line {
        border-top: 1px solid #222;
        margin-bottom: 5px;
      }
      @media (max-width: 700px) {
        .receipt-modal { padding: 15px; }
        .receipt-modal .receipt-info { flex-direction: column; gap: 5px; }
        .receipt-modal .school-header h1 { font-size: 19px; }
      }
    </style>
    <div class="receipt-modal">
      <div class="school-header">
        <h1>${SCHOOL_INFO.name}</h1>
        <p>${SCHOOL_INFO.address}</p>
        <p>Contact: ${SCHOOL_INFO.contact}</p>
      </div>

      <div class="receipt-title">
        <h2>Fee Receipt</h2>
      </div>

      <div class="receipt-info">
        <div><strong>Receipt No:</strong> ${receiptNo}</div>
        <div><strong>Date:</strong> ${date}</div>
      </div>

      <table class="student-details">
        <tr>
          <td class="label">Student Name</td>
          <td>${studentName}</td>
          <td class="label">Class</td>
          <td>${studentClass}</td>
        </tr>
        <tr>
          <td class="label">Roll No.</td>
          <td>${rollNo}</td>
          <td class="label">Section</td>
          <td>${studentSection}</td>
        </tr>
        <tr>
          <td class="label">Admission No.</td>
          <td>${admissionNo}</td>
          <td class="label">Academic Year</td>
          <td>${academicYear}</td>
        </tr>
      </table>

      <table class="fee-table">
        <thead>
          <tr>
            <th>Sl. No.</th>
            <th>Fee Particulars</th>
            <th>Month / Period</th>
            <th class="amount">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
          <tr class="total-row">
            <td colspan="3" style="text-align:right;">Total Paid</td>
            <td class="amount">₹ ${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="amount-words">
        <strong>Amount in Words:</strong> ${words}
      </div>

      <div class="payment-details">
        <p><strong>Payment Method:</strong> ${method}</p>
        <p><strong>Payment Status:</strong> ${status.toUpperCase()}</p>
        <p><strong>Remarks:</strong> System generated receipt</p>
      </div>

      <div class="footer">
        <div>
          <strong>Thank you.</strong><br>
          This is a computer-generated receipt.
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          Authorized Signatory
        </div>
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
// VIEW / REPRINT / PRINT LAST RECEIPT
// ============================================================

function viewReceipt(id) {
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
