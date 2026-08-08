// ============================================================
// LOGIN MODULE – Admin Authentication Overlay
// ============================================================

import { loginAdmin, getCurrentUser, sendPasswordReset } from './firebase.js';

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
    animation: fadeIn 300ms ease;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 2.5rem;
    max-width: 400px;
    width: 94%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 300ms ease;
  `;

  card.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <svg width="40" height="40" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="32" height="32" rx="8" fill="#3b82f6" />
          <rect x="8" y="8" width="20" height="20" rx="4" fill="white" />
          <path d="M14 14H22V16H14V14ZM14 18H20V20H14V18ZM14 22H18V24H14V22Z" fill="#3b82f6" />
        </svg>
        <span style="font-size: 1.5rem; font-weight: 700; color: #0f172a;">Hawaipur HS School</span>
      </div>
      <p style="color: #64748b; font-size: 0.9rem; margin: 0;">Admin Login</p>
    </div>

    <div class="form-group" style="margin-bottom: 1rem;">
      <label style="display: block; font-weight: 500; font-size: 0.875rem; color: #475569; margin-bottom: 0.25rem;">Email</label>
      <input type="email" id="loginEmail" placeholder="admin@school.com" style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; transition: border-color 300ms;" />
    </div>

    <div class="form-group" style="margin-bottom: 0.5rem;">
      <label style="display: block; font-weight: 500; font-size: 0.875rem; color: #475569; margin-bottom: 0.25rem;">Password</label>
      <input type="password" id="loginPassword" placeholder="••••••••" style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; transition: border-color 300ms;" />
    </div>

    <div style="text-align: right; margin-bottom: 1rem;">
      <button id="forgotPasswordBtn" style="background: none; border: none; color: #3b82f6; font-size: 0.8rem; cursor: pointer; text-decoration: none; transition: text-decoration 0.2s;">
        Forgot Password?
      </button>
    </div>

    <button id="loginBtn" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 0.6rem; font-size: 1rem;">
      <span id="loginBtnText">Login</span>
      <span id="loginBtnSpinner" style="display: none;">
        <span class="loading-spinner" style="width: 20px; height: 20px; border-width: 3px;"></span>
      </span>
    </button>

    <div style="text-align: center; margin-top: 0.75rem; font-size: 0.8rem; color: #64748b;">
      Developed by <a href="https://yadav150.github.io/y-p/index.html" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none; transition: text-decoration 0.2s;">Yadav Web Technologies</a>
    </div>

    <div id="loginError" style="color: #ef4444; font-size: 0.85rem; text-align: center; margin-top: 0.75rem; display: none;"></div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Focus email input
  setTimeout(() => document.getElementById('loginEmail')?.focus(), 100);

  // Enter key support
  document.getElementById('loginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('loginEmail').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('loginPassword').focus();
  });

  // Login button
  document.getElementById('loginBtn').addEventListener('click', handleLogin);

  // Forgot password
  document.getElementById('forgotPasswordBtn').addEventListener('click', handleForgotPassword);

  // Add hover underline effect for links
  const links = card.querySelectorAll('a, #forgotPasswordBtn');
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.style.textDecoration = 'underline';
    });
    link.addEventListener('mouseleave', () => {
      link.style.textDecoration = 'none';
    });
  });
}

// ============================================================
// HANDLE LOGIN
// ============================================================

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  const btnText = document.getElementById('loginBtnText');
  const btnSpinner = document.getElementById('loginBtnSpinner');

  errorEl.style.display = 'none';
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Please enter both email and password.';
    errorEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline-block';

  try {
    await loginAdmin(email, password);
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.remove();
    window.showToast('Login successful!', 'success');
    await window.loadAllData();
    window.navigateTo('dashboard');
  } catch (error) {
    console.error('Login error:', error);
    let message = 'Invalid credentials. Please try again.';
    if (error.code === 'auth/user-not-found') message = 'User not found.';
    else if (error.code === 'auth/wrong-password') message = 'Wrong password.';
    else if (error.code === 'auth/too-many-requests') message = 'Too many attempts. Please wait.';
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
  }
}

// ============================================================
// HANDLE FORGOT PASSWORD
// ============================================================

async function handleForgotPassword() {
  const email = document.getElementById('loginEmail').value.trim();
  const errorEl = document.getElementById('loginError');

  errorEl.style.display = 'none';
  errorEl.textContent = '';

  if (!email) {
    errorEl.textContent = 'Please enter your email address.';
    errorEl.style.display = 'block';
    return;
  }

  try {
    await sendPasswordReset(email);
    window.showToast('Password reset email sent. Check your inbox.', 'success');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
  } catch (error) {
    console.error('Password reset error:', error);
    let message = 'Unable to send reset email. Please try again.';
    if (error.code === 'auth/user-not-found') message = 'No account found with this email.';
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

// ============================================================
// CHECK AUTH ON START
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const user = await getCurrentUser();
  if (!user) {
    createLoginOverlay();
  } else {
    console.log('Already authenticated as:', user.email);
  }
});

// ============================================================
// EXTRA STYLES FOR LOGIN
// ============================================================

const style = document.createElement('style');
style.textContent = `
  #loginOverlay input:focus {
    outline: none;
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;
document.head.appendChild(style);
