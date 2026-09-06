// ============================================================
// STUDENTS MODULE – CRUD, Render, Search, Filters
// ============================================================

import { createData, updateData, deleteData } from './firebase.js';

// ============================================================
// RENDER STUDENTS TABLE + STATS
// ============================================================

function renderStudents(filter = 'all', search = '') {
  const students = window.STUDENTS || [];
  const totalStudents = students.length;
  const paidCount = students.filter(s => s.feeStatus === 'paid').length;
  const pendingCount = students.filter(s => s.feeStatus === 'pending').length;
  const overdueCount = students.filter(s => s.feeStatus === 'overdue').length;

  const statsGrid = document.getElementById('studentStatsGrid');
  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card"><span class="stat-label">Total Students</span><span class="stat-value">${totalStudents}</span></div>
      <div class="stat-card"><span class="stat-label">Fee Paid</span><span class="stat-value">${paidCount}</span></div>
      <div class="stat-card"><span class="stat-label">Fee Pending</span><span class="stat-value">${pendingCount}</span></div>
      <div class="stat-card"><span class="stat-label">Overdue</span><span class="stat-value">${overdueCount}</span></div>
    `;
  }

  let list = students;
  if (filter !== 'all') {
    list = list.filter(s => s.class === parseInt(filter));
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(s => s.name.toLowerCase().includes(q));
  }

  const tbody = document.getElementById('studentTableBody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--gray-500); padding:2rem;">No students found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((s, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${s.name}</td>
      <td>${s.class}</td>
      <td>${s.section}</td>
      <td>${s.roll}</td>
      <td><span class="status-badge status-${s.feeStatus}">${s.feeStatus}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-edit" data-id="${s.id}" data-action="editStudent">Edit</button>
          <button class="btn-delete" data-id="${s.id}" data-action="deleteStudent">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="editStudent"]').forEach(btn => {
    btn.addEventListener('click', () => editStudent(btn.dataset.id));
  });
  tbody.querySelectorAll('[data-action="deleteStudent"]').forEach(btn => {
    btn.addEventListener('click', () => deleteStudent(btn.dataset.id));
  });
}

// ============================================================
// ADD STUDENT – Navigate to full-page form
// ============================================================

function showAddStudentModal() {
  window.navigateTo('add-student');
}

// ============================================================
// SUBMIT HANDLER FOR THE FULL-PAGE ADD FORM
// ============================================================

function setupAddStudentForm() {
  const submitBtn = document.getElementById('addStudentSubmitBtn');
  if (!submitBtn) return;

  // Populate class and section options from settings
  const classSelect = document.getElementById('addStudentClass');
  const sectionSelect = document.getElementById('addStudentSection');
  if (classSelect) {
    const settings = window.SETTINGS || {};
    const classOptions = settings.studentClassOptions || [1,2,3,4,5,6,7,8,9,10];
    classSelect.innerHTML = classOptions.map(c => `<option value="${c}">Class ${c}</option>`).join('');
  }
  if (sectionSelect) {
    const settings = window.SETTINGS || {};
    const sectionOptions = settings.studentSectionOptions || ['A','B','C','NA'];
    sectionSelect.innerHTML = sectionOptions.map(sec => `<option value="${sec}">${sec}</option>`).join('');
  }

  submitBtn.addEventListener('click', async function() {
    const name = document.getElementById('addStudentName').value.trim();
    const classVal = parseInt(document.getElementById('addStudentClass').value);
    const section = document.getElementById('addStudentSection').value;
    const roll = parseInt(document.getElementById('addStudentRoll').value);
    const feeStatus = document.getElementById('addStudentFeeStatus').value;
    const admissionNo = document.getElementById('addStudentAdmission').value.trim();
    const mobile = document.getElementById('addStudentMobile').value.trim();
    const guardian = document.getElementById('addStudentGuardian').value.trim();

    if (!name || !classVal || !roll) {
      window.showToast('Please fill all required fields (Name, Class, Roll No)', 'error');
      return;
    }

    const settings = window.SETTINGS || {};
    const prefix = settings.studentIdPrefix || 'STU';
    const random = Math.floor(1000 + Math.random() * 9000);
    let studentId = `${prefix}-${random}`;
    // simple duplicate check
    const isDuplicate = window.STUDENTS.some(s => s.studentId === studentId);
    if (isDuplicate) {
      const newRandom = Math.floor(1000 + Math.random() * 9000);
      studentId = `${prefix}-${newRandom}`;
    }

    const newStudent = {
      name,
      class: classVal,
      section,
      roll,
      feeStatus,
      admissionNo: admissionNo || (settings.admissionNoPrefix || 'ADM') + String(Date.now()).slice(-6),
      studentId,
      mobile: mobile || '',
      guardian: guardian || '',
      photo: ''
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
      const result = await createData('students', newStudent);
      window.STUDENTS.push(result);
      window.showToast('Student added successfully', 'success');
      window.navigateTo('students');
    } catch (error) {
      console.error('Add student error:', error);
      window.showToast('Failed to add student. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Student';
    }
  });
}

// ============================================================
// EDIT STUDENT (unchanged, still uses modal)
// ============================================================

async function editStudent(id) {
  const student = window.STUDENTS.find(s => s.id === id);
  if (!student) return;

  const settings = window.SETTINGS || {};
  const classOptions = (settings.studentClassOptions || [1,2,3,4,5,6,7,8,9,10])
    .map(c => `<option value="${c}" ${c === student.class ? 'selected' : ''}>Class ${c}</option>`).join('');
  const sectionOptions = (settings.studentSectionOptions || ['A','B','C','NA'])
    .map(sec => `<option value="${sec}" ${sec === student.section ? 'selected' : ''}>${sec}</option>`).join('');

  window.openModal('Edit Student', `
    <div class="form-group"><label>Name</label><input type="text" id="editStudentName" value="${student.name}" /></div>
    <div class="form-group"><label>Class</label><select id="editStudentClass">${classOptions}</select></div>
    <div class="form-group"><label>Section</label><select id="editStudentSection">${sectionOptions}</select></div>
    <div class="form-group"><label>Roll No</label><input type="number" id="editStudentRoll" value="${student.roll}" /></div>
    <div class="form-group"><label>Fee Status</label>
      <select id="editStudentFeeStatus">
        <option value="paid" ${student.feeStatus === 'paid' ? 'selected' : ''}>Paid</option>
        <option value="pending" ${student.feeStatus === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="overdue" ${student.feeStatus === 'overdue' ? 'selected' : ''}>Overdue</option>
      </select>
    </div>
    <div class="form-group"><label>Admission No</label><input type="text" id="editStudentAdmission" value="${student.admissionNo || ''}" /></div>
    <div class="form-group"><label>Mobile</label><input type="text" id="editStudentMobile" value="${student.mobile || ''}" /></div>
    <div class="form-group"><label>Guardian</label><input type="text" id="editStudentGuardian" value="${student.guardian || ''}" /></div>
  `, 'Update', async () => {
    const name = document.getElementById('editStudentName').value.trim();
    const classVal = parseInt(document.getElementById('editStudentClass').value);
    const section = document.getElementById('editStudentSection').value;
    const roll = parseInt(document.getElementById('editStudentRoll').value);
    const feeStatus = document.getElementById('editStudentFeeStatus').value;
    const admissionNo = document.getElementById('editStudentAdmission').value.trim();
    const mobile = document.getElementById('editStudentMobile').value.trim();
    const guardian = document.getElementById('editStudentGuardian').value.trim();

    if (!name || !classVal || !roll) {
      window.showToast('Please fill all required fields', 'error');
      return;
    }

    const updated = {
      name,
      class: classVal,
      section,
      roll,
      feeStatus,
      admissionNo: admissionNo || student.admissionNo,
      studentId: student.studentId || `${settings.studentIdPrefix || 'STU'}-${Math.floor(1000 + Math.random() * 9000)}`,
      mobile: mobile || '',
      guardian: guardian || '',
      photo: student.photo || ''
    };

    const btn = document.querySelector('#modal .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

    try {
      await updateData('students', id, updated);
      const idx = window.STUDENTS.findIndex(s => s.id === id);
      if (idx !== -1) window.STUDENTS[idx] = { ...window.STUDENTS[idx], ...updated };
      window.showToast('Student updated successfully', 'success');
      renderStudents();
      if (window.renderDashboard) window.renderDashboard();
      window.closeModal();
    } catch (error) {
      console.error('Update student error:', error);
      window.showToast('Failed to update student. Please try again.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Update'; }
    }
  });
}

// ============================================================
// DELETE STUDENT
// ============================================================

async function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student?')) return;
  const btn = document.querySelector(`button[data-id="${id}"][data-action="deleteStudent"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Deleting...'; }
  try {
    await deleteData('students', id);
    window.STUDENTS = window.STUDENTS.filter(s => s.id !== id);
    window.showToast('Student deleted', 'success');
    renderStudents();
    if (window.renderDashboard) window.renderDashboard();
  } catch (error) {
    console.error('Delete student error:', error);
    window.showToast('Failed to delete student. Please try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Delete'; }
  }
}

// ============================================================
// MIGRATION: ADD STUDENT IDs
// ============================================================

async function migrateStudentIds() {
  const students = window.STUDENTS || [];
  let updatedCount = 0;
  const settings = window.SETTINGS || {};
  const prefix = settings.studentIdPrefix || 'STU';

  for (const student of students) {
    if (student.studentId) continue;
    const random = Math.floor(1000 + Math.random() * 9000);
    let studentId = `${prefix}-${random}`;
    const isDuplicate = students.some(s => s.studentId === studentId);
    if (isDuplicate) {
      const newRandom = Math.floor(1000 + Math.random() * 9000);
      studentId = `${prefix}-${newRandom}`;
    }
    try {
      await updateData('students', student.id, { studentId });
      student.studentId = studentId;
      updatedCount++;
    } catch (error) {
      console.error(`Failed to migrate student ${student.name}:`, error);
    }
  }
  if (updatedCount > 0) console.log(`${updatedCount} students updated with Student IDs.`);
  return updatedCount;
}

// ============================================================
// EVENT BINDINGS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addStudentBtn');
  if (addBtn) addBtn.addEventListener('click', showAddStudentModal);

  const searchInput = document.getElementById('studentSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const filter = document.getElementById('studentFilter')?.value || 'all';
      renderStudents(filter, e.target.value);
    });
  }

  const filterSelect = document.getElementById('studentFilter');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      const search = document.getElementById('studentSearch')?.value || '';
      renderStudents(e.target.value, search);
    });
  }

  setupAddStudentForm();
});

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderStudents = renderStudents;
window.showAddStudentModal = showAddStudentModal;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.migrateStudentIds = migrateStudentIds;
