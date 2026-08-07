// ============================================================
// RECEIPT MODULE – Generate, Download PDF, Print (Dynamic)
// ============================================================

import { getOneData } from './firebase.js';

// ============================================================
// SCHOOL INFORMATION
// ============================================================

const SCHOOL_INFO = {
  name: 'Morning Glory English Academy',
  address: 'Dikhlem Nepali Subba Gaon, West Karbi Anglong, Assam – 782248',
  code: 'MGEA/2025/001',
  phone: '+91 98765 43210',
  email: 'info@mgea.edu.in',
  website: 'www.mgea.edu.in'
};

// ============================================================
// RECEIPT GENERATION
// ============================================================

async function generateReceiptHTML(feeId) {
  // Get fee record
  const fee = window.FEE_RECORDS.find(f => f.id === feeId);
  if (!fee) return null;

  const student = window.STUDENTS.find(s => s.id === fee.studentId);
  if (!student) return null;

  // Get payment history for this fee (if available)
  const payment = window.PAYMENTS.find(p => p.studentId === student.id && p.receiptNo);
  const receiptNumber = payment?.receiptNo || `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Build fee particulars (for now, just one fee; can be extended)
  const feeParticulars = [
    { sl: 1, particulars: fee.feeType, period: `${getCurrentMonth()} ${getCurrentYear()}`, amount: fee.amount }
  ];

  // Amount in words
  const amountInWords = numberToWords(fee.amount);

  return `
    <div class="receipt-wrapper" id="receiptContent">
      <div style="text-align:center; border-bottom:2px solid #222; padding-bottom:15px; margin-bottom:20px;">
        <h1 style="margin:0; font-size:24px; text-transform:uppercase;">${SCHOOL_INFO.name}</h1>
        <p style="margin:5px 0 0; font-size:13px;">${SCHOOL_INFO.address}</p>
        <p style="font-size:13px;">Contact: ${SCHOOL_INFO.phone}</p>
      </div>

      <div style="text-align:center; margin:18px 0;">
        <h2 style="display:inline-block; margin:0; padding:5px 18px; border:1px solid #222; font-size:16px; text-transform:uppercase;">Fee Receipt</h2>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom:18px; font-size:13px;">
        <div><strong>Receipt No:</strong> ${receiptNumber}</div>
        <div><strong>Date:</strong> ${date}</div>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:18px; font-size:13px;">
        <tr>
          <td style="border:1px solid #555; padding:8px 10px; font-weight:600; width:17%; background:#f7f7f7;">Student Name</td>
          <td style="border:1px solid #555; padding:8px 10px;">${student.name}</td>
          <td style="border:1px solid #555; padding:8px 10px; font-weight:600; width:17%; background:#f7f7f7;">Class</td>
          <td style="border:1px solid #555; padding:8px 10px;">${student.class}${student.section}</td>
        </tr>
        <tr>
          <td style="border:1px solid #555; padding:8px 10px; font-weight:600; background:#f7f7f7;">Roll No.</td>
          <td style="border:1px solid #555; padding:8px 10px;">${student.roll}</td>
          <td style="border:1px solid #555; padding:8px 10px; font-weight:600; background:#f7f7f7;">Section</td>
          <td style="border:1px solid #555; padding:8px 10px;">${student.section}</td>
        </tr>
        <tr>
          <td style="border:1px solid #555; padding:8px 10px; font-weight:600; background:#f7f7f7;">Admission No.</td>
          <td style="border:1px solid #555; padding:8px 10px;">${student.admissionNo || 'N/A'}</td>
          <td style="border:1px solid #555; padding:8px 10px; font-weight:600; background:#f7f7f7;">Academic Year</td>
          <td style="border:1px solid #555; padding:8px 10px;">${getAcademicYear()}</td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; margin-top:5px; font-size:13px;">
        <thead>
          <tr>
            <th style="border:1px solid #333; padding:9px 10px; background:#f3f3f3; font-weight:700; text-align:center; width:8%;">Sl. No.</th>
            <th style="border:1px solid #333; padding:9px 10px; background:#f3f3f3; font-weight:700; text-align:center;">Fee Particulars</th>
            <th style="border:1px solid #333; padding:9px 10px; background:#f3f3f3; font-weight:700; text-align:center;">Month / Period</th>
            <th style="border:1px solid #333; padding:9px 10px; background:#f3f3f3; font-weight:700; text-align:right; width:20%;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${feeParticulars.map(item => `
            <tr>
              <td style="border:1px solid #333; padding:9px 10px; text-align:center;">${item.sl}</td>
              <td style="border:1px solid #333; padding:9px 10px;">${item.particulars}</td>
              <td style="border:1px solid #333; padding:9px 10px;">${item.period}</td>
              <td style="border:1px solid #333; padding:9px 10px; text-align:right;">${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr style="font-weight:700; font-size:14px;">
            <td colspan="3" style="border:1px solid #333; padding:9px 10px; text-align:right;">Total Paid</td>
            <td style="border:1px solid #333; padding:9px 10px; text-align:right;">₹ ${fee.amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:15px; border:1px solid #555; padding:10px; font-size:13px;">
        <strong>Amount in Words:</strong> ${amountInWords}
      </div>

      <div style="margin-top:15px; font-size:13px;">
        <p style="margin:5px 0;"><strong>Payment Method:</strong> ${payment?.method || 'N/A'}</p>
        <p style="margin:5px 0;"><strong>Payment Status:</strong> ${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</p>
        <p style="margin:5px 0;"><strong>Remarks:</strong> Fee paid for ${getCurrentMonth()} ${getCurrentYear()}.</p>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:end; margin-top:55px; font-size:12px;">
        <div>
          <strong>Thank you.</strong><br>
          This is a computer-generated receipt.
        </div>
        <div style="text-align:center; min-width:150px;">
          <div style="border-top:1px solid #222; margin-bottom:5px;"></div>
          Authorized Signatory
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// HELPERS
// ============================================================

function getCurrentMonth() {
  return new Date().toLocaleString('default', { month: 'long' });
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function getAcademicYear() {
  const year = getCurrentYear();
  return `${year}-${year + 1}`;
}

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

  // Simplified version for up to 99999
  const toWords = (n) => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + toWords(n % 100) : '');
    if (n < 100000) return toWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
    return 'Number too large';
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let words = '';
  if (rupees > 0) words += toWords(rupees) + ' Rupee' + (rupees > 1 ? 's' : '');
  if (paise > 0) words += (words ? ' and ' : '') + toWords(paise) + ' Paise' + (paise > 1 ? 's' : '');
  return words || 'Zero';
}

// ============================================================
// SHOW RECEIPT (Modal)
// ============================================================

async function showReceipt(feeId) {
  const html = await generateReceiptHTML(feeId);
  if (!html) {
    window.showToast('Receipt not found', 'error');
    return;
  }

  const receiptHTML = `
    <div style="background:white; border-radius:var(--radius); padding:1rem;">
      ${html}
      <div style="display:flex; gap:0.75rem; justify-content:flex-end; margin-top:0.75rem; border-top:1px solid var(--gray-200); padding-top:0.75rem;">
        <button onclick="window.print()" class="btn btn-secondary" style="font-size:0.85rem; padding:0.4rem 1rem;">
          Print
        </button>
        <button onclick="window.downloadReceiptPDF('${feeId}')" class="btn btn-primary" style="font-size:0.85rem; padding:0.4rem 1rem;">
          Download PDF
        </button>
      </div>
    </div>
  `;

  window.openModal('Fee Receipt', receiptHTML, 'Close', () => { window.closeModal(); });
}

// ============================================================
// DOWNLOAD PDF (Placeholder – implement with jsPDF if needed)
// ============================================================

function downloadReceiptPDF(feeId) {
  window.showToast('PDF download will be available soon', 'info');
  // For now, we can print to PDF via print dialog
  showReceipt(feeId);
  setTimeout(() => window.print(), 500);
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.showReceipt = showReceipt;
window.downloadReceiptPDF = downloadReceiptPDF;
