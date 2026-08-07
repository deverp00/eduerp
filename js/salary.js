// ============================================================
// SALARY MODULE – CRUD, Render, Filters
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
          <button class="btn-edit" data-id="${s.id}" data-action="editSalary">Edit</button>
          <button class="btn-delete" data-id="${s.id}" data-action="deleteSalary">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach event listeners
  tbody.querySelectorAll('[data-action="editSalary"]').forEach(btn => {
    btn.addEventListener('click', () => editSalary(btn.dataset.id));
  });
  tbody.querySelectorAll('[data-action="deleteSalary"]').forEach(btn => {
    btn.addEventListener('click', () => deleteSalary(btn.dataset.id));
  });
}

// ============================================================
// ADD SALARY
// ============================================================

function showAddSalaryModal() {
  const teachers = window.TEACHERS || [];
  const employeeOptions = teachers.map(t =>
    `<option value="${t.id}">${t.name} (${t.role})</option>`
  ).join('');

  const monthOptions = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    .map(m => `<option value="${m}">${m}</option>`).join('');

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
    .map(y => `<option value="${y}">${y}</option>`).join('');

  const paymentMethodOptions = ['Bank Transfer', 'Cash', 'Cheque', 'Digital Wallet']
    .map(p => `<option value="${p}">${p}</option>`).join('');

  const modalHTML = `
    <div class="form-group"><label>Employee</label><select id="addSalaryEmployee">${employeeOptions}</select></div>
    <div class="form-group"><label>Month</label><select id="addSalaryMonth">${monthOptions}</select></div>
    <div class="form-group"><label>Year</label><select id="addSalaryYear">${yearOptions}</select></div>
    <div class="form-group"><label>Amount (₹)</label><input type="number" id="addSalaryAmount" placeholder="Enter salary amount" /></div>
    <div class="form-group"><label>Status</label>
      <select id="addSalaryStatus">
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
      </select>
    </div>
    <div class="form-group"><label>Payment Method</label>
      <select id="addSalaryPaymentMethod">
        <option value="">— Select —</option>
        ${paymentMethodOptions}
      </select>
    </div>
  `;

  window.openModal('Add Salary', modalHTML, 'Add Salary', async () => {
    const employeeId = document.getElementById('addSalaryEmployee').value;
    const month = document.getElementById('addSalaryMonth').value;
    const year = parseInt(document.getElementById('addSalaryYear').value);
    const amount = parseFloat(document.getElementById('addSalaryAmount').value);
    const status = document.getElementById('addSalaryStatus').value;
    const paymentMethod = document.getElementById('addSalaryPaymentMethod').value;

    if (!employeeId || !month || !year || isNaN(amount) || amount <= 0) {
      window.showToast('Please fill all fields with valid values', 'error');
      return;
    }

    const employee = window.TEACHERS.find(t => t.id === employeeId);
    if (!employee) {
      window.showToast('Employee not found', 'error');
      return;
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
    };

    const result = await createData('salaryRecords', newSalary);
    window.SALARY_RECORDS.push(result);
    window.showToast('Salary record added successfully', 'success');
    renderSalary();
    if (window.renderDashboard) window.renderDashboard();
    window.closeModal();
  });
}

// ============================================================
// EDIT SALARY
// ============================================================

async function editSalary(id) {
  const salary = window.SALARY_RECORDS.find(s => s.id === id);
  if (!salary) return;

  const teachers = window.TEACHERS || [];
  const employeeOptions = teachers.map(t =>
    `<option value="${t.id}" ${t.id === salary.employeeId ? 'selected' : ''}>${t.name} (${t.role})</option>`
  ).join('');

  const monthOptions = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    .map(m => `<option value="${m}" ${m === salary.month ? 'selected' : ''}>${m}</option>`).join('');

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
    .map(y => `<option value="${y}" ${y === salary.year ? 'selected' : ''}>${y}</option>`).join('');

  const paymentMethodOptions = ['Bank Transfer', 'Cash', 'Cheque', 'Digital Wallet']
    .map(p => `<option value="${p}" ${p === salary.paymentMethod ? 'selected' : ''}>${p}</option>`).join('');

  const modalHTML = `
    <div class="form-group"><label>Employee</label><select id="editSalaryEmployee">${employeeOptions}</select></div>
    <div class="form-group"><label>Month</label><select id="editSalaryMonth">${monthOptions}</select></div>
    <div class="form-group"><label>Year</label><select id="editSalaryYear">${yearOptions}</select></div>
    <div class="form-group"><label>Amount (₹)</label><input type="number" id="editSalaryAmount" value="${salary.amount}" /></div>
    <div class="form-group"><label>Status</label>
      <select id="editSalaryStatus">
        <option value="paid" ${salary.status === 'paid' ? 'selected' : ''}>Paid</option>
        <option value="pending" ${salary.status === 'pending' ? 'selected' : ''}>Pending</option>
      </select>
    </div>
    <div class="form-group"><label>Payment Method</label>
      <select id="editSalaryPaymentMethod">
        <option value="">— Select —</option>
        ${paymentMethodOptions}
      </select>
    </div>
  `;

  window.openModal('Edit Salary', modalHTML, 'Update', async () => {
    const employeeId = document.getElementById('editSalaryEmployee').value;
    const month = document.getElementById('editSalaryMonth').value;
    const year = parseInt(document.getElementById('editSalaryYear').value);
    const amount = parseFloat(document.getElementById('editSalaryAmount').value);
    const status = document.getElementById('editSalaryStatus').value;
    const paymentMethod = document.getElementById('editSalaryPaymentMethod').value;

    if (!employeeId || !month || !year || isNaN(amount) || amount <= 0) {
      window.showToast('Please fill all fields with valid values', 'error');
      return;
    }

    const employee = window.TEACHERS.find(t => t.id === employeeId);
    if (!employee) {
      window.showToast('Employee not found', 'error');
      return;
    }

    const updated = {
      employeeId,
      employeeName: employee.name,
      role: employee.role,
      month,
      year,
      amount,
      status,
      paymentMethod: status === 'paid' ? paymentMethod : '',
    };

    await updateData('salaryRecords', id, updated);
    const idx = window.SALARY_RECORDS.findIndex(s => s.id === id);
    if (idx !== -1) window.SALARY_RECORDS[idx] = { ...window.SALARY_RECORDS[idx], ...updated };
    window.showToast('Salary record updated successfully', 'success');
    renderSalary();
    if (window.renderDashboard) window.renderDashboard();
    window.closeModal();
  });
}

// ============================================================
// DELETE SALARY
// ============================================================

async function deleteSalary(id) {
  if (!confirm('Are you sure you want to delete this salary record?')) return;
  await deleteData('salaryRecords', id);
  window.SALARY_RECORDS = window.SALARY_RECORDS.filter(s => s.id !== id);
  window.showToast('Salary record deleted', 'success');
  renderSalary();
  if (window.renderDashboard) window.renderDashboard();
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
window.editSalary = editSalary;
window.deleteSalary = deleteSalary;
