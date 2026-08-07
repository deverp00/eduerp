// ============================================================
// FEE MANAGEMENT – Full Upgraded Module (Firebase)
// ============================================================

import { createData, updateData, deleteData } from './firebase.js';
// Import receipt functions from receipt.js
import { showReceipt, downloadReceiptPDF } from './receipt.js';

// ============================================================
// HELPERS – Monthly Fee Logic
// ============================================================

function getMonthlyFeeAmount(studentId) {
  const fee = window.FEE_RECORDS.find(f => f.studentId === studentId && f.feeType === 'Monthly Fee');
  return fee ? fee.amount : 0;
}

function isMonthPaid(studentId, month, year) {
  const payments = window.PAYMENTS.filter(p => p.studentId === studentId);
  const monthlyAmount = getMonthlyFeeAmount(studentId);
  if (monthlyAmount === 0) return false;
  const totalPaid = payments
    .filter(p => p.month === month && p.year === year)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  return totalPaid >= monthlyAmount;
}

function getCurrentMonth() {
  return new Date().toLocaleString('default', { month: 'long' });
}

function getCurrentYear() {
  return new Date().getFullYear();
}

// ============================================================
// RENDER FEES TABLE + ANALYTICS
// ============================================================

function renderFees(statusFilter = 'all', search = '', studentId = null, classFilter = 'all') {
  const fees = window.FEE_RECORDS || [];
  const students = window.STUDENTS || [];

  let list = fees;

  if (statusFilter !== 'all') {
    list = list.filter(f => f.status === statusFilter);
  }
  if (studentId) {
    list = list.filter(f => f.studentId === studentId);
  } else if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(f => {
      const student = students.find(s => s.id === f.studentId);
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
    list = list.filter(f => {
      const s = students.find(st => st.id === f.studentId);
      return s && s.class === classNum;
    });
  }

  list.sort((a, b) => {
    const nameA = students.find(s => s.id === a.studentId)?.name || '';
    const nameB = students.find(s => s.id === b.studentId)?.name || '';
    return nameA.localeCompare(nameB);
  });

  const tbody = document.getElementById('feeTableBody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--gray-500); padding:2rem;">No fee records found.</td></tr>`;
    return;
  }

  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();

  tbody.innerHTML = list.map((f, idx) => {
    const student = students.find(s => s.id === f.studentId);
    const studentName = student ? student.name : 'Unknown';
    const studentClass = student ? `${student.class}${student.section}` : 'N/A';
    const monthlyPaid = student ? isMonthPaid(student.id, currentMonth, currentYear) : false;
    const isCollectActive = !monthlyPaid && getMonthlyFeeAmount(student?.id) > 0;

    return `
    <tr>
      <td>${idx + 1}</td>
      <td>${studentName}</td>
      <td>${studentClass}</td>
      <td>${f.feeType}</td>
      <td>₹${(f.amount || 0).toLocaleString()}</td>
      <td>₹${(f.paid || 0).toLocaleString()}</td>
      <td>₹${(f.pending || 0).toLocaleString()}</td>
      <td><span class="status-badge status-${f.status}">${f.status}</span></td>
      <td>
        <div class="actions-cell" style="display:flex; align-items:center; gap:0.25rem; flex-wrap:nowrap;">
          <button class="btn-edit" onclick="window.showStudentDetail('${f.studentId}')" 
                  style="white-space:nowrap; ${monthlyPaid ? 'opacity:0.5; cursor:default;' : ''}" 
                  ${monthlyPaid ? 'disabled' : ''}>
            View
          </button>
          <button class="btn-primary" onclick="window.openCollectFeeModal('${f.studentId}')" 
                  style="background:${isCollectActive ? 'var(--primary)' : 'var(--gray-400)'}; color:white; padding:0.2rem 0.6rem; border-radius:var(--radius); border:none; font-size:0.75rem; cursor:${isCollectActive ? 'pointer' : 'default'}; opacity:${isCollectActive ? '1' : '0.6'}; white-space:nowrap;" 
                  ${isCollectActive ? '' : 'disabled'}>
            Collect
          </button>
          <button class="btn-receipt" onclick="window.showReceipt('${f.id}')" style="white-space:nowrap;">Receipt</button>
          <button class="btn-delete" onclick="window.deleteFeeRecord('${f.id}')" style="white-space:nowrap;">Delete</button>
        </div>
      </td>
    </tr>
  `}).join('');

  renderFeeAnalytics();
}

// ============================================================
// ANALYTICS
// ============================================================

function renderFeeAnalytics() {
  const grid = document.getElementById('feeAnalyticsGrid');
  if (!grid) return;
  const payments = window.PAYMENTS || [];
  const fees = window.FEE_RECORDS || [];

  const today = new Date().toDateString();
  const todayCollection = payments.filter(p => new Date(p.date).toDateString() === today).reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthCollection = payments.filter(p => new Date(p.date).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + (p.amount || 0), 0);
  const annualCollection = payments.filter(p => new Date(p.date).getFullYear() === new Date().getFullYear()).reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingFees = fees.reduce((sum, f) => sum + (f.pending || 0), 0);
  const totalReceipts = payments.length;

  grid.innerHTML = `
    <div class="stat-card"><span class="stat-label">Today's Collection</span><span class="stat-value">₹${todayCollection.toLocaleString()}</span></div>
    <div class="stat-card"><span class="stat-label">Monthly Collection</span><span class="stat-value">₹${monthCollection.toLocaleString()}</span></div>
    <div class="stat-card"><span class="stat-label">Annual Collection</span><span class="stat-value">₹${annualCollection.toLocaleString()}</span></div>
    <div class="stat-card"><span class="stat-label">Pending Fees</span><span class="stat-value">₹${pendingFees.toLocaleString()}</span></div>
    <div class="stat-card"><span class="stat-label">Total Receipts</span><span class="stat-value">${totalReceipts}</span></div>
  `;
}

// ============================================================
// UNIVERSAL SEARCH
// ============================================================

function setupFeeSearch() {
  const input = document.getElementById('feeUniversalSearch');
  const suggestions = document.getElementById('feeSearchSuggestions');
  if (!input || !suggestions) return;

  input.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    if (query.length < 1) {
      suggestions.style.display = 'none';
      return;
    }
    const students = window.STUDENTS || [];
    const matched = students.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.admissionNo && s.admissionNo.toLowerCase().includes(query)) ||
      (s.roll && s.roll.toString().includes(query)) ||
      (s.mobile && s.mobile.includes(query)) ||
      (s.guardian && s.guardian.toLowerCase().includes(query))
    );
    if (matched.length === 0) {
      suggestions.innerHTML = '<div class="suggestion-item">No results</div>';
    } else {
      suggestions.innerHTML = matched.map(s => `
        <div class="suggestion-item" data-id="${s.id}">
          <strong>${s.name}</strong> (${s.admissionNo || 'N/A'}) – ${s.class}${s.section}
        </div>
      `).join('');
      suggestions.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('click', function() {
          const id = this.dataset.id;
          window.showStudentDetail(id);
          input.value = window.STUDENTS.find(s => s.id === id).name;
          suggestions.style.display = 'none';
          renderFees('all', '', id);
        });
      });
    }
    suggestions.style.display = 'block';
  });

  input.addEventListener('blur', () => {
    setTimeout(() => { suggestions.style.display = 'none'; }, 200);
  });
}

