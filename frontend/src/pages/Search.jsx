import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, Tag } from "lucide-react";
import SearchBar from "../components/SearchBar";
import PropertyCard from "../components/PropertyCard";
import SkeletonCard from "../components/SkeletonCard";
import { searchProperties } from "../services/api";

export default function Search() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(null);
    searchProperties(query)
      .then(setData)
      .catch(() => setError("Search failed. Please try again."))
      .finally(() => setLoading(false));
  }, [query]);

  const filters = data?.filters_detected || {};
  const activeFilters = Object.entries(filters)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      const labels = {
        city: v, locality: v, property_type: v, listing_type: v,
        bedrooms: `${v} BHK`,
        min_price: `From ₹${formatPriceShort(v)}`,
        max_price: `Under ₹${formatPriceShort(v)}`,
      };
      return labels[k] || String(v);
    });

  return (
    <div className="max-w-6xl mx-auto px-4 py-5">
      <SearchBar initialValue={query} loading={loading} className="mb-5" />

      {/* AI Summary */}
      {data?.ai_summary && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-5 flex gap-3">
          <Sparkles size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brand-800 leading-relaxed">{data.ai_summary}</p>
        </div>
      )}

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((f) => (
            <span key={f} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
              <Tag size={11} />
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Count */}
      {data && (
        <p className="text-sm text-gray-500 mb-4">{data.total} properties found</p>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12 text-red-500">{error}</div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Results */}
      {!loading && data?.properties?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && data?.properties?.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">No properties found</h3>
          <p className="text-sm text-gray-500">Try a different query or broaden your search.</p>
        </div>
      )}

      {/* No query */}
      {!query && (
        <div className="text-center py-16">
          <p className="text-gray-500">Type a query above to search properties.</p>
        </div>
      )}
    </div>
  );
}

function formatPriceShort(price) {
  if (price >= 10_000_000) return `${(price / 10_000_000).toFixed(1)} Cr`;
  if (price >= 100_000) return `${(price / 100_000).toFixed(0)} L`;
  return price.toLocaleString("en-IN");
}
