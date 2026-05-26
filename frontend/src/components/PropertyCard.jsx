import { Link } from "react-router-dom";
import { MapPin, BedDouble, Maximize2 } from "lucide-react";

function formatPrice(price, currency, period) {
  if (!price) return "Price on request";
  if (currency === "USD") {
    const suffix = period === "month" ? "/mo" : "";
    return `$${price.toLocaleString("en-US")}${suffix}`;
  }
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(1)} Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function PropertyCard({ property }) {
  const image = property.media?.[0]?.url;
  const similarity = property.similarity ? Math.round(property.similarity * 100) : null;

  return (
    <Link to={`/property/${property.id}`} className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md active:scale-[0.99] transition-all duration-150">
      {/* Image */}
      <div className="relative h-44 sm:h-48 bg-gray-100">
        {image ? (
          <img src={image} alt={property.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}
        {similarity !== null && (
          <span className="absolute top-2 left-2 bg-brand-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {similarity}% match
          </span>
        )}
        <span className="absolute top-2 right-2 bg-white/90 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full capitalize">
          {property.listing_type}
        </span>
      </div>

      {/* Details */}
      <div className="p-3">
        <p className="font-bold text-brand-700 text-base">{formatPrice(property.price, property.currency, property.price_period)}</p>
        <h3 className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2">{property.title}</h3>

        <div className="flex items-center gap-1 mt-1.5 text-gray-500 text-xs">
          <MapPin size={12} className="flex-shrink-0" />
          <span className="truncate">{property.locality}, {property.city}</span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
          {property.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble size={13} />
              {property.bedrooms} BHK
            </span>
          )}
          {property.area_sqft && (
            <span className="flex items-center gap-1">
              <Maximize2 size={13} />
              {property.area_sqft.toLocaleString()} sqft
            </span>
          )}
          <span className="capitalize text-gray-400">{property.property_type}</span>
        </div>
      </div>
    </Link>
  );
}
