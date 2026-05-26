import { useState, useEffect } from "react";
import {
  Bookmark,
  BookmarkX,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ExternalLink,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";

export const SAVED_KEY = "replaceio_saved_props";

export function loadSavedMap() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "{}"); }
  catch { return {}; }
}

export function saveSavedMap(map) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(map)); } catch {}
}

function formatPrice(price, currency, period) {
  if (!price) return "Price on request";
  if (currency === "USD")
    return `$${price.toLocaleString("en-US")}${period === "month" ? "/mo" : ""}`;
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(1)} Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}${period === "month" ? "/mo" : ""}`;
}

function PropertyCard({ property, onUnsave }) {
  const images = property.media?.map((m) => m.url).filter(Boolean) || [];
  const sourceName = property.source === "housing" ? "Housing.com" : "99Acres";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative h-44 flex-shrink-0 bg-slate-100">
        {images.length > 0 ? (
          <img src={images[0]} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 size={40} className="text-slate-300" />
          </div>
        )}
        {property.listing_type && (
          <span className="absolute left-3 top-3 rounded-full bg-teal-600 px-2.5 py-1 text-xs font-bold capitalize text-white">
            {property.listing_type}
          </span>
        )}
        <button
          onClick={() => onUnsave(property.id)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow transition-colors hover:bg-rose-500 hover:text-white"
          title="Remove from saved"
        >
          <BookmarkX size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-1 font-bold text-slate-900">{property.title}</p>
        <p className="mt-1 text-lg font-extrabold text-teal-700">
          {formatPrice(property.price, property.currency, property.price_period)}
        </p>

        {(property.locality || property.city) && (
          <div className="mt-2 flex items-center gap-1 text-sm text-slate-500">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">
              {[property.locality, property.city].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble size={13} />{property.bedrooms} BHK
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath size={13} />{property.bathrooms}
            </span>
          )}
          {property.area_sqft > 0 && (
            <span className="flex items-center gap-1">
              <Maximize2 size={13} />{property.area_sqft.toLocaleString()} sqft
            </span>
          )}
        </div>

        {property.amenities?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {property.amenities.slice(0, 3).map((a) => (
              <span key={a} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                <Tag size={9} />{a}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">{sourceName}</span>
          {property.source_url && (
            <a
              href={property.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100"
            >
              <ExternalLink size={13} />View
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SavedProperties() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const map = loadSavedMap();
    setProperties(Object.values(map));
  }, []);

  const handleUnsave = (id) => {
    const map = loadSavedMap();
    delete map[id];
    saveSavedMap(map);
    setProperties(Object.values(map));
    toast.success("Removed from saved");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-[#f9fdfd] to-teal-50/55 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Saved Properties</h1>
          <p className="mt-1 text-slate-500">
            {properties.length} {properties.length === 1 ? "property" : "properties"} saved
          </p>
        </div>

        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <Bookmark size={28} className="text-rose-400" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">No saved properties yet</h3>
            <p className="max-w-xs text-slate-500">
              Tap the bookmark icon on any property in the AI Agent to save it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} onUnsave={handleUnsave} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
