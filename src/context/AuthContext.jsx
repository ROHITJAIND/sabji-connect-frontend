import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, tokens, connectWebSocket } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userFamilyId, setUserFamilyId] = useState(null);
  const [userFamilyIds, setUserFamilyIds] = useState([]);
  const [activeFamilyId, setActiveFamilyId] = useState(() => localStorage.getItem('sabji_active_family_id') || null);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationToast, setNotificationToast] = useState(null);

  const fetchProfile = useCallback(async () => {
    const token = tokens.getAccess();
    if (!token) {
      setCurrentUser(null);
      setUserRole(null);
      setUserFamilyId(null);
      setUserFamilyIds([]);
      setActiveFamilyId(null);
      setUserDisplayName('');
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.getMe();
      setCurrentUser({ uid: data.id, ...data });
      setUserRole(data.role);

      const fids = data.family_ids || [];
      setUserFamilyIds(fids);

      // Determine active family id
      const storedActive = localStorage.getItem('sabji_active_family_id');
      let effectiveActive = null;
      if (data.role === 'Admin') {
        effectiveActive = storedActive || null;
      } else {
        if (storedActive && fids.includes(storedActive)) {
          effectiveActive = storedActive;
        } else if (fids.length > 0) {
          effectiveActive = fids[0];
        } else {
          effectiveActive = null;
        }
      }

      if (effectiveActive) {
        localStorage.setItem('sabji_active_family_id', effectiveActive);
      } else {
        localStorage.removeItem('sabji_active_family_id');
      }

      setActiveFamilyId(effectiveActive);
      setUserFamilyId(effectiveActive);
      setUserDisplayName(data.display_name || '');
    } catch (e) {
      console.error('Failed to load user profile:', e);
      tokens.clear();
      setCurrentUser(null);
      setUserRole(null);
      setUserFamilyId(null);
      setUserFamilyIds([]);
      setActiveFamilyId(null);
      setUserDisplayName('');
    } finally {
      setLoading(false);
    }
  }, []);

  const switchFamily = useCallback((familyId) => {
    const targetId = familyId || null;
    if (targetId) {
      localStorage.setItem('sabji_active_family_id', targetId);
    } else {
      localStorage.removeItem('sabji_active_family_id');
    }
    setActiveFamilyId(targetId);
    setUserFamilyId(targetId);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Connect WebSocket for live notifications on active family
  useEffect(() => {
    if (!currentUser) return;

    const ws = connectWebSocket(activeFamilyId, (msg) => {
      if (msg.event === 'order_updated') {
        setNotificationToast({
          title: '🛒 Order Updated',
          body: `Order status changed to ${msg.data?.status || 'updated'}`,
          id: Date.now(),
        });
        setTimeout(() => setNotificationToast(null), 5000);
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, [currentUser, activeFamilyId]);

  const login = async (username, password) => {
    await authApi.login(username, password);
    await fetchProfile();
  };

  const logout = () => {
    tokens.clear();
    localStorage.removeItem('sabji_active_family_id');
    setCurrentUser(null);
    setUserRole(null);
    setUserFamilyId(null);
    setUserFamilyIds([]);
    setActiveFamilyId(null);
    setUserDisplayName('');
  };

  const value = {
    currentUser,
    userRole,
    userFamilyId: activeFamilyId,
    activeFamilyId,
    userFamilyIds,
    switchFamily,
    userDisplayName,
    notificationToast,
    setNotificationToast,
    login,
    logout,
    refreshProfile: fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
