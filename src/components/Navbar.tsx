import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, LayoutDashboard, Grid, Shield, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (currentUser) {
    return (
      <nav className="fixed bottom-0 w-full z-50 bg-background/60 backdrop-blur-xl border-t border-outline-variant/10 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
          <Link to="/" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link to="/dashboard" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/dashboard' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
          <Link to="/categories" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname.startsWith('/categories') ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
            <Grid className="w-5 h-5" />
            <span className="text-[10px] font-medium">Categories</span>
          </Link>
          {userData?.isAdmin && (
            <Link to="/admin" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/admin' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-medium">Admin</span>
            </Link>
          )}
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-error transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-outline-variant/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-2xl font-headline font-bold text-gradient">Sir Korab</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
            <Link to="/pricing" className="text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-md text-sm font-medium transition-colors">Pricing</Link>
            <Link to="/login" className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-full text-sm font-medium transition-all glow-primary">
              Join Now
            </Link>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-black/80 backdrop-blur-xl absolute w-full border-b border-white/10 shadow-2xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-bold transition-colors">Home</Link>
            <Link to="/pricing" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-bold transition-colors">Pricing</Link>
            <Link to="/login" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-bold transition-colors">Join Now</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
