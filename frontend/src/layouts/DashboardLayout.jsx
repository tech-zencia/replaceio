import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Bookmark,
  Bot,
  ChevronDown,
  ChevronsLeft,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquarePlus,
  Plus,
  Settings,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import logoSrc from "../assets/logo2.webp";
import { useAuthStore } from "../store/authStore";

const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/my-listings", label: "My Listings", icon: FileText, end: false },
  { to: "/agent", label: "AI Agent", icon: Bot, end: false },
  { to: "/saved", label: "Saved", icon: Bookmark, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

function getSectionTitle(pathname) {
  if (pathname.startsWith("/property/")) return "Property Details";
  const active = NAV.find(({ to, end }) =>
    end ? pathname === to : pathname.startsWith(to)
  );
  return active?.label || "Dashboard";
}

function Avatar({ name, email, size = "md" }) {
  const letter = (name || email || "U")[0].toUpperCase();
  const sizeClass =
    size === "header"
      ? "h-[clamp(42px,5.2vh,54px)] w-[clamp(42px,5.2vh,54px)] text-base"
      : size === "sm"
        ? "h-[clamp(32px,3.5vh,40px)] w-[clamp(32px,3.5vh,40px)] text-xs"
        : "h-[clamp(40px,4.4vh,52px)] w-[clamp(40px,4.4vh,52px)] text-sm";

  return (
    <span className={`${sizeClass} grid shrink-0 place-items-center rounded-full bg-teal-100 font-bold text-teal-700`}>
      {letter}
    </span>
  );
}

function SidebarLinks({ onNavigate }) {
  return (
    <nav className="space-y-[4%]">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `relative flex h-[clamp(44px,5.8vh,54px)] items-center gap-[9%] rounded-r-xl px-[9%] text-[clamp(13px,1.65vh,16px)] font-bold transition-colors before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-r-full ${
              isActive
                ? "bg-teal-50 text-teal-700 before:bg-teal-500 [&>svg]:text-teal-700"
                : "text-slate-700 before:bg-transparent [&>svg]:text-slate-500 hover:bg-teal-50/70 hover:text-teal-700 hover:[&>svg]:text-teal-700"
            }`
          }
        >
          <Icon className="h-[clamp(17px,2.2vh,21px)] w-[clamp(17px,2.2vh,21px)] shrink-0" strokeWidth={2.1} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function QuickActions({ onPostListing, onNewChat }) {
  return (
    <div className="border-t border-slate-200/80 px-[8%] pb-[8%] pt-[8%]">
      <p className="mb-[8%] text-[clamp(10px,1.25vh,12px)] font-extrabold uppercase tracking-[0.12em] text-slate-500">
        Quick Actions
      </p>
      <div className="space-y-[7%]">
        <button
          type="button"
          onClick={onPostListing}
          className="flex w-full items-center gap-[8%] rounded-xl text-left text-[clamp(12px,1.45vh,14px)] font-semibold text-slate-600 transition-colors hover:text-teal-700"
        >
          <span className="grid h-[clamp(28px,3.7vh,36px)] w-[clamp(28px,3.7vh,36px)] place-items-center rounded-full bg-teal-100 text-teal-700">
            <Plus size="54%" />
          </span>
          <span>Post New Listing</span>
        </button>
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-[8%] rounded-xl text-left text-[clamp(12px,1.45vh,14px)] font-semibold text-slate-600 transition-colors hover:text-teal-700"
        >
          <span className="grid h-[clamp(28px,3.7vh,36px)] w-[clamp(28px,3.7vh,36px)] place-items-center rounded-full bg-teal-100 text-teal-700">
            <MessageSquarePlus size="50%" />
          </span>
          <span>New Chat</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(location.pathname === "/agent");
  const dropRef = useRef(null);
  const prevPath = useRef(location.pathname);

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const sectionTitle = getSectionTitle(location.pathname);

  useEffect(() => {
    if (location.pathname === "/agent" && prevPath.current !== "/agent") {
      setSidebarCollapsed(true);
    }
    prevPath.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/auth", { replace: true });
  };

  const handlePostListing = () => {
    navigate("/my-listings");
  };

  const handleNewChat = () => {
    navigate("/agent");
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f5fbfa] text-slate-950">
      <div className="flex h-full overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <aside
          className="hidden shrink-0 flex-col overflow-hidden border-r border-teal-100 bg-white md:flex"
          style={{
            width: sidebarCollapsed ? 0 : "12.8%",
            transition: "width 280ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div className="flex h-[13.3%] min-h-[100px] items-start justify-between px-[8%] pt-[3%]">
            <div className="flex flex-col items-center">
              <img src={logoSrc} alt="Replaceio" className="brand-logo w-[75%] min-w-[90px] max-w-[130px]" />
              <span className="-mt-3 text-[clamp(13px,1.6vh,16px)] font-extrabold tracking-wide text-teal-700">Replaceio</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className="mt-[8%] grid h-[clamp(30px,4vh,38px)] w-[clamp(30px,4vh,38px)] place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-teal-50 hover:text-teal-700"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft size={18} />
            </button>
          </div>

          <div className="flex-1 px-[8%]">
            <SidebarLinks />
          </div>

          <QuickActions onPostListing={handlePostListing} onNewChat={handleNewChat} />

          <div className="border-t border-teal-100 px-[7%] py-[7%]">
            <div className="rounded-2xl bg-teal-50 px-[8%] py-[8%]">
              <p className="text-[clamp(13px,1.65vh,16px)] font-bold text-slate-950">
                Need help?
              </p>
              <p className="mt-[4%] text-[clamp(11px,1.35vh,13px)] leading-relaxed text-slate-500">
                Ask the AI agent or contact support.
              </p>
              <button
                type="button"
                onClick={handleNewChat}
                className="mt-[8%] w-full rounded-xl bg-teal-600 px-3 py-2 text-[clamp(11px,1.35vh,13px)] font-bold text-white transition-colors hover:bg-teal-700"
              >
                Get Support
              </button>
            </div>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative z-10 flex h-full w-72 flex-col bg-white shadow-xl">
              <div className="flex h-24 items-center justify-between border-b border-teal-100 px-5">
                <img src={logoSrc} alt="Replaceio" className="brand-logo w-[100px]" />
                <button type="button" onClick={() => setMobileOpen(false)} className="p-1 text-slate-500">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 px-5 py-5">
                <SidebarLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <QuickActions
                onPostListing={() => {
                  setMobileOpen(false);
                  handlePostListing();
                }}
                onNewChat={() => {
                  setMobileOpen(false);
                  handleNewChat();
                }}
              />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-[9.2%] min-h-[64px] max-h-[92px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-[2.2%]">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-1.5 text-slate-500 md:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
              {sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  className="hidden rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-teal-50 hover:text-slate-950 md:flex"
                  aria-label="Open sidebar"
                >
                  <Menu size={20} />
                </button>
              )}
              <h1 className="truncate text-xl font-bold text-slate-950">{sectionTitle}</h1>
            </div>

            <div ref={dropRef} className="relative flex shrink-0 items-center gap-[clamp(18px,2.2vw,34px)]">
              <button type="button" className="relative grid h-[clamp(40px,5vh,52px)] w-[clamp(40px,5vh,52px)] place-items-center rounded-xl text-slate-600 hover:bg-teal-50">
                <Bell size="48%" />
                <span className="absolute right-[24%] top-[22%] h-[clamp(7px,0.9vh,10px)] w-[clamp(7px,0.9vh,10px)] rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
              <button
                type="button"
                onClick={() => setDropOpen((value) => !value)}
                className="flex items-center gap-[clamp(10px,1vw,16px)] rounded-xl"
              >
                <Avatar name={user?.name} email={user?.email} size="header" />
                <span className="hidden text-[clamp(14px,1.8vh,18px)] font-bold text-slate-950 sm:block">{displayName}</span>
                <ChevronDown size={18} className="text-slate-500" />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-slate-100 bg-white py-1 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-bold text-slate-950">{displayName}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8fdfc] pb-16 md:pb-0">
            <Outlet />
          </main>
        </div>

        <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white md:hidden">
          <div className="flex">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                    isActive ? "text-teal-700" : "text-slate-400"
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
