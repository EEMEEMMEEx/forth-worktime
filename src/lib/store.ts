import { create } from 'zustand';
import { WorkDay, OTInputMap, PaySettings, Language } from './types';

interface AppState {
    uid: string | null;
    lang: Language;
    busy: boolean;
    data: WorkDay[];
    otInputs: OTInputMap;
    monthIdx: number | null;
    year: number | null;
    pay: PaySettings;
    syncing: boolean;

    setUid: (uid: string | null) => void;
    setLang: (lang: Language) => void;
    setBusy: (busy: boolean) => void;
    setData: (data: WorkDay[], monthIdx: number, year: number, otInputs?: OTInputMap) => void;
    setOT: (day: number, rate: keyof OTInputMap[number], value: number) => void;
    setPay: (settings: Partial<PaySettings>) => void;
    resetOT: () => void;
    setSyncing: (syncing: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
    uid: null,
    lang: 'th',
    busy: false,
    data: [],
    otInputs: {},
    monthIdx: null,
    year: null,
    pay: { monthlySalary: 0, baseHours: 240 },
    syncing: false,

    setUid: (uid) => set({ uid }),
    setLang: (lang) => set({ lang }),
    setBusy: (busy) => set({ busy }),
    setData: (data, monthIdx, year, otInputs = {}) => set({ data, monthIdx, year, otInputs }),
    setSyncing: (syncing) => set({ syncing }),

    setOT: (day, rate, value) => set((state) => {
        const currentDayOT = state.otInputs[day] || { o10: 0, o15: 0, o20: 0, o30: 0 };
        return {
            otInputs: {
                ...state.otInputs,
                [day]: { ...currentDayOT, [rate]: value }
            }
        };
    }),

    setPay: (settings) => set((state) => ({
        pay: { ...state.pay, ...settings }
    })),

    resetOT: () => set({ otInputs: {} })
}));
