import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2, Heart, PlusCircle, Loader2 } from "lucide-react";
import { getUserProperties, getSavedProperties, deleteProperty, unsaveProperty, getProfile } from "../services/api";
import { useAuthStore } from "../store/authStore";
import PropertyCard from "../components/PropertyCard";
import toast from "react-hot-toast";

function formatPrice(price) {
  if (!price) return "—";
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(1)} Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [saved, setSaved] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUserProperties(user.id),
      getSavedProperties(),
      getProfile(),
    ])
      .then(([l, s, p]) => { setListings(l); setSaved(s); setProfile(p); })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this property?")) return;
    try {
      await deleteProperty(id);
      setListings((prev) => prev.filter((p) => p.id !== id));
      toast.success("Property deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleUnsave = async (propertyId) => {
    try {
      await unsaveProperty(propertyId);
      setSaved((prev) => prev.filter((s) => s.property_id !== propertyId));
      toast.success("Removed from saved");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl">
          {(profile?.name || user?.email)?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{profile?.name || "My Account"}</h1>
          <p className="text-sm text-gray-500 capitalize">{profile?.role} · {profile?.phone}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5 gap-1">
        {[
          { id: "listings", label: `My Listings (${listings.length})` },
          { id: "saved", label: `Saved (${saved.length})` },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === id
                ? "text-brand-600 border-b-2 border-brand-600 bg-brand-50"
                : "text-gray-500 hover:text-gray-800"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* My Listings */}
      {tab === "listings" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{listings.length} properties posted</p>
            <Link to="/post-property"
              className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
              <PlusCircle size={16} />
              Post New
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="font-semibold text-gray-800 mb-1">No listings yet</h3>
              <p className="text-sm text-gray-500 mb-5">Post your first property to start getting leads.</p>
              <Link to="/post-property" className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium">
                Post Property
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((prop) => (
                <div key={prop.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                    {prop.property_media?.[0]?.url ? (
                      <img src={prop.property_media[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No photo</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{prop.title}</p>
                    <p className="text-brand-700 font-bold text-sm">{formatPrice(prop.price)}</p>
                    <p className="text-xs text-gray-500 truncate">{prop.locality}, {prop.city}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      prop.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {prop.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link to={`/property/${prop.id}`}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                      <Edit size={16} />
                    </Link>
                    <button onClick={() => handleDelete(prop.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Properties */}
      {tab === "saved" && (
        <div>
          {saved.length === 0 ? (
            <div className="text-center py-16">
              <Heart size={48} className="text-gray-200 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-1">No saved properties</h3>
              <p className="text-sm text-gray-500 mb-5">Tap the heart icon on any property to save it here.</p>
              <Link to="/search" className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium">
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {saved.map((s) => (
                <div key={s.id} className="relative">
                  <PropertyCard property={s.properties} />
                  <button onClick={() => handleUnsave(s.property_id)}
                    className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-sm hover:bg-red-50 transition-colors">
                    <Heart size={16} className="text-red-500 fill-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
