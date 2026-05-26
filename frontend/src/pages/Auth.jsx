import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Home,
  Loader2,
  Lock,
  Mail,
  Search,
  ShieldCheck,
  User,
  Phone,
} from "lucide-react";
import { login, register } from "../services/api";
import { useAuthStore } from "../store/authStore";
import logoSrc from "../assets/logo.webp";
import toast from "react-hot-toast";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm text-slate-800 shadow-[0_10px_26px_rgba(15,23,42,0.06)] outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

const featureCards = [
  {
    icon: Search,
    title: "AI-Powered Search",
    text: "Describe your ideal home in your own words.",
  },
  {
    icon: Home,
    title: "Smart Recommendations",
    text: "Get personalized property suggestions.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted & Secure",
    text: "Your data is safe with us.",
  },
];

function AuthBrandMark() {
  return (
    <div className="mb-12 flex justify-center">
      <div className="flex items-center gap-2 sm:gap-3">
        <img
          src={logoSrc}
          alt=""
          className="h-16 w-16 object-contain drop-shadow-sm sm:h-20 sm:w-20"
          aria-hidden="true"
        />
        <span className="whitespace-nowrap text-4xl font-extrabold tracking-tight text-teal-700 sm:text-5xl">
          Replaceio
        </span>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, rightSlot, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        {children}
        {rightSlot}
      </div>
    </div>
  );
}

export default function Auth({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const rememberedEmail =
    typeof window !== "undefined" ? localStorage.getItem("replaceio-remember-email") || "" : "";
  const [form, setForm] = useState({ name: "", email: rememberedEmail, phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Pre-warm the backend as soon as the page loads so cold-start
  // doesn't delay the actual login request.
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    fetch(`${base}/health`).catch(() => {});
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setShowPassword(false);
  };

  const handleForgotPassword = () => {
    toast("Password reset is not available yet.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await login({ email: form.email, password: form.password });
        if (rememberMe) {
          localStorage.setItem("replaceio-remember-email", form.email);
        } else {
          localStorage.removeItem("replaceio-remember-email");
        }
        setAuth(data.user, data.access_token, data.refresh_token);
        navigate(from, { replace: true });
      } else {
        const data = await register({ ...form, role: "user" });
        if (data.access_token) {
          setAuth(data.user, data.access_token, data.refresh_token);
          toast.success("Account created! Welcome.");
          navigate("/", { replace: true });
        } else {
          toast.success("Account created! Please verify your email then login.");
          setMode("login");
        }
      }
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          (!err.response
            ? "Backend unavailable. Please start the API server."
            : mode === "login"
              ? "Invalid credentials"
              : "Registration failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-7">
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1840px] overflow-hidden rounded-[28px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.10)] sm:min-h-[calc(100vh-3.5rem)]">
        <aside className="relative hidden w-[49.5%] overflow-hidden bg-[#063b4e] px-14 py-14 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_93%_38%,rgba(20,184,166,0.34),transparent_33%),linear-gradient(145deg,#07384e_0%,#07445b_42%,#0c766f_100%)]" />
          <div className="absolute -right-36 top-16 h-[720px] w-[720px] rounded-full bg-white/5" />
          <div className="absolute bottom-0 right-0 h-[48%] w-[55%] opacity-25">
            <div className="absolute bottom-24 right-10 h-44 w-72 border border-cyan-200/60 bg-cyan-300/10" />
            <div className="absolute bottom-24 right-24 h-24 w-24 border border-cyan-200/60" />
            <div className="absolute bottom-0 right-0 h-px w-full bg-cyan-200/50" />
            <div className="absolute bottom-0 right-32 h-64 w-px bg-cyan-200/30" />
            <div className="absolute bottom-0 right-60 h-44 w-px bg-cyan-200/25" />
          </div>

          <div className="relative z-10 mt-auto max-w-[500px] pb-8">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Find your
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                perfect home
              </span>
              <br />
              with AI
            </h1>
            <p className="mt-8 text-xl leading-8 text-cyan-50/90">
              Search thousands of properties using plain language - no filters needed.
            </p>

            <div className="mt-10 space-y-4">
              {featureCards.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="flex items-center gap-5 rounded-xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/5"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-200">
                    <Icon className="h-7 w-7" />
                  </span>
                  <span>
                    <span className="block text-lg font-bold">{title}</span>
                    <span className="mt-1 block text-sm text-cyan-50/80">{text}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-sm text-cyan-50/60">
            © 2025 Replaceio. All rights reserved.
          </p>
        </aside>

        <main className="relative flex flex-1 items-center justify-center overflow-x-hidden overflow-y-auto bg-gradient-to-br from-white via-white to-teal-50 px-4 py-8 sm:px-8 lg:px-10">
          <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-teal-100/50 blur-3xl" />
          <div className="absolute bottom-0 left-12 h-56 w-56 rounded-full bg-cyan-100/45 blur-3xl" />

          <div className="relative z-10 flex w-full max-w-[760px] justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
            <div className="w-full max-w-[560px]">
              <AuthBrandMark />

              <div className="mb-9 text-center">
                <h2 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h2>
                <p className="mt-4 text-lg text-slate-500">
                  {mode === "login"
                    ? "Sign in to your Replaceio account"
                    : "Join Replaceio - it's free"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "register" && (
                <>
                  <Field icon={User} label="Full Name">
                    <input
                      value={form.name}
                      onChange={set("name")}
                      required
                      className={inputCls}
                      placeholder="Your full name"
                    />
                  </Field>
                  <Field icon={Phone} label="Phone">
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={set("phone")}
                      required
                      className={inputCls}
                      placeholder="10-digit mobile number"
                    />
                  </Field>
                </>
              )}

              <Field icon={Mail} label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  className={inputCls}
                  placeholder="you@email.com"
                />
              </Field>

              <Field
                icon={Lock}
                label="Password"
                rightSlot={
                  mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-teal-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  )
                }
              >
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={6}
                  className={`${inputCls} ${mode === "login" ? "pr-12" : ""}`}
                  placeholder="••••••••"
                />
              </Field>

              {mode === "login" && (
                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="flex cursor-pointer items-center gap-3 font-medium text-slate-500">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={`grid h-5 w-5 place-items-center rounded shadow-sm transition-colors ${
                        rememberMe ? "bg-teal-600 text-white" : "bg-white text-transparent ring-1 ring-slate-300"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="font-semibold text-teal-700 transition-colors hover:text-teal-900"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-teal-600 px-5 py-4 text-base font-bold text-white shadow-[0_14px_34px_rgba(15,118,110,0.28)] transition-all hover:bg-teal-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                    <ArrowRight className="ml-auto h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
              </form>

              <div className="my-8 flex items-center gap-6 text-sm font-medium text-slate-500">
                <span className="h-px flex-1 bg-slate-200" />
                <span>or</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <p className="text-center text-sm text-slate-500">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("register")}
                    className="font-bold text-teal-700 hover:text-teal-900"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("login")}
                    className="font-bold text-teal-700 hover:text-teal-900"
                  >
                    Sign In
                  </button>
                </>
              )}
              </p>

              <p className="mt-9 text-center text-xs font-semibold uppercase tracking-[0.34em] text-slate-400">
                Powered by <span className="text-teal-700">Zencia</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
