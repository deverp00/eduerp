// ============================================================
// LOGIN MODULE – Admin Authentication Overlay
// ============================================================

import {
  loginAdmin,
  getCurrentUser,
  sendPasswordReset,
  logoutAdmin
} from './firebase.js';

// ============================================================
// SESSION SETTINGS
// ============================================================

const INACTIVITY_LIMIT = 10 * 60 * 1000;
const WARNING_TIME = 9 * 60 * 1000;

let inactivityTimer = null;
let warningTimer = null;
let logoutInProgress = false;
let isLogoutModalOpen = false;

// ============================================================
// CREATE LOGIN OVERLAY
// ============================================================

function createLoginOverlay() {
  if (document.getElementById('loginOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'loginOverlay';

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const card = document.createElement('div');

  card.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 2.5rem;
    max-width: 400px;
    width: 94%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  `;

  card.innerHTML = `
    <div style="text-align:center;margin-bottom:1.5rem;">
      <div style="display:flex;align-items:center;justify-content:center;gap:.5rem;margin-bottom:.5rem;">
        <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="8" fill="#3b82f6"/>
          <rect x="8" y="8" width="20" height="20" rx="4" fill="white"/>
          <path d="M14 14H22V16H14V14ZM14 18H20V20H14V18ZM14 22H18V24H14V22Z" fill="#3b82f6"/>
        </svg>

        <span style="font-size:1.5rem;font-weight:700;color:#0f172a;">
          Hawaipur HS School
        </span>
      </div>

      <p style="color:#64748b;font-size:.9rem;margin:0;">
        Admin Login
      </p>
    </div>

    <div style="margin-bottom:1rem;">
      <label style="display:block;font-weight:500;font-size:.875rem;color:#475569;margin-bottom:.25rem;">
        Email
      </label>

      <input
        type="email"
        id="loginEmail"
        placeholder="admin@school.com"
        autocomplete="username"
        style="width:100%;padding:.5rem .75rem;border:1px solid #e2e8f0;border-radius:8px;font-size:.875rem;box-sizing:border-box;"
      />
    </div>

    <div style="margin-bottom:.5rem;">
      <label style="display:block;font-weight:500;font-size:.875rem;color:#475569;margin-bottom:.25rem;">
        Password
      </label>

      <input
        type="password"
        id="loginPassword"
        placeholder="••••••••"
        autocomplete="current-password"
        style="width:100%;padding:.5rem .75rem;border:1px solid #e2e8f0;border-radius:8px;font-size:.875rem;box-sizing:border-box;"
      />
    </div>

    <div style="text-align:right;margin-bottom:1rem;">
      <button
        id="forgotPasswordBtn"
        type="button"
        style="background:none;border:none;color:#3b82f6;font-size:.8rem;cursor:pointer;"
      >
        Forgot Password?
      </button>
    </div>

    <button
      id="loginBtn"
      class="btn btn-primary"
      type="button"
      style="width:100%;justify-content:center;padding:.6rem;font-size:1rem;"
    >
      <span id="loginBtnText">Login</span>

      <span id="loginBtnSpinner" style="display:none;">
        <span
          class="loading-spinner"
          style="width:20px;height:20px;border-width:3px;"
        ></span>
      </span>
    </button>

    <div style="text-align:center;margin-top:.75rem;font-size:.8rem;color:#64748b;">
      Developed by
      <a
        href="https://yadav150.github.io/y-p/index.html"
        target="_blank"
        rel="noopener noreferrer"
        style="color:#3b82f6;text-decoration:none;"
      >
        Yadav Web Technologies
      </a>
    </div>

    <div
      id="loginError"
      style="color:#ef4444;font-size:.85rem;text-align:center;margin-top:.75rem;display:none;"
    ></div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  setTimeout(() => {
    document.getElementById('loginEmail')?.focus();
  }, 100);

  document.getElementById('loginPassword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  document.getElementById('loginEmail')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('loginPassword')?.focus();
    }
  });

  document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
  document.getElementById('forgotPasswordBtn')?.addEventListener('click', handleForgotPassword);
}

// ============================================================
// HANDLE LOGIN
// ============================================================

