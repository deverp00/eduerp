// ============================================================
// SALARY MODULE – CRUD, Render, Filters, One-payment-per-month
// ============================================================

import { createData, updateData, deleteData } from './firebase.js';

// ============================================================
// RENDER SALARY TABLE + STATS
// ============================================================

function renderSalary(statusFilter = 'all', search = '') {
  const salaryRecords = window.SALARY_RECORDS || [];

  // Stats
  const totalPaid = salaryRecords.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalPending = salaryRecords.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalRecords = salaryRecords.length;

  const statsGrid = document.getElementById('salaryStatsGrid');
  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card"><span class="stat-label">Total Salary Paid</span><span class="stat-value">₹${totalPaid.toLocaleString()}</span></div>
      <div class="stat-card"><span class="stat-label">Total Salary Pending</span><span class="stat-value">₹${totalPending.toLocaleString()}</span></div>
      <div class="stat-card"><span class="stat-label">Total Records</span><span class="stat-value">${totalRecords}</span></div>
    `;
  }

  let list = salaryRecords;
  if (statusFilter !== 'all') {
    list = list.filter(s => s.status === statusFilter);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(s => s.employeeName.toLowerCase().includes(q));
  }

  const tbody = document.getElementById('salaryTableBody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--gray-500); padding:2rem;">No salary records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((s, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${s.employeeName}</td>
      <td><span class="status-badge ${s.role === 'teacher' ? 'status-paid' : 'status-pending'}">${s.role}</span></td>
      <td>${s.month}</td>
      <td>${s.year}</td>
      <td>₹${(s.amount || 0).toLocaleString()}</td>
      <td><span class="status-badge status-${s.status}">${s.status}</span></td>
      <td>${s.paymentMethod || '—'}</td>
      <td>
        <div class="actions-cell">
          <button class="btn-receipt" data-id="${s.id}" data-action="showReceipt">Receipt</button>
          <button class="btn-delete" data-id="${s.id}" data-action="deleteSalary">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach event listeners using data attributes instead of onclick
  tbody.querySelectorAll('[data-action="showReceipt"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.showSalaryReceipt) window.showSalaryReceipt(btn.dataset.id);
    });
  });
  tbody.querySelectorAll('[data-action="deleteSalary"]').forEach(btn => {
    btn.addEventListener('click', () => deleteSalary(btn.dataset.id));
  });
}

// ============================================================
// GET ELIGIBLE TEACHERS FOR SELECTED MONTH/YEAR
// ============================================================

function getEligibleTeachers(month, year) {
  const allTeachers = window.TEACHERS || [];
  const paidTeachers = window.SALARY_RECORDS
    .filter(s => s.month === month && s.year === year)
    .map(s => s.employeeId);
  return allTeachers.filter(t => !paidTeachers.includes(t.id));
}

// ============================================================
// ADD SALARY – Navigate to full-page form
// ============================================================

function showAddSalaryModal() {
  window.navigateTo('add-salary');
}

// ============================================================
// POPULATE SALARY FORM (dropdowns + eligibility)
// ============================================================

function populateSalaryForm() {
  const monthSelect = document.getElementById('addSalaryMonth');
  const yearSelect = document.getElementById('addSalaryYear');
  const employeeSelect = document.getElementById('addSalaryEmployee');
  if (!monthSelect || !yearSelect || !employeeSelect) return;

  // Set default month/year to current
  const now = new Date();
  const defaultMonth = now.toLocaleString('default', { month: 'long' });
  const defaultYear = now.getFullYear();

  if (!monthSelect.value) monthSelect.value = defaultMonth;
  if (!yearSelect.value) yearSelect.value = defaultYear;

  function updateEligibleTeachers() {
    const m = monthSelect.value;
    const y = parseInt(yearSelect.value);
    const eligible = getEligibleTeachers(m, y);
    employeeSelect.innerHTML = eligible.map(t =>
      `<option value="${t.id}">${t.name} (${t.role})</option>`
    ).join('') || '<option value="">No eligible teachers</option>';
  }

  updateEligibleTeachers();

  // Re-run when month or year changes
  monthSelect.addEventListener('change', updateEligibleTeachers);
  yearSelect.addEventListener('change', updateEligibleTeachers);
}

// ============================================================
// SUBMIT HANDLER FOR THE FULL-PAGE ADD FORM
// ============================================================

function setupAddSalaryForm() {
  const submitBtn = document.getElementById('addSalarySubmitBtn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async function() {
    const month = document.getElementById('addSalaryMonth').value;
    const year = parseInt(document.getElementById('addSalaryYear').value);
    const employeeId = document.getElementById('addSalaryEmployee').value;
    const amount = parseFloat(document.getElementById('addSalaryAmount').value);
    const status = document.getElementById('addSalaryStatus').value;
    const paymentMethod = document.getElementById('addSalaryPaymentMethod').value;

    if (!employeeId || !month || !year || isNaN(amount) || amount <= 0) {
      window.showToast('Please fill all fields with valid values', 'error');
      return;
    }

    if (status === 'paid' && !paymentMethod) {
      window.showToast('Payment method is required when status is "paid"', 'error');
      return;
    }

    // Duplicate check (final safeguard)
    const existing = window.SALARY_RECORDS.find(s => s.employeeId === employeeId && s.month === month && s.year === year);
    if (existing) {
      window.showToast('This teacher already has a salary record for this month/year.', 'error');
      return;
    }

    const employee = window.TEACHERS.find(t => t.id === employeeId);
    if (!employee) {
      window.showToast('Teacher not found', 'error');
      return;
    }

    // Generate receipt number if paid
    let receiptNo = '';
    if (status === 'paid') {
      receiptNo = `SAL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    }

    // Generate unique salary ID
    const random = Math.floor(1000 + Math.random() * 9000);
    let salaryId = `SAL-${random}`;
    // Check for duplicate salaryId
    const isDuplicate = window.SALARY_RECORDS.some(s => s.salaryId === salaryId);
    if (isDuplicate) {
      const newRandom = Math.floor(1000 + Math.random() * 9000);
      salaryId = `SAL-${newRandom}`;
    }

    const newSalary = {
      employeeId,
      employeeName: employee.name,
      role: employee.role,
      month,
      year,
      amount,
      status,
      paymentMethod: status === 'paid' ? paymentMethod : '',
      receiptNo: receiptNo,
      paymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : '',
      salaryId: salaryId
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const result = await createData('salaryRecords', newSalary);
      window.SALARY_RECORDS.push(result);
      window.showToast('Salary record added successfully', 'success');
      window.navigateTo('salary');
    } catch (error) {
      console.error('Add salary error:', error);
      window.showToast('Failed to add salary record. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Salary';
    }
  });
}

