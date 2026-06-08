/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from './db';
import { Room, Booking, Apartment, Kitchen } from './types';
import { useFirebaseApollo } from './hooks/useFirebaseAdmin';

import AdminDashboard from './components/admin/AdminDashboard';

// Component imports
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RoomCard } from './components/RoomCard';
import { BookingModal } from './components/BookingModal';
import { Receipt } from './components/Receipt';
import { LiveMapsGPS } from './components/LiveMapsGPS';

// Icon imports
import {
  Building, ShieldCheck, Compass, Landmark, Mail, Phone, MapPin, 
  Sparkles, Coffee, Wifi, Shield, ArrowRight, Calendar, User, Terminal, Star,
  ChefHat, Utensils, ArrowUp, ChevronLeft, ChevronRight
} from 'lucide-react';

const ADMIN_EMAIL = 'meetanselm@gmail.com';
const ADMIN_SESSION_KEY = 'lex_admin_session';

const GALLERY_IMAGES = [
  {
    url: 'https://i.ibb.co/3yk0ZBgt/HERO.png',
    title: 'The Gwarinpa Main Sanctum Lobby',
    category: 'Elite Main Space',
    description: 'Our premium welcome sanctuary designed with sophisticated gold highlights and serene ambient seating.'
  },
  {
    url: 'https://i.ibb.co/C5B6dtK8/ROOM-2.png',
    title: 'Beijing',
    category: 'Executive Luxury Room',
    description: 'An exquisitely styled room featuring a king-sized plush bed, soft ambient lighting, and rich corporate comfort.'
  },
  {
    url: 'https://i.ibb.co/whXDrrHW/LAS-VEGAS-ROOM.png',
    title: 'Las Vegas',
    category: 'Executive Luxury Room',
    description: 'A majestic executive space with dramatic charcoal oak panels, sleek brass details, and deep relaxation lounges.'
  },
  {
    url: 'https://i.ibb.co/0jJJK77h/ok-1-1-1.png',
    title: 'London',
    category: 'Executive Luxury Room',
    description: 'The pinnacle top-flight master suite containing state-of-the-art studies and private resident pantry entry.'
  },
  {
    url: 'https://i.ibb.co/bg2FDP8C/THIS-1.png',
    title: 'Toronto',
    category: 'Executive Luxury Room',
    description: 'A contemporary executive suite beautifully detailed with leather accents and high-contrast brass elements.'
  },
  {
    url: 'https://i.ibb.co/svGc1zJr/BELIZE-ROOM-1.png',
    title: 'Belize',
    category: 'Executive Luxury Room',
    description: 'An elegant retreat featuring premium velvet lounge chairs, high-contrast stone floors, and absolute privacy.'
  },
  {
    url: 'https://i.ibb.co/pBpJrGtM/suite-1.png',
    title: 'New York',
    category: 'Grand Master Suite',
    description: 'A spectacular double-room penthouse configuration styled with deep forest velvet and walnut detailing.'
  },
  {
    url: 'https://i.ibb.co/XdXKdfr/THIS-KITCHEN-2.png',
    title: 'The Primary Chef’s Gourmet Kitchen',
    category: 'State-of-the-Art Culinary Station',
    description: 'A professional chef-grade kitchen outfitted with premium stainless appliances for curated fine dining.'
  },
  {
    url: 'https://i.ibb.co/xt9ThjHx/SECOND-KITCHEN-1.png',
    title: "The Resident's Morning Pantry & Kitchenette",
    category: 'Delicate Mornings & Beverages Bar',
    description: 'A secondary private beverage bar and gourmet espresso station for discrete light dining and midnight refreshment.'
  },
  {
    url: 'https://i.ibb.co/B2zTXn7V/PARLOUR-1.png',
    title: 'The Luxury Parlour Reflection',
    category: 'Exclusive Living Lounge',
    description: 'A grand and spacious reception lounge perfect for relaxing, receiving visitors, and unwinding.'
  }
];

const mapApartmentToRoom = (apartment: Apartment): Room => {
  const imageUrls = apartment.media
    .map(item => item?.url)
    .filter((url): url is string => Boolean(url && url.trim()));

  return {
    id: apartment.id,
    name: apartment.title,
    type: apartment.price >= 35000 ? 'suite' : 'executive',
    price: apartment.price,
    is_available: apartment.status === 'available',
    features: apartment.features.length > 0 ? apartment.features : ['High-speed Wi-Fi', '24/7 Power', 'Premium Security'],
    images: imageUrls.length > 0 ? imageUrls : ['https://picsum.photos/seed/lex-medicina-room/1200/900'],
    max_guests: apartment.price >= 35000 ? 3 : 2,
    description: apartment.description
  };
};

const getKitchenFeatures = (kitchen: Kitchen) => {
  if (kitchen.name.toLowerCase().includes('primary')) {
    return ['Professional Chef Access', 'Double Refrigerator', 'Induction Burners', 'Premium Spices & Cookware'];
  }

  return ['Espresso Machine', '24/7 Hot Beverage Bar', 'Granite Finish Counter', 'Premium Microwave & Blenders'];
};

