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
          <button class="btn-receipt" onclick="window.showSalaryReceipt('${s.id}')">Receipt</button>
          <button class="btn-delete" onclick="window.deleteSalary('${s.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach event listeners for delete buttons (already using onclick)
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
// ADD SALARY (WITH ELIGIBILITY & DUPLICATE CHECK)
// ============================================================

function showAddSalaryModal() {
  // Default to current month/year
  const now = new Date();
  const defaultMonth = now.toLocaleString('default', { month: 'long' });
  const defaultYear = now.getFullYear();

  // Get eligible teachers for default month/year
  const eligible = getEligibleTeachers(defaultMonth, defaultYear);
  const employeeOptions = eligible.map(t =>
    `<option value="${t.id}">${t.name} (${t.role})</option>`
  ).join('');

  const monthOptions = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    .map(m => `<option value="${m}" ${m === defaultMonth ? 'selected' : ''}>${m}</option>`).join('');

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
    .map(y => `<option value="${y}" ${y === defaultYear ? 'selected' : ''}>${y}</option>`).join('');

  const paymentMethodOptions = ['Bank Transfer', 'Cash', 'Cheque', 'Digital Wallet']
    .map(p => `<option value="${p}">${p}</option>`).join('');

  const modalHTML = `
    <div class="form-group"><label>Month</label>
      <select id="addSalaryMonth" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);">${monthOptions}</select>
    </div>
    <div class="form-group"><label>Year</label>
      <select id="addSalaryYear" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);">${yearOptions}</select>
    </div>
    <div class="form-group"><label>Teacher</label>
      <select id="addSalaryEmployee" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);">
        ${employeeOptions || '<option value="">No eligible teachers</option>'}
      </select>
    </div>
    <div class="form-group"><label>Amount (₹)</label><input type="number" id="addSalaryAmount" placeholder="Enter salary amount" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);" /></div>
    <div class="form-group"><label>Status</label>
      <select id="addSalaryStatus" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);">
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
      </select>
    </div>
    <div class="form-group"><label>Payment Method</label>
      <select id="addSalaryPaymentMethod" style="width:100%; padding:0.5rem; border:1px solid var(--gray-200); border-radius:var(--radius);">
        <option value="">— Select —</option>
        ${paymentMethodOptions}
      </select>
    </div>
  `;

  window.openModal('Add Salary', modalHTML, 'Add Salary', async () => {
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
      paymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : ''
    };

    const btn = document.querySelector('#modal .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    try {
      const result = await createData('salaryRecords', newSalary);
      window.SALARY_RECORDS.push(result);
      window.showToast('Salary record added successfully', 'success');
      renderSalary();
      if (window.renderDashboard) window.renderDashboard();
      window.closeModal();
    } catch (error) {
      console.error('Add salary error:', error);
      window.showToast('Failed to add salary record. Please try again.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Add Salary'; }
    }
  });

  // Auto-refresh eligible teachers when month/year changes
  setTimeout(() => {
    const monthSelect = document.getElementById('addSalaryMonth');
    const yearSelect = document.getElementById('addSalaryYear');
    const employeeSelect = document.getElementById('addSalaryEmployee');

    function updateEligibleTeachers() {
      const m = monthSelect.value;
      const y = parseInt(yearSelect.value);
      const eligible = getEligibleTeachers(m, y);
      employeeSelect.innerHTML = eligible.map(t =>
        `<option value="${t.id}">${t.name} (${t.role})</option>`
      ).join('') || '<option value="">No eligible teachers</option>';
    }

    if (monthSelect && yearSelect && employeeSelect) {
      monthSelect.addEventListener('change', updateEligibleTeachers);
      yearSelect.addEventListener('change', updateEligibleTeachers);
    }
  }, 50);
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
});

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderSalary = renderSalary;
window.showAddSalaryModal = showAddSalaryModal;
window.deleteSalary = deleteSalary;
