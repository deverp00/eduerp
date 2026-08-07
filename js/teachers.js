// ============================================================
// TEACHERS & STAFF – CRUD, Render, Employee ID
// ============================================================

import { createData, updateData, deleteData } from './firebase.js';

// ============================================================
// EMPLOYEE ID GENERATION
// ============================================================

function getNextEmployeeId() {
  const teachers = window.TEACHERS || [];
  let maxNum = 0;
  teachers.forEach(t => {
    if (t.employeeId) {
      const match = t.employeeId.match(/EMP-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(4, '0');
  return `EMP-${padded}`;
}

async function migrateEmployeeIds() {
  const teachers = window.TEACHERS || [];
  let updated = 0;
  for (const teacher of teachers) {
    if (!teacher.employeeId) {
      const newId = getNextEmployeeId();
      await updateData('teachers', teacher.id, { employeeId: newId });
      teacher.employeeId = newId;
      updated++;
    }
  }
  if (updated > 0) {
    console.log(`Migrated ${updated} teachers with Employee IDs.`);
  }
  return updated;
}

// ============================================================
// RENDER STAFF TABLE + STATS
// ============================================================

function renderStaff(filter = 'all', search = '') {
  const teachers = window.TEACHERS || [];

  const totalTeachers = teachers.filter(t => t.role === 'teacher').length;
  const totalStaff = teachers.filter(t => t.role === 'staff').length;
  const totalEmployees = teachers.length;

  document.getElementById('staffStatsGrid').innerHTML = `
    <div class="stat-card"><span class="stat-label">Total Teachers</span><span class="stat-value">${totalTeachers}</span></div>
    <div class="stat-card"><span class="stat-label">Total Staff</span><span class="stat-value">${totalStaff}</span></div>
    <div class="stat-card"><span class="stat-label">Total Employees</span><span class="stat-value">${totalEmployees}</span></div>
  `;

  let list = teachers;
  if (filter !== 'all') {
    list = list.filter(t => t.role === filter);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.subDepartment.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  }

  const tbody = document.getElementById('staffTableBody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--gray-500); padding:2rem;">No employees found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((t, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${t.employeeId || '—'}</td>
      <td>${t.name}</td>
      <td><span class="status-badge ${t.role === 'teacher' ? 'status-paid' : 'status-pending'}">${t.role}</span></td>
      <td>${t.designation}</td>
      <td>${t.subDepartment}</td>
      <td>${t.email}</td>
      <td>
        <div class="actions-cell">
          <button class="btn-edit" data-id="${t.id}" data-action="editStaff">Edit</button>
          <button class="btn-delete" data-id="${t.id}" data-action="deleteStaff">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="editStaff"]').forEach(btn => {
    btn.addEventListener('click', () => editStaff(btn.dataset.id));
  });
  tbody.querySelectorAll('[data-action="deleteStaff"]').forEach(btn => {
    btn.addEventListener('click', () => deleteStaff(btn.dataset.id));
  });
}

// ============================================================
// ADD STAFF (with Employee ID)
// ============================================================

function showAddStaffModal() {
  const designationOptions = ['Principal', 'Head Master', 'Assistant Teacher', 'Subject Teacher', 'Administration', 'Staff', 'Peon']
    .map(d => `<option value="${d}">${d}</option>`).join('');
  const subjectOptions = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Physical Education', 'Arts', 'Music', 'N/A']
    .map(s => `<option value="${s}">${s}</option>`).join('');

  window.openModal('Add Teacher / Staff', `
    <div class="form-group"><label>Name</label><input type="text" id="addStaffName" placeholder="Full name" /></div>
    <div class="form-group"><label>Role</label>
      <select id="addStaffRole">
        <option value="teacher">Teacher</option>
        <option value="staff">Staff</option>
      </select>
    </div>
    <div class="form-group"><label>Designation</label>
      <select id="addStaffDesignation">${designationOptions}</select>
    </div>
    <div class="form-group" id="addSubjectGroup" style="display:none;">
      <label>Subject</label>
      <select id="addStaffSubject">${subjectOptions}</select>
    </div>
    <div class="form-group"><label>Email</label><input type="email" id="addStaffEmail" placeholder="email@school.com" /></div>
  `, 'Add', async () => {
    const name = document.getElementById('addStaffName').value.trim();
    const role = document.getElementById('addStaffRole').value;
    const designation = document.getElementById('addStaffDesignation').value;
    const subjectEl = document.getElementById('addStaffSubject');
    const subject = subjectEl ? subjectEl.value : 'N/A';
    const email = document.getElementById('addStaffEmail').value.trim();

    if (!name || !email) {
      window.showToast('Please fill all fields', 'error');
      return;
    }

    const employeeId = getNextEmployeeId();

    const newStaff = { name, role, designation, subDepartment: subject, email, employeeId };
    const result = await createData('teachers', newStaff);
    window.TEACHERS.push(result);
    window.showToast('Added successfully', 'success');
    renderStaff();
    if (window.renderDashboard) window.renderDashboard();
    window.closeModal();
  });

  // Conditional logic for Subject Teacher
  setTimeout(() => {
    const designSelect = document.getElementById('addStaffDesignation');
    const subjectGroup = document.getElementById('addSubjectGroup');
    if (designSelect && subjectGroup) {
      designSelect.addEventListener('change', function() {
        subjectGroup.style.display = this.value === 'Subject Teacher' ? 'block' : 'none';
      });
      subjectGroup.style.display = designSelect.value === 'Subject Teacher' ? 'block' : 'none';
    }
  }, 50);
}

// ============================================================
// EDIT STAFF
// ============================================================

async function editStaff(id) {
  const staff = window.TEACHERS.find(t => t.id === id);
  if (!staff) return;

  const designationOptions = ['Principal', 'Head Master', 'Assistant Teacher', 'Subject Teacher', 'Administration', 'Staff', 'Peon']
    .map(d => `<option value="${d}" ${d === staff.designation ? 'selected' : ''}>${d}</option>`).join('');
  const subjectOptions = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Physical Education', 'Arts', 'Music', 'N/A']
    .map(s => `<option value="${s}" ${s === staff.subDepartment ? 'selected' : ''}>${s}</option>`).join('');

  window.openModal('Edit Teacher / Staff', `
    <div class="form-group"><label>Name</label><input type="text" id="editStaffName" value="${staff.name}" /></div>
    <div class="form-group"><label>Role</label>
      <select id="editStaffRole">
        <option value="teacher" ${staff.role === 'teacher' ? 'selected' : ''}>Teacher</option>
        <option value="staff" ${staff.role === 'staff' ? 'selected' : ''}>Staff</option>
      </select>
    </div>
    <div class="form-group"><label>Designation</label>
      <select id="editStaffDesignation">${designationOptions}</select>
    </div>
    <div class="form-group" id="editSubjectGroup" style="${staff.designation === 'Subject Teacher' ? 'display:block;' : 'display:none;'}">
      <label>Subject</label>
      <select id="editStaffSubject">${subjectOptions}</select>
    </div>
    <div class="form-group"><label>Email</label><input type="email" id="editStaffEmail" value="${staff.email}" /></div>
  `, 'Update', async () => {
    const name = document.getElementById('editStaffName').value.trim();
    const role = document.getElementById('editStaffRole').value;
    const designation = document.getElementById('editStaffDesignation').value;
    const subject = document.getElementById('editStaffSubject') ? document.getElementById('editStaffSubject').value : 'N/A';
    const email = document.getElementById('editStaffEmail').value.trim();

    if (!name || !email) {
      window.showToast('Please fill all fields', 'error');
      return;
    }

    // Employee ID is preserved – do not change it
    const updated = { name, role, designation, subDepartment: subject, email };
    await updateData('teachers', id, updated);
    const idx = window.TEACHERS.findIndex(t => t.id === id);
    if (idx !== -1) window.TEACHERS[idx] = { ...window.TEACHERS[idx], ...updated };
    window.showToast('Updated successfully', 'success');
    renderStaff();
    if (window.renderDashboard) window.renderDashboard();
    window.closeModal();
  });

  setTimeout(() => {
    const designSelect = document.getElementById('editStaffDesignation');
    const subjectGroup = document.getElementById('editSubjectGroup');
    if (designSelect && subjectGroup) {
      designSelect.addEventListener('change', function() {
        subjectGroup.style.display = this.value === 'Subject Teacher' ? 'block' : 'none';
      });
      subjectGroup.style.display = designSelect.value === 'Subject Teacher' ? 'block' : 'none';
    }
  }, 50);
}

// ============================================================
// DELETE STAFF
// ============================================================

async function deleteStaff(id) {
  if (!confirm('Delete this record?')) return;
  await deleteData('teachers', id);
  window.TEACHERS = window.TEACHERS.filter(t => t.id !== id);
  window.showToast('Deleted', 'success');
  renderStaff();
  if (window.renderDashboard) window.renderDashboard();
}

// ============================================================
// EVENT BINDINGS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addStaffBtn');
  if (addBtn) addBtn.addEventListener('click', showAddStaffModal);

  const searchInput = document.getElementById('staffSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const filter = document.getElementById('staffFilter')?.value || 'all';
      renderStaff(filter, e.target.value);
    });
  }

  const filterSelect = document.getElementById('staffFilter');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      const search = document.getElementById('staffSearch')?.value || '';
      renderStaff(e.target.value, search);
    });
  }
});

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderStaff = renderStaff;
window.showAddStaffModal = showAddStaffModal;
window.editStaff = editStaff;
window.deleteStaff = deleteStaff;
window.migrateEmployeeIds = migrateEmployeeIds;