// ============================================================
// STUDENT DETAIL PANEL (with Close button & Bottom Actions)
// ============================================================

function showStudentDetail(id) {
  const student = window.STUDENTS.find(s => s.id === id);
  if (!student) return;
  const panel = document.getElementById('feeStudentDetail');
  if (!panel) return;
  const payments = window.PAYMENTS.filter(p => p.studentId === id);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const lastPayment = payments.length ? payments[payments.length-1] : null;
  const feeRecordsForStudent = window.FEE_RECORDS.filter(f => f.studentId === id);
  const pendingTotal = feeRecordsForStudent.reduce((sum, f) => sum + (f.pending || 0), 0);
  const monthlyAmount = getMonthlyFeeAmount(id);
  const currentMonthPaid = isMonthPaid(id, getCurrentMonth(), getCurrentYear());

  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; border-bottom:1px solid var(--gray-200); padding-bottom:0.5rem;">
      <h3 style="margin:0; font-size:1.1rem;">Student Details</h3>
      <button id="closeDetailPanel" style="background:transparent; border:none; font-size:1.5rem; cursor:pointer; color:var(--gray-500); padding:0 0.25rem; line-height:1;">×</button>
    </div>

    <div style="display:flex; gap:1.5rem; flex-wrap:wrap;">
      <div style="display:flex; gap:1rem; align-items:center;">
        <div class="student-avatar">${student.name.charAt(0)}</div>
        <div>
          <h4 style="margin:0;">${student.name}</h4>
          <p style="margin:0; color:var(--gray-500); font-size:0.85rem;">${student.admissionNo || 'N/A'} | Roll: ${student.roll}</p>
        </div>
      </div>
      <div style="flex:1; min-width:200px;">
        <div class="detail-grid">
          <div class="label">Class & Section</div><div class="value">${student.class}${student.section}</div>
          <div class="label">Guardian</div><div class="value">${student.guardian || 'N/A'}</div>
          <div class="label">Total Paid</div><div class="value">₹${totalPaid.toLocaleString()}</div>
          <div class="label">Pending Amount</div><div class="value">₹${pendingTotal.toLocaleString()}</div>
          <div class="label">Last Payment</div><div class="value">${lastPayment ? new Date(lastPayment.date).toLocaleDateString() : 'N/A'}</div>
          <div class="label">Monthly Fee</div><div class="value">₹${monthlyAmount.toLocaleString()}</div>
          <div class="label">Current Month Status</div><div class="value"><span class="status-badge ${currentMonthPaid ? 'status-paid' : 'status-pending'}">${currentMonthPaid ? 'Paid' : 'Due'}</span></div>
        </div>
      </div>
    </div>

    <div style="margin-top:1rem; border-top:1px solid var(--gray-200); padding-top:1rem;">
      <h4 style="margin:0 0 0.5rem 0; font-size:0.95rem;">Fee Structure</h4>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:0.5rem;">
        ${feeRecordsForStudent.map(f => `
          <div style="background:var(--gray-50); padding:0.5rem; border-radius:var(--radius);">
            <div style="font-weight:600; font-size:0.85rem;">${f.feeType}</div>
            <div style="font-size:0.8rem; color:var(--gray-600);">Amount: ₹${f.amount} | Paid: ₹${f.paid} | Pending: ₹${f.pending}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Bottom Action Area -->
    <div style="margin-top:1.25rem; padding-top:0.75rem; border-top:1px solid var(--gray-200); display:flex; gap:0.75rem; justify-content:flex-end; flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="window.openCollectFeeModal('${id}')">Collect Fee</button>
      <button class="btn btn-secondary" onclick="window.showPaymentHistory('${id}')">Payment History</button>
      <button class="btn btn-secondary" onclick="window.printLastReceipt('${id}')">Print Last Receipt</button>
    </div>
  `;

  document.getElementById('closeDetailPanel').addEventListener('click', function() {
    panel.style.display = 'none';
  });
}

// ============================================================
// COLLECT FEE MODAL – Restructured, no duplicate Cancel
// ============================================================

function openCollectFeeModal(studentId) {
  const student = window.STUDENTS.find(s => s.id === studentId);
  if (!student) return;
  const studentFees = window.FEE_RECORDS.filter(f => f.studentId === studentId);
  const totalFee = studentFees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const pending = studentFees.reduce((sum, f) => sum + (f.pending || 0), 0);
  const monthlyAmount = getMonthlyFeeAmount(studentId);
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();

  const modalBody = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:0.5rem;">
      <div>
        <div class="form-group"><label>Student</label><input type="text" value="${student.name}" disabled style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius); background:var(--gray-50);" /></div>
        <div class="form-group"><label>Total Fee</label><input type="number" id="calcTotalFee" value="${totalFee}" disabled style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius); background:var(--gray-50);" /></div>
        <div class="form-group"><label>Previous Balance</label><input type="number" id="calcPrevBalance" value="${pending}" disabled style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius); background:var(--gray-50);" /></div>
        <div class="form-group"><label>Discount (₹)</label><input type="number" id="calcDiscount" value="0" oninput="window.updateFeeCalculator()" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);" /></div>
        <div class="form-group"><label>Late Fine (₹)</label><input type="number" id="calcLateFine" value="0" oninput="window.updateFeeCalculator()" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);" /></div>
        <div class="form-group"><label>Month</label><input type="text" value="${currentMonth} ${currentYear}" disabled style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius); background:var(--gray-50);" /></div>
        <div class="form-group"><label>Amount Received (₹)</label><input type="number" id="calcAmountReceived" value="${monthlyAmount}" oninput="window.updateFeeCalculator()" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);" /></div>
      </div>

      <div>
        <div class="form-group"><label>Payment Method</label>
          <select id="calcPaymentMethod" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);">
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Digital Wallet">Digital Wallet</option>
          </select>
        </div>
        <div class="form-group"><label>Remaining Balance</label><input type="number" id="calcRemaining" value="${pending}" disabled style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius); background:var(--gray-50);" /></div>

        <div style="background:var(--gray-50); padding:0.75rem; border-radius:var(--radius); margin-top:1rem;">
          <p style="font-weight:600; margin:0 0 0.5rem 0;">Payment Summary</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.25rem 1rem; font-size:0.9rem;">
            <span><strong>Monthly Fee:</strong> ₹<span id="calcDisplayTotal">${monthlyAmount}</span></span>
            <span><strong>Discount:</strong> ₹<span id="calcDisplayDiscount">0</span></span>
            <span><strong>Late Fine:</strong> ₹<span id="calcDisplayFine">0</span></span>
            <span><strong>Amount Received:</strong> ₹<span id="calcDisplayReceived">${monthlyAmount}</span></span>
            <span><strong>Remaining Balance:</strong> ₹<span id="calcDisplayRemaining">${pending}</span></span>
          </div>
        </div>
      </div>
    </div>
  `;

  window.openModal(
    'Collect Monthly Fee',
    modalBody,
    'Process Payment',
    async function() {
      await processFeePayment(studentId);
    }
  );
}

// ============================================================
// PROCESS PAYMENT
// ============================================================

async function processFeePayment(studentId) {
  const received = parseFloat(document.getElementById('calcAmountReceived').value) || 0;
  const method = document.getElementById('calcPaymentMethod').value;
  if (received <= 0) {
    window.showToast('Please enter a valid amount', 'error');
    return;
  }

  const newFee = {
    studentId: studentId,
    feeType: 'Monthly Fee',
    amount: received,
    paid: received,
    pending: 0,
    status: 'paid'
  };
  const feeResult = await createData('feeRecords', newFee);
  window.FEE_RECORDS.push(feeResult);

  const receiptNo = `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const payment = {
    studentId: studentId,
    receiptNo: receiptNo,
    date: new Date().toISOString().split('T')[0],
    month: getCurrentMonth(),
    year: getCurrentYear(),
    amount: received,
    method: method,
    status: 'paid'
  };
  const payResult = await createData('payments', payment);
  window.PAYMENTS.push(payResult);

  window.showToast('Payment processed successfully! Receipt: ' + receiptNo, 'success');
  window.closeModal();
  renderFees();
  renderFeeAnalytics();
  showStudentDetail(studentId);
}

