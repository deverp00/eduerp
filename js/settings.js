// ============================================================
// SETTINGS MODULE – Centralized Configuration
// ============================================================

import { getOneData, setData } from './firebase.js';

// Default settings – used when no settings exist in Firebase
const DEFAULT_SETTINGS = {
  // School / Organization
  schoolName: '[Your School Name]',
  schoolAddress: '[Your School Address, City, State – Pincode]',
  schoolPhone: '[Your Contact Number]',
  schoolEmail: '[Your Email]',
  schoolWebsite: '[Your Website]',
  schoolCode: '[Your School Code]',
  schoolDescription: '',
  academicYear: '2025-26',
  sessionStart: '2025-04-01',
  sessionEnd: '2026-03-31',
  principalName: '',
  affiliation: '',
  registrationNo: '',

  // Student
  studentDefaultFeeStatus: 'pending',
  studentClassOptions: [1,2,3,4,5,6,7,8,9,10],
  studentSectionOptions: ['A','B','C','NA'],
  studentIdPrefix: 'STU',
  admissionNoPrefix: 'ADM',

  // Teacher / Staff
  teacherDesignationOptions: ['Principal','Head Master','Assistant Teacher','Subject Teacher','Administration','Staff','Peon'],
  staffRoleOptions: ['teacher','staff'],
  employeeIdPrefixTeacher: 'TCH',
  employeeIdPrefixStaff: 'STF',

  // Fee
  feeTypeOptions: ['Admission Fee','Monthly Fee','Annual Fee','Examination Fee','Others'],
  feeStatusOptions: ['paid','pending','overdue'],
  feeIdPrefix: 'FEE',
  receiptPrefix: 'RCP',
  paymentIdPrefix: 'PAY',

  // Salary
  salaryStatusOptions: ['paid','pending'],
  salaryPaymentMethodOptions: ['Bank Transfer','Cash','Cheque','Digital Wallet'],
  salaryIdPrefix: 'SAL',

  // Receipt
  receiptFooter: 'This is a system-generated receipt. No signature required.',
  receiptThankYou: 'Thank you for your payment.',

  // General
  currencySymbol: '₹',
  dateFormat: 'dd MMM yyyy',
  numberFormat: 'en-IN',
};

let SETTINGS = {};

// ============================================================
// LOAD SETTINGS FROM FIREBASE
// ============================================================

async function loadSettings() {
  try {
    const data = await getOneData('settings', 'main');
    if (data) {
      SETTINGS = { ...DEFAULT_SETTINGS, ...data };
    } else {
      SETTINGS = { ...DEFAULT_SETTINGS };
      await setData('settings', 'main', SETTINGS);
    }
    window.SETTINGS = SETTINGS;
    return SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    window.showToast('Failed to load settings. Using defaults.', 'error');
    SETTINGS = { ...DEFAULT_SETTINGS };
    window.SETTINGS = SETTINGS;
    return SETTINGS;
  }
}

// ============================================================
// SAVE SETTINGS TO FIREBASE
// ============================================================

