import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useOrders } from '../hooks/useOrders';
import confetti from 'canvas-confetti';
import { Check, X, ChevronLeft, ChevronRight, ArrowLeft, Search, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import { requestedItemsApi, ordersApi } from '../api';

import { motion, AnimatePresence } from 'framer-motion';


/* â”€â”€â”€ Date helpers â”€â”€â”€ */
function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date) {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (getDateKey(date) === getDateKey(today)) return "Today's Orders";
  if (getDateKey(date) === getDateKey(yesterday)) return "Yesterday's Orders";
  if (getDateKey(date) === getDateKey(tomorrow)) return "Tomorrow's Orders";
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateSubtitle(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* â”€â”€â”€ Emoji helper â”€â”€â”€ */
import { getEmojiForName } from '../utils/emoji';
import ProductThumb from '../components/ProductThumb';

/* â”€â”€â”€ Main Dashboard â”€â”€â”€ */
export default function SethjiDashboard() {
  const { orders, updateOrder } = useOrders();
  const [combo, setCombo] = useState(0);
  const [expense, setExpense] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState(null); // null = show user cards
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { catalog } = useCatalog();
  const { currentUser, userFamilyId, userDisplayName } = useAuth();
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedItemForAdd, setSelectedItemForAdd] = useState(null);
  const [addFormState, setAddFormState] = useState({ qty: '', unit: '', hukumId: 'on_spot' });
  const [activeOrderIdForAdd, setActiveOrderIdForAdd] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionCustomItems, setSessionCustomItems] = useState([]);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  // Fetch pending requested items so they appear in catalog
  useEffect(() => {
    if (!userFamilyId) return;
    requestedItemsApi.list()
      .then(items => {
        setSessionCustomItems((items || []).map(item => ({
          id: item.id,
          name: item.name,
          category: 'Others',
          isCustom: true
        })));
      })
      .catch(err => console.error('Error fetching requested items:', err));
  }, [userFamilyId]);

  const todayKey = getDateKey(new Date());
  const selectedKey = getDateKey(selectedDate);
  const isToday = selectedKey === todayKey;

  // Get all orders for the selected date
  const ordersForDate = orders.filter(o => {
    if (o.orderDate) return o.orderDate === selectedKey;
    if (o.createdAt) {
      const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return getDateKey(d) === selectedKey;
    }
    return false;
  });

  // Consolidate active orders
  const activeHukums = {};
  const consolidatedItemsMap = {};

  const allActiveForDate = ordersForDate.filter(o => o.status === 'Published' || o.status === 'Fulfilling');
  const allArchivedForDate = ordersForDate.filter(o => o.status === 'Archived');
  
  const uniqueBatches = new Set();
  let archivedDayTotal = 0;
  allArchivedForDate.forEach(o => {
    if (o.batchId) {
      if (!uniqueBatches.has(o.batchId)) {
        uniqueBatches.add(o.batchId);
        archivedDayTotal += Number(o.totalExpense || 0);
      }
    } else {
      archivedDayTotal += Number(o.totalExpense || 0);
    }
  });

  allActiveForDate.forEach(order => {
    const userId = order.createdBy || 'unknown';
    const userName = order.createdByName || 'Unknown';
    activeHukums[userId] = userName;

    order.items.forEach(item => {
      if (!consolidatedItemsMap[item.catalogId]) {
        consolidatedItemsMap[item.catalogId] = {
          catalogId: item.catalogId,
          name: item.name,
          imageURL: item.imageURL,
          unit: item.unit || 'pcs',
          quantities: {},
          totalQty: 0,
          status: 'pending', isSethjiAdded: false,
          lockedBy: item.lockedBy
        };
      }
      const cItem = consolidatedItemsMap[item.catalogId];
      cItem.quantities[userId] = (cItem.quantities[userId] || 0) + (item.qty || 0);
      if (item.qty === null || item.unit === 'Not Defined') {
        cItem.quantities[userId] = cItem.quantities[userId] || null; // null represents Not Defined qty
      }
      cItem.totalQty += (item.qty || 0);
      if (item.isSethjiAdded) cItem.isSethjiAdded = true;
      if (item.status === 'found' || item.status === 'not_found') {
        cItem.status = item.status;
      }
    });
  });

  const consolidatedList = Object.values(consolidatedItemsMap).sort((a, b) => a.name.localeCompare(b.name));
  const activeHukumIds = Object.keys(activeHukums);

  const triggerMarigolds = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#FF9933', '#FFD700', '#FF4500'] });
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
  };

  const handleItemCheck = () => {
    const newCombo = combo + 1;
    setCombo(newCombo);
  };

  
  const handleRemoveSethjiItem = (catalogId) => {
    if (!window.confirm("Remove this newly added item?")) return;
    allActiveForDate.forEach(order => {
      const hasItem = order.items.some(i => i.catalogId === catalogId && i.isSethjiAdded);
      if (hasItem) {
        const newItems = order.items.filter(i => !(i.catalogId === catalogId && i.isSethjiAdded));
        updateOrder(order.id, { items: newItems });
      }
    });
  };

  const handleTickGlobal = (catalogId, status) => {
    let updated = false;
    allActiveForDate.forEach(order => {
      const hasItem = order.items.some(i => i.catalogId === catalogId);
      if (hasItem) {
        const newItems = order.items.map(i => {
          if (i.catalogId === catalogId) return { ...i, status, lockedBy: currentUser.uid, statusUpdatedAt: Date.now() };
          return i;
        });
        updateOrder(order.id, { items: newItems });
        updated = true;
      }
    });
    if (updated && status === 'found') {
      handleItemCheck();
    }
  };

  // Auto transition to fulfilling
  useEffect(() => {
    ordersForDate.forEach(o => {
      if (o.status === 'Published' && o.items.some(i => i.status !== 'pending')) {
        updateOrder(o.id, { status: 'Fulfilling' });
      }
    });
  }, [orders, updateOrder]);

  const handleFinalizeAll = () => {
    const amt = Number(expense['day'] || 0);
    if (amt <= 0) {
      alert('Please enter the total amount spent on this list before finalizing.');
      return;
    }
    triggerMarigolds();
    const batchId = Date.now().toString();
    allActiveForDate.forEach(order => {
      updateOrder(order.id, { status: 'Archived', totalExpense: amt, batchId });
    });
    setExpense(prev => { const next = { ...prev }; delete next['day']; return next; });
  };

  const grandTotal = Object.values(expense).reduce((acc, val) => acc + Number(val || 0), 0);

  // --- ADD ITEM LOGIC ---
  const openDetailsForm = (item) => {
    setSelectedItemForAdd(item);
    setAddFormState({
      qty: '',
      unit: item.allowedUnits?.[0] || (item.category === 'Vegetables' || item.category === 'Fruits' ? 'kg' : 'pieces'),
      hukumId: 'on_spot'
    });
  };

  const confirmAddItemToOrder = async () => {
    if (!selectedItemForAdd) return;
    
    const { qty, unit, hukumId } = addFormState;
    const finalQty = qty === '' ? null : Number(qty);
    const finalUnit = unit === '' ? 'Not Defined' : unit;

    const newItem = {
      catalogId: selectedItemForAdd.id,
      name: selectedItemForAdd.name,
      category: selectedItemForAdd.category,
      imageURL: selectedItemForAdd.imageURL || null,
      unit: finalUnit,
      qty: finalQty,
      status: 'found',
      lockedBy: currentUser.uid,
      isSethjiAdded: true,
      addedAt: Date.now() // using Date.now for simple timestamp
    };

    if (hukumId === 'on_spot') {
      const onSpotOrder = allActiveForDate.find(o => o.createdBy === 'on_spot');
      if (onSpotOrder) {
        updateOrder(onSpotOrder.id, { items: [...onSpotOrder.items, newItem] });
      } else {
        await ordersApi.create(selectedKey);
      }
    } else if (hukumId === 'all_hukums') {
      allActiveForDate.forEach(targetOrder => {
        if (targetOrder.createdBy !== 'on_spot') {
          updateOrder(targetOrder.id, { items: [...targetOrder.items, newItem] });
        }
      });
    } else {
      const targetOrder = allActiveForDate.find(o => o.createdBy === hukumId);
      if (targetOrder) {
        updateOrder(targetOrder.id, { items: [...targetOrder.items, newItem] });
      }
    }

    setSelectedItemForAdd(null);
    setAddModalOpen(false);
    setSearchQuery('');
  };

  const handleAddCustomItem = async () => {
    if (!searchQuery.trim() || isSubmittingCustom) return;
    setIsSubmittingCustom(true);
    try {
      const customId = 'custom_' + Date.now();
      const reqRes = await requestedItemsApi.request(searchQuery.trim());
      const customItem = {
        id: reqRes.id || customId,
        name: searchQuery.trim(),
        category: 'Others',
        isCustom: true
      };
      setSessionCustomItems(prev => [...prev, customItem]);
      openDetailsForm(customItem);
    } catch (err) {
      console.error("Error adding custom item", err);
      alert("Failed to add custom item");
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  const combinedCatalogForAdd = [...catalog, ...sessionCustomItems];
  const filteredCatalogForAdd = combinedCatalogForAdd
    .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 20);

  // Reset selected user when date changes
  useEffect(() => {
    setSelectedUserId(null);
  }, [selectedKey]);

  /* â”€â”€â”€ Navigation â”€â”€â”€ */
  const goToPrevDay = () => setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d; });
  const goToNextDay = () => {
    const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 7);
    if (selectedKey >= getDateKey(maxDate)) return;
    setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d; });
  };
  const goToToday = () => setSelectedDate(new Date());
  const canGoNext = (() => { const m = new Date(); m.setDate(m.getDate() + 7); return selectedKey < getDateKey(m); })();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Navbar onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* â”€â”€â”€ DATE NAVIGATION HEADER â”€â”€â”€ */}
      <div className="px-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between py-4">
          <motion.button whileTap={{ scale: 0.85 }} onClick={goToPrevDay}
            className="w-11 h-11 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft size={22} strokeWidth={2.5} className="text-gray-600" />
          </motion.button>

          <motion.div key={selectedKey} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }} className="text-center cursor-pointer" onClick={goToToday}>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
              {formatDateLabel(selectedDate)}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold mt-0.5">
              {formatDateSubtitle(selectedDate)}
            </p>
            {!isToday && (
              <button className="text-xs font-bold text-green-600 mt-1 hover:underline">â†© Tap to go to Today</button>
            )}
          </motion.div>

          <motion.button whileTap={{ scale: 0.85 }} onClick={goToNextDay} disabled={!canGoNext}
            className={`w-11 h-11 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm transition-colors ${
              canGoNext ? 'hover:bg-gray-50' : 'opacity-30 cursor-not-allowed'
            }`}>
            <ChevronRight size={22} strokeWidth={2.5} className="text-gray-600" />
          </motion.button>
        </div>
      </div>

      {/* â”€â”€â”€ CONTENT â”€â”€â”€ */}
      <div className="flex-1 overflow-y-auto pb-28 px-4 max-w-2xl mx-auto w-full">

        {/* â•â•â• CONSOLIDATED TABLE VIEW â•â•â• */}
        {consolidatedList.length > 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden mt-4">
            <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200 flex justify-between items-center">
              <h4 className="font-bold text-gray-700 text-sm">Active List</h4>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-700">
                {allActiveForDate.length} order(s)
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="p-3 sm:p-4 font-bold">Item</th>
                    {activeHukumIds.map(uid => (
                      <th key={uid} className="p-3 sm:p-4 font-bold text-center whitespace-normal break-words max-w-[120px]">{activeHukums[uid]}</th>
                    ))}
                    <th className="p-3 sm:p-4 font-bold text-center">Total</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {consolidatedList.map(item => {
                    const emoji = getEmojiForName(item.name);
                    const isLockedByOther = item.lockedBy && item.lockedBy !== currentUser.uid;
                    const isSethjiAdded = Object.values(consolidatedItemsMap[item.catalogId].isSethjiAdded).some(Boolean);
                    return (
                      <tr key={item.catalogId} className={`transition-colors ${
                        item.status === 'found' ? 'bg-green-100'
                        : item.status === 'not_found' ? 'bg-red-100'
                        : 'hover:bg-gray-50'
                      }`}>
                        <td className="p-3 sm:p-4 flex items-center gap-3">
                          <ProductThumb src={item.imageURL} name={item.name} size={40} />
                          <div>
                            <div className={`font-bold text-sm sm:text-base ${item.status !== 'pending' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-400 font-semibold">{item.unit !== 'Not Defined' ? item.unit : 'Unit Not Defined'}</div>
                          </div>
                        </td>
                        {activeHukumIds.map(uid => (
                          <td key={uid} className="p-3 sm:p-4 text-center font-semibold text-gray-600 text-sm">
                            {item.quantities[uid] !== undefined ? (
                              <span>{item.quantities[uid] !== null && item.quantities[uid] > 0 ? item.quantities[uid] : '-'} <span className="text-[10px] text-gray-400 font-medium ml-0.5">{item.unit !== 'Not Defined' ? item.unit : ''}</span></span>
                            ) : '-'}
                          </td>
                        ))}
                        <td className="p-3 sm:p-4 text-center font-black text-gray-800 text-sm">
                          {item.totalQty > 0 ? item.totalQty : '-'} <span className="text-xs text-gray-400 font-semibold ml-0.5">{item.unit !== 'Not Defined' ? item.unit : ''}</span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex justify-center gap-2">
                            {item.isSethjiAdded && (
                              <motion.button whileTap={{ scale: 0.85 }}
                                onClick={() => handleRemoveSethjiItem(item.catalogId)}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors">
                                <Trash2 size={18} strokeWidth={2.5} />
                              </motion.button>
                            )}
                            <motion.button whileTap={{ scale: 0.85 }} disabled={isLockedByOther}
                              onClick={() => handleTickGlobal(item.catalogId, item.status === 'not_found' ? 'pending' : 'not_found')}
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                                item.status === 'not_found' ? 'bg-red-500 text-white' : 'bg-red-100 hover:bg-red-200 text-red-600'
                              }`}>
                              <X size={18} strokeWidth={2.5} />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.85 }} disabled={isLockedByOther}
                              onClick={() => handleTickGlobal(item.catalogId, item.status === 'found' ? 'pending' : 'found')}
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                                item.status === 'found' ? 'bg-green-500 text-white' : 'bg-green-100 hover:bg-green-200 text-green-600'
                              }`}>
                              <Check size={18} strokeWidth={2.5} />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add Item Button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setAddModalOpen(true);
                }}
                className="flex items-center gap-2 text-orange-600 font-bold hover:text-orange-700 transition-colors"
              >
                <Plus size={20} strokeWidth={3} /> Add Item to List
              </button>
            </div>

            {/* Finalize Footer */}
            <AnimatePresence>
              {consolidatedList.every(i => i.status !== 'pending') && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mt-4">
                    <label className="block text-sm font-bold text-blue-700 mb-2">Total amount spent for today's list (â‚¹)</label>
                    <div className="flex gap-2">
                      <input type="number"
                        className="flex-1 p-3 border-2 border-blue-200 rounded-xl font-bold text-lg bg-white focus:border-blue-400 focus:outline-none transition-colors"
                        placeholder="0.00" value={expense['day'] || ''}
                        onChange={(e) => setExpense({ ...expense, ['day']: e.target.value })} />
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleFinalizeAll}
                        className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-md hover:from-green-600 hover:to-emerald-700 transition-all">
                        Finalize All âœ“
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">ðŸ“­</p>
            <p className="font-semibold text-lg">No active orders for this day</p>
            <p className="text-sm mt-1">Wait for members to publish their lists</p>
          </div>
        )}

        {/* Archived orders */}
        {allArchivedForDate.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed Lists</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {allArchivedForDate.map((order, oIdx) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4 opacity-80">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">âœ…</span>
                    <h4 className="font-bold text-gray-600 text-sm">{order.createdByName || 'Unknown'}'s List</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.totalExpense > 0 && <span className="text-sm font-bold text-emerald-600">â‚¹{order.totalExpense} (Shared)</span>}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-gray-200 text-gray-500">Done</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={item.catalogId || idx} className="flex items-center gap-2.5 py-1">
                      <ProductThumb src={item.imageURL} name={item.name} size={28} />
                      <span className="flex-1 text-sm font-semibold text-gray-600 truncate">{item.name}</span>
                      <span className="text-xs text-gray-400 font-semibold">{item.qty} {item.unit || 'pcs'}</span>
                      {item.status === 'found' && <span className="text-green-500 text-sm">âœ…</span>}
                      {item.status === 'not_found' && <span className="text-red-500 text-sm">âŒ</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* â”€â”€â”€ FLOATING COMBO BAR â”€â”€â”€ */}
      {consolidatedList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ maxWidth: '672px', margin: '0 auto' }}>
          <div className="bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 px-5 py-3 shadow-2xl rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Combo</div>
                <div className="text-xl font-black text-orange-500">{combo} ðŸ”¥</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Pending Items</div>
                <div className="text-xl font-black text-blue-600">
                  {consolidatedList.filter(i => i.status === 'pending').length} / {consolidatedList.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ DAY TOTAL BAR â”€â”€â”€ */}
      {consolidatedList.length === 0 && archivedDayTotal > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ maxWidth: '672px', margin: '0 auto' }}>
          <div className="bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 px-5 py-4 shadow-2xl rounded-t-2xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Day Total</span>
              <span className="text-2xl font-black text-emerald-600">â‚¹{archivedDayTotal}</span>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ ADD ITEM MODAL â”€â”€â”€ */}
      <AnimatePresence>
        {addModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setAddModalOpen(false); setSelectedItemForAdd(null); }}
              className="fixed inset-0 bg-black/60 z-[100]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white rounded-t-3xl z-[101] shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: '85vh' }}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <Search className="text-gray-400" size={24} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search catalog to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-lg font-bold text-gray-800 outline-none bg-transparent"
                />
                <button onClick={() => { setAddModalOpen(false); setSelectedItemForAdd(null); }} className="w-10 h-10 bg-gray-100 rounded-full flex justify-center items-center text-gray-500 hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>

              
              {selectedItemForAdd ? (
                <div className="flex-1 overflow-y-auto p-5 bg-white flex flex-col gap-5">
                  <div className="flex justify-between items-center pb-3 border-b-2 border-gray-100">
                    <button onClick={() => setSelectedItemForAdd(null)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-bold">
                      <ArrowLeft size={20} /> Back
                    </button>
                    <h3 className="font-black text-gray-800 text-lg">Add Details</h3>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <ProductThumb src={selectedItemForAdd.imageURL} name={selectedItemForAdd.name} size={48} />
                    <div>
                      <div className="font-black text-xl text-gray-800">{selectedItemForAdd.name}</div>
                      <div className="text-sm font-semibold text-gray-500">{selectedItemForAdd.category}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-bold text-gray-700 text-sm">Assign To Hukum</label>
                    <select
                      value={addFormState.hukumId}
                      onChange={(e) => setAddFormState({ ...addFormState, hukumId: e.target.value })}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold bg-white focus:border-orange-400 focus:outline-none"
                    >
                      <option value="on_spot">On Spot (-)</option>
                      <option value="all_hukums">All Hukums (Everyone)</option>
                      {activeHukumIds.filter(id => id !== 'on_spot').map(uid => (
                        <option key={uid} value={uid}>{activeHukums[uid]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block mb-2 font-bold text-gray-700 text-sm">Quantity</label>
                      <input
                        type="number"
                        placeholder="Not Defined"
                        value={addFormState.qty}
                        onChange={(e) => setAddFormState({ ...addFormState, qty: e.target.value })}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold bg-white focus:border-orange-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block mb-2 font-bold text-gray-700 text-sm">Unit</label>
                      <select
                        value={addFormState.unit}
                        onChange={(e) => setAddFormState({ ...addFormState, unit: e.target.value })}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold bg-white focus:border-orange-400 focus:outline-none"
                      >
                        <option value="">Not Defined</option>
                        {(selectedItemForAdd.allowedUnits || ['pieces']).map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={confirmAddItemToOrder}
                    className="w-full mt-4 py-4 bg-orange-500 text-white font-black text-lg rounded-xl shadow-md hover:bg-orange-600 transition-colors"
                  >
                    Confirm & Add
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">

                {searchQuery.trim() && !filteredCatalogForAdd.some(i => i.name.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                  <button onClick={handleAddCustomItem} disabled={isSubmittingCustom}
                    className="w-full text-left p-4 mb-3 bg-purple-50 border-2 border-purple-200 rounded-xl flex items-center gap-3 text-purple-700 font-bold hover:bg-purple-100 transition-colors shadow-sm">
                    <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center shrink-0"><Plus size={20} /></div>
                    <span className="truncate">{isSubmittingCustom ? 'Adding...' : `Add "${searchQuery.trim()}" as custom item`}</span>
                  </button>
                )}
                
                {filteredCatalogForAdd.map(item => (
                  <button key={item.id} onClick={() => openDetailsForm(item)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl mb-2 border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all text-left">
                    <ProductThumb src={item.imageURL} name={item.name} size={40} />
                    <span className="flex-1 font-bold text-gray-700 text-lg">{item.name}</span>
                    <span className="text-xs font-semibold text-gray-500 px-2.5 py-1 bg-gray-100 rounded-md border border-gray-200">
                      {item.category}
                    </span>
                  </button>
                ))}
                
                {filteredCatalogForAdd.length === 0 && !searchQuery.trim() && (
                  <div className="text-center py-12 text-gray-400 font-semibold">
                    <Search size={48} className="mx-auto mb-4 text-gray-300" />
                    Type to search for items...
                  </div>
                )}
              </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