// ============================================================
// DELETE FEE RECORD – Real Working Delete
// ============================================================

async function deleteFeeRecord(id) {
  if (!confirm('Are you sure you want to delete this fee record? This action cannot be undone.')) return;

  try {
    await deleteData('feeRecords', id);
    window.FEE_RECORDS = window.FEE_RECORDS.filter(f => f.id !== id);
    window.showToast('Fee record deleted successfully', 'success');
    renderFees();
    if (window.renderDashboard) window.renderDashboard();
  } catch (error) {
    console.error('Delete error:', error);
    window.showToast('Error deleting fee record', 'error');
  }
}

// ============================================================
// PAYMENT HISTORY
// ============================================================

function showPaymentHistory(studentId) {
  const payments = window.PAYMENTS.filter(p => p.studentId === studentId);
  if (payments.length === 0) {
    window.showToast('No payment history found', 'info');
    return;
  }
  const student = window.STUDENTS.find(s => s.id === studentId);
  const rows = payments.map(p => `
    <tr>
      <td>${p.receiptNo}</td>
      <td>${new Date(p.date).toLocaleDateString()}</td>
      <td>${p.month} ${p.year}</td>
      <td>₹${(p.amount || 0).toLocaleString()}</td>
      <td>${p.method}</td>
      <td><span class="status-badge status-${p.status}">${p.status}</span></td>
      <td>
        <button class="btn-edit" onclick="window.showReceipt('${p.id}')">View</button>
        <button class="btn-receipt" onclick="window.reprintReceipt('${p.id}')">Reprint</button>
        <button class="btn-edit" onclick="window.downloadReceiptPDF('${p.id}')">PDF</button>
      </td>
    </tr>
  `).join('');

  window.openModal(`Payment History – ${student.name}`, `
    <div style="overflow-x:auto;">
      <table class="data-table">
        <thead><tr><th>Receipt No</th><th>Date</th><th>Month/Year</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `, 'Close', () => { window.closeModal(); });
}

