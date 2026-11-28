import { useState } from 'react';
import { useUserOrders } from '../hooks/useUserOrders';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api';


/* ─── Date helpers ─── */
function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date) {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (getDateKey(date) === getDateKey(today)) return "Today";
  if (getDateKey(date) === getDateKey(yesterday)) return "Yesterday";
  if (getDateKey(date) === getDateKey(tomorrow)) return "Tomorrow";
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDateSubtitle(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ─── Emoji helper ─── */
import ProductThumb from './ProductThumb';

const EMOJI_MAP = {
  tomato: '\uD83C\uDF45', potato: '\uD83E\uDD54', onion: '\uD83E\uDDC5', carrot: '\uD83E\uDD55', lemon: '\uD83C\uDF4B',
  cabbage: '🥬', apple: '\uD83C\uDF4E', banana: '\uD83C\uDF4C', milk: '\uD83E\uDD5B', bread: '\uD83C\uDF5E',
  egg: '\uD83E\uDD5A', rice: '\uD83C\uDF5A', watermelon: '\uD83C\uDF49',
};
function getEmojiForName(name) {
  if (!name) return '📦';
  const n = name.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (n.includes(key)) return emoji;
  }
  return '📦';
}

export default function MemberOrdersOverlay({ member, onClose }) {
  const memberId = member?.id || member?.uid;
  const { orders } = useUserOrders(memberId);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { userRole, currentUser } = useAuth();
  const currentUserId = currentUser?.id || currentUser?.uid;
  const isOwner = currentUserId && String(currentUserId) === String(memberId);
  const canDeleteList = userRole === 'Admin' || (userRole === 'Hukum' && isOwner);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const confirmDeleteOrder = (order) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (orderToDelete) {
      try {
        await ordersApi.delete(orderToDelete.id);
        setDeleteModalOpen(false);
        setOrderToDelete(null);
      } catch (err) {
        console.error("Error deleting order:", err);
      }
    }
  };

  const selectedKey = getDateKey(selectedDate);
  const todayKey = getDateKey(new Date());

  // Filter orders by date (user is already filtered by the hook)
  const memberOrders = orders.filter(o => {
    if (o.orderDate) return o.orderDate === selectedKey;
    if (o.createdAt) {
      const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return getDateKey(d) === selectedKey;
    }
    return false;
  });

  const dayTotal = memberOrders
    .filter(o => o.status === 'Archived')
    .reduce((sum, o) => sum + Number(o.totalExpense || 0), 0);

  const goToPrevDay = () => setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d; });
  const goToNextDay = () => {
    const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 7);
    if (selectedKey >= getDateKey(maxDate)) return;
    setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d; });
  };
  const canGoNext = (() => { const m = new Date(); m.setDate(m.getDate() + 7); return selectedKey < getDateKey(m); })();

  const memberName = member.displayName || member.display_name || member.username || member.email?.split('@')[0] || 'Member';
  const memberInitials = memberName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AnimatePresence>
      <motion.div
        key="main-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-gray-50 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white px-5 pt-4 pb-3 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center overflow-hidden">
                  {member.avatarUrl || member.avatar_url || member.photoURL ? (
                    <img src={member.avatarUrl || member.avatar_url || member.photoURL} alt={memberName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-blue-600 font-bold text-sm">{memberInitials}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{memberName}'s Orders</h3>
                  <span className="text-xs font-semibold text-gray-400">{member.role}</span>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            {/* Date nav */}
            <div className="flex items-center justify-between py-2">
              <motion.button whileTap={{ scale: 0.85 }} onClick={goToPrevDay}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <ChevronLeft size={18} className="text-gray-600" />
              </motion.button>
              <motion.div key={selectedKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <p className="font-bold text-gray-800 text-sm">{formatDateLabel(selectedDate)}</p>
                <p className="text-xs text-gray-400">{formatDateSubtitle(selectedDate)}</p>
              </motion.div>
              <motion.button whileTap={{ scale: 0.85 }} onClick={goToNextDay} disabled={!canGoNext}
                className={`w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center ${canGoNext ? 'hover:bg-gray-200' : 'opacity-30'}`}>
                <ChevronRight size={18} className="text-gray-600" />
              </motion.button>
            </div>
          </div>

          {/* Orders list */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {dayTotal > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-700">Day Total</span>
                <span className="text-lg font-black text-emerald-600">{'\u20B9'}{dayTotal}</span>
              </div>
            )}

            {memberOrders.length > 0 ? (
              <div className="space-y-4">
                {memberOrders.map((order, oIdx) => (
                  <div key={`order-${order.id || oIdx}`} className={`bg-white rounded-xl border overflow-hidden ${
                    order.status === 'Archived' ? 'border-gray-200' : 'border-blue-200'
                  }`}>
                    <div className={`px-4 py-2.5 flex justify-between items-center text-sm ${
                      order.status === 'Archived' ? 'bg-gray-50' : 'bg-blue-50'
                    }`}>
                      <span className="font-bold text-gray-600">List #{oIdx + 1}</span>
                      <div className="flex items-center gap-2">
                        {order.totalExpense > 0 && (
                          <span className="text-emerald-600 font-bold text-xs">{'\u20B9'}{order.totalExpense}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          order.status === 'Archived' ? 'bg-gray-200 text-gray-500' :
                          order.status === 'Fulfilling' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{order.status === 'Archived' ? 'Done' : order.status}</span>
                        {canDeleteList && (
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmDeleteOrder(order); }}
                            className="ml-1 w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={12} className="text-red-700" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5">
                      {order.items?.map((item, idx) => (
                        <div key={`item-${order.id || oIdx}-${item.catalogId || idx}`} className="flex items-center gap-2.5 py-1">
                          <ProductThumb src={item.imageURL} name={item.name} size={28} />
                          <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{item.name}</span>
                          <span className="text-xs text-gray-400 font-semibold">{item.qty} {item.unit || 'pcs'}</span>
                          {item.status === 'found' && <span className="text-green-500 text-sm">{'\u2705'}</span>}
                          {item.status === 'not_found' && <span className="text-red-500 text-sm">{'\u274C'}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-2">🔒</p>
                <p className="font-semibold">No orders for this day</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deleteModalOpen && (
        <motion.div
          key="delete-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDeleteModalOpen(false)}
          className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm z-[100]"
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
  );
}

