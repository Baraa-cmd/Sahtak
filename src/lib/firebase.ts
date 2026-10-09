import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Pharmacy, Nurse, Hospital, AppUser } from '../types';
import { INITIAL_PHARMACIES, INITIAL_NURSES, INITIAL_HOSPITALS } from './initialData';
import { offlineStorage, DEFAULT_ADMIN_USER } from './offlineStorage';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot per Firebase skill guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using offline storage cache.');
    }
  }
}
testConnection();

// Initial database seeding with Dayr Hafir data
export async function seedInitialDataIfEmpty() {
  try {
    const phSnap = await getDocs(collection(db, 'pharmacies'));
    // If empty or has old non-DayrHafir data, update with Dayr Hafir dataset
    const needsSeed = phSnap.empty || !phSnap.docs.some(d => d.data().name?.includes('دير حافر'));
    if (needsSeed) {
      for (const ph of INITIAL_PHARMACIES) {
        await setDoc(doc(db, 'pharmacies', ph.id), {
          ...ph,
          updatedAt: new Date().toISOString()
        });
      }

      for (const nr of INITIAL_NURSES) {
        await setDoc(doc(db, 'nurses', nr.id), {
          ...nr,
          updatedAt: new Date().toISOString()
        });
      }

      for (const hp of INITIAL_HOSPITALS) {
        await setDoc(doc(db, 'hospitals', hp.id), {
          ...hp,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Seed default admin account if app_users is empty
    const userSnap = await getDocs(collection(db, 'app_users'));
    if (userSnap.empty) {
      await setDoc(doc(db, 'app_users', DEFAULT_ADMIN_USER.id), {
        ...DEFAULT_ADMIN_USER,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Initial seed skipped or offline:', err);
  }
}

// Subscribe to real-time changes in pharmacies
export function subscribeToPharmacies(
  onData: (data: Pharmacy[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'pharmacies';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onData(INITIAL_PHARMACIES);
        offlineStorage.savePharmacies(INITIAL_PHARMACIES);
        return;
      }
      const items: Pharmacy[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Pharmacy);
      });
      onData(items);
      offlineStorage.savePharmacies(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      // Fallback to offline cache or initial data
      const cached = offlineStorage.getPharmacies();
      onData(cached || INITIAL_PHARMACIES);
      if (onError) onError(error);
    }
  );
}

// Subscribe to real-time changes in nurses
export function subscribeToNurses(
  onData: (data: Nurse[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'nurses';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onData(INITIAL_NURSES);
        offlineStorage.saveNurses(INITIAL_NURSES);
        return;
      }
      const items: Nurse[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Nurse);
      });
      onData(items);
      offlineStorage.saveNurses(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      const cached = offlineStorage.getNurses();
      onData(cached || INITIAL_NURSES);
      if (onError) onError(error);
    }
  );
}

// Subscribe to real-time changes in hospitals
export function subscribeToHospitals(
  onData: (data: Hospital[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'hospitals';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onData(INITIAL_HOSPITALS);
        offlineStorage.saveHospitals(INITIAL_HOSPITALS);
        return;
      }
      const items: Hospital[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Hospital);
      });
      onData(items);
      offlineStorage.saveHospitals(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      const cached = offlineStorage.getHospitals();
      onData(cached || INITIAL_HOSPITALS);
      if (onError) onError(error);
    }
  );
}

// Update pharmacy duty status
export async function updatePharmacyStatus(
  pharmacyId: string,
  updates: Partial<Pharmacy>
) {
  const path = `pharmacies/${pharmacyId}`;
  try {
    await updateDoc(doc(db, 'pharmacies', pharmacyId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Update nurse availability and duty status
export async function updateNurseStatus(
  nurseId: string,
  updates: Partial<Nurse>
) {
  const path = `nurses/${nurseId}`;
  try {
    await updateDoc(doc(db, 'nurses', nurseId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Subscribe to real-time changes in app users (Admin & providers)
export function subscribeToUsers(
  onData: (data: AppUser[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'app_users';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onData([DEFAULT_ADMIN_USER]);
        offlineStorage.saveUsers([DEFAULT_ADMIN_USER]);
        return;
      }
      const items: AppUser[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as AppUser);
      });
      // Ensure admin exists
      if (!items.some(u => u.role === 'admin')) {
        items.unshift(DEFAULT_ADMIN_USER);
      }
      onData(items);
      offlineStorage.saveUsers(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      const cached = offlineStorage.getUsers();
      onData(cached || [DEFAULT_ADMIN_USER]);
      if (onError) onError(error);
    }
  );
}

// Save or update user credentials (Admin can edit admin credentials or add/edit providers)
export async function saveUserAccount(user: AppUser): Promise<void> {
  const path = `app_users/${user.id}`;
  try {
    await setDoc(
      doc(db, 'app_users', user.id),
      {
        ...user,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    // Also update offline cache
    const currentUsers = offlineStorage.getUsers();
    const updatedUsers = [
      user,
      ...currentUsers.filter((u) => u.id !== user.id)
    ];
    offlineStorage.saveUsers(updatedUsers);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    // Fallback save to local storage
    const currentUsers = offlineStorage.getUsers();
    const updatedUsers = [
      user,
      ...currentUsers.filter((u) => u.id !== user.id)
    ];
    offlineStorage.saveUsers(updatedUsers);
  }
}

// Delete user account
export async function deleteUserAccount(userId: string): Promise<void> {
  const path = `app_users/${userId}`;
  try {
    await deleteDoc(doc(db, 'app_users', userId));
    const currentUsers = offlineStorage.getUsers();
    offlineStorage.saveUsers(currentUsers.filter((u) => u.id !== userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    const currentUsers = offlineStorage.getUsers();
    offlineStorage.saveUsers(currentUsers.filter((u) => u.id !== userId));
  }
}

