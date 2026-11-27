import { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { requestedItemsApi } from '../api';

import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import MemberOrdersOverlay from '../components/MemberOrdersOverlay';
import { useCatalog } from '../hooks/useCatalog';
import { useOrders } from '../hooks/useOrders';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Minus, Plus, ChevronDown, ChevronLeft, ChevronRight, Pencil, Send, PlusCircle, Trash2 } from 'lucide-react';

import { getEmojiForName } from '../utils/emoji';
import ProductThumb from '../components/ProductThumb';

function getCategoryColor(category) {
  switch (category) {
    case 'Vegetables': return { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-500' };
    case 'Fruits': return { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-500' };
    case 'Packaged': return { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'bg-orange-500' };
    case 'Cosmetics': return { bg: 'bg-cyan-50', border: 'border-cyan-200', accent: 'bg-cyan-500' };
    case 'Others': return { bg: 'bg-violet-50', border: 'border-violet-200', accent: 'bg-violet-500' };
    default: return { bg: 'bg-sky-50', border: 'border-sky-200', accent: 'bg-sky-500' };
  }
}

/* â”€â”€â”€ Floating item that flies to cart â”€â”€â”€ */
function FlyingItem({ item, startRect, cartRect, onDone }) {
  if (!startRect || !cartRect) return null;
  const dx = cartRect.x + cartRect.width / 2 - (startRect.x + startRect.width / 2);
  const dy = cartRect.y + cartRect.height / 2 - (startRect.y + startRect.height / 2);
  const emoji = getEmojiForName(item.name);

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{ x: dx, y: dy, scale: 0.3, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeIn' }}
      onAnimationComplete={onDone}
      className="fixed z-[100] text-5xl pointer-events-none flex items-center justify-center"
      style={{ top: startRect.y, left: startRect.x, width: startRect.width, height: startRect.height }}
    >
      {item.imageURL ? (
        <img src={item.imageURL} alt={item.name} className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-gray-900 bg-white" />
      ) : (
        <ProductThumb src={item.imageURL} name={item.name} size={64} className="shadow-lg border-2 border-gray-900 bg-white" />
      )}
    </motion.div>
  );
}

/* â”€â”€â”€ Single catalog tile â”€â”€â”€ */
function CatalogTile({ item, isInCart, onToggle }) {
  const colors = getCategoryColor(item.category);
  const emoji = getEmojiForName(item.name);

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={(e) => onToggle(item, e)}
      className={`relative flex flex-col items-center justify-center rounded-2xl cursor-pointer select-none overflow-hidden
        h-36 sm:h-44 w-full transition-all duration-200
        ${item.imageURL ? 'border-2 border-transparent' : `${colors.bg} ${colors.border} border-2`}
        ${isInCart
          ? 'ring-4 ring-green-500 ring-offset-2 shadow-lg'
          : 'shadow-sm hover:shadow-md'
        }`}
    >
      {item.imageURL && (
        <>
          <img src={item.imageURL} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </>
      )}

      {isInCart && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center z-10 border-2 border-white shadow-md">
          <span className="text-white text-xs font-bold">âœ“</span>
        </div>
      )}

      {item.imageURL ? (
        <div className="absolute bottom-3 left-0 right-0 px-3 z-10">
          <span className="font-black text-lg sm:text-xl text-white leading-tight text-center line-clamp-2 drop-shadow-lg">{item.name}</span>
        </div>
      ) : (
        <>
          <span className="mb-2 flex items-center justify-center z-10 pointer-events-none">
            <ProductThumb src={item.imageURL} name={item.name} size={64} />
          </span>
          <span className="font-black text-base sm:text-lg text-gray-800 leading-tight text-center px-2 line-clamp-2 z-10 pointer-events-none">{item.name}</span>
        </>
      )}
    </motion.button>
  );
}

