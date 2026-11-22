import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { Check, X, Clock, PackagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestedItemsApi } from '../api';

const CATEGORIES = ['Vegetables', 'Fruits', 'Household', 'Packaged', 'Cosmetics', 'Others'];

export default function RequestedItems() {
  const [requests, setRequests] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editName, setEditName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Others');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const items = await requestedItemsApi.list();
      setRequests(items);
    } catch (e) {
      console.error('Error fetching requested items:', e);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedRequest || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await requestedItemsApi.approve(selectedRequest.id, selectedCategory);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      await requestedItemsApi.reject(id);
      await fetchRequests();
    } catch (err) {
      console.error('Error rejecting:', err);
    }
  };

  return (
    <div className="h-full pb-20 flex flex-col bg-gray-50">
      <Navbar onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="max-w-2xl mx-auto w-full p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
            <PackagePlus size={24} />
          </div>
          <div>
            <h1 className="title-font text-2xl font-black text-gray-900">Custom Item Requests</h1>
            <p className="text-sm font-semibold text-gray-500">Review items requested by family members</p>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border-2 border-dashed border-gray-200 my-auto">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Check size={28} />
            </div>
            <h3 className="font-bold text-lg text-gray-700">All caught up!</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">No pending item requests from your family members right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-2xl border-2 border-gray-200 shadow-sm flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{req.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                      Requested by: {req.requestedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(req.id)}
                    className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors border border-red-200"
                    title="Reject"
                  >
                    <X size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setEditName(req.name);
                      setSelectedCategory('Others');
                    }}
                    className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors border border-green-200"
                    title="Approve & Add to Catalog"
                  >
                    <Check size={20} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ─── APPROVAL MODAL ─── */}
      <AnimatePresence>
        {selectedRequest && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
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
                <h3 className="title-font text-2xl font-bold text-gray-900">Add to Catalog</h3>
                <button onClick={() => setSelectedRequest(null)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleApprove} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Item Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none font-bold"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-4 rounded-xl font-bold text-lg text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Approve & Save'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
