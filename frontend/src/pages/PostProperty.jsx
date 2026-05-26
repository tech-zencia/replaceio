import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Loader2 } from "lucide-react";
import { createProperty, uploadMedia } from "../services/api";
import toast from "react-hot-toast";

const AMENITIES = ["Parking", "Lift", "Gym", "Swimming Pool", "Power Backup", "Security", "Garden", "Club House", "CCTV", "Gas Pipeline", "Intercom", "Water Supply"];

const STEPS = ["Basic Info", "Location", "Details", "Amenities", "Photos", "Review"];

export default function PostProperty() {
  const navigate = useNavigate();
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

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleAmenity = (a) => {
    set("amenities", form.amenities.includes(a)
      ? form.amenities.filter((x) => x !== a)
      : [...form.amenities, a]);
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    setImages((prev) => [...prev, ...files].slice(0, 10));
  };

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        area_sqft: parseFloat(form.area_sqft),
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        floor_number: form.floor_number ? parseInt(form.floor_number) : undefined,
        property_age_years: form.property_age_years ? parseInt(form.property_age_years) : undefined,
      };
      const property = await createProperty(payload);
      if (images.length) await uploadMedia(property.id, images);
      toast.success("Property posted successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to post property");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  const canProceed = [
    form.title && form.property_type && form.listing_type,
    form.city && form.locality && form.address,
    form.price && form.area_sqft,
    true,
    true,
    true,
  ][step];

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Post a Property</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${i < step ? "bg-brand-600 text-white" : i === step ? "bg-brand-600 text-white ring-4 ring-brand-100" : "bg-gray-200 text-gray-500"}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-xs text-center hidden sm:block ${i === step ? "text-brand-700 font-medium" : "text-gray-400"}`}>{s}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm min-h-[320px]">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Basic Information</h2>
            <div>
              <label className={labelCls}>Property Title *</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="e.g. Spacious 2BHK Flat in Gomti Nagar" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Property Type *</label>
                <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className={inputCls}>
                  {["flat", "house", "villa", "plot", "commercial", "pg"].map((t) => (
                    <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Listing Type *</label>
                <select value={form.listing_type} onChange={(e) => set("listing_type", e.target.value)} className={inputCls}>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Location Details</h2>
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
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} placeholder="Plot no, Street, Area..." />
            </div>
            <div>
              <label className={labelCls}>Pincode</label>
              <input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputCls} placeholder="226010" maxLength={6} />
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Property Details</h2>
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
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} BHK</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Bathrooms</label>
                <select value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Floor No.</label>
                <input type="number" value={form.floor_number} onChange={(e) => set("floor_number", e.target.value)} className={inputCls} placeholder="2" />
              </div>
              <div>
                <label className={labelCls}>Property Age (years)</label>
                <input type="number" value={form.property_age_years} onChange={(e) => set("property_age_years", e.target.value)} className={inputCls} placeholder="3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Furnishing</label>
                <select value={form.furnishing_status} onChange={(e) => set("furnishing_status", e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  <option value="furnished">Furnished</option>
                  <option value="semi_furnished">Semi Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Possession</label>
                <select value={form.possession_status} onChange={(e) => set("possession_status", e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  <option value="ready_to_move">Ready to Move</option>
                  <option value="under_construction">Under Construction</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Amenities */}
        {step === 3 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES.map((a) => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                    form.amenities.includes(a)
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-brand-300"
                  }`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 4 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Photos</h2>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-brand-400 transition-colors">
              <Upload size={28} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Tap to select photos</span>
              <span className="text-xs text-gray-400 mt-1">Up to 10 images (JPG, PNG)</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
                {images.map((f, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Description + Review */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Description & Review</h2>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inputCls} resize-none`} rows={4} placeholder="Describe the property..." />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 text-gray-700">
              <p><span className="font-medium">Title:</span> {form.title}</p>
              <p><span className="font-medium">Location:</span> {form.locality}, {form.city}</p>
              <p><span className="font-medium">Price:</span> ₹{parseFloat(form.price || 0).toLocaleString("en-IN")}</p>
              <p><span className="font-medium">Type:</span> {form.bedrooms} BHK {form.property_type} for {form.listing_type}</p>
              <p><span className="font-medium">Photos:</span> {images.length} selected</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-5 gap-3">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Back
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canProceed}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
            Continue
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading || !form.title || !form.price}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Post Property
          </button>
        )}
      </div>
    </div>
  );
}
