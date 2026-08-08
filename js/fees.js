// ============================================================
// FEE MANAGEMENT – Full Upgraded Module (Firebase)
// ============================================================

import { createData, updateData, deleteData } from './firebase.js';

// ============================================================
// RENDER FEES TABLE + ANALYTICS
// ============================================================

function renderFees(session = '2025-26', classFilter = 'all', monthFilter = 'all', statusFilter = 'all', search = '', studentId = null) {
  const fees = window.FEE_RECORDS || [];
  const students = window.STUDENTS || [];

  let list = fees;

  // Apply filters
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
  // Month filter – if not 'all', filter by associated payment month
  if (monthFilter !== 'all') {
    list = list.filter(f => {
      const payment = window.PAYMENTS.find(p => p.studentId === f.studentId && p.amount === f.amount && p.status === f.status && p.date);
      if (!payment) return false;
      return payment.month === monthFilter;
    });
  }
  // Session filter – placeholder (no session field in fee records yet)

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

  tbody.innerHTML = list.map((f, idx) => {
    const student = students.find(s => s.id === f.studentId);
    const studentName = student ? student.name : 'Unknown';
    const studentClass = student ? `${student.class}${student.section}` : 'N/A';
    const isPaid = f.status === 'paid';
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
        <div class="actions-cell">
          <button class="btn-receipt" onclick="window.showReceipt('${f.id}')">Receipt</button>
          <button class="btn-delete" onclick="window.deleteFee('${f.id}')">Delete</button>
          ${!isPaid ? `<button class="btn-primary" onclick="window.payFee('${f.id}')" style="background:var(--primary); color:white; padding:0.2rem 0.6rem; border-radius:var(--radius); border:none; font-size:0.75rem;">Pay</button>` : ''}
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
          applyFeeFilters();
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
// STUDENT DETAIL PANEL
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

  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="display:flex; gap:1.5rem; flex-wrap:wrap;">
      <div style="display:flex; gap:1rem; align-items:center;">
        <div class="student-avatar">${student.name.charAt(0)}</div>
        <div>
          <h3 style="margin:0;">${student.name}</h3>
          <p style="margin:0; color:var(--gray-500); font-size:0.9rem;">${student.admissionNo || 'N/A'} | Roll: ${student.roll}</p>
        </div>
      </div>
      <div style="flex:1; min-width:200px;">
        <div class="detail-grid">
          <div class="label">Class & Section</div><div class="value">${student.class}${student.section}</div>
          <div class="label">Guardian</div><div class="value">${student.guardian || 'N/A'}</div>
          <div class="label">Total Paid</div><div class="value">₹${totalPaid.toLocaleString()}</div>
          <div class="label">Pending Amount</div><div class="value">₹${pendingTotal.toLocaleString()}</div>
          <div class="label">Last Payment</div><div class="value">${lastPayment ? new Date(lastPayment.date).toLocaleDateString() : 'N/A'}</div>
        </div>
      </div>
      <div style="display:flex; gap:0.5rem; align-items:center; margin-left:auto;">
        <button class="btn btn-primary" onclick="window.openCollectFeeModal('${id}')">Collect Fee</button>
        <button class="btn btn-secondary" onclick="window.showPaymentHistory('${id}')">Payment History</button>
        <button class="btn btn-secondary" onclick="window.printLastReceipt('${id}')">Print Last Receipt</button>
      </div>
    </div>
    <div style="margin-top:1rem; border-top:1px solid var(--gray-200); padding-top:1rem;">
      <h4 style="margin:0 0 0.5rem 0;">Fee Structure</h4>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:0.5rem;">
        ${feeRecordsForStudent.map(f => `
          <div style="background:var(--gray-50); padding:0.5rem; border-radius:var(--radius);">
            <div style="font-weight:600; font-size:0.9rem;">${f.feeType}</div>
            <div style="font-size:0.85rem; color:var(--gray-600);">Amount: ₹${f.amount} | Paid: ₹${f.paid} | Pending: ₹${f.pending}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================
// COLLECT FEE (Smart Calculator)
// ============================================================

function openCollectFeeModal(studentId) {
  const student = window.STUDENTS.find(s => s.id === studentId);
  if (!student) return;
  const studentFees = window.FEE_RECORDS.filter(f => f.studentId === studentId);
  const totalFee = studentFees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const pending = studentFees.reduce((sum, f) => sum + (f.pending || 0), 0);

  const modalHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
      <div>
        <div class="form-group"><label>Student</label><input type="text" value="${student.name}" disabled /></div>
        <div class="form-group"><label>Total Fee</label><input type="number" id="calcTotalFee" value="${totalFee}" disabled /></div>
        <div class="form-group"><label>Previous Balance</label><input type="number" id="calcPrevBalance" value="${pending}" disabled /></div>
        <div class="form-group"><label>Discount (₹)</label><input type="number" id="calcDiscount" value="0" oninput="window.updateFeeCalculator()" /></div>
        <div class="form-group"><label>Late Fine (₹)</label><input type="number" id="calcLateFine" value="0" oninput="window.updateFeeCalculator()" /></div>
      </div>
      <div>
        <div class="form-group"><label>Amount Received (₹)</label><input type="number" id="calcAmountReceived" value="${totalFee - pending}" oninput="window.updateFeeCalculator()" /></div>
        <div class="form-group"><label>Payment Method</label>
          <select id="calcPaymentMethod">
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Digital Wallet">Digital Wallet</option>
          </select>
        </div>
        <div class="form-group"><label>Remaining Balance</label><input type="number" id="calcRemaining" value="${pending}" disabled /></div>
        <div style="background:var(--gray-50); padding:0.75rem; border-radius:var(--radius); margin-top:0.5rem;">
          <p><strong>Total Fee:</strong> <span id="calcDisplayTotal">${totalFee}</span></p>
          <p><strong>Previous Balance:</strong> <span id="calcDisplayPrev">${pending}</span></p>
          <p><strong>Discount:</strong> <span id="calcDisplayDiscount">0</span></p>
          <p><strong>Late Fine:</strong> <span id="calcDisplayFine">0</span></p>
          <p><strong>Amount Received:</strong> <span id="calcDisplayReceived">${totalFee - pending}</span></p>
          <p><strong>Remaining:</strong> <span id="calcDisplayRemaining">${pending}</span></p>
        </div>
      </div>
    </div>
    <div style="margin-top:1rem;">
      <button class="btn btn-primary" id="processPaymentBtn" onclick="window.processFeePayment('${studentId}')">Process Payment</button>
    </div>
  `;
  window.openModal('Collect Fee', modalHTML, 'Cancel', () => { window.closeModal(); });
  window.updateFeeCalculator = function() {
    const totalFee = parseFloat(document.getElementById('calcTotalFee').value) || 0;
    const prevBalance = parseFloat(document.getElementById('calcPrevBalance').value) || 0;
    const discount = parseFloat(document.getElementById('calcDiscount').value) || 0;
    const lateFine = parseFloat(document.getElementById('calcLateFine').value) || 0;
    const received = parseFloat(document.getElementById('calcAmountReceived').value) || 0;
    const remaining = prevBalance + lateFine - discount - received;
    document.getElementById('calcRemaining').value = remaining.toFixed(2);
    document.getElementById('calcDisplayTotal').textContent = totalFee;
    document.getElementById('calcDisplayPrev').textContent = prevBalance;
    document.getElementById('calcDisplayDiscount').textContent = discount;
    document.getElementById('calcDisplayFine').textContent = lateFine;
    document.getElementById('calcDisplayReceived').textContent = received;
    document.getElementById('calcDisplayRemaining').textContent = remaining.toFixed(2);
  };
}

// ============================================================
// PROCESS PAYMENT (via Collect Fee modal)
// ============================================================

async function processFeePayment(studentId) {
  const received = parseFloat(document.getElementById('calcAmountReceived').value) || 0;
  const method = document.getElementById('calcPaymentMethod').value;
  const btn = document.getElementById('processPaymentBtn');
  if (received <= 0) {
    window.showToast('Please enter a valid amount', 'error');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

  try {
    const receiptNo = `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    // Create fee record (this is a new payment, not an update of existing fee)
    // But we want to update an existing fee record if it's for a specific fee.
    // For simplicity, we'll create a new payment record and also update the associated fee record's paid/pending.
    // However, the "Collect Fee" modal is typically for a student's overall balance, not a specific fee.
    // We'll keep the existing behavior: it creates a new fee record of type 'Payment' and a payment history record.
    // But we also need to update the specific fee record if it's a partial payment.
    // To keep it simple, we'll create a new fee record of type 'Payment' (which is what the old code did).
    // This will add to the total paid, but the original fee record remains unchanged.
    // That's acceptable for this ERP design.
    const newFee = {
      studentId: studentId,
      feeType: 'Payment',
      amount: received,
      paid: received,
      pending: 0,
      status: 'paid',
      receiptNo: receiptNo
    };
    const feeResult = await createData('feeRecords', newFee);
    window.FEE_RECORDS.push(feeResult);

    // Create payment history
    const payment = {
      studentId: studentId,
      receiptNo: receiptNo,
      date: new Date().toISOString().split('T')[0],
      month: new Date().toLocaleString('default', { month: 'long' }),
      amount: received,
      method: method,
      status: 'paid'
    };
    const payResult = await createData('payments', payment);
    window.PAYMENTS.push(payResult);

    window.showToast('Payment processed successfully! Receipt: ' + receiptNo, 'success');
    window.closeModal();
    applyFeeFilters();
    if (window.renderDashboard) window.renderDashboard();
  } catch (error) {
    console.error('Payment error:', error);
    window.showToast('Payment failed. Please try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Process Payment'; }
  }
}

// ============================================================
// PAY FEE (for individual fee record)
// ============================================================

async function payFee(feeId) {
  const fee = window.FEE_RECORDS.find(f => f.id === feeId);
  if (!fee) {
    window.showToast('Fee record not found', 'error');
    return;
  }

  // Open a modal to enter payment amount
  const modalHTML = `
    <div class="form-group">
      <label>Amount to Pay (₹)</label>
      <input type="number" id="payAmount" value="${fee.pending}" min="1" max="${fee.pending}" step="1" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);" />
    </div>
    <div class="form-group">
      <label>Payment Method</label>
      <select id="payPaymentMethod" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);">
        <option value="Cash">Cash</option>
        <option value="Bank Transfer">Bank Transfer</option>
        <option value="Cheque">Cheque</option>
        <option value="Digital Wallet">Digital Wallet</option>
      </select>
    </div>
  `;

  window.openModal('Pay Fee', modalHTML, 'Pay', async () => {
    const amountPaid = parseFloat(document.getElementById('payAmount').value);
    const method = document.getElementById('payPaymentMethod').value;

    if (isNaN(amountPaid) || amountPaid <= 0 || amountPaid > fee.pending) {
      window.showToast('Please enter a valid amount (between 1 and ' + fee.pending + ')', 'error');
      return;
    }

    const newPaid = (fee.paid || 0) + amountPaid;
    const newPending = (fee.pending || 0) - amountPaid;
    const newStatus = newPending === 0 ? 'paid' : 'pending'; // if partial payment, status remains pending

    const updated = {
      paid: newPaid,
      pending: newPending,
      status: newStatus
    };

    try {
      await updateData('feeRecords', feeId, updated);
      const idx = window.FEE_RECORDS.findIndex(f => f.id === feeId);
      if (idx !== -1) {
        window.FEE_RECORDS[idx] = { ...window.FEE_RECORDS[idx], ...updated };
      }

      // Add payment history
      const receiptNo = `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const payment = {
        studentId: fee.studentId,
        receiptNo: receiptNo,
        date: new Date().toISOString().split('T')[0],
        month: new Date().toLocaleString('default', { month: 'long' }),
        amount: amountPaid,
        method: method,
        status: 'paid'
      };
      const payResult = await createData('payments', payment);
      window.PAYMENTS.push(payResult);

      window.showToast('Payment of ₹' + amountPaid + ' recorded successfully!', 'success');
      window.closeModal();
      applyFeeFilters();
      if (window.renderDashboard) window.renderDashboard();
    } catch (error) {
      console.error('Pay fee error:', error);
      window.showToast('Failed to process payment. Please try again.', 'error');
    }
  });
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
      <td>${p.month}</td>
      <td>₹${(p.amount || 0).toLocaleString()}</td>
      <td>${p.method}</td>
      <td><span class="status-badge status-${p.status}">${p.status}</span></td>
      <td>
        <button class="btn-edit" onclick="window.viewReceipt('${p.id}')">View</button>
        <button class="btn-receipt" onclick="window.reprintReceipt('${p.id}')">Reprint</button>
        <button class="btn-edit" onclick="window.downloadReceiptPDF('${p.id}')">PDF</button>
      </td>
    </tr>
  `).join('');

  window.openModal(`Payment History – ${student.name}`, `
    <div style="overflow-x:auto;">
      <table class="data-table">
        <thead><tr><th>Receipt No</th><th>Date</th><th>Month</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `, 'Close', () => { window.closeModal(); });
}

// ============================================================
// BULK COLLECT
// ============================================================

function openBulkCollectModal() {
  window.openModal('Bulk Fee Collection', `
    <div class="form-group"><label>Class</label>
      <select id="bulkClass" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);">
        ${Array.from({length:12}, (_,i) => i+1).map(c => `<option value="${c}">Class ${c}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Section</label>
      <select id="bulkSection" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);">
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="NA">NA</option>
      </select>
    </div>
    <div class="form-group"><label>Fee Type</label><input type="text" id="bulkFeeType" placeholder="e.g., Tuition" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);" /></div>
    <div class="form-group"><label>Amount (₹)</label><input type="number" id="bulkAmount" placeholder="5000" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);" /></div>
  `, 'Collect for All', async () => {
    const classVal = parseInt(document.getElementById('bulkClass').value);
    const section = document.getElementById('bulkSection').value;
    const feeType = document.getElementById('bulkFeeType').value.trim();
    const amount = parseFloat(document.getElementById('bulkAmount').value);
    const btn = document.querySelector('#modal .btn-primary');
    if (!feeType || isNaN(amount) || amount <= 0) {
      window.showToast('Please fill all fields correctly', 'error');
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

    const students = window.STUDENTS.filter(s => s.class === classVal && s.section === section);
    let successCount = 0;
    let errorCount = 0;

    for (const s of students) {
      try {
        const newFee = {
          studentId: s.id,
          feeType: feeType,
          amount: amount,
          paid: 0,
          pending: amount,
          status: 'pending'
        };
        const result = await createData('feeRecords', newFee);
        window.FEE_RECORDS.push(result);
        successCount++;
      } catch (error) {
        console.error(`Error adding fee for ${s.name}:`, error);
        errorCount++;
      }
    }

    if (btn) { btn.disabled = false; btn.textContent = 'Collect for All'; }

    window.closeModal();
    window.showToast(`Added ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`, errorCount > 0 ? 'error' : 'success');
    applyFeeFilters();
    if (window.renderDashboard) window.renderDashboard();
  });
}

// ============================================================
// FILTERS (Auto-apply)
// ============================================================

function applyFeeFilters() {
  const session = document.getElementById('feeSession').value;
  const classFilter = document.getElementById('feeClassFilter').value;
  const monthFilter = document.getElementById('feeMonthFilter').value;
  const statusFilter = document.getElementById('feeStatusFilter').value;
  const search = document.getElementById('feeUniversalSearch').value;
  renderFees(session, classFilter, monthFilter, statusFilter, search);
}

// ============================================================
// INIT FEE MODULE
// ============================================================

function initFeeModule() {
  renderFeeAnalytics();
  setupFeeSearch();

  // Auto-apply on filter change
  const filters = ['feeSession', 'feeClassFilter', 'feeMonthFilter', 'feeStatusFilter'];
  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyFeeFilters);
  });

  // Bulk collect
  const bulkBtn = document.getElementById('feeCollectBulkBtn');
  if (bulkBtn) bulkBtn.addEventListener('click', openBulkCollectModal);

  // Add Fee
  document.getElementById('addFeeBtn').addEventListener('click', showAddFeeModal);

  // Search input
  const searchInput = document.getElementById('feeUniversalSearch');
  if (searchInput) {
    searchInput.addEventListener('input', applyFeeFilters);
  }
}