// ============================================================
// DELETE SALARY
// ============================================================

async function deleteSalary(id) {
  if (!confirm('Are you sure you want to delete this salary record?')) return;

  const btn = document.querySelector(`button[data-id="${id}"][data-action="deleteSalary"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Deleting...'; }

  try {
    await deleteData('salaryRecords', id);
    window.SALARY_RECORDS = window.SALARY_RECORDS.filter(s => s.id !== id);
    window.showToast('Salary record deleted', 'success');
    renderSalary();
    if (window.renderDashboard) window.renderDashboard();
  } catch (error) {
    console.error('Delete salary error:', error);
    window.showToast('Failed to delete salary record. Please try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Delete'; }
  }
}

// ============================================================
// SHOW SALARY RECEIPT
// ============================================================

function showSalaryReceipt(id) {
  const record = window.SALARY_RECORDS.find(s => s.id === id);
  if (!record) {
    window.showToast('Record not found', 'error');
    return;
  }
  const receiptHTML = `
    <div style="text-align:center; padding:1rem 0;">
      <h3 style="margin:0 0 0.5rem;">Salary Receipt</h3>
      <p style="margin:0; color:var(--gray-500);">#${record.receiptNo || 'N/A'}</p>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.9rem;">
      <span><strong>Employee:</strong> ${record.employeeName}</span>
      <span><strong>Role:</strong> ${record.role}</span>
      <span><strong>Month:</strong> ${record.month}</span>
      <span><strong>Year:</strong> ${record.year}</span>
      <span><strong>Amount:</strong> ₹${(record.amount || 0).toLocaleString()}</span>
      <span><strong>Status:</strong> <span class="status-badge status-${record.status}">${record.status}</span></span>
      <span><strong>Payment Method:</strong> ${record.paymentMethod || '—'}</span>
      <span><strong>Payment Date:</strong> ${record.paymentDate || '—'}</span>
    </div>
  `;
  window.openModal('Salary Receipt', receiptHTML, 'Close', () => window.closeModal());
}

// ============================================================
// MIGRATION: ADD SALARY IDs TO ALL EXISTING RECORDS
// ============================================================

async function migrateSalaryIds() {
  const salaryRecords = window.SALARY_RECORDS || [];
  let updatedCount = 0;

  for (const record of salaryRecords) {
    if (record.salaryId) continue;

    const random = Math.floor(1000 + Math.random() * 9000);
    let salaryId = `SAL-${random}`;

    const isDuplicate = salaryRecords.some(s => s.salaryId === salaryId);
    if (isDuplicate) {
      const newRandom = Math.floor(1000 + Math.random() * 9000);
      salaryId = `SAL-${newRandom}`;
    }

    try {
      await updateData('salaryRecords', record.id, { salaryId });
      record.salaryId = salaryId;
      updatedCount++;
    } catch (error) {
      console.error(`Failed to migrate salary record for ${record.employeeName}:`, error);
    }
  }

  if (updatedCount > 0) {
    console.log(`✅ ${updatedCount} salary records updated with Salary IDs.`);
  }
  return updatedCount;
}

// ============================================================
// EVENT BINDINGS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addSalaryBtn');
  if (addBtn) addBtn.addEventListener('click', showAddSalaryModal);

  const searchInput = document.getElementById('salarySearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const status = document.getElementById('salaryFilter')?.value || 'all';
      renderSalary(status, e.target.value);
    });
  }

  const filterSelect = document.getElementById('salaryFilter');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      const search = document.getElementById('salarySearch')?.value || '';
      renderSalary(e.target.value, search);
    });
  }

  // Populate the salary form dropdowns
  populateSalaryForm();

  // Set up the full-page add form submit
  setupAddSalaryForm();
});

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderSalary = renderSalary;
window.showAddSalaryModal = showAddSalaryModal;
window.deleteSalary = deleteSalary;
window.showSalaryReceipt = showSalaryReceipt;
window.migrateSalaryIds = migrateSalaryIds;