async function handleLogin() {
  const emailEl = document.getElementById('loginEmail');
  const passwordEl = document.getElementById('loginPassword');
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  const btnText = document.getElementById('loginBtnText');
  const btnSpinner = document.getElementById('loginBtnSpinner');

  if (!emailEl || !passwordEl || !errorEl || !btn) return;

  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  errorEl.style.display = 'none';
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Please enter your User ID and Password.';
    errorEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  if (btnText) btnText.style.display = 'none';
  if (btnSpinner) btnSpinner.style.display = 'inline-block';

  try {
    await loginAdmin(email, password);

    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.remove();

    // Show Settings link in sidebar
    if (window.showSettingsLink) window.showSettingsLink(true);

    startInactivityMonitoring();
    setupLogoutButton();

    window.showToast?.('Login successful!', 'success');

    await window.loadAllData?.();
    await window.initSettings?.(); // ensure settings are loaded
    window.navigateTo?.('dashboard');

  } catch (error) {
    console.error('Login error:', error);

    let message = 'Invalid User ID or Password.';
    if (error?.code === 'auth/too-many-requests') {
      message = 'Too many login attempts. Please try again later.';
    } else if (error?.code === 'auth/network-request-failed') {
      message = 'Network error. Please check your internet connection.';
    } else if (error?.code === 'auth/unauthorized-admin') {
      message = 'Invalid User ID or Password.';
    }

    errorEl.textContent = message;
    errorEl.style.display = 'block';

  } finally {
    btn.disabled = false;
    if (btnText) btnText.style.display = 'inline';
    if (btnSpinner) btnSpinner.style.display = 'none';
  }
}

// ============================================================
// FORGOT PASSWORD
// ============================================================

async function handleForgotPassword() {
  const emailEl = document.getElementById('loginEmail');
  const passwordEl = document.getElementById('loginPassword');
  const errorEl = document.getElementById('loginError');

  if (!emailEl || !errorEl) return;

  const email = emailEl.value.trim();

  errorEl.style.display = 'none';
  errorEl.textContent = '';

  if (!email) {
    errorEl.textContent = 'Please enter your email address.';
    errorEl.style.display = 'block';
    return;
  }

  try {
    await sendPasswordReset(email);
    window.showToast?.('Password reset email sent. Check your inbox.', 'success');
    emailEl.value = '';
    if (passwordEl) passwordEl.value = '';
  } catch (error) {
    console.error('Password reset error:', error);
    errorEl.textContent = 'Unable to send reset email. Please try again.';
    errorEl.style.display = 'block';
  }
}

// ============================================================
// INACTIVITY MONITORING (unchanged)
// ============================================================

function startInactivityMonitoring() {
  stopInactivityMonitoring();
  resetInactivityTimer();
  const activityEvents = ['mousemove','mousedown','keydown','touchstart','scroll','click'];
  activityEvents.forEach((eventName) => {
    document.addEventListener(eventName, handleUserActivity, { passive: true });
  });
  window.__erpActivityEvents = activityEvents;
}

function stopInactivityMonitoring() {
  clearTimeout(inactivityTimer);
  clearTimeout(warningTimer);
  inactivityTimer = null;
  warningTimer = null;
  if (window.__erpActivityEvents) {
    window.__erpActivityEvents.forEach((eventName) => {
      document.removeEventListener(eventName, handleUserActivity);
    });
    window.__erpActivityEvents = null;
  }
}

function handleUserActivity() {
  if (logoutInProgress || isLogoutModalOpen) return;
  const warning = document.getElementById('inactivityWarning');
  if (warning) warning.remove();
  resetInactivityTimer();
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  clearTimeout(warningTimer);
  warningTimer = setTimeout(() => showInactivityWarning(), WARNING_TIME);
  inactivityTimer = setTimeout(() => handleAutomaticLogout(), INACTIVITY_LIMIT);
}

function showInactivityWarning() {
  if (document.getElementById('inactivityWarning')) return;
  const warning = document.createElement('div');
  warning.id = 'inactivityWarning';
  warning.style.cssText = `
    position:fixed; left:50%; top:20px; transform:translateX(-50%);
    z-index:10001; background:white; border:1px solid #e2e8f0;
    border-radius:8px; padding:1rem 1.25rem;
    box-shadow:0 10px 30px rgba(0,0,0,.15); max-width:90%; text-align:center;
  `;
  warning.innerHTML = `
    <div style="font-weight:600;color:#0f172a;margin-bottom:.35rem;">Session Expiring</div>
    <div style="font-size:.85rem;color:#64748b;margin-bottom:.75rem;">
      You have been inactive for 9 minutes. You will be logged out in 1 minute.
    </div>
    <button id="stayLoggedInBtn" class="btn btn-primary" type="button" style="padding:.45rem .9rem;">
      Stay Logged In
    </button>
  `;
  document.body.appendChild(warning);
  document.getElementById('stayLoggedInBtn')?.addEventListener('click', () => {
    warning.remove();
    resetInactivityTimer();
  });
}

