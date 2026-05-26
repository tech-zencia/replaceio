import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, PlusCircle, Trash2, Loader2, Upload, X,
  MapPin, BedDouble, Maximize2, Eye, CheckCircle2, Home, ListChecks,
  MessageSquare, Bookmark, BarChart3,
} from "lucide-react";
import {
  getUserProperties,
  deleteProperty,
  createProperty,
  uploadMedia,
} from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

const AMENITIES = [
  "Parking", "Lift", "Gym", "Swimming Pool", "Power Backup",
  "Security", "Garden", "Club House", "CCTV", "Gas Pipeline",
];

const STEPS = ["Basic Info", "Location", "Details", "Amenities", "Photos"];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

const insightRows = [
  { icon: Eye, label: "Total Views", value: 0 },
  { icon: MessageSquare, label: "Total Inquiries", value: 0 },
  { icon: Bookmark, label: "Saved Listings", value: 0 },
];

function formatPrice(price) {
  if (!price) return "—";
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(1)} Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

function PostModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", property_type: "flat", listing_type: "sale",
    address: "", city: "", locality: "", pincode: "",
    price: "", area_sqft: "", bedrooms: "", bathrooms: "", floor_number: "",
    furnishing_status: "", possession_status: "", property_age_years: "",
    amenities: [],
  });

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));
  const toggle = (a) => set("amenities", form.amenities.includes(a)
    ? form.amenities.filter((x) => x !== a)
    : [...form.amenities, a]);

  const canNext = [
    form.title && form.property_type && form.listing_type,
    form.city && form.locality && form.address,
    form.price && form.area_sqft,
    true,
    true,
  ][step];

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    setImages((prev) => [...prev, ...files].slice(0, 10));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        area_sqft: parseFloat(form.area_sqft) || undefined,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        floor_number: form.floor_number ? parseInt(form.floor_number) : undefined,
        property_age_years: form.property_age_years ? parseInt(form.property_age_years) : undefined,
      };
      const property = await createProperty(payload);
      if (images.length) await uploadMedia(property.id, images);
      toast.success("Property posted!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to post property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative flex max-h-[92vh] w-full flex-col bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl rounded-t-3xl">

        {/* Modal header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Post a Property</h2>
            <p className="mt-1 text-sm text-slate-500">Step {step + 1} of {STEPS.length} - {STEPS[step]}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex flex-shrink-0 items-center gap-1.5 border-b border-slate-50 px-6 py-3">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                i <= step ? "bg-teal-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Property Title *</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="e.g. Spacious 2BHK in Gomti Nagar" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type *</label>
                  <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className={inputCls}>
                    {["flat", "house", "villa", "plot", "commercial", "pg"].map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>For *</label>
                  <select value={form.listing_type} onChange={(e) => set("listing_type", e.target.value)} className={inputCls}>
                    <option value="sale">Sale</option>
                    <option value="rent">Rent</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City *</label>
                  <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} placeholder="Lucknow" />
                </div>
                <div>
                  <label className={labelCls}>Locality *</label>
                  <input value={form.locality} onChange={(e) => set("locality", e.target.value)} className={inputCls} placeholder="Gomti Nagar" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Full Address *</label>
                <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} placeholder="Plot no, street..." />
              </div>
              <div>
                <label className={labelCls}>Pincode</label>
                <input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputCls} placeholder="226010" maxLength={6} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Price (₹) *</label>
                  <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className={inputCls} placeholder="4500000" />
                </div>
                <div>
                  <label className={labelCls}>Area (sqft) *</label>
                  <input type="number" value={form.area_sqft} onChange={(e) => set("area_sqft", e.target.value)} className={inputCls} placeholder="1200" />
                </div>
                <div>
                  <label className={labelCls}>Bedrooms</label>
                  <select value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} BHK</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Bathrooms</label>
                  <select value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Furnishing</label>
                  <select value={form.furnishing_status} onChange={(e) => set("furnishing_status", e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    <option value="furnished">Furnished</option>
                    <option value="semi_furnished">Semi Furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Possession</label>
                  <select value={form.possession_status} onChange={(e) => set("possession_status", e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    <option value="ready_to_move">Ready to Move</option>
                    <option value="under_construction">Under Construction</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Describe the property..." />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">Select amenities</p>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map((a) => (
                  <button key={a} type="button" onClick={() => toggle(a)}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                      form.amenities.includes(a)
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"
                    }`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-teal-50/30 p-8 transition-colors hover:border-teal-400">
                <Upload size={24} className="mb-2 text-teal-600" />
                <span className="text-sm font-semibold text-slate-600">Tap to select photos</span>
                <span className="mt-1 text-xs text-slate-400">Up to 10 images</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {images.map((f, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Back
            </button>
          ) : (
            <button onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50">
              Cancel
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext}
              className="rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50">
              Continue
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading || !form.title || !form.price}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Post Property
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingCard({ prop, onDelete }) {
  const image = prop.property_media?.[0]?.url;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.10)]">
      <div className="relative h-[clamp(150px,20vh,210px)] bg-gradient-to-br from-teal-50 to-slate-100">
        {image ? (
          <img src={image} alt={prop.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={42} className="text-teal-200" />
          </div>
        )}
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
          prop.status === "active" ? "bg-emerald-500 text-white" : "bg-slate-400 text-white"
        }`}>
          {prop.status === "active" ? "Active" : "Inactive"}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-slate-950/55 px-3 py-1 text-xs font-bold capitalize text-white backdrop-blur-sm">
          {prop.listing_type}
        </span>
      </div>

      <div className="p-5">
        <p className="line-clamp-1 text-base font-bold text-slate-950">{prop.title}</p>
        <p className="mt-1 text-lg font-bold text-teal-700">{formatPrice(prop.price)}</p>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={14} className="text-teal-600" />
          <span className="truncate">{prop.locality}, {prop.city}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
          {prop.bedrooms && (
            <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1">
              <BedDouble size={13} />{prop.bedrooms} BHK
            </span>
          )}
          {prop.area_sqft && (
            <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1">
              <Maximize2 size={13} />{prop.area_sqft.toLocaleString()} sqft
            </span>
          )}
          <span className="rounded-full bg-teal-50 px-2.5 py-1 capitalize text-teal-700">{prop.property_type}</span>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
          <Link
            to={`/property/${prop.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-50 py-2.5 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-100"
          >
            <Eye size={15} />
            View
          </Link>
          <button
            onClick={() => onDelete(prop.id)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-100"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, value, label, tone }) {
  const tones = {
    teal: "from-teal-50 to-teal-100/70 text-teal-700",
    green: "from-emerald-50 to-emerald-100/70 text-emerald-600",
    slate: "from-slate-50 to-white text-slate-500",
  };

  return (
    <div className={`rounded-xl bg-gradient-to-br ${tones[tone]} p-[4.5%]`}>
      <Icon className="mb-[6%] h-[clamp(16px,2.3vh,22px)] w-[clamp(16px,2.3vh,22px)]" />
      <p className="text-[clamp(22px,3.1vh,32px)] font-bold leading-none text-slate-950">{value}</p>
      <p className="mt-[5%] text-[clamp(12px,1.45vh,15px)] font-medium text-slate-500">{label}</p>
    </div>
  );
}

function InsightsPanel() {
  return (
    <aside className="rounded-2xl bg-gradient-to-br from-[#183f82] via-[#2259aa] to-[#1f62bd] p-[5%] text-white shadow-[0_18px_36px_rgba(30,78,150,0.28)]">
      <h2 className="text-[clamp(18px,2.35vh,24px)] font-bold">Insights Overview</h2>
      <p className="mt-[3%] text-[clamp(12px,1.45vh,15px)] font-medium text-white/80">
        Stay updated with your listing performance.
      </p>

      <div className="mt-[8%] space-y-[4%]">
        {insightRows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-[4%] rounded-xl bg-white/10 px-[4%] py-[3.5%]">
            <Icon className="h-[clamp(15px,2vh,19px)] w-[clamp(15px,2vh,19px)] text-white" />
            <span className="flex-1 text-[clamp(12px,1.55vh,15px)] font-semibold text-white/90">{label}</span>
            <span className="text-[clamp(15px,2vh,19px)] font-bold">{value}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-[5%] flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-[3.5%] text-[clamp(12px,1.55vh,15px)] font-bold text-white transition-colors hover:bg-white/15"
      >
        <BarChart3 size={17} />
        View Analytics
      </button>
    </aside>
  );
}

export default function MyListings() {
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getUserProperties(user.id)
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load listings"))
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this property?")) return;
    try {
      await deleteProperty(id);
      setListings((prev) => prev.filter((p) => p.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const activeCount = listings.filter((p) => p.status === "active").length;
  const inactiveCount = Math.max(listings.length - activeCount, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-[#f9fdfd] to-teal-50/55">
    <div className="min-h-full px-[2.35%] py-[3.7vh]">

      {/* Header */}
      <div className="mb-[4.3vh] grid w-[93.2%] gap-[3%] lg:grid-cols-[69%_28%]">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-[2.1%] py-[2.4%] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[clamp(24px,3.25vh,34px)] font-bold leading-tight text-slate-950">
                My Listings
              </h1>
              <p className="mt-[1.2vh] text-[clamp(14px,1.7vh,17px)] text-slate-500">
                Manage every property you have posted on Replaceio.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="mt-[0.4%] flex shrink-0 items-center gap-2 rounded-xl bg-teal-600 px-[2.5%] py-[1.2%] text-[clamp(12px,1.55vh,15px)] font-bold text-white shadow-[0_12px_28px_rgba(15,118,110,0.22)] transition-colors hover:bg-teal-700"
            >
              <PlusCircle size={17} />
              Post New
            </button>
          </div>

          <div className="mt-[4%] grid gap-[1.2%] sm:grid-cols-3">
            <StatTile icon={ListChecks} value={loading ? "..." : listings.length} label="Total Listings" tone="teal" />
            <StatTile icon={CheckCircle2} value={loading ? "..." : activeCount} label="Active" tone="green" />
            <StatTile icon={Home} value={loading ? "..." : inactiveCount} label="Inactive" tone="slate" />
          </div>
        </div>

        <InsightsPanel />
      </div>

      {/* Listings grid */}
      {loading ? (
        <div className="grid w-[93.2%] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
              <div className="h-[clamp(150px,20vh,210px)] animate-pulse bg-slate-100" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex min-h-[38.5vh] w-[93.2%] items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="max-w-[330px]">
            <span className="mx-auto grid h-[clamp(62px,8.6vh,84px)] w-[clamp(62px,8.6vh,84px)] place-items-center rounded-full bg-teal-50 text-teal-700">
              <Building2 size="52%" />
            </span>
            <p className="mt-[2.6vh] text-[clamp(18px,2.35vh,24px)] font-bold text-slate-950">No listings yet</p>
            <p className="mt-[1.3vh] text-[clamp(12px,1.45vh,15px)] leading-6 text-slate-500">
              Post your first property with photos, pricing, and location details.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-[2.8vh] inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-[clamp(12px,1.55vh,15px)] font-bold text-white transition-colors hover:bg-teal-700"
            >
              <PlusCircle size={17} />
              Post New
            </button>
          </div>
        </div>
      ) : (
        <div className="grid w-[93.2%] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((prop) => (
            <ListingCard key={prop.id} prop={prop} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Post modal */}
      {showModal && (
        <PostModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
    </div>
  );
}
