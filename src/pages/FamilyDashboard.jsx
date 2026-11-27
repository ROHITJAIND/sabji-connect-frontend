import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import MemberOrdersOverlay from '../components/MemberOrdersOverlay';
import { useFamilies } from '../hooks/useFamilies';
import { useFamilyMembers } from '../hooks/useFamilyMembers';
import { authApi, familiesApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Edit2,
  Trash2,
  User,
  Shield,
  ShoppingCart,
  UserPlus,
  ChevronRight,
  ArrowLeft,
  Home,
  Users,
  Eye,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROLE_COLORS = {
  Admin:  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', icon: Shield },
  Sethji: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300',  icon: ShoppingCart },
  Hukum:  { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   icon: User },
};

/* ─── Member Card in Family Detail ─── */
function MemberCard({ member, onRemove, onViewOrders }) {
  const colors = ROLE_COLORS[member.role] || ROLE_COLORS.Hukum;
  const RIcon = colors.icon;
  const initials = member.displayName || member.display_name
    ? (member.displayName || member.display_name).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-gray-900 shadow-[3px_3px_0px_rgba(0,0,0,1)] p-4 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-12 h-12 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
          {member.avatarUrl || member.photoURL ? (
            <img src={member.avatarUrl || member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className={`font-black text-sm ${colors.text}`}>{initials}</span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{member.displayName || member.display_name || member.username || 'Unnamed'}</h3>
          <p className="text-xs text-gray-500 font-semibold truncate">@{member.username || member.email}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
              <RIcon size={11} />
              {member.role}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {member.role === 'Hukum' && (
          <button
            onClick={() => onViewOrders(member)}
            className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center border border-purple-200 transition-colors"
            title="View member orders"
          >
            <Eye size={16} />
          </button>
        )}
        <button
          onClick={() => onRemove(member)}
          className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center border border-red-200 transition-colors"
          title="Remove from family"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Add Member Dropdown Modal ─── */
function AddMemberModal({ familyId, currentMemberIds, onClose, onMemberAdded }) {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUsers() {
      try {
        const users = await authApi.adminListUsers(false);
        setAllUsers(users || []);
        // Pre-select first eligible non-admin user
        const eligible = (users || []).filter(u => u.role !== 'Admin' && !currentMemberIds.includes(u.id));
        if (eligible.length > 0) {
          setSelectedUserId(eligible[0].id);
        } else {
          setSelectedUserId('');
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [currentMemberIds]);

  const eligibleUsers = allUsers.filter(u => u.role !== 'Admin' && !currentMemberIds.includes(u.id));
  const selectedUser = eligibleUsers.find(u => u.id === selectedUserId);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a user to add');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await familiesApi.addMember(familyId, selectedUserId);
      onMemberAdded();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add user to family');
    } finally {
      setSubmitting(false);
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
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b-2 border-gray-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <UserPlus size={20} />
            </div>
            <h2 className="title-font text-xl font-black text-gray-900">Add Member to Family</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500 font-semibold">Loading available users...</div>
        ) : eligibleUsers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 font-bold mb-4">No available users to add!</p>
            <p className="text-xs text-gray-400 mb-5">
              All existing users are already members of this family. Please create a new user in the User Management section first.
            </p>
            <button
              onClick={() => { onClose(); navigate('/users'); }}
              className="btn-3d bg-orange-500 text-white px-5 py-2.5 font-bold text-sm w-full"
            >
              Go to User Management
            </button>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Select User from System</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                required
                className="w-full p-3 rounded-xl border-2 border-gray-900 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                {eligibleUsers.map(u => {
                  const fCount = u.family_ids ? u.family_ids.length : (u.family_id ? 1 : 0);
                  return (
                    <option key={u.id} value={u.id}>
                      {u.display_name} ({u.role}) · {fCount > 0 ? `[Member of ${fCount} ${fCount === 1 ? 'family' : 'families'}]` : '[Unassigned]'}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 mt-2 font-medium">
                💡 A user can belong to multiple families. Admins have access to all families and cannot be assigned to one.
              </p>
            </div>

            {selectedUser && (
              <div className="p-3 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">User Role</p>
                  <p className="text-sm font-bold text-gray-900">{selectedUser.display_name}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 border border-orange-200">
                  {selectedUser.role}
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 btn-3d bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add to Family'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Create Family Modal ─── */
function CreateFamilyModal({ onClose, onFamilyCreated }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');
    try {
      await familiesApi.create(name.trim());
      onFamilyCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create family');
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
        className="bg-white rounded-3xl border-4 border-gray-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b-2 border-gray-200 mb-4">
          <h3 className="title-font text-lg font-black text-gray-900">Create New Family</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Family Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Shah Family"
              autoFocus
              required
              className="w-full p-3 rounded-xl border-2 border-gray-900 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-3d bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ─── Edit Family Modal ─── */
function EditFamilyModal({ family, onClose, onFamilyUpdated }) {
  const [name, setName] = useState(family?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Family name is required');
      return;
    }

    setLoading(true);
    try {
      await familiesApi.update(family.id, name.trim());
      onFamilyUpdated({ ...family, name: name.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update family');
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
        className="bg-white rounded-3xl border-4 border-gray-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b-2 border-gray-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Edit2 size={16} />
            </div>
            <h3 className="title-font text-lg font-black text-gray-900">Edit Family</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Family Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              className="w-full p-3 rounded-xl border-2 border-gray-900 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-3d bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ─── Family Detail View (Members in a selected Family) ─── */
function FamilyDetail({ family, onBack, onFamilyUpdated, onDeleteFamily }) {
  const [currentFamily, setCurrentFamily] = useState(family);
  const { members, loading, refreshMembers } = useFamilyMembers(currentFamily.id);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditFamilyModal, setShowEditFamilyModal] = useState(false);
  const [viewingOrdersFor, setViewingOrdersFor] = useState(null);

  useEffect(() => {
    setCurrentFamily(family);
  }, [family]);

  const handleRemoveMember = async (member) => {
    const memberName = member.displayName || member.display_name || member.username || member.email;
    if (!confirm(`Remove ${memberName} from ${currentFamily.name}? They will become an unassigned user.`)) return;

    try {
      await familiesApi.removeMember(currentFamily.id, member.id || member.uid);
      await refreshMembers();
    } catch (err) {
      alert('Failed to remove member: ' + err.message);
    }
  };

  const handleFamilyRenamed = (updated) => {
    setCurrentFamily(updated);
    if (onFamilyUpdated) onFamilyUpdated(updated);
  };

  const currentMemberIds = (members || []).map(m => m.id || m.uid);

  return (
    <>
      {/* Header */}
      <div className="pt-4 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900 font-bold text-sm transition-colors"
        >
          <ArrowLeft size={18} /> Back to Families
        </button>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 border-2 border-orange-300 flex items-center justify-center text-orange-600 shadow-sm">
              <Home size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="title-font text-2xl font-black text-gray-900">{currentFamily.name}</h1>
                <button
                  onClick={() => setShowEditFamilyModal(true)}
                  className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center border border-blue-200 transition-colors"
                  title="Rename Family"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => onDeleteFamily(currentFamily)}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center border border-red-200 transition-colors"
                  title="Delete Family"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="text-xs font-bold text-gray-500">
                {members.length} {members.length === 1 ? 'member' : 'members'} in family
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddMemberModal(true)}
            className="btn-3d bg-orange-500 text-white px-4 py-2.5 text-sm font-bold flex items-center gap-2"
          >
            <UserPlus size={18} /> Add Member
          </button>
        </div>
      </div>

      {/* Member List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 font-semibold">Loading family members...</div>
      ) : members.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center my-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Users size={30} />
          </div>
          <h3 className="font-bold text-lg text-gray-700">No members yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-4">Add members from your standalone users using the dropdown.</p>
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="btn-3d bg-orange-500 text-white px-5 py-2 font-bold text-sm"
          >
            <UserPlus size={16} className="inline mr-1" /> Add First Member
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => (
            <MemberCard
              key={member.id || member.uid}
              member={member}
              onRemove={handleRemoveMember}
              onViewOrders={m => setViewingOrdersFor(m)}
            />
          ))}
        </div>
      )}

      {/* Add Member Dropdown Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <AddMemberModal
            familyId={currentFamily.id}
            currentMemberIds={currentMemberIds}
            onClose={() => setShowAddMemberModal(false)}
            onMemberAdded={refreshMembers}
          />
        )}
      </AnimatePresence>

      {/* Edit Family Modal */}
      <AnimatePresence>
        {showEditFamilyModal && (
          <EditFamilyModal
            family={currentFamily}
            onClose={() => setShowEditFamilyModal(false)}
            onFamilyUpdated={handleFamilyRenamed}
          />
        )}
      </AnimatePresence>

      {/* Member Orders Overlay */}
      {viewingOrdersFor && (
        <MemberOrdersOverlay
          member={viewingOrdersFor}
          onClose={() => setViewingOrdersFor(null)}
        />
      )}
    </>
  );
}

/* ─── Main Family Dashboard ─── */
export default function FamilyDashboard() {
  const { families, loading, refreshFamilies, deleteFamily } = useFamilies();
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [showCreateFamilyModal, setShowCreateFamilyModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleDeleteFamily = async (family, e) => {
    if (e) e.stopPropagation();
    if (!confirm(`Delete "${family.name}"? Members inside will become unassigned users.`)) return;

    try {
      await deleteFamily(family.id);
      if (selectedFamily?.id === family.id) {
        setSelectedFamily(null);
      }
    } catch (err) {
      alert('Failed to delete family: ' + err.message);
    }
  };

  const handleFamilyUpdated = (updated) => {
    refreshFamilies();
    if (selectedFamily?.id === updated.id) {
      setSelectedFamily(updated);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50 flex flex-col">
      <Navbar onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="max-w-2xl mx-auto w-full px-4 flex-1">
        {selectedFamily ? (
          <FamilyDetail
            family={selectedFamily}
            onBack={() => setSelectedFamily(null)}
            onFamilyUpdated={handleFamilyUpdated}
            onDeleteFamily={handleDeleteFamily}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between gap-4 pt-6 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 border-2 border-orange-300 flex items-center justify-center text-orange-600 shadow-sm">
                  <Home size={24} />
                </div>
                <div>
                  <h1 className="title-font text-2xl font-black text-gray-900">Family Management</h1>
                  <p className="text-sm font-semibold text-gray-500">Create & manage family groups</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateFamilyModal(true)}
                className="btn-3d bg-orange-500 text-white px-4 py-2.5 text-sm font-bold flex items-center gap-2"
              >
                <Plus size={18} /> New Family
              </button>
            </div>

            {/* Families List */}
            {loading ? (
              <div className="text-center py-20 text-gray-400 font-semibold">Loading families...</div>
            ) : families.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center my-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Home size={30} />
                </div>
                <h3 className="font-bold text-lg text-gray-700">No families found</h3>
                <p className="text-sm text-gray-400 mt-1 mb-4">Create your first family to start organizing members.</p>
                <button
                  onClick={() => setShowCreateFamilyModal(true)}
                  className="btn-3d bg-orange-500 text-white px-5 py-2 font-bold text-sm"
                >
                  <Plus size={16} className="inline mr-1" /> Create Family
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {families.map(f => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedFamily(f)}
                    className="bg-white rounded-2xl border-2 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] p-4 flex items-center justify-between cursor-pointer hover:bg-orange-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-orange-600 font-bold">
                        <Home size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{f.name}</h3>
                        <p className="text-xs font-semibold text-gray-500">Tap to manage members</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingFamily(f);
                        }}
                        className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center border border-blue-200 transition-colors"
                        title="Edit Family Name"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={e => handleDeleteFamily(f, e)}
                        className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center border border-red-200 transition-colors"
                        title="Delete Family"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Family Modal */}
      <AnimatePresence>
        {showCreateFamilyModal && (
          <CreateFamilyModal
            onClose={() => setShowCreateFamilyModal(false)}
            onFamilyCreated={refreshFamilies}
          />
        )}
      </AnimatePresence>

      {/* Edit Family Modal */}
      <AnimatePresence>
        {editingFamily && (
          <EditFamilyModal
            family={editingFamily}
            onClose={() => setEditingFamily(null)}
            onFamilyUpdated={handleFamilyUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
