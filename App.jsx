import React, { useState, useMemo, useEffect, useRef } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  LayoutDashboard, Sparkles, Megaphone, Users, Gift, Ticket, Star, Share2,
  BarChart3, Bot, FileText, Settings, Bell, Search, Sun, Moon, Plus,
  ChevronDown, TrendingUp, TrendingDown, Check, Calendar, MapPin, Instagram,
  MessageCircle, Send, QrCode, Crown, Zap, Clock, ArrowUpRight, ArrowDownRight,
  Download, Filter, X, Store, Facebook, Music2, Mail, Smartphone, RefreshCw,
  ThumbsUp, ThumbsDown, Copy, ChevronRight, Wand2, Image as ImageIcon,
  Upload, CheckCircle2, PhoneCall, Eye, EyeOff, Lock,
  Shield, ToggleLeft, ToggleRight, Link2, MessageCircleWarning, UserPlus, Trash2, Archive, LayoutGrid,
} from "lucide-react";

/* Turns any messy phone input into a wa.me-safe digit string. */
function toWaNumber(raw) {
  if (!raw) return "";
  let digits = String(raw).replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = "92" + digits.slice(1); // default local -> PK country code
  return digits;
}
function waLink(phone, message) {
  const n = toWaNumber(phone);
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

// Simple local persistence — demo-level only. On this device/browser it "remembers";
// syncing a customer's own phone with the owner's dashboard needs a real backend/database.
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// A useState that transparently persists to localStorage under `key`, falling back to `fallback`.
// Safely reloads (instead of overwriting) when `key` itself changes — e.g. switching between businesses.
function usePersistedState(key, fallback) {
  const [value, setValue] = useState(() => lsGet(key, fallback));
  const keyRef = useRef(key);

  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      setValue(lsGet(key, fallback));
      return;
    }
    lsSet(key, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  return [value, setValue];
}

// Namespaces a storage key by business, so every restaurant/business added by the Author keeps fully separate data.
function bKey(base, businessId) {
  return `${base}::${businessId || "default"}`;
}

const DEFAULT_GOOGLE_REVIEW_LINK = "https://g.page/r/riversidecafe/review";

const DEFAULT_BUSINESSES = [{ id: "riverside-cafe", name: "Riverside Café" }];

// New businesses the Author adds should start completely empty — the sample/demo data
// only ever applies to the original showcase business (Riverside Café), never to new ones.
function sampleFor(businessId, sampleData, emptyData) {
  return businessId === DEFAULT_BUSINESSES[0].id ? sampleData : emptyData;
}

function slugify(name, existingIds) {
  const base = (name || "business").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "business";
  let id = base;
  let n = 2;
  while (existingIds.includes(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

const REGISTRATION_KEY = "MN301546";
const AUTHOR_MASTER_PASSWORD = "MNFT-Owner-2026"; // change this to your own secret — only whoever knows it gets full control
const ROLES = [
  { key: "owner", label: "Business Owner", desc: "Manage your business, branches & campaigns", icon: "Store" },
  { key: "admin", label: "Author", desc: "Full platform control — password only, no public sign-up", icon: "Crown" },
];

/* ---------------------------------- THEME ---------------------------------- */

const THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root[data-mode="dark"]{
  --bg:#0E0B14; --bg-grad: radial-gradient(1200px 600px at 100% -10%, #221933 0%, #0E0B14 55%);
  --surface:#161222; --surface-2:#1D1729; --surface-3:#251E35;
  --border:#2C2438; --border-soft: rgba(255,255,255,0.06);
  --text:#F4EFE7; --text-dim:#B8AFC7; --muted:#8B84A0;
  --accent:#FF6B45; --accent-ink:#2A0E06; --accent-soft: rgba(255,107,69,0.14);
  --gold:#FFC24B; --gold-soft: rgba(255,194,75,0.14);
  --success:#57D99A; --success-soft: rgba(87,217,154,0.14);
  --danger:#FF6B6B; --danger-soft: rgba(255,107,107,0.14);
  --shadow: 0 20px 50px -20px rgba(0,0,0,0.6);
}
:root[data-mode="light"]{
  --bg:#FBF8F2; --bg-grad: radial-gradient(1200px 600px at 100% -10%, #FFE9D6 0%, #FBF8F2 55%);
  --surface:#FFFFFF; --surface-2:#F6F1E7; --surface-3:#F0E9DA;
  --border:#E9E1D0; --border-soft: rgba(20,15,5,0.06);
  --text:#211A14; --text-dim:#584C3E; --muted:#8A7C68;
  --accent:#E8582E; --accent-ink:#FFEFE6; --accent-soft: rgba(232,88,46,0.10);
  --gold:#B9791A; --gold-soft: rgba(185,121,26,0.12);
  --success:#209764; --success-soft: rgba(32,151,100,0.12);
  --danger:#D8483F; --danger-soft: rgba(216,72,63,0.12);
  --shadow: 0 20px 50px -25px rgba(60,40,10,0.25);
}
.mnft{ font-family:'Inter',sans-serif; background:var(--bg-grad); color:var(--text); }
.mnft .font-display{ font-family:'Fraunces',serif; }
.mnft .font-mono{ font-family:'JetBrains Mono',monospace; }
.mnft-scroll::-webkit-scrollbar{ width:8px; height:8px; }
.mnft-scroll::-webkit-scrollbar-thumb{ background:var(--border); border-radius:8px; }
.mnft-scroll::-webkit-scrollbar-track{ background:transparent; }

.card{ background:var(--surface); border:1px solid var(--border); border-radius:18px; box-shadow:var(--shadow); }
.card-soft{ background:var(--surface-2); border:1px solid var(--border-soft); border-radius:14px; }
.nav-item{ transition: background .15s ease, color .15s ease, transform .1s ease; }
.nav-item:hover{ background:var(--surface-2); }
.nav-item.active{ background:var(--accent-soft); color:var(--accent); }
.btn-primary{ background:var(--accent); color:#fff; transition: filter .15s ease, transform .1s ease; }
.btn-primary:hover{ filter:brightness(1.08); }
.btn-primary:active{ transform: scale(0.98); }
.btn-ghost{ background:var(--surface-2); border:1px solid var(--border); color:var(--text); transition: background .15s ease; }
.btn-ghost:hover{ background:var(--surface-3); }
.chip{ border:1px solid var(--border); background:var(--surface-2); }
.marquee-dot{ box-shadow:0 0 0 3px var(--success-soft); animation: pulse 2.2s ease-in-out infinite; }
@keyframes pulse{ 0%,100%{ opacity:1; } 50%{ opacity:.45; } }
.ticket-edge{ background-image: radial-gradient(circle at 0 50%, var(--bg) 6px, transparent 7px), radial-gradient(circle at 100% 50%, var(--bg) 6px, transparent 7px); }
.fade-in{ animation: fadeIn .35s ease both; }
@keyframes fadeIn{ from{ opacity:0; transform:translateY(6px);} to{opacity:1; transform:translateY(0);} }
.spark-underline{ position:relative; }
.grain-btn{ position:relative; overflow:hidden; }
.progress-track{ background:var(--surface-3); border-radius:999px; overflow:hidden; }
.progress-fill{ background: linear-gradient(90deg, var(--accent), var(--gold)); border-radius:999px; }
`;

/* ---------------------------------- MOCK DATA ---------------------------------- */

const growthSeries = [
  { m: "Feb", customers: 1120, returning: 640 },
  { m: "Mar", customers: 1265, returning: 705 },
  { m: "Apr", customers: 1340, returning: 760 },
  { m: "May", customers: 1510, returning: 845 },
  { m: "Jun", customers: 1690, returning: 920 },
  { m: "Jul", customers: 1932, returning: 1080 },
];

const campaignPerf = [
  { name: "WhatsApp", sent: 4200, converted: 612 },
  { name: "SMS", sent: 3100, converted: 340 },
  { name: "Email", sent: 5600, converted: 410 },
  { name: "Push", sent: 2800, converted: 265 },
];

const revenueMix = [
  { name: "Coupons", value: 34, color: "var(--accent)" },
  { name: "Loyalty", value: 26, color: "var(--gold)" },
  { name: "Flash Sales", value: 22, color: "var(--success)" },
  { name: "Referrals", value: 18, color: "#8E7CFF" },
];

const reviewTrend = [
  { m: "Feb", rating: 4.2, count: 18 },
  { m: "Mar", rating: 4.3, count: 24 },
  { m: "Apr", rating: 4.4, count: 31 },
  { m: "May", rating: 4.5, count: 40 },
  { m: "Jun", rating: 4.6, count: 52 },
  { m: "Jul", rating: 4.8, count: 61 },
];

const activity = [
  { icon: Star, text: "New 5★ Google review from Amara O.", time: "6m ago", tone: "gold" },
  { icon: Ticket, text: "Coupon WEEKEND20 redeemed 12 times today", time: "24m ago", tone: "accent" },
  { icon: Users, text: "38 new customers joined via referral link", time: "1h ago", tone: "success" },
  { icon: Megaphone, text: "WhatsApp campaign 'Friday Happy Hour' sent to 1,240 contacts", time: "2h ago", tone: "accent" },
  { icon: Gift, text: "142 loyalty points redeemed for free pastry", time: "3h ago", tone: "gold" },
];

const kpis = [
  { label: "Total Customers", value: "8,412", delta: "+12.4%", up: true, icon: Users },
  { label: "New Customers", value: "612", delta: "+8.1%", up: true, icon: Sparkles },
  { label: "Returning Customers", value: "1,080", delta: "+6.9%", up: true, icon: RefreshCw },
  { label: "Revenue from Promotions", value: "Rs 4.82M", delta: "+18.3%", up: true, icon: TrendingUp },
  { label: "Google Review Growth", value: "4.8 ★", delta: "+0.3", up: true, icon: Star },
  { label: "Coupon Usage", value: "1,904", delta: "-3.2%", up: false, icon: Ticket },
];

const customers = [
  { name: "Amara Okafor", phone: "923001112223", tag: "VIP", segment: "Frequent Buyer", spend: "Rs 186,200", visits: 24, birthday: "Aug 14", fav: "Iced Latte" },
  { name: "Tunde Bello", phone: "923012234455", tag: "New", segment: "First Purchase", spend: "Rs 8,500", visits: 1, birthday: "Nov 02", fav: "—" },
  { name: "Chiamaka Eze", phone: "923023345566", tag: "Loyal", segment: "Monthly Regular", spend: "Rs 94,000", visits: 15, birthday: "Aug 03", fav: "Jollof Combo" },
  { name: "Ifeoma Nwosu", phone: "923034456677", tag: "At Risk", segment: "Lapsing", spend: "Rs 52,300", visits: 6, birthday: "Jan 27", fav: "Suya Wrap" },
  { name: "David Okon", phone: "923045567788", tag: "VIP", segment: "Frequent Buyer", spend: "Rs 241,900", visits: 31, birthday: "Aug 22", fav: "Espresso" },
  { name: "Blessing Umeh", phone: "923056678899", tag: "Loyal", segment: "Monthly Regular", spend: "Rs 71,400", visits: 12, birthday: "May 09", fav: "Smoothie Bowl" },
];

const campaignsList = [
  { name: "Friday Happy Hour", channel: "WhatsApp", audience: "All Branches", status: "Sent", sent: 1240, opens: "68%", ctr: "22%" },
  { name: "Birthday Treats — August", channel: "SMS", audience: "Birthday this month", status: "Scheduled", sent: 214, opens: "—", ctr: "—" },
  { name: "Win-back: 30 days inactive", channel: "Email", audience: "Lapsing customers", status: "Running", sent: 890, opens: "41%", ctr: "9%" },
  { name: "New Menu Launch", channel: "Push", audience: "App users", status: "Draft", sent: 0, opens: "—", ctr: "—" },
  { name: "Weekend Flash Sale", channel: "WhatsApp", audience: "Frequent Buyers", status: "Sent", sent: 980, opens: "74%", ctr: "31%" },
];

const coupons = [
  { code: "WEEKEND20", type: "20% Off", used: "312 / 500", expiry: "Aug 31, 2026", status: "Active" },
  { code: "BOGOFRIYAY", type: "Buy 1 Get 1", used: "88 / 150", expiry: "Aug 08, 2026", status: "Active" },
  { code: "WELCOME10", type: "10% Off", used: "640 / ∞", expiry: "No expiry", status: "Active" },
  { code: "FLASH2H", type: "Flash Sale 30%", used: "205 / 200", expiry: "Expired", status: "Ended" },
];

const reviewsList = [
  { name: "Amara O.", rating: 5, text: "Best flat white in the neighborhood, staff remembered my order!", time: "6m ago" },
  { name: "Kelvin U.", rating: 5, text: "Quick service and the loyalty points actually add up fast.", time: "3h ago" },
  { name: "Ngozi A.", rating: 3, text: "Great coffee but the queue on Saturday mornings is long.", time: "1d ago", flagged: true },
  { name: "Sam O.", rating: 4, text: "Loved the new seasonal menu, will be back for the referral deal.", time: "2d ago" },
];

const referralLeaders = [
  { name: "Amara Okafor", invites: 18, rewardEarned: "Rs 18,000" },
  { name: "David Okon", invites: 14, rewardEarned: "Rs 14,000" },
  { name: "Chiamaka Eze", invites: 11, rewardEarned: "Rs 11,000" },
  { name: "Blessing Umeh", invites: 9, rewardEarned: "Rs 9,000" },
];

const reports = [
  { name: "Daily Performance Summary", period: "Aug 1, 2026", size: "212 KB" },
  { name: "Weekly Campaign Report", period: "Jul 25 – Jul 31, 2026", size: "1.1 MB" },
  { name: "Monthly Growth & ROI Report", period: "July 2026", size: "3.4 MB" },
  { name: "Loyalty Report", period: "July 2026", size: "180 KB" },
  { name: "Referral Report", period: "July 2026", size: "140 KB" },
  { name: "Review Report", period: "July 2026", size: "165 KB" },
  { name: "Communication Report", period: "July 2026", size: "410 KB" },
];

const assistantThread = [
  { from: "ai", text: "Your returning-customer rate is up 6.9% this month — mostly driven by the loyalty points push. Want me to draft a campaign to convert your 214 at-risk customers before they lapse?" },
  { from: "user", text: "Yes, keep it short and offer something light." },
  { from: "ai", text: "Draft ready: a WhatsApp message offering a free pastry with any drink purchase, valid 7 days, sent to 214 customers inactive 21+ days. Estimated reach-to-redeem: 9–14%. Send now or schedule for 6:00 PM (peak open time)?" },
];

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "ai-marketing", label: "AI Marketing", icon: Sparkles },
  { key: "campaigns", label: "Campaigns", icon: Megaphone },
  { key: "automations", label: "Automations", icon: RefreshCw },
  { key: "customers", label: "Customers", icon: Users },
  { key: "promotions", label: "Promotions & Loyalty", icon: Gift },
  { key: "coupons", label: "Coupons", icon: Ticket },
  { key: "reviews", label: "Review Booster", icon: Star },
  { key: "referrals", label: "Referrals", icon: Share2 },
  { key: "digital-menu", label: "Digital Menu / QR", icon: QrCode },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "assistant", label: "AI Assistant", icon: Bot },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "staff", label: "Staff & Permissions", icon: Users },
  { key: "integrations", label: "Integrations", icon: Zap },
  { key: "settings", label: "Business Profile", icon: Settings },
  { key: "platform", label: "Restaurants (Author)", icon: Crown, authorOnly: true },
  { key: "backups", label: "Backups (Author)", icon: FileText, authorOnly: true },
];

/* ---------------------------------- SMALL UI PARTS ---------------------------------- */

function Pill({ children, tone = "muted" }) {
  const map = {
    muted: { bg: "var(--surface-3)", fg: "var(--text-dim)" },
    accent: { bg: "var(--accent-soft)", fg: "var(--accent)" },
    gold: { bg: "var(--gold-soft)", fg: "var(--gold)" },
    success: { bg: "var(--success-soft)", fg: "var(--success)" },
    danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
  };
  const c = map[tone] || map.muted;
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1"
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        {eyebrow && (
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-1.5"
            style={{ color: "var(--accent)" }}
          >
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl" style={{ color: "var(--text)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1.5 max-w-xl" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function KpiCard({ k }) {
  const Icon = k.icon;
  return (
    <div className="card p-5 relative overflow-hidden fade-in">
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Icon size={17} />
        </div>
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold font-mono"
          style={{ color: k.up ? "var(--success)" : "var(--danger)" }}
        >
          {k.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {k.delta}
        </span>
      </div>
      <div className="font-display text-3xl mt-4" style={{ color: "var(--text)" }}>
        {k.value}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
        {k.label}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="card-soft px-3 py-2 text-xs font-mono"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="mb-1 font-semibold" style={{ color: "var(--text)" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {p.value}{suffix}
        </div>
      ))}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose} />
      <div className="card w-full max-w-md p-6 relative fade-in mnft-scroll" style={{ maxHeight: "88vh", overflowY: "auto" }}>
        <button onClick={onClose} className="absolute right-4 top-4 btn-ghost w-8 h-8 rounded-lg flex items-center justify-center" aria-label="Close">
          <X size={15} />
        </button>
        <h3 className="font-display text-xl pr-8" style={{ color: "var(--text)" }}>{title}</h3>
        {subtitle && <p className="text-xs mt-1 mb-5" style={{ color: "var(--muted)" }}>{subtitle}</p>}
        {!subtitle && <div className="mb-4" />}
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function inputStyle() {
  return { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" };
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="card-soft px-4 py-3 mb-4 flex items-center gap-2.5 fade-in" style={{ borderColor: "var(--success)" }}>
      <CheckCircle2 size={15} style={{ color: "var(--success)" }} />
      <span className="text-xs" style={{ color: "var(--text)" }}>{message}</span>
    </div>
  );
}

/* ---------------------------------- SIDEBAR / TOPBAR ---------------------------------- */

function Sidebar({ active, setActive, collapsed, session, navItems, businesses, businessId, businessName, onSwitchBusiness }) {
  const isAuthor = session?.role === "admin";
  return (
    <aside
      className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 py-5"
      style={{
        width: collapsed ? 84 : 252,
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        transition: "width .2s ease",
      }}
    >
      <div className="flex items-center gap-2.5 px-5 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }}
        >
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-display text-base" style={{ color: "var(--text)" }}>MNFT Growth</div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted)" }}>AI Platform</div>
          </div>
        )}
      </div>

      {!collapsed && isAuthor && businesses && businesses.length > 1 && (
        <div className="px-3 mb-4">
          <label className="text-[10px] font-semibold uppercase tracking-wide px-1" style={{ color: "var(--muted)" }}>Viewing business</label>
          <select
            value={businessId}
            onChange={(e) => onSwitchBusiness(e.target.value)}
            className="w-full mt-1.5 px-3 py-2 rounded-lg text-xs outline-none"
            style={inputStyle()}
          >
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto mnft-scroll">
        {(navItems || NAV).map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? "active" : ""}`}
              style={{ color: isActive ? "var(--accent)" : "var(--text-dim)" }}
              title={item.label}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mx-3 mt-4">
          <div className="card-soft p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full marquee-dot" style={{ background: "var(--success)" }} />
              <span className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                {businessName || "Business"}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {isAuthor
                ? `Author access · ${businesses ? businesses.length : 1} business${businesses && businesses.length > 1 ? "es" : ""} on this device`
                : "Business Owner access"}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

function Topbar({ title, mode, setMode, collapsed, setCollapsed, session, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readCount, setReadCount] = useState(() => lsGet("mnft_notifications_read_count", 0));
  const initials = (session?.name || "MO").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const unreadCount = Math.max(0, activity.length - readCount);

  function handleBellClick() {
    setNotifOpen((o) => !o);
    if (unreadCount > 0) {
      lsSet("mnft_notifications_read_count", activity.length);
      setReadCount(activity.length);
    }
  }

  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 md:px-8 py-4 backdrop-blur"
      style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg) 80%, transparent)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex btn-ghost w-9 h-9 rounded-lg items-center justify-center shrink-0"
        >
          <ChevronRight size={15} style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform .2s" }} />
        </button>
        <div className="relative hidden sm:block w-64 lg:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            placeholder="Search customers, campaigns, coupons…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {session?.role === "admin" && <Pill tone="gold"><Crown size={11}/>Admin</Pill>}
        <button
          onClick={() => setMode(mode === "dark" ? "light" : "dark")}
          className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center"
          aria-label="Toggle theme"
        >
          {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="relative">
          <button onClick={handleBellClick} className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center relative" aria-label="Notifications">
            <Bell size={16} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-72 card p-2 z-30 fade-in" onMouseLeave={() => setNotifOpen(false)}>
              <div className="px-3 py-2 mb-1 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Notifications</span>
                <button onClick={() => setNotifOpen(false)} className="btn-ghost w-6 h-6 rounded-md flex items-center justify-center"><X size={11} /></button>
              </div>
              <div className="max-h-72 overflow-y-auto mnft-scroll">
                {activity.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)]">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: `var(--${a.tone}-soft)`, color: `var(--${a.tone})` }}>
                        <Icon size={11} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs leading-snug" style={{ color: "var(--text-dim)" }}>{a.text}</p>
                        <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{a.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 rounded-full flex items-center justify-center font-display text-sm shrink-0"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {initials}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 w-52 card p-2 z-30 fade-in" onMouseLeave={() => setMenuOpen(false)}>
              <div className="px-3 py-2 mb-1" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{session?.name}</div>
                <div className="text-[11px] truncate" style={{ color: "var(--muted)" }}>{session?.email || (session?.role === "admin" ? "Super Admin" : "Business Owner")}</div>
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium"
                style={{ color: "var(--danger)" }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- SECTIONS ---------------------------------- */

function DashboardSection({ onNewCampaign, businessName, businessId }) {
  const isDefaultBusiness = businessId === DEFAULT_BUSINESSES[0].id;

  // For the original showcase business, keep the rich demo visuals.
  // For every other (real) business, compute actual numbers from what's stored — starting at 0.
  const realCustomers = lsGet(bKey("mnft_customers", businessId), []);
  const realCoupons = lsGet(bKey("mnft_coupons", businessId), []);
  const realCampaigns = lsGet(bKey("mnft_campaigns", businessId), []);
  const realReviews = lsGet(bKey("mnft_reviews", businessId), []);

  const newCustomers = realCustomers.filter((c) => c.tag === "New").length;
  const returningCustomers = realCustomers.filter((c) => c.tag === "Loyal" || c.tag === "VIP" || (c.visits || 0) > 1).length;
  const revenueFromCustomers = realCustomers.reduce((sum, c) => sum + (parseInt(String(c.spend || "0").replace(/[^\d]/g, ""), 10) || 0), 0);
  const avgRating = realReviews.length ? (realReviews.reduce((s, r) => s + (r.rating || 0), 0) / realReviews.length).toFixed(1) : "—";
  const couponUses = realCoupons.reduce((sum, c) => sum + (parseInt(String(c.used || "0").split("/")[0].replace(/[^\d]/g, ""), 10) || 0), 0);

  const liveKpis = [
    { label: "Total Customers", value: realCustomers.length.toLocaleString(), delta: "", up: true, icon: Users },
    { label: "New Customers", value: newCustomers.toLocaleString(), delta: "", up: true, icon: Sparkles },
    { label: "Returning Customers", value: returningCustomers.toLocaleString(), delta: "", up: true, icon: RefreshCw },
    { label: "Revenue from Promotions", value: `Rs ${revenueFromCustomers.toLocaleString()}`, delta: "", up: true, icon: TrendingUp },
    { label: "Google Review Growth", value: avgRating === "—" ? "—" : `${avgRating} ★`, delta: "", up: true, icon: Star },
    { label: "Coupon Usage", value: couponUses.toLocaleString(), delta: "", up: true, icon: Ticket },
  ];

  const displayKpis = isDefaultBusiness ? kpis : liveKpis;
  const hasAnyData = realCustomers.length || realCoupons.length || realCampaigns.length || realReviews.length;

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Growth overview"
        title={`Good afternoon, ${businessName}`}
        subtitle="Here's how your marketing is performing across all branches this month."
        action={
          <button onClick={onNewCampaign} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            <Plus size={15} /> New Campaign
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {displayKpis.map((k) => <KpiCard key={k.label} k={k} />)}
      </div>

      {!isDefaultBusiness && !hasAnyData ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--surface-2)" }}>
            <Sparkles size={22} style={{ color: "var(--muted)" }} />
          </div>
          <h3 className="font-display text-lg mb-1" style={{ color: "var(--text)" }}>This restaurant is brand new</h3>
          <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
            Charts and activity will appear here once you add customers, run campaigns, or collect reviews for {businessName}.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-lg">Customer Growth</h3>
                <div className="flex gap-4 text-xs font-mono">
                  <span className="inline-flex items-center gap-1.5" style={{ color: "var(--accent)" }}><span className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />New + Total</span>
                  <span className="inline-flex items-center gap-1.5" style={{ color: "var(--gold)" }}><span className="w-2 h-2 rounded-full" style={{ background: "var(--gold)" }} />Returning</span>
                </div>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Last 6 months, all branches combined</p>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={isDefaultBusiness ? growthSeries : [{ m: "Now", customers: realCustomers.length, returning: returningCustomers }]} margin={{ left: -20, right: 10, top: 10 }}>
                    <defs>
                      <linearGradient id="gCust" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gRet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="customers" name="Customers" stroke="var(--accent)" fill="url(#gCust)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="returning" name="Returning" stroke="var(--gold)" fill="url(#gRet)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg mb-1">Promotion Revenue Mix</h3>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Share of revenue by promo type</p>
              {isDefaultBusiness ? (
                <>
                  <div style={{ height: 190 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={revenueMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3}>
                          {revenueMix.map((e, i) => <Cell key={i} fill={e.color} stroke="var(--surface)" strokeWidth={2} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip suffix="%" />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {revenueMix.map((e) => (
                      <div key={e.name} className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-2" style={{ color: "var(--text-dim)" }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />{e.name}
                        </span>
                        <span className="font-mono" style={{ color: "var(--text)" }}>{e.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[190px] flex items-center justify-center text-xs text-center px-6" style={{ color: "var(--muted)" }}>
                  Not enough promotion data yet to show a mix.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card p-6 lg:col-span-2">
              <h3 className="font-display text-lg mb-1">Campaign Performance</h3>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Sent vs. converted, by channel</p>
              <div style={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={isDefaultBusiness ? campaignPerf : realCampaigns.map((c) => ({ name: c.channel, sent: c.sent || 0, converted: 0 }))} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-2)" }} />
                    <Bar dataKey="sent" name="Sent" fill="var(--surface-3)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="converted" name="Converted" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg mb-4">Live Activity</h3>
              {isDefaultBusiness ? (
                <div className="space-y-4 mnft-scroll" style={{ maxHeight: 230, overflowY: "auto" }}>
                  {activity.map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `var(--${a.tone}-soft)`, color: `var(--${a.tone})` }}
                        >
                          <Icon size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs leading-snug" style={{ color: "var(--text-dim)" }}>{a.text}</p>
                          <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{a.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--muted)" }}>No activity yet — add customers or send a campaign to see it here.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const COUNTRIES = [
  {
    name: "Pakistan", tz: "PKT (UTC+5)",
    cities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Gujranwala", "Sialkot", "Hyderabad", "Bahawalpur", "Sargodha", "Sukkur", "Gujrat"],
  },
  { name: "Nigeria", tz: "WAT (UTC+1)", cities: ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan"] },
  { name: "Kenya", tz: "EAT (UTC+3)", cities: ["Nairobi", "Mombasa", "Kisumu"] },
  { name: "Ghana", tz: "GMT (UTC+0)", cities: ["Accra", "Kumasi"] },
  { name: "UAE", tz: "GST (UTC+4)", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { name: "United Kingdom", tz: "GMT/BST", cities: ["London", "Manchester", "Birmingham"] },
];

const PLATFORM_BASE_MINUTES = { Instagram: 19 * 60, Facebook: 13 * 60, TikTok: 20 * 60 + 30, WhatsApp: 12 * 60 + 30 };

// Every district gets its own slightly-offset peak window, deterministically, so it feels location-specific.
function bestTimeFor(cityIndex, platform, tz) {
  const base = PLATFORM_BASE_MINUTES[platform];
  const offset = (cityIndex * 11) % 45; // 0-44 minute deterministic spread per city
  const total = base + offset;
  let h = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm} ${tz}`;
}

// Turn the promo's keywords into a real, relevant background photo instead of a plain color block.
function detectImageCategory(text) {
  const t = (text || "").toLowerCase();
  const rules = [
    { re: /coffee|latte|espresso|cappuccino|mocha/, cat: "coffee,cafe" },
    { re: /\btea\b|chai/, cat: "tea,cup" },
    { re: /burger|fries|fast\s?food/, cat: "burger,fastfood" },
    { re: /pizza/, cat: "pizza" },
    { re: /dessert|cake|pastry|sweet|ice\s?cream|bakery|donut|cupcake/, cat: "dessert,bakery" },
    { re: /smoothie|juice|cocktail|shake|milkshake/, cat: "smoothie,drink" },
    { re: /\bdrink\b|beverage/, cat: "drink,beverage" },
    { re: /biryani|karahi|bbq|kebab|grill|tikka|roast/, cat: "grill,bbq" },
    { re: /sushi/, cat: "sushi" },
    { re: /pasta|noodle|spaghetti/, cat: "pasta,noodles" },
    { re: /steak/, cat: "steak" },
    { re: /salad/, cat: "salad,healthyfood" },
    { re: /sandwich|wrap/, cat: "sandwich" },
    { re: /breakfast|brunch/, cat: "breakfast,brunch" },
    { re: /seafood|fish|shrimp|prawn/, cat: "seafood" },
    { re: /chicken/, cat: "chicken,food" },
    { re: /fried\s?rice|biryani|rice\b/, cat: "rice,food" },
    { re: /wine|beer|bar\b/, cat: "bar,drinks" },
    { re: /happy\s?hour/, cat: "restaurant,bar" },
  ];
  for (const r of rules) if (r.re.test(t)) return r.cat;
  return "restaurant,food";
}

// Pull the offer / headline out of whatever the user typed, instead of a fixed script.
function parsePromoPrompt(text) {
  const raw = (text || "").trim();
  const percentMatch = raw.match(/(\d{1,3})\s?%/);
  const amountMatch = raw.match(/(Rs |\$|£|€)\s?([\d,]+)/);
  const bogo = /\bbogo\b|buy\s?1\s?get\s?1|buy one get one/i.test(raw);
  const flash = /flash sale|today only|few hours|limited time/i.test(raw);
  const freeMatch = raw.match(/free\s+([a-zA-Z ]{2,20})/i);

  let headline = "SPECIAL OFFER";
  if (percentMatch) headline = `${percentMatch[1]}% OFF`;
  else if (amountMatch) headline = `${amountMatch[1]}${amountMatch[2]} OFF`;
  else if (bogo) headline = "BUY 1 GET 1";
  else if (freeMatch) headline = `FREE ${freeMatch[1].trim().toUpperCase()}`;
  else if (flash) headline = "FLASH SALE";

  // Grab a short subtitle: strip the number/offer part, keep the rest as context
  let subtitle = raw
    .replace(/(\d{1,3})\s?%\s?off/i, "")
    .replace(/(Rs |\$|£|€)\s?[\d,]+\s?off/i, "")
    .replace(/buy\s?1\s?get\s?1( free)?/i, "")
    .trim();
  if (!subtitle) subtitle = "Limited time offer";
  if (subtitle.length > 46) subtitle = subtitle.slice(0, 46).trim() + "…";

  return { headline, subtitle: subtitle.charAt(0).toUpperCase() + subtitle.slice(1), flash, raw: raw || "a special promotion" };
}

const TONE_OPENERS = {
  Playful: ["Okay but this is actually exciting —", "Small gist for you:", "Psst — good news alert:"],
  Elegant: ["A gentle reminder from us to you:", "This week, we're keeping it simple:", "An invitation, if you're free:"],
  Bold: ["STOP SCROLLING.", "This is not a drill —", "Big moves only:"],
};
const TONE_CLOSERS = {
  Playful: "See you soon, don't be shy 😊",
  Elegant: "We'd love to have you.",
  Bold: "Don't sleep on this. Move fast. 🔥",
};

function buildCaption({ promo, tone, platform, business }) {
  const opener = TONE_OPENERS[tone][Math.floor(Math.random() * TONE_OPENERS[tone].length)];
  const closer = TONE_CLOSERS[tone];
  const platformNote = platform === "TikTok" ? "Tap the link in bio to see it in action 🎥" : platform === "WhatsApp" ? "Reply YES and we'll save you a spot." : "Tag someone who needs to see this.";
  return `${opener} ${business} has ${promo.raw}. ${promo.flash ? "Only while stock/slots last!" : ""} ${platformNote} ${closer}`.replace(/\s+/g, " ").trim();
}

function buildHashtags(promo) {
  const base = ["#RiversideCafe"];
  if (promo.headline.includes("OFF")) base.push("#DealAlert");
  if (promo.flash) base.push("#FlashSale");
  base.push("#TreatYourself", "#LocalFavorite");
  return base.slice(0, 5);
}

const POSTER_THEMES = [
  { from: "var(--accent)", to: "var(--gold)" },
  { from: "#5B3CC4", to: "var(--accent)" },
  { from: "#0E7C66", to: "var(--gold)" },
];

// Canvas can't read CSS custom properties, so resolve var(--x) to a real color by asking the DOM.
function resolveCssColor(value) {
  if (typeof value !== "string" || !value.startsWith("var(")) return value;
  if (typeof window === "undefined") return "#FF6B45";
  const varName = value.slice(4, -1).trim();
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return resolved || "#FF6B45";
}

// Simple manual word-wrap for canvas text (canvas has no built-in wrapping).
// Loads a (base64 or same-origin) image so it can be drawn onto a <canvas>.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = (text || "").split(" ");
  let line = "";
  const lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function AiMarketingSection({ businessName, businessId }) {
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("Playful");
  const [countryIdx, setCountryIdx] = useState(0);
  const [cityIdx, setCityIdx] = useState(0);
  const [prompt, setPrompt] = useState("Rainy-day 20% off hot drinks promotion, valid this week only.");
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPhones, setSelectedPhones] = useState(() => new Set());
  const [queue, setQueue] = useState(null); // { list, idx, sentCount }
  const [customImage, setCustomImage] = useState(""); // base64 — if set, used instead of the auto-fetched stock photo
  const customImageInputRef = useRef(null);

  function handleCustomImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Please choose an image under 4MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCustomImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const customerList = lsGet(bKey("mnft_customers", businessId), customers).filter((c) => c.phone);

  function toggleSelect(phone) {
    setSelectedPhones((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedPhones((prev) => (prev.size === customerList.length ? new Set() : new Set(customerList.map((c) => c.phone))));
  }

  function startQueue() {
    const list = customerList.filter((c) => selectedPhones.has(c.phone));
    if (!list.length) return;
    setQueue({ list, idx: 0, sentCount: 0 });
    setShowShareModal(false);
  }

  function openCurrentInWhatsApp() {
    if (!queue) return;
    const c = queue.list[queue.idx];
    const message = `Hi ${c.name.split(" ")[0]}! ${generated.headline} — ${generated.subtitle} at ${businessName}. ${generated.caption}`;
    window.open(waLink(c.phone, message), "_blank");
  }

  function markSentAndNext() {
    setQueue((q) => {
      const nextIdx = q.idx + 1;
      if (nextIdx >= q.list.length) return null;
      return { ...q, idx: nextIdx, sentCount: q.sentCount + 1 };
    });
  }

  const platforms = [
    { name: "Instagram", icon: Instagram },
    { name: "Facebook", icon: Facebook },
    { name: "TikTok", icon: Music2 },
    { name: "WhatsApp", icon: MessageCircle },
  ];
  const country = COUNTRIES[countryIdx];
  const cityName = country.cities[cityIdx];

  function handleCountryChange(idx) {
    setCountryIdx(idx);
    setCityIdx(0);
  }

  function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setGenerated(null);
    setCopied(false);
    setTimeout(() => {
      const promo = parsePromoPrompt(prompt);
      const caption = buildCaption({ promo, tone, platform, business: businessName });
      const theme = POSTER_THEMES[Math.floor(Math.random() * POSTER_THEMES.length)];
      const category = detectImageCategory(promo.raw);
      const company = lsGet(bKey("mnft_company_info", businessId), sampleFor(businessId, DEFAULT_COMPANY_INFO, {}));
      setGenerated({
        headline: promo.headline,
        subtitle: promo.subtitle,
        caption,
        hashtags: buildHashtags(promo),
        bestTime: bestTimeFor(cityIdx, platform, country.tz),
        theme,
        posterImage: customImage || `https://loremflickr.com/800/800/${category}/all?random=${Date.now()}`,
        logo: company.logo || "",
      });
      setLoading(false);
    }, 900);
  }

  function handleCopy() {
    if (!generated) return;
    const text = `${generated.caption}\n\n${generated.hashtags.join(" ")}`;
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function downloadPoster() {
    if (!generated) return;
    const size = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Background gradient (always renders, no external-image risk).
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, resolveCssColor(generated.theme.from));
    grad.addColorStop(1, resolveCssColor(generated.theme.to));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // If the person uploaded their own photo (a safe same-origin data URL), bake it into the download too.
    if (generated.posterImage && generated.posterImage.startsWith("data:")) {
      try {
        const photo = await loadImage(generated.posterImage);
        const scale = Math.max(size / photo.width, size / photo.height);
        const w = photo.width * scale;
        const h = photo.height * scale;
        ctx.drawImage(photo, (size - w) / 2, (size - h) / 2, w, h);
      } catch {}
    }

    // Soft bottom-heavy dark overlay so text stays legible, matching the preview style.
    const overlay = ctx.createLinearGradient(0, 0, 0, size);
    overlay.addColorStop(0, "rgba(0,0,0,0.05)");
    overlay.addColorStop(0.55, "rgba(0,0,0,0.15)");
    overlay.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, size, size);

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch {}
    }

    if (generated.logo) {
      try {
        const logoImg = await loadImage(generated.logo);
        const logoSize = 96;
        const cx = size / 2;
        const cy = size * 0.3;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImg, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 4;
        ctx.stroke();
      } catch {}
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "600 28px Inter, sans-serif";
    ctx.fillText(businessName.toUpperCase(), size / 2, size * 0.38);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 84px Fraunces, serif";
    wrapCanvasText(ctx, generated.headline, size / 2, size * 0.5, size * 0.82, 92);

    ctx.font = "500 30px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    wrapCanvasText(ctx, generated.subtitle, size / 2, size * 0.66, size * 0.7, 40);

    ctx.font = "400 18px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("AI poster concept · MNFT Growth AI", size / 2, size - 40);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-poster.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="AI Marketing Studio"
        title="Generate on-brand promotions in seconds"
        subtitle="Describe the offer, pick a platform, tone & location — MNFT drafts the caption, poster, and the best time to post for that location."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="card p-6 lg:col-span-2 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Platform</label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {platforms.map((p) => {
                const Icon = p.icon;
                const isActive = platform === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => setPlatform(p.name)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-[11px] font-medium"
                    style={{
                      background: isActive ? "var(--accent-soft)" : "var(--surface-2)",
                      color: isActive ? "var(--accent)" : "var(--text-dim)",
                      border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    <Icon size={16} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Tone</label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {["Playful", "Elegant", "Bold"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: tone === t ? "var(--accent)" : "var(--surface-2)",
                    color: tone === t ? "#fff" : "var(--text-dim)",
                    border: `1px solid ${tone === t ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide inline-flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
              <MapPin size={12} /> Business Location
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <select
                value={countryIdx}
                onChange={(e) => handleCountryChange(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle()}
              >
                {COUNTRIES.map((c, i) => (
                  <option key={c.name} value={i}>{c.name}</option>
                ))}
              </select>
              <select
                value={cityIdx}
                onChange={(e) => setCityIdx(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle()}
              >
                {country.cities.map((city, i) => (
                  <option key={city} value={i}>{city}</option>
                ))}
              </select>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>
              Best posting time is calculated for {cityName}'s local peak-engagement window ({country.tz}).
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>What are we promoting?</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 30% off all smoothies this weekend, dine-in only"
              className="w-full mt-2 px-3.5 py-3 rounded-xl text-sm outline-none resize-none"
              style={inputStyle()}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Photo for the poster (optional)</label>
            <input ref={customImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleCustomImageUpload} />
            {customImage ? (
              <div className="mt-2 flex items-center gap-3">
                <img src={customImage} alt="Your upload" className="w-14 h-14 rounded-lg object-cover" style={{ border: "1px solid var(--border)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>Using your photo instead of a stock image.</p>
                  <button onClick={() => setCustomImage("")} className="text-xs font-semibold mt-1" style={{ color: "var(--danger)" }}>Remove</button>
                </div>
              </div>
            ) : (
              <button onClick={() => customImageInputRef.current?.click()} className="btn-ghost w-full mt-2 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                <Upload size={13} /> Upload your own photo
              </button>
            )}
            <p className="text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>
              Skip this and we'll auto-pick a matching stock photo based on what you're promoting.
            </p>
          </div>

          <button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ opacity: !prompt.trim() ? 0.6 : 1 }}>
            <Wand2 size={15} /> {loading ? "Generating…" : "Generate promotion"}
          </button>

          <div className="card-soft p-3.5 flex items-start gap-2.5">
            <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
              Suggested next campaign: <strong style={{ color: "var(--text)" }}>Happy Hour, Wed–Fri 4–6pm</strong> — based on your slowest traffic window this month.
            </p>
          </div>
        </div>

        <div className="card p-6 lg:col-span-3">
          <h3 className="font-display text-lg mb-4">Preview</h3>
          {!generated && !loading && (
            <div className="h-80 flex flex-col items-center justify-center text-center gap-3" style={{ color: "var(--muted)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <ImageIcon size={22} />
              </div>
              <p className="text-sm max-w-xs">Describe your offer on the left and generate — your caption, poster, and posting time will show up here.</p>
            </div>
          )}
          {loading && (
            <div className="h-80 flex flex-col items-center justify-center gap-3" style={{ color: "var(--muted)" }}>
              <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
              <p className="text-sm">Drafting your post…</p>
            </div>
          )}
          {generated && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 fade-in">
              <div className="flex flex-col gap-2">
                <div
                  className="aspect-square rounded-2xl relative overflow-hidden"
                  style={{ background: `linear-gradient(150deg, ${generated.theme.from} 0%, ${generated.theme.to} 100%)` }}
                >
                  <img
                    src={generated.posterImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(185deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.82) 100%)" }} />
                  <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
                    {generated.logo ? (
                      <img src={generated.logo} alt="" className="w-11 h-11 rounded-full object-cover mb-2 border-2" style={{ borderColor: "rgba(255,255,255,0.8)" }} />
                    ) : null}
                    <span className="text-[10px] tracking-widest uppercase text-white/85 mb-2">{businessName}</span>
                    <span className="font-display text-3xl text-white leading-tight" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>{generated.headline}</span>
                    <span className="text-xs text-white/90 mt-3 px-4">{generated.subtitle}</span>
                    <span className="absolute bottom-3 right-3 text-[10px] text-white/70 font-mono">AI poster concept</span>
                  </div>
                </div>
                <button onClick={downloadPoster} className="btn-ghost py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                  <Download size={13}/> Download poster (PNG)
                </button>
              </div>
              <div className="flex flex-col">
                <div className="card-soft p-4 mb-3 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Caption for {platform}</span>
                    <button onClick={handleCopy} className="btn-ghost px-2 py-1 rounded-md text-[10px] inline-flex items-center gap-1">
                      {copied ? <><Check size={11}/>Copied</> : <><Copy size={11}/>Copy</>}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{generated.caption}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {generated.hashtags.map((h) => <Pill key={h} tone="accent">{h}</Pill>)}
                  </div>
                </div>
                <div className="card-soft p-4 flex items-center gap-2.5">
                  <Clock size={14} style={{ color: "var(--gold)" }} />
                  <div className="text-xs">
                    <span style={{ color: "var(--muted)" }}>Best time to post ({cityName}): </span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{generated.bestTime}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleGenerate} className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                    <RefreshCw size={12}/> Regenerate
                  </button>
                  <button onClick={() => setShowShareModal(true)} className="btn-ghost flex-1 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                    <MessageCircle size={12}/> Share to customers
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <Modal title="Share to customers" subtitle="WhatsApp only lets each person's chat send when they personally tap Send — pick who to message, then step through one tap at a time." onClose={() => setShowShareModal(false)}>
          {!customerList.length ? (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>No customers with a saved WhatsApp number yet. Add some from the Customers page first.</p>
          ) : (
            <>
              <button onClick={toggleSelectAll} className="text-xs font-semibold mb-3" style={{ color: "var(--accent)" }}>
                {selectedPhones.size === customerList.length ? "Unselect all" : "Select all"}
              </button>
              <div className="space-y-2 mb-4 mnft-scroll" style={{ maxHeight: 260, overflowY: "auto" }}>
                {customerList.map((c) => (
                  <label key={c.phone} className="card-soft p-3 flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedPhones.has(c.phone)} onChange={() => toggleSelect(c.phone)} className="w-4 h-4 shrink-0" />
                    <span className="text-sm" style={{ color: "var(--text)" }}>{c.name}</span>
                    <span className="text-xs font-mono ml-auto" style={{ color: "var(--muted)" }}>+{c.phone}</span>
                  </label>
                ))}
              </div>
              <button onClick={startQueue} disabled={!selectedPhones.size} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold" style={{ opacity: selectedPhones.size ? 1 : 0.5 }}>
                Start sending ({selectedPhones.size} selected)
              </button>
            </>
          )}
        </Modal>
      )}

      {queue && (
        <Modal title="Sending to customers" subtitle={`${queue.sentCount} of ${queue.list.length} sent so far`} onClose={() => setQueue(null)}>
          <div className="card-soft p-4 mb-4 text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 font-display text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              {queue.list[queue.idx].name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{queue.list[queue.idx].name}</div>
            <div className="text-xs font-mono" style={{ color: "var(--muted)" }}>+{queue.list[queue.idx].phone}</div>
          </div>
          <div className="progress-track h-1.5 mb-4"><div className="progress-fill h-1.5" style={{ width: `${(queue.sentCount / queue.list.length) * 100}%` }} /></div>
          <button onClick={openCurrentInWhatsApp} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 mb-2">
            <MessageCircle size={14} /> Open WhatsApp for {queue.list[queue.idx].name.split(" ")[0]}
          </button>
          <p className="text-[10px] text-center mb-3" style={{ color: "var(--muted)" }}>WhatsApp opens with the message ready — you just tap Send there, then come back here.</p>
          <button onClick={markSentAndNext} className="btn-ghost w-full py-2.5 rounded-xl text-xs font-semibold">
            {queue.idx + 1 >= queue.list.length ? "Done" : `Sent — next (${queue.list.length - queue.idx - 1} left)`}
          </button>
        </Modal>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const tone = status === "Sent" ? "success" : status === "Running" ? "accent" : status === "Scheduled" ? "gold" : status === "Ended" ? "danger" : "muted";
  return <Pill tone={tone}>{status}</Pill>;
}

function CampaignsSection({ businessId }) {
  const channelIcon = { WhatsApp: MessageCircle, SMS: Smartphone, Email: Mail, Push: Bell };
  const [list, setList] = usePersistedState(bKey("mnft_campaigns", businessId), sampleFor(businessId, campaignsList, []));
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: "", channel: "WhatsApp", audience: "All Branches" });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setList((prev) => [
      { name: form.name.trim(), channel: form.channel, audience: form.audience, status: "Draft", sent: 0, opens: "—", ctr: "—" },
      ...prev,
    ]);
    setShowModal(false);
    setForm({ name: "", channel: "WhatsApp", audience: "All Branches" });
    setToast(`"${form.name.trim()}" campaign created as a draft`);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Campaign Manager"
        title="WhatsApp, SMS, Email & Push in one place"
        subtitle="Schedule, segment, and track every campaign across channels."
        action={<button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><Plus size={15}/>New Campaign</button>}
      />

      <Toast message={toast} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Campaigns", value: "7", icon: Megaphone },
          { label: "Messages Sent (30d)", value: "15,730", icon: Send },
          { label: "Avg. Open Rate", value: "58%", icon: TrendingUp },
          { label: "Avg. Conversion", value: "12.4%", icon: Zap },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5">
              <Icon size={16} style={{ color: "var(--accent)" }} />
              <div className="font-display text-2xl mt-3">{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-display text-lg">Campaign History</h3>
          <button className="btn-ghost px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5"><Filter size={12}/>Filter</button>
        </div>
        <div className="overflow-x-auto mnft-scroll">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr style={{ color: "var(--muted)" }} className="text-left text-xs uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Campaign</th>
                <th className="px-6 py-3 font-medium">Channel</th>
                <th className="px-6 py-3 font-medium">Audience</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Sent</th>
                <th className="px-6 py-3 font-medium">Open Rate</th>
                <th className="px-6 py-3 font-medium">CTR</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c, i) => {
                const Icon = channelIcon[c.channel];
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="px-6 py-3.5 font-medium" style={{ color: "var(--text)" }}>{c.name}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-dim)" }}>
                        <Icon size={13} /> {c.channel}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.audience}</td>
                    <td className="px-6 py-3.5"><StatusPill status={c.status} /></td>
                    <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.sent.toLocaleString()}</td>
                    <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.opens}</td>
                    <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.ctr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="New Campaign" subtitle="Draft a campaign — you can schedule it later." onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Campaign name">
              <input autoFocus value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Weekend Flash Sale" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="Channel">
              <select value={form.channel} onChange={(e) => update("channel", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {["WhatsApp", "SMS", "Email", "Push"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Audience">
              <select value={form.audience} onChange={(e) => update("audience", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {["All Branches", "Frequent Buyers", "Lapsing customers", "Birthday this month", "App users"].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Create draft</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function CustomersSection({ businessId, businessName }) {
  const [query, setQuery] = useState("");
  const [list, setList] = usePersistedState(bKey("mnft_customers", businessId), sampleFor(businessId, customers, []));
  const [importMsg, setImportMsg] = useState(null);
  const fileInputRef = useRef(null);
  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState(null);

  function openEdit(idx, c) {
    setEditIndex(idx);
    setEditForm({ ...c });
  }

  function updateEdit(field, value) {
    setEditForm((f) => ({ ...f, [field]: value }));
  }

  function saveEdit(e) {
    e.preventDefault();
    setList((prev) => prev.map((c, i) => (i === editIndex ? { ...editForm, phone: toWaNumber(editForm.phone) } : c)));
    setEditIndex(null);
    setEditForm(null);
    setImportMsg("Customer updated");
    setTimeout(() => setImportMsg(null), 3000);
  }

  function deleteCustomer() {
    if (!window.confirm(`Remove ${editForm.name} from your customer list?`)) return;
    setList((prev) => prev.filter((_, i) => i !== editIndex));
    setEditIndex(null);
    setEditForm(null);
  }

  const filtered = useMemo(
    () => list.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [query, list]
  );
  const tagTone = { VIP: "gold", New: "accent", Loyal: "success", "At Risk": "danger" };

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Accept flexible column names: name/Name/Customer, phone/Phone/Number/WhatsApp
        const existingPhones = new Set(list.map((c) => c.phone));
        const seenInFile = new Set();
        let invalidCount = 0;
        let missingNameCount = 0;
        let duplicateCount = 0;

        const imported = results.data
          .map((row) => {
            const rawPhone = row.phone || row.Phone || row.number || row.Number || row.whatsapp || row.WhatsApp || "";
            const phone = toWaNumber(rawPhone);
            const rawName = (row.name || row.Name || row.customer || row.Customer || "").trim();

            if (!phone || phone.length < 10) { invalidCount += 1; return null; }
            if (existingPhones.has(phone) || seenInFile.has(phone)) { duplicateCount += 1; return null; }
            seenInFile.add(phone);
            if (!rawName) missingNameCount += 1;

            return {
              name: rawName || `Imported Contact (+${phone})`,
              phone,
              tag: "New",
              segment: "Imported",
              spend: "Rs 0",
              visits: 0,
              birthday: "—",
              fav: "—",
              consent: true,
            };
          })
          .filter(Boolean);

        setList((prev) => [...imported, ...prev]);
        const parts = [];
        if (imported.length) parts.push(`${imported.length} added`);
        if (duplicateCount) parts.push(`${duplicateCount} duplicate${duplicateCount > 1 ? "s" : ""} skipped`);
        if (invalidCount) parts.push(`${invalidCount} invalid number${invalidCount > 1 ? "s" : ""} skipped`);
        if (missingNameCount) parts.push(`${missingNameCount} had no name (auto-labeled)`);
        setImportMsg(parts.length ? `${file.name}: ${parts.join(", ")}` : `No valid rows found in ${file.name} — make sure it has a "phone" column`);
        setTimeout(() => setImportMsg(null), 5500);
      },
      error: () => {
        setImportMsg(`Couldn't read ${file.name}`);
        setTimeout(() => setImportMsg(null), 4500);
      },
    });

    e.target.value = ""; // allow re-uploading the same file
  }

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", tag: "New", consent: true });

  function updateAdd(field, value) {
    setAddForm((f) => ({ ...f, [field]: value }));
  }

  function handleAddCustomer(e) {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setList((prev) => [
      {
        name: addForm.name.trim(),
        phone: toWaNumber(addForm.phone),
        tag: addForm.tag,
        segment: "First Purchase",
        spend: "Rs 0",
        visits: 0,
        birthday: "—",
        fav: "—",
        consent: addForm.consent,
      },
      ...prev,
    ]);
    setShowAddModal(false);
    setImportMsg(`${addForm.name.trim()} added to your customer list`);
    setAddForm({ name: "", phone: "", tag: "New", consent: true });
    setTimeout(() => setImportMsg(null), 4000);
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Customer Management"
        title="Know every customer, personally"
        subtitle="Purchase history, tags, segments, favorites, and birthdays — all in one database."
        action={
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            <button onClick={handleImportClick} className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <Upload size={15} /> Import from file
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><Plus size={15}/>Add Customer</button>
          </div>
        }
      />

      {importMsg && (
        <div className="card-soft px-4 py-3 mb-4 flex items-center gap-2.5 fade-in" style={{ borderColor: "var(--success)" }}>
          <CheckCircle2 size={15} style={{ color: "var(--success)" }} />
          <span className="text-xs" style={{ color: "var(--text)" }}>{importMsg}</span>
        </div>
      )}

      <div className="card-soft px-4 py-3 mb-4 flex items-start gap-2.5">
        <Upload size={13} className="mt-0.5 shrink-0" style={{ color: "var(--muted)" }} />
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
          Upload a <strong style={{ color: "var(--text)" }}>.csv</strong> file with <strong style={{ color: "var(--text)" }}>name</strong> and <strong style={{ color: "var(--text)" }}>phone</strong> columns — every number in it is added to your customer list automatically. Existing formats (local 0-prefixed numbers) are converted for WhatsApp automatically.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
        {["All Segments", "VIP", "At Risk", "Birthdays this month"].map((s, i) => (
          <button key={s} className="chip px-3 py-2 rounded-xl text-xs font-medium" style={{ color: i === 0 ? "var(--text)" : "var(--text-dim)" }}>{s}</button>
        ))}
        <span className="text-xs font-mono ml-auto" style={{ color: "var(--muted)" }}>{list.length} customers</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto mnft-scroll">
          <table className="w-full text-sm min-w-[840px]">
            <thead>
              <tr style={{ color: "var(--muted)" }} className="text-left text-xs uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">WhatsApp</th>
                <th className="px-6 py-3 font-medium">Tag</th>
                <th className="px-6 py-3 font-medium">Segment</th>
                <th className="px-6 py-3 font-medium">Total Spend</th>
                <th className="px-6 py-3 font-medium">Visits</th>
                <th className="px-6 py-3 font-medium">Birthday</th>
                <th className="px-6 py-3 font-medium">Favorite</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="px-6 py-3.5 font-medium flex items-center gap-2.5" style={{ color: "var(--text)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-display shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    {c.name}
                  </td>
                  <td className="px-6 py-3.5">
                    {c.phone ? (
                      <a
                        href={waLink(c.phone, `Hi ${c.name.split(" ")[0]}, thanks for being a ${businessName} customer! 🌟`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono"
                        style={{ color: "var(--success)" }}
                        title="Open chat on WhatsApp"
                      >
                        <MessageCircle size={13} /> +{c.phone}
                      </a>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Pill tone={tagTone[c.tag] || "muted"}>{c.tag}</Pill>
                      {c.consent === false && <Pill tone="danger">Opted out</Pill>}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.segment}</td>
                  <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.spend}</td>
                  <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.visits}</td>
                  <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.birthday}</td>
                  <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.fav}</td>
                  <td className="px-6 py-3.5">
                    <button onClick={() => openEdit(list.indexOf(c), c)} className="btn-ghost px-2.5 py-1.5 rounded-lg text-[11px] font-semibold">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <Modal title="Add Customer" subtitle="Add a customer manually to your database." onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddCustomer}>
            <Field label="Full name">
              <input autoFocus value={addForm.name} onChange={(e) => updateAdd("name", e.target.value)} placeholder="e.g. Ngozi Adeyemi" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="WhatsApp number">
              <input value={addForm.phone} onChange={(e) => updateAdd("phone", e.target.value)} placeholder="e.g. 08031112223" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="Tag">
              <select value={addForm.tag} onChange={(e) => updateAdd("tag", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {["New", "Loyal", "VIP", "At Risk"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2.5 mb-3.5 cursor-pointer">
              <input type="checkbox" checked={addForm.consent} onChange={(e) => updateAdd("consent", e.target.checked)} className="w-4 h-4" />
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>Customer agreed to receive marketing messages</span>
            </label>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Add customer</button>
          </form>
        </Modal>
      )}

      {editForm && (
        <Modal title="Edit Customer" subtitle="Update this customer's details." onClose={() => { setEditIndex(null); setEditForm(null); }}>
          <form onSubmit={saveEdit}>
            <Field label="Full name">
              <input autoFocus value={editForm.name} onChange={(e) => updateEdit("name", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="WhatsApp number">
              <input value={editForm.phone} onChange={(e) => updateEdit("phone", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="Tag">
              <select value={editForm.tag} onChange={(e) => updateEdit("tag", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {["New", "Loyal", "VIP", "At Risk"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Segment">
              <input value={editForm.segment} onChange={(e) => updateEdit("segment", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Total spend">
                <input value={editForm.spend} onChange={(e) => updateEdit("spend", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
              </Field>
              <Field label="Visits">
                <input value={editForm.visits} onChange={(e) => updateEdit("visits", Number(e.target.value) || 0)} type="number" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Birthday">
                <input value={editForm.birthday} onChange={(e) => updateEdit("birthday", e.target.value)} placeholder="e.g. Aug 14" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
              </Field>
              <Field label="Favorite item">
                <input value={editForm.fav} onChange={(e) => updateEdit("fav", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
              </Field>
            </div>
            <label className="flex items-center gap-2.5 mb-3.5 cursor-pointer">
              <input type="checkbox" checked={editForm.consent !== false} onChange={(e) => updateEdit("consent", e.target.checked)} className="w-4 h-4" />
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>Customer agreed to receive marketing messages</span>
            </label>
            <div className="flex gap-2 mt-2">
              <button type="submit" className="btn-primary flex-1 py-3 rounded-xl text-sm font-semibold">Save changes</button>
              <button type="button" onClick={deleteCustomer} className="btn-ghost px-4 py-3 rounded-xl text-sm font-semibold" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const PROMO_TYPES_BASE = [
  { name: "Discount Campaigns", icon: Ticket, desc: "Percentage or fixed-amount off", active: 3 },
  { name: "Buy One Get One", icon: Gift, desc: "Drive basket size and trial", active: 1 },
  { name: "Flash Sales", icon: Zap, desc: "Time-boxed urgency offers", active: 1 },
  { name: "Happy Hour", icon: Clock, desc: "Fill slow traffic windows", active: 2 },
  { name: "Seasonal Promotions", icon: Calendar, desc: "Tied to holidays & seasons", active: 0 },
  { name: "Festival Promotions", icon: Star, desc: "Local & cultural festivals", active: 1 },
];

function PromotionsSection({ businessId }) {
  const [activeCounts, setActiveCounts] = usePersistedState(
    bKey("mnft_promo_active_counts", businessId),
    sampleFor(
      businessId,
      Object.fromEntries(PROMO_TYPES_BASE.map((t) => [t.name, t.active])),
      Object.fromEntries(PROMO_TYPES_BASE.map((t) => [t.name, 0]))
    )
  );
  const types = PROMO_TYPES_BASE.map((t) => ({ ...t, active: activeCounts[t.name] ?? t.active }));
  const [modalType, setModalType] = useState(null);
  const [form, setForm] = useState({ name: "", value: "", duration: "7 days" });
  const [toast, setToast] = useState(null);
  const tiers = [
    { name: "Bronze", need: "0 – 999 pts", perk: "5% birthday discount", color: "#B08968" },
    { name: "Silver", need: "1,000 – 2,999 pts", perk: "10% off + early access", color: "#B8B8C2" },
    { name: "Gold", need: "3,000+ pts", perk: "15% off + free item monthly", color: "var(--gold)" },
  ];

  function openModal(typeName) {
    setForm({ name: "", value: "", duration: "7 days" });
    setModalType(typeName);
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setActiveCounts((prev) => ({ ...prev, [modalType]: (prev[modalType] ?? 0) + 1 }));
    setToast(`"${form.name.trim()}" promotion created under ${modalType}`);
    setModalType(null);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Smart Promotions & Loyalty"
        title="Promotions that pay for themselves"
        subtitle="Run structured offers and reward loyalty with points, cashback, and tiers."
      />

      <Toast message={toast} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {types.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.name} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <Icon size={16} />
                </div>
                <Pill tone={p.active ? "success" : "muted"}>{p.active} active</Pill>
              </div>
              <div className="font-display text-base" style={{ color: "var(--text)" }}>{p.name}</div>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{p.desc}</p>
              <button onClick={() => openModal(p.name)} className="text-xs font-semibold mt-3 inline-flex items-center gap-1" style={{ color: "var(--accent)" }}>
                Create promotion <ChevronRight size={12} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-1">
          <h3 className="font-display text-lg mb-1">Points & Cashback</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Redeemable across all branches</p>
          <div className="card-soft p-4 mb-3">
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--muted)" }}>
              <span>Points issued (30d)</span><span className="font-mono" style={{ color: "var(--text)" }}>48,120</span>
            </div>
            <div className="progress-track h-2"><div className="progress-fill h-2" style={{ width: "72%" }} /></div>
          </div>
          <div className="card-soft p-4">
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--muted)" }}>
              <span>Cashback paid out (30d)</span><span className="font-mono" style={{ color: "var(--text)" }}>Rs 312,000</span>
            </div>
            <div className="progress-track h-2"><div className="progress-fill h-2" style={{ width: "48%" }} /></div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-lg mb-4">Membership Levels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tiers.map((t) => (
              <div key={t.name} className="card-soft p-4">
                <Crown size={16} style={{ color: t.color }} />
                <div className="font-display text-base mt-2" style={{ color: "var(--text)" }}>{t.name}</div>
                <div className="text-[11px] font-mono mt-1" style={{ color: "var(--muted)" }}>{t.need}</div>
                <div className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>{t.perk}</div>
              </div>
            ))}
          </div>
          <div className="card-soft p-4 mt-4 flex items-center gap-3">
            <div className="w-10 h-7 rounded-md" style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }} />
            <div className="text-xs" style={{ color: "var(--text-dim)" }}>
              <span className="font-semibold" style={{ color: "var(--text)" }}>Digital Loyalty Card</span> — customers add it to Apple/Google Wallet directly from WhatsApp.
            </div>
          </div>
        </div>
      </div>

      {modalType && (
        <Modal title={`New ${modalType}`} subtitle="Set the basics — you can fine-tune it later." onClose={() => setModalType(null)}>
          <form onSubmit={handleCreate}>
            <Field label="Promotion name">
              <input autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. August Weekend Special" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="Value (% off, amount, or item)">
              <input value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="e.g. 20% or Free pastry" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="Duration">
              <select value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {["Today only", "3 days", "7 days", "2 weeks", "1 month"].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Create promotion</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function CouponsSection({ businessId }) {
  const [list, setList] = usePersistedState(bKey("mnft_coupons", businessId), sampleFor(businessId, coupons, []));
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ code: "", type: "10% Off", limit: "100", expiry: "" });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!form.code.trim()) return;
    setList((prev) => [
      { code: form.code.trim().toUpperCase(), type: form.type, used: `0 / ${form.limit || "∞"}`, expiry: form.expiry || "No expiry", status: "Active" },
      ...prev,
    ]);
    setShowModal(false);
    setToast(`Coupon ${form.code.trim().toUpperCase()} created`);
    setForm({ code: "", type: "10% Off", limit: "100", expiry: "" });
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Coupon System"
        title="QR coupons that track themselves"
        subtitle="Create promo codes, set limits and expiry, and watch redemption in real time."
        action={<button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><Plus size={15}/>New Coupon</button>}
      />

      <Toast message={toast} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-36 h-36 rounded-2xl grid grid-cols-5 grid-rows-5 gap-1 p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} style={{ background: [3,4,6,10,12,14,18,20,21,22].includes(i) ? "var(--text)" : "transparent", borderRadius: 2 }} />
            ))}
          </div>
          <div className="font-display text-lg mt-4">WEEKEND20</div>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Scan to redeem 20% off in-store</p>
          <button className="btn-ghost px-4 py-2 rounded-lg text-xs font-semibold mt-4 inline-flex items-center gap-1.5"><QrCode size={13}/>Download QR</button>
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="font-display text-lg">Active Coupons</h3>
          </div>
          <div className="overflow-x-auto mnft-scroll">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr style={{ color: "var(--muted)" }} className="text-left text-xs uppercase tracking-wide">
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Usage</th>
                  <th className="px-6 py-3 font-medium">Expiry</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="px-6 py-3.5 font-mono font-medium" style={{ color: "var(--text)" }}>{c.code}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.type}</td>
                    <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.used}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.expiry}</td>
                    <td className="px-6 py-3.5"><Pill tone={c.status === "Active" ? "success" : "muted"}>{c.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="New Coupon" subtitle="Set up a promo code customers can redeem." onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Coupon code">
              <input autoFocus value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="e.g. SAVE15" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none font-mono tracking-wider" style={inputStyle()} />
            </Field>
            <Field label="Type">
              <select value={form.type} onChange={(e) => update("type", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {["10% Off", "20% Off", "30% Off", "Buy 1 Get 1", "Flash Sale"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Usage limit">
              <input value={form.limit} onChange={(e) => update("limit", e.target.value)} placeholder="e.g. 100 (leave blank for unlimited)" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="Expiry date">
              <input value={form.expiry} onChange={(e) => update("expiry", e.target.value)} placeholder="e.g. Aug 31, 2026" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Create coupon</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ReviewsSection({ businessId, businessName }) {
  const [liveReviews, setLiveReviews] = useState(() => lsGet(bKey("mnft_reviews", businessId), []));
  const [privateFeedback, setPrivateFeedback] = useState(() => lsGet(bKey("mnft_private_feedback", businessId), []));
  const googleLink = lsGet(bKey("mnft_google_review_link", businessId), sampleFor(businessId, DEFAULT_GOOGLE_REVIEW_LINK, ""));
  const combinedReviews = [...liveReviews, ...sampleFor(businessId, reviewsList, [])];
  const businessCustomers = lsGet(bKey("mnft_customers", businessId), sampleFor(businessId, customers, [])).filter((c) => c.phone);

  function refreshLive() {
    setLiveReviews(lsGet(bKey("mnft_reviews", businessId), []));
    setPrivateFeedback(lsGet(bKey("mnft_private_feedback", businessId), []));
  }

  function reviewPageLink(customerFirstName) {
    const origin = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "";
    return `${origin}?review=1&biz=${encodeURIComponent(businessId)}&name=${encodeURIComponent(customerFirstName)}`;
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Google Review Booster"
        title="Turn happy customers into 5★ reviews"
        subtitle="QR review requests, sentiment tracking, and a private channel for negative feedback."
        action={
          <button onClick={refreshLive} className="btn-ghost px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5">
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />

      {liveReviews.length > 0 && (
        <div className="card-soft px-4 py-3 mb-4 flex items-start gap-2.5">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "var(--success)" }} />
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
            {liveReviews.length} review{liveReviews.length > 1 ? "s" : ""} submitted from this device via the review link — shown first below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-2xl grid grid-cols-5 grid-rows-5 gap-1 p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} style={{ background: [1,2,5,8,11,13,16,19,23,24].includes(i) ? "var(--text)" : "transparent", borderRadius: 2 }} />
            ))}
          </div>
          <p className="text-xs mt-3 max-w-[180px]" style={{ color: "var(--muted)" }}>Table-tent QR code — scan to leave a Google review in one tap</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-1 mb-1">
            <span className="font-display text-4xl">4.8</span>
            <div className="flex ml-1">{Array.from({length:5}).map((_,i)=><Star key={i} size={14} fill={i<5?"var(--gold)":"none"} color="var(--gold)" />)}</div>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Based on 412 Google reviews · +61 this month</p>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reviewTrend} margin={{ left: -30, right: 5 }}>
                <XAxis dataKey="m" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[3.8, 5]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rating" name="Rating" stroke="var(--gold)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-base mb-3">Review Requests (30d)</h3>
          {[
            { label: "Sent automatically", value: 340 },
            { label: "Opened", value: 268 },
            { label: "Left a review", value: 96 },
          ].map((r) => (
            <div key={r.label} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-dim)" }}>
                <span>{r.label}</span><span className="font-mono">{r.value}</span>
              </div>
              <div className="progress-track h-1.5"><div className="progress-fill h-1.5" style={{ width: `${(r.value/340)*100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h3 className="font-display text-lg">Request a Review, Direct to WhatsApp</h3>
          <Pill tone="success"><MessageCircle size={11}/> One tap send</Pill>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          Click a customer's number — it opens WhatsApp with a review-request message ready to send.
        </p>
        <div className="space-y-2.5">
          {businessCustomers.slice(0, 5).map((c, i) => (
            <div key={i} className="card-soft px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-display shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {c.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.name}</div>
                  <div className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>+{c.phone}</div>
                </div>
              </div>
              <a
                href={waLink(c.phone, `Hi ${c.name.split(" ")[0]}, thanks for visiting ${businessName}! Could you spare 20 seconds to leave us a review? ${reviewPageLink(c.name.split(" ")[0])}`)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                <MessageCircle size={13} /> Request on WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display text-lg mb-4">Recent Reviews</h3>
        <div className="space-y-4">
          {combinedReviews.map((r, i) => (
            <div key={i} className="flex items-start justify-between gap-4 pb-4" style={{ borderBottom: i < combinedReviews.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-display shrink-0" style={{ background: "var(--surface-3)", color: "var(--text-dim)" }}>
                  {r.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{r.name}</span>
                    <div className="flex">{Array.from({length:5}).map((_,j)=><Star key={j} size={11} fill={j<r.rating?"var(--gold)":"none"} color="var(--gold)" />)}</div>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>{r.text}</p>
                  <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{r.time}</span>
                </div>
              </div>
              {r.flagged && <Pill tone="danger">Needs reply</Pill>}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircleWarning size={16} style={{ color: "var(--danger)" }} />
          <h3 className="font-display text-lg">Private Feedback</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          When customers choose "I had a problem" instead of a public review, it lands here — only your team sees it.
        </p>
        {!privateFeedback.length ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No private feedback yet.</p>
        ) : (
          <div className="space-y-3">
            {privateFeedback.map((f, i) => (
              <div key={i} className="card-soft p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{f.name}</span>
                  <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{f.time}</span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>{f.text}</p>
                {f.contact && (
                  <span className="text-[11px] font-mono mt-1.5 inline-block" style={{ color: "var(--muted)" }}>Contact: {f.contact}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReferralsSection({ businessId }) {
  const [leaders, setLeaders] = usePersistedState(bKey("mnft_referral_leaders", businessId), sampleFor(businessId, referralLeaders, []));
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: "", reward: "1000" });
  const referralLink = "riverside.cafe/join/AMARA18";
  const totalInvites = leaders.reduce((sum, l) => sum + l.invites, 0);
  const totalRewards = leaders.reduce((sum, l) => sum + parseInt(l.rewardEarned.replace(/[^\d]/g, "") || "0", 10), 0);

  function handleCopy() {
    if (navigator.clipboard) navigator.clipboard.writeText(`https://${referralLink}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleLogReferral(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLeaders((prev) => {
      const existing = prev.find((l) => l.name.toLowerCase() === form.name.trim().toLowerCase());
      const rewardAmount = parseInt(form.reward || "1000", 10) || 1000;
      if (existing) {
        return prev
          .map((l) => (l === existing ? { ...l, invites: l.invites + 1, rewardEarned: `Rs ${(parseInt(l.rewardEarned.replace(/[^\d]/g, ""), 10) + rewardAmount).toLocaleString()}` } : l))
          .sort((a, b) => b.invites - a.invites);
      }
      return [...prev, { name: form.name.trim(), invites: 1, rewardEarned: `Rs ${rewardAmount.toLocaleString()}` }].sort((a, b) => b.invites - a.invites);
    });
    setShowModal(false);
    setToast(`Referral logged for ${form.name.trim()}`);
    setForm({ name: "", reward: "1000" });
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Referral System"
        title="Let your best customers do the marketing"
        subtitle="Unique referral codes, tracked rewards, and a leaderboard to keep it fun."
        action={<button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><Plus size={15}/>Log Referral</button>}
      />

      <Toast message={toast} />

      <div className="card-soft px-4 py-3 mb-4 flex items-start gap-2.5">
        <Share2 size={13} className="mt-0.5 shrink-0" style={{ color: "var(--muted)" }} />
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
          This feature is optional — you can turn the whole Referral Program on or off anytime from <strong style={{ color: "var(--text)" }}>Business Profile → Settings</strong>. Turning it off hides it from the menu for everyone.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6">
          <h3 className="font-display text-lg mb-1">Your Referral Program</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Reward: Rs 1,000 credit for both sides</p>
          <div className="card-soft p-4 flex items-center justify-between mb-3">
            <span className="font-mono text-sm truncate" style={{ color: "var(--text)" }}>{referralLink}</span>
            <button onClick={handleCopy} className="btn-ghost px-2.5 py-1.5 rounded-md text-[11px] inline-flex items-center gap-1 shrink-0">
              {copied ? <><Check size={11}/>Copied</> : <><Copy size={11}/>Copy</>}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-soft p-3 text-center">
              <div className="font-display text-xl">{totalInvites}</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>Total invites</div>
            </div>
            <div className="card-soft p-3 text-center">
              <div className="font-display text-xl">Rs {totalRewards >= 1000 ? `${Math.round(totalRewards / 1000)}K` : totalRewards}</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>Rewards paid</div>
            </div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-lg mb-4">Referral Leaderboard</h3>
          <div className="space-y-3">
            {leaders.map((r, i) => (
              <div key={r.name} className="flex items-center gap-4">
                <div className="w-6 text-center font-display text-sm" style={{ color: i === 0 ? "var(--gold)" : "var(--muted)" }}>{i + 1}</div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-display shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {r.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{r.name}</div>
                  <div className="progress-track h-1.5 mt-1.5"><div className="progress-fill h-1.5" style={{ width: `${Math.min(100, (r.invites / Math.max(leaders[0].invites, 1)) * 100)}%` }} /></div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono" style={{ color: "var(--text)" }}>{r.invites} invites</div>
                  <div className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{r.rewardEarned}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="Log a Referral" subtitle="Record a successful referral to update the leaderboard and rewards." onClose={() => setShowModal(false)}>
          <form onSubmit={handleLogReferral}>
            <Field label="Referring customer">
              <input autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Amara Okafor" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="Reward amount (Rs )">
              <input value={form.reward} onChange={(e) => setForm((f) => ({ ...f, reward: e.target.value }))} placeholder="1000" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Log referral</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function AnalyticsSection({ businessId, businessName }) {
  const isDefaultBusiness = businessId === DEFAULT_BUSINESSES[0].id;
  const realCustomers = lsGet(bKey("mnft_customers", businessId), []);
  const realCoupons = lsGet(bKey("mnft_coupons", businessId), []);
  const returningCustomers = realCustomers.filter((c) => c.tag === "Loyal" || c.tag === "VIP" || (c.visits || 0) > 1).length;
  const repeatRate = realCustomers.length ? Math.round((returningCustomers / realCustomers.length) * 100) : 0;

  const conv = [
    { m: "Feb", rate: 3.1 }, { m: "Mar", rate: 3.4 }, { m: "Apr", rate: 3.8 },
    { m: "May", rate: 4.2 }, { m: "Jun", rate: 4.6 }, { m: "Jul", rate: 5.1 },
  ];
  const roiCards = isDefaultBusiness
    ? [
        { label: "Marketing ROI", value: "4.6x", note: "Rs 1 spent → Rs 4.60 generated" },
        { label: "Repeat Customer Rate", value: "62%", note: "Up from 54% last quarter" },
        { label: "Avg. Conversion Rate", value: "5.1%", note: "Across all campaigns" },
      ]
    : [
        { label: "Marketing ROI", value: "—", note: "Needs campaign + revenue data" },
        { label: "Repeat Customer Rate", value: `${repeatRate}%`, note: `${returningCustomers} of ${realCustomers.length} customers` },
        { label: "Coupons Redeemed", value: realCoupons.length.toLocaleString(), note: "Total coupons created so far" },
      ];

  const hasAnyData = realCustomers.length || realCoupons.length;

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Analytics"
        title="Marketing that proves its own ROI"
        subtitle="Track growth, conversion, and repeat business with real numbers."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {roiCards.map((r) => (
          <div key={r.label} className="card p-6">
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{r.label}</div>
            <div className="font-display text-4xl mt-2" style={{ color: "var(--accent)" }}>{r.value}</div>
            <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>{r.note}</p>
          </div>
        ))}
      </div>

      {!isDefaultBusiness && !hasAnyData ? (
        <div className="card p-10 text-center">
          <BarChart3 size={22} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
            Charts will appear here once {businessName} has customers, campaigns, or coupon activity to analyze.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-6">
            <h3 className="font-display text-lg mb-1">Conversion Rate Trend</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Visitors → paying customers</p>
            {isDefaultBusiness ? (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conv} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip content={<CustomTooltip suffix="%" />} />
                    <Line type="monotone" dataKey="rate" name="Conversion" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-xs" style={{ color: "var(--muted)" }}>Not enough data yet</div>
            )}
          </div>
          <div className="card p-6">
            <h3 className="font-display text-lg mb-1">Sales Growth</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Total vs. returning customers, 6 months</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={isDefaultBusiness ? growthSeries : [{ m: "Now", customers: realCustomers.length, returning: returningCustomers }]} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-2)" }} />
                  <Bar dataKey="customers" name="Total" fill="var(--surface-3)" radius={[6,6,0,0]} />
                  <Bar dataKey="returning" name="Returning" fill="var(--gold)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildAssistantSystemPrompt(businessName) {
  return `You are the MNFT Growth AI assistant, embedded inside a business-growth dashboard for "${businessName || "the business"}". You help the business owner with marketing ideas, customer retention, promotions, and interpreting their numbers. Their current snapshot: 8,412 total customers, 612 new this month (+12.4%), 1,080 returning (+6.9%), Rs 4.82M revenue from promotions (+18.3%), 4.8★ Google rating (412 reviews, +61 this month), 1,904 coupons used, 214 customers inactive 21+ days (win-back risk). Be specific, concise, and practical — like a sharp marketing consultant, not a generic chatbot. Keep replies under ~120 words unless asked for detail. Use Pakistani Rupees (Rs) when discussing money.`;
}

function AssistantSection({ businessId, businessName }) {
  const defaultThread = [
    { from: "ai", text: "Hi! I'm your growth assistant — ask me anything about your customers, campaigns, or numbers, or ask me to draft a promotion." },
  ];
  const [messages, setMessages] = useState(() => lsGet(bKey("mnft_assistant_thread", businessId), defaultThread));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const scrollRef = useRef(null);
  const businessIdRef = useRef(businessId);

  useEffect(() => {
    if (businessIdRef.current !== businessId) {
      businessIdRef.current = businessId;
      setMessages(lsGet(bKey("mnft_assistant_thread", businessId), defaultThread));
      return;
    }
    lsSet(bKey("mnft_assistant_thread", businessId), messages);
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, businessId]);


  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    setErrorMsg(null);
    const nextMessages = [...messages, { from: "user", text: userText }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const apiMessages = nextMessages.map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: buildAssistantSystemPrompt(businessName),
          messages: apiMessages,
        }),
      });
      const data = await response.json();
      const replyText = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      setMessages((prev) => [...prev, { from: "ai", text: replyText || "Sorry, I couldn't generate a reply just now — try again in a moment." }]);
    } catch (err) {
      setErrorMsg("Couldn't reach the assistant right now. Check your connection and try again.");
      setMessages((prev) => [...prev, { from: "ai", text: "Hmm, I'm having trouble connecting right now — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  const quickPrompts = [
    { icon: TrendingUp, title: "Sales Prediction", body: "What's a realistic sales forecast for next week?" },
    { icon: Users, title: "Customer Insight", body: "How should I win back my 214 inactive customers?" },
    { icon: Sparkles, title: "Promotion Idea", body: "Suggest a promotion idea for this weekend." },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="AI Assistant"
        title="Your always-on growth strategist"
        subtitle="Ask about performance, get campaign ideas, or let it draft the next send — powered by live AI."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2 flex flex-col" style={{ minHeight: 420 }}>
          <div ref={scrollRef} className="flex-1 space-y-4 mnft-scroll overflow-y-auto pr-1" style={{ maxHeight: 380 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                {m.from === "ai" && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-2.5" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    <Bot size={13} />
                  </div>
                )}
                <div
                  className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: m.from === "user" ? "var(--accent)" : "var(--surface-2)",
                    color: m.from === "user" ? "#fff" : "var(--text)",
                    borderTopRightRadius: m.from === "user" ? 4 : undefined,
                    borderTopLeftRadius: m.from === "ai" ? 4 : undefined,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-2.5" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <Bot size={13} />
                </div>
                <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                  Thinking…
                </div>
              </div>
            )}
          </div>
          {errorMsg && <div className="px-3.5 py-2.5 rounded-xl text-xs mt-3" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{errorMsg}</div>}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask MNFT anything about your business…"
              className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle()}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ opacity: loading || !input.trim() ? 0.6 : 1 }}>
              <Send size={15} />
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {quickPrompts.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.title} onClick={() => sendMessage(c.body)} disabled={loading} className="card p-5 text-left w-full">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--gold-soft)", color: "var(--gold)" }}>
                  <Icon size={16} />
                </div>
                <div className="font-display text-base mb-1">{c.title}</div>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>{c.body}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildReportRows(reportName) {
  // Pulls from the same mock datasets used across the dashboard, so numbers stay consistent.
  const header = ["Metric", "Value"];
  const rows = [
    ["Report", reportName],
    ["Generated", new Date().toLocaleString()],
    ["Total Customers", "8,412"],
    ["New Customers (period)", "612"],
    ["Returning Customers", "1,080"],
    ["Revenue from Promotions", "Rs 4,820,000"],
    ["Google Review Rating", "4.8 (412 reviews)"],
    ["Coupon Usage", "1,904"],
    ["Marketing ROI", "4.6x"],
    ["Repeat Customer Rate", "62%"],
    ["Avg. Conversion Rate", "5.1%"],
  ];
  return [header, ...rows];
}

function downloadTextFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const DEFAULT_NOTIFICATION_LOG = [
  { channel: "whatsapp", message: "Review request sent — \"Thanks for visiting, could you leave us a review?\"", audience: "5 customers", time: "6 minutes ago", status: "Delivered" },
  { channel: "sms", message: "Birthday Treats — August: \"Happy birthday! Enjoy 15% off today.\"", audience: "214 customers", time: "1 hour ago", status: "Delivered" },
  { channel: "email", message: "Win-back: 30 days inactive — \"We miss you, here's 10% off your next order.\"", audience: "890 customers", time: "3 hours ago", status: "Delivered" },
  { channel: "push", message: "New Menu Launch — \"Our new seasonal menu just dropped 🍂\"", audience: "App users", time: "1 day ago", status: "Delivered" },
  { channel: "inApp", message: "System: Weekend Flash Sale campaign completed with 74% open rate.", audience: "Team", time: "2 days ago", status: "Read" },
  { channel: "whatsapp", message: "Coupon reminder — \"Your WEEKEND20 code expires in 2 days.\"", audience: "312 customers", time: "2 days ago", status: "Delivered" },
];

const NOTIF_CHANNEL_META = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, tone: "success" },
  sms: { label: "SMS", icon: Smartphone, tone: "gold" },
  email: { label: "Email", icon: Mail, tone: "accent" },
  push: { label: "Push", icon: Bell, tone: "accent" },
  inApp: { label: "In-App", icon: LayoutDashboard, tone: "muted" },
};

function NotificationsSection({ businessId }) {
  const [log, setLog] = usePersistedState(bKey("mnft_notification_log", businessId), sampleFor(businessId, DEFAULT_NOTIFICATION_LOG, []));
  const notifPrefs = lsGet(bKey("mnft_notification_prefs", businessId), DEFAULT_NOTIFICATION_PREFS);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ channel: "whatsapp", message: "", audience: "All customers" });

  const enabledChannels = Object.keys(NOTIF_CHANNEL_META).filter((k) => notifPrefs[k]);
  const filtered = filter === "all" ? log : log.filter((n) => n.channel === filter);

  function handleSend(e) {
    e.preventDefault();
    if (!form.message.trim()) return;
    setLog((prev) => [
      { channel: form.channel, message: form.message.trim(), audience: form.audience, time: "Just now", status: "Delivered" },
      ...prev,
    ]);
    setShowModal(false);
    setToast(`${NOTIF_CHANNEL_META[form.channel].label} notification sent`);
    setForm({ channel: enabledChannels[0] || "whatsapp", message: "", audience: "All customers" });
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Notifications"
        title="Every message you've sent, in one log"
        subtitle="WhatsApp, SMS, Email, Push and In-App — all in one place, respecting your channel settings."
        action={
          <button onClick={() => setShowModal(true)} disabled={!enabledChannels.length} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2" style={{ opacity: enabledChannels.length ? 1 : 0.5 }}>
            <Plus size={15} /> Send Notification
          </button>
        }
      />

      <Toast message={toast} />

      {!enabledChannels.length && (
        <div className="card-soft px-4 py-3 mb-4 flex items-start gap-2.5">
          <Bell size={13} className="mt-0.5 shrink-0" style={{ color: "var(--danger)" }} />
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
            All channels are turned off in <strong style={{ color: "var(--text)" }}>Business Profile → Notification Channels</strong>. Turn at least one on to send new notifications.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter("all")} className="chip px-3 py-2 rounded-xl text-xs font-medium" style={{ color: filter === "all" ? "var(--text)" : "var(--text-dim)", borderColor: filter === "all" ? "var(--accent)" : "var(--border)" }}>All</button>
        {Object.entries(NOTIF_CHANNEL_META).map(([key, meta]) => (
          <button key={key} onClick={() => setFilter(key)} className="chip px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-1.5" style={{ color: filter === key ? "var(--text)" : "var(--text-dim)", borderColor: filter === key ? "var(--accent)" : "var(--border)" }}>
            <meta.icon size={12} /> {meta.label}
            {!notifPrefs[key] && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--danger)" }} title="Channel off" />}
          </button>
        ))}
      </div>

      <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No notifications on this channel yet.</div>
        )}
        {filtered.map((n, i) => {
          const meta = NOTIF_CHANNEL_META[n.channel];
          const Icon = meta.icon;
          return (
            <div key={i} className="p-4 sm:p-5 flex items-start gap-3.5" style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `var(--${meta.tone}-soft)`, color: `var(--${meta.tone})` }}>
                <Icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{meta.label} · {n.audience}</span>
                  <Pill tone={n.status === "Read" ? "muted" : "success"}>{n.status}</Pill>
                </div>
                <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>{n.message}</p>
                <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{n.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Send Notification" subtitle="Send a one-off message on any enabled channel." onClose={() => setShowModal(false)}>
          <form onSubmit={handleSend}>
            <Field label="Channel">
              <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {enabledChannels.map((k) => <option key={k} value={k}>{NOTIF_CHANNEL_META[k].label}</option>)}
              </select>
            </Field>
            <Field label="Audience">
              <select value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {["All customers", "Frequent Buyers", "Lapsing customers", "Birthday this month", "Team"].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Message">
              <textarea rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Type your message…" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none" style={inputStyle()} />
            </Field>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Send now</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- AUTOMATIONS ---------------------------------- */

const DEFAULT_AUTOMATIONS = [
  { key: "welcome", title: "Welcome Automation", trigger: "When a new customer is added", enabled: true, message: "Hi {name}! Welcome to {business} — we're glad you're here. Enjoy 10% off your first order 🎉" },
  { key: "inactive", title: "Inactive Customer Comeback", trigger: "No activity for 30 days", enabled: true, message: "Hi {name}, we miss you at {business}! Come back this week and get 15% off your order." },
  { key: "birthday", title: "Birthday Offer", trigger: "On customer's birthday", enabled: true, message: "Happy Birthday {name}! 🎂 Enjoy a free treat on us at {business} today." },
  { key: "loyalty", title: "Loyalty Milestone Reward", trigger: "When a customer reaches their points goal", enabled: false, message: "Congrats {name}! You've hit a loyalty milestone at {business} — redeem your reward now." },
  { key: "review", title: "Review Request", trigger: "After a customer visit/interaction", enabled: true, message: "Thanks for visiting {business}, {name}! Could you leave us a quick review?" },
  { key: "referral", title: "Referral Reward", trigger: "After a successful referral", enabled: false, message: "Thanks for referring a friend to {business}, {name}! Your reward has been added." },
];

function AutomationsSection({ businessId, businessName }) {
  const [automations, setAutomations] = usePersistedState(bKey("mnft_automations", businessId), DEFAULT_AUTOMATIONS);
  const [editKey, setEditKey] = useState(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [toast, setToast] = useState(null);

  function toggle(key) {
    setAutomations((prev) => prev.map((a) => (a.key === key ? { ...a, enabled: !a.enabled } : a)));
  }

  function openEdit(a) {
    setEditKey(a.key);
    setDraftMessage(a.message);
  }

  function saveEdit() {
    setAutomations((prev) => prev.map((a) => (a.key === editKey ? { ...a, message: draftMessage } : a)));
    setEditKey(null);
    setToast("Automation updated");
    setTimeout(() => setToast(null), 3000);
  }

  const editing = automations.find((a) => a.key === editKey);

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Automated Marketing"
        title="Customer journeys that run themselves"
        subtitle="Set these up once — they trigger automatically as customers hit each milestone."
      />
      <Toast message={toast} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map((a) => (
          <div key={a.key} className="card p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="font-display text-base" style={{ color: "var(--text)" }}>{a.title}</div>
              <button onClick={() => toggle(a.key)} aria-label="Toggle automation">
                {a.enabled ? <ToggleRight size={26} style={{ color: "var(--success)" }} /> : <ToggleLeft size={26} style={{ color: "var(--muted)" }} />}
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>{a.trigger}</p>
            <div className="card-soft p-3 text-xs mb-3" style={{ color: "var(--text-dim)" }}>{a.message.replace("{name}", "Amara").replace("{business}", businessName)}</div>
            <div className="flex items-center justify-between">
              <Pill tone={a.enabled ? "success" : "muted"}>{a.enabled ? "Active" : "Paused"}</Pill>
              <button onClick={() => openEdit(a)} className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Edit message</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={`Edit: ${editing.title}`} subtitle="Use {name} and {business} as placeholders." onClose={() => setEditKey(null)}>
          <Field label="Message">
            <textarea rows={4} value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none" style={inputStyle()} />
          </Field>
          <button onClick={saveEdit} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Save message</button>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- DIGITAL MENU / QR LANDING PAGE ---------------------------------- */

function DigitalMenuSection({ businessId, businessName }) {
  const [menuUrl, setMenuUrl] = usePersistedState(bKey("mnft_menu_url", businessId), "");
  const [saved, setSaved] = useState(false);
  const origin = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "";
  const landingLink = `${origin}?menu=1&biz=${encodeURIComponent(businessId)}`;

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function copyLink() {
    if (navigator.clipboard) navigator.clipboard.writeText(landingLink).catch(() => {});
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Digital Menu / QR Landing Page"
        title="One QR code, everything your customer needs"
        subtitle="Not a POS — just a fast marketing page: your menu link, live offers, coupons, loyalty, reviews, referral and socials."
      />
      {saved && <Toast message="Saved" />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <Field label="Your menu link (PDF, Google Drive, or your website's menu page)">
            <input value={menuUrl} onChange={(e) => setMenuUrl(e.target.value)} placeholder="https://yourmenu.example.com" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
          </Field>
          <p className="text-[11px] mb-4" style={{ color: "var(--muted)" }}>
            This is a marketing landing page, not ordering/checkout — customers view your menu, offers, and can contact you or leave a review, all from one link.
          </p>
          <button onClick={handleSave} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold">Save</button>

          <div className="card-soft p-4 mt-5 flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-xs truncate" style={{ color: "var(--text)" }}>{landingLink}</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={copyLink} className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1"><Copy size={11}/>Copy</button>
              <a href={landingLink} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1"><ChevronRight size={11}/>Preview</a>
            </div>
          </div>
        </div>

        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-36 h-36 rounded-2xl grid grid-cols-5 grid-rows-5 gap-1 p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} style={{ background: [1,2,4,6,8,11,13,16,18,21,23].includes(i) ? "var(--text)" : "transparent", borderRadius: 2 }} />
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>Print this on table tents — scan to see {businessName}'s menu, offers & reviews.</p>
        </div>
      </div>
    </div>
  );
}

function PublicMenuPage({ businessId }) {
  const business = lsGet("mnft_businesses", DEFAULT_BUSINESSES).find((b) => b.id === businessId) || DEFAULT_BUSINESSES[0];
  const company = lsGet(bKey("mnft_company_info", businessId), sampleFor(businessId, DEFAULT_COMPANY_INFO, { name: business.name, type: "", phone: "", email: "" }));
  const menuUrl = lsGet(bKey("mnft_menu_url", businessId), "");
  const googleLink = lsGet(bKey("mnft_google_review_link", businessId), sampleFor(businessId, DEFAULT_GOOGLE_REVIEW_LINK, ""));
  const coupons = lsGet(bKey("mnft_coupons", businessId), sampleFor(businessId, [], []));
  const activeCoupons = coupons.filter((c) => c.status === "Active");
  const referralEnabled = lsGet("mnft_referral_enabled", true);

  return (
    <div className="mnft min-h-screen w-full flex items-center justify-center p-5" data-mode="dark">
      <style>{THEME_CSS}</style>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }}>
            <Store size={20} color="#fff" />
          </div>
          <div className="font-display text-lg" style={{ color: "var(--text)" }}>{company.name || business.name}</div>
        </div>

        <div className="space-y-3">
          {menuUrl && (
            <a href={menuUrl} target="_blank" rel="noreferrer" className="btn-primary w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
              <FileText size={16} /> View Menu
            </a>
          )}
          {activeCoupons.length > 0 && (
            <div className="card p-4">
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Live Offers</div>
              <div className="space-y-2">
                {activeCoupons.map((c, i) => (
                  <div key={i} className="card-soft p-3 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>{c.code}</span>
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>{c.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {googleLink && (
            <a href={googleLink} target="_blank" rel="noreferrer" className="btn-ghost w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
              <Star size={16} /> Leave a Google Review
            </a>
          )}
          {referralEnabled && (
            <div className="card-soft p-4 text-center">
              <Share2 size={16} className="mx-auto mb-1.5" style={{ color: "var(--gold)" }} />
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>Ask us about our referral rewards program!</p>
            </div>
          )}
          {company.phone && (
            <a href={waLink(company.phone, `Hi ${company.name}, `)} target="_blank" rel="noreferrer" className="btn-ghost w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
              <MessageCircle size={16} /> Message us on WhatsApp
            </a>
          )}
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: "var(--muted)" }}>
          {!menuUrl && !activeCoupons.length && !googleLink && "This business hasn't set up their digital menu page yet."}
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------- STAFF & PERMISSIONS ---------------------------------- */

const STAFF_ROLE_PERMISSIONS = {
  Manager: ["customers", "campaigns", "reports", "analytics", "coupons", "promotions"],
  "Marketing Staff": ["campaigns", "promotions", "coupons", "ai-marketing"],
  Staff: ["customers"],
};
const PERMISSION_MODULES = [
  { key: "customers", label: "Customers" },
  { key: "campaigns", label: "Campaigns" },
  { key: "promotions", label: "Promotions" },
  { key: "coupons", label: "Coupons" },
  { key: "ai-marketing", label: "AI Marketing" },
  { key: "reports", label: "Reports" },
  { key: "analytics", label: "Analytics" },
];

function StaffSection({ businessId }) {
  const [staff, setStaff] = usePersistedState(bKey("mnft_staff", businessId), []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", role: "Manager" });
  const [toast, setToast] = useState(null);

  function togglePermission(idx, moduleKey) {
    setStaff((prev) => prev.map((s, i) => {
      if (i !== idx) return s;
      const has = s.permissions.includes(moduleKey);
      return { ...s, permissions: has ? s.permissions.filter((p) => p !== moduleKey) : [...s.permissions, moduleKey] };
    }));
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setStaff((prev) => [...prev, { name: form.name.trim(), contact: form.contact.trim(), role: form.role, permissions: STAFF_ROLE_PERMISSIONS[form.role] || [] }]);
    setShowModal(false);
    setForm({ name: "", contact: "", role: "Manager" });
    setToast("Team member added");
    setTimeout(() => setToast(null), 3000);
  }

  function removeStaff(idx) {
    setStaff((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Staff & Permissions"
        title="Who's on your team, and what they can touch"
        subtitle="Record your team and their access level here."
        action={<button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><UserPlus size={15}/>Add Team Member</button>}
      />
      <Toast message={toast} />

      <div className="card-soft px-4 py-3 mb-4 flex items-start gap-2.5">
        <Shield size={13} className="mt-0.5 shrink-0" style={{ color: "var(--muted)" }} />
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
          This keeps a record of your team and what they're allowed to access. Giving each person their own secure login (so permissions are actually enforced) needs a real backend with proper authentication — that's the next step once this goes beyond a prototype.
        </p>
      </div>

      {!staff.length ? (
        <div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No team members added yet.</div>
      ) : (
        <div className="space-y-3">
          {staff.map((s, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{s.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{s.contact} · {s.role}</div>
                </div>
                <button onClick={() => removeStaff(i)} className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center"><Trash2 size={13} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_MODULES.map((m) => {
                  const active = s.permissions.includes(m.key);
                  return (
                    <button key={m.key} onClick={() => togglePermission(i, m.key)} className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: active ? "var(--accent-soft)" : "var(--surface-2)", color: active ? "var(--accent)" : "var(--muted)", border: `1px solid ${active ? "var(--accent)" : "var(--border)"}` }}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Team Member" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd}>
            <Field label="Name">
              <input autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="Phone or Email">
              <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="Role">
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {["Manager", "Marketing Staff", "Staff"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Add member</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- INTEGRATIONS ---------------------------------- */

const INTEGRATIONS = [
  { name: "AI (Claude)", icon: Bot, status: "Connected", desc: "Powers the AI Marketing Studio and AI Assistant — already live." },
  { name: "WhatsApp Business Platform", icon: MessageCircle, status: "Not connected", desc: "Official WhatsApp Business API needs Meta business verification + a backend to send messages at scale. Right now, WhatsApp actions open a pre-filled chat that a person sends manually." },
  { name: "Google Business Profile", icon: Star, status: "Not connected", desc: "Reading live review data automatically needs Google's official Business Profile API and OAuth setup. Right now you paste your review link manually." },
  { name: "SMS Gateway", icon: Smartphone, status: "Not connected", desc: "Needs a provider (e.g. Twilio, Termii) with an account and backend to actually deliver SMS." },
  { name: "Email Service", icon: Mail, status: "Not connected", desc: "Needs an email provider (e.g. SendGrid, Postmark) and backend to actually deliver email campaigns." },
  { name: "POS / Ordering System", icon: LayoutGrid, status: "Not applicable", desc: "This platform intentionally excludes POS, ordering, and payments. A future POS can connect here via API to feed sales data for loyalty and ROI." },
];

function IntegrationsSection() {
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Integrations"
        title="What's really connected, and what isn't"
        subtitle="Full honesty: some of these need a real backend and provider account before they can go live."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INTEGRATIONS.map((i) => {
          const Icon = i.icon;
          const tone = i.status === "Connected" ? "success" : i.status === "Not applicable" ? "muted" : "danger";
          return (
            <div key={i.name} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <Icon size={16} />
                </div>
                <Pill tone={tone}>{i.status}</Pill>
              </div>
              <div className="font-display text-base mb-1" style={{ color: "var(--text)" }}>{i.name}</div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{i.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- AUTHOR: PLATFORM OVERVIEW ---------------------------------- */

function PlatformSection({ businesses, businessId, onSwitchBusiness }) {
  const rows = businesses.map((b) => {
    const custCount = lsGet(bKey("mnft_customers", b.id), sampleFor(b.id, customers, [])).length;
    const campCount = lsGet(bKey("mnft_campaigns", b.id), sampleFor(b.id, campaignsList, [])).length;
    const coupCount = lsGet(bKey("mnft_coupons", b.id), sampleFor(b.id, coupons, [])).length;
    return { ...b, custCount, campCount, coupCount };
  });
  const totalCustomers = rows.reduce((s, r) => s + r.custCount, 0);
  const totalCampaigns = rows.reduce((s, r) => s + r.campCount, 0);

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Author Admin Panel"
        title="Every restaurant on this platform"
        subtitle="Platform-wide view — Author access only."
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Restaurants", value: businesses.length },
          { label: "Total Customers", value: totalCustomers.toLocaleString() },
          { label: "Total Campaigns", value: totalCampaigns },
          { label: "Active Restaurants", value: businesses.length },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <div className="font-display text-2xl">{s.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto mnft-scroll">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ color: "var(--muted)" }} className="text-left text-xs uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Restaurant</th>
                <th className="px-6 py-3 font-medium">Customers</th>
                <th className="px-6 py-3 font-medium">Campaigns</th>
                <th className="px-6 py-3 font-medium">Coupons</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="px-6 py-3.5 font-medium inline-flex items-center gap-2" style={{ color: "var(--text)" }}>
                    {r.name} {r.id === businessId && <Pill tone="accent">Active</Pill>}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{r.custCount}</td>
                  <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{r.campCount}</td>
                  <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{r.coupCount}</td>
                  <td className="px-6 py-3.5">
                    {r.id !== businessId && <button onClick={() => onSwitchBusiness(r.id)} className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold">Switch to this</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- AUTHOR: BACKUPS ---------------------------------- */

function BackupsSection() {
  const [history, setHistory] = usePersistedState("mnft_backup_history", []);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  function createBackup() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mnft_")) data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `mnft-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setHistory((prev) => [{ time: new Date().toLocaleString(), keys: Object.keys(data).length }, ...prev].slice(0, 20));
    setToast("Backup downloaded");
    setTimeout(() => setToast(null), 3000);
  }

  function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("Restoring will overwrite current data on this device with the backup file. Continue?")) {
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
        window.location.reload();
      } catch {
        setToast("Couldn't read that backup file");
        setTimeout(() => setToast(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Backup & Restore"
        title="Your data, downloadable anytime"
        subtitle="Since everything lives in this browser, a downloaded backup is your safety net if you clear browser data or switch devices."
      />
      <Toast message={toast} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card p-6">
          <Archive size={20} style={{ color: "var(--accent)" }} className="mb-3" />
          <div className="font-display text-base mb-1">Create Backup</div>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Downloads every restaurant's data as one JSON file.</p>
          <button onClick={createBackup} className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold">Download backup now</button>
        </div>
        <div className="card p-6">
          <Upload size={20} style={{ color: "var(--gold)" }} className="mb-3" />
          <div className="font-display text-base mb-1">Restore Backup</div>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Upload a previously downloaded backup file. This overwrites current data.</p>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleRestoreFile} />
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost w-full py-2.5 rounded-xl text-sm font-semibold">Choose backup file</button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-display text-lg">Backup History</h3>
        </div>
        {!history.length ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No backups created yet on this device.</div>
        ) : (
          <div>
            {history.map((h, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center justify-between text-xs" style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-dim)" }}>{h.time}</span>
                <span className="font-mono" style={{ color: "var(--muted)" }}>{h.keys} keys saved</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsSection() {
  function handleExportExcel(report) {
    const rows = buildReportRows(report.name);
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadTextFile(`${report.name.replace(/\s+/g, "-")}.csv`, csv, "text/csv");
  }

  function handleExportPdf(report) {
    const rows = buildReportRows(report.name);
    const text = [
      "MNFT GROWTH AI — " + report.name.toUpperCase(),
      "Period: " + report.period,
      "=".repeat(50),
      "",
      ...rows.map(([k, v]) => `${k.padEnd(28, " ")}: ${v}`),
      "",
      "Generated by MNFT Growth AI",
    ].join("\n");
    downloadTextFile(`${report.name.replace(/\s+/g, "-")}.txt`, text, "text/plain");
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Reports"
        title="Every report, ready to export"
        subtitle="Daily, weekly, and monthly summaries — download as a text summary or CSV."
      />
      <div className="card-soft px-4 py-3 mb-4">
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
          "PDF" downloads a formatted text summary and "Excel" downloads a real <span className="font-mono">.csv</span> file you can open in Excel/Sheets — both work fully offline, no server needed.
        </p>
      </div>
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.name} className="card p-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{r.name}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{r.period} · {r.size}</div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleExportPdf(r)} className="btn-ghost px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"><Download size={13}/>PDF</button>
              <button onClick={() => handleExportExcel(r)} className="btn-ghost px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"><Download size={13}/>Excel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_COMPANY_INFO = {
  name: "Riverside Café",
  type: "Café & Restaurant",
  phone: "+92 300 1234567",
  email: "hello@riversidecafe.com",
  logo: "",
};
const DEFAULT_BRANCHES = [
  { name: "Riverside Café — Lekki", hours: "7:00 AM – 10:00 PM" },
  { name: "Riverside Café — Ikeja", hours: "7:30 AM – 9:30 PM" },
  { name: "Riverside Café — Yaba", hours: "8:00 AM – 9:00 PM" },
];
const DEFAULT_NOTIFICATION_PREFS = { whatsapp: true, sms: false, email: true, push: true, inApp: true };

function SettingsSection({ referralEnabled, onToggleReferrals, isAuthor, businessId, businesses, onAddBusiness, onRemoveBusiness, onSwitchBusiness, onRenameBusiness }) {
  const emptyCompanyFor = (id, name) => ({ name: name || "New Business", type: "", phone: "", email: "", logo: "" });
  const [company, setCompany] = useState(() => lsGet(bKey("mnft_company_info", businessId), sampleFor(businessId, DEFAULT_COMPANY_INFO, emptyCompanyFor(businessId))));
  const [googleLink, setGoogleLink] = useState(() => lsGet(bKey("mnft_google_review_link", businessId), sampleFor(businessId, DEFAULT_GOOGLE_REVIEW_LINK, "")));
  const [branches, setBranches] = useState(() => lsGet(bKey("mnft_branches", businessId), sampleFor(businessId, DEFAULT_BRANCHES, [])));
  const [notifPrefs, setNotifPrefs] = useState(() => lsGet(bKey("mnft_notification_prefs", businessId), DEFAULT_NOTIFICATION_PREFS));
  const [newBranch, setNewBranch] = useState({ name: "", hours: "" });
  const [newBusinessName, setNewBusinessName] = useState("");
  const [saved, setSaved] = useState(false);
  const businessIdRef = useRef(businessId);

  // Reload every field when the Author switches to a different business, instead of bleeding one business's data into another.
  useEffect(() => {
    if (businessIdRef.current === businessId) return;
    businessIdRef.current = businessId;
    setCompany(lsGet(bKey("mnft_company_info", businessId), sampleFor(businessId, DEFAULT_COMPANY_INFO, emptyCompanyFor(businessId))));
    setGoogleLink(lsGet(bKey("mnft_google_review_link", businessId), sampleFor(businessId, DEFAULT_GOOGLE_REVIEW_LINK, "")));
    setBranches(lsGet(bKey("mnft_branches", businessId), sampleFor(businessId, DEFAULT_BRANCHES, [])));
    setNotifPrefs(lsGet(bKey("mnft_notification_prefs", businessId), DEFAULT_NOTIFICATION_PREFS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  function updateCompany(field, value) {
    setCompany((c) => ({ ...c, [field]: value }));
  }

  const logoInputRef = useRef(null);
  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("Please choose an image under 1MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateCompany("logo", reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function toggleNotif(channel) {
    setNotifPrefs((p) => ({ ...p, [channel]: !p[channel] }));
  }

  function addBranch() {
    if (!isAuthor || !newBranch.name.trim()) return;
    setBranches((prev) => [...prev, { name: newBranch.name.trim(), hours: newBranch.hours.trim() || "9:00 AM – 9:00 PM" }]);
    setNewBranch({ name: "", hours: "" });
  }

  function removeBranch(idx) {
    if (!isAuthor) return;
    setBranches((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    lsSet(bKey("mnft_company_info", businessId), company);
    lsSet(bKey("mnft_google_review_link", businessId), googleLink.trim() || DEFAULT_GOOGLE_REVIEW_LINK);
    lsSet(bKey("mnft_branches", businessId), branches);
    lsSet(bKey("mnft_notification_prefs", businessId), notifPrefs);
    if (onRenameBusiness && company.name.trim()) onRenameBusiness(businessId, company.name.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleAddBusiness() {
    if (!newBusinessName.trim()) return;
    onAddBusiness(newBusinessName.trim());
    setNewBusinessName("");
  }

  const fields = [
    { key: "name", label: "Business Name" },
    { key: "type", label: "Business Type" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ];
  const channels = [
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "sms", label: "SMS", icon: Smartphone },
    { key: "email", label: "Email", icon: Mail },
    { key: "push", label: "Push Notifications", icon: Bell },
    { key: "inApp", label: "In-App Notifications", icon: LayoutDashboard },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Business Profile"
        title="Everything customers see, in one place"
        subtitle="Branding, branches, hours, notifications, and social links — all saved to this device."
        action={<button onClick={handleSave} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold">Save Changes</button>}
      />

      {saved && <Toast message="Settings saved" />}

      {isAuthor && (
        <div className="card p-6 mb-5">
          <h3 className="font-display text-lg mb-1 inline-flex items-center gap-2">
            Restaurants / Businesses
            <Pill tone="gold"><Crown size={10}/>Author only</Pill>
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Add as many separate restaurants as you manage — each gets its own customers, campaigns, coupons, branches and reviews.
          </p>
          <div className="space-y-2 mb-3">
            {businesses.map((b) => (
              <div key={b.id} className="card-soft p-3.5 flex items-center justify-between flex-wrap gap-2" style={{ borderColor: b.id === businessId ? "var(--accent)" : "var(--border)" }}>
                <span className="text-sm inline-flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Store size={13} style={{ color: "var(--accent)" }} />{b.name}
                  {b.id === businessId && <Pill tone="accent">Active</Pill>}
                </span>
                <div className="flex items-center gap-2">
                  {b.id !== businessId && (
                    <button onClick={() => onSwitchBusiness(b.id)} className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold">Switch to this</button>
                  )}
                  {businesses.length > 1 && (
                    <button onClick={() => onRemoveBusiness(b.id)} className="btn-ghost w-7 h-7 rounded-lg flex items-center justify-center" aria-label={`Remove ${b.name}`}><X size={12} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input value={newBusinessName} onChange={(e) => setNewBusinessName(e.target.value)} placeholder="New restaurant / business name" className="flex-1 min-w-[180px] px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle()} />
            <button onClick={handleAddBusiness} className="btn-primary px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1"><Plus size={12}/>Add business</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden" style={{ background: company.logo ? "var(--surface-2)" : "linear-gradient(135deg, var(--accent), var(--gold))" }}>
            {company.logo ? <img src={company.logo} alt="Logo" className="w-full h-full object-cover" /> : <Store size={28} color="#fff" />}
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <div className="flex gap-2">
            <button onClick={() => logoInputRef.current?.click()} className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold">Upload Logo</button>
            {company.logo && <button onClick={() => updateCompany("logo", "")} className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ color: "var(--danger)" }}>Remove</button>}
          </div>
          <p className="text-[10px] mt-2" style={{ color: "var(--muted)" }}>Shows on AI-generated posters automatically.</p>
          <div className="w-full mt-6 space-y-3 text-left">
            {["Instagram", "Facebook", "TikTok", "WhatsApp"].map((s) => (
              <div key={s} className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--muted)" }}>{s}</span>
                <span className="font-mono" style={{ color: "var(--text)" }}>@riversidecafe</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-lg mb-4">Company Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{f.label}</label>
                <input value={company[f.key]} onChange={(e) => updateCompany(f.key, e.target.value)} className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-wide inline-flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
              <MapPin size={12} /> Google Maps Review Link
            </label>
            <input
              value={googleLink}
              onChange={(e) => setGoogleLink(e.target.value)}
              placeholder="https://g.page/r/your-business/review"
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl text-sm outline-none font-mono"
              style={inputStyle()}
            />
            <p className="text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>
              Get this from your Google Business Profile → "Ask for reviews". Every review request (QR code and WhatsApp) sends customers here in one tap.
            </p>
          </div>

          <h3 className="font-display text-lg mt-6 mb-3 inline-flex items-center gap-2">
            Branches
            {!isAuthor && <Pill tone="muted"><Lock size={10}/>Author only</Pill>}
          </h3>
          <div className="space-y-2.5 mb-3">
            {branches.map((b, i) => (
              <div key={i} className="card-soft p-3.5 flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm inline-flex items-center gap-2" style={{ color: "var(--text)" }}><MapPin size={13} style={{ color: "var(--accent)" }}/>{b.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{b.hours}</span>
                  {isAuthor && (
                    <button onClick={() => removeBranch(i)} className="btn-ghost w-7 h-7 rounded-lg flex items-center justify-center" aria-label="Remove branch"><X size={12} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isAuthor ? (
            <div className="flex flex-wrap gap-2">
              <input value={newBranch.name} onChange={(e) => setNewBranch((n) => ({ ...n, name: e.target.value }))} placeholder="New branch name" className="flex-1 min-w-[140px] px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle()} />
              <input value={newBranch.hours} onChange={(e) => setNewBranch((n) => ({ ...n, hours: e.target.value }))} placeholder="Hours e.g. 8am–9pm" className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle()} />
              <button onClick={addBranch} className="btn-ghost px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1"><Plus size={12}/>Add branch</button>
            </div>
          ) : (
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              Only the Author (full-control access) can add or remove branches. Contact them if you need a branch changed.
            </p>
          )}

          <h3 className="font-display text-lg mt-6 mb-3">Notification Channels</h3>
          <div className="space-y-2">
            {channels.map((c) => {
              const Icon = c.icon;
              const on = notifPrefs[c.key];
              return (
                <div key={c.key} className="card-soft p-3.5 flex items-center justify-between">
                  <span className="text-sm inline-flex items-center gap-2.5" style={{ color: "var(--text)" }}>
                    <Icon size={14} style={{ color: "var(--muted)" }} /> {c.label}
                  </span>
                  <button
                    onClick={() => toggleNotif(c.key)}
                    className="shrink-0 w-11 h-6 rounded-full relative transition-colors"
                    style={{ background: on ? "var(--accent)" : "var(--surface-3)" }}
                    aria-label={`Toggle ${c.label}`}
                  >
                    <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: on ? 21 : 4 }} />
                  </button>
                </div>
              );
            })}
          </div>

          <h3 className="font-display text-lg mt-6 mb-3">Optional Features</h3>
          <div className="card-soft p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium inline-flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Share2 size={14} style={{ color: "var(--accent)" }} /> Referral Program
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Let customers refer friends for rewards. Turn off if you don't want to run this.
              </p>
            </div>
            <button
              onClick={() => onToggleReferrals(!referralEnabled)}
              className="shrink-0 w-12 h-7 rounded-full relative transition-colors"
              style={{ background: referralEnabled ? "var(--accent)" : "var(--surface-3)" }}
              aria-label="Toggle referral program"
            >
              <span
                className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
                style={{ left: referralEnabled ? 24 : 4 }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- AUTH ---------------------------------- */

/* ---------------------------------- PUBLIC REVIEW PAGE ---------------------------------- */
/* Opened straight from the WhatsApp "request a review" link — no login needed. */

function PublicReviewPage({ customerName, businessId }) {
  const [mode, setMode] = useState(null); // null | "public" | "private"
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const googleLink = lsGet(bKey("mnft_google_review_link", businessId), sampleFor(businessId, DEFAULT_GOOGLE_REVIEW_LINK, ""));
  const business = lsGet("mnft_businesses", DEFAULT_BUSINESSES).find((b) => b.id === businessId) || DEFAULT_BUSINESSES[0];

  function handleSubmitPublic(e) {
    e.preventDefault();
    const entry = {
      name: customerName || "Guest",
      rating,
      text: text.trim() || "(no written comment)",
      time: "Just now",
      flagged: rating <= 3,
    };
    const existing = lsGet(bKey("mnft_reviews", businessId), []);
    lsSet(bKey("mnft_reviews", businessId), [entry, ...existing]);
    setSubmitted(true);
  }

  function handleSubmitPrivate(e) {
    e.preventDefault();
    const entry = {
      name: customerName || "Guest",
      contact: contact.trim(),
      text: text.trim(),
      time: "Just now",
    };
    const existing = lsGet(bKey("mnft_private_feedback", businessId), []);
    lsSet(bKey("mnft_private_feedback", businessId), [entry, ...existing]);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mnft min-h-screen w-full flex items-center justify-center p-5" data-mode="dark">
        <style>{THEME_CSS}</style>
        <div className="card w-full max-w-md p-7 text-center fade-in">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
            <CheckCircle2 size={26} />
          </div>
          <h2 className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>Thank you{customerName ? `, ${customerName}` : ""}!</h2>
          {mode === "public" ? (
            <>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Your review has been saved. One more tap and it's also live on Google — this really helps us out. 🙏</p>
              {rating >= 4 ? (
                <a href={googleLink} target="_blank" rel="noreferrer" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2">
                  <Star size={15} /> Post this on Google too
                </a>
              ) : (
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>Thanks for the honest feedback — the team will follow up with you directly.</p>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Your feedback was sent privately to the team only — it won't be posted publicly. Someone will follow up with you soon.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mnft min-h-screen w-full flex items-center justify-center p-5" data-mode="dark">
      <style>{THEME_CSS}</style>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <div className="leading-tight text-center">
            <div className="font-display text-lg" style={{ color: "var(--text)" }}>{business.name}</div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted)" }}>We'd love your feedback</div>
          </div>
        </div>

        {!mode && (
          <div className="card p-7 fade-in">
            <h2 className="font-display text-xl mb-1" style={{ color: "var(--text)" }}>
              {customerName ? `Hi ${customerName}, how was it?` : "How was your visit?"}
            </h2>
            <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Choose how you'd like to share your feedback.</p>
            <button onClick={() => setMode("public")} className="btn-primary w-full py-3.5 rounded-xl text-sm font-semibold mb-3 inline-flex items-center justify-center gap-2">
              <Star size={15} /> Leave a public review
            </button>
            <button onClick={() => setMode("private")} className="btn-ghost w-full py-3.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2">
              <MessageCircleWarning size={15} /> I had a problem — share privately
            </button>
            <p className="text-[10px] text-center mt-4" style={{ color: "var(--muted)" }}>Private feedback goes only to the team — it's never posted publicly.</p>
          </div>
        )}

        {mode === "public" && (
          <div className="card p-7 fade-in">
            <button onClick={() => setMode(null)} className="text-xs font-semibold mb-4 inline-flex items-center gap-1" style={{ color: "var(--muted)" }}>&larr; Back</button>
            <form onSubmit={handleSubmitPublic}>
              <div className="flex justify-center gap-1.5 mb-5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)} aria-label={`${n} star`}>
                    <Star size={32} fill={n <= (hoverRating || rating) ? "var(--gold)" : "none"} color="var(--gold)" />
                  </button>
                ))}
              </div>
              <Field label="Tell us more (optional)">
                <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you enjoy? Anything we could do better?" className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle()} />
              </Field>
              <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Submit review</button>
            </form>
          </div>
        )}

        {mode === "private" && (
          <div className="card p-7 fade-in">
            <button onClick={() => setMode(null)} className="text-xs font-semibold mb-4 inline-flex items-center gap-1" style={{ color: "var(--muted)" }}>&larr; Back</button>
            <form onSubmit={handleSubmitPrivate}>
              <Field label="What happened?">
                <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell us what went wrong — this stays private." className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle()} />
              </Field>
              <Field label="Phone or email (optional, so we can follow up)">
                <input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
              </Field>
              <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Send privately</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | register (owner only — author never registers)
  const [role, setRole] = useState("owner"); // admin(author) | owner
  const [form, setForm] = useState({ name: "", email: "", password: "", key: "", authorPassword: "" });
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showAuthorPw, setShowAuthorPw] = useState(false);
  const isAuthor = role === "admin";
  const keyRequired = mode === "register" && role === "owner";

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (error) setError("");
  }

  function selectRole(r) {
    setRole(r);
    setError("");
    if (r === "admin") setMode("login"); // author never has a register mode
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (isAuthor) {
      if (!form.authorPassword) {
        setError("Enter the author password.");
        return;
      }
      if (form.authorPassword !== AUTHOR_MASTER_PASSWORD) {
        setError("Incorrect password. Full control is restricted to whoever holds this password.");
        return;
      }
      onAuth({ role: "admin", name: "Author", email: "" });
      return;
    }

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    if (mode === "register") {
      if (!form.name) { setError("Please enter your name."); return; }
      if (form.key.trim().toUpperCase() !== REGISTRATION_KEY) {
        setError("Invalid registration key. Ask your platform admin for the correct key.");
        return;
      }
    }
    onAuth({ role: "owner", name: form.name || "Business Owner", email: form.email });
  }

  return (
    <div className="mnft min-h-screen w-full flex items-center justify-center p-5" data-mode="dark">
      <style>{THEME_CSS}</style>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <div className="leading-tight text-center">
            <div className="font-display text-lg" style={{ color: "var(--text)" }}>MNFT Growth AI</div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted)" }}>Business Promotion Platform</div>
          </div>
        </div>

        <div className="card p-7 fade-in">
          {/* role tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {ROLES.map((r) => {
              const Icon = r.key === "admin" ? Crown : Store;
              const active = role === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => selectRole(r.key)}
                  className="text-left p-3.5 rounded-xl"
                  style={{
                    background: active ? "var(--accent-soft)" : "var(--surface-2)",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  <Icon size={16} style={{ color: active ? "var(--accent)" : "var(--muted)" }} />
                  <div className="text-sm font-semibold mt-2" style={{ color: active ? "var(--accent)" : "var(--text)" }}>{r.label}</div>
                  <div className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--muted)" }}>{r.desc}</div>
                </button>
              );
            })}
          </div>

          {isAuthor ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="card-soft p-3.5 flex items-start gap-2.5 mb-1">
                <Lock size={14} className="mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
                  No sign-up here. Whoever enters the correct password gets full control — no email, no account needed.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Author Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showAuthorPw ? "text" : "password"}
                    value={form.authorPassword}
                    onChange={(e) => update("authorPassword", e.target.value)}
                    placeholder="••••••••••••"
                    autoFocus
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthorPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted)" }}
                    aria-label="Toggle password visibility"
                  >
                    {showAuthorPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-3.5 py-2.5 rounded-xl text-xs" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2 inline-flex items-center justify-center gap-2">
                <Lock size={14} /> Unlock full control
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-1 mb-6 p-1 rounded-xl" style={{ background: "var(--surface-2)" }}>
                {["login", "register"].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(""); }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize"
                    style={{
                      background: mode === m ? "var(--surface)" : "transparent",
                      color: mode === m ? "var(--text)" : "var(--muted)",
                      boxShadow: mode === m ? "var(--shadow)" : "none",
                    }}
                  >
                    {m === "login" ? "Sign In" : "Register"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === "register" && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Business Owner Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Amara Okafor"
                      className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="owner@yourbusiness.com"
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="••••••••"
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
                {keyRequired && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Registration Key</label>
                    <div className="relative mt-1.5">
                      <input
                        type={showKey ? "text" : "password"}
                        value={form.key}
                        onChange={(e) => update("key", e.target.value)}
                        placeholder="Enter your registration key"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm outline-none font-mono tracking-wider"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--muted)" }}
                        aria-label="Toggle key visibility"
                      >
                        {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>
                      Provided by your platform admin — required to activate a new Business Owner account.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="px-3.5 py-2.5 rounded-xl text-xs" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">
                  {mode === "login" ? "Sign in as Business Owner" : "Create account"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: "var(--muted)" }}>
          Super Admin, Branch Manager, Marketing Manager & Staff roles are managed from inside the platform after sign-in.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------- APP ---------------------------------- */

export default function App() {
  const [session, setSession] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [mode, setMode] = useState("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [referralEnabled, setReferralEnabled] = useState(() => lsGet("mnft_referral_enabled", true));
  const [businesses, setBusinesses] = useState(() => lsGet("mnft_businesses", DEFAULT_BUSINESSES));
  const [businessId, setBusinessId] = useState(() => lsGet("mnft_active_business_id", DEFAULT_BUSINESSES[0].id));

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  // Anyone opening the "request a review" WhatsApp link lands here directly — no login needed.
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  if (params && params.has("review")) {
    return <PublicReviewPage customerName={params.get("name") || ""} businessId={params.get("biz") || DEFAULT_BUSINESSES[0].id} />;
  }
  if (params && params.has("menu")) {
    return <PublicMenuPage businessId={params.get("biz") || DEFAULT_BUSINESSES[0].id} />;
  }

  if (!session) {
    return <AuthScreen onAuth={(s) => setSession(s)} />;
  }

  function toggleReferrals(next) {
    setReferralEnabled(next);
    lsSet("mnft_referral_enabled", next);
    if (!next && active === "referrals") setActive("dashboard");
  }

  function switchBusiness(id) {
    setBusinessId(id);
    lsSet("mnft_active_business_id", id);
  }

  function addBusiness(name) {
    const id = slugify(name, businesses.map((b) => b.id));
    const next = [...businesses, { id, name }];
    setBusinesses(next);
    lsSet("mnft_businesses", next);
    // Seed this business's own profile AND every data list as genuinely empty —
    // otherwise components would silently fall back to Riverside Café's sample data.
    lsSet(bKey("mnft_company_info", id), { name, type: "Restaurant", phone: "", email: "" });
    lsSet(bKey("mnft_branches", id), []);
    lsSet(bKey("mnft_customers", id), []);
    lsSet(bKey("mnft_coupons", id), []);
    lsSet(bKey("mnft_campaigns", id), []);
    lsSet(bKey("mnft_promo_active_counts", id), Object.fromEntries(PROMO_TYPES_BASE.map((t) => [t.name, 0])));
    lsSet(bKey("mnft_referral_leaders", id), []);
    lsSet(bKey("mnft_reviews", id), []);
    lsSet(bKey("mnft_notification_log", id), []);
    lsSet(bKey("mnft_notification_prefs", id), DEFAULT_NOTIFICATION_PREFS);
    lsSet(bKey("mnft_google_review_link", id), "");
    lsSet(bKey("mnft_assistant_thread", id), [
      { from: "ai", text: `Hi! I'm your growth assistant for ${name}. Ask me anything about your customers, campaigns, or numbers, or ask me to draft a promotion.` },
    ]);
    switchBusiness(id);
  }

  function removeBusiness(id) {
    if (businesses.length <= 1) return;
    const next = businesses.filter((b) => b.id !== id);
    setBusinesses(next);
    lsSet("mnft_businesses", next);
    if (id === businessId) switchBusiness(next[0].id);
  }

  function renameBusiness(id, name) {
    setBusinesses((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, name } : b));
      lsSet("mnft_businesses", next);
      return next;
    });
  }

  const isAuthor = session.role === "admin";
  const visibleNav = NAV.filter((n) => (n.key !== "referrals" || referralEnabled) && (!n.authorOnly || isAuthor));
  const activeBusiness = businesses.find((b) => b.id === businessId) || businesses[0];

  const sections = {
    dashboard: <DashboardSection onNewCampaign={() => setActive("campaigns")} businessName={activeBusiness.name} businessId={businessId} />,
    "ai-marketing": <AiMarketingSection businessName={activeBusiness.name} businessId={businessId} />,
    campaigns: <CampaignsSection businessId={businessId} />,
    automations: <AutomationsSection businessId={businessId} businessName={activeBusiness.name} />,
    customers: <CustomersSection businessId={businessId} businessName={activeBusiness.name} />,
    promotions: <PromotionsSection businessId={businessId} />,
    coupons: <CouponsSection businessId={businessId} />,
    reviews: <ReviewsSection businessId={businessId} businessName={activeBusiness.name} />,
    referrals: <ReferralsSection businessId={businessId} />,
    "digital-menu": <DigitalMenuSection businessId={businessId} businessName={activeBusiness.name} />,
    analytics: <AnalyticsSection businessId={businessId} businessName={activeBusiness.name} />,
    assistant: <AssistantSection businessId={businessId} businessName={activeBusiness.name} />,
    notifications: <NotificationsSection businessId={businessId} />,
    reports: <ReportsSection />,
    staff: <StaffSection businessId={businessId} />,
    integrations: <IntegrationsSection />,
    settings: (
      <SettingsSection
        referralEnabled={referralEnabled}
        onToggleReferrals={toggleReferrals}
        isAuthor={isAuthor}
        businessId={businessId}
        businesses={businesses}
        onAddBusiness={addBusiness}
        onRemoveBusiness={removeBusiness}
        onSwitchBusiness={switchBusiness}
        onRenameBusiness={renameBusiness}
      />
    ),
    platform: <PlatformSection businesses={businesses} businessId={businessId} onSwitchBusiness={switchBusiness} />,
    backups: <BackupsSection />,
  };

  const activeLabel = NAV.find((n) => n.key === active)?.label || "Dashboard";

  return (
    <div className="mnft min-h-screen w-full flex" data-mode={mode}>
      <style>{THEME_CSS}</style>
      <Sidebar
        active={active}
        setActive={setActive}
        collapsed={collapsed}
        session={session}
        navItems={visibleNav}
        businesses={businesses}
        businessId={businessId}
        businessName={activeBusiness.name}
        onSwitchBusiness={switchBusiness}
      />

      {/* mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
          <div className="absolute left-0 top-0 h-full w-64 p-4" style={{ background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-lg">Menu</span>
              <button onClick={() => setMobileNavOpen(false)}><X size={18} /></button>
            </div>
            <nav className="space-y-1">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setActive(item.key); setMobileNavOpen(false); }}
                    className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? "active" : ""}`}
                    style={{ color: isActive ? "var(--accent)" : "var(--text-dim)" }}
                  >
                    <Icon size={17} /> {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="md:hidden flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <button onClick={() => setMobileNavOpen(true)} className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center">
            <LayoutDashboard size={16} />
          </button>
          <span className="font-display text-sm">{activeLabel}</span>
          <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center">
            {mode === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        <Topbar title={activeLabel} mode={mode} setMode={setMode} collapsed={collapsed} setCollapsed={setCollapsed} session={session} onLogout={() => setSession(null)} />
        <main className="px-5 md:px-8 py-6 md:py-8 max-w-[1400px]">
          {sections[active]}
        </main>
      </div>
    </div>
  );
}
