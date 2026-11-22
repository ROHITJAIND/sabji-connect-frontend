import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { Camera, ArrowLeft, Check, X, Edit2, LogOut, User } from 'lucide-react';
import { uploadImage } from '../utils/storage';
import { authApi } from '../api';

export default function ProfilePage() {
  const { currentUser, userRole, userDisplayName, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(userDisplayName || currentUser?.display_name || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.avatar_url || currentUser?.avatarUrl || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [newPhotoURL, setNewPhotoURL] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.display_name || currentUser.displayName || currentUser.email.split('@')[0]);
      setPhotoURL(currentUser.avatar_url || currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await authApi.updateMe({ display_name: newName.trim() });
      setDisplayName(newName.trim());
      setIsEditingName(false);
      if (refreshProfile) await refreshProfile();
    } catch (e) {
      console.error('Error saving name:', e);
    }
    setSaving(false);
  };

  const handleSavePhoto = async () => {
    setSaving(true);
    try {
      let finalURL = newPhotoURL;
      if (imageFile) {
        finalURL = await uploadImage(imageFile, 'profiles');
      }
      await authApi.updateMe({ avatar_url: finalURL.trim() });
      setPhotoURL(finalURL.trim());
      setIsEditingPhoto(false);
      setImageFile(null);
      if (refreshProfile) await refreshProfile();
    } catch (e) {
      console.error('Error saving photo:', e);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  // Role-based styling
  const roleColors = {
    Admin: { bg: 'bg-[#4a45ff]', text: 'text-white', emoji: '👑', label: 'Administrator' },
    Hukum: { bg: 'bg-[#b3f08c]', text: 'text-black', emoji: '📋', label: 'Order Manager' },
    Sethji: { bg: 'bg-[#ffff00]', text: 'text-black', emoji: '💰', label: 'Store Owner' },
  };

  const roleStyle = roleColors[userRole] || roleColors.Admin;

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (!currentUser) return null;

  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      <div className="max-w-lg mx-auto px-4">

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-6 font-bold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={24} strokeWidth={3} /> Back to Dashboard
        </button>

        {/* Profile Card */}
        <div className="bg-white border-4 border-gray-900 rounded-[32px] shadow-[6px_6px_0px_rgba(0,0,0,1)] overflow-hidden">

          {/* Header Banner */}
          <div className={`${roleStyle.bg} h-28 relative`}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center -mt-16 px-6 pb-6">
            
            {/* Avatar */}
            <div 
              onClick={() => { setNewPhotoURL(photoURL); setIsEditingPhoto(true); }}
              className="w-32 h-32 rounded-full border-[6px] border-white shadow-lg bg-gray-200 flex items-center justify-center cursor-pointer relative overflow-hidden group"
            >
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-gray-500">{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={32} className="text-white" />
              </div>
            </div>

            {/* Display Name */}
            <div className="mt-4 flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="p-2 border-4 border-gray-900 rounded-xl font-bold text-lg text-center outline-none focus:ring-4 focus:ring-[#b3f08c]"
                    style={{ boxSizing: 'border-box', maxWidth: '200px' }}
                    autoFocus
                  />
                  <button onClick={handleSaveName} disabled={saving} className="bg-[#b3f08c] text-black p-2 rounded-xl border-2 border-gray-900"><Check size={20} /></button>
                  <button onClick={() => setIsEditingName(false)} className="bg-gray-200 text-gray-800 p-2 rounded-xl border-2 border-gray-900"><X size={20} /></button>
                </div>
              ) : (
                <>
                  <h2 className="font-black text-3xl text-gray-900">{displayName}</h2>
                  <button 
                    onClick={() => { setNewName(displayName); setIsEditingName(true); }}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Edit2 size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Role Badge */}
            <div className={`mt-3 ${roleStyle.bg} ${roleStyle.text} px-6 py-2 rounded-full font-black text-sm border-[3px] border-gray-900 shadow-[3px_3px_0px_rgba(0,0,0,1)]`}>
              {roleStyle.emoji} {roleStyle.label}
            </div>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="bg-white border-4 border-gray-900 rounded-[32px] shadow-[4px_4px_0px_rgba(0,0,0,1)] mt-6 p-6">
          <h3 className="font-black text-xl text-gray-900 mb-4 border-b-4 border-gray-900 pb-2">Account Details</h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-500 text-sm">Email</span>
              <span className="font-extrabold text-gray-900">{currentUser.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-500 text-sm">Role</span>
              <span className="font-extrabold text-gray-900">{userRole}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-500 text-sm">User ID</span>
              <span className="font-extrabold text-gray-600 text-xs truncate max-w-[180px]">{currentUser.id || currentUser.uid}</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 btn-3d bg-red-500 text-white py-4 flex items-center justify-center gap-3 font-black text-xl tracking-wide"
        >
          <LogOut size={24} /> LOGOUT
        </button>

      </div>

      {/* Photo URL Edit Modal */}
      {isEditingPhoto && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            padding: '20px',
            boxSizing: 'border-box',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditingPhoto(false); }}
        >
          <div style={{ width: '100%', maxWidth: '360px', boxSizing: 'border-box', overflow: 'hidden' }} className="flex flex-col gap-4 p-5 bg-white border-4 border-gray-900 rounded-[32px] shadow-[8px_8px_0px_rgba(0,0,0,1)] animate-fade-in">
            
            <div className="flex justify-between items-center border-b-4 border-gray-900 pb-3">
              <h2 className="font-black text-xl text-gray-900">PROFILE PICTURE</h2>
              <button onClick={() => setIsEditingPhoto(false)} className="text-gray-500 hover:text-red-500"><X size={28} strokeWidth={3} /></button>
            </div>

            {/* Preview */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-gray-900 bg-gray-200 flex items-center justify-center overflow-hidden">
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                ) : newPhotoURL ? (
                  <img src={newPhotoURL} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <User size={40} className="text-gray-400" />
                )}
              </div>
            </div>

            <div>
              <label className="block mb-2 font-bold text-gray-900 text-sm">Upload Photo</label>
              <input 
                type="file" accept="image/*"
                onChange={e => setImageFile(e.target.files[0])}
                className="w-full p-2 border-4 border-gray-900 rounded-2xl bg-white font-bold text-sm outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#b3f08c] file:text-black file:font-bold hover:file:bg-[#92d06b]"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={() => { setNewPhotoURL(''); setImageFile(null); }} className="btn-3d flex-1 py-3 bg-gray-200 text-gray-800 font-black">REMOVE</button>
              <button onClick={handleSavePhoto} disabled={saving} className="btn-3d flex-1 py-3 bg-[#b3f08c] text-black font-black">{saving ? 'SAVING...' : 'SAVE'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
