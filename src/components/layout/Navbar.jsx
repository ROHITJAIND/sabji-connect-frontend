import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';

export default function Navbar({ onMenuOpen }) {
  const { currentUser, userRole, userDisplayName } = useAuth();

  if (!currentUser) return null;

  return (
    <nav className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md">
      {/* Hamburger menu */}
      <button
        onClick={onMenuOpen}
        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        aria-label="Menu"
      >
        <Menu size={22} strokeWidth={2.5} className="text-white" />
      </button>

      {/* Title */}
      <h1 className="text-xl font-extrabold text-white tracking-wide" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.15)' }}>
        Sabji Connect
      </h1>

      {/* Name badge */}
      <div className="bg-white/20 px-3 py-1.5 rounded-full font-bold text-sm max-w-[120px] truncate">
        {userDisplayName || userRole || '...'}
      </div>
    </nav>
  );
}
