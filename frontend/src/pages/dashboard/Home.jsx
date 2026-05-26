import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Bot,
  CheckCircle2,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { getUserProperties } from "../../services/api";
import { loadSavedMap } from "./SavedProperties";
import { useAuthStore } from "../../store/authStore";

const stats = [
  {
    key: "active",
    icon: CheckCircle2,
    label: "Active Listings",
    bg: "bg-teal-50",
    color: "text-teal-600",
    line: "bg-teal-400",
  },
  {
    key: "saved",
    icon: Bookmark,
    label: "Saved Properties",
    bg: "bg-violet-50",
    color: "text-violet-600",
    line: "bg-violet-400",
  },
  {
    key: "total",
    icon: BarChart3,
    label: "Total Listed",
    bg: "bg-blue-50",
    color: "text-blue-600",
    line: "bg-blue-400",
  },
];

const quickActions = [
  {
    icon: Sparkles,
    label: "AI Property Assistant",
    desc: "Search properties using natural language",
    to: "/agent",
    bg: "bg-teal-50",
    color: "text-teal-700",
  },
  {
    icon: PlusCircle,
    label: "Post a Property",
    desc: "List your property for sale or rent",
    to: "/my-listings",
    bg: "bg-green-50",
    color: "text-green-600",
  },
  {
    icon: Bookmark,
    label: "Saved Properties",
    desc: "View properties you've bookmarked",
    to: "/saved",
    bg: "bg-violet-50",
    color: "text-violet-600",
  },
];

const helpItems = [
  {
    icon: Search,
    title: "Smart Search",
    text: "Find properties using natural conversation",
  },
  {
    icon: Zap,
    title: "Instant Results",
    text: "Get accurate matches in seconds",
  },
  {
    icon: ShieldCheck,
    title: "Trusted & Secure",
    text: "Your data is safe with us",
  },
];

function StatCard({ icon: Icon, label, value, bg, color, line, loading }) {
  return (
    <div className="h-[clamp(112px,16.1vh,148px)] rounded-2xl border border-slate-200/80 bg-white px-[6.5%] py-[6.5%] shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
      <div className="flex items-center gap-[8%]">
        <span className={`grid h-[clamp(56px,8vh,72px)] w-[clamp(56px,8vh,72px)] shrink-0 place-items-center rounded-full ${bg} ${color}`}>
          <Icon size="50%" strokeWidth={2.1} />
        </span>
        <span>
          {loading ? (
            <span className="mb-1 block h-7 w-8 animate-pulse rounded bg-slate-100" />
          ) : (
            <span className="block text-[clamp(28px,4vh,36px)] font-bold leading-none text-slate-950">{value}</span>
          )}
          <span className="mt-[12%] block text-[clamp(14px,1.7vh,18px)] font-medium text-slate-500">{label}</span>
        </span>
      </div>
      <div className="mt-[7%] h-[3px] rounded-full bg-slate-100">
        <div className={`h-full w-[80%] rounded-full ${line}`} />
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, to, bg, color }) {
  return (
    <Link
      to={to}
      className="group flex h-[clamp(67px,9.65vh,88px)] items-center gap-[4%] border-b border-slate-100 px-[0.5%] last:border-b-0"
    >
      <span className={`grid h-[clamp(40px,5.75vh,54px)] w-[clamp(40px,5.75vh,54px)] shrink-0 place-items-center rounded-xl ${bg} ${color}`}>
        <Icon size="55%" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[clamp(14px,1.7vh,17px)] font-bold text-slate-950 group-hover:text-teal-700">{label}</span>
        <span className="mt-1 block truncate text-[clamp(12px,1.45vh,15px)] text-slate-500">{desc}</span>
      </span>
      <ArrowRight size="3.8%" className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-teal-700" />
    </Link>
  );
}

function HouseIllustration() {
  return (
    <div className="pointer-events-none absolute right-0 top-0 hidden h-[27.4%] min-h-[190px] w-[34%] overflow-hidden lg:block">
      <div className="absolute right-[9%] top-[42%] h-[42%] w-[80%] rounded-full bg-teal-100/70" />
      <div className="absolute right-[17%] top-[46%] h-[50%] w-[31%] rounded-t-xl bg-teal-100 shadow-[inset_0_-16px_0_rgba(20,184,166,0.14)]" />
      <div className="absolute right-[8%] top-[25%] h-[29%] w-[40%] rotate-[26deg] rounded-sm bg-teal-700/60" />
      <div className="absolute right-[32%] top-[25%] h-[29%] w-[40%] -rotate-[26deg] rounded-sm bg-teal-700/60" />
      <div className="absolute right-[25%] top-[48%] grid h-[29%] w-[16%] grid-cols-2 gap-1 bg-white/75 p-1.5">
        <span className="bg-teal-400/30" />
        <span className="bg-teal-400/30" />
        <span className="bg-teal-400/30" />
        <span className="bg-teal-400/30" />
      </div>
      <div className="absolute right-0 top-[42%] h-[42%] w-[22%] rounded-full bg-emerald-200/80" />
      <div className="absolute right-[62%] top-[50%] h-[42%] w-[22%] rounded-full bg-emerald-200/70" />
      <div className="absolute bottom-[6%] right-0 h-1.5 w-[94%] rounded-full bg-teal-200/80" />
      <div className="absolute bottom-0 right-0 h-[29%] w-full bg-gradient-to-t from-teal-50 to-transparent" />
    </div>
  );
}

