// ============================================================
// TEACHERS & STAFF – CRUD + Render + Conditional Logic
// ============================================================

import { createData, updateData, deleteData } from './firebase.js';

// ============================================================
// RENDER STAFF TABLE + STATS
// ============================================================

function renderStaff(filter = 'all', search = '') {
  const teachers = window.TEACHERS || [];

  // Stats
  const totalTeachers = teachers.filter(t => t.role === 'teacher').length;
  const totalStaff = teachers.filter(t => t.role === 'staff').length;
  const totalEmployees = teachers.length;

  const statsGrid = document.getElementById('staffStatsGrid');
  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card"><span class="stat-label">Total Teachers</span><span class="stat-value">${totalTeachers}</span></div>
      <div class="stat-card"><span class="stat-label">Total Staff</span><span class="stat-value">${totalStaff}</span></div>
      <div class="stat-card"><span class="stat-label">Total Employees</span><span class="stat-value">${totalEmployees}</span></div>
    `;
  }

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
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--gray-500); padding:2rem;">No employees found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((t, idx) => `
    <tr>
      <td>${idx + 1}</td>
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

  // Attach event listeners
  tbody.querySelectorAll('[data-action="editStaff"]').forEach(btn => {
    btn.addEventListener('click', () => editStaff(btn.dataset.id));
  });
  tbody.querySelectorAll('[data-action="deleteStaff"]').forEach(btn => {
    btn.addEventListener('click', () => deleteStaff(btn.dataset.id));
  });
}

// ============================================================
// CONDITIONAL LOGIC HELPER
// ============================================================

function setupStaffConditionalLogic(designationId, subjectGroupId) {
  const designSelect = document.getElementById(designationId);
  const subjectGroup = document.getElementById(subjectGroupId);
  if (designSelect && subjectGroup) {
    const update = () => {
      subjectGroup.style.display = designSelect.value === 'Subject Teacher' ? 'block' : 'none';
    };
    designSelect.addEventListener('change', update);
    // Initial state
    update();
  }
}

// ============================================================
// ADD STAFF – Navigate to full-page form
// ============================================================

function showAddStaffModal() {
  // Redirect to the dedicated add page
  window.navigateTo('add-teacher');
}

// ============================================================
// SUBMIT HANDLER FOR THE FULL-PAGE ADD FORM
// ============================================================

