// ============================================================
// FIREBASE CONFIGURATION & CRUD WRAPPERS
// ============================================================

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, update, remove, get } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signOut } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBLX-DBrAZZgi7OGRW3-oeno0PJsZ9hzEg",
  authDomain: "its-me-ame.firebaseapp.com",
  databaseURL: "https://its-me-ame-default-rtdb.firebaseio.com",
  projectId: "its-me-ame",
  storageBucket: "its-me-ame.firebasestorage.app",
  messagingSenderId: "832380884001",
  appId: "1:832380884001:web:0c9239588ceb8d8995bf60",
  measurementId: "G-L12EEJG7L9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

/**
 * Sign in with email and password.
 * @param {string} email - Admin email.
 * @param {string} password - Admin password.
 * @returns {Promise} - Resolves with user credential.
 */
function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Get the currently authenticated user (one-time check).
 * @returns {Promise} - Resolves with user object or null.
 */
function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Log out the current user.
 * @returns {Promise<void>}
 */
function logoutAdmin() {
  return signOut(auth);
}

/**
 * Send password reset email.
 * @param {string} email - User email.
 * @returns {Promise<void>}
 */
function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

// ============================================================
// CRUD OPERATIONS (Realtime Database)
// ============================================================

/**
 * Read all records from a path (one-time read).
 * @param {string} path - Database path (e.g., 'students').
 * @returns {Promise<Array>} - Array of objects with id and data.
 */
function getAllData(path) {
  const dbRef = ref(db, path);
  return get(dbRef).then((snapshot) => {
    const data = snapshot.val();
    if (data) {
      return Object.keys(data).map((key) => ({ id: key, ...data[key] }));
    }
    return [];
  });
}

/**
 * Create a new record.
 * @param {string} path - Database path.
 * @param {Object} data - The record data.
 * @returns {Promise<Object>} - The created record with id.
 */
function createData(path, data) {
  const newRef = push(ref(db, path));
  return set(newRef, data).then(() => ({ id: newRef.key, ...data }));
}

/**
 * Update an existing record.
 * @param {string} path - Database path.
 * @param {string} id - Record id.
 * @param {Object} data - The updated fields.
 * @returns {Promise<void>}
 */
function updateData(path, id, data) {
  const itemRef = ref(db, `${path}/${id}`);
  return update(itemRef, data);
}

/**
 * Delete a record.
 * @param {string} path - Database path.
 * @param {string} id - Record id.
 * @returns {Promise<void>}
 */
function deleteData(path, id) {
  const itemRef = ref(db, `${path}/${id}`);
  return remove(itemRef);
}

/**
 * Get a single record.
 * @param {string} path - Database path.
 * @param {string} id - Record id.
 * @returns {Promise<Object|null>}
 */
function getOneData(path, id) {
  const itemRef = ref(db, `${path}/${id}`);
  return get(itemRef).then((snapshot) => snapshot.val());
}

// ============================================================
// EXPORTS
// ============================================================

export {
  db,
  auth,
  loginAdmin,
  getCurrentUser,
  logoutAdmin,
  sendPasswordReset,
  getAllData,
  createData,
  updateData,
  deleteData,
  getOneData
};
