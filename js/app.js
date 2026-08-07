// ============================================================
// CORE APPLICATION – Navigation, Modal, Toast, Loading, Data
// ============================================================

import { getCurrentUser, getAllData, logoutAdmin } from './firebase.js';

// ============================================================
// DOM REFS
// ============================================================

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuToggle = document.getElementById('menuToggle');
const sidebarClose = document.getElementById('sidebarClose');
const pageTitle = document.getElementById('pageTitle');
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');
const toastContainer = document.getElementById('toastContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const notificationBtn = document.getElementById('notificationBtn');
const badgeDot = document.querySelector('.badge-dot');
const logoutBtn = document.getElementById('logoutBtn');

let currentPage = 'dashboard';
let modalCallback = null;

// ============================================================
// TOAST & LOADING
// ============================================================

function showLoading(show = true) {
  loadingOverlay.classList.toggle('active', show);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================
// MODAL
// ============================================================

function openModal(title, bodyHTML, confirmText = 'Confirm', callback) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalConfirm.textContent = confirmText;
  modalCallback = callback;
  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
  modalCallback = null;
}

// ============================================================
// NAVIGATION
// ============================================================

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('active');
  });
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

      const titles = {
        dashboard: 'Dashboard',
        students: 'Students',
        teachers: 'Teachers & Staff',
        fees: 'Fee Management',
        salary: 'Salary',
        analytics: 'Reports & Analytics',
        attendance: 'Attendance',
    };
  const title = titles[page] || 'Dashboard';
  pageTitle.textContent = title;
  document.title = `SchoolERP | ${title}`;

      switch (page) {
        case 'dashboard': if (window.renderDashboard) window.renderDashboard(); break;
        case 'students': if (window.renderStudents) window.renderStudents(); break;
        case 'teachers': if (window.renderStaff) window.renderStaff(); break;
        case 'fees': if (window.renderFees) { window.renderFees(); if (window.initFeeModule) window.initFeeModule(); } break;
        case 'salary': if (window.renderSalary) window.renderSalary(); break;
        case 'analytics': if (window.renderAnalytics) window.renderAnalytics(); break;
        case 'attendance': if (window.renderAttendance) window.renderAttendance(); break;
        default: break;
    }

  if (window.innerWidth < 1024) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
}

// ============================================================
// SIDEBAR EVENTS
// ============================================================

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
});

sidebarClose.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    navigateTo(page);
  });
});

// ============================================================
// MODAL EVENTS
// ============================================================

modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
modalConfirm.addEventListener('click', () => {
  if (modalCallback) modalCallback();
});

// ============================================================
// NOTIFICATION (placeholder)
// ============================================================

if (notificationBtn) {
  notificationBtn.addEventListener('click', () => {
    showToast('No new notifications', 'info');
  });
}

// Hide badge initially (no notifications)
if (badgeDot) {
  badgeDot.style.display = 'none';
}

// ============================================================
// LOGOUT HANDLER
// ============================================================

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await logoutAdmin();
      showToast('Logged out successfully.', 'success');
      // Reload the page to trigger the login overlay from login.js
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed. Please try again.', 'error');
    }
  });
}

// ============================================================
// GLOBAL DATA STORES
// ============================================================

window.STUDENTS = [];
window.TEACHERS = [];
window.FEE_RECORDS = [];
window.SALARY_RECORDS = [];
window.PAYMENTS = [];
window.ACTIVITIES = [];

// ============================================================
// LOAD DATA FROM FIREBASE
// ============================================================

async function loadAllData() {
  try {
    const [students, teachers, fees, salary, payments, activities] = await Promise.all([
      getAllData('students'),
      getAllData('teachers'),
      getAllData('feeRecords'),
      getAllData('salaryRecords'),
      getAllData('payments'),
      getAllData('activities'),
    ]);
    window.STUDENTS = students;
    window.TEACHERS = teachers;
    window.FEE_RECORDS = fees;
    window.SALARY_RECORDS = salary;
    window.PAYMENTS = payments;
    window.ACTIVITIES = activities;
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('Error loading data from Firebase', 'error');
  }
}

// ============================================================
// INIT – Check Auth & Load Data, then Navigate
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);

  const user = await getCurrentUser();
  if (!user) {
    console.warn('No authenticated user. Firebase rules may block reads/writes.');
    showToast('Please log in as admin to use the system.', 'info');
  } else {
    console.log('Authenticated as:', user.email);
  }

  await loadAllData();
  // Migrate existing teachers to have Employee IDs
if (window.migrateEmployeeIds) {
  await window.migrateEmployeeIds();
}
  showLoading(false);
  navigateTo('dashboard');
});

// ============================================================
// EXPOSE GLOBAL FUNCTIONS
// ============================================================

window.showToast = showToast;
window.showLoading = showLoading;
window.openModal = openModal;
window.closeModal = closeModal;
window.navigateTo = navigateTo;
window.loadAllData = loadAllData;