function setupAddStaffForm() {
  const submitBtn = document.getElementById('addStaffSubmitBtn');
  if (!submitBtn) return;

  // Conditional logic for designation → subject group
  const designSelect = document.getElementById('addStaffDesignation');
  const subjectGroup = document.getElementById('addSubjectGroup');
  if (designSelect && subjectGroup) {
    const toggle = () => {
      subjectGroup.style.display = designSelect.value === 'Subject Teacher' ? 'block' : 'none';
    };
    designSelect.addEventListener('change', toggle);
    toggle(); // initial state
  }

  submitBtn.addEventListener('click', async function() {
    const name = document.getElementById('addStaffName').value.trim();
    const role = document.getElementById('addStaffRole').value;
    const designation = document.getElementById('addStaffDesignation').value;
    const subjectEl = document.getElementById('addStaffSubject');
    const subject = subjectEl ? subjectEl.value : 'N/A';
    const email = document.getElementById('addStaffEmail').value.trim();

    // Validate
    if (!name || !email) {
      window.showToast('Please fill all fields', 'error');
      return;
    }
    if (!email.includes('@')) {
      window.showToast('Please enter a valid email address', 'error');
      return;
    }

    // Generate employee ID (duplicate check not needed here as we let migration handle it later)
    const random = Math.floor(1000 + Math.random() * 9000);
    const prefix = role === 'teacher' ? 'TCH' : 'STF';
    let employeeId = `${prefix}-${random}`;
    // Simple duplicate check against existing teachers (just in case)
    const isDuplicate = window.TEACHERS.some(t => t.employeeId === employeeId);
    if (isDuplicate) {
      const newRandom = Math.floor(1000 + Math.random() * 9000);
      employeeId = `${prefix}-${newRandom}`;
    }

    const newStaff = {
      name,
      role,
      designation,
      subDepartment: subject,
      email,
      employeeId
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const result = await createData('teachers', newStaff);
      window.TEACHERS.push(result);
      window.showToast('Added successfully', 'success');
      // Redirect back to teachers page
      window.navigateTo('teachers');
    } catch (error) {
      console.error('Add staff error:', error);
      window.showToast('Failed to add staff. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add';
    }
  });
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

  const modalHTML = `
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
  `;

  window.openModal('Edit Teacher / Staff', modalHTML, 'Update', async () => {
    const name = document.getElementById('editStaffName').value.trim();
    const role = document.getElementById('editStaffRole').value;
    const designation = document.getElementById('editStaffDesignation').value;
    const subject = document.getElementById('editStaffSubject') ? document.getElementById('editStaffSubject').value : 'N/A';
    const email = document.getElementById('editStaffEmail').value.trim();

    if (!name || !email) {
      window.showToast('Please fill all fields', 'error');
      return;
    }
    if (!email.includes('@')) {
      window.showToast('Please enter a valid email address', 'error');
      return;
    }

    const updated = { name, role, designation, subDepartment: subject, email };

    const btn = document.querySelector('#modal .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

    try {
      await updateData('teachers', id, updated);
      const idx = window.TEACHERS.findIndex(t => t.id === id);
      if (idx !== -1) window.TEACHERS[idx] = { ...window.TEACHERS[idx], ...updated };
      window.showToast('Updated successfully', 'success');
      renderStaff();
      if (window.renderDashboard) window.renderDashboard();
      window.closeModal();
    } catch (error) {
      console.error('Update staff error:', error);
      window.showToast('Failed to update staff. Please try again.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Update'; }
    }
  });

  // Conditional logic for edit modal
  setTimeout(() => {
    setupStaffConditionalLogic('editStaffDesignation', 'editSubjectGroup');
  }, 50);
}

// ============================================================
// DELETE STAFF
// ============================================================

async function deleteStaff(id) {
  if (!confirm('Delete this record?')) return;

  const btn = document.querySelector(`button[data-id="${id}"][data-action="deleteStaff"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Deleting...'; }

  try {
    await deleteData('teachers', id);
    window.TEACHERS = window.TEACHERS.filter(t => t.id !== id);
    window.showToast('Deleted', 'success');
    renderStaff();
    if (window.renderDashboard) window.renderDashboard();
  } catch (error) {
    console.error('Delete staff error:', error);
    window.showToast('Failed to delete staff. Please try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Delete'; }
  }
}

// ============================================================
// MIGRATION: ADD EMPLOYEE IDs TO ALL EXISTING STAFF
// ============================================================

async function migrateEmployeeIds() {
  const teachers = window.TEACHERS || [];
  let updatedCount = 0;

  for (const teacher of teachers) {
    if (teacher.employeeId) continue;

    const prefix = teacher.role === 'teacher' ? 'TCH' : 'STF';
    const random = Math.floor(1000 + Math.random() * 9000);
    let employeeId = `${prefix}-${random}`;

    // Check for duplicates in the existing list (just in case)
    const isDuplicate = teachers.some(t => t.employeeId === employeeId);
    if (isDuplicate) {
      const newRandom = Math.floor(1000 + Math.random() * 9000);
      employeeId = `${prefix}-${newRandom}`;
    }

    try {
      await updateData('teachers', teacher.id, { employeeId });
      teacher.employeeId = employeeId;
      updatedCount++;
    } catch (error) {
      console.error(`Failed to migrate employee ${teacher.name}:`, error);
    }
  }

  if (updatedCount > 0) {
    console.log(`✅ ${updatedCount} employees updated with Employee IDs.`);
  }
  return updatedCount;
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

  // Set up the full-page add form submit
  setupAddStaffForm();
});

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderStaff = renderStaff;
window.showAddStaffModal = showAddStaffModal;
window.editStaff = editStaff;
window.deleteStaff = deleteStaff;
window.migrateEmployeeIds = migrateEmployeeIds;
