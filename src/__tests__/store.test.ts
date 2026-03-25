import { useAppStore, useNavigationStore, divisionThemes } from '@/store';

describe('Store', () => {
  describe('useAppStore', () => {
    it('should have correct initial state', () => {
      const state = useAppStore.getState();
      
      expect(state.activeDivision).toBe('MALE');
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.showSplash).toBe(false);
      expect(state.activeModal).toBeNull();
    });

    it('should set active division', () => {
      const { setActiveDivision } = useAppStore.getState();
      
      setActiveDivision('FEMALE');
      expect(useAppStore.getState().activeDivision).toBe('FEMALE');
      
      setActiveDivision('LIGA');
      expect(useAppStore.getState().activeDivision).toBe('LIGA');
      
      setActiveDivision('MALE');
      expect(useAppStore.getState().activeDivision).toBe('MALE');
    });

    it('should set user and update isAuthenticated', () => {
      const { setUser, logout } = useAppStore.getState();
      
      // Test login
      setUser({
        id: '1',
        name: 'Test User',
        phone: '+62812345678',
        role: 'PARTICIPANT',
      });
      
      expect(useAppStore.getState().isAuthenticated).toBe(true);
      expect(useAppStore.getState().user?.name).toBe('Test User');
      
      // Test logout
      logout();
      expect(useAppStore.getState().isAuthenticated).toBe(false);
      expect(useAppStore.getState().user).toBeNull();
    });

    it('should handle modal state', () => {
      const { openModal, closeModal } = useAppStore.getState();
      
      openModal('bracket');
      expect(useAppStore.getState().activeModal).toBe('bracket');
      
      closeModal();
      expect(useAppStore.getState().activeModal).toBeNull();
    });
  });

  describe('useNavigationStore', () => {
    it('should have correct initial state', () => {
      const state = useNavigationStore.getState();
      
      expect(state.activePage).toBe('home');
    });

    it('should set active page', () => {
      const { setActivePage } = useNavigationStore.getState();
      
      setActivePage('rank');
      expect(useNavigationStore.getState().activePage).toBe('rank');
      
      setActivePage('champions');
      expect(useNavigationStore.getState().activePage).toBe('champions');
      
      setActivePage('home');
      expect(useNavigationStore.getState().activePage).toBe('home');
    });
  });

  describe('divisionThemes', () => {
    it('should have themes for all divisions', () => {
      expect(divisionThemes.MALE).toBeDefined();
      expect(divisionThemes.FEMALE).toBeDefined();
      expect(divisionThemes.LIGA).toBeDefined();
    });

    it('should have correct theme properties', () => {
      const maleTheme = divisionThemes.MALE;
      
      expect(maleTheme.name).toBe('Male Division');
      expect(maleTheme.icon).toBe('♂');
      expect(maleTheme.accent).toBe('red');
      expect(maleTheme.neonColor).toBe('#ef4444');
    });

    it('should have different colors for each division', () => {
      expect(divisionThemes.MALE.neonColor).not.toBe(divisionThemes.FEMALE.neonColor);
      expect(divisionThemes.FEMALE.neonColor).not.toBe(divisionThemes.LIGA.neonColor);
      expect(divisionThemes.LIGA.neonColor).not.toBe(divisionThemes.MALE.neonColor);
    });
  });
});