// ============================================================
// INIT FEE MODULE – Auto‑apply filters (no Bulk Collect)
// ============================================================

function initFeeModule() {
  renderFeeAnalytics();
  setupFeeSearch();

  ['feeSession', 'feeClassFilter', 'feeMonthFilter', 'feeStatusFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        const classFilter = document.getElementById('feeClassFilter').value;
        const statusFilter = document.getElementById('feeStatusFilter').value;
        const search = document.getElementById('feeUniversalSearch').value;
        renderFees(statusFilter, search, null, classFilter);
      });
    }
  });

  // Bulk Collect removed – no event binding.

  const addBtn = document.getElementById('addFeeBtn');
  if (addBtn) addBtn.addEventListener('click', showAddFeeModal);
}

// ============================================================
// ADD FEE
// ============================================================

function showAddFeeModal() {
  const students = window.STUDENTS || [];
  const studentOptions = students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  const feeTypeOptions = ['Admission Fee', 'Monthly Fee', 'Annual Fee', 'Examination Fee', 'Others']
    .map(opt => `<option value="${opt}">${opt}</option>`).join('');

  const modalHTML = `
    <div class="form-group"><label>Student</label><select id="addFeeStudent">${studentOptions}</select></div>
    <div class="form-group"><label>Fee Type</label><select id="addFeeType">${feeTypeOptions}</select></div>
    <div class="form-group" id="addCustomFeeGroup" style="display:none;">
      <label>Custom Fee Description</label><input type="text" id="addCustomFee" placeholder="Enter custom fee description" />
    </div>
    <div class="form-group"><label>Amount (₹)</label><input type="number" id="addFeeAmount" placeholder="5000" /></div>
    <div class="form-group"><label>Paid (₹)</label><input type="number" id="addFeePaid" placeholder="0" /></div>
    <div class="form-group"><label>Pending (₹)</label><input type="number" id="addFeePending" placeholder="0" /></div>
    <div class="form-group"><label>Status</label>
      <select id="addFeeStatus">
        <option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option>
      </select>
    </div>
  `;

  window.openModal('Add Fee Record', modalHTML, 'Add Fee', async () => {
    const studentId = document.getElementById('addFeeStudent').value;
    const feeTypeSelect = document.getElementById('addFeeType');
    const feeType = feeTypeSelect.value;
    let finalFeeType = feeType;
    if (feeType === 'Others') {
      const custom = document.getElementById('addCustomFee').value.trim();
      if (!custom) { window.showToast('Please enter a custom fee description', 'error'); return; }
      finalFeeType = custom;
    }
    const amount = parseFloat(document.getElementById('addFeeAmount').value);
    const paid = parseFloat(document.getElementById('addFeePaid').value) || 0;
    const pending = parseFloat(document.getElementById('addFeePending').value) || 0;
    const status = document.getElementById('addFeeStatus').value;
    if (isNaN(amount) || amount <= 0) {
      window.showToast('Please enter a valid amount', 'error');
      return;
    }
    const newFee = { studentId, feeType: finalFeeType, amount, paid, pending, status };
    const result = await createData('feeRecords', newFee);
    window.FEE_RECORDS.push(result);
    window.showToast('Fee record added', 'success');
    renderFees();
    if (window.renderDashboard) window.renderDashboard();
    window.closeModal();
  });

  setTimeout(() => {
    const feeType = document.getElementById('addFeeType');
    const customGroup = document.getElementById('addCustomFeeGroup');
    if (feeType && customGroup) {
      feeType.addEventListener('change', function() {
        customGroup.style.display = this.value === 'Others' ? 'block' : 'none';
      });
      customGroup.style.display = feeType.value === 'Others' ? 'block' : 'none';
    }
  }, 50);
}

