import { useState, useEffect } from "react";
import { Check, Info, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { getProfile } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import toast from "react-hot-toast";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const labelCls = "mb-2 block text-sm font-bold text-slate-500";

export default function Settings() {
  const { user, setAuth, token } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setForm({ name: p.name || "", phone: p.phone || "" });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put("/api/users/profile", form).then((r) => r.data);
      setProfile(updated);
      setAuth({ ...user, name: updated.name, phone: updated.phone }, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const displayName = form.name || user?.email?.split("@")[0] || "U";
  const role = profile?.role || "user";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "-";

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-[#f9fdfd] to-teal-50/55">
    <div className="min-h-full px-[2.35%] py-[3.7vh]">
      <div className="mb-[3.2vh]">
        <h1 className="text-[clamp(24px,3.25vh,34px)] font-bold leading-tight text-slate-950">Settings</h1>
        <p className="mt-2 text-[clamp(14px,1.7vh,17px)] text-slate-500">Manage your account and profile.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading profile...</span>
        </div>
      ) : (
        <>
          {/* Avatar */}
          <div className="mb-[3.8vh] flex items-center gap-5">
            <div className="flex h-[clamp(64px,8.7vh,88px)] w-[clamp(64px,8.7vh,88px)] items-center justify-center rounded-full bg-teal-100 text-[clamp(28px,3.8vh,38px)] font-bold text-teal-700">
              {displayName[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[clamp(17px,2.2vh,22px)] font-bold text-slate-950">{displayName}</p>
              <p className="mt-1 text-[clamp(13px,1.65vh,16px)] text-slate-500">{user?.email}</p>
              <span className="mt-2 inline-block rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold capitalize text-teal-700">
                {role}
              </span>
            </div>
          </div>

          <div className="grid w-[72%] min-w-[760px] gap-[2.4%] lg:grid-cols-2">
            {/* Profile form */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-[4.5%] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="mb-[5%] flex items-center gap-4">
                <span className="grid h-[clamp(42px,5.7vh,56px)] w-[clamp(42px,5.7vh,56px)] place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <UserRound size="50%" />
                </span>
                <h2 className="text-[clamp(16px,2vh,20px)] font-bold text-slate-950">Profile Information</h2>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputCls}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className={inputCls}
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input value={user?.email || ""} disabled className={inputCls} />
                  <p className="mt-2 text-sm font-medium text-slate-400">Email cannot be changed.</p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,118,110,0.22)] transition-colors hover:bg-teal-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : saved ? (
                    <Check size={15} />
                  ) : (
                    <Check size={15} />
                  )}
                  {saved ? "Saved!" : "Save Changes"}
                </button>
              </form>
            </div>

            {/* Account info */}
            <div className="h-fit rounded-2xl border border-slate-200/80 bg-white p-[4.5%] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="mb-[6%] flex items-center gap-4">
                <span className="grid h-[clamp(42px,5.7vh,56px)] w-[clamp(42px,5.7vh,56px)] place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <ShieldCheck size="50%" />
                </span>
                <h2 className="text-[clamp(16px,2vh,20px)] font-bold text-slate-950">Account</h2>
              </div>

              <div className="divide-y divide-slate-100 text-[clamp(14px,1.75vh,17px)]">
                <div className="flex items-center justify-between py-4 text-slate-500">
                  <span>Member since</span>
                  <span className="font-bold text-slate-800">{memberSince}</span>
                </div>
                <div className="flex items-center justify-between py-4 text-slate-500">
                  <span>Account type</span>
                  <span className="font-bold capitalize text-slate-800">{role}</span>
                </div>
              </div>

              <div className="mt-[7%] flex items-center gap-4 rounded-xl border border-teal-100 bg-teal-50 p-[4.5%]">
                <Info className="h-5 w-5 shrink-0 text-teal-700" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-950">Need to upgrade your account?</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Upgrade to access premium features and grow your business.
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-xl border border-teal-200 bg-white/60 px-4 py-2 text-sm font-bold text-teal-700 transition-colors hover:bg-white"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </div>
  );
}
