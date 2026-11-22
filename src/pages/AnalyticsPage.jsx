import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  CartesianGrid, Legend
} from 'recharts';
import { ArrowLeft, TrendingUp, ShoppingCart, Award, Flame, Crown, Star, Zap, Target, Package } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useCatalog } from '../hooks/useCatalog';
import { useAuth } from '../context/AuthContext';
import { useFamilyMembers } from '../hooks/useFamilyMembers';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import ProductThumb from '../components/ProductThumb';

/* ─── Color palette ─── */
const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];
const GRADIENT_CARDS = [
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-cyan-600',
  'from-fuchsia-500 to-pink-600',
];

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, subtitle, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-default`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon size={20} />
        </div>
        <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-black">{value}</div>
      {subtitle && <div className="text-sm text-white/70 mt-1">{subtitle}</div>}
    </motion.div>
  );
}

/* ─── Chart Card wrapper ─── */
function ChartCard({ title, emoji, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span> {title}
      </h3>
      {children}
    </motion.div>
  );
}

/* ─── Achievement Badge ─── */
function AchievementBadge({ icon, title, description, unlocked, color }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
      unlocked
        ? `${color} border-current shadow-sm`
        : 'bg-gray-50 border-gray-200 opacity-50 grayscale'
    }`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      {unlocked && <Star size={16} className="ml-auto text-yellow-500 fill-yellow-500" />}
    </div>
  );
}

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-gray-900 text-white px-4 py-2 rounded-xl shadow-xl text-sm font-semibold">
      <div className="text-gray-300 text-xs mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { allOrders, loading: analyticsLoading, userRole } = useAnalytics();
  const { catalog } = useCatalog();
  const { userFamilyId } = useAuth();
  const { members, loading: membersLoading } = useFamilyMembers(userFamilyId);
  const [selectedHukum, setSelectedHukum] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showFilter = userRole === 'Admin' || userRole === 'Sethji';

  const loading = analyticsLoading || (showFilter && membersLoading);

  const combinedHukumNames = useMemo(() => {
    const names = new Set();
    members.forEach(m => {
      // Only include members with the 'Hukum' role
      if (m.role === 'Hukum' && (m.name || m.displayName)) {
        names.add(m.name || m.displayName);
      }
    });
    // Add names from orders just in case a Hukum was deleted but their order remains
    // (We assume anyone who created an order and isn't in members as a non-Hukum is safe to add)
    allOrders.forEach(o => {
      if (o.createdByName) {
        const memberMatch = members.find(m => (m.name === o.createdByName || m.displayName === o.createdByName));
        if (!memberMatch || memberMatch.role === 'Hukum') {
          names.add(o.createdByName);
        }
      }
    });
    return ['All', ...Array.from(names).sort()];
  }, [members, allOrders]);

  // Build a lookup: item name → imageURL (from catalog or order items)
  const imageMap = useMemo(() => {
    const map = {};
    catalog.forEach(c => { if (c.imageURL) map[c.name] = c.imageURL; });
    // Also scan order items for imageURL in case catalog changed
    allOrders.forEach(o => (o.items || []).forEach(i => {
      if (i.imageURL && !map[i.name]) map[i.name] = i.imageURL;
    }));
    return map;
  }, [catalog, allOrders]);

  // Build a lookup: item name → category (from catalog)
  const catalogCategoryMap = useMemo(() => {
    const map = {};
    catalog.forEach(c => { if (c.category) map[c.name] = c.category; });
    return map;
  }, [catalog]);

  // Filter orders by selected Hukum
  const orders = useMemo(() => {
    if (selectedHukum === 'All') return allOrders;
    return allOrders.filter(o => o.createdByName === selectedHukum);
  }, [allOrders, selectedHukum]);

  // ── Compute all metrics ──
  const metrics = useMemo(() => {
    if (!orders.length) return null;

    const totalOrders = orders.length;
    const allItems = orders.flatMap(o => o.items || []);
    // Count frequency (times picked), NOT raw qty — because qty units differ (grams, kg, pieces)
    const totalItems = allItems.length;
    const uniqueBatchesGlobal = new Set();
    let totalSpent = 0;
    orders.forEach(o => {
      if (o.batchId) {
        if (!uniqueBatchesGlobal.has(o.batchId)) {
          uniqueBatchesGlobal.add(o.batchId);
          totalSpent += Number(o.totalExpense || 0);
        }
      } else {
        totalSpent += Number(o.totalExpense || 0);
      }
    });
    const uniqueItems = new Set(allItems.map(i => i.name)).size;

    // ── Item frequency (how many times ordered, not qty sum) ──
    const freqMap = {};
    allItems.forEach(i => {
      const name = i.name || 'Unknown';
      freqMap[name] = (freqMap[name] || 0) + 1;
    });
    const sortedItems = Object.entries(freqMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const top10 = sortedItems.slice(0, 10);
    const favoriteItem = sortedItems[0] || null;

    // ── Category breakdown (look up category from catalog) ──
    const catMap = {};
    allItems.forEach(i => {
      const cat = i.category || catalogCategoryMap[i.name] || 'Others';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const categoryData = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ── Item status breakdown (found vs not_found) ──
    let found = 0, notFound = 0, pending = 0;
    allItems.forEach(i => {
      if (i.status === 'found') found++;
      else if (i.status === 'not_found') notFound++;
      else pending++;
    });
    const fulfillmentRate = allItems.length > 0
      ? Math.round((found / allItems.length) * 100)
      : 0;
    const statusData = [
      { name: 'Found', value: found },
      { name: 'Not Found', value: notFound },
      { name: 'Pending', value: pending },
    ].filter(d => d.value > 0);

    // ── Monthly order trend ──
    const monthMap = {};
    orders.forEach(o => {
      const d = o.createdAt?.toDate?.() || (o.orderDate ? new Date(o.orderDate) : new Date());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { month: key, orders: 0, items: 0, spent: 0, _batches: new Set() };
      monthMap[key].orders++;
      monthMap[key].items += (o.items || []).length;
      if (o.batchId) {
        if (!monthMap[key]._batches.has(o.batchId)) {
          monthMap[key]._batches.add(o.batchId);
          monthMap[key].spent += Number(o.totalExpense || 0);
        }
      } else {
        monthMap[key].spent += Number(o.totalExpense || 0);
      }
    });
    const monthlyTrend = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // ── Daily spend trend ──
    const dailyMap = {};
    orders.forEach(o => {
      const d = o.createdAt?.toDate?.() || (o.orderDate ? new Date(o.orderDate) : new Date());
      // format: 'MM/DD' for display
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      // Sort key
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dailyMap[sortKey]) dailyMap[sortKey] = { date: key, sortKey: sortKey, spent: 0, orders: 0, _batches: new Set() };
      if (o.batchId) {
        if (!dailyMap[sortKey]._batches.has(o.batchId)) {
          dailyMap[sortKey]._batches.add(o.batchId);
          dailyMap[sortKey].spent += Number(o.totalExpense || 0);
        }
      } else {
        dailyMap[sortKey].spent += Number(o.totalExpense || 0);
      }
      dailyMap[sortKey].orders++;
    });
    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // ── Weekly pattern (day of week) ──
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMap = dayNames.map(d => ({ day: d, count: 0 }));
    orders.forEach(o => {
      const d = o.createdAt?.toDate?.() || (o.orderDate ? new Date(o.orderDate) : new Date());
      dayMap[d.getDay()].count++;
    });

    // ── Per-Hukum breakdown (for Admin/Sethji) ──
    const hukumMap = {};
    orders.forEach(o => {
      const name = o.createdByName || 'Unknown';
      if (!hukumMap[name]) hukumMap[name] = { name, orders: 0, items: 0, spent: 0, _batches: new Set() };
      hukumMap[name].orders++;
      hukumMap[name].items += (o.items || []).length;
      if (o.batchId) {
        if (!hukumMap[name]._batches.has(o.batchId)) {
          hukumMap[name]._batches.add(o.batchId);
          hukumMap[name].spent += Number(o.totalExpense || 0);
        }
      } else {
        hukumMap[name].spent += Number(o.totalExpense || 0);
      }
    });
    const hukumBreakdown = Object.values(hukumMap).sort((a, b) => b.orders - a.orders);

    // ── Average items per order ──
    const avgItems = totalOrders > 0 ? Math.round((totalItems / totalOrders) * 10) / 10 : 0;
    
    const effectiveOrderCount = uniqueBatchesGlobal.size > 0 ? uniqueBatchesGlobal.size : totalOrders;
    const avgSpend = effectiveOrderCount > 0 ? Math.round(totalSpent / effectiveOrderCount) : 0;


    // ── Biggest single order (by number of distinct items) ──
    const biggestOrder = orders.reduce((max, o) => {
      const count = (o.items || []).length;
      return count > max.count ? { count, name: o.createdByName } : max;
    }, { count: 0, name: '' });

    // ── Radar data for variety score (look up category from catalog) ──
    const categories = ['Vegetables', 'Fruits', 'Packaged', 'Cosmetics', 'Others'];
    const radarData = categories.map(cat => {
      const count = allItems.filter(i => {
        const itemCat = i.category || catalogCategoryMap[i.name] || 'Others';
        return itemCat === cat;
      }).length;
      return { category: cat, count };
    });

    // ── Streak (consecutive order dates) ──
    const orderDates = [...new Set(orders.map(o => {
      const d = o.createdAt?.toDate?.() || (o.orderDate ? new Date(o.orderDate) : new Date());
      return d.toISOString().split('T')[0];
    }))].sort();
    let streak = 1, maxStreak = 1;
    for (let i = 1; i < orderDates.length; i++) {
      const diff = (new Date(orderDates[i]) - new Date(orderDates[i - 1])) / (1000 * 60 * 60 * 24);
      if (diff <= 7) { streak++; maxStreak = Math.max(maxStreak, streak); }
      else streak = 1;
    }

    return {
      totalOrders, totalItems, totalSpent, uniqueItems, top10, favoriteItem,
      categoryData, statusData, fulfillmentRate, monthlyTrend, dailyTrend, dayMap,
      hukumBreakdown, avgItems, avgSpend, biggestOrder, radarData,
      maxStreak: orderDates.length > 0 ? maxStreak : 0,
    };
  }, [orders, catalogCategoryMap]);

  // ── Achievements ──
  const achievements = useMemo(() => {
    if (!metrics) return [];

    if (selectedHukum === 'All') {
      return [
        { icon: '👨‍👩‍👧‍👦', title: 'Family First', description: 'First family order placed', unlocked: metrics.totalOrders >= 1, color: 'bg-blue-50 text-blue-600' },
        { icon: '🤝', title: 'Teamwork', description: '2+ members placed orders', unlocked: metrics.hukumBreakdown.length >= 2, color: 'bg-teal-50 text-teal-600' },
        { icon: '🚀', title: 'Power Family', description: 'Complete 20 family orders', unlocked: metrics.totalOrders >= 20, color: 'bg-orange-50 text-orange-600' },
        { icon: '🌟', title: 'Grand Century', description: 'Order 500 items total', unlocked: metrics.totalItems >= 500, color: 'bg-purple-50 text-purple-600' },
        { icon: '🎨', title: 'Diverse Tastes', description: 'Order 50+ unique items', unlocked: metrics.uniqueItems >= 50, color: 'bg-pink-50 text-pink-600' },
        { icon: '⚡', title: 'Family Streak', description: '8-week ordering streak', unlocked: metrics.maxStreak >= 8, color: 'bg-yellow-50 text-yellow-600' },
        { icon: '💎', title: 'High Rollers', description: 'Spend ₹20,000+ total', unlocked: metrics.totalSpent >= 20000, color: 'bg-amber-50 text-amber-600' },
        { icon: '🛒', title: 'Mega Feast', description: '40+ items in one order', unlocked: metrics.biggestOrder.count >= 40, color: 'bg-indigo-50 text-indigo-600' },
      ];
    }

    return [
      { icon: '🛒', title: 'First Order', description: 'Place your first order', unlocked: metrics.totalOrders >= 1, color: 'bg-blue-50 text-blue-600' },
      { icon: '🔥', title: '5 Orders Club', description: 'Complete 5 orders', unlocked: metrics.totalOrders >= 5, color: 'bg-orange-50 text-orange-600' },
      { icon: '💯', title: 'Century', description: 'Order 100 items total', unlocked: metrics.totalItems >= 100, color: 'bg-purple-50 text-purple-600' },
      { icon: '🌈', title: 'Variety King', description: 'Order 15+ unique items', unlocked: metrics.uniqueItems >= 15, color: 'bg-pink-50 text-pink-600' },
      { icon: '🎯', title: 'Sharp Shopper', description: '80%+ fulfillment rate', unlocked: metrics.fulfillmentRate >= 80, color: 'bg-green-50 text-green-600' },
      { icon: '⚡', title: 'Streak Master', description: '4-week ordering streak', unlocked: metrics.maxStreak >= 4, color: 'bg-yellow-50 text-yellow-600' },
      { icon: '👑', title: 'Big Spender', description: 'Spend ₹5,000+ total', unlocked: metrics.totalSpent >= 5000, color: 'bg-amber-50 text-amber-600' },
      { icon: '🏆', title: 'Mega Cart', description: '20+ items in one order', unlocked: metrics.biggestOrder.count >= 20, color: 'bg-indigo-50 text-indigo-600' },
    ];
  }, [metrics, selectedHukum]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50 min-h-screen">
        <Navbar onMenuOpen={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <TrendingUp size={48} className="text-violet-500" />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <Navbar onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 overflow-y-auto px-4 pb-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 py-5">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500">Your grocery insights & stats ✨</p>
          </div>
        </div>

        {/* Hukum filter (Admin/Sethji only) */}
        {showFilter && combinedHukumNames.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <div className="relative">
              <select
                value={selectedHukum}
                onChange={(e) => setSelectedHukum(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:border-violet-500 transition-colors shadow-sm"
              >
                {combinedHukumNames.map(name => (
                  <option key={name} value={name}>
                    {name === 'All' ? '👨‍👩‍👧‍👦 Everyone (All Hukums)' : `👤 ${name}`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}

        {!metrics ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">📊</span>
            <h2 className="text-xl font-bold text-gray-700">No data available!</h2>
            <p className="text-gray-500 mt-2">
              {selectedHukum === 'All' 
                ? 'Start ordering to see your analytics.' 
                : `No order data found for ${selectedHukum}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={ShoppingCart} label="Total Orders" value={metrics.totalOrders} gradient={GRADIENT_CARDS[0]} delay={0} />
              <StatCard icon={Package} label="Items Ordered" value={metrics.totalItems.toLocaleString()} gradient={GRADIENT_CARDS[1]} delay={0.1} />
              <StatCard icon={TrendingUp} label="Total Spent" value={`₹${metrics.totalSpent.toLocaleString()}`} subtitle={`Avg ₹${metrics.avgSpend}/order`} gradient={GRADIENT_CARDS[2]} delay={0.2} />
              <StatCard icon={Zap} label="Unique Items" value={metrics.uniqueItems} subtitle={`${metrics.avgItems} items/order avg`} gradient={GRADIENT_CARDS[3]} delay={0.3} />
            </div>

            {/* ── Fun Quick Stats ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Quick Stats
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100 flex flex-col items-center">
                  <div className="mb-1"><ProductThumb src={imageMap[metrics.favoriteItem?.name]} name={metrics.favoriteItem?.name} size={40} /></div>
                  <div className="text-xs font-bold text-gray-500 uppercase">Fav Item</div>
                  <div className="text-sm font-black text-gray-800 truncate w-full">{metrics.favoriteItem?.name || '-'}</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                  <div className="text-2xl mb-1">🔥</div>
                  <div className="text-xs font-bold text-gray-500 uppercase">Best Streak</div>
                  <div className="text-sm font-black text-gray-800">{metrics.maxStreak} weeks</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-xs font-bold text-gray-500 uppercase">Found Rate</div>
                  <div className="text-sm font-black text-gray-800">{metrics.fulfillmentRate}%</div>
                </div>
              </div>
            </motion.div>

            {/* ── Top 10 Items Bar Chart ── */}
            <ChartCard title="Top 10 Most Ordered" emoji="🏆" delay={0.4}>
              {metrics.top10.length > 0 ? (
                <div className="space-y-3">
                  {metrics.top10.map((item, i) => {
                    const maxCount = metrics.top10[0].count;
                    const pct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 w-5 text-right">#{i + 1}</span>
                        <ProductThumb src={imageMap[item.name]} name={item.name} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-gray-800 truncate">{item.name}</span>
                            <span className="text-xs font-bold text-gray-500 ml-2 flex-shrink-0">{item.count}×</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-gray-400 text-center py-8">No item data yet</p>}
            </ChartCard>

            {/* ── Monthly Trend Area Chart ── */}
            <ChartCard title="Monthly Order Trend" emoji="📈" delay={0.5}>
              {metrics.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={metrics.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradItems" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="orders" name="Orders" stroke="#6366f1" fill="url(#gradOrders)" strokeWidth={2} />
                    <Area type="monotone" dataKey="items" name="Items" stroke="#f43f5e" fill="url(#gradItems)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-center py-8">Need more orders to show trends</p>}
            </ChartCard>

            {/* ── Spending Trend Line Chart (Monthly) ── */}
            {metrics.monthlyTrend.some(m => m.spent > 0) && (
              <ChartCard title="Monthly Spending" emoji="💰" delay={0.55}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={metrics.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="spent" name="Spent (₹)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* ── Spending Trend Line Chart (Daily) ── */}
            {metrics.dailyTrend.some(m => m.spent > 0) && (
              <ChartCard title="Daily Spending" emoji="📈" delay={0.58}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={metrics.dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="spent" name="Spent (₹)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* ── Two column: Fulfillment Donut + Weekly Pattern ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fulfillment donut */}
              <ChartCard title="Fulfillment Status" emoji="✅" delay={0.6}>
                {metrics.statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={metrics.statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {metrics.statusData.map((_, i) => (
                          <Cell key={i} fill={['#10b981', '#f43f5e', '#d1d5db'][i]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(v) => <span className="text-sm font-semibold text-gray-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-400 text-center py-8">No data</p>}
              </ChartCard>

              {/* Weekly ordering pattern */}
              <ChartCard title="Busiest Days" emoji="📅" delay={0.65}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={metrics.dayMap} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Orders" radius={[6, 6, 0, 0]}>
                      {metrics.dayMap.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Variety Radar ── */}
            <ChartCard title="Category Variety Score" emoji="🌈" delay={0.7}>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={metrics.radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Radar name="Items" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── Hukum Leaderboard (Admin/Sethji only, when "All" selected) ── */}
            {showFilter && selectedHukum === 'All' && metrics.hukumBreakdown.length > 1 && (
              <ChartCard title="Family Leaderboard" emoji="👑" delay={0.75}>
                <div className="space-y-3">
                  {metrics.hukumBreakdown.map((h, i) => {
                    const maxOrders = metrics.hukumBreakdown[0].orders;
                    const pct = maxOrders > 0 ? Math.round((h.orders / maxOrders) * 100) : 0;
                    return (
                      <div key={h.name} className="flex items-center gap-3">
                        <span className="text-xl w-8 text-center">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-gray-800 truncate">{h.name}</span>
                            <span className="text-gray-500 font-semibold">{h.orders} orders · {h.items} items</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            )}

            {/* ── Hukum Comparison Bar (Admin/Sethji, "All") ── */}
            {showFilter && selectedHukum === 'All' && metrics.hukumBreakdown.length > 1 && (
              <ChartCard title="Orders by Member" emoji="📊" delay={0.85}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.hukumBreakdown} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="orders" name="Orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="items" name="Items" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* ── Achievements ── */}
            <ChartCard title="Achievements" emoji="🏅" delay={0.9}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map((a, i) => (
                  <AchievementBadge key={i} {...a} />
                ))}
              </div>
              <div className="mt-4 text-center">
                <span className="text-sm font-bold text-gray-500">
                  {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked 🎮
                </span>
              </div>
            </ChartCard>

            {/* Footer spacer */}
            <div className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
