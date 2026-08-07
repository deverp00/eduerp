// ============================================================
// ATTENDANCE MODULE
// ============================================================

import { createData, updateData, deleteData, getAllData } from './firebase.js';

let currentAttendanceData = {}; // key: studentId, value: status
let currentStudents = [];
let currentClass = '';
let currentSection = '';
let currentDate = '';

// ============================================================
// RENDER ATTENDANCE
// ============================================================

async function renderAttendance() {
    const classVal = document.getElementById('attendanceClass')?.value || 'all';
    const sectionVal = document.getElementById('attendanceSection')?.value || 'all';
    const dateVal = document.getElementById('attendanceDate')?.value || new Date().toISOString().split('T')[0];

    if (classVal === 'all' || sectionVal === 'all') {
        document.getElementById('attendanceTableBody').innerHTML = `<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--gray-500);">Please select a class and section.</td></tr>`;
        document.getElementById('attendanceSummary').innerHTML = '';
        return;
    }

    currentClass = classVal;
    currentSection = sectionVal;
    currentDate = dateVal;

    // Get students for this class/section
    const students = window.STUDENTS.filter(s => s.class === parseInt(classVal) && s.section === sectionVal);
    currentStudents = students;

    if (students.length === 0) {
        document.getElementById('attendanceTableBody').innerHTML = `<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--gray-500);">No students found for this class/section.</td></tr>`;
        document.getElementById('attendanceSummary').innerHTML = '';
        return;
    }

    // Fetch all attendance records and store globally
    const attendanceRecords = await getAllData('attendance');
    window.ATTENDANCE = attendanceRecords; // ← CRITICAL FIX

    // Filter for current class/section/date
    const filtered = attendanceRecords.filter(r => r.class === parseInt(classVal) && r.section === sectionVal && r.date === dateVal);
    const attendanceMap = {};
    filtered.forEach(r => { attendanceMap[r.studentId] = r.status; });
    currentAttendanceData = attendanceMap;

    // Render table and summary
    renderAttendanceTable(students, attendanceMap);
    renderAttendanceSummary(students, attendanceMap);
}

// ============================================================
// RENDER TABLE
// ============================================================

function renderAttendanceTable(students, attendanceMap) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--gray-500);">No students found.</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map((s, idx) => {
        const status = attendanceMap[s.id] || 'present'; // default present
        const statusClass = status === 'present' ? 'present' : (status === 'absent' ? 'absent' : 'late');
        return `
        <tr>
            <td>${idx + 1}</td>
            <td>${s.name}</td>
            <td>
                <button class="status-badge ${statusClass}" data-student-id="${s.id}" data-status="${status}">${status}</button>
            </td>
        </tr>
        `;
    }).join('');

    // Attach click listeners for status toggle
    tbody.querySelectorAll('.status-badge').forEach(btn => {
        btn.addEventListener('click', async function() {
            const studentId = this.dataset.studentId;
            const currentStatus = this.dataset.status;
            // Cycle: present → absent → late → present
            let newStatus = '';
            if (currentStatus === 'present') newStatus = 'absent';
            else if (currentStatus === 'absent') newStatus = 'late';
            else if (currentStatus === 'late') newStatus = 'present';
            // Update UI instantly
            this.dataset.status = newStatus;
            this.className = `status-badge ${newStatus}`;
            this.textContent = newStatus;
            // Update local map
            currentAttendanceData[studentId] = newStatus;
            // Auto-save to Firebase
            await saveAttendance(studentId, newStatus);
            // Update summary
            renderAttendanceSummary(currentStudents, currentAttendanceData);
        });
    });
}

// ============================================================
// SAVE ATTENDANCE (with global update)
// ============================================================

async function saveAttendance(studentId, status) {
    const classVal = parseInt(currentClass);
    const sectionVal = currentSection;
    const dateVal = currentDate;
    const session = document.getElementById('attendanceSession')?.value || '2025-26';

    // Ensure window.ATTENDANCE exists
    if (!window.ATTENDANCE) window.ATTENDANCE = [];

    // Check if record exists locally first (to avoid full read)
    let existing = window.ATTENDANCE.find(r => r.class === classVal && r.section === sectionVal && r.date === dateVal && r.studentId === studentId);

    const data = {
        class: classVal,
        section: sectionVal,
        date: dateVal,
        studentId: studentId,
        status: status,
        session: session
    };

    try {
        if (existing) {
            await updateData('attendance', existing.id, data);
            // Update global array
            const idx = window.ATTENDANCE.indexOf(existing);
            window.ATTENDANCE[idx] = { ...data, id: existing.id };
        } else {
            const result = await createData('attendance', data);
            // Add to global array
            window.ATTENDANCE.push({ ...data, id: result.id });
        }
    } catch (error) {
        console.error('Error saving attendance:', error);
        window.showToast('Failed to save attendance. Please try again.', 'error');
        // Optionally revert UI
    }
}

// ============================================================
// SUMMARY
// ============================================================

