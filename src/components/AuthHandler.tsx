'use client';
import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { useStore } from '@/lib/store';

export default function AuthHandler() {
    const { setUid, setSyncError } = useStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("Logged in as:", user.uid);
                setUid(user.uid);
                setSyncError(null);
            } else {
                // Sign in anonymously if not logged in
                try {
                    await signInAnonymously(auth);
                } catch (error: unknown) {
                    const authError = error as { code?: string; message?: string };
                    // Check for common configuration errors
                    if (authError.code === 'auth/configuration-not-found') {
                        console.error("Firebase Auth Error: Please enable 'Anonymous' sign-in provider in your Firebase Console (Build > Authentication > Sign-in method).");
                        setSyncError('Anonymous auth is not enabled in Firebase project.');
                    } else {
                        console.error("Auth error:", authError.message || authError);
                        setSyncError(authError.message || 'Authentication failed.');
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [setUid, setSyncError]);

    return null; // Invisible component
}