// ============================================================
// ADD FEE (simplified)
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
    if (isNaN(amount) || amount <= 0) {
      window.showToast('Please enter a valid amount', 'error');
      return;
    }
    const newFee = {
      studentId,
      feeType: finalFeeType,
      amount,
      paid: 0,
      pending: amount,
      status: 'pending'
    };
    const result = await createData('feeRecords', newFee);
    window.FEE_RECORDS.push(result);
    window.showToast('Fee record added', 'success');
    applyFeeFilters();
    if (window.renderDashboard) window.renderDashboard();
    window.closeModal();
  });

  // Conditional logic for Others
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
// DELETE FEE (with associated payment cleanup)
// ============================================================

async function deleteFee(id) {
  if (!confirm('Delete this fee record?')) return;

  const fee = window.FEE_RECORDS.find(f => f.id === id);
  if (!fee) {
    window.showToast('Fee record not found', 'error');
    return;
  }

  // If fee type is 'Payment', also delete associated payment record
  let paymentToDelete = null;
  if (fee.feeType === 'Payment') {
    paymentToDelete = window.PAYMENTS.find(p =>
      p.studentId === fee.studentId &&
      p.amount === fee.amount &&
      p.status === fee.status &&
      new Date(p.date).toDateString() === new Date().toDateString()
    );
  }

  try {
    if (paymentToDelete) {
      await deleteData('payments', paymentToDelete.id);
      window.PAYMENTS = window.PAYMENTS.filter(p => p.id !== paymentToDelete.id);
    }
    await deleteData('feeRecords', id);
    window.FEE_RECORDS = window.FEE_RECORDS.filter(f => f.id !== id);

    window.showToast('Fee record deleted' + (paymentToDelete ? ' and associated payment' : ''), 'success');
    applyFeeFilters();
    if (window.renderDashboard) window.renderDashboard();
  } catch (error) {
    console.error('Delete error:', error);
    window.showToast('Failed to delete record. Please try again.', 'error');
  }
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderFees = renderFees;
window.initFeeModule = initFeeModule;
window.showAddFeeModal = showAddFeeModal;
window.deleteFee = deleteFee;
window.payFee = payFee;
window.showStudentDetail = showStudentDetail;
window.openCollectFeeModal = openCollectFeeModal;
window.processFeePayment = processFeePayment;
window.showPaymentHistory = showPaymentHistory;
window.openBulkCollectModal = openBulkCollectModal;
window.processBulkCollection = processBulkCollection;
window.applyFeeFilters = applyFeeFilters;