/* â”€â”€â”€ Cart drawer item row â”€â”€â”€ */
function CartItemRow({ item, onQtyChange, onUnitChange, onRemove }) {
  const emoji = getEmojiForName(item.name);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm"
    >
      <ProductThumb src={item.imageURL} name={item.name} size={48} />
      <div className="flex-1 min-w-0">
        <div className="font-black text-gray-900 text-base sm:text-lg truncate">{item.name}</div>
        {/* Unit selector */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], boxShadow: ['none', '0 0 12px rgba(59,130,246,0.6)', 'none'] }}
          transition={{ duration: 0.7, ease: "easeInOut", delay: 0.3 }}
          className="relative mt-1 inline-block rounded-lg"
        >
          <select
            value={item.unit || 'Not Defined'}
            onChange={(e) => onUnitChange(item.catalogId, e.target.value)}
            className="appearance-none text-xs bg-blue-50 border-2 border-blue-200 rounded-lg px-2.5 py-1.5 pr-7 font-black text-blue-700 cursor-pointer shadow-sm hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Not Defined">Not Defined</option>
            {(item.allowedUnits?.length ? item.allowedUnits : ['pieces']).map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <ChevronDown size={14} strokeWidth={3} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
        </motion.div>
      </div>

      {/* Qty controls */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], boxShadow: ['none', '0 0 12px rgba(249,115,22,0.6)', 'none'] }}
        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.5 }}
        className="flex items-center gap-1.5 bg-orange-50 border-2 border-orange-200 p-1 rounded-full shadow-sm"
      >
        <button onClick={() => onQtyChange(item.catalogId, -1)} className="w-7 h-7 rounded-full bg-white border border-orange-300 text-orange-600 hover:bg-orange-100 flex items-center justify-center transition-colors">
          <Minus size={14} strokeWidth={3} />
        </button>
        <span className="w-9 text-center font-black text-orange-700">{item.qty === null ? '-' : item.qty}</span>
        <button onClick={() => onQtyChange(item.catalogId, 1)} className="w-7 h-7 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center transition-colors shadow-sm">
          <Plus size={14} strokeWidth={3} />
        </button>
      </motion.div>

      {/* Remove */}
      <button onClick={() => onRemove(item.catalogId)} className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center">
        <X size={14} className="text-red-500" />
      </button>
    </motion.div>
  );
}

