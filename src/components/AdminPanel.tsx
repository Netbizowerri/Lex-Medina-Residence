import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, Booking, DashboardStats } from '../types';
import { dbService } from '../db';
import { Receipt } from './Receipt';
import { 
  Briefcase, LineChart, Shield, RefreshCw, Eye, EyeOff, Save, Link2, 
  Settings, CheckSquare, XSquare, Landmark, CircleDollarSign, Users, 
  ShieldAlert, LayoutDashboard, Plus, Search, Filter, Calendar, 
  Activity, MapPin, Database, LogOut, FileText, ChevronRight, Check, X, Info
} from 'lucide-react';

interface AdminPanelProps {
  setTab: (tab: string) => void;
  adminEmail: string;
}

export function AdminPanel({ setTab, adminEmail }: AdminPanelProps) {
  // Database state management
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<DashboardStats | null>(null);

  // Interior dashboard sub-navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'suites' | 'registry' | 'privyr'>('overview');

  // CRM webhook configuration
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isUrlSaved, setIsUrlSaved] = useState(false);

  // Edit fields
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  // Add room state
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'executive' | 'suite'>('executive');
  const [newRoomPrice, setNewRoomPrice] = useState<number>(100000);
  const [newRoomMaxGuests, setNewRoomMaxGuests] = useState<number>(2);
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomFeatures, setNewRoomFeatures] = useState('');
  const [newRoomImageUrl, setNewRoomImageUrl] = useState('');
  const [addRoomStatus, setAddRoomStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Digital Invoice viewing popup state
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);

  // Table queries & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Dedicated verification terminal state
  const [verifyReceiptQuery, setVerifyReceiptQuery] = useState('');
  const [verifiedBooking, setVerifiedBooking] = useState<Booking | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Load state upon mount
  useEffect(() => {
    refreshDatabaseState();
  }, []);

  const refreshDatabaseState = () => {
    const rm = dbService.getRooms();
    const bk = dbService.getBookings();
    const stat = dbService.getDashboardStats();
    
    setRooms(rm);
    setBookings(bk);
    setAnalytics(stat);

    // Load webhooks
    setWebhookUrl(dbService.getPrivyrWebhook());
    setIsUrlSaved(false);
  };

  const handleToggleRoomStatus = (id: string, currentStatus: boolean) => {
    dbService.updateRoomAvailability(id, !currentStatus);
    refreshDatabaseState();
  };

  const handleEditPriceStart = (room: Room) => {
    setEditingRoomId(room.id);
    setTempPrice(room.price);
  };

  const handleSavePrice = (id: string) => {
    dbService.updateRoomPrice(id, tempPrice);
    setEditingRoomId(null);
    refreshDatabaseState();
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.savePrivyrWebhook(webhookUrl);
    setIsUrlSaved(true);
    setTimeout(() => {
      setIsUrlSaved(false);
    }, 3000);
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddRoomStatus(null);

    if (!newRoomName.trim()) {
      setAddRoomStatus({ type: 'error', message: 'Please enter a suite name.' });
      return;
    }
    if (newRoomPrice <= 0) {
      setAddRoomStatus({ type: 'error', message: 'Price must be greater than zero.' });
      return;
    }

    const roomId = 'room-' + newRoomName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const featuresList = newRoomFeatures
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const defaultFeatures = [
      'High-speed Wi-Fi', 
      'Smart TV with Netflix', 
      '24/7 Power', 
      'Premium Air Conditioning'
    ];

    const finalFeatures = featuresList.length > 0 ? featuresList : defaultFeatures;

    const defaultImages = {
      executive: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800'],
      suite: ['https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&w=800']
    };

    const imageArray = newRoomImageUrl.trim() 
      ? [newRoomImageUrl.trim()] 
      : defaultImages[newRoomType];

    const newRoomData = {
      id: roomId,
      name: newRoomName.trim(),
      type: newRoomType,
      price: Number(newRoomPrice),
      max_guests: Number(newRoomMaxGuests),
      description: newRoomDescription.trim() || `An exceptionally designed ${newRoomType} luxury suite that features sovereign comfort, high perimeter security, and round-the-clock service.`,
      features: finalFeatures,
      images: imageArray
    };

    try {
      dbService.createRoom(newRoomData);
      setAddRoomStatus({ type: 'success', message: `Successfully added ${newRoomName} suite!` });
      
      // Reset state
      setNewRoomName('');
      setNewRoomPrice(100000);
      setNewRoomMaxGuests(2);
      setNewRoomDescription('');
      setNewRoomFeatures('');
      setNewRoomImageUrl('');

      // Delay collapsing
      setTimeout(() => {
        setShowAddRoom(false);
        setAddRoomStatus(null);
        refreshDatabaseState();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setAddRoomStatus({ 
        type: 'error', 
        message: err.message || 'Failed to create room in database. Check rules or permissions.' 
      });
    }
  };

  const handleVerifyReceipt = (idToVerify: string) => {
    setVerificationError(null);
    setVerifiedBooking(null);
    
    if (!idToVerify.trim()) {
      setVerificationError('Please enter a Receipt Number / Reservation Lock ID.');
      return;
    }
    
    const found = bookings.find(b => b.id.trim().toLowerCase() === idToVerify.trim().toLowerCase());
    if (found) {
      setVerifiedBooking(found);
    } else {
      setVerificationError('No matching active reservation records found under the provided receipt identifier.');
      setVerifiedBooking(null);
    }
  };

  const handleConfirmBookingState = (id: string) => {
    const success = dbService.updateBookingStatus(id, 'paid');
    if (success) {
      refreshDatabaseState();
      const updated = dbService.getBookings().find(b => b.id === id);
      if (updated) {
        setVerifiedBooking(updated);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleExitConsole = async () => {
    try {
      await dbService.signOut();
    } catch (err) {
      console.warn('Administrative sign out failed:', err);
    }
    sessionStorage.removeItem('lex_admin_session');
    setTab('home');
  };

  if (!analytics) return <div className="text-center p-24 text-sm text-[#d6bb83] font-display uppercase tracking-widest animate-pulse">Synchronizing sovereign ledger database...</div>;

  // Render SVG circular progress ring
  const renderProgressRing = (percentage: number) => {
    const radius = 28;
    const strokeWidth = 4;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
        <svg className="w-full h-full transform -rotate-95">
          <circle 
            className="text-stone-800" 
            strokeWidth={strokeWidth} 
            stroke="currentColor" 
            fill="transparent" 
            r={radius} 
            cx="32" 
            cy="32" 
          />
          <circle 
            className="text-[#d6bb83] transition-all duration-500" 
            strokeWidth={strokeWidth} 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            stroke="currentColor" 
            fill="transparent" 
            r={radius} 
            cx="32" 
            cy="32" 
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-[11px] font-mono font-bold text-[#d6bb83]">{percentage}%</span>
        </div>
      </div>
    );
  };

  // SVG Line Chart Renderer for Revenue Trajectory
  const renderRevenueChart = () => {
    const data = analytics.revenue_by_month || [];
    if (data.length === 0) return null;

    const maxAmt = Math.max(...data.map(d => d.amount), 1000000);
    const chartHeight = 130;
    const strokeWidth = 2.5;

    // Calculate normalized point values
    const points = data.map((d, i) => {
      const xPercent = (i / (data.length - 1)) * 100;
      const yPercent = 100 - (d.amount / maxAmt) * 80 - 10; // offset by 10% bottom/top for padding
      return { xPercent, yPercent, ...d };
    });

    const pointCoordinates = points.map(p => `${p.xPercent}% ${p.yPercent}%`);
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.xPercent}% ${p.yPercent}%`).join(' ');

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="font-display uppercase tracking-wider text-white/50 text-[10px]">Monthly Revenue Trajectory</span>
          <span className="text-[10px] text-[#d6bb83] font-mono">Max Capacity Threshold: {formatCurrency(maxAmt)}</span>
        </div>
        
        <div className="relative w-full h-[190px] bg-black/40 border border-white/5 rounded-md p-2 flex flex-col justify-between">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
            <div className="border-t border-dashed border-white/40 w-full" />
            <div className="border-t border-dashed border-white/40 w-full" />
            <div className="border-t border-dashed border-white/40 w-full" />
          </div>

          <div className="relative w-full flex-grow">
            <svg className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d6bb83" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#d6bb83" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Glowing Area Fill */}
              {points.length > 0 && (
                <path
                  d={`M 0% 100% ${points.map(p => `L ${p.xPercent}% ${p.yPercent}%`).join(' ')} L 100% 100% Z`}
                  fill="url(#chartGradient)"
                />
              )}

              {/* Precise Gold Trend Line */}
              {points.length > 0 && (
                <path
                  d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.xPercent}% ${p.yPercent}%`).join(' ')}
                  fill="none"
                  stroke="#d6bb83"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Data Interactive Anchor Dots */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={`${p.xPercent}%`}
                    cy={`${p.yPercent}%`}
                    r="4"
                    fill="#d6bb83"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  />
                  <circle
                    cx={`${p.xPercent}%`}
                    cy={`${p.yPercent}%`}
                    r="8"
                    fill="none"
                    stroke="#d6bb83"
                    strokeOpacity="0.3"
                    strokeWidth="1.5"
                  />
                </g>
              ))}
            </svg>
          </div>

          {/* Month labels footer */}
          <div className="flex justify-between items-center text-[9px] text-white/40 font-mono pt-1.5 px-2 border-t border-white/5 bg-black/20">
            {data.map((item, i) => (
              <div key={i} className="text-center">
                <span className="block font-semibold text-white/75">{item.month}</span>
                <span className="block text-[8px] text-[#d6bb83]">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Filtered booking lists for Registry table
  const filteredBookings = bookings.filter(b => {
    // Search query match
    const matchQuery = b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       b.guest_email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       b.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       b.guest_phone.includes(searchQuery);
    
    // Category match
    let matchType = true;
    if (filterType !== 'all') {
      const roomObj = rooms.find(r => r.id === b.room_id);
      matchType = roomObj?.type === filterType;
    }

    return matchQuery && matchType;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 space-y-8 font-sans text-[#F5F5F0]">
      
      {/* GLORIOUS DASHBOARD TITLE AND AUDIT HEADER */}
      <div className="p-6 bg-[#121214] border border-gold-500/15 rounded-lg shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(214,187,131,0.08)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-white/5 border border-[#d6bb83]/20 rounded-full text-[9px] tracking-widest text-[#d6bb83] uppercase font-display font-bold">
            <Shield className="w-3 h-3 text-[#d6bb83] shrink-0" />
            <span>Sovereign Authorized Identity Active</span>
          </div>
          
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-white flex items-center gap-2">
            Owner Management Console
          </h2>
          
          <p className="text-xs text-white/50 font-light max-w-xl">
            Sovereign administrative control over inventory registries, live revenue indicators, client check-in schedules, and CRM secure parameters.
          </p>
        </div>

        {/* Global Control Actions */}
        <div className="flex items-center gap-2.5 shrink-0 z-10 w-full md:w-auto">
          <button
            onClick={refreshDatabaseState}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-display font-medium border border-white/10 text-white rounded bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
            title="Reload database collections"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Ledger</span>
          </button>

          <button
            onClick={handleExitConsole}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-display font-bold uppercase tracking-widest border border-red-500/20 text-red-400 rounded bg-red-955/15 hover:bg-red-950/40 cursor-pointer transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Console</span>
          </button>
        </div>
      </div>

      {/* CORE STATS WIDGETS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 - Total Revenue (Naira) */}
        <div className="p-5 bg-[#121214] border border-white/5 rounded-lg shadow-sm font-sans flex items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-display uppercase tracking-widest text-white/40 block">Gross Yield Tally</span>
            <p className="font-serif text-2xl font-bold text-white tracking-tight">
              {formatCurrency(analytics.total_revenue)}
            </p>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Ledger Update
            </span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-full text-[#d6bb83]">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 - Occupancy Rate Slider */}
        <div className="p-5 bg-[#121214] border border-white/5 rounded-lg shadow-sm font-sans flex items-center justify-between gap-4">
          <div className="space-y-1 flex-grow">
            <span className="text-[10px] font-display uppercase tracking-widest text-[#d6bb83] block font-semibold">Active Status</span>
            <p className="font-serif text-2xl font-bold text-[#d6bb83]">
              {analytics.occupancy_rate}% Occupied
            </p>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Based on client suite locks
            </p>
          </div>
          {renderProgressRing(analytics.occupancy_rate)}
        </div>

        {/* Metric 3 - In-House Guests count */}
        <div className="p-5 bg-[#121214] border border-white/5 rounded-lg shadow-sm font-sans flex items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-display uppercase tracking-widest text-white/40 block">In-House Registrants</span>
            <p className="font-serif text-2xl font-bold text-white tracking-tight">
              {analytics.active_guests} Guests
            </p>
            <span className="text-[10px] text-white/50 block font-light">
              Presently checked-in
            </span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-full text-white/70">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 - DB Sync Health Indicator */}
        <div className="p-5 bg-[#121214] border border-[#d6bb83]/20 rounded-lg shadow-sm font-sans flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-display uppercase tracking-widest text-white/40 block">Encryption Status</span>
            <Database className="w-4 h-4 text-[#d6bb83]" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] font-mono leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>{dbService.isUsingFirebase() ? 'CLOUD SECURE' : 'STANDALONE'}</span>
            </div>
            <p className="text-[10px] text-white/40 leading-tight">
              {dbService.isUsingFirebase() 
                ? 'Synced: lex-medicina-residence-9a7a2' 
                : 'Standalone localStorage isolated logs'}
            </p>
          </div>
        </div>

      </div>

      {/* DETAILED WORKSPACE NAVIGATION TAB SELECTOR */}
      <div className="border-b border-white/10 flex items-center overflow-x-auto gap-1 text-sm bg-[#121214] p-1.5 rounded-lg border">
        
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded font-display text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'overview'
              ? 'bg-[#d6bb83] text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview Ledger</span>
        </button>

        <button
          onClick={() => setActiveSubTab('suites')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded font-display text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'suites'
              ? 'bg-[#d6bb83] text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Suites &amp; Pricing ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('registry')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded font-display text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'registry'
              ? 'bg-[#d6bb83] text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Reservation Registry ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('privyr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded font-display text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'privyr'
              ? 'bg-[#d6bb83] text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Privyr CRM Hook</span>
        </button>

      </div>

      {/* MASTER CONTENT VIEWS CONDITIONAL ROUTER */}
      <div className="space-y-6">
        
        {/* VIEW A: OVERVIEW & ANALYTICS LEDGER */}
        {activeSubTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Dedicated Reservation Verification Terminal */}
            <div className="p-6 bg-[#121214] border border-[#d6bb83]/20 rounded-lg shadow-xl relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(214,187,131,0.05)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="border-b border-white/5 pb-2">
                <h3 className="font-serif text-lg font-medium text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#d6bb83]" />
                  <span>Sovereign Receipt Verification &amp; Confirmation Terminal</span>
                </h3>
                <p className="text-xs text-white/40 leading-relaxed font-light">
                  Instantly fetch, verify, and confirm reservation locks. Once authenticated, re-generate pristine reservation receipts or settle pending balances.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-white/35 font-mono">ID:</span>
                  <input
                    type="text"
                    placeholder="Enter Reservation Receipt Number (e.g., res-bk1, RES-B4M9X...)"
                    value={verifyReceiptQuery}
                    onChange={(e) => setVerifyReceiptQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-sm pl-9 pr-4 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-[#d6bb83] font-mono tracking-wide uppercase"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleVerifyReceipt(verifyReceiptQuery);
                      }
                    }}
                  />
                  {verifyReceiptQuery && (
                    <button 
                      onClick={() => {
                        setVerifyReceiptQuery('');
                        setVerifiedBooking(null);
                        setVerificationError(null);
                      }}
                      className="absolute right-3.5 top-2.5 text-xs text-white/40 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleVerifyReceipt(verifyReceiptQuery)}
                  className="px-5 py-2 bg-[#d6bb83] hover:bg-[#c2a975] text-black font-display text-[10.5px] font-bold tracking-wider uppercase rounded-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Authenticate Lock</span>
                </button>
              </div>

              {/* Real-time Validation Report Feedback */}
              <AnimatePresence mode="wait">
                {verificationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-4 bg-red-955/15 border border-red-500/20 text-red-400 rounded-sm text-xs flex items-center gap-3 font-medium"
                  >
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                    <p>{verificationError}</p>
                  </motion.div>
                )}

                {verifiedBooking && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-5 bg-black/40 border border-[#d6bb83]/25 rounded-md space-y-4 font-sans"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-display tracking-widest text-[#d6bb83] block font-bold">Ledger Registration Match</span>
                        <h4 className="text-sm font-semibold text-white">{verifiedBooking.guest_name}</h4>
                        <p className="text-[10px] text-white/40 font-mono">{verifiedBooking.guest_email} • {verifiedBooking.guest_phone}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {verifiedBooking.payment_status === 'pending' ? (
                          <span className="px-2.5 py-1 bg-amber-950/40 border border-amber-800/30 rounded-full font-mono text-[9px] font-bold text-[#d6bb83] uppercase flex items-center gap-1 animate-pulse">
                            ● PENDING ARRIVAL TRANSACTION
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/30 rounded-full font-mono text-[9px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                            ✓ CONFIRMED SECURE LOCK
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-[9px] text-white/40 uppercase block mb-0.5 font-display tracking-wider font-semibold">Reserved Suite</span>
                        <p className="font-semibold text-white/90">
                          {rooms.find(r => r.id === verifiedBooking.room_id)?.name || 'Premium Suite'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/40 uppercase block mb-0.5 font-display tracking-wider font-semibold">Stay Dates Range</span>
                        <p className="font-semibold text-white/90 font-mono text-[11px]">
                          {verifiedBooking.check_in} TO {verifiedBooking.check_out}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/40 uppercase block mb-0.5 font-display tracking-wider font-semibold">Financial Tally</span>
                        <p className="font-bold text-[#d6bb83] font-serif text-[13px]">
                          {formatCurrency(verifiedBooking.amount_paid)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptBooking(verifiedBooking)}
                        className="px-4 py-2 bg-[#d6bb83]/10 hover:bg-[#d6bb83] border border-[#d6bb83]/20 hover:border-transparent text-[#d6bb83] hover:text-black font-display text-[10px] font-bold tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Display Receipt PDF</span>
                      </button>

                      {verifiedBooking.payment_status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmBookingState(verifiedBooking.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-display text-[10px] font-bold tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm &amp; Confirm Settle Booking</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LHS: CHART ANALYTICS CARD */}
              <div className="lg:col-span-2 p-6 bg-[#121214] border border-white/5 rounded-lg space-y-6 shadow-xl">
              <div className="border-b border-white/5 pb-3">
                <h3 className="font-serif text-lg font-medium text-white flex items-center gap-2">
                  <LineChart className="w-4.5 h-4.5 text-[#d6bb83]" />
                  <span>Sovereign Cashflow Audits</span>
                </h3>
                <p className="text-[11px] text-white/40 leading-relaxed font-light">Calculated Naira transaction entries indexed from active client settlements.</p>
              </div>

              {renderRevenueChart()}

              {/* Occupancy list category breakdown */}
              <div className="space-y-4 pt-6 border-t border-white/5 mt-4">
                <span className="text-[10px] uppercase font-display tracking-widest text-[#d6bb83] font-bold block">Capacity Indicators by Suite Range</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {rooms.map(room => {
                    const isOccupied = bookings.some(b => b.room_id === room.id && 
                      new Date(b.check_in) <= new Date() && 
                      new Date(b.check_out) >= new Date()
                    );
                    return (
                      <div key={room.id} className="p-3 bg-black/40 border border-white/5 rounded flex justify-between items-center text-xs">
                        <div>
                          <span className="block font-medium text-white/90 truncate max-w-[120px]">{room.name}</span>
                          <span className="text-[9px] uppercase font-mono text-white/40">{room.type}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                          isOccupied 
                            ? 'bg-amber-950/40 border border-amber-800/30 text-[#d6bb83]' 
                            : 'bg-emerald-950/40 border border-emerald-800/30 text-emerald-400'
                        }`}>
                          {isOccupied ? 'Occupied' : 'Vacant'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RHS: LIVE SECURITY RELAY LOGS */}
            <div className="p-6 bg-[#121214] border border-white/5 rounded-lg space-y-5 shadow-xl flex flex-col h-full justify-between">
              <div className="border-b border-white/5 pb-3">
                <h3 className="font-serif text-lg font-medium text-white flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-[#d6bb83] animate-pulse" />
                  <span>Interactive Relay Logs</span>
                </h3>
                <p className="text-[11px] text-white/40 leading-relaxed font-light">Real-time telemetry reports detailing security checkpoints and database synching.</p>
              </div>

              <div className="bg-black/80 border border-white/15 rounded p-4 font-mono text-[10px] text-[#ae996e] space-y-2.5 h-[230px] overflow-y-auto select-none">
                <p className="text-white/30">[SECURITY BOOT STRAPPING CONFIRMED]</p>
                <p className="text-[#d6bb83]">[LEDGER]: Retrieved {rooms.length} Suites; {bookings.length} reservations verified under legal bounds.</p>
                
                {webhookUrl ? (
                  <p className="text-emerald-400">[INTEGRATION]: Webhook synchronized with Privyr API pipelines.</p>
                ) : (
                  <p className="text-yellow-600 font-medium">[WARNING]: Privyr Webhook omitted. Direct browser logs fallback activated.</p>
                )}

                {bookings.slice(-3).map((b, idx) => (
                  <p key={idx} className="text-white/40">
                    [{new Date(b.created_at).toLocaleTimeString()}] Secure Receipt payload synced for "{b.guest_name}".
                  </p>
                ))}
                
                <p className="text-emerald-500">[STATUS]: Ledger heartbeat 100% stable.</p>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded flex items-center gap-3 text-xs text-white/75 relative">
                <Info className="w-5 h-5 text-[#d6bb83] shrink-0" />
                <p className="text-[10px] font-light leading-snug">
                  The manual database configuration binds exclusively to <span className="font-semibold text-white">meetanselm@gmail.com</span> on Gmail login.
                </p>
              </div>
            </div>

            </div> {/* Close stats grid */}
          </motion.div>
        )}

        {/* VIEW B: SUITES & RATES INVENTORY MANAGEMENT */}
        {activeSubTab === 'suites' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* SUITE WORKBENCH HEADER CARD */}
            <div className="p-6 bg-[#121214] border border-white/5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-xl font-medium text-white">Sovereign Residence Portfolio</h3>
                <p className="text-xs text-white/40">Edit Suite prices, switch active booking availability status, or expand custom portfolios.</p>
              </div>
              <button
                onClick={() => setShowAddRoom(!showAddRoom)}
                className="w-full sm:w-auto px-4 py-2 bg-[#d6bb83] hover:bg-[#c2a975] text-black font-display text-[11px] font-bold tracking-widest uppercase rounded-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {showAddRoom ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showAddRoom ? 'Collapse Setup' : 'Add New Suite'}</span>
              </button>
            </div>

            {/* EXPAND SUITE BLUEPRINT FORM */}
            <AnimatePresence>
              {showAddRoom && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddRoom} 
                  className="p-6 bg-[#121214] border border-[#d6bb83]/20 rounded-lg space-y-4 overflow-hidden"
                >
                  <div className="border-b border-white/5 pb-2">
                    <h4 className="font-serif text-base text-[#d6bb83] font-medium">Add Beautiful Suite</h4>
                    <p className="text-[10px] text-white/40">Provide formal architectural specs below. Upon saving, database indices update globally.</p>
                  </div>

                  {addRoomStatus && (
                    <div className={`p-3 text-xs rounded text-center font-display uppercase tracking-wider font-bold ${
                      addRoomStatus.type === 'success' 
                        ? 'bg-emerald-950/40 border border-emerald-800/35 text-emerald-400' 
                        : 'bg-red-955/40 border border-red-800/30 text-red-400'
                    }`}>
                      {addRoomStatus.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase tracking-wider font-display text-white/40 font-bold">Suite Title Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sovereign Executive Suite"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        required
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#d6bb83]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase tracking-wider font-display text-white/40 font-bold">Category Range</label>
                      <select
                        value={newRoomType}
                        onChange={(e) => setNewRoomType(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d6bb83]"
                      >
                        <option value="executive" className="bg-[#121214] text-white">Executive</option>
                        <option value="suite" className="bg-[#121214] text-white">Suite</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase tracking-wider font-display text-white/40 font-bold">Rate / Night (₦)</label>
                        <input
                          type="number"
                          placeholder="e.g. 100000"
                          value={newRoomPrice || ''}
                          onChange={(e) => setNewRoomPrice(Number(e.target.value))}
                          required
                          min="1"
                          className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#d6bb83]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase tracking-wider font-display text-white/40 font-bold">Max Guests</label>
                        <input
                          type="number"
                          value={newRoomMaxGuests}
                          onChange={(e) => setNewRoomMaxGuests(Number(e.target.value))}
                          required
                          min="1"
                          max="8"
                          className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d6bb83]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase tracking-wider font-display text-white/40 font-bold">Features (Comma Separated)</label>
                      <input
                        type="text"
                        placeholder="Military Guard, Smart TV, Infinite Jacuzzi, 24/7 Power, Executive Lounge"
                        value={newRoomFeatures}
                        onChange={(e) => setNewRoomFeatures(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#d6bb83]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase tracking-wider font-display text-white/40 font-bold">Option Gallery Image URL (or default Unsplash preset is used)</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={newRoomImageUrl}
                        onChange={(e) => setNewRoomImageUrl(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#d6bb83]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase tracking-wider font-display text-white/40 font-bold">Accommodating Specifications & Overview</label>
                    <textarea
                      rows={2}
                      placeholder="Enter details on physical scale, room layout, security specs, and personalized concierge offers..."
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#d6bb83] resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRoom(false)}
                      className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/70 font-display text-[10px] font-bold uppercase tracking-wider rounded"
                    >
                      Collapse
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#d6bb83] hover:bg-[#c2a975] text-black font-display text-[10px] font-bold uppercase tracking-wider rounded transition-all"
                    >
                      Commit Suite
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* SUITES SELECTION MATRIX GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div 
                  key={room.id} 
                  className="bg-[#121214] border border-white/5 rounded-lg overflow-hidden flex flex-col justify-between shadow-md relative"
                >
                  <div className="relative h-44 bg-stone-900">
                    <img 
                      src={room.images[0] || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"} 
                      alt={room.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    
                    <div className="absolute top-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-widest uppercase font-bold border ${
                        room.is_available 
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30' 
                          : 'bg-red-955/80 text-red-400 border-red-500/30'
                      }`}>
                        {room.is_available ? 'Active Searchable' : 'Suspended'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4">
                      <span className="text-[9px] uppercase font-display tracking-widest text-[#d6bb83] font-bold block mb-0.5">
                        {room.type} Suite
                      </span>
                      <h4 className="font-serif text-lg text-white font-semibold">{room.name}</h4>
                    </div>
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <p className="text-xs text-white/60 leading-relaxed font-light line-clamp-3">
                      {room.description}
                    </p>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase text-white/40 block font-display tracking-wider">Features</span>
                      <div className="flex flex-wrap gap-1.5">
                        {room.features.slice(0, 3).map((f, i) => (
                          <span key={i} className="text-[9px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-white/70 italic font-mono">
                            {f}
                          </span>
                        ))}
                        {room.features.length > 3 && (
                          <span className="text-[9px] text-[#d6bb83] px-1 py-0.5 font-bold">
                            +{room.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex items-center justify-between gap-4">
                      <div className="flex-grow">
                        <span className="text-[9px] uppercase text-white/40 block font-display tracking-wider">Nightly Premium Rate</span>
                        
                        {editingRoomId === room.id ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-[#d6bb83] font-mono">₦</span>
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(Number(e.target.value))}
                              className="w-24 bg-black border border-white/20 px-2 py-0.5 rounded text-xs text-white focus:outline-none focus:border-[#d6bb83]"
                            />
                            <button 
                              onClick={() => handleSavePrice(room.id)}
                              className="bg-[#d6bb83] hover:bg-[#c2a975] text-black px-2 py-1 text-[9px] font-bold rounded cursor-pointer font-display uppercase tracking-wider"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingRoomId(null)}
                              className="text-white bg-white/10 px-1 py-1 text-[9px] rounded font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-serif text-base font-bold text-[#d6bb83]">{formatCurrency(room.price)}</span>
                            <button 
                              onClick={() => handleEditPriceStart(room)}
                              className="text-white/40 hover:text-white hover:underline text-[9px] font-mono tracking-wide uppercase transition-colors"
                            >
                              [Edit Price]
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Active Toggle */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="text-[8px] text-white/40 font-display uppercase tracking-widest font-bold">Room Lock</span>
                        <button
                          onClick={() => handleToggleRoomStatus(room.id, room.is_available)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            room.is_available ? 'bg-[#d6bb83]' : 'bg-white/10'
                          }`}
                          aria-label="Toggle Room Availability"
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              room.is_available ? 'translate-x-5 bg-black' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* VIEW C: GUEST RESERVATION REGISTRY */}
        {activeSubTab === 'registry' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* SEARCH AND CAPABILITY FILTER DRAWER */}
            <div className="p-4 bg-[#121214] border border-white/5 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              
              {/* Search text input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Query guest name, email, or telephone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded pl-9 pr-4 py-2 text-xs text-white placeholder-white/35 focus:outline-none focus:border-[#d6bb83]"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-white/40 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Suite range quick filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#d6bb83] shrink-0" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d6bb83]"
                >
                  <option value="all">Listing All Suite Categories</option>
                  <option value="executive">Category: Executive</option>
                  <option value="suite">Category: Suite</option>
                </select>
              </div>

              {/* Quick stats indicator */}
              <div className="text-right md:pr-2">
                <span className="text-[11px] font-mono text-white/50">
                  Showing <span className="text-[#d6bb83] font-bold">{filteredBookings.length}</span> of {bookings.length} reservations
                </span>
              </div>

            </div>

            {/* HIGH DENSITY MASTER LEDGER TABLE */}
            <div className="p-6 bg-[#121214] border border-white/5 rounded-lg shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 font-display uppercase tracking-widest text-[9px] font-bold pb-2">
                      <th className="pb-3 text-left">Sovereign Guest Details</th>
                      <th className="pb-3 text-left">Reserved Luxury Suite</th>
                      <th className="pb-3 text-left">Arrival &amp; Depart</th>
                      <th className="pb-3 text-right">Sum Settled</th>
                      <th className="pb-3 text-center">Confirmation Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80 font-light">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-white/35 uppercase tracking-wider font-mono">
                          No matching active reservation records found in cloud registries.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-white/5 transition-colors group">
                          
                          {/* Guest Meta info */}
                          <td className="py-4 font-sans">
                            <span className="font-semibold text-white group-hover:text-[#d6bb83] transition-colors">{b.guest_name}</span>
                            <div className="text-[10px] text-white/40 mt-1 font-mono">{b.guest_email} • {b.guest_phone}</div>
                          </td>

                          {/* Room Category */}
                          <td className="py-4 font-display font-medium uppercase text-[#d6bb83] text-[10px]">
                            {rooms.find(r => r.id === b.room_id)?.name || (b.room_id === 'room-1' ? 'Beijing Room' : b.room_id === 'room-2' ? 'Las Vegas Room' : 'Presidential Penthouse')}
                          </td>

                          {/* Checkin / Checkout ranges */}
                          <td className="py-4">
                            <div className="font-mono text-white/80 flex items-center gap-1.5">
                              <span>{b.check_in}</span>
                              <ChevronRight className="w-2.5 h-2.5 text-white/30" />
                              <span>{b.check_out}</span>
                            </div>
                            <span className="text-[9px] text-white/40">Check-in locked</span>
                          </td>

                          {/* Cash Paid */}
                          <td className="py-4 text-right font-semibold text-white font-serif text-sm">
                            {formatCurrency(b.amount_paid)}
                          </td>

                          {/* Invoice View Interaction Actions */}
                          <td className="py-4 text-center">
                            <button
                              onClick={() => setSelectedReceiptBooking(b)}
                              className="px-2.5 py-1.5 bg-[#d6bb83]/10 hover:bg-[#d6bb83] border border-[#d6bb83]/20 hover:border-transparent text-[#d6bb83] hover:text-black font-display text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <FileText className="w-3 h-3" />
                              <span>View Receipt</span>
                            </button>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW D: PRIVYR CRM WEBHOOK PARAMS */}
        {activeSubTab === 'privyr' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* WEBHOOK DETAILS & CONTROLLER */}
            <div className="lg:col-span-2 p-6 bg-[#121214] border border-white/5 rounded-lg space-y-5 shadow-xl">
              <div className="border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-[#d6bb83]">
                  <Link2 className="w-5 h-5" />
                  <h3 className="font-serif text-lg font-medium">Privyr CRM Secure Routing</h3>
                </div>
                <p className="text-xs text-white/40 leading-relaxed font-light">Link client checkouts and lead generation directly into your Privyr sales CRM workspace.</p>
              </div>

              <p className="text-xs text-white/70 leading-relaxed font-light">
                Once synced, booking transactions automatically dispatch immediate webhook payloads containing lodger name, suite selected, and telephone numbers straight to your mobile Privyr application for instant follow-up alerts!
              </p>

              <form onSubmit={handleSaveWebhook} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-display tracking-widest text-[#d6bb83] font-bold">
                    Target Webhook Endpoint URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.privyr.com/api/v1/incoming/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white rounded py-2.5 px-3.5 text-xs focus:border-[#d6bb83] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#d6bb83] hover:bg-[#c2a975] text-black font-display text-[11px] font-bold tracking-widest uppercase rounded-sm transition-all"
                  >
                    Sync Secure integration
                  </button>
                </div>
              </form>

              {isUrlSaved && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/35 text-emerald-400 rounded text-[11px] font-sans font-medium text-center">
                  ✅ Webhook URL successfully integrated with Lex Medicina local routers!
                </div>
              )}
            </div>

            {/* INTEGRATION INSTRUCTIONS SIDEBAR */}
            <div className="p-6 bg-black/30 border border-white/5 rounded-lg space-y-4">
              <span className="text-[10px] uppercase font-display tracking-widest text-[#d6bb83] font-bold block">Setup Manual</span>
              <h4 className="font-serif text-sm font-medium text-white">How to locate your Privyr Hook:</h4>
              
              <ul className="space-y-3.5 text-xs text-white/70 font-light">
                <li className="flex gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-white/5 text-center text-xs font-mono font-bold leading-5 block text-[#d6bb83] shrink-0">1</span>
                  <span>Open your Privyr iOS/Android app or go to your desktop admin workspace console.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-white/5 text-center text-xs font-mono font-bold leading-5 block text-[#d6bb83] shrink-0">2</span>
                  <span>Navigate to <span className="font-semibold text-white">Integrations</span> &gt; <span className="font-semibold text-white">Custom Webhooks</span>.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-white/5 text-center text-xs font-mono font-bold leading-5 block text-[#d6bb83] shrink-0">3</span>
                  <span>Copy the generated link string and paste it into the endpoint input slot on the left. Click "Sync" to save.</span>
                </li>
              </ul>
            </div>

          </motion.div>
        )}

      </div>

      {/* OVERLAY DIALOG MODAL FOR GUEST DIGITAL RECEIPT */}
      {selectedReceiptBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg"
          >
            {/* Modal Close Anchor Button */}
            <button
              onClick={() => setSelectedReceiptBooking(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 rounded-full text-white/50 hover:text-white border border-white/10 hover:border-white/20 hover:scale-105 transition-all cursor-pointer"
              title="Close receipt invoice panel"
            >
              <X className="w-4 h-4" />
            </button>

            <Receipt 
              booking={selectedReceiptBooking} 
              onDone={() => setSelectedReceiptBooking(null)} 
            />
          </motion.div>
        </div>
      )}

    </div>
  );
}
