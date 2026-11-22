import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, X, Shield, ShoppingCart, User, Eye, EyeOff, Save, Check, Filter } from 'lucide-react';
import { authApi, familiesApi } from '../api';

const ROLE_COLORS = {
  Admin:  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', icon: Shield },
  Sethji: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300',  icon: ShoppingCart },
  Hukum:  { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   icon: User },
};

/* ─── Create User Modal (Standalone User) ─── */
function CreateUserModal({ onClose, onUserCreated }) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Hukum');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = displayName.trim();
    const cleanUser = username.trim().replace(/\s+/g, '').toLowerCase();

    if (!cleanUser || !password || password.length < 6) {
      setError('Username and password (min 6 characters) are required.');
      return;
    }

    setLoading(true);
    try {
      const syntheticEmail = cleanUser.includes('@') ? cleanUser : `${cleanUser}@sabjiconnect.com`;
      await authApi.adminCreateUser({
        email: syntheticEmail,
        password: password,
        display_name: cleanName || cleanUser,
        role: role,
        family_id: null, // Standalone user initially
      });

      onUserCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl border-4 border-gray-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b-2 border-gray-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <UserPlus size={20} />
            </div>
            <h2 className="title-font text-xl font-black text-gray-900">Create New User</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Ramesh Bhai"
              required
              className="w-full p-3 rounded-xl border-2 border-gray-900 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ramesh"
              required
              className="w-full p-3 rounded-xl border-2 border-gray-900 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <p className="text-xs text-gray-400 mt-1">Users log in using this username.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="w-full p-3 pr-11 rounded-xl border-2 border-gray-900 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {['Hukum', 'Sethji', 'Admin'].map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      isSelected
                        ? 'border-gray-900 bg-orange-400 text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {role === 'Hukum' && 'Hukum: Family member who places grocery orders.'}
              {role === 'Sethji' && 'Sethji: Market buyer who shops and fulfills lists.'}
              {role === 'Admin' && 'Admin: Full management access to system.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-3d bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Users Page ─── */
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All' | 'Unassigned' | 'Assigned'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, familiesData] = await Promise.all([
        authApi.adminListUsers(false),
        familiesApi.list(),
      ]);
      setUsers(usersData);
      setFamilies(familiesData);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Family map for quick name lookup
  const familyMap = {};
  families.forEach((f) => {
    familyMap[f.id] = f.name;
  });

  const filteredUsers = users.filter((u) => {
    if (filter === 'Unassigned') return !u.family_id;
    if (filter === 'Assigned') return !!u.family_id;
    return true;
  });

  const unassignedCount = users.filter((u) => !u.family_id).length;

  return (
    <div className="min-h-screen pb-24 bg-gray-50 flex flex-col">
      <Navbar onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="max-w-2xl mx-auto w-full px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 border-2 border-orange-300 flex items-center justify-center text-orange-600 shadow-sm">
              <Users size={24} />
            </div>
            <div>
              <h1 className="title-font text-2xl font-black text-gray-900">User Management</h1>
              <p className="text-sm font-semibold text-gray-500">Create & manage standalone users</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-3d bg-orange-500 text-white px-4 py-2.5 text-sm font-bold flex items-center gap-2"
          >
            <UserPlus size={18} /> New User
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5">
          {['All', 'Unassigned', 'Assigned'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                filter === tab
                  ? 'border-gray-900 bg-gray-900 text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab} {tab === 'Unassigned' && unassignedCount > 0 && `(${unassignedCount})`}
            </button>
          ))}
        </div>

        {/* User List */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-semibold">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center my-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Users size={30} />
            </div>
            <h3 className="font-bold text-lg text-gray-700">No users found</h3>
            <p className="text-sm text-gray-400 mt-1">Create your first user using the button above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const roleConfig = ROLE_COLORS[user.role] || ROLE_COLORS.Hukum;
              const RIcon = roleConfig.icon;
              const initials = user.display_name
                ? user.display_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
                : '?';
              const assignedFamilyName = user.family_id ? familyMap[user.family_id] || 'Assigned Family' : null;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border-2 border-gray-900 shadow-[3px_3px_0px_rgba(0,0,0,1)] p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-full ${roleConfig.bg} border-2 ${roleConfig.border} flex items-center justify-center flex-shrink-0 overflow-hidden`}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`font-black text-sm ${roleConfig.text}`}>{initials}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{user.display_name || 'Unnamed User'}</h3>
                      <p className="text-xs text-gray-500 font-semibold truncate">{user.email}</p>

                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${roleConfig.bg} ${roleConfig.text}`}>
                          <RIcon size={11} />
                          {user.role}
                        </span>

                        {assignedFamilyName ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700">
                            🏠 {assignedFamilyName}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onUserCreated={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
