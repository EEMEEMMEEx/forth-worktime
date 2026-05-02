'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { saveOTData } from '@/lib/sync';

export default function SyncHandler() {
    const { uid, monthIdx, year, otInputs, setSyncing } = useStore();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!uid || monthIdx === null || year === null || Object.keys(otInputs).length === 0) return;

        // Debounce saving to Firestore
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            setSyncing(true);
            try {
                await saveOTData(uid, year, monthIdx, otInputs);
            } catch (err) {
                console.error("Auto-sync failed", err);
            } finally {
                setSyncing(false);
            }
        }, 2000); // Save after 2 seconds of inactivity

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [otInputs, uid, monthIdx, year, setSyncing]);

    return null;
}
