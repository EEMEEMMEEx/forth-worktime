import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { OTInputMap } from './types';

/**
 * Saves OT inputs to Firestore for a specific user and month/year.
 * Path: users/{uid}/worktime/{year_month}
 */
export async function saveOTData(uid: string, year: number, month: number, data: OTInputMap) {
    if (!uid) return;
    const docId = `${year}_${String(month + 1).padStart(2, '0')}`;
    const docRef = doc(db, 'users', uid, 'worktime', docId);
    
    try {
        await setDoc(docRef, {
            otInputs: data,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`Saved OT data for ${docId}`);
    } catch (error) {
        console.error('Error saving OT data:', error);
        throw error;
    }
}

/**
 * Loads OT inputs from Firestore.
 */
export async function loadOTData(uid: string, year: number, month: number): Promise<OTInputMap | null> {
    if (!uid) return null;
    const docId = `${year}_${String(month + 1).padStart(2, '0')}`;
    const docRef = doc(db, 'users', uid, 'worktime', docId);

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().otInputs as OTInputMap;
        }
        return null;
    } catch (error) {
        console.error('Error loading OT data:', error);
        return null;
    }
}