async function saveSettingsToFirebase(settings) {
  try {
    await setData('settings', 'main', settings);
    window.showToast('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    window.showToast('Failed to save settings.', 'error');
    throw error;
  }
}

// ============================================================
// RENDER SETTINGS UI
// ============================================================

function renderSettings() {
  const container = document.getElementById('settingsContent');
  if (!container) return;

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'school', label: 'School' },
    { id: 'students', label: 'Students' },
    { id: 'teachers', label: 'Teachers' },
    { id: 'fee', label: 'Fee' },
    { id: 'salary', label: 'Salary' },
    { id: 'receipt', label: 'Receipt' },
    { id: 'format', label: 'Formatting' },
  ];

  let html = `
    <div class="settings-tabs" style="display:flex; gap:0.5rem; flex-wrap:wrap; border-bottom:1px solid var(--gray-200); padding-bottom:0.75rem; margin-bottom:1.5rem;">
      ${tabs.map(t => `<button class="settings-tab btn btn-secondary" data-tab="${t.id}" style="padding:0.4rem 1rem;">${t.label}</button>`).join('')}
    </div>
    <div class="settings-panels">
      ${tabs.map(t => `<div class="settings-panel" id="panel-${t.id}" style="display:none;"></div>`).join('')}
    </div>
    <div style="margin-top:2rem; border-top:1px solid var(--gray-200); padding-top:1.5rem; text-align:right;">
      <button class="btn btn-primary" id="saveSettingsBtn">Save All Settings</button>
    </div>
  `;
  container.innerHTML = html;

  // Populate panels
  populatePanel('general');
  populatePanel('school');
  populatePanel('students');
  populatePanel('teachers');
  populatePanel('fee');
  populatePanel('salary');
  populatePanel('receipt');
  populatePanel('format');

  // Show first tab
  document.querySelector('.settings-tab').click();

  // Tab switching
  document.querySelectorAll('.settings-tab').forEach(btn => {
    btn.addEventListener('click', function() {
      const tab = this.dataset.tab;
      document.querySelectorAll('.settings-panel').forEach(p => p.style.display = 'none');
      document.getElementById(`panel-${tab}`).style.display = 'block';
      document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('btn-primary'));
      this.classList.add('btn-primary');
      this.classList.remove('btn-secondary');
    });
  });

  // Save button
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
}

// ============================================================
// POPULATE PANELS
// ============================================================

