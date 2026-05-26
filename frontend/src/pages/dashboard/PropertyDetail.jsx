import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, BedDouble, Bath, Maximize2, Phone, Heart, Loader2, CheckSquare } from "lucide-react";
import { getProperty, saveProperty, unsaveProperty } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

function formatPrice(price, currency, period) {
  if (!price) return "Price on request";
  if (currency === "USD") {
    const suffix = period === "month" ? "/mo" : "";
    return `$${price.toLocaleString("en-US")}${suffix}`;
  }
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(2)} Crore`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(1)} Lakh`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageIdx, setImageIdx] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProperty(id)
      .then(setProperty)
      .catch(() => toast.error("Failed to load property"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!user) return toast.error("Login to save properties");
    try {
      if (saved) {
        await unsaveProperty(id);
        setSaved(false);
        toast.success("Removed from saved");
      } else {
        await saveProperty(id);
        setSaved(true);
        toast.success("Property saved!");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-brand-600" />
    </div>
  );

  if (!property) return (
    <div className="text-center py-20 text-gray-400">Property not found.</div>
  );

  const images = property.media?.filter((m) => m.media_type === "image") || [];
  const amenities = property.amenities || [];

  return (
    <div className="p-5 md:p-8 max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Image gallery */}
      <div className="rounded-2xl overflow-hidden bg-gray-100 mb-6">
        <div className="relative h-56 sm:h-72">
          {images.length > 0 ? (
            <img src={images[imageIdx].url} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}
          <span className="absolute top-3 right-3 bg-white/90 text-xs font-medium px-2 py-0.5 rounded-full capitalize">
            {property.listing_type}
          </span>
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto bg-white border-t border-gray-100">
            {images.map((m, i) => (
              <button key={m.id} onClick={() => setImageIdx(i)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === imageIdx ? "border-brand-500" : "border-transparent"}`}>
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{property.title}</h1>
              <button onClick={handleSave} className="flex-shrink-0 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Heart size={20} className={saved ? "text-red-500 fill-red-500" : "text-gray-400"} />
              </button>
            </div>
            <p className="text-2xl font-bold text-brand-700 mt-2">{formatPrice(property.price, property.currency, property.price_period)}</p>
            <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-400">
              <MapPin size={13} />
              {property.address || `${property.locality}, ${property.city}`}
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Bedrooms", value: property.bedrooms ? `${property.bedrooms} BHK` : null, icon: BedDouble },
              { label: "Bathrooms", value: property.bathrooms, icon: Bath },
              { label: "Area", value: property.area_sqft ? `${property.area_sqft.toLocaleString()} sqft` : null, icon: Maximize2 },
              { label: "Floor", value: property.floor_number ? `Floor ${property.floor_number}` : null },
              { label: "Furnishing", value: property.furnishing_status?.replace("_", " ") },
              { label: "Possession", value: property.possession_status?.replace("_", " ") },
              { label: "Age", value: property.property_age_years ? `${property.property_age_years} yr` : null },
              { label: "Type", value: property.property_type },
            ].filter(({ value }) => value).map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-semibold text-gray-800 text-sm mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3 text-sm">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={a} className="flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    <CheckSquare size={11} />
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-2 text-sm">About this property</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Map */}
          {property.latitude && property.longitude && (
            <div className="rounded-xl overflow-hidden border border-gray-200 h-44">
              <iframe
                title="map"
                className="w-full h-full border-none"
                src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&output=embed`}
              />
            </div>
          )}
        </div>

        {/* Seller card */}
        {property.seller && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm h-fit lg:sticky lg:top-4">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Contact Seller</h2>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                {property.seller.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{property.seller.name}</p>
                <p className="text-xs text-gray-400 capitalize">{property.seller.role}</p>
              </div>
            </div>
            {property.seller.phone && (
              <div className="space-y-2">
                <a href={`tel:${property.seller.phone}`}
                  className="flex items-center justify-center gap-2 w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
                  <Phone size={15} />
                  Call Now
                </a>
                <a href={`https://wa.me/91${property.seller.phone.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
