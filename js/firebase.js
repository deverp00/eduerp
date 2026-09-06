// ============================================================
// FIREBASE CONFIGURATION & CRUD WRAPPERS
// ============================================================

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getDatabase,
  ref,
  set,
  push,
  update,
  remove,
  get
} from "firebase/database";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";

// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCLNbgmfCWOGsbk9z1UEDz3I3Fm8TNR-OA",
  authDomain: "eduerp-66bce.firebaseapp.com",
  projectId: "eduerp-66bce",
  storageBucket: "eduerp-66bce.firebasestorage.app",
  messagingSenderId: "153111343576",
  appId: "1:153111343576:web:3d385182dfa686f94102ad",
  measurementId: "G-5RESP0XT4J"
};

// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth(app);

// ============================================================
// AUTHORIZED ADMIN UID (ONLY this user can login)
// ============================================================

const AUTHORIZED_ADMIN_UID = "bwPCKxNuFPhOiZi3tMffDVdY0cy2";

// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      if (user.uid !== AUTHORIZED_ADMIN_UID) {
        return signOut(auth).then(() => {
          throw { code: 'auth/unauthorized-admin', message: 'Unauthorized admin access.' };
        });
      }
      return userCredential;
    });
}

function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

function logoutAdmin() {
  return signOut(auth);
}

function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

// ============================================================
// CRUD OPERATIONS - REALTIME DATABASE
// ============================================================

function getAllData(path) {
  const dbRef = ref(db, path);
  return get(dbRef).then((snapshot) => {
    const data = snapshot.val();
    if (data) {
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key]
      }));
    }
    return [];
  });
}

function createData(path, data) {
  const newRef = push(ref(db, path));
  return set(newRef, data).then(() => ({
    id: newRef.key,
    ...data
  }));
}

function updateData(path, id, data) {
  const itemRef = ref(db, `${path}/${id}`);
  return update(itemRef, data);
}

function deleteData(path, id) {
  const itemRef = ref(db, `${path}/${id}`);
  return remove(itemRef);
}

function getOneData(path, id) {
  const itemRef = ref(db, `${path}/${id}`);
  return get(itemRef).then((snapshot) => snapshot.val());
}

// NEW: Write data to a specific path with a fixed ID
function setData(path, id, data) {
  const itemRef = ref(db, `${path}/${id}`);
  return set(itemRef, data);
}

// ============================================================
// EXPORTS
// ============================================================

export {
  app,
  analytics,
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
  getOneData,
  setData   // <-- new export
};
