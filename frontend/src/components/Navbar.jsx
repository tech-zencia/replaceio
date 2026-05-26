import { Link, useNavigate } from "react-router-dom";
import { Home, Search, PlusCircle, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setOpen(false);
  };

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/search", label: "Search", icon: Search },
    ...(user
      ? [
          { to: "/post-property", label: "Post Property", icon: PlusCircle },
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 safe-top">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 font-bold text-xl text-brand-700">
            <span className="text-2xl">9</span>
            <span className="text-brand-600">Roof</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors">
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-brand-600">Login</Link>
                <Link to="/register" className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-600">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">
                <Icon size={18} className="text-brand-600" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
            {user ? (
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 mt-1">
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            ) : (
              <div className="flex gap-2 mt-2 px-3">
                <Link to="/login" onClick={() => setOpen(false)}
                  className="flex-1 text-center py-2.5 border border-brand-600 text-brand-600 rounded-lg font-medium text-sm">
                  Login
                </Link>
                <Link to="/register" onClick={() => setOpen(false)}
                  className="flex-1 text-center py-2.5 bg-brand-600 text-white rounded-lg font-medium text-sm">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
