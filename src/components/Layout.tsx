import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileUp, 
  CheckCircle2, 
  LogOut, 
  User as UserIcon,
  Bell,
  Menu,
  X,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NotificationBell from './NotificationBell';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(profile?.role === 'user' ? [{ name: 'Unggah SPJ', path: '/upload', icon: FileUp }] : []),
    ...(profile?.role === 'admin' ? [
      { name: 'Verifikasi', path: '/verify', icon: CheckCircle2 },
      { name: 'Manajemen User', path: '/users', icon: Users }
    ] : []),
    { name: 'Rekapitulasi', path: '/recap', icon: FileUp },
  ];

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-dark-surface flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-dark-panel border-b border-dark-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-tighter text-white leading-none">VERIF.SPJ</h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-dark-muted">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-dark-panel border-r border-dark-border transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 hidden md:flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tighter text-white leading-none">VERIF.SPJ</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-dark-muted mt-1 font-bold">System Management</p>
            </div>
            <NotificationBell />
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all border
                    ${isActive 
                      ? 'bg-dark-border text-white border-[#333]' 
                      : 'text-dark-muted hover:text-white border-transparent'}
                  `}
                >
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-gold' : 'bg-transparent'}`}></div>
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t border-dark-border space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-dark-border border border-[#333] flex items-center justify-center text-[10px] font-bold text-gold">
                {profile?.displayName?.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{profile?.displayName}</p>
                <p className="text-[10px] text-dark-muted uppercase tracking-widest">{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-xs font-medium uppercase tracking-widest"
            >
              <LogOut size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="container mx-auto px-4 py-8 md:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
