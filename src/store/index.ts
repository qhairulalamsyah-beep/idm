import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// Division Types & Theme Config
// ============================================

export type Division = 'MALE' | 'FEMALE';

export interface DivisionTheme {
  name: string;
  icon: string;
  gradient: string;
  gradientDark: string;
  accent: string;
  accentGlow: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  neonColor: string;
  bgPattern: string;
}

export const divisionThemes: Record<Division, DivisionTheme> = {
  MALE: {
    name: 'Male Division',
    icon: '♂',
    gradient: 'from-red-950 via-red-900 to-slate-900',
    gradientDark: 'from-red-950 via-slate-900 to-black',
    accent: 'red',
    accentGlow: 'shadow-red-500/30',
    cardBg: 'bg-gradient-to-br from-red-950/80 to-slate-900/90',
    cardBorder: 'border-red-500/30',
    textPrimary: 'text-red-100',
    textSecondary: 'text-red-300/70',
    neonColor: '#ef4444',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-slate-900 to-black',
  },
  FEMALE: {
    name: 'Female Division',
    icon: '♀',
    gradient: 'from-purple-950 via-pink-900 to-slate-900',
    gradientDark: 'from-purple-950 via-slate-900 to-black',
    accent: 'purple',
    accentGlow: 'shadow-purple-500/30',
    cardBg: 'bg-gradient-to-br from-purple-950/80 to-slate-900/90',
    cardBorder: 'border-purple-500/30',
    textPrimary: 'text-purple-100',
    textSecondary: 'text-purple-300/70',
    neonColor: '#a855f7',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-black',
  },
};

// ============================================
// App Store with Hydration Support
// ============================================

interface AppState {
  // Hydration status
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Division
  activeDivision: Division;
  setActiveDivision: (division: Division) => void;
  
  // Auth
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    avatar?: string;
  } | null;
  setUser: (user: AppState['user']) => void;
  logout: () => void;
  
  // UI
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Splash - only show on first visit
  showSplash: boolean;
  setShowSplash: (show: boolean) => void;
  
  // Modal
  activeModal: string | null;
  openModal: (modal: string) => void;
  closeModal: () => void;
  
  // Theme helper
  getTheme: () => DivisionTheme;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Hydration
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      // Division
      activeDivision: 'MALE',
      setActiveDivision: (division) => set({ activeDivision: division }),
      
      // Auth
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
      
      // UI
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      // Splash - default false, will be set by hydration
      showSplash: false,
      setShowSplash: (show) => set({ showSplash: show }),
      
      // Modal
      activeModal: null,
      openModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: null }),
      
      // Theme helper
      getTheme: () => divisionThemes[get().activeDivision],
    }),
    {
      name: 'idol-meta-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        activeDivision: state.activeDivision,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Don't persist showSplash - we want it controlled by hasVisited
      }),
      // After hydration, set flag
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// ============================================
// Tournament Store
// ============================================

interface Tournament {
  id: string;
  name: string;
  division: Division;
  mode: string;
  bpm: string;
  bracketType: string;
  status: string;
  maxParticipants: number;
  currentParticipants: number;
  startDate: string;
  location?: string;
  bannerImage?: string;
  rules?: string;
}

interface TournamentState {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  setTournaments: (tournaments: Tournament[]) => void;
  setActiveTournament: (tournament: Tournament | null) => void;
}

export const useTournamentStore = create<TournamentState>()((set) => ({
  tournaments: [],
  activeTournament: null,
  setTournaments: (tournaments) => set({ tournaments }),
  setActiveTournament: (tournament) => set({ activeTournament: tournament }),
}));

// ============================================
// Registration Store
// ============================================

interface Participant {
  id: string;
  name: string;
  tier: string;
  avatar?: string;
}

interface RegistrationState {
  participants: Participant[];
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
}

export const useRegistrationStore = create<RegistrationState>()((set) => ({
  participants: [],
  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants, participant]
  })),
}));

// ============================================
// Navigation Store
// ============================================

type NavPage = 'home' | 'rank' | 'champions' | 'teams' | 'admin' | 'profile';

interface NavigationState {
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
}

export const useNavigationStore = create<NavigationState>()((set) => ({
  activePage: 'home',
  setActivePage: (page) => set({ activePage: page }),
}));