// ============================================================
// EDIT FEE
// ============================================================

async function editFee(id) {
  const fee = window.FEE_RECORDS.find(f => f.id === id);
  if (!fee) return;
  const students = window.STUDENTS || [];
  const studentOptions = students.map(s => `<option value="${s.id}" ${s.id === fee.studentId ? 'selected' : ''}>${s.name}</option>`).join('');

  const predefined = ['Admission Fee', 'Monthly Fee', 'Annual Fee', 'Examination Fee', 'Others'];
  let selectedType = fee.feeType;
  let showOthers = false;
  let customValue = '';
  if (predefined.includes(selectedType)) {
    if (selectedType === 'Others') showOthers = true;
  } else {
    selectedType = 'Others';
    customValue = fee.feeType;
    showOthers = true;
  }
  const feeTypeOptions = predefined.map(opt => `<option value="${opt}" ${opt === selectedType ? 'selected' : ''}>${opt}</option>`).join('');

  const modalHTML = `
    <div class="form-group"><label>Student</label><select id="editFeeStudent">${studentOptions}</select></div>
    <div class="form-group"><label>Fee Type</label><select id="editFeeType">${feeTypeOptions}</select></div>
    <div class="form-group" id="editCustomFeeGroup" style="${showOthers ? 'display:block;' : 'display:none;'}">
      <label>Custom Fee Description</label><input type="text" id="editCustomFee" value="${customValue}" />
    </div>
    <div class="form-group"><label>Amount (₹)</label><input type="number" id="editFeeAmount" value="${fee.amount}" /></div>
    <div class="form-group"><label>Paid (₹)</label><input type="number" id="editFeePaid" value="${fee.paid}" /></div>
    <div class="form-group"><label>Pending (₹)</label><input type="number" id="editFeePending" value="${fee.pending}" /></div>
    <div class="form-group"><label>Status</label>
      <select id="editFeeStatus">
        <option value="paid" ${fee.status === 'paid' ? 'selected' : ''}>Paid</option>
        <option value="pending" ${fee.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="overdue" ${fee.status === 'overdue' ? 'selected' : ''}>Overdue</option>
      </select>
    </div>
  `;

  window.openModal('Edit Fee Record', modalHTML, 'Update', async () => {
    const studentId = document.getElementById('editFeeStudent').value;
    const feeTypeSelect = document.getElementById('editFeeType');
    const feeType = feeTypeSelect.value;
    let finalFeeType = feeType;
    if (feeType === 'Others') {
      const custom = document.getElementById('editCustomFee').value.trim();
      if (!custom) { window.showToast('Please enter a custom fee description', 'error'); return; }
      finalFeeType = custom;
    }
    const amount = parseFloat(document.getElementById('editFeeAmount').value);
    const paid = parseFloat(document.getElementById('editFeePaid').value);
    const pending = parseFloat(document.getElementById('editFeePending').value);
    const status = document.getElementById('editFeeStatus').value;
    if (isNaN(amount) || isNaN(paid) || isNaN(pending) || amount < 0 || paid < 0 || pending < 0) {
      window.showToast('Please fill all numeric fields correctly', 'error');
      return;
    }
    const updated = { studentId, feeType: finalFeeType, amount, paid, pending, status };
    await updateData('feeRecords', id, updated);
    const idx = window.FEE_RECORDS.findIndex(f => f.id === id);
    if (idx !== -1) window.FEE_RECORDS[idx] = { ...window.FEE_RECORDS[idx], ...updated };
    window.showToast('Fee record updated', 'success');
    renderFees();
    if (window.renderDashboard) window.renderDashboard();
    window.closeModal();
  });

  setTimeout(() => {
    const feeType = document.getElementById('editFeeType');
    const customGroup = document.getElementById('editCustomFeeGroup');
    if (feeType && customGroup) {
      feeType.addEventListener('change', function() {
        customGroup.style.display = this.value === 'Others' ? 'block' : 'none';
      });
      customGroup.style.display = feeType.value === 'Others' ? 'block' : 'none';
    }
  }, 50);
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderFees = renderFees;
window.initFeeModule = initFeeModule;
window.showAddFeeModal = showAddFeeModal;
window.editFee = editFee;
window.deleteFee = deleteFee;
window.deleteFeeRecord = deleteFeeRecord;
window.showStudentDetail = showStudentDetail;
window.openCollectFeeModal = openCollectFeeModal;
window.processFeePayment = processFeePayment;
window.showPaymentHistory = showPaymentHistory;
window.printLastReceipt = printLastReceipt;
window.updateFeeCalculator = updateFeeCalculator;

// ============================================================
// RECEIPT WRAPPER FUNCTIONS – call imported functions
// ============================================================

function printLastReceipt(studentId) {
  const payments = window.PAYMENTS.filter(p => p.studentId === studentId);
  if (payments.length === 0) {
    window.showToast('No payment history found', 'info');
    return;
  }
  const lastPayment = payments[payments.length - 1];
  showReceipt(lastPayment.id);
  setTimeout(() => window.print(), 500);
}

function updateFeeCalculator() {
  const prevBalance = parseFloat(document.getElementById('calcPrevBalance').value) || 0;
  const discount = parseFloat(document.getElementById('calcDiscount').value) || 0;
  const lateFine = parseFloat(document.getElementById('calcLateFine').value) || 0;
  const received = parseFloat(document.getElementById('calcAmountReceived').value) || 0;
  const remaining = prevBalance + lateFine - discount - received;
  document.getElementById('calcRemaining').value = remaining.toFixed(2);
  document.getElementById('calcDisplayDiscount').textContent = discount;
  document.getElementById('calcDisplayFine').textContent = lateFine;
  document.getElementById('calcDisplayReceived').textContent = received;
  document.getElementById('calcDisplayRemaining').textContent = remaining.toFixed(2);
}
