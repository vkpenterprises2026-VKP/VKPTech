import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const enabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
const app = enabled ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const firestore = app ? getFirestore(app) : null;

export function watchUser(callback) {
  if (!auth) {
    callback(null, null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return callback(null, null);
    const roleSnap = await getDoc(doc(firestore, "users", user.uid));
    callback(user, roleSnap.exists() ? roleSnap.data() : null);
  });
}

export async function login(email, password) {
  if (!auth) throw new Error("Firebase client config is missing");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signup(email, password, role, businessName) {
  if (!auth) throw new Error("Firebase client config is missing");
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(firestore, "users", credential.user.uid), {
    email,
    role,
    business_name: businessName,
    approved: role === "admin" ? false : false,
    created_at: serverTimestamp()
  });
  return credential;
}

export function logout() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}
