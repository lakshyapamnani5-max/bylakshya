import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, type User } from 'firebase/auth';
import { getDatabase, onValue, ref } from 'firebase/database';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (typeof window !== 'undefined') {
  void isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    })
    .catch(() => {
      // Ignore analytics initialization errors in restricted/headless contexts
    });
}

export const BOOTSTRAP_ADMIN_EMAIL = 'lakshaypamnani2@gmail.com';

export function isVerifiedGoogleAdmin(user: User | null | undefined): boolean {
  if (!user || !user.emailVerified) return false;
  const email = (user.email || '').toLowerCase();
  if (email !== BOOTSTRAP_ADMIN_EMAIL) return false;
  return user.providerData.some((p) => p.providerId === 'google.com');
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firebase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  const rtdbOk = await new Promise<boolean>((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(true);
      }
    }, 2500);
    const unsub = onValue(
      ref(rtdb, '.info/connected'),
      (snap) => {
        if (!settled && snap.val() === true) {
          settled = true;
          window.clearTimeout(timer);
          unsub();
          resolve(true);
        }
      },
      () => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(false);
        }
      },
    );
  });

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return rtdbOk;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firebase client is offline. Please verify Firebase configuration.');
      return false;
    }
    return rtdbOk;
  }
}
