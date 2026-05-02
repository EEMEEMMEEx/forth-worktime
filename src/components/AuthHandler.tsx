'use client';
import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { useStore } from '@/lib/store';
import { loadOTData } from '@/lib/sync';

export default function AuthHandler() {
    const { setUid, monthIdx, year } = useStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("Logged in as:", user.uid);
                setUid(user.uid);
                
                // If data is already loaded (from PDF), try to fetch saved OT from Firestore
                if (monthIdx !== null && year !== null) {
                    const savedOT = await loadOTData(user.uid, year, monthIdx);
                    if (savedOT && typeof savedOT === 'object') {
                        // Merge or set OT inputs
                        useStore.setState((state) => ({ 
                            otInputs: { ...state.otInputs, ...savedOT } 
                        }));
                    }
                }
            } else {
                // Sign in anonymously if not logged in
                try {
                    await signInAnonymously(auth);
                } catch (error: unknown) {
                    const authError = error as { code?: string; message?: string };
                    // Check for common configuration errors
                    if (authError.code === 'auth/configuration-not-found') {
                        console.error("Firebase Auth Error: Please enable 'Anonymous' sign-in provider in your Firebase Console (Build > Authentication > Sign-in method).");
                    } else {
                        console.error("Auth error:", authError.message || authError);
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [monthIdx, year, setUid]);

    return null; // Invisible component
}