function populatePanel(panelId) {
  const panel = document.getElementById(`panel-${panelId}`);
  if (!panel) return;

  const s = SETTINGS;
  let html = '';

  switch (panelId) {
    case 'general':
      html = `
        <div class="settings-group">
          <h3>General Settings</h3>
          <div class="form-group"><label>Academic Year</label><input type="text" id="set_academicYear" value="${s.academicYear}" /></div>
          <div class="form-group"><label>Session Start</label><input type="date" id="set_sessionStart" value="${s.sessionStart}" /></div>
          <div class="form-group"><label>Session End</label><input type="date" id="set_sessionEnd" value="${s.sessionEnd}" /></div>
          <div class="form-group"><label>School Description</label><textarea id="set_schoolDescription" rows="2">${s.schoolDescription}</textarea></div>
          <div class="form-group"><label>Principal Name</label><input type="text" id="set_principalName" value="${s.principalName}" /></div>
          <div class="form-group"><label>Affiliation</label><input type="text" id="set_affiliation" value="${s.affiliation}" /></div>
          <div class="form-group"><label>Registration No.</label><input type="text" id="set_registrationNo" value="${s.registrationNo}" /></div>
        </div>
      `;
      break;

    case 'school':
      html = `
        <div class="settings-group">
          <h3>School Information</h3>
          <div class="form-group"><label>School Name</label><input type="text" id="set_schoolName" value="${s.schoolName}" /></div>
          <div class="form-group"><label>Address</label><textarea id="set_schoolAddress" rows="2">${s.schoolAddress}</textarea></div>
          <div class="form-group"><label>Phone</label><input type="text" id="set_schoolPhone" value="${s.schoolPhone}" /></div>
          <div class="form-group"><label>Email</label><input type="email" id="set_schoolEmail" value="${s.schoolEmail}" /></div>
          <div class="form-group"><label>Website</label><input type="text" id="set_schoolWebsite" value="${s.schoolWebsite}" /></div>
          <div class="form-group"><label>School Code</label><input type="text" id="set_schoolCode" value="${s.schoolCode}" /></div>
        </div>
      `;
      break;

    case 'students':
      html = `
        <div class="settings-group">
          <h3>Student Configuration</h3>
          <div class="form-group"><label>Default Fee Status</label>
            <select id="set_studentDefaultFeeStatus">
              ${['paid','pending','overdue'].map(opt => `<option value="${opt}" ${s.studentDefaultFeeStatus===opt?'selected':''}>${opt}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Student ID Prefix</label><input type="text" id="set_studentIdPrefix" value="${s.studentIdPrefix}" /></div>
          <div class="form-group"><label>Admission No Prefix</label><input type="text" id="set_admissionNoPrefix" value="${s.admissionNoPrefix}" /></div>
          <div class="form-group"><label>Class Options (comma separated)</label><input type="text" id="set_studentClassOptions" value="${s.studentClassOptions.join(',')}" /></div>
          <div class="form-group"><label>Section Options (comma separated)</label><input type="text" id="set_studentSectionOptions" value="${s.studentSectionOptions.join(',')}" /></div>
        </div>
      `;
      break;

    case 'teachers':
      html = `
        <div class="settings-group">
          <h3>Teacher / Staff Configuration</h3>
          <div class="form-group"><label>Designation Options (comma separated)</label><input type="text" id="set_teacherDesignationOptions" value="${s.teacherDesignationOptions.join(',')}" /></div>
          <div class="form-group"><label>Role Options (comma separated)</label><input type="text" id="set_staffRoleOptions" value="${s.staffRoleOptions.join(',')}" /></div>
          <div class="form-group"><label>Employee ID Prefix (Teacher)</label><input type="text" id="set_employeeIdPrefixTeacher" value="${s.employeeIdPrefixTeacher}" /></div>
          <div class="form-group"><label>Employee ID Prefix (Staff)</label><input type="text" id="set_employeeIdPrefixStaff" value="${s.employeeIdPrefixStaff}" /></div>
        </div>
      `;
      break;

    case 'fee':
      html = `
        <div class="settings-group">
          <h3>Fee Configuration</h3>
          <div class="form-group"><label>Fee Type Options (comma separated)</label><input type="text" id="set_feeTypeOptions" value="${s.feeTypeOptions.join(',')}" /></div>
          <div class="form-group"><label>Fee Status Options (comma separated)</label><input type="text" id="set_feeStatusOptions" value="${s.feeStatusOptions.join(',')}" /></div>
          <div class="form-group"><label>Fee ID Prefix</label><input type="text" id="set_feeIdPrefix" value="${s.feeIdPrefix}" /></div>
          <div class="form-group"><label>Receipt Prefix</label><input type="text" id="set_receiptPrefix" value="${s.receiptPrefix}" /></div>
          <div class="form-group"><label>Payment ID Prefix</label><input type="text" id="set_paymentIdPrefix" value="${s.paymentIdPrefix}" /></div>
        </div>
      `;
      break;

    case 'salary':
      html = `
        <div class="settings-group">
          <h3>Salary Configuration</h3>
          <div class="form-group"><label>Salary Status Options (comma separated)</label><input type="text" id="set_salaryStatusOptions" value="${s.salaryStatusOptions.join(',')}" /></div>
          <div class="form-group"><label>Payment Method Options (comma separated)</label><input type="text" id="set_salaryPaymentMethodOptions" value="${s.salaryPaymentMethodOptions.join(',')}" /></div>
          <div class="form-group"><label>Salary ID Prefix</label><input type="text" id="set_salaryIdPrefix" value="${s.salaryIdPrefix}" /></div>
        </div>
      `;
      break;

    case 'receipt':
      html = `
        <div class="settings-group">
          <h3>Receipt Configuration</h3>
          <div class="form-group"><label>Receipt Footer</label><textarea id="set_receiptFooter" rows="2">${s.receiptFooter}</textarea></div>
          <div class="form-group"><label>Thank You Message</label><input type="text" id="set_receiptThankYou" value="${s.receiptThankYou}" /></div>
        </div>
      `;
      break;

    case 'format':
      html = `
        <div class="settings-group">
          <h3>Formatting</h3>
          <div class="form-group"><label>Currency Symbol</label><input type="text" id="set_currencySymbol" value="${s.currencySymbol}" /></div>
          <div class="form-group"><label>Date Format</label>
            <select id="set_dateFormat">
              <option value="dd MMM yyyy" ${s.dateFormat==='dd MMM yyyy'?'selected':''}>dd MMM yyyy</option>
              <option value="MM/dd/yyyy" ${s.dateFormat==='MM/dd/yyyy'?'selected':''}>MM/dd/yyyy</option>
              <option value="yyyy-MM-dd" ${s.dateFormat==='yyyy-MM-dd'?'selected':''}>yyyy-MM-dd</option>
            </select>
          </div>
          <div class="form-group"><label>Number Format (Locale)</label>
            <select id="set_numberFormat">
              <option value="en-IN" ${s.numberFormat==='en-IN'?'selected':''}>Indian (en-IN)</option>
              <option value="en-US" ${s.numberFormat==='en-US'?'selected':''}>US (en-US)</option>
              <option value="en-GB" ${s.numberFormat==='en-GB'?'selected':''}>UK (en-GB)</option>
            </select>
          </div>
        </div>
      `;
      break;
  }

  panel.innerHTML = html;

  // Apply common styles to form groups
  panel.querySelectorAll('.form-group').forEach(group => {
    group.style.marginBottom = '1rem';
    const label = group.querySelector('label');
    if (label) {
      label.style.display = 'block';
      label.style.fontWeight = '500';
      label.style.fontSize = '0.9rem';
      label.style.marginBottom = '0.25rem';
    }
    const input = group.querySelector('input, select, textarea');
    if (input) {
      input.style.width = '100%';
      input.style.padding = '0.5rem 0.75rem';
      input.style.border = '1px solid var(--gray-200)';
      input.style.borderRadius = 'var(--radius)';
      input.style.fontSize = '0.9rem';
      input.style.boxSizing = 'border-box';
    }
  });
}

// ============================================================
// SAVE ALL SETTINGS
// ============================================================

async function saveSettings() {
  const settings = {};

  // Gather all values
  settings.academicYear = document.getElementById('set_academicYear')?.value || SETTINGS.academicYear;
  settings.sessionStart = document.getElementById('set_sessionStart')?.value || SETTINGS.sessionStart;
  settings.sessionEnd = document.getElementById('set_sessionEnd')?.value || SETTINGS.sessionEnd;
  settings.schoolDescription = document.getElementById('set_schoolDescription')?.value || SETTINGS.schoolDescription;
  settings.principalName = document.getElementById('set_principalName')?.value || SETTINGS.principalName;
  settings.affiliation = document.getElementById('set_affiliation')?.value || SETTINGS.affiliation;
  settings.registrationNo = document.getElementById('set_registrationNo')?.value || SETTINGS.registrationNo;
  settings.schoolName = document.getElementById('set_schoolName')?.value || SETTINGS.schoolName;
  settings.schoolAddress = document.getElementById('set_schoolAddress')?.value || SETTINGS.schoolAddress;
  settings.schoolPhone = document.getElementById('set_schoolPhone')?.value || SETTINGS.schoolPhone;
  settings.schoolEmail = document.getElementById('set_schoolEmail')?.value || SETTINGS.schoolEmail;
  settings.schoolWebsite = document.getElementById('set_schoolWebsite')?.value || SETTINGS.schoolWebsite;
  settings.schoolCode = document.getElementById('set_schoolCode')?.value || SETTINGS.schoolCode;
  settings.studentDefaultFeeStatus = document.getElementById('set_studentDefaultFeeStatus')?.value || SETTINGS.studentDefaultFeeStatus;
  settings.studentIdPrefix = document.getElementById('set_studentIdPrefix')?.value || SETTINGS.studentIdPrefix;
  settings.admissionNoPrefix = document.getElementById('set_admissionNoPrefix')?.value || SETTINGS.admissionNoPrefix;
  const classOpts = document.getElementById('set_studentClassOptions')?.value;
  settings.studentClassOptions = classOpts ? classOpts.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : SETTINGS.studentClassOptions;
  const secOpts = document.getElementById('set_studentSectionOptions')?.value;
  settings.studentSectionOptions = secOpts ? secOpts.split(',').map(s => s.trim()) : SETTINGS.studentSectionOptions;
  const desOpts = document.getElementById('set_teacherDesignationOptions')?.value;
  settings.teacherDesignationOptions = desOpts ? desOpts.split(',').map(s => s.trim()) : SETTINGS.teacherDesignationOptions;
  const roleOpts = document.getElementById('set_staffRoleOptions')?.value;
  settings.staffRoleOptions = roleOpts ? roleOpts.split(',').map(s => s.trim()) : SETTINGS.staffRoleOptions;
  settings.employeeIdPrefixTeacher = document.getElementById('set_employeeIdPrefixTeacher')?.value || SETTINGS.employeeIdPrefixTeacher;
  settings.employeeIdPrefixStaff = document.getElementById('set_employeeIdPrefixStaff')?.value || SETTINGS.employeeIdPrefixStaff;
  const feeTypes = document.getElementById('set_feeTypeOptions')?.value;
  settings.feeTypeOptions = feeTypes ? feeTypes.split(',').map(s => s.trim()) : SETTINGS.feeTypeOptions;
  const feeStatuses = document.getElementById('set_feeStatusOptions')?.value;
  settings.feeStatusOptions = feeStatuses ? feeStatuses.split(',').map(s => s.trim()) : SETTINGS.feeStatusOptions;
  settings.feeIdPrefix = document.getElementById('set_feeIdPrefix')?.value || SETTINGS.feeIdPrefix;
  settings.receiptPrefix = document.getElementById('set_receiptPrefix')?.value || SETTINGS.receiptPrefix;
  settings.paymentIdPrefix = document.getElementById('set_paymentIdPrefix')?.value || SETTINGS.paymentIdPrefix;
  const salStatuses = document.getElementById('set_salaryStatusOptions')?.value;
  settings.salaryStatusOptions = salStatuses ? salStatuses.split(',').map(s => s.trim()) : SETTINGS.salaryStatusOptions;
  const payMethods = document.getElementById('set_salaryPaymentMethodOptions')?.value;
  settings.salaryPaymentMethodOptions = payMethods ? payMethods.split(',').map(s => s.trim()) : SETTINGS.salaryPaymentMethodOptions;
  settings.salaryIdPrefix = document.getElementById('set_salaryIdPrefix')?.value || SETTINGS.salaryIdPrefix;
  settings.receiptFooter = document.getElementById('set_receiptFooter')?.value || SETTINGS.receiptFooter;
  settings.receiptThankYou = document.getElementById('set_receiptThankYou')?.value || SETTINGS.receiptThankYou;
  settings.currencySymbol = document.getElementById('set_currencySymbol')?.value || SETTINGS.currencySymbol;
  settings.dateFormat = document.getElementById('set_dateFormat')?.value || SETTINGS.dateFormat;
  settings.numberFormat = document.getElementById('set_numberFormat')?.value || SETTINGS.numberFormat;

  SETTINGS = { ...SETTINGS, ...settings };
  window.SETTINGS = SETTINGS;

  const btn = document.getElementById('saveSettingsBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    await saveSettingsToFirebase(SETTINGS);
    // Refresh modules that may use settings
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderStudents) window.renderStudents();
    if (window.renderStaff) window.renderStaff();
    if (window.renderFees) window.renderFees();
    if (window.renderSalary) window.renderSalary();
  } catch (error) {
    console.error('Save error:', error);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save All Settings';
  }
}

// ============================================================
// INITIALIZE
// ============================================================

async function initSettings() {
  await loadSettings();
  renderSettings();
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.initSettings = initSettings;
window.loadSettings = loadSettings;
window.renderSettings = renderSettings;
window.SETTINGS = SETTINGS;
