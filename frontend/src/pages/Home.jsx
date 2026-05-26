import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";

const SUGGESTIONS = [
  "2BHK flat in Lucknow under 50 lakhs",
  "3BHK house in Gomti Nagar with parking",
  "1BHK flat for rent near metro",
  "Villa with swimming pool in Lucknow",
];

const CITIES = [
  { name: "Lucknow", emoji: "🏛️" },
  { name: "Noida", emoji: "🏙️" },
  { name: "Kanpur", emoji: "🏭" },
  { name: "Agra", emoji: "🕌" },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Search naturally", desc: "Type what you want in plain language. Our AI understands you." },
  { step: "2", title: "View properties", desc: "Browse AI-ranked results with photos, details, and contact info." },
  { step: "3", title: "Connect directly", desc: "Contact the seller or agent directly — no middlemen." },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white px-4 py-12 sm:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-3 leading-tight">
            Find your perfect home with AI
          </h1>
          <p className="text-brand-100 text-base sm:text-lg mb-8">
            Search thousands of properties using plain language. No filters needed.
          </p>

          <SearchBar className="mb-4" />

          {/* Suggestions */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors border border-white/20"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Popular Cities</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CITIES.map(({ name, emoji }) => (
            <button
              key={name}
              onClick={() => navigate(`/search?q=property in ${name}`)}
              className="bg-white border border-gray-100 rounded-2xl p-4 text-center hover:border-brand-300 hover:shadow-sm transition-all active:scale-[0.97]"
            >
              <div className="text-3xl mb-1">{emoji}</div>
              <div className="font-semibold text-gray-800 text-sm">{name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-gray-100 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent CTA */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-accent-500 rounded-2xl p-6 sm:p-8 text-center text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Are you an agent or builder?</h2>
          <p className="text-amber-100 text-sm mb-5">Post your properties for free and reach thousands of buyers.</p>
          <a href="/register" className="inline-block bg-white text-accent-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-amber-50 transition-colors">
            Post for Free
          </a>
        </div>
      </section>
    </div>
  );
}
