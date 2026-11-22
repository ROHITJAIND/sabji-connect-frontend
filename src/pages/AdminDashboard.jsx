import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useCatalog } from '../hooks/useCatalog';
import { Trash2, Edit2, Check, X, Search, Plus, Filter, MoreVertical, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../utils/storage';

const MASTER_UNITS = ['kg', 'grams', 'pieces', 'packets', 'bunches', 'liters', 'ml', 'boxes', 'dozens', 'bottles', 'plates'];

function getEmojiForName(name) {
  const n = name.toLowerCase();
  if (n.includes('tomato')) return '🍅';
  if (n.includes('potato')) return '🥔';
  if (n.includes('onion')) return '🧅';
  if (n.includes('carrot')) return '🥕';
  if (n.includes('lemon')) return '🍋';
  if (n.includes('cabbage')) return '🥬';
  if (n.includes('apple')) return '🍎';
  if (n.includes('banana')) return '🍌';
  if (n.includes('milk')) return '🥛';
  if (n.includes('bread')) return '🍞';
  if (n.includes('egg')) return '🥚';
  if (n.includes('rice')) return '🍚';
  if (n.includes('dal') || n.includes('lentil')) return '🥣';
  return '📦';
}

function CatalogItem({ item, deleteItem, updateItem }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [allowedUnits, setAllowedUnits] = useState(item.allowedUnits || ['pieces']);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isEditing) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isEditing]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setUploading(true);
    try {
      let imageURL = item.imageURL;
      if (imageFile) {
        imageURL = await uploadImage(imageFile, 'catalog');
      }
      await updateItem(item.id, { name: name.trim(), category, imageURL, allowedUnits });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setName(item.name);
    setCategory(item.category);
    setAllowedUnits(item.allowedUnits || ['pieces']);
    setImageFile(null);
    setIsEditing(false);
  };

  // Category-based colors for the squircle
  let squircleColor = "bg-[#4a45ff] text-white"; // Default Blue (Household)
  if (item.category === "Vegetables") squircleColor = "bg-[#b3f08c] text-black"; // Green
  if (item.category === "Fruits") squircleColor = "bg-[#ffff00] text-black"; // Yellow
  if (item.category === "Packaged") squircleColor = "bg-[#ff6b2b] text-white"; // Orange
  if (item.category === "Cosmetics") squircleColor = "bg-[#00e5ff] text-black"; // Cyan
  if (item.category === "Others") squircleColor = "bg-[#ff33ff] text-white"; // Pink

  const emoji = getEmojiForName(item.name);

  return (
    <>
      {/* Regular Card */}
      <div className="bg-white border-4 border-gray-900 rounded-[32px] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-4 p-5 transition-all w-full relative">
      <div className="flex flex-row items-start justify-between">
        
        <div className="flex flex-row items-center gap-4 flex-1 overflow-hidden">
          {/* Zone A (Leading Edge / Left) - Icon Squircle */}
          <div className={`flex-shrink-0 w-[64px] h-[64px] rounded-[20px] flex items-center justify-center text-3xl sm:text-4xl shadow-sm border-2 border-gray-900 ${squircleColor} overflow-hidden`}>
            {item.imageURL ? (
              <img src={item.imageURL} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500 font-bold text-xl">{(item.name || '?')[0].toUpperCase()}</span>
            )}
          </div>
          
          {/* Zone B (Body / Center Stack) */}
          <div className="flex-1 flex flex-col justify-center text-left overflow-hidden">
            <div className="font-extrabold text-xl sm:text-2xl text-gray-900 leading-tight truncate mb-1">{item.name}</div>
            <div className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider truncate mb-2">{item.category} • Master Catalog</div>
          </div>
        </div>
        
        {/* Zone D (Trailing Edge / Right) - Edit Button */}
        <div className="flex-shrink-0 ml-3 relative">
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 w-14 h-14 sm:w-16 sm:h-16 rounded-[16px] flex items-center justify-center transition-colors border-[3px] border-gray-300 shadow-sm"
          >
            <MoreVertical size={32} strokeWidth={3} className="text-gray-700" />
          </button>
        </div>
      </div>
    </div>

    {/* Popup Modal - portaled to body with inline styles for Android */}
    {isEditing && createPortal(
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
          overflowY: 'auto',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
      >
        <div style={{ width: '100%', maxWidth: '360px', boxSizing: 'border-box' }} className="flex flex-col gap-4 p-5 bg-white border-4 border-gray-900 rounded-[32px] shadow-[8px_8px_0px_rgba(0,0,0,1)] animate-fade-in">
          
          <div className="flex justify-between items-center border-b-4 border-gray-900 pb-3">
            <h2 className="font-black text-2xl text-gray-900">EDIT ITEM</h2>
            <button onClick={handleCancel} className="text-gray-500 hover:text-red-500"><X size={28} strokeWidth={3} /></button>
          </div>
          
          <div className="flex flex-col gap-4 mt-2" style={{ width: '100%', boxSizing: 'border-box' }}>
            <div>
              <label className="block mb-2 font-bold text-gray-900 text-sm">Item Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={{ boxSizing: 'border-box', maxWidth: '100%' }} className="w-full p-3 border-4 border-gray-900 rounded-2xl font-bold text-gray-900 text-lg outline-none focus:ring-4 focus:ring-[#b3f08c]" required />
            </div>
            
            <div>
              <label className="block mb-2 font-bold text-gray-900 text-sm">Allowed Units</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {MASTER_UNITS.map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setAllowedUnits(prev => prev.includes(u) && prev.length > 1 ? prev.filter(x => x !== u) : [...new Set([...prev, u])])}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-colors ${allowedUnits.includes(u) ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <label className="block mb-2 font-bold text-gray-900 text-sm">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ boxSizing: 'border-box', maxWidth: '100%' }} className="w-full p-3 border-4 border-gray-900 rounded-2xl bg-white font-bold text-gray-900 outline-none focus:ring-4 focus:ring-[#b3f08c]">
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Household">Household</option>
                <option value="Packaged">Packaged</option>
                <option value="Cosmetics">Cosmetics</option>
                <option value="Others">Others</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 font-bold text-gray-900 text-sm">Image</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full p-2 border-4 border-gray-900 rounded-2xl bg-white font-bold text-sm outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#b3f08c] file:text-black file:font-bold hover:file:bg-[#92d06b]" />
              {(imageFile || item.imageURL) && (
                <div className="mt-2 w-16 h-16 rounded-xl border-2 border-gray-900 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : item.imageURL ? (
                    <img src={item.imageURL} alt="Current" className="w-full h-full object-cover" />
                  ) : <ImageIcon />}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 justify-between mt-6">
            <button onClick={() => { deleteItem(item.id); setIsEditing(false); }} className="btn-3d px-6 py-4 bg-red-500 text-white font-black tracking-wide flex-1 flex items-center justify-center gap-2 text-lg" title="Delete" disabled={uploading}><Trash2 size={24} /> DELETE</button>
            <button onClick={handleSave} disabled={uploading} className="btn-3d px-6 py-4 bg-[#b3f08c] text-black font-black tracking-wide flex-1 flex items-center justify-center gap-2 text-lg" title="Save">
              {uploading ? 'SAVING...' : <><Check size={24} /> SAVE</>}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
}

export default function AdminDashboard() {
  const { catalog, addItem, deleteItem, updateItem } = useCatalog();
  
  // Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [allowedUnits, setAllowedUnits] = useState(['pieces']);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  
  const handleMigrate = async () => {
    if (!window.confirm("Run migration to add allowedUnits to all existing items?")) return;
    try {
      for (const item of catalog) {
        if (!item.allowedUnits || item.allowedUnits.length === 0) {
          let defaultUnits = ['pieces'];
          if (item.category === 'Vegetables' || item.category === 'Fruits') {
            defaultUnits = ['kg', 'grams', 'pieces'];
          } else if (item.category === 'Packaged') {
            defaultUnits = ['packets', 'pieces', 'boxes'];
          } else {
            defaultUnits = ['pieces', 'packets'];
          }
          await updateItem(item.id, { allowedUnits: defaultUnits });
        }
      }
      alert("Migration complete!");
    } catch (err) {
      console.error(err);
      alert("Migration failed.");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedName = name.trim();
    if (!trimmedName) return;

    // Duplicate Prevention
    const isDuplicate = catalog.some(item => item.name.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      setError(`"${trimmedName}" already exists in the catalog!`);
      return;
    }

    setUploading(true);
    try {
      let imageURL = null;
      if (imageFile) {
        imageURL = await uploadImage(imageFile, 'catalog');
      }

      await addItem({ name: trimmedName, category, imageURL, allowedUnits });
      setAllowedUnits(['pieces']);
      setName('');
      setImageFile(null);
      setShowAddForm(false); // Close form on success
    } catch (err) {
      console.error("Failed to add item:", err);
      setError("Failed to add item or upload image.");
    } finally {
      setUploading(false);
    }
  };

  // Filter Logic
  const filteredCatalog = catalog.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

  return (
    <div className="h-full pb-20 flex flex-col">
      <Navbar onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto px-4 pt-4">
        
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="title-font text-4xl md:text-5xl font-extrabold text-gray-900 text-center drop-shadow-sm">
            Sabji Connect - Admin Catalog
          </h2>

          <button 
            onClick={() => { setShowAddForm(!showAddForm); setError(''); setImageFile(null); }} 
            className="btn-3d btn-green flex items-center gap-2 px-6 py-3 text-lg"
          >
            <Plus size={24}/> Add New Item
          </button>
        </div>

        {/* Add Item Popup Modal */}
        {showAddForm && createPortal(
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
              overflowY: 'auto',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowAddForm(false); setError(''); } }}
          >
            <div style={{ width: '100%', maxWidth: '360px', boxSizing: 'border-box' }} className="flex flex-col gap-4 p-5 bg-white border-4 border-gray-900 rounded-[32px] shadow-[8px_8px_0px_rgba(0,0,0,1)] animate-fade-in">
              
              <div className="flex justify-between items-center border-b-4 border-gray-900 pb-3">
                <h2 className="font-black text-2xl text-gray-900">ADD NEW ITEM</h2>
                <button onClick={() => { setShowAddForm(false); setError(''); setImageFile(null); }} className="text-gray-500 hover:text-red-500"><X size={28} strokeWidth={3} /></button>
              </div>

              {error && <div className="bg-red-500 border-2 border-gray-900 text-white p-3 rounded-xl font-bold">{error}</div>}
              
              <form onSubmit={handleAddItem} className="flex flex-col gap-4">
                <div>
                  <label className="block mb-2 font-bold text-gray-900 text-sm">Item Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tomato" style={{ boxSizing: 'border-box', maxWidth: '100%' }} className="w-full p-3 border-4 border-gray-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-400 font-bold text-lg" required />
                </div>
                <div>
                  <label className="block mb-2 font-bold text-gray-900 text-sm">Allowed Units</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {MASTER_UNITS.map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setAllowedUnits(prev => prev.includes(u) && prev.length > 1 ? prev.filter(x => x !== u) : [...new Set([...prev, u])])}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-colors ${allowedUnits.includes(u) ? 'bg-pink-100 border-pink-500 text-pink-800' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                  <label className="block mb-2 font-bold text-gray-900 text-sm">Category</label>
                  <select value={category} onChange={e => {
                      const cat = e.target.value;
                      setCategory(cat);
                      if (cat === 'Vegetables' || cat === 'Fruits') setAllowedUnits(['kg', 'grams', 'pieces']);
                      else if (cat === 'Packaged') setAllowedUnits(['packets', 'pieces', 'boxes']);
                      else setAllowedUnits(['pieces']);
                    }} style={{ boxSizing: 'border-box', maxWidth: '100%' }} className="w-full p-3 border-4 border-gray-900 rounded-2xl font-bold bg-white cursor-pointer focus:outline-none focus:ring-4 focus:ring-pink-400">
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Household">Household</option>
                    <option value="Packaged">Packaged</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-bold text-gray-900 text-sm">Image</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full p-2 border-4 border-gray-900 rounded-2xl bg-white font-bold text-sm outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#b3f08c] file:text-black file:font-bold hover:file:bg-[#92d06b]" />
                  {imageFile && (
                    <div className="mt-2 w-16 h-16 rounded-xl border-2 border-gray-900 overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <button type="submit" disabled={uploading} className="btn-3d btn-pink mt-2 py-4 text-xl font-black tracking-wide">
                  {uploading ? 'SAVING...' : 'SAVE ITEM'}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] border-4 border-gray-900 mb-4" style={{ boxSizing: 'border-box' }}>
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600" size={24} />
            <input 
              type="text" 
              placeholder="Search Items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ boxSizing: 'border-box' }}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-pink-400 outline-none transition-all font-bold text-lg"
            />
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {[
            { key: 'All', label: '🏠 All', bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-900', inactiveBg: 'bg-white', inactiveText: 'text-gray-700' },
            { key: 'Vegetables', label: '🥬 Vegetables', bg: 'bg-[#b3f08c]', text: 'text-black', border: 'border-[#5a9a30]', inactiveBg: 'bg-green-50', inactiveText: 'text-green-800' },
            { key: 'Fruits', label: '🍎 Fruits', bg: 'bg-[#ffff00]', text: 'text-black', border: 'border-[#c4a800]', inactiveBg: 'bg-yellow-50', inactiveText: 'text-yellow-800' },
            { key: 'Household', label: '🛒 Household', bg: 'bg-[#4a45ff]', text: 'text-white', border: 'border-[#2520b0]', inactiveBg: 'bg-blue-50', inactiveText: 'text-blue-800' },
            { key: 'Packaged', label: '🥫 Packaged', bg: 'bg-[#ff6b2b]', text: 'text-white', border: 'border-[#c04000]', inactiveBg: 'bg-orange-50', inactiveText: 'text-orange-800' },
            { key: 'Cosmetics', label: '💄 Cosmetics', bg: 'bg-[#00e5ff]', text: 'text-black', border: 'border-[#00b8cc]', inactiveBg: 'bg-cyan-50', inactiveText: 'text-cyan-800' },
            { key: 'Others', label: '📦 Others', bg: 'bg-[#ff33ff]', text: 'text-white', border: 'border-[#b020b0]', inactiveBg: 'bg-pink-50', inactiveText: 'text-pink-800' },
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`px-5 py-2.5 rounded-full font-extrabold text-sm border-[3px] transition-all duration-200 ${
                filterCategory === cat.key
                  ? `${cat.bg} ${cat.text} ${cat.border} shadow-lg scale-110`
                  : `${cat.inactiveBg} ${cat.inactiveText} border-gray-200 shadow-sm hover:scale-105`
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Catalog List */}
        <div className="flex-1 overflow-y-auto px-4 max-w-2xl mx-auto w-full pb-6">
          <div className="flex items-center justify-between py-6 border-b-4 border-gray-900 pb-3">
            <h3 className="title-font text-3xl font-bold text-gray-900">Available Items ({filteredCatalog.length})</h3>
          </div>
          
          {/* Vertical list of rectangular tiles */}
          <div className="flex flex-col gap-4 sm:gap-5 p-2 w-full max-w-full">
            {filteredCatalog.map(item => (
              <CatalogItem key={item.id} item={item} deleteItem={deleteItem} updateItem={updateItem} />
            ))}
          </div>
            
          {filteredCatalog.length === 0 && (
            <div className="text-center py-16 text-gray-600 font-bold text-2xl border-4 border-dashed border-gray-400 rounded-3xl mt-4 mx-2">
              {catalog.length === 0 ? "Your catalog is empty. Add some items above!" : "No items found matching your search."}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

