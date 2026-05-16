import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { OTInputMap } from './types';

export interface RemoteOTPayload {
    otInputs: OTInputMap;
    updatedAtMs: number;
}

/**
 * Saves OT inputs to Firestore for a specific user and month/year.
 * Path: users/{uid}/worktime/{year_month}
 */
export async function saveOTData(uid: string, year: number, month: number, data: OTInputMap) {
    if (!uid) return;
    const docId = `${year}_${String(month + 1).padStart(2, '0')}`;
    const docRef = doc(db, 'users', uid, 'worktime', docId);
    const updatedAt = new Date().toISOString();
    
    try {
        await setDoc(docRef, {
            otInputs: data,
            updatedAt
        }, { merge: true });
        return { updatedAtMs: Date.parse(updatedAt) || Date.now() };
    } catch (error) {
        console.error('Error saving OT data:', error);
        throw error;
    }
}

/**
 * Loads OT inputs from Firestore.
 */
export async function loadOTData(uid: string, year: number, month: number): Promise<RemoteOTPayload | null> {
    if (!uid) return null;
    const docId = `${year}_${String(month + 1).padStart(2, '0')}`;
    const docRef = doc(db, 'users', uid, 'worktime', docId);

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as { otInputs?: OTInputMap; updatedAt?: string };
            const updatedAtMs = data.updatedAt ? Date.parse(data.updatedAt) : 0;
            return {
                otInputs: data.otInputs || {},
                updatedAtMs: Number.isFinite(updatedAtMs) ? updatedAtMs : 0
            };
        }
        return null;
    } catch (error) {
        console.error('Error loading OT data:', error);
        return null;
    }
}
