import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * NotificationToast — floating in-app notification banner.
 * Renders at the top of the screen when a foreground push arrives.
 */
export default function NotificationToast() {
  const { notificationToast, setNotificationToast } = useAuth();

  return (
    <AnimatePresence>
      {notificationToast && (
        <motion.div
          key={notificationToast.id}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-4 right-4 max-w-lg mx-auto z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          <div className="flex items-start gap-3 p-4">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <Bell size={20} className="text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-tight">{notificationToast.title}</p>
              <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">{notificationToast.body}</p>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setNotificationToast(null)}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 5, ease: 'linear' }}
            className="h-1 bg-gradient-to-r from-orange-400 to-amber-500 origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
