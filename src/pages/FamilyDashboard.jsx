import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import MemberOrdersOverlay from '../components/MemberOrdersOverlay';
import { useFamilies } from '../hooks/useFamilies';
import { useFamilyMembers } from '../hooks/useFamilyMembers';
import { authApi, familiesApi } from '../api';


import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit2, Trash2, User, Shield, ShoppingCart, UserPlus, ChevronRight, ArrowLeft, Save, Eye, EyeOff, Home, Users, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../utils/storage';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
const ROLE_COLORS = {
  Admin:  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', gradient: 'from-purple-500 to-violet-600' },
  Sethji: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', gradient: 'from-orange-500 to-amber-600' },
  Hukum:  { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   gradient: 'from-blue-500 to-indigo-600' },
};

const ROLE_ICONS = { Admin: Shield, Sethji: ShoppingCart, Hukum: User };

/* â”€â”€â”€ Member Card â”€â”€â”€ */
function MemberCard({ member, onEdit, onDelete, onViewOrders }) {
  const colors = ROLE_COLORS[member.role] || ROLE_COLORS.Hukum;
  const initials = member.displayName
    ? member.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  const RIcon = ROLE_ICONS[member.role] || User;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <div className={`w-14 h-14 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
          {member.photoURL ? (
            <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className={`${colors.text} font-black text-lg`}>{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 truncate">{member.displayName || 'Unnamed'}</h3>
          <p className="text-xs text-gray-400 font-semibold truncate">@{member.username || member.email?.split('@')[0]}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <RIcon size={12} className={colors.text} />
            <span className={`text-xs font-bold uppercase tracking-wide ${colors.text}`}>{member.role}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {member.role === 'Hukum' && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onViewOrders(member)}
              className="w-9 h-9 rounded-full bg-purple-50 hover:bg-purple-100 flex items-center justify-center transition-colors">
              <Eye size={16} className="text-purple-500" />
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(member)}
            className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
            <Edit2 size={16} className="text-blue-500" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(member)}
            className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
            <Trash2 size={16} className="text-red-500" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* â”€â”€â”€ Image Cropper Modal â”€â”€â”€ */
function ImageCropperModal({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
      alert('Failed to crop image');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="relative flex-1 w-full">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={handleCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      <div className="p-4 bg-white flex flex-col gap-4 pb-8">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-500">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600">Cancel</button>
          <button type="button" onClick={handleConfirm} className="flex-1 py-3 bg-orange-500 font-bold rounded-xl text-white shadow-lg">Crop & Save</button>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ Add/Edit Member Form â”€â”€â”€ */
function MemberForm({ familyId, existingMember, onClose, onSaved }) {
  const isEditing = !!existingMember;
  const [displayName, setDisplayName] = useState(existingMember?.displayName || '');
  const [username, setUsername] = useState(existingMember?.email?.split('@')[0] || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(existingMember?.role || 'Hukum');
  const [photoURL, setPhotoURL] = useState(existingMember?.photoURL || '');
  const [imageFile, setImageFile] = useState(null);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Use createObjectURL instead of FileReader for much better mobile memory safety
      setImageToCrop(URL.createObjectURL(file));
      // DO NOT clear e.target.value here. On Android Chrome, clearing the input immediately
      // destroys the native file descriptor for camera captures, breaking the blob URL!
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let finalPhotoURL = photoURL;
      if (imageFile) {
        finalPhotoURL = await uploadImage(imageFile, 'profiles');
      }

      if (isEditing) {
        await updateDoc(doc(db, 'users', existingMember.uid), {
          displayName: displayName.trim(), role, photoURL: finalPhotoURL.trim(),
        });
      } else {
        if (!username.trim() || !password || password.length < 6) {
          setError('Username and password (min 6 chars) are required.');
          setLoading(false);
          return;
        }

        const cleanUsername = username.trim().replace(/\s+/g, '').toLowerCase();
        const syntheticEmail = `${cleanUsername}@sabjiconnect.com`;

        const cred = await createUserWithEmailAndPassword(secondaryAuth, syntheticEmail, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: syntheticEmail,
          username: cleanUsername,
          displayName: displayName.trim(),
          role,
          photoURL: finalPhotoURL.trim(),
          familyId: familyId,
          createdAt: new Date().toISOString(),
        });
        await signOut(secondaryAuth);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('This username is already taken.');
      else if (err.code === 'auth/weak-password') setError('Password must be at least 6 characters.');
      else if (err.code === 'auth/invalid-email') setError('Invalid username format.');
      else setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-4 border-b border-gray-200">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Member' : 'Add New Member'}</h2>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={18} /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
            <div className="flex gap-2">
              {['Hukum', 'Sethji'].map(r => {
                const c = ROLE_COLORS[r]; const RI = ROLE_ICONS[r];
                return (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                      role === r ? `${c.bg} ${c.text} ${c.border}` : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}><RI size={16} />{r}</button>
                );
              })}
            </div>
          </div>
          {/* Display Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Rohit Jain" required
              className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-orange-400 focus:outline-none transition-colors" />
          </div>
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Profile Photo <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="file" accept="image/*" onChange={handleFileChange}
              className="w-full p-2 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-orange-400 focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-orange-100 file:text-orange-700 file:font-bold hover:file:bg-orange-200" />
            {(imageFile || photoURL) && (
              <div className="mt-2 w-16 h-16 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center relative group">
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                ) : photoURL ? (
                  <img src={photoURL} alt="Current" className="w-full h-full object-cover" />
                ) : <ImageIcon className="text-gray-400" />}
                
                {imageFile && (
                  <button 
                    type="button" 
                    onClick={() => setImageFile(null)} 
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Username */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="e.g. rohit" disabled={isEditing} required={!isEditing}
              className={`w-full p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-orange-400 focus:outline-none transition-colors ${isEditing ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`} />
            {isEditing && <p className="text-xs text-gray-400 mt-1">Username cannot be changed.</p>}
          </div>
          {/* Password */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters" required minLength={6}
                  className="w-full p-3 pr-12 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-orange-400 focus:outline-none transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 font-semibold">{error}</p>
            </div>
          )}
          <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all ${
              loading ? 'bg-gray-300 cursor-not-allowed' : `bg-gradient-to-r ${ROLE_COLORS[role]?.gradient || 'from-blue-500 to-indigo-600'} hover:opacity-90`
            }`}>
            {loading ? 'Saving...' : isEditing ? <><Save size={20} /> Update Member</> : <><UserPlus size={20} /> Create {role}</>}
          </motion.button>
        </form>
      </motion.div>

      {/* Render Cropper Modal conditionally */}
      {imageToCrop && (
        <ImageCropperModal 
          imageSrc={imageToCrop} 
          onCropComplete={(croppedFile) => {
            setImageFile(croppedFile);
            setImageToCrop(null);
          }}
          onCancel={() => setImageToCrop(null)} 
        />
      )}
    </motion.div>
  );
}

