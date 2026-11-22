import { useAuth } from '../../context/AuthContext';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, LogOut, Users, ChevronRight, UsersRound, PackagePlus, Library, BarChart3 } from 'lucide-react';

const ROLE_COLORS = {
  Admin: 'bg-purple-100 text-purple-700',
  Sethji: 'bg-orange-100 text-orange-700',
  Hukum: 'bg-blue-100 text-blue-700',
};

export default function Sidebar({ isOpen, onClose, onSelectMember }) {
  const { currentUser, userRole, userFamilyId, userDisplayName, logout } = useAuth();
  const { members } = useFamilyMembers(userFamilyId);
  const navigate = useNavigate();

  const photoURL = currentUser?.avatar_url || currentUser?.avatarUrl || '';
  const displayName = userDisplayName || currentUser?.display_name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';

  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (userRole ? userRole[0] : '?');

  // Other family members (exclude self and Sethjis)
  const otherMembers = (members || []).filter(m => (m.id || m.uid) !== currentUser?.uid && (m.id || m.uid) !== currentUser?.id && m.role !== 'Sethji');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Header with profile */}
            <div className="bg-gradient-to-br from-orange-400 to-amber-500 px-5 pt-8 pb-6">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>

              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden mb-3">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xl font-black">{initials}</span>
                )}
              </div>

              <h3 className="text-white font-bold text-lg leading-tight">
                {displayName || 'User'}
              </h3>
              <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${ROLE_COLORS[userRole] || 'bg-gray-100 text-gray-600'}`}>
                {userRole}
              </span>
            </div>

            {/* Menu items */}
            <div className="flex-1 overflow-y-auto py-4">
              {/* Profile */}
              <button
                onClick={() => { onClose(); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <User size={18} className="text-blue-500" />
                </div>
                <span className="font-semibold text-gray-700">My Profile</span>
                <ChevronRight size={16} className="text-gray-300 ml-auto" />
              </button>

              {/* Analytics */}
              <button
                onClick={() => { onClose(); navigate('/analytics'); }}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                  <BarChart3 size={18} className="text-emerald-500" />
                </div>
                <span className="font-semibold text-gray-700">Analytics</span>
                <ChevronRight size={16} className="text-gray-300 ml-auto" />
              </button>

              {/* Admin-only links */}
              {userRole === 'Admin' && (
                <>
                  <button
                    onClick={() => { onClose(); navigate('/admin'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Library size={18} className="text-indigo-500" />
                    </div>
                    <span className="font-semibold text-gray-700">Catalog</span>
                    <ChevronRight size={16} className="text-gray-300 ml-auto" />
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/family'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center">
                      <UsersRound size={18} className="text-purple-500" />
                    </div>
                    <span className="font-semibold text-gray-700">Family</span>
                    <ChevronRight size={16} className="text-gray-300 ml-auto" />
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/users'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                      <Users size={18} className="text-amber-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Users</span>
                    <ChevronRight size={16} className="text-gray-300 ml-auto" />
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/requests'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center">
                      <PackagePlus size={18} className="text-orange-500" />
                    </div>
                    <span className="font-semibold text-gray-700">Item Requests</span>
                    <ChevronRight size={16} className="text-gray-300 ml-auto" />
                  </button>
                </>
              )}

              {/* Family members */}
              {userRole !== 'Admin' && otherMembers.length > 0 && (
                <div className="mt-4">
                  <div className="px-5 mb-2 flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Family Members</span>
                  </div>
                  {otherMembers.map(member => {
                    const mName = member.displayName || member.display_name || member.email?.split('@')[0] || 'Member';
                    const memberInitials = mName
                      ? mName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                      : (member.role ? member.role[0] : '?');

                    return (
                      <button
                        key={member.id || member.uid}
                        onClick={() => {
                          onClose();
                          if (onSelectMember) onSelectMember(member);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                          {member.avatarUrl || member.photoURL ? (
                            <img src={member.avatarUrl || member.photoURL} alt={mName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500 text-sm font-bold">{memberInitials}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-700 text-sm truncate">
                            {mName}
                          </div>
                          <span className={`text-xs font-bold uppercase ${ROLE_COLORS[member.role] || 'text-gray-400'} bg-transparent`}>
                            {member.role}
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
