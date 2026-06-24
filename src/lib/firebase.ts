import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  type Auth,
} from "firebase/auth";

// Fallbacks keep `getAuth` from throwing `auth/invalid-api-key` during build /
// prerender when env vars aren't set yet (e.g. CI before secrets are configured).
// Real auth requests still require valid values in `.env.local`; until then they
// fail at runtime and surface via the auth error toasts.
const isConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

// Surface a misconfigured deployment loudly instead of silently degrading. This
// runs in the browser so it shows up in real environments (incl. Vercel preview/
// prod) without breaking server prerender.
if (!isConfigured && typeof window !== "undefined") {
  console.error(
    "[firebase] NEXT_PUBLIC_FIREBASE_* env vars are not set — authentication will not work. " +
      "Add them to .env.local (local) or the host's environment (production)."
  );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "missing-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "missing.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "missing",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "missing.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000",
};

// Singleton — avoid re-initialising during Next.js fast refresh / RSC.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Apple uses the generic OAuthProvider with the apple.com provider id.
export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");
appleProvider.setCustomParameters({ locale: "en" });

export default app;