/* â”€â”€â”€ Create / Edit Family Modal â”€â”€â”€ */
function FamilyNameModal({ existingFamily, onClose, onSave }) {
  const [name, setName] = useState(existingFamily?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSave(name.trim());
    setLoading(false);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{existingFamily ? 'Rename Family' : 'Create New Family'}</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Jain Family" autoFocus required
            className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-orange-400 focus:outline-none transition-colors mb-4" />
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
            <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-90 transition-all disabled:opacity-50">
              {loading ? 'Saving...' : existingFamily ? 'Rename' : 'Create'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* â”€â”€â”€ Family Detail (members inside a family) â”€â”€â”€ */
function FamilyDetail({ family, onBack }) {
  const { members, loading } = useFamilyMembers(family.id);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [viewingOrdersFor, setViewingOrdersFor] = useState(null);

  const hukums = members.filter(m => m.role === 'Hukum');
  const sethjis = members.filter(m => m.role === 'Sethji');

  const handleDelete = async (member) => {
    if (!confirm(`Remove ${member.displayName || member.username || member.email} from this family?`)) return;
    try {
      await deleteDoc(doc(db, 'users', member.uid));
    } catch (e) {
      alert('Failed to delete: ' + e.message);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="py-5">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
          className="flex items-center gap-2 mb-3 text-gray-500 hover:text-gray-700 font-semibold text-sm transition-colors">
          <ArrowLeft size={18} /> Back to Families
        </motion.button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-200 flex items-center justify-center">
            <Home size={22} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{family.name}</h1>
            <p className="text-sm text-gray-400 font-semibold">{members.length} members Â· {hukums.length} Hukum Â· {sethjis.length} Sethji</p>
          </div>
        </div>
      </div>

      {/* Members */}
      {loading ? (
        <div className="text-center py-20 text-gray-400"><p className="font-semibold">Loading...</p></div>
      ) : members.length > 0 ? (
        <div className="space-y-3">
          {members.map(member => (
            <MemberCard key={member.uid} member={member}
              onEdit={(m) => { setEditingMember(m); setShowForm(true); }}
              onDelete={handleDelete}
              onViewOrders={(m) => setViewingOrdersFor(m)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">ðŸ‘¥</p>
          <p className="font-semibold text-lg">No members yet</p>
          <p className="text-sm mt-1">Add Hukums and Sethjis to this family</p>
        </div>
      )}

      {/* Add Member FAB */}
      <motion.button whileTap={{ scale: 0.9 }}
        onClick={() => { setEditingMember(null); setShowForm(true); }}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700
          text-white rounded-full shadow-xl flex items-center justify-center transition-colors">
        <UserPlus size={24} />
      </motion.button>

      <AnimatePresence>
        {showForm && (
          <MemberForm
            familyId={family.id}
            existingMember={editingMember}
            onClose={() => { setShowForm(false); setEditingMember(null); }}
            onSaved={() => {}}
          />
        )}
        {viewingOrdersFor && (
          <MemberOrdersOverlay
            member={viewingOrdersFor}
            onClose={() => setViewingOrdersFor(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* â”€â”€â”€ Main Family Dashboard â”€â”€â”€ */
export default function FamilyDashboard() {
  const { families, loading, createFamily, updateFamily, deleteFamily } = useFamilies();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);

  const handleCreateFamily = async (name) => {
    await createFamily(name);
  };

  const handleRenameFamily = async (name) => {
    if (editingFamily) {
      await updateFamily(editingFamily.id, { name });
    }
  };

  const handleDeleteFamily = async (family) => {
    if (!confirm(`Delete "${family.name}" and all its data? This cannot be undone.`)) return;
    await deleteFamily(family.id);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Navbar onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 overflow-y-auto pb-28 px-4 max-w-2xl mx-auto w-full">

        {!selectedFamily ? (
        /* â•â•â• FAMILY LIST VIEW â•â•â• */
        <>
          <div className="py-5">
            <div className="flex items-center gap-3 mb-1">
              <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors"><ArrowLeft size={20} /></a>
              <h1 className="text-2xl font-black text-gray-900">Families</h1>
            </div>
            <p className="text-sm text-gray-400 font-semibold ml-8">{families.length} famil{families.length !== 1 ? 'ies' : 'y'}</p>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400"><p className="font-semibold">Loading...</p></div>
          ) : families.length > 0 ? (
            <div className="space-y-3">
              {families.map((family, idx) => (
                <motion.div key={family.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden hover:border-orange-300 hover:shadow-md transition-all">
                  <button onClick={() => setSelectedFamily(family)}
                    className="w-full flex items-center gap-4 p-5 text-left">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-200 flex items-center justify-center flex-shrink-0">
                      <Home size={24} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-lg truncate">{family.name}</h3>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5">
                        Tap to manage members
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
                  </button>
                  {/* Quick action buttons */}
                  <div className="flex border-t border-gray-100">
                    <button onClick={(e) => { e.stopPropagation(); setEditingFamily(family); setShowFamilyModal(true); }}
                      className="flex-1 py-2.5 text-sm font-semibold text-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
                      <Edit2 size={14} /> Rename
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteFamily(family); }}
                      className="flex-1 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-3">ðŸ </p>
              <p className="font-semibold text-lg">No families yet</p>
              <p className="text-sm mt-1">Create your first family to get started</p>
            </div>
          )}

          {/* Create Family FAB */}
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { setEditingFamily(null); setShowFamilyModal(true); }}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700
              text-white rounded-full shadow-xl flex items-center justify-center transition-colors">
            <Plus size={28} strokeWidth={2.5} />
          </motion.button>
        </>
        ) : (
        /* â•â•â• FAMILY DETAIL VIEW â•â•â• */
        <FamilyDetail family={selectedFamily} onBack={() => setSelectedFamily(null)} />
        )}
      </div>

      {/* Family Name Modal */}
      <AnimatePresence>
        {showFamilyModal && (
          <FamilyNameModal
            existingFamily={editingFamily}
            onClose={() => { setShowFamilyModal(false); setEditingFamily(null); }}
            onSave={editingFamily ? handleRenameFamily : handleCreateFamily}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