export default function App() {
  const [tab, setTab] = useState<string>('home');
  const [galleryIndex, setGalleryIndex] = useState<number>(0);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [recentBooking, setRecentBooking] = useState<Booking | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { apartments, kitchens, bookings: firestoreBookings, loading: catalogLoading } = useFirebaseApollo();

  // URL-based admin login routing: /adminlogin path opens admin panel
  useEffect(() => {
    if (window.location.pathname.toLowerCase() === '/adminlogin') {
      setTab('admin-login');
    }
  }, []);

  // Automatically reset viewport to top when any tab is chosen
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [tab]);

  // Monitor scrolling to show/hide "Back to Top" floating button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gallery Autoplay Timer & Manual Controllers
  const [isGalleryPlaying, setIsGalleryPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!isGalleryPlaying || tab !== 'home') return;
    const timer = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % GALLERY_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isGalleryPlaying, tab]);

  const handlePrevGallerySlide = () => {
    setGalleryIndex((prev) => (prev - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
  };

  const handleNextGallerySlide = () => {
    setGalleryIndex((prev) => (prev + 1) % GALLERY_IMAGES.length);
  };
  
  // Advanced filters state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterGuests, setFilterGuests] = useState<number>(1);
  const [filterCheckIn, setFilterCheckIn] = useState<string>('');
  const [filterCheckOut, setFilterCheckOut] = useState<string>('');

  // Admin login parameters
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // General inquiry form parameters
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);

  // Keep admin session aligned with Firebase auth state.
  useEffect(() => {
    const initAuth = async () => {
      const auth = dbService.getAuthService();
      if (!auth) return;

      const { onAuthStateChanged } = await import('firebase/auth');
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && user.email?.trim().toLowerCase() === ADMIN_EMAIL) {
          setIsAdminLoggedIn(true);
          setAdminEmail(user.email);
        } else {
          setIsAdminLoggedIn(false);
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
        }
      });

      return unsubscribe;
    };

    let unsubscribe: undefined | (() => void);
    initAuth().then((fn) => {
      unsubscribe = fn;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle successful reservation checkout loop
  const handleBookingSuccess = (booking: Booking) => {
    setSelectedRoom(null);
    setRecentBooking(booking);
    setTab('success-receipt');
  };

  // Safe currency visual formatter
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Evaluate check-in check-out error message
  const filterError = React.useMemo(() => {
    if (filterCheckIn && filterCheckOut) {
      if (new Date(filterCheckIn) >= new Date(filterCheckOut)) {
        return 'Check-out date must be strictly after Check-in date.';
      }
    }
    return '';
  }, [filterCheckIn, filterCheckOut]);

  const rooms = React.useMemo(() => {
    if (dbService.isUsingFirebase()) {
      // If Firestore has apartments, map them; otherwise fall back to INITIAL_ROOMS
      return apartments.length > 0 ? apartments.map(mapApartmentToRoom) : dbService.getRooms();
    }

    return dbService.getRooms();
  }, [apartments]);

  const publicCatalogReady = !dbService.isUsingFirebase() || apartments.length > 0 || !catalogLoading;

  // Evaluate query filters across existing suite availability
  const filteredRooms = React.useMemo(() => {
    let result = rooms;

    if (filterType !== 'all') {
      result = result.filter(r => r.id === filterType);
    }
    
    result = result.filter(r => r.max_guests >= filterGuests);

    // Cross reference stay schedule overrides
    if (filterCheckIn && filterCheckOut) {
      if (new Date(filterCheckIn) >= new Date(filterCheckOut)) {
        return [];
      }
      result = result.filter(r => {
        if (!dbService.isUsingFirebase()) {
          return dbService.checkAvailability(r.id, filterCheckIn, filterCheckOut);
        }

        const overlapping = firestoreBookings.some((booking) => {
          if (booking.room_id !== r.id) return false;
          if (booking.payment_status !== 'paid' && booking.payment_status !== 'pending') return false;

          const stayStart = new Date(filterCheckIn);
          const stayEnd = new Date(filterCheckOut);
          const bookingStart = new Date(booking.check_in);
          const bookingEnd = new Date(booking.check_out);
          return stayStart < bookingEnd && stayEnd > bookingStart;
        });

        return !overlapping;
      });
    }

    return result;
  }, [rooms, filterType, filterGuests, filterCheckIn, filterCheckOut, firestoreBookings]);

  // Handles submitting general contact inquiries immediately as a CRM lead simulation
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquirySuccess(false);

    // Build lead payload
    const leadPayload: Booking = {
      id: 'lead-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      guest_name: inquiryName,
      guest_email: inquiryEmail,
      guest_phone: inquiryPhone,
      room_id: 'general-inquiry',
      check_in: new Date().toISOString().split('T')[0],
      check_out: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
      payment_status: 'pending',
      amount_paid: 0,
      created_at: new Date().toISOString()
    };

    // Trigger simulation dispatch to CRM adapter
    await dbService.sendToPrivyr(leadPayload);

    setTimeout(() => {
      setInquiryLoading(false);
      setInquirySuccess(true);
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage('');
    }, 1200);
  };

  // Handle admin credential authentication securely
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const email = adminEmail.trim().toLowerCase();

    if (dbService.isUsingFirebase()) {
      try {
        const user = await dbService.signInWithEmail(email, adminPass);
        if (user && user.email?.trim().toLowerCase() === ADMIN_EMAIL) {
          sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
          setIsAdminLoggedIn(true);
          setTab('admin-dashboard');
        } else {
          await dbService.signOut();
          setAdminError(`Unauthorized administrative identity. Authenticated identity must match ${ADMIN_EMAIL}.`);
        }
      } catch (err: any) {
        console.warn('Firebase administrative auth collapsed:', err);
        setAdminError(err.message || 'Authentication failed. Please verify your administrative credentials.');
      }
    } else {
      setAdminError('Firebase authentication is not configured. Admin access requires a valid Firebase sign-in.');
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setAdminError('');
    try {
      const user = await dbService.signInWithGoogle();
      if (user && user.email?.trim().toLowerCase() === ADMIN_EMAIL) {
        setIsAdminLoggedIn(true);
        setAdminEmail(user.email);
        setTab('admin-dashboard');
      } else {
        await dbService.signOut();
        setAdminError(`Unauthorized administrative identity. Google authentication identity must match ${ADMIN_EMAIL}.`);
      }
    } catch (err: any) {
      console.warn('Google sign-in collapsed:', err);
      setAdminError(err.message || 'Google sign-in request cancelled or failed to initialize.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b] text-white selection:bg-gold-500 selection:text-black">
      {/* Navigation Header */}
      <Header 
        currentTab={tab} 
        setTab={(newTab) => {
          if (newTab === 'admin-dashboard' && !isAdminLoggedIn) {
            setTab('admin-login');
          } else {
            setTab(newTab);
          }
        }} 
        isFirebaseConnected={dbService.isUsingFirebase()}
      />

      {/* Main Pages Transition Slider Canvas */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          
          {/* PAGE 1: RESIDENCE HOME LANDING */}
          {tab === 'home' && (
            <motion.div
              key="view-home"
              initial="page-enter"
              animate="page-enter-active"
              exit="page-enter"
              className="space-y-20 pb-20"
            >
              {/* HERO BANNER SECTION */}
              <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-luxury-charcoal">
                {/* Background visual image with vintage grain */}
                <div className="absolute inset-0">
                  <img
                    src="https://i.ibb.co/3yk0ZBgt/HERO.png"
                    alt="Luxury Lobby"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-35"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0e0e10] via-black/50 to-transparent" />
                </div>

                {/* Centered Pitch Card */}
                <div className="relative z-10 mx-auto max-w-4xl px-6 text-center space-y-8 select-none">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/15 rounded-full text-[10px] tracking-[0.25em] text-[#d6bb83] uppercase"
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>The Standard of Sovereign Grace</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="font-serif text-4xl sm:text-6xl text-white font-semibold leading-[1.1] tracking-tight"
                  >
                    A Serene Retreat in Gwarinpa, Abuja
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="font-sans text-gray-300 text-sm sm:text-base font-light max-w-2xl mx-auto leading-relaxed"
                  >
                    A secure, fully serviced residence designed for extended stays and shortlets, featuring uninterrupted power, advanced protection, and personalized concierge support. Enjoy the freedom of a fully equipped kitchen for self-catering, with effortless access to curated meal delivery whenever desired.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4"
                  >
                    <button
                      onClick={() => setTab('rooms')}
                      className="px-8 py-3 bg-[#d6bb83] text-black font-display text-xs font-semibold uppercase tracking-widest hover:bg-gold-200 hover:shadow-lg transition-all cursor-pointer"
                    >
                      EXPLORE SUITES
                    </button>
                    <button
                      onClick={() => setTab('contact')}
                      className="px-8 py-3 bg-transparent text-white border border-white/20 font-display text-xs font-semibold uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer"
                    >
                      DIRECTIONS &amp; MAP
                    </button>
                  </motion.div>
                </div>
              </section>

              {/* QUICK AVAILABILITY SEARCH INTERACTIVE BLOCK */}
              <section className="mx-auto max-w-6xl px-6 -mt-16 relative z-20">
                <div className="bg-[#121212] rounded-md shadow-xl border border-white/10 p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-white">
                  
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gold-400 font-display mb-1.5 font-bold">
                      Select Room
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 py-2 px-3 text-xs text-white rounded focus:outline-none focus:border-gold-400"
                    >
                      <option value="all">All Rooms</option>
                      {rooms.sort((a, b) => a.price - b.price).map((room) => (
                        <option key={room.id} value={room.id}>{room.name} - ₦{room.price.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gold-400 font-display mb-1.5 font-bold">
                      Arrival Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={filterCheckIn}
                      onChange={(e) => setFilterCheckIn(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 py-2 px-3 text-xs text-white rounded focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gold-400 font-display mb-1.5 font-bold">
                      Check-Out Date
                    </label>
                    <input
                      type="date"
                      min={filterCheckIn || new Date().toISOString().split('T')[0]}
                      value={filterCheckOut}
                      onChange={(e) => setFilterCheckOut(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 py-2 px-3 text-xs text-white rounded focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <button
                    onClick={() => setTab('rooms')}
                    className="w-full py-2.5 bg-gold-500 text-black font-display text-xs font-bold uppercase tracking-widest text-center hover:bg-gold-600 transition-colors cursor-pointer"
                  >
                    SEARCH VACANCIES
                  </button>

                </div>
              </section>

              {/* DISTINGUISHED VALUES (THE LEX MEDICINA STANDARD) */}
              <section className="mx-auto max-w-7xl px-6 md:px-8 space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <span className="text-[10px] uppercase font-display tracking-[0.25em] text-gold-400 font-bold block">
                    Distinguished Features
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                    Elite Amenities Designed for Tranquility
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Amenity 1 */}
                  <div className="p-8 bg-[#121212] border border-white/10 rounded-md shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-gold-400/10 rounded flex items-center justify-center text-gold-400 border border-gold-500/20">
                      <Coffee className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-xl font-medium text-white">
                      Reliable Solar-Powered Excellence
                    </h3>
                    <p className="text-white/60 text-xs font-light leading-relaxed">
                      Experience uninterrupted comfort with our state-of-the-art renewable energy system, featuring 88 solar panels, a high-capacity 36kWh battery bank, and solar water heating. Designed for maximum efficiency and reliability, our energy infrastructure ensures stable, flicker-free power 24 hours a day.
                    </p>
                  </div>

                  {/* Amenity 2 */}
                  <div className="p-8 bg-[#121212] border border-white/10 rounded-md shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-gold-400/10 rounded flex items-center justify-center text-gold-400 border border-gold-500/20">
                      <Wifi className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-xl font-medium text-white">
                      High-Speed Dedicated Connectivity
                    </h3>
                    <p className="text-white/60 text-xs font-light leading-relaxed">
                      Enjoy premium high-speed Wi-Fi with speeds exceeding 300 Mbps. From streaming webinars and transferring large files to virtual conferences and international board meetings, our reliable network delivers seamless, uninterrupted connectivity.
                    </p>
                  </div>

                  {/* Amenity 3 */}
                  <div className="p-8 bg-[#121212] border border-white/10 rounded-md shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-[#1a1a1a] rounded flex items-center justify-center text-gold-400 border border-gold-500/20">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-xl font-medium text-white">
                      Advanced Security &amp; Surveillance
                    </h3>
                    <p className="text-white/60 text-xs font-light leading-relaxed">
                      Enjoy complete peace of mind with 360-degree military-grade infrared CCTV surveillance across the property. Located in one of Abuja's most secure districts, the residence combines a safe environment with round-the-clock monitoring to ensure the security and comfort of all guests.
                    </p>
                  </div>
                </div>
              </section>

              {/* HAND-PICKED FEATURED ROOMS GRID */}
              <section className="mx-auto max-w-7xl px-6 md:px-8 space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-white/10 pb-5">
                  <div>
                    <span className="text-[10px] uppercase font-display tracking-[0.2em] text-gold-450 font-bold block">
                      The Catalogue
                    </span>
                    <h2 className="font-serif text-3xl font-semibold tracking-tight text-white">
                      Features Exquisite Guest Rooms
                    </h2>
                  </div>
                  <button
                    onClick={() => setTab('rooms')}
                    className="inline-flex items-center gap-1 text-xs font-display font-medium text-gold-400 hover:text-gold-300 hover:underline cursor-pointer font-semibold uppercase tracking-wider"
                  >
                    <span>View all suites</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dbService.isUsingFirebase() && !publicCatalogReady ? (
                    <div className="col-span-full rounded-md border border-white/10 bg-white/5 p-8 text-center text-sm text-white/60">
                      Syncing apartment inventory from Firestore...
                    </div>
                  ) : (
                    rooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onSelect={(rm) => setSelectedRoom(rm)}
                      />
                     ))
                   )}
                 </div>
              </section>

              {/* CURATED LUXURY GALLERY CAROUSEL */}
              <section className="mx-auto max-w-7xl px-6 md:px-8 space-y-10">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] uppercase font-display tracking-[0.25em] text-[#d6bb83] font-bold block">
                    Visual Showcase
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                    Our Curated Residence Gallery
                  </h2>
                  <p className="text-gray-400 text-xs font-light">
                    Take a visual tour of our bespoke suites, culinary kitchens, and elite greeting spaces.
                  </p>
                </div>

                {/* Main Carousel viewport container */}
                <div 
                  className="relative max-w-5xl mx-auto aspect-[16/9] w-full bg-[#121212] border border-white/10 rounded-md overflow-hidden shadow-2xl group/gallery"
                  onMouseEnter={() => setIsGalleryPlaying(false)}
                  onMouseLeave={() => setIsGalleryPlaying(true)}
                >
                  {/* Dynamic Slide Image Layer with Motion Fade transition */}
                  <div className="absolute inset-0 w-full h-full bg-black/50 select-none overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={galleryIndex}
                        src={GALLERY_IMAGES[galleryIndex].url}
                        alt={GALLERY_IMAGES[galleryIndex].title}
                        referrerPolicy="no-referrer"
                        initial={{ opacity: 0, scale: 1.01 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                  </div>

                  {/* Navigation Small Arrow Elements */}
                  <button
                    onClick={handlePrevGallerySlide}
                    aria-label="Previous image"
                    id="gallery-prev-arrow"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 hover:border-[#d6bb83] transition-all duration-300 backdrop-blur-xs cursor-pointer opacity-85"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleNextGallerySlide}
                    aria-label="Next image"
                    id="gallery-next-arrow"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 hover:border-[#d6bb83] transition-all duration-300 backdrop-blur-xs cursor-pointer opacity-85"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>



                  {/* Bottom Indicator Dots */}
                  <div className="absolute bottom-4 left-1/4 right-1/4 sm:left-1/2 sm:-translate-x-1/2 z-30 flex justify-center gap-2">
                    {GALLERY_IMAGES.map((_, idx) => (
                      <button
                        key={idx}
                        id={`gallery-indicator-dot-${idx}`}
                        onClick={() => setGalleryIndex(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === galleryIndex ? 'w-6 bg-[#d6bb83]' : 'w-1.5 bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* CINEMATIC VIDEO RETREAT SHOWCASE */}
              <section className="mx-auto max-w-7xl px-6 md:px-8 space-y-10">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                    Experience Lex Medicina Residence
                  </h2>
                  <p className="text-gray-400 text-xs font-light">
                    An exclusive tour around our serene Abuja corporate sanctuary.
                  </p>
                </div>

                <div className="max-w-4xl mx-auto bg-[#121212] border border-white/10 rounded-md overflow-hidden shadow-2xl p-2 sm:p-3">
                  <div className="relative w-full aspect-video rounded overflow-hidden bg-black">
                    <iframe
                      src="https://player.vimeo.com/video/1198379483"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                      referrerPolicy="no-referrer"
                      className="absolute top-0 left-0 w-full h-full animate-fade-in"
                      title="Lex Medicina Tour Video"
                    ></iframe>
                  </div>
                </div>
              </section>

              {/* REAL CLIENTELE REVIEWS */}
              <section className="bg-[#121212] py-16 border-y border-white/5">
                <div className="mx-auto max-w-4xl px-6 text-center space-y-6">
                  <div className="flex justify-center gap-1 text-gold-400">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <blockquote className="font-serif text-lg md:text-xl text-white/80 italic leading-relaxed">
                      "Lex Medicina has completely redefined corporate lodging in Abuja. Having high perimeter defense, excellence, and the elegance of their gold-toned bedroom layout makes stay feeling like a private oasis."
                  </blockquote>
                  <div>
                    <cite className="font-display text-xs uppercase tracking-wider text-gold-450 font-semibold block not-italic">
                      Dr. Michael Adebayo
                    </cite>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-display block mt-1">
                      Distinguished Surgeon &amp; Corporate Delegate
                    </span>
                  </div>
                </div>
              </section>

            </motion.div>
          )}

          {/* PAGE 2: ROOM LISTINGS & ADVANCED VACANCY FILTERS */}
          {tab === 'rooms' && (
            <motion.div
              key="view-rooms"
              initial="page-enter"
              animate="page-enter-active"
              exit="page-enter"
              className="mx-auto max-w-7xl px-6 py-12 md:px-8 space-y-12"
            >
              {/* Header section with page descriptions */}
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-[10px] uppercase font-display tracking-[0.25em] text-gold-505 font-bold block">
                  Luxury Collections
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-luxury-charcoal">
                  Our Exclusive Suites &amp; Rates
                </h2>
                <p className="text-gray-400 text-xs font-light">
                  A high-contrast luxury portal with integrated vacancy tracking filters. Bookings are instantly secured.
                </p>
              </div>

              {/* DYNAMIC AND COMPLEX VACANCY FILTER BOARD */}
              <section className="bg-[#121212] border border-white/10 p-6 rounded-md shadow-sm space-y-4 text-white">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Filter A: Select Room */}
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-widest text-[#d6bb83] font-display mb-1.5 font-bold">
                      Select Room
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 text-white py-2.5 px-3 text-xs rounded focus:outline-none focus:border-gold-400"
                    >
                      <option value="all">All Rooms</option>
                      {rooms.sort((a, b) => a.price - b.price).map((room) => (
                        <option key={room.id} value={room.id}>{room.name} - ₦{room.price.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter B: Minimum Occupants Limit */}
                  <div className="w-full sm:w-48">
                    <label className="block text-[10px] uppercase tracking-widest text-[#d6bb83] font-display mb-1.5 font-bold">
                      Max Guests
                    </label>
                    <select
                      value={filterGuests}
                      onChange={(e) => setFilterGuests(Number(e.target.value))}
                      className="w-full bg-[#161616] border border-white/10 text-white py-2.5 px-3 text-xs rounded focus:outline-none focus:border-gold-400"
                    >
                      <option value={1} className="bg-black text-white">1 Guest</option>
                      <option value={2} className="bg-black text-white">2 Guests</option>
                      <option value={3} className="bg-black text-white">3 Guests</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Dates vacancy checker */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/10 pt-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gold-400 font-display mb-1 font-semibold">
                      Arrival Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={filterCheckIn}
                      onChange={(e) => setFilterCheckIn(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 p-2 text-xs rounded text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gold-400 font-display mb-1 font-semibold">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      min={filterCheckIn || new Date().toISOString().split('T')[0]}
                      value={filterCheckOut}
                      onChange={(e) => setFilterCheckOut(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 p-2 text-xs rounded text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                {/* Dynamic alert indicator for checks validation */}
                {filterCheckIn && filterCheckOut && (
                  <div className="bg-emerald-950/30 text-emerald-400 text-xs p-3 rounded border border-emerald-800/30 italic">
                    Showing only premium suites with verified vacant locks from {filterCheckIn} to {filterCheckOut}.
                  </div>
                )}
                {filterError && (
                  <div className="bg-red-950/30 text-red-400 text-xs p-3 rounded border border-red-800/25">
                    {filterError}
                  </div>
                )}
              </section>

              {/* LISTINGS RENDERING AREA */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {dbService.isUsingFirebase() && !publicCatalogReady ? (
                  <div className="col-span-full text-center py-16 bg-white/5 border border-white/10 rounded-lg max-w-md mx-auto space-y-3 text-white/60">
                    Loading apartment inventory from Firestore...
                  </div>
                ) : filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onSelect={(rm) => setSelectedRoom(rm)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 bg-white border border-dashed border-gold-200/40 rounded-lg max-w-md mx-auto space-y-3">
                    <p className="text-gray-400 text-sm italic font-light">No vacant luxury suite aligns with your selection.</p>
                    <button
                      onClick={() => {
                        setFilterType('all');
                        setFilterGuests(1);
                        setFilterCheckIn('');
                        setFilterCheckOut('');
                      }}
                      className="px-4 py-2 border border-gold-300 text-gold-650 text-xs font-display font-medium uppercase rounded hover:bg-gold-55 cursor-pointer"
                    >
                      Reset Filter Criteria
                    </button>
                  </div>
                )}
              </div>

              {/* TWO CULINARY KITCHENS INFORMATION */}
              <section className="border-t border-white/10 pt-12 space-y-10">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] uppercase font-display tracking-[0.25em] text-[#d6bb83] font-bold block">
                    Culinary Excellence
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                    Two State-of-the-Art Kitchens
                  </h3>
                  <p className="text-gray-400 text-xs font-light">
                    Savor personalized dining experiences with our two independent fully-equipped kitchens.
                  </p>
                </div>

                {dbService.isUsingFirebase() && kitchens.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {kitchens.map((kitchen) => (
                      <div key={kitchen.id} className="bg-[#121212] border border-white/10 rounded-md overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="h-56 w-full overflow-hidden border-b border-white/10 relative group">
                          <img
                            src={kitchen.image}
                            alt={kitchen.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-65"></div>
                        </div>
                        <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full border border-gold-450/20 text-gold-400">
                              {kitchen.name.toLowerCase().includes('primary') ? (
                                <ChefHat className="w-5 h-5 border-none" />
                              ) : (
                                <Utensils className="w-5 h-5 border-none" />
                              )}
                            </div>
                            <h4 className="font-serif text-xl font-medium tracking-tight text-white">
                              {kitchen.name}
                            </h4>
                            <p className="text-white/60 text-xs font-light leading-relaxed">
                              {kitchen.serviceType}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                            {getKitchenFeatures(kitchen).map((f) => (
                              <span key={f} className="px-2.5 py-1 bg-white/5 border border-white/15 rounded text-[10px] uppercase font-semibold tracking-wider text-[#d6bb83]">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${dbService.isUsingFirebase() && kitchens.length > 0 ? 'hidden' : ''}`}>
                  {/* Kitchen 1 details card */}
                  <div className="bg-[#121212] border border-white/10 rounded-md overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="h-56 w-full overflow-hidden border-b border-white/10 relative group">
                      <img
                        src="https://i.ibb.co/XdXKdfr/THIS-KITCHEN-2.png"
                        alt="The Primary Chef’s Gourmet Kitchen"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-65"></div>
                    </div>
                    <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full border border-gold-450/20 text-gold-400">
                           <ChefHat className="w-5 h-5 border-none" />
                        </div>
                        <h4 className="font-serif text-xl font-medium tracking-tight text-white">
                          The Primary Chef’s Gourmet Kitchen
                        </h4>
                        <p className="text-white/60 text-xs font-light leading-relaxed">
                          A grand culinary master station fully equipped with premium stainless appliances, double-door professional refrigeration, high-heat gas and induction stoves, and a pantry stocked with exquisite spices. Perfect for reserving custom meals prepared by our in-house on-demand gourmet chefs or for self-crafted fine dining.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                        {['Professional Chef Access', 'Double Refrigerator', 'Induction Burners', 'Premium Spices & Cookware'].map((f) => (
                          <span key={f} className="px-2.5 py-1 bg-white/5 border border-white/15 rounded text-[10px] uppercase font-semibold tracking-wider text-[#d6bb83]">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Kitchen 2 details card */}
                  <div className="bg-[#121212] border border-white/10 rounded-md overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="h-56 w-full overflow-hidden border-b border-white/10 relative group">
                      <img
                        src="https://i.ibb.co/xt9ThjHx/SECOND-KITCHEN-1.png"
                        alt="The Resident's Morning Pantry & Kitchenette"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-65"></div>
                    </div>
                    <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full border border-gold-450/20 text-gold-400">
                          <Utensils className="w-5 h-5 border-none" />
                        </div>
                        <h4 className="font-serif text-xl font-medium tracking-tight text-white">
                          The Resident's Morning Pantry & Kitchenette
                        </h4>
                        <p className="text-white/60 text-xs font-light leading-relaxed">
                          A beautifully styled secondary kitchenette crafted with sleek granite countertops, dedicated beverage bars, espresso grinders, and automatic micro-appliances. Ideal for preparing light breakfasts, fresh juices, and delicate midnight snacks in complete privacy and discretion.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                        {['Espresso Machine', '24/7 Hot Beverage Bar', 'Granite Finish Counter', 'Premium Microwave & Blenders'].map((f) => (
                          <span key={f} className="px-2.5 py-1 bg-white/5 border border-white/15 rounded text-[10px] uppercase font-semibold tracking-wider text-[#d6bb83]">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* PAGE 3: PHYSICAL LOCATION & CRM-INTEGRATED INQUIRIES */}
          {tab === 'contact' && (
            <motion.div
              key="view-contact"
              initial="page-enter"
              animate="page-enter-active"
              exit="page-enter"
              className="mx-auto max-w-7xl px-6 py-12 md:px-8 space-y-12"
            >
              {/* Heading */}
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-[10px] uppercase font-display tracking-[0.25em] text-gold-400 font-bold block">
                  Location Map
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  Connect &amp; Private Directives
                </h2>
                <p className="text-gray-400 text-xs font-light">
                  Find our premium boutique mansion within Abuja, or submit a custom stay request.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Visual Directives and maps column */}
                <div className="space-y-6">
                  <div className="p-8 bg-[#121212] border border-white/10 rounded-md shadow-sm space-y-6 text-white">
                    <h3 className="font-serif text-2xl font-medium tracking-tight text-white">
                      The Gwarinpa Main Sanctum
                    </h3>
                    <p className="text-white/60 text-sm font-light leading-relaxed">
                      Lex Medicina Residence is strategically established within Abuja's elite residential estate to secure complete tranquility and post-clinical wellness.
                    </p>

                    <div className="space-y-4 text-xs font-light text-white/80">
                      <div className="flex gap-3">
                        <MapPin className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="block font-semibold text-gold-400 font-serif text-sm">Official Physical Address</span>
                          <span className="block mt-1 leading-relaxed text-white/70">
                            House 36, Claude Ake Street (142 Road), Off 14 Road, Gwarinpa Estate, FCT, Nigeria.
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Phone className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="block font-semibold text-gold-400 font-serif text-sm">Dedicated Reservations Line</span>
                          <span className="block mt-1 font-mono hover:text-gold-200 cursor-pointer text-white/70">
                            +234 806 779 8893
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Mail className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="block font-semibold text-gold-400 font-serif text-sm">Corporate Inquiries Mailbox</span>
                          <span className="block mt-1 break-all hover:text-gold-200 cursor-pointer text-white/70">
                            lexmedicinaresidence@gmail.com
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real Live GPS Map & Distance Terminal */}
                  <LiveMapsGPS />
                </div>

                {/* CRM-Sync-capable contact form */}
                <div className="p-8 bg-[#121212] border border-white/10 rounded-lg shadow-sm space-y-6 text-white">
                  <div className="border-b border-white/10 pb-3">
                    <h3 className="font-serif text-2xl font-medium tracking-tight text-white">
                      Inquiry Dispatch
                    </h3>
                    <p className="text-xs text-white/50 font-light mt-1">
                      Leads formulated here instantly stream and notify the Privyr active app.
                    </p>
                  </div>

                  {inquirySuccess ? (
                    <div className="p-6 bg-gold-500/10 border border-gold-400/20 text-center space-y-3 rounded">
                      <Sparkles className="w-8 h-8 text-gold-400 mx-auto" />
                      <h4 className="font-serif text-lg text-white">Lead Dispatched Successfully</h4>
                      <p className="text-xs text-white/60 font-light">
                        Your specifications were structured and pushed. The concierge staff will trigger contact.
                      </p>
                      <button
                        onClick={() => setInquirySuccess(false)}
                        className="px-4 py-2 bg-gold-500 text-black text-[10px] uppercase font-display tracking-wider font-bold hover:bg-gold-600 cursor-pointer"
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-display tracking-widest text-gold-400 font-semibold mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="Dr. Anselm Kingsley"
                          value={inquiryName}
                          onChange={(e) => setInquiryName(e.target.value)}
                          className="w-full bg-[#161616] border border-white/10 text-white placeholder-white/30 rounded p-2.5 focus:border-gold-400 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-display tracking-widest text-gold-400 font-semibold mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+234 803 111 2222"
                            value={inquiryPhone}
                            onChange={(e) => setInquiryPhone(e.target.value)}
                            className="w-full bg-[#161616] border border-white/10 text-white placeholder-white/30 rounded p-2.5 focus:border-gold-400 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-display tracking-widest text-gold-400 font-semibold mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="anselm@hospital.com"
                            value={inquiryEmail}
                            onChange={(e) => setInquiryEmail(e.target.value)}
                            className="w-full bg-[#161616] border border-white/10 text-white placeholder-white/30 rounded p-2.5 focus:border-gold-400 focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-display tracking-widest text-gold-400 font-semibold mb-1">
                          Stay Objectives &amp; Requirements
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Please outline any private medical catering requirements, 24/7 power preferences, or specific check-in times."
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          className="w-full bg-[#161616] border border-white/10 text-white placeholder-white/30 rounded p-2.5 focus:border-gold-400 focus:outline-none text-xs"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={inquiryLoading}
                        className="w-full py-3 bg-gold-500 text-black font-display text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-gold-600 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {inquiryLoading ? 'Synchronizing Lead with Privyr CRM...' : 'DISPATCH TO PRIVYR CRM'}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* PAGE 4: STAFF PORTAL LOGIN */}
          {tab === 'admin-login' && (
            <motion.div
              key="view-admin-login"
              initial="page-enter"
              animate="page-enter-active"
              exit="page-enter"
              className="mx-auto max-w-md px-6 py-16 font-sans text-xs"
            >
              <div className="bg-[#121212] border border-white/10 p-8 rounded-lg shadow-xl space-y-6">
                
                {/* Branding Title */}
                <div className="text-center space-y-2">
                  <span className="inline-flex bg-gold-400/10 text-gold-450 p-2 rounded-full border border-gold-400/20 mb-1">
                    <Shield className="w-5 h-5" />
                  </span>
                  <h3 className="font-serif text-2xl font-bold tracking-tight text-white">
                    Staff Identity Gate
                  </h3>
                  <p className="text-white/50 text-[10px] uppercase tracking-widest font-display">
                    Secure Administrative Access
                  </p>
                </div>

                {adminError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/35 text-red-400 rounded font-medium">
                    {adminError}
                  </div>
                )}

                <form onSubmit={handleAdminSignIn} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-display tracking-widest text-gold-400 font-bold mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="meetanselm@gmail.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 text-white placeholder-white/30 rounded p-2.5 focus:border-gold-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-display tracking-widest text-gold-400 font-bold mb-1 flex justify-between">
                      <span>Owner Password Key</span>
                      <span className="text-[9px] text-[#d6bb83] italic lowercase select-all font-normal">Firebase auth only</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 text-white placeholder-white/30 rounded p-2.5 focus:border-gold-400 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gold-500 text-black font-display text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-gold-600 hover:shadow-lg transition-all cursor-pointer"
                  >
                    AUTHORIZE ACCESS
                  </button>
                </form>

                {dbService.isUsingFirebase() && (
                  <div className="space-y-4 pt-2 border-t border-white/10">
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink mx-4 text-[10px] text-white/45 font-display uppercase tracking-wider font-semibold">Or Authenticate Via</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAdminSignIn}
                      className="w-full py-2.5 px-4 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-display text-[11px] font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Sign In with Google</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PAGE 5: REVENUE & INVENTORY MANAGEMENT DASHBOARD (PROTECTED) */}
          {tab === 'admin-dashboard' && (
            <motion.div
              key="view-admin-dashboard"
              initial="page-enter"
              animate="page-enter-active"
              exit="page-enter"
            >
              {isAdminLoggedIn ? <AdminDashboard setTab={setTab} adminEmail={adminEmail} /> : (
                <div className="mx-auto max-w-md px-6 py-16 text-center space-y-4">
                  <div className="p-6 bg-[#121212] border border-white/10 rounded-lg">
                    <h3 className="font-serif text-2xl text-white">Admin session required</h3>
                    <p className="text-white/60 text-sm mt-2">Please sign in first, then open the dashboard again.</p>
                    <button
                      type="button"
                      onClick={() => setTab('admin-login')}
                      className="mt-4 px-5 py-2 bg-gold-500 text-black text-xs font-bold uppercase tracking-widest rounded"
                    >
                      Go to Sign In
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* PAGE 6: DIGITAL INVOICE SUCCESS PAGE */}
          {tab === 'success-receipt' && (
            <motion.div
              key="view-success"
              initial="page-enter"
              animate="page-enter-active"
              exit="page-enter"
            >
              {recentBooking ? (
                <Receipt 
                  booking={recentBooking} 
                  onDone={() => {
                    setRecentBooking(null);
                    setTab('home');
                  }} 
                />
              ) : (
                <div className="text-center p-16 font-serif">No booking references identified dynamically.</div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Booking Checkout Screen Overlay Modal */}
      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Global Brand Footer */}
      <Footer setTab={setTab} />

      {/* Back to Top floating action button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="back-to-top-btn"
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 10 }}
            onClick={scrollToTop}
            title="Sovereign Ascent to Top"
            className="fixed bottom-6 right-6 z-50 p-3 bg-[#d6bb83] hover:bg-[#c2a975] text-black rounded-full shadow-2xl border border-[#e5d5b3] transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer group"
          >
            <ArrowUp className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </motion.button>
        )}
      </AnimatePresence>
      
    </div>
  );
}