function renderAttendanceSummary(students, attendanceMap) {
    const total = students.length;
    let present = 0, absent = 0, late = 0;
    students.forEach(s => {
        const status = attendanceMap[s.id] || 'present';
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'late') late++;
    });
    const percent = total ? Math.round((present / total) * 100) : 0;

    document.getElementById('attendanceSummary').innerHTML = `
        <div class="attendance-summary">
            <div class="stat-item"><span class="label">Total</span><span class="value">${total}</span></div>
            <div class="stat-item"><span class="label">Present</span><span class="value present">${present}</span></div>
            <div class="stat-item"><span class="label">Absent</span><span class="value absent">${absent}</span></div>
            <div class="stat-item"><span class="label">Late</span><span class="value late">${late}</span></div>
            <div class="stat-item"><span class="label">Attendance %</span><span class="value">${percent}%</span></div>
        </div>
    `;
}

// ============================================================
// BULK ACTIONS (with loading state)
// ============================================================

async function markAllPresent() {
    const btn = document.querySelector('.attendance-actions button:first-child');
    if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
    for (const s of currentStudents) {
        currentAttendanceData[s.id] = 'present';
        await saveAttendance(s.id, 'present');
    }
    renderAttendanceTable(currentStudents, currentAttendanceData);
    renderAttendanceSummary(currentStudents, currentAttendanceData);
    if (btn) { btn.disabled = false; btn.textContent = 'Mark All Present'; }
}

async function markAllAbsent() {
    const btn = document.querySelector('.attendance-actions button:nth-child(2)');
    if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
    for (const s of currentStudents) {
        currentAttendanceData[s.id] = 'absent';
        await saveAttendance(s.id, 'absent');
    }
    renderAttendanceTable(currentStudents, currentAttendanceData);
    renderAttendanceSummary(currentStudents, currentAttendanceData);
    if (btn) { btn.disabled = false; btn.textContent = 'Mark All Absent'; }
}

async function copyPreviousDay() {
    const btn = document.querySelector('.attendance-actions button:nth-child(3)');
    if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
    const classVal = parseInt(currentClass);
    const sectionVal = currentSection;
    const dateVal = currentDate;
    const today = new Date(dateVal);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Use global window.ATTENDANCE to avoid extra read
    const yesterdayRecords = (window.ATTENDANCE || []).filter(r => r.class === classVal && r.section === sectionVal && r.date === yesterdayStr);

    if (yesterdayRecords.length === 0) {
        window.showToast('No attendance found for previous day.', 'info');
        if (btn) { btn.disabled = false; btn.textContent = 'Copy Previous Day'; }
        return;
    }

    for (const s of currentStudents) {
        const prev = yesterdayRecords.find(r => r.studentId === s.id);
        const status = prev ? prev.status : 'present';
        currentAttendanceData[s.id] = status;
        await saveAttendance(s.id, status);
    }
    renderAttendanceTable(currentStudents, currentAttendanceData);
    renderAttendanceSummary(currentStudents, currentAttendanceData);
    window.showToast('Previous day attendance copied.', 'success');
    if (btn) { btn.disabled = false; btn.textContent = 'Copy Previous Day'; }
}

// ============================================================
// GET TODAY'S ATTENDANCE PERCENTAGE (for Dashboard)
// ============================================================

async function getTodayAttendancePercent() {
    const today = new Date().toISOString().split('T')[0];
    // Use global window.ATTENDANCE if available, else fetch
    let allRecords = window.ATTENDANCE;
    if (!allRecords || allRecords.length === 0) {
        allRecords = await getAllData('attendance');
        window.ATTENDANCE = allRecords;
    }
    const todayRecords = allRecords.filter(r => r.date === today);
    if (todayRecords.length === 0) return 0;
    const present = todayRecords.filter(r => r.status === 'present').length;
    return Math.round((present / todayRecords.length) * 100);
}

// ============================================================
// GET ATTENDANCE TREND (for Analytics)
// ============================================================

async function getAttendanceTrend(days = 7) {
    const trend = [];
    const today = new Date();
    // Use global window.ATTENDANCE if available, else fetch
    let allRecords = window.ATTENDANCE;
    if (!allRecords || allRecords.length === 0) {
        allRecords = await getAllData('attendance');
        window.ATTENDANCE = allRecords;
    }
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayRecords = allRecords.filter(r => r.date === dateStr);
        const total = dayRecords.length;
        const present = dayRecords.filter(r => r.status === 'present').length;
        const percent = total ? Math.round((present / total) * 100) : 0;
        trend.push({ date: dateStr, percent });
    }
    return trend;
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderAttendance = renderAttendance;
window.markAllPresent = markAllPresent;
window.markAllAbsent = markAllAbsent;
window.copyPreviousDay = copyPreviousDay;
window.getTodayAttendancePercent = getTodayAttendancePercent;
window.getAttendanceTrend = getAttendanceTrend;

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    // Auto-load on class/section/date change
    const classSelect = document.getElementById('attendanceClass');
    const sectionSelect = document.getElementById('attendanceSection');
    const dateSelect = document.getElementById('attendanceDate');
    if (classSelect) classSelect.addEventListener('change', renderAttendance);
    if (sectionSelect) sectionSelect.addEventListener('change', renderAttendance);
    if (dateSelect) dateSelect.addEventListener('change', renderAttendance);

    // Initial load will be triggered from app.js navigation
});
