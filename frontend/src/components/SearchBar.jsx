import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";

export default function SearchBar({ initialValue = "", loading = false, className = "" }) {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="2BHK flat in Lucknow under 50 lakhs..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="bg-brand-600 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors flex items-center gap-2 flex-shrink-0"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        <span className="hidden sm:inline">Search AI</span>
      </button>
    </form>
  );
}