/* â”€â”€â”€ Date helpers â”€â”€â”€ */
function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (getDateKey(date) === getDateKey(today)) return "Today's List";
  if (getDateKey(date) === getDateKey(yesterday)) return "Yesterday's List";
  if (getDateKey(date) === getDateKey(tomorrow)) return "Tomorrow's List";
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateSubtitle(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* â”€â”€â”€ Order Summary Card (read-only) â”€â”€â”€ */
function OrderSummaryCard({ order, index, onEdit, onDelete }) {
  const isArchived = order.status === 'Archived';
  const isPublished = order.status === 'Published';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`bg-white rounded-2xl border-2 overflow-hidden ${
        isArchived ? 'border-gray-200 opacity-80' : 'border-blue-200'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 flex justify-between items-center border-b ${
        isArchived ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{isArchived ? 'âœ…' : 'ðŸ“‹'}</span>
          <h3 className="font-bold text-gray-700 text-sm">List #{index + 1}</h3>
        </div>
        <div className="flex items-center gap-2">
          {isArchived && order.totalExpense > 0 && (
            <span className="text-sm font-bold text-emerald-600">â‚¹{order.totalExpense}</span>
          )}
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
            isArchived ? 'bg-gray-200 text-gray-500' :
            order.status === 'Fulfilling' ? 'bg-amber-100 text-amber-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {isArchived ? 'Done' : order.status}
          </span>
          {(isPublished || order.status === 'Fulfilling') && onEdit && (
            <button
              onClick={() => onEdit(order)}
              className="ml-2 w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
            >
              <Pencil size={12} className="text-blue-700" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(order)}
              className="ml-1 w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
            >
              <Trash2 size={12} className="text-red-700" />
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-2">
        {order.items?.map((item, idx) => {
          return (
            <div key={item.catalogId || idx} className="flex items-center gap-3 py-1.5">
              <ProductThumb src={item.imageURL} name={item.name} size={28} />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-800 text-sm">{item.name}</span>
              </div>
              <span className="text-sm text-gray-500 font-semibold">{item.qty} {item.unit || 'pcs'}</span>
              {item.status === 'found' && <span className="text-green-500">âœ…</span>}
              {item.status === 'not_found' && <span className="text-red-500">âŒ</span>}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* â”€â”€â”€ Main Dashboard â”€â”€â”€ */
export default function HukumDashboard() {
  const { catalog } = useCatalog();
  const { orders, createDraft, updateOrder, deleteOrder } = useOrders();
  const [filterCategory, setFilterCategory] = useState('All');
  const [cartOpen, setCartOpen] = useState(false);
  const [flyingEmojis, setFlyingEmojis] = useState([]);
  const cartBtnRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCatalog, setShowCatalog] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const userOpenedCatalogRef = useRef(false);
  const knownCompletedOrdersRef = useRef(new Set());
  const knownSethjiItemsRef = useRef(new Set());
  const knownNotFoundItemsRef = useRef(new Set());
  const [toastMsg, setToastMsg] = useState(null);
  
  const { currentUser, userFamilyId, userDisplayName, userRole } = useAuth();

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const canDeleteList = userRole === 'Hukum' || userRole === 'Admin';
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const confirmDeleteOrder = (order) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (orderToDelete) {
      await deleteOrder(orderToDelete.id);
      showToast('ðŸ—‘ï¸ List deleted successfully!');
      setDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [sessionCustomItems, setSessionCustomItems] = useState([]);
  const [isCartShaking, setIsCartShaking] = useState(false);

  
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    
    // Check all orders of current user for notifications
    orders.filter(o => o.createdBy === currentUser?.uid).forEach(myOrder => {
      // 1. Check for newly Archived (Completed) orders
      if (myOrder.status === 'Archived' && myOrder.batchId) {
        if (!knownCompletedOrdersRef.current.has(myOrder.id)) {
          knownCompletedOrdersRef.current.add(myOrder.id);
          if (Date.now() - Number(myOrder.batchId) < 30000) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('List Completed! ðŸŽ‰', {
                body: `Sethji has finalized and completed your list.`,
                icon: '/icon-192x192.png'
              });
            }
          }
        }
      }

      // 2. Check items for Sethji additions or Not Found marks
      if (myOrder.items) {
        myOrder.items.forEach(item => {
          // Sethji Added Notification
          if (item.isSethjiAdded) {
            const itemKey = `${myOrder.id}_${item.catalogId}_${item.addedAt}`;
            if (!knownSethjiItemsRef.current.has(itemKey)) {
              knownSethjiItemsRef.current.add(itemKey);
              if (item.addedAt && (Date.now() - item.addedAt < 30000)) {
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Sethji updated your list!', {
                    body: `Sethji added "${item.name}" to your order.`,
                    icon: item.imageURL || '/icon-192x192.png'
                  });
                }
              }
            }
          }

          // Not Found Notification
          if (item.status === 'not_found' && item.statusUpdatedAt) {
            const notFoundKey = `${myOrder.id}_${item.catalogId}_${item.statusUpdatedAt}`;
            if (!knownNotFoundItemsRef.current.has(notFoundKey)) {
              knownNotFoundItemsRef.current.add(notFoundKey);
              if (Date.now() - item.statusUpdatedAt < 30000) {
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Item Unavailable âŒ', {
                    body: `Sethji marked "${item.name}" as not available.`,
                    icon: item.imageURL || '/icon-192x192.png'
                  });
                }
              }
            }
          }
        });
      }
    });
  }, [orders, currentUser]);

  const todayKey = getDateKey(new Date());
  const selectedKey = getDateKey(selectedDate);
  const isToday = selectedKey === todayKey;
  const isPast = selectedKey < todayKey;
  const canEdit = !isPast; // can only edit today and future

  // Fetch pending requested items for this family
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

  // Get ALL orders for the selected date
  const ordersForDate = orders.filter(o => {
    if (o.orderDate) return o.orderDate === selectedKey;
    if (o.createdAt) {
      const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return getDateKey(d) === selectedKey;
    }
    return false;
  });

  // Separate by status
  const archivedOrders = ordersForDate.filter(o => o.status === 'Archived');
  const nonArchivedOrders = ordersForDate.filter(o => o.status !== 'Archived');

  // The current active draft the user can edit (only the Draft one)
  const draftOrder = canEdit ? nonArchivedOrders.find(o => o.status === 'Draft') : null;
  // Published/Fulfilling orders the user has sent but Sethji hasn't finalized yet
  const sentOrders = nonArchivedOrders.filter(o => o.status === 'Published' || o.status === 'Fulfilling');

  // The order we're editing (either a selected Published order, or the draft)
  const editableOrder = editingOrderId
    ? nonArchivedOrders.find(o => o.id === editingOrderId)
    : draftOrder;
  const cartCount = editableOrder?.items?.length || 0;

  // Shake cart every 3 seconds if items exist to remind user
  useEffect(() => {
    if (cartCount > 0 && !cartOpen) {
      const interval = setInterval(() => {
        setIsCartShaking(true);
        setTimeout(() => setIsCartShaking(false), 500);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [cartCount, cartOpen]);

  // Overall day total (sum of all archived list expenses without double counting batches)
  const uniqueBatches = new Set();
  let dayTotal = 0;
  archivedOrders.forEach(o => {
    if (o.batchId) {
      if (!uniqueBatches.has(o.batchId)) {
        uniqueBatches.add(o.batchId);
        dayTotal += Number(o.totalExpense || 0);
      }
    } else {
      dayTotal += Number(o.totalExpense || 0);
    }
  });

  // Auto-decide which view to show (runs on date change AND when orders load)
  useEffect(() => {
    // If the user manually opened catalog, don't override
    if (userOpenedCatalogRef.current) return;

    if (isPast) {
      setShowCatalog(false);
    } else if (draftOrder && draftOrder.items?.length > 0) {
      setShowCatalog(true);
    } else if (sentOrders.length > 0 || archivedOrders.length > 0) {
      setShowCatalog(false);
    } else {
      setShowCatalog(false);
    }
  }, [selectedKey, isPast, isToday, draftOrder, draftOrder?.items?.length, sentOrders.length, archivedOrders.length]);

  // Reset the manual-open flag when date changes
  useEffect(() => {
    userOpenedCatalogRef.current = false;
  }, [selectedKey]);

  const handleToggleCart = useCallback(async (catalogItem, e) => {
    // Capture tile position BEFORE any async work (React recycles synthetic events)
    const tileRect = e.currentTarget?.getBoundingClientRect();

    let draft = editableOrder;
    if (!draft) {
      const docRef = await createDraft(selectedKey);
      if (!docRef) return;
      draft = { id: docRef.id, items: [] };
    }

    const existingItem = draft.items.find(i => i.catalogId === catalogItem.id);
    let newItems = [...draft.items];

    if (existingItem) {
      newItems = newItems.filter(i => i.catalogId !== catalogItem.id);
    } else {
      const cartRect = cartBtnRef.current?.getBoundingClientRect();
      if (cartRect && tileRect) {
        const id = Date.now();
        setFlyingEmojis(prev => [...prev, { id, item: catalogItem, startRect: tileRect, cartRect }]);
      }
      newItems.push({
        catalogId: catalogItem.id,
        name: catalogItem.name,
        imageURL: catalogItem.imageURL || null,
        qty: null,
        allowedUnits: catalogItem.allowedUnits || ['pieces'],
        unit: 'Not Defined',
        status: 'pending',
      });
      setIsCartShaking(true);
      setTimeout(() => setIsCartShaking(false), 500);
    }

    updateOrder(draft.id, { items: newItems });
  }, [editableOrder, selectedKey, createDraft, updateOrder]);

  const updateItemQty = (catalogId, delta) => {
    if (!editableOrder) return;
    let newItems = [...editableOrder.items];
    const idx = newItems.findIndex(i => i.catalogId === catalogId);
    if (idx > -1) {
      const actualUnit = newItems[idx].unit === 'Not Defined' ? (newItems[idx].allowedUnits?.[0] || 'pieces') : newItems[idx].unit;
      let step = 1;
      if (actualUnit === 'grams' || actualUnit === 'ml') step = 50; 
      else if (actualUnit === 'kg' || actualUnit === 'liters') step = 0.5; 
      
      let currentQty = newItems[idx].qty === null ? 0 : newItems[idx].qty;
      const newQty = Math.max(0, currentQty + (delta > 0 ? step : -step));
      
      newItems[idx] = { 
        ...newItems[idx], 
        qty: newQty === 0 ? null : Number(newQty.toFixed(2)),
        unit: newItems[idx].unit === 'Not Defined' && newQty > 0 ? actualUnit : newItems[idx].unit
      };
      
      updateOrder(editableOrder.id, { items: newItems });
    }
  };

  const updateItemUnit = (catalogId, unit) => {
    if (!editableOrder) return;
    
    // Determine default qty based on new unit
    let newQty = 1;
    if (unit === 'grams' || unit === 'ml') newQty = 250;
    else if (unit === 'kg') newQty = 0.5;
    else if (unit === 'Not Defined') newQty = null;

    const newItems = editableOrder.items.map(i =>
      i.catalogId === catalogId ? { ...i, unit, qty: newQty } : i
    );
    updateOrder(editableOrder.id, { items: newItems });
  };

  const removeItem = (catalogId) => {
    if (!editableOrder) return;
    updateOrder(editableOrder.id, { items: editableOrder.items.filter(i => i.catalogId !== catalogId) });
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const fireConfetti = () => {
    const count = 400; // Double the particles
    const defaults = { origin: { y: 0.7 }, scalar: 1.5 }; // Make them 50% larger
    confetti({ ...defaults, spread: 100, particleCount: count * 0.25, startVelocity: 65 });
    confetti({ ...defaults, spread: 160, particleCount: count * 0.2 });
    confetti({ ...defaults, spread: 100, particleCount: count * 0.35, decay: 0.92 });
    confetti({ ...defaults, spread: 120, particleCount: count * 0.1, startVelocity: 35 });
    setTimeout(() => {
      confetti({ ...defaults, spread: 120, particleCount: count * 0.1, startVelocity: 55 });
    }, 250);
  };

  const publishCart = () => {
    if (editableOrder && editableOrder.items.length > 0) {
      const isUpdate = editableOrder.status === 'Published' || editableOrder.status === 'Fulfilling';
      updateOrder(editableOrder.id, { 
        status: editableOrder.status === 'Draft' ? 'Published' : editableOrder.status,
        publishTrigger: new Date().toISOString()
      });
      setCartOpen(false);
      setShowCatalog(false);
      setEditingOrderId(null);
      userOpenedCatalogRef.current = false;
      if (isUpdate) {
        showToast('âœ… List updated successfully!');
      } else {
        fireConfetti();
        showToast('ðŸŽ‰ List sent to Sethji!');
      }
    }
  };

  // Create a NEW list for this day (when previous lists are archived)
  const createNewList = async () => {
    setEditingOrderId(null);
    userOpenedCatalogRef.current = true;
    setShowCatalog(true);
  };

  const handleAddCustomItem = async (e) => {
    e.preventDefault();
    if (!customItemName.trim() || isSubmittingCustom) return;

    setIsSubmittingCustom(true);
    try {
      let draft = editableOrder;
      if (!draft) {
        const docRef = await createDraft(selectedKey);
        if (!docRef) throw new Error('Failed to create draft');
        draft = { id: docRef.id, items: [] };
      }

      const customId = `custom_${Date.now()}`;
      
      // 1. Add to local cart
      const newItems = [...draft.items, {
        catalogId: customId,
        name: customItemName.trim(),
        qty: 1,
        allowedUnits: catalogItem.allowedUnits || ['pieces'],
        unit: catalogItem.allowedUnits?.[0] || 'pieces',
        status: 'pending',
        isCustom: true
      }];
      await updateOrder(draft.id, { items: newItems });

      // 2. Submit to requestedItems API
      const reqRes = await requestedItemsApi.request(customItemName.trim());
      setSessionCustomItems(prev => [
        ...prev,
        {
          id: reqRes.id || customId,
          name: customItemName.trim(),
          category: 'Others',
          isCustom: true,
        }
      ]);

      setCustomModalOpen(false);
      setCustomItemName('');
      setIsCartShaking(true);
      setTimeout(() => setIsCartShaking(false), 500);
      showToast('âœ… Added custom item to list');
    } catch (error) {
      console.error('Error adding custom item:', error);
      showToast('âŒ Failed to add item');
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  const combinedCatalog = [...catalog, ...sessionCustomItems];
  const filteredCatalog = combinedCatalog
    .filter(item => filterCategory === 'All' || item.category === filterCategory)
    .sort((a, b) => a.name.localeCompare(b.name));

  const goToPrevDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const goToNextDay = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    if (selectedKey >= getDateKey(maxDate)) return;
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const goToToday = () => setSelectedDate(new Date());

  const canGoNext = (() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return selectedKey < getDateKey(maxDate);
  })();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Navbar onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onSelectMember={(m) => setViewingMember(m)} />
      {viewingMember && <MemberOrdersOverlay member={viewingMember} onClose={() => setViewingMember(null)} />}

      {/* â”€â”€â”€ DATE NAVIGATION HEADER â”€â”€â”€ */}
      <div className="px-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between py-4">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={goToPrevDay}
            className="w-11 h-11 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={22} strokeWidth={2.5} className="text-gray-600" />
          </motion.button>

          <motion.div
            key={selectedKey}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-center cursor-pointer"
            onClick={goToToday}
          >
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
              {formatDateLabel(selectedDate)}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold mt-0.5">
              {formatDateSubtitle(selectedDate)}
            </p>
            {!isToday && (
              <button className="text-xs font-bold text-green-600 mt-1 hover:underline">
                â†© Tap to go to Today
              </button>
            )}
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={goToNextDay}
            disabled={!canGoNext}
            className={`w-11 h-11 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm transition-colors ${
              canGoNext ? 'hover:bg-gray-50' : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={22} strokeWidth={2.5} className="text-gray-600" />
          </motion.button>
        </div>
      </div>

      {/* â”€â”€â”€ VIEW SWITCHER â”€â”€â”€ */}
      {!showCatalog ? (
      /* â•â•â• SUMMARY VIEW â•â•â• */
      <div className="flex-1 overflow-y-auto pb-28 px-4 max-w-2xl mx-auto w-full">

        {/* Day total banner */}
        {dayTotal > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl px-5 py-4 mb-4 text-center shadow-lg"
          >
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Today's Total Spend</p>
            <p className="text-white text-3xl font-black mt-1">â‚¹{dayTotal}</p>
          </motion.div>
        )}

        {/* Sent orders (Published/Fulfilling) â€” waiting for Sethji */}
        {sentOrders.map((order, idx) => (
          <div key={order.id} className="mb-4">
            <OrderSummaryCard
              order={order}
              index={idx}
              onEdit={canEdit && (order.status === 'Published' || order.status === 'Fulfilling') ? () => {
                setEditingOrderId(order.id);
                userOpenedCatalogRef.current = true;
                setShowCatalog(true);
              } : null}
              onDelete={canDeleteList ? () => confirmDeleteOrder(order) : null}
            />
          </div>
        ))}

        {/* Draft order summary */}
        {draftOrder && draftOrder.items?.length > 0 && (
          <div className="mb-4">
            <OrderSummaryCard order={draftOrder} index={sentOrders.length} onDelete={canDeleteList ? () => confirmDeleteOrder(draftOrder) : null} />
          </div>
        )}

        {/* Archived (finalized) orders */}
        {archivedOrders.length > 0 && (
          <>
            {(sentOrders.length > 0 || (draftOrder && draftOrder.items?.length > 0)) && (
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}
            {archivedOrders.map((order, idx) => (
              <div key={order.id} className="mb-4">
                <OrderSummaryCard order={order} index={idx} onDelete={canDeleteList ? () => confirmDeleteOrder(order) : null} />
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {!(sentOrders.length > 0 || archivedOrders.length > 0 || (draftOrder && draftOrder.items?.length > 0)) && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">{canEdit ? 'ðŸ“' : 'ðŸ“­'}</p>
            <p className="font-semibold text-lg">No lists for this day</p>
            {canEdit && !isPast && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={createNewList}
                className="mt-5 px-8 py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 mx-auto
                  bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700
                  shadow-lg active:scale-[0.98] transition-all"
              >
                <PlusCircle size={22} /> Create List
              </motion.button>
            )}
          </div>
        )}

        {/* Bottom buttons */}
        {canEdit && (
          <div className="fixed bottom-6 left-4 right-4 z-40 max-w-2xl mx-auto space-y-2">
            {/* Update existing draft */}
            {draftOrder && draftOrder.items?.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCatalog(true)}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2
                  bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700
                  shadow-lg active:scale-[0.98] transition-all"
              >
                <Pencil size={20} /> Update Cart
              </motion.button>
            )}
            {/* Create new list â€” shown when no draft with items exists and there are already sent/archived orders */}
            {!(draftOrder && draftOrder.items?.length > 0) && (sentOrders.length > 0 || archivedOrders.length > 0) && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={createNewList}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2
                  bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700
                  shadow-lg active:scale-[0.98] transition-all"
              >
                <PlusCircle size={20} /> Create New List
              </motion.button>
            )}
          </div>
        )}
      </div>
      ) : (
      /* â•â•â• CATALOG VIEW â•â•â• */
      <div className="flex-1 overflow-y-auto pb-28 px-4 max-w-2xl mx-auto w-full">
        <div className="flex flex-wrap gap-2 py-4">
          {[
            { key: 'All', label: 'ðŸ  All' },
            { key: 'Vegetables', label: 'ðŸ¥¬ Veggies' },
            { key: 'Fruits', label: 'ðŸŽ Fruits' },
            { key: 'Household', label: 'ðŸ›’ Household' },
            { key: 'Packaged', label: 'ðŸ¥« Packaged' },
            { key: 'Cosmetics', label: 'ðŸ’„ Cosmetics' },
            { key: 'Others', label: 'ðŸ“¦ Others' },
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm border-2 transition-all duration-200 ${
                filterCategory === cat.key
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 mt-2">
          {filteredCatalog.map(item => {
            const isInCart = editableOrder?.items?.some(i => i.catalogId === item.id) || false;
            return (
              <CatalogTile key={item.id} item={item} isInCart={isInCart} onToggle={handleToggleCart} />
            );
          })}
        </div>

        {filteredCatalog.length === 0 && (
          <div className="text-center py-16 text-gray-400 font-semibold text-lg border-2 border-dashed border-gray-200 rounded-2xl mt-4">
            No items in {filterCategory}.
          </div>
        )}
      </div>
      )}

      {/* â”€â”€â”€ FLYING ITEMS â”€â”€â”€ */}
      {flyingEmojis.map(f => (
        <FlyingItem
          key={f.id}
          item={f.item}
          startRect={f.startRect}
          cartRect={f.cartRect}
          onDone={() => setFlyingEmojis(prev => prev.filter(x => x.id !== f.id))}
        />
      ))}

      {/* â”€â”€â”€ FLOATING ADD CUSTOM BUTTON â”€â”€â”€ */}
      {showCatalog && canEdit && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCustomModalOpen(true)}
          className="fixed bottom-6 left-6 z-50 h-14 px-4 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-full shadow-xl flex items-center gap-2 transition-colors"
        >
          <Plus size={22} />
          <span className="text-sm">Custom Item</span>
        </motion.button>
      )}

      {/* â”€â”€â”€ FLOATING CART BUTTON â”€â”€â”€ */}
      {showCatalog && canEdit && (
        <motion.button
          ref={cartBtnRef}
          whileTap={{ scale: 0.9 }}
          animate={isCartShaking ? {
            rotate: [0, -15, 15, -15, 15, 0],
            scale: [1, 1.2, 1],
            transition: { duration: 0.4 }
          } : { rotate: 0, scale: 1 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center transition-colors"
        >
          <ShoppingCart size={26} />
          {cartCount > 0 && (
            <motion.span
              key={cartCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md"
            >
              {cartCount}
            </motion.span>
          )}
        </motion.button>
      )}

      {/* â”€â”€â”€ CART DRAWER â”€â”€â”€ */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
              style={{ maxWidth: '600px', margin: '0 auto' }}
            >
              <div className="px-5 pt-3 pb-4 border-b border-gray-200 bg-white rounded-t-3xl">
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">
                    Your Cart
                    {!isToday && <span className="text-sm font-semibold text-blue-500"> ({formatDateLabel(selectedDate)})</span>}
                    {cartCount > 0 && <span className="ml-2 text-sm font-semibold text-gray-400">({cartCount} items)</span>}
                  </h2>
                  <button onClick={() => setCartOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {editableOrder?.items?.map(item => (
                    <CartItemRow
                      key={item.catalogId}
                      item={item}
                      onQtyChange={updateItemQty}
                      onUnitChange={updateItemUnit}
                      onRemove={removeItem}
                    />
                  ))}
                </AnimatePresence>
                {(!editableOrder || editableOrder.items?.length === 0) && (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">Your cart is empty</p>
                    <p className="text-sm mt-1">Tap items to add them here</p>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-200 bg-white">
                <button
                  onClick={publishCart}
                  disabled={!editableOrder || editableOrder.items?.length === 0}
                  className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all duration-200
                    bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700
                    disabled:opacity-40 disabled:cursor-not-allowed
                    shadow-lg active:scale-[0.98]"
                >
                  Send to Sethji ðŸš€
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* â”€â”€â”€ CUSTOM ITEM MODAL â”€â”€â”€ */}
      <AnimatePresence>
        {customModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomModalOpen(false)}
              className="fixed inset-0 bg-black/40 z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white rounded-t-3xl z-[101] shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="title-font text-2xl font-bold text-gray-900">Add Custom Item</h3>
                <button onClick={() => setCustomModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddCustomItem} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Item Name</label>
                  <input
                    type="text"
                    required
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="e.g., Special Atta 5kg"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-2">This item will be added to your current list and requested from Sethji.</p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmittingCustom || !customItemName.trim()}
                  className="w-full mt-2 py-4 rounded-xl font-bold text-lg text-white bg-gray-900 hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isSubmittingCustom ? 'Adding...' : 'Add to List'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* â”€â”€â”€ TOAST NOTIFICATION â”€â”€â”€ */}
      <AnimatePresence>
        {toastMsg && (
          <div className="fixed top-20 left-0 right-0 z-[999] flex justify-center pointer-events-none px-4">
            <motion.div
              initial={{ opacity: 0, y: -60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="px-6 py-3.5 rounded-2xl bg-gray-900 text-white text-sm sm:text-base font-bold shadow-2xl flex items-center justify-center gap-2 pointer-events-auto text-center max-w-sm"
            >
              {toastMsg}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* â”€â”€â”€ DELETE CONFIRMATION MODAL â”€â”€â”€ */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModalOpen(false)}
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Delete List?</h3>
                <p className="text-gray-500 font-semibold mb-6">
                  Are you sure you want to delete this list? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDelete}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