async function handleAutomaticLogout() {
  if (logoutInProgress || isLogoutModalOpen) return;
  logoutInProgress = true;
  stopInactivityMonitoring();
  const warning = document.getElementById('inactivityWarning');
  if (warning) warning.remove();
  try {
    await logoutAdmin();
  } catch (error) {
    console.error('Automatic logout error:', error);
  } finally {
    logoutInProgress = false;
    showLoggedOutState();
    window.showToast?.('You have been logged out due to inactivity.', 'info');
    if (window.showSettingsLink) window.showSettingsLink(false);
  }
}

// ============================================================
// LOGOUT CONFIRMATION (unchanged)
// ============================================================

function showLogoutConfirmation() {
  if (document.getElementById('logoutConfirmOverlay')) return;
  isLogoutModalOpen = true;
  stopInactivityMonitoring();

  const overlay = document.createElement('div');
  overlay.id = 'logoutConfirmOverlay';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,.5); backdrop-filter:blur(5px);
    z-index:10000; display:flex; align-items:center; justify-content:center;
  `;
  const modal = document.createElement('div');
  modal.style.cssText = `
    background:white; width:92%; max-width:380px; border-radius:10px;
    padding:1.5rem; box-shadow:0 20px 60px rgba(0,0,0,.25);
  `;
  modal.innerHTML = `
    <div style="margin-bottom:1.25rem;">
      <h3 style="margin:0 0 .5rem;color:#0f172a;font-size:1.15rem;">Confirm Logout</h3>
      <p style="margin:0;color:#64748b;font-size:.9rem;">Are you sure you want to log out?</p>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:.75rem;">
      <button id="cancelLogoutBtn" class="btn" type="button" style="padding:.5rem 1rem;">Cancel</button>
      <button id="confirmLogoutBtn" class="btn btn-primary" type="button" style="padding:.5rem 1rem;">
        <span id="confirmLogoutText">Log Out</span>
        <span id="confirmLogoutSpinner" style="display:none;">
          <span class="loading-spinner" style="width:18px;height:18px;border-width:3px;"></span>
        </span>
      </button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('cancelLogoutBtn')?.addEventListener('click', () => {
    overlay.remove();
    isLogoutModalOpen = false;
    if (!logoutInProgress) startInactivityMonitoring();
  });

  document.getElementById('confirmLogoutBtn')?.addEventListener('click', handleManualLogout);
}

async function handleManualLogout() {
  if (logoutInProgress) return;
  logoutInProgress = true;
  isLogoutModalOpen = false;
  const confirmBtn = document.getElementById('confirmLogoutBtn');
  const confirmText = document.getElementById('confirmLogoutText');
  const spinner = document.getElementById('confirmLogoutSpinner');
  if (confirmBtn) confirmBtn.disabled = true;
  if (confirmText) confirmText.style.display = 'none';
  if (spinner) spinner.style.display = 'inline-block';

  stopInactivityMonitoring();

  try {
    await logoutAdmin();
    showLoggedOutState();
    window.showToast?.('You have been logged out.', 'success');
    if (window.showSettingsLink) window.showSettingsLink(false);
  } catch (error) {
    console.error('Logout error:', error);
    if (confirmBtn) confirmBtn.disabled = false;
    if (confirmText) confirmText.style.display = 'inline';
    if (spinner) spinner.style.display = 'none';
    startInactivityMonitoring();
    window.showToast?.('Unable to log out. Please try again.', 'error');
  } finally {
    logoutInProgress = false;
  }
}

function showLoggedOutState() {
  const confirmation = document.getElementById('logoutConfirmOverlay');
  if (confirmation) confirmation.remove();
  const warning = document.getElementById('inactivityWarning');
  if (warning) warning.remove();
  const loginOverlay = document.getElementById('loginOverlay');
  if (!loginOverlay) createLoginOverlay();
}

function setupLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;
  if (logoutBtn.dataset.logoutHandlerAttached === 'true') return;
  logoutBtn.dataset.logoutHandlerAttached = 'true';
  logoutBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    showLogoutConfirmation();
  });
}

// ============================================================
// CHECK AUTH ON START
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const user = await getCurrentUser();
  if (!user) {
    createLoginOverlay();
  } else {
    console.log('Already authenticated as:', user.email);
    startInactivityMonitoring();
    setupLogoutButton();
    if (window.showSettingsLink) window.showSettingsLink(true);
  }
});

// ============================================================
// EXTRA LOGIN STYLES
// ============================================================

const style = document.createElement('style');
style.textContent = `
  #loginOverlay input:focus {
    outline:none;
    border-color:#3b82f6 !important;
    box-shadow:0 0 0 3px rgba(59,130,246,.1);
  }
  #loginOverlay button:disabled,
  #logoutConfirmOverlay button:disabled {
    opacity:.7;
    cursor:not-allowed;
  }
`;
document.head.appendChild(style);
