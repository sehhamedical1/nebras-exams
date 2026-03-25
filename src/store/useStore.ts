import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export interface TestSettings {
  isAlwaysOpen?: boolean;
  openTime?: string;
  closeTime?: string;
  manualClose?: boolean;
  showAnswers?: boolean;
  limitOneResponse?: boolean;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  theme?: {
    background?: string;
    backgroundImage?: string;
    color?: string;
  };
}

export interface Test {
  id: string;
  name: string;
  questions: any[];
  students: number;
  date: string;
  status: string;
  code: string;
  settings: TestSettings;
}

export interface Report {
  id: string;
  testId: string;
  name: string;
  phone: string;
  score: number;
  time: string;
  date: string;
  status: string;
  details: any[];
}

interface StoreState {
  tests: Test[];
  reports: Report[];
  draftTest: { id?: string; name: string; questions: any[] } | null;
  isLoading: boolean;
  error: string | null;
  
  // Synchronous actions (for local state)
  addTest: (test: Test) => void;
  updateTest: (id: string, test: Partial<Test>) => void;
  deleteTest: (id: string) => void;
  deleteTests: (ids: string[]) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, report: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  deleteReports: (ids: string[]) => void;
  setDraftTest: (draft: { id?: string; name: string; questions: any[] } | null) => void;

  // Asynchronous actions (ready for API integration)
  fetchTests: () => Promise<void>;
  fetchReports: () => Promise<void>;
  createTestAPI: (test: Omit<Test, 'id'>) => Promise<void>;
  updateTestAPI: (id: string, test: Partial<Test>) => Promise<void>;
  deleteTestAPI: (id: string) => Promise<void>;
  submitReportAPI: (report: Report) => Promise<void>;
  updateReportAPI: (id: string, report: Partial<Report>) => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      tests: [
        { id: '1', name: 'اختبار السيرة النبوية', questions: [], students: 120, date: '2023-10-25', status: 'نشط', code: 'A1B2C', settings: {} },
        { id: '2', name: 'مسابقة القرآن الكريم', questions: [], students: 85, date: '2023-10-20', status: 'مغلق', code: 'X9Y8Z', settings: {} },
      ],
      reports: [
        { id: '1', testId: '1', name: 'أحمد محمد', phone: '0501234567', score: 95, time: '02:30', date: '2023-10-25', status: 'مكتمل', details: [] },
      ],
      draftTest: null,
      isLoading: false,
      error: null,

      // --- Local State Actions ---
      addTest: (test) => set((state) => {
        if (state.tests.some(t => t.id === test.id)) {
          return { tests: state.tests.map(t => t.id === test.id ? { ...t, ...test } : t) };
        }
        return { tests: [...state.tests, test] };
      }),
      updateTest: (id, updatedTest) => set((state) => ({
        tests: state.tests.map((t) => (t.id === id ? { ...t, ...updatedTest } : t)),
      })),
      deleteTest: (id) => set((state) => ({ tests: state.tests.filter((t) => t.id !== id) })),
      deleteTests: (ids) => set((state) => ({ tests: state.tests.filter((t) => !ids.includes(t.id)) })),
      addReport: (report) => set((state) => {
        if (state.reports.some(r => r.id === report.id)) {
          return { reports: state.reports.map(r => r.id === report.id ? { ...r, ...report } : r) };
        }
        return {
          reports: [...state.reports, report],
          tests: state.tests.map(t => t.id === report.testId ? { ...t, students: t.students + 1 } : t)
        };
      }),
      updateReport: (id, updatedReport) => set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? { ...r, ...updatedReport } : r)),
      })),
      deleteReport: (id) => set((state) => {
        const reportToDelete = state.reports.find(r => r.id === id);
        return {
          reports: state.reports.filter((r) => r.id !== id),
          tests: reportToDelete ? state.tests.map(t => t.id === reportToDelete.testId ? { ...t, students: Math.max(0, t.students - 1) } : t) : state.tests
        };
      }),
      deleteReports: (ids) => set((state) => {
        const reportsToDelete = state.reports.filter(r => ids.includes(r.id));
        const testIdCounts = reportsToDelete.reduce((acc, r) => {
          acc[r.testId] = (acc[r.testId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          reports: state.reports.filter((r) => !ids.includes(r.id)),
          tests: state.tests.map(t => testIdCounts[t.id] ? { ...t, students: Math.max(0, t.students - testIdCounts[t.id]) } : t)
        };
      }),
      setDraftTest: (draft) => set({ draftTest: draft }),

      // --- API Ready Actions ---
      fetchTests: async () => {
        set({ isLoading: false, error: null });
      },

      fetchReports: async () => {
        set({ isLoading: false, error: null });
      },

      createTestAPI: async (testData) => {
        set({ isLoading: true, error: null });
        try {
          const newTest = { ...testData, id: Date.now().toString() } as Test;
          get().addTest(newTest);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to create test', isLoading: false });
        }
      },

      updateTestAPI: async (id, testData) => {
        set({ isLoading: true, error: null });
        try {
          get().updateTest(id, testData);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to update test', isLoading: false });
        }
      },

      deleteTestAPI: async (id) => {
        set({ isLoading: true, error: null });
        try {
          get().deleteTest(id);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete test', isLoading: false });
        }
      },

      submitReportAPI: async (reportData) => {
        set({ isLoading: true, error: null });
        try {
          get().addReport(reportData);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to submit report', isLoading: false });
        }
      },

      updateReportAPI: async (id, reportData) => {
        set({ isLoading: true, error: null });
        try {
          get().updateReport(id, reportData);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to update report', isLoading: false });
        }
      }
    }),
    {
      name: 'nebras-storage',
      storage: createJSONStorage(() => storage),
      // Optionally, don't persist loading/error states
      partialize: (state) => ({ tests: state.tests, reports: state.reports, draftTest: state.draftTest }),
    }
  )
);
