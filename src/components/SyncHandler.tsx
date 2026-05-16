'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { loadOTData, saveOTData } from '@/lib/sync';

export default function SyncHandler() {
    const {
        uid,
        monthIdx,
        year,
        otInputs,
        otUpdatedAt,
        remoteUpdatedAt,
        applyRemoteOT,
        setSyncing,
        setSyncError
    } = useStore();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const activeLoadKeyRef = useRef<string | null>(null);

    useEffect(() => {
        if (!uid || monthIdx === null || year === null) return;

        const loadKey = `${uid}_${year}_${monthIdx}`;
        activeLoadKeyRef.current = loadKey;
        setSyncError(null);

        (async () => {
            try {
                const remote = await loadOTData(uid, year, monthIdx);
                if (!remote) return;

                // Ignore stale async result if user switched month or account.
                if (activeLoadKeyRef.current !== loadKey) return;
                applyRemoteOT(remote.otInputs, remote.updatedAtMs);
            } catch (err) {
                console.error("Initial OT load failed", err);
                if (activeLoadKeyRef.current === loadKey) {
                    setSyncError('Unable to load saved OT data.');
                }
            }
        })();
    }, [uid, monthIdx, year, applyRemoteOT, setSyncError]);

    useEffect(() => {
        if (!uid || monthIdx === null || year === null || Object.keys(otInputs).length === 0) return;
        if (otUpdatedAt <= remoteUpdatedAt) return;

        // Debounce saving to Firestore
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            setSyncing(true);
            setSyncError(null);
            try {
                await saveOTData(uid, year, monthIdx, otInputs);
            } catch (err) {
                console.error("Auto-sync failed", err);
                setSyncError('Auto-sync failed. Retrying on next change.');
            } finally {
                setSyncing(false);
            }
        }, 2000); // Save after 2 seconds of inactivity

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [otInputs, uid, monthIdx, year, otUpdatedAt, remoteUpdatedAt, setSyncing, setSyncError]);

    return null;
}