function SkylineIllustration() {
  return (
    <div className="pointer-events-none absolute bottom-0 right-0 h-[40%] w-[49%] opacity-55">
      <div className="absolute bottom-0 right-[17%] h-[75%] w-[19%] rounded-t-md border-2 border-teal-200 bg-teal-50" />
      <div className="absolute bottom-0 right-[42%] h-[50%] w-[17%] rounded-t-md border-2 border-teal-200 bg-teal-50" />
      <div className="absolute bottom-0 right-[63%] h-[34%] w-[17%] rounded-t-md border-2 border-teal-200 bg-teal-50" />
      <div className="absolute bottom-0 right-[4%] h-[50%] w-[33%] rounded-full bg-teal-100" />
      <div className="absolute bottom-0 right-[83%] h-[38%] w-[17%] rounded-full bg-emerald-200" />
      <div className="absolute bottom-0 right-0 h-1 w-[92%] rounded-full bg-teal-200" />
    </div>
  );
}

export default function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const firstName = user?.name?.split(" ")[0] || "there";

  useEffect(() => {
    // Saved count comes from localStorage instantly — no extra API call
    setSavedCount(Object.keys(loadSavedMap()).length);

    let cancelled = false;
    getUserProperties(user.id)
      .catch(() => [])
      .then((props) => {
        if (cancelled) return;
        setListings(Array.isArray(props) ? props : []);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user.id]);

  const statValues = {
    active: listings.filter((property) => property.status === "active").length,
    saved: savedCount,
    total: listings.length,
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-[#f9fdfd] to-teal-50/55">
      <div className="relative min-h-full px-[2.35%] py-[3.7vh]">
        <HouseIllustration />

        <section className="relative z-10">
          <h1 className="text-[clamp(24px,3.45vh,34px)] font-bold leading-tight tracking-tight text-slate-950">
            Good day, {firstName} 👋
          </h1>
          <p className="mt-[0.9vh] text-[clamp(14px,1.75vh,17px)] text-slate-500">
            Here's a summary of your activity on Replaceio.
          </p>

          <div className="mt-[4.2vh] grid w-[72.9%] grid-cols-1 gap-[1.7%] sm:grid-cols-3">
            {stats.map((stat) => (
              <StatCard
                key={stat.key}
                {...stat}
                value={statValues[stat.key]}
                loading={loading}
              />
            ))}
          </div>
        </section>

        <div className="relative z-10 mt-[3.9vh] grid w-[93.2%] gap-[3%] lg:grid-cols-[56.8%_39.7%]">
          <section>
            <h2 className="text-[clamp(14px,1.7vh,17px)] font-bold text-slate-950">Quick Actions</h2>
            <div className="mt-[1.15vh] rounded-2xl border border-slate-200/80 bg-white px-[4%] py-[2.3%] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              {quickActions.map((action) => (
                <QuickAction key={action.label} {...action} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate("/agent")}
              className="group mt-[3vh] flex h-[clamp(80px,11.5vh,106px)] w-full items-center gap-[3.5%] rounded-2xl bg-gradient-to-r from-teal-700 to-teal-500 px-[3.5%] text-left shadow-[0_18px_34px_rgba(15,118,110,0.20)] transition-transform hover:-translate-y-0.5"
            >
              <span className="grid h-[clamp(48px,6.9vh,64px)] w-[clamp(48px,6.9vh,64px)] shrink-0 place-items-center rounded-xl bg-white/20 text-white ring-1 ring-white/20">
                <Bot size="54%" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[clamp(16px,2.3vh,22px)] font-bold text-white">Try the AI Agent</span>
                <span className="mt-[0.7vh] block truncate text-[clamp(12px,1.5vh,15px)] font-medium text-white/90">
                  Search in plain language - "2BHK in Gomti Nagar under 50L"
                </span>
              </span>
              <ArrowRight size="4.7%" className="text-white transition-transform group-hover:translate-x-1" />
            </button>
          </section>

          <aside className="relative min-h-[clamp(260px,37.5vh,340px)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-[5%] py-[5%] shadow-[0_12px_30px_rgba(15,23,42,0.06)] lg:mt-[2.85vh]">
            <Sparkles className="absolute right-[5%] top-[8%] h-[clamp(18px,2.4vh,23px)] w-[clamp(18px,2.4vh,23px)] text-teal-400" />
            <h2 className="text-[clamp(16px,2vh,20px)] font-bold text-slate-950">Let AI help you</h2>
            <div className="relative z-10 mt-[6%] space-y-[5.5%] pb-[12%]">
              {helpItems.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-center gap-[5%]">
                  <span className="grid h-[clamp(40px,5.5vh,52px)] w-[clamp(40px,5.5vh,52px)] shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700">
                    <Icon size="50%" />
                  </span>
                  <span>
                    <span className="block text-[clamp(13px,1.55vh,16px)] font-bold text-slate-950">{title}</span>
                    <span className="mt-1 block text-[clamp(11px,1.3vh,14px)] text-slate-500">{text}</span>
                  </span>
                </div>
              ))}
            </div>
            <SkylineIllustration />
          </aside>
        </div>
      </div>
    </div>
  );
}
