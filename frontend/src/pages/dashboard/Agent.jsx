import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, Loader2, MapPin, BedDouble, Maximize2,
  Plus, Pin, MoreVertical, Trash2, ChevronLeft, ChevronRight,
  MessageSquarePlus, X, ExternalLink, Bath, Building2, Tag,
  Bookmark, BookmarkCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { chatMessage, getProperty } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { loadSavedMap, saveSavedMap } from "./SavedProperties";

const STORAGE_KEY = "replaceio_chats_v2";

function loadChats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveChats(chats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch {}
}

function createChat() {
  return { id: Date.now().toString(), title: "New Chat", messages: [], createdAt: Date.now(), pinned: false };
}

function timeStr(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  if (diff < 172800000) return "Yesterday";
  return `${Math.floor(diff / 86400000)} days ago`;
}

function formatPrice(price, currency, period) {
  if (!price) return "Price on request";
  if (currency === "USD") {
    return `$${price.toLocaleString("en-US")}${period === "month" ? "/mo" : ""}`;
  }
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(1)} Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}${period === "month" ? "/mo" : ""}`;
}

// ─── Property list item (inline in chat bubble) ────────────────────────────

function PropertyListItem({ property, index, isSelected, onSelect, isSaved, onToggleSave }) {
  return (
    <div
      className={`mt-2 flex w-full items-center gap-4 rounded-xl border px-4 py-3 transition-all ${
        isSelected
          ? "bg-brand-50 border-brand-300 shadow-sm"
          : "border-transparent hover:border-line-light hover:bg-surface-hover"
      }`}
    >
      <button
        onClick={() => onSelect(property)}
        className="flex flex-1 min-w-0 items-center gap-4 text-left"
      >
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          isSelected ? "bg-brand-600 text-white" : "bg-surface-active text-brand-600"
        }`}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="line-clamp-1 text-base font-bold text-ink-main">{property.title}</p>
          <p className="mt-1 text-sm font-bold text-brand-700">
            {formatPrice(property.price, property.currency, property.price_period)}
          </p>
          <div className="mt-1 flex items-center gap-3 text-sm text-ink-muted">
            <span className="flex items-center gap-1 truncate">
              <MapPin size={13} className="flex-shrink-0" />
              {[property.locality, property.city].filter(Boolean).join(", ")}
            </span>
            {property.bedrooms > 0 && <span className="flex-shrink-0">{property.bedrooms} BHK</span>}
            {property.area_sqft > 0 && <span className="flex-shrink-0">{property.area_sqft.toLocaleString()} sqft</span>}
          </div>
        </div>
        <ChevronRight size={18} className="flex-shrink-0 text-ink-muted" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleSave(property); }}
        className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
          isSaved
            ? "text-brand-600 hover:text-rose-500"
            : "text-ink-muted hover:text-brand-600"
        }`}
        title={isSaved ? "Remove from saved" : "Save property"}
      >
        {isSaved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
      </button>
    </div>
  );
}

// ─── Bot bubble ────────────────────────────────────────────────────────────

function BotBubble({ text, properties, suggestions, ts, selectedProperty, onSelectProperty, onSuggestionClick, savedIds, onToggleSave }) {
  return (
    <div className="flex max-w-full items-start gap-4">
      <div className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-600">
        <Bot size={21} className="text-ink-inverse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="inline-block max-w-[92%] rounded-2xl rounded-tl-sm border border-line-light bg-surface-card px-5 py-4 shadow-teal">
          <p className="whitespace-pre-wrap text-base leading-7 text-ink-main">{text}</p>
          {properties?.length > 0 && (
            <div className="mt-4 -mx-1">
              {properties.map((p, i) => (
                <PropertyListItem
                  key={p.id}
                  property={p}
                  index={i}
                  isSelected={selectedProperty?.id === p.id}
                  onSelect={onSelectProperty}
                  isSaved={savedIds?.has(p.id)}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>
          )}
        </div>
        {suggestions?.length > 0 && onSuggestionClick && (
          <div className="mt-2 ml-1 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestionClick(s)}
                className="rounded-full border border-line-active bg-surface-card px-4 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-600 hover:text-white hover:border-brand-600"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <p className="ml-1 mt-2 text-xs text-ink-muted">{timeStr(ts)}</p>
      </div>
    </div>
  );
}

// ─── User bubble ───────────────────────────────────────────────────────────

function UserBubble({ text, ts }) {
  return (
    <div className="flex flex-col items-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-line-bubble bg-surface-selected px-5 py-3.5 text-ink-main shadow-sm">
        <p className="text-base leading-7">{text}</p>
      </div>
      <p className="mr-1 mt-2 text-xs text-ink-secondary">
        {timeStr(ts)} <span className="text-brand-600">✓✓</span>
      </p>
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-600">
        <Bot size={21} className="text-ink-inverse" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-line-light bg-surface-card px-5 py-4 shadow-teal">
        <div className="flex h-5 items-center gap-1.5">
          <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ─── Chat list item ────────────────────────────────────────────────────────

function ChatItem({ chat, isActive, onSelect, onDelete, onTogglePin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      className={`group relative flex cursor-pointer items-center gap-3 border-b border-b-line-divider px-4 py-4 transition-colors ${
        isActive ? "bg-surface-selected border-l-[3px] border-l-line-active" : "hover:bg-surface-hover border-l-[3px] border-l-transparent"
      }`}
      onClick={() => onSelect(chat.id)}
    >
      <div className="flex-1 min-w-0">
        <p className={`truncate text-base font-bold ${isActive ? "text-brand-600" : "text-ink-main"}`}>
          {chat.title}
        </p>
        <p className="mt-1 text-sm text-ink-secondary">{relativeTime(chat.createdAt)}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onTogglePin(chat.id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            chat.pinned
              ? "bg-brand-600 text-white hover:bg-brand-700"
              : "text-ink-muted hover:bg-surface-active hover:text-brand-600"
          }`}
          title={chat.pinned ? "Unpin chat" : "Pin chat"}
          aria-label={chat.pinned ? "Unpin chat" : "Pin chat"}
        >
          <Pin size={14} className={chat.pinned ? "fill-white" : ""} />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-active hover:text-ink-main"
            aria-label="Chat options"
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-30 w-36 rounded-xl border border-line-light bg-surface-card py-1 shadow-teal">
              <button
                onClick={() => { onTogglePin(chat.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-main transition-colors hover:bg-surface-hover"
              >
                <Pin size={13} className={chat.pinned ? "fill-brand-600 text-brand-600" : "text-ink-muted"} />
                {chat.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                onClick={() => { onDelete(chat.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 size={13} />Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Property detail panel ─────────────────────────────────────────────────

function PropertyDetailPanel({ property, detailLoading, onClose }) {
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => { setImgIdx(0); }, [property.id]);

  const images = property.media?.map((m) => m.url).filter(Boolean) || [];

  // Deduplicate location parts — address often already contains locality/city
  const rawLocationParts = [property.address, property.locality, property.city].filter(Boolean);
  const locationStr = rawLocationParts
    .filter((part, _, arr) =>
      !arr.some((other) => other !== part && other.toLowerCase().includes(part.toLowerCase()))
    )
    .join(", ");
  const sourceName = property.source === "housing" ? "Housing.com" : "99Acres";

  return (
    <div className="w-[380px] flex-shrink-0 border-l border-line-divider bg-surface-card flex flex-col min-h-0">
      {/* Header */}
      <div className="h-14 px-4 flex items-center gap-2 border-b border-line-divider flex-shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors flex-shrink-0">
          <X size={18} className="text-ink-secondary" />
        </button>
        <p className="flex-1 text-sm font-bold text-ink-main truncate min-w-0">{property.title}</p>
        {property.source_url && (
          <a
            href={property.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors flex-shrink-0 text-brand-600"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image carousel */}
        <div className="relative h-52 bg-surface-hover flex-shrink-0">
          {detailLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 size={28} className="animate-spin text-brand-600 opacity-60" />
            </div>
          ) : images.length > 0 ? (
            <>
              <img src={images[imgIdx]} alt={property.title} className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                  <span className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
                    {imgIdx + 1}/{images.length}
                  </span>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 size={48} className="text-ink-muted opacity-40" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full capitalize">
              {property.listing_type}
            </span>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Price & title */}
          <div>
            <p className="text-2xl font-extrabold text-brand-700">
              {formatPrice(property.price, property.currency, property.price_period)}
            </p>
            <p className="text-sm font-semibold text-ink-main mt-1 leading-snug">{property.title}</p>
          </div>

          {/* Location */}
          {locationStr && (
            <div className="flex items-start gap-2">
              <MapPin size={14} className="flex-shrink-0 mt-0.5 text-brand-600" />
              <p className="text-sm text-ink-secondary">{locationStr}</p>
            </div>
          )}

          {/* Stats row */}
          {(property.bedrooms > 0 || property.bathrooms > 0 || property.area_sqft > 0) && (
            <div className="flex gap-2">
              {property.bedrooms > 0 && (
                <div className="flex-1 bg-surface-active rounded-xl p-3 text-center">
                  <BedDouble size={15} className="text-brand-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-ink-main">{property.bedrooms}</p>
                  <p className="text-[11px] text-ink-muted">Beds</p>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex-1 bg-surface-active rounded-xl p-3 text-center">
                  <Bath size={15} className="text-brand-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-ink-main">{property.bathrooms}</p>
                  <p className="text-[11px] text-ink-muted">Baths</p>
                </div>
              )}
              {property.area_sqft > 0 && (
                <div className="flex-1 bg-surface-active rounded-xl p-3 text-center">
                  <Maximize2 size={15} className="text-brand-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-ink-main">{property.area_sqft.toLocaleString()}</p>
                  <p className="text-[11px] text-ink-muted">Sq.ft</p>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            <span className="bg-surface-hover text-ink-secondary text-xs px-3 py-1 rounded-full capitalize">
              {property.property_type}
            </span>
            {property.furnishing_status && (
              <span className="bg-surface-hover text-ink-secondary text-xs px-3 py-1 rounded-full capitalize">
                {property.furnishing_status.replace(/_/g, " ")}
              </span>
            )}
            <span className="bg-surface-hover text-ink-secondary text-xs px-3 py-1 rounded-full">
              {sourceName}
            </span>
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-1.5">About</p>
              <p className="text-sm text-ink-main leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((a) => (
                  <span key={a} className="flex items-center gap-1 bg-surface-active text-brand-700 text-xs px-2.5 py-1 rounded-full">
                    <Tag size={9} />{a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {property.source_url && (
            <a
              href={property.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={15} />
              View on {sourceName}
            </a>
          )}

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}

// ─── Starter prompts ────────────────────────────────────────────────────────

const STARTERS = [
  "I'm looking for a property",
  "Help me find a home to rent",
  "I want to buy a flat in Lucknow",
  "Find me a 2BHK under 50 lakhs",
];

// ─── Main component ────────────────────────────────────────────────────────

export default function Agent() {
  useAuthStore();

  const [chats, setChats] = useState(() => loadChats());
  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = loadChats();
    return saved.length > 0 ? saved[0].id : null;
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set(Object.keys(loadSavedMap())));
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const handleSelectProperty = async (property) => {
    setSelectedProperty(property);
    setDetailLoading(true);
    try {
      const full = await getProperty(property.id);
      if (full) setSelectedProperty(full);
    } catch {
      // keep partial data already shown
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleSave = (property) => {
    const map = loadSavedMap();
    if (map[property.id]) {
      delete map[property.id];
      toast.success("Removed from saved");
    } else {
      map[property.id] = property;
      toast.success("Property saved!");
    }
    saveSavedMap(map);
    setSavedIds(new Set(Object.keys(map)));
  };

  useEffect(() => {
    if (!activeChatId && chats.length > 0) setActiveChatId(chats[0].id);
  }, [chats, activeChatId]);

  useEffect(() => { saveChats(chats); }, [chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, loading, activeChatId]);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const sortedChats = [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  const handleNewChat = () => {
    const c = createChat();
    setChats((prev) => [c, ...prev]);
    setActiveChatId(c.id);
    setSelectedProperty(null);
    setShowList(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setSelectedProperty(null);
    setShowList(false);
  };

  const handleDeleteChat = (id) => {
    setChats((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (activeChatId === id) {
        setActiveChatId(filtered.length > 0 ? filtered[0].id : null);
        setSelectedProperty(null);
      }
      return filtered;
    });
  };

  const handleTogglePin = (id) => {
    setChats((prev) => prev.map((c) => c.id === id ? { ...c, pinned: !c.pinned } : c));
  };

  const send = async (text = input) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");

    const ts = Date.now();
    let currentId = activeChatId;
    if (!currentId) {
      const c = createChat();
      currentId = c.id;
      setChats((prev) => [c, ...prev]);
      setActiveChatId(c.id);
      setShowList(false);
    }

    const userMsg = { id: ts, role: "user", text: msg, ts };
    const historySnapshot = chats.find((c) => c.id === currentId)?.messages || [];

    setChats((prev) => prev.map((c) => {
      if (c.id !== currentId) return c;
      const isFirst = c.messages.length === 0;
      return {
        ...c,
        messages: [...c.messages, userMsg],
        title: isFirst ? (msg.length > 38 ? msg.slice(0, 38) + "…" : msg) : c.title,
        createdAt: isFirst ? ts : c.createdAt,
      };
    }));
    setLoading(true);

    const history = historySnapshot.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    const ctxIds = historySnapshot
      .filter((m) => m.role === "assistant" && m.properties?.length)
      .at(-1)?.properties?.map((p) => p.id) || [];

    try {
      const res = await chatMessage({ message: msg, history, context_property_ids: ctxIds });
      const botMsg = {
        id: Date.now() + 1, role: "assistant",
        text: res.message, properties: res.properties || [],
        suggestions: res.suggestions || [],
        ts: Date.now(),
      };
      setChats((prev) => prev.map((c) =>
        c.id === currentId ? { ...c, messages: [...c.messages, botMsg] } : c
      ));
    } catch {
      const errMsg = {
        id: Date.now() + 1, role: "assistant",
        text: "Sorry, something went wrong. Please try again.", properties: [],
        ts: Date.now(),
      };
      setChats((prev) => prev.map((c) =>
        c.id === currentId ? { ...c, messages: [...c.messages, errMsg] } : c
      ));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-1 min-h-0">

      {/* ── Chat List Panel ── */}
      <div className={`${showList ? "flex" : "hidden md:flex"} flex-col w-full md:w-[16%] min-w-[250px] max-w-[310px] border-r border-line-divider bg-surface-card flex-shrink-0`}>
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-line-divider px-5">
          <h2 className="text-lg font-bold text-ink-main">Chats</h2>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 rounded-xl border border-line-bubble bg-surface-card px-4 py-2 text-base font-semibold text-brand-600 transition-colors hover:bg-surface-hover"
          >
            <Plus size={17} />New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sortedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
              <div className="w-12 h-12 rounded-full bg-surface-active flex items-center justify-center mb-3">
                <MessageSquarePlus size={20} className="text-brand-600" />
              </div>
              <p className="text-sm font-semibold text-ink-main mb-1">No conversations yet</p>
              <p className="text-xs text-ink-muted mb-4">Start a new chat to find properties</p>
              <button
                onClick={handleNewChat}
                className="text-xs font-semibold text-brand-600 bg-surface-active px-4 py-2 rounded-xl hover:opacity-80 transition-opacity"
              >
                + New Chat
              </button>
            </div>
          ) : (
            sortedChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onSelect={handleSelectChat}
                onDelete={handleDeleteChat}
                onTogglePin={handleTogglePin}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className={`${showList ? "hidden md:flex" : "flex"} relative flex-1 flex-col min-w-0 bg-surface-chat`}>
        {/* Chat header */}
        <div className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-line-divider bg-surface-card px-5">
          <button onClick={() => setShowList(true)} className="md:hidden p-1.5 text-ink-secondary -ml-1">
            <ChevronLeft size={20} />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-base font-bold text-ink-main">
            {activeChat?.title || "New Chat"}
          </h2>
          {selectedProperty && (
            <button
              onClick={() => setSelectedProperty(null)}
              className="md:hidden flex items-center gap-1 text-xs text-ink-secondary hover:text-ink-main"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-28 pt-6 md:px-10">
          {(!activeChat || activeChat.messages.length === 0) && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-surface-active flex items-center justify-center mb-4">
                <Bot size={28} className="text-brand-600" />
              </div>
              <h3 className="mb-1 text-2xl font-bold text-ink-main">AI Property Assistant</h3>
              <p className="mb-6 max-w-sm text-base text-ink-muted">
                Tell me what you're looking for and I'll guide you to the right property.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-line-light bg-surface-card px-4 py-2.5 text-sm text-ink-secondary transition-colors hover:border-line-active hover:text-brand-600"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeChat?.messages.map((m, idx, arr) => {
            const isLastBotMsg = m.role === "assistant" && idx === arr.length - 1;
            return m.role === "user" ? (
              <UserBubble key={m.id} text={m.text} ts={m.ts} />
            ) : (
              <BotBubble
                key={m.id}
                text={m.text}
                properties={m.properties}
                suggestions={m.suggestions}
                ts={m.ts}
                selectedProperty={selectedProperty}
                onSelectProperty={handleSelectProperty}
                onSuggestionClick={isLastBotMsg && !loading ? send : null}
                savedIds={savedIds}
                onToggleSave={toggleSave}
              />
            );
          })}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 px-4 md:px-6">
          <div className="pointer-events-auto mx-auto flex max-w-5xl items-end gap-3 rounded-2xl border border-line-input bg-white/95 px-5 py-3.5 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur transition-all focus-within:border-transparent focus-within:ring-2 focus-within:ring-brand-600">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKey}
              placeholder="Type your message..."
              className="flex-1 resize-none bg-transparent text-base leading-7 text-ink-main outline-none placeholder:text-ink-muted"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center self-end rounded-xl bg-teal-cyan text-ink-inverse transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Property Detail Panel ── */}
      {selectedProperty && (
        <PropertyDetailPanel
          property={selectedProperty}
          detailLoading={detailLoading}
          onClose={() => { setSelectedProperty(null); setDetailLoading(false); }}
        />
      )}
    </div>
  );
}
