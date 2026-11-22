import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, tokens, connectWebSocket } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userFamilyId, setUserFamilyId] = useState(null);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationToast, setNotificationToast] = useState(null);

  const fetchProfile = useCallback(async () => {
    const token = tokens.getAccess();
    if (!token) {
      setCurrentUser(null);
      setUserRole(null);
      setUserFamilyId(null);
      setUserDisplayName('');
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.getMe();
      setCurrentUser({ uid: data.id, ...data });
      setUserRole(data.role);
      setUserFamilyId(data.family_id);
      setUserDisplayName(data.display_name || '');
    } catch (e) {
      console.error('Failed to load user profile:', e);
      tokens.clear();
      setCurrentUser(null);
      setUserRole(null);
      setUserFamilyId(null);
      setUserDisplayName('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Connect WebSocket for live notifications
  useEffect(() => {
    if (!currentUser) return;

    const ws = connectWebSocket(userFamilyId, (msg) => {
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
  }, [currentUser, userFamilyId]);

  const login = async (email, password) => {
    await authApi.login(email, password);
    await fetchProfile();
  };

  const logout = () => {
    tokens.clear();
    setCurrentUser(null);
    setUserRole(null);
    setUserFamilyId(null);
    setUserDisplayName('');
  };

  const value = {
    currentUser,
    userRole,
    userFamilyId,
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
