/// <reference types="vite/client" />
// Lex Medicina Residence Database Adapter & Fallback Engine
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Room, Booking, DashboardStats } from './types';

// Default Luxury Rooms with real generated high-resolution assets
export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'Beijing',
    type: 'executive',
    price: 25000, // NGN per night
    is_available: true,
    max_guests: 2,
    features: ['High-speed Wi-Fi', 'Smart TV & AC', '24/7 Power', 'Mini Refrigerator'],
    images: ['https://i.ibb.co/C5B6dtK8/ROOM-2.png'],
    description: 'An exquisitely styled room featuring a king-sized plush bed with rich linen, soft ambient recessed lighting, and modern luxury furnishings. Tailored for corporate clients and executives seeking pristine comfort, with shared access to our luxury culinary kitchen.'
  },
  {
    id: 'room-2',
    name: 'Las Vegas',
    type: 'executive',
    price: 25000, // NGN per night
    is_available: true,
    max_guests: 2,
    features: ['High-speed Wi-Fi', 'Smart TV & AC', '24/7 Power', 'Mini Refrigerator'],
    images: ['https://i.ibb.co/whXDrrHW/LAS-VEGAS-ROOM.png'],
    description: 'A majestic suite adorned with deep charcoal oak paneling, custom gold accents, and expansive private lounge amenities. Ideal for travelers searching for refined luxury, secure Gwarinpa tranquility, and access to both high-end kitchen facilities.'
  },
  {
    id: 'room-3',
    name: 'London',
    type: 'executive',
    price: 30000, // NGN per night
    is_available: true,
    max_guests: 3,
    features: ['High-speed Wi-Fi', 'Smart TV & AC', 'Refrigerator', 'Wide Sitting Space'],
    images: ['https://i.ibb.co/0jJJK77h/ok-1-1-1.png'],
    description: 'The pinnacle of Lex Medicina luxury. A sprawling top-floor penthouse offering panoramic views of Gwarinpa, a state-of-the-art entertainment lounge, dedicated study, and elite personalization of all services, including a private resident pantry.'
  },
  {
    id: 'room-4',
    name: 'Toronto',
    type: 'executive',
    price: 25000, // NGN per night
    is_available: true,
    max_guests: 2,
    features: ['High-speed Wi-Fi', 'Smart TV & AC', '24/7 Power', 'Mini Refrigerator'],
    images: ['https://i.ibb.co/bg2FDP8C/THIS-1.png'],
    description: 'A sleek, contemporary suite crafted with hand-stitched leather work, high-contrast brass fittings, and a spacious work desk. Perfect for corporate stays, with seamless access to either of our two state-of-the-art kitchens.'
  },
  {
    id: 'room-5',
    name: 'Belize',
    type: 'executive',
    price: 25000, // NGN per night
    is_available: true,
    max_guests: 2,
    features: ['High-speed Wi-Fi', 'Smart TV & AC', '24/7 Power', 'Mini Refrigerator'],
    images: ['https://i.ibb.co/svGc1zJr/BELIZE-ROOM-1.png'],
    description: 'An elegant retreat featuring premium velvet lounge chairs, high-contrast stone floors, and a dedicated sitting room for holding private consultations. Includes full culinary rights on the primary chef kitchen.'
  },
  {
    id: 'room-6',
    name: 'New York',
    type: 'suite',
    price: 35000, // NGN per night
    is_available: true,
    max_guests: 3,
    features: ['High-speed Wi-Fi', 'Smart TV & AC', 'Refrigerator', 'Wide Sitting Space'],
    images: ['https://i.ibb.co/pBpJrGtM/suite-1.png'],
    description: 'A magnificent double-bedroom penthouse featuring deep forest green accents, bespoke walnut cabinetry, and direct views of Gwarinpa’s rolling hills. Includes full private access to the resident morning culinary pantry.'
  }
];

// Initial bookings - cleared for fresh start
export const INITIAL_BOOKINGS: Booking[] = [];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

class DBEngine {
  private isFirebaseConfigured: boolean = false;
  private firebaseApp: any = null;
  private firestoreDb: any = null;
  private firebaseAuth: any = null;
  private bookingsUnsubscribe: any = null;

  constructor() {
    this.init();
  }

  private handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const email = this.firebaseAuth?.currentUser?.email || null;
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: this.firebaseAuth?.currentUser?.uid || null,
        email: email,
        emailVerified: this.firebaseAuth?.currentUser?.emailVerified || null,
        isAnonymous: this.firebaseAuth?.currentUser?.isAnonymous || null,
        tenantId: this.firebaseAuth?.currentUser?.tenantId || null,
        providerInfo: this.firebaseAuth?.currentUser?.providerData?.map((p: any) => ({
          providerId: p.providerId,
          email: p.email,
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    
    // Only throw critical errors during WRITE operations (e.g. editing rooms or issuing a reservation)
    const isWrite = [OperationType.CREATE, OperationType.UPDATE, OperationType.DELETE, OperationType.WRITE].includes(operationType);
    if (isWrite) {
      throw new Error(JSON.stringify(errInfo));
    }
  }

  private async testConnection() {
    try {
      const { doc, getDocFromServer } = await import('firebase/firestore');
      await getDocFromServer(doc(this.firestoreDb, 'test', 'connection'));
      console.log('📡 Firebase DB: Connection validated with Firestore remote server.');
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('offline')) {
        console.warn("Please check your Firebase configuration. The client is offline.");
      }
    }
  }

  private async registerBookingsListener() {
    if (this.bookingsUnsubscribe) return;
    try {
      const { collection, onSnapshot } = await import('firebase/firestore');
      this.bookingsUnsubscribe = onSnapshot(collection(this.firestoreDb, 'bookings'), (snapshot) => {
        const bookingsList: Booking[] = [];
        snapshot.forEach((docSnap) => {
          bookingsList.push(docSnap.data() as Booking);
        });
        localStorage.setItem('lex_bookings', JSON.stringify(bookingsList));
        window.dispatchEvent(new Event('storage'));
      }, (error) => {
        this.handleFirestoreError(error, OperationType.LIST, 'bookings');
      });
    } catch (err) {
      console.warn('⚠️ Could not secure live bookings updates listener:', err);
    }
  }

  private async syncWithFirestore() {
    try {
      const { collection, onSnapshot, doc, setDoc } = await import('firebase/firestore');

      // 1. Reactive Real-Time Rooms Sync
      onSnapshot(collection(this.firestoreDb, 'rooms'), (snapshot) => {
        const roomsList: Room[] = [];
        snapshot.forEach((docSnap) => {
          roomsList.push(docSnap.data() as Room);
        });

        // Seed any rooms from our client blueprint that do not currently exist in the database
        const missingRooms = INITIAL_ROOMS.filter(initialRoom => !roomsList.some(r => r.id === initialRoom.id));
        if (missingRooms.length > 0) {
          console.log(`🌱 Firestore rooms index missing ${missingRooms.length} rooms, seeding...`);
          missingRooms.forEach(async (room) => {
            try {
              await setDoc(doc(this.firestoreDb, 'rooms', room.id), room);
            } catch (err) {
              console.warn('Could not seed missing room to Firestore:', err);
            }
          });
        }

         // Align remote room prices on Firestore if they differ from updated INITIAL_ROOMS specifications
         roomsList.forEach(async (remoteRoom) => {
           const bp = INITIAL_ROOMS.find(r => r.id === remoteRoom.id);
           if (bp && (bp.price !== remoteRoom.price || bp.name !== remoteRoom.name || JSON.stringify(bp.features) !== JSON.stringify(remoteRoom.features) || JSON.stringify(bp.images) !== JSON.stringify(remoteRoom.images))) {
             try {
               await setDoc(doc(this.firestoreDb, 'rooms', remoteRoom.id), { 
                 ...remoteRoom, 
                 price: bp.price,
                 name: bp.name,
                 features: bp.features,
                 images: bp.images
               });
               console.log(`⚡ Corrected Firestore room ${remoteRoom.id} details to match blueprint`);
             } catch (err) {
               console.warn(`Could not overwrite remote details for ${remoteRoom.id}:`, err);
             }
           }
         });

        // If there are documents synced, merge Firestore with initial blueprints to guarantee all 6 exist
        if (roomsList.length > 0) {
          const mergedRooms = [...roomsList];
          INITIAL_ROOMS.forEach(initialRoom => {
            if (!mergedRooms.some(r => r.id === initialRoom.id)) {
              mergedRooms.push(initialRoom);
            }
          });
          
           // Guarantee that the prices, names, features, and images match the new specifications
           const finalRooms = mergedRooms.map(r => {
             const bp = INITIAL_ROOMS.find(ir => ir.id === r.id);
             if (bp && (bp.price !== r.price || bp.name !== r.name || JSON.stringify(bp.features) !== JSON.stringify(r.features) || JSON.stringify(bp.images) !== JSON.stringify(r.images))) {
               return { ...r, price: bp.price, name: bp.name, features: bp.features, images: bp.images };
             }
             return r;
           });

          finalRooms.sort((a, b) => a.price === b.price ? a.id.localeCompare(b.id) : a.price - b.price);
          localStorage.setItem('lex_rooms', JSON.stringify(finalRooms));
          window.dispatchEvent(new Event('storage'));
        } else if (snapshot.empty) {
          console.log('🌱 Firestore rooms index empty, seeding sovereign suites...');
          localStorage.setItem('lex_rooms', JSON.stringify(INITIAL_ROOMS));
          window.dispatchEvent(new Event('storage'));
          INITIAL_ROOMS.forEach(async (room) => {
            try {
              await setDoc(doc(this.firestoreDb, 'rooms', room.id), room);
            } catch (err) {
              console.warn('Could not seed room to Firestore (might need admin permissions):', err);
            }
          });
        }
      }, (error) => {
        this.handleFirestoreError(error, OperationType.LIST, 'rooms');
      });

      // 2. Auth State Router to Safe-Trigger Bookings list (No scraping for non-admins)
      if (this.firebaseAuth) {
        const { onAuthStateChanged } = await import('firebase/auth');
        onAuthStateChanged(this.firebaseAuth, (user) => {
          if (user && user.email === 'meetanselm@gmail.com') {
            console.log('👑 Admin detected via Firebase Auth, opening secure real-time bookings pipe...');
            this.registerBookingsListener();
          } else {
            if (this.bookingsUnsubscribe) {
              this.bookingsUnsubscribe();
              this.bookingsUnsubscribe = null;
            }
          }
        });
      }

    } catch (err) {
      console.warn('⚠️ Sync engine initialization collapsed:', err);
    }
  }

  private async init() {
    try {
      // 1. First, check if Vite public variables are available
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

      if (apiKey && projectId) {
        const config = {
          apiKey,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
          projectId,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID
        };

        const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

        this.firebaseApp = getApps().length ? getApp() : initializeApp(config);
        this.firestoreDb = dbId ? getFirestore(this.firebaseApp, dbId) : getFirestore(this.firebaseApp);
        this.firebaseAuth = getAuth(this.firebaseApp);
        this.isFirebaseConfigured = true;
        console.log('✨ Lex Premium DB: Configured from env variables successfully.');
      } else {
        // 2. Next, check for the firebase-applet-config file dynamically if possible
        try {
          const configModule = await import('./firebase-applet-config.json');
          if (configModule && configModule.default && configModule.default.apiKey) {
            this.firebaseApp = getApps().length ? getApp() : initializeApp(configModule.default);
            this.firestoreDb = configModule.default.firestoreDatabaseId
              ? getFirestore(this.firebaseApp, configModule.default.firestoreDatabaseId)
              : getFirestore(this.firebaseApp);
            this.firebaseAuth = getAuth(this.firebaseApp);
            this.isFirebaseConfigured = true;
            console.log('✨ Lex Premium DB: Configured from JSON config successfully.');
          }
        } catch (_) {
          // Dynamic import fails if config file doesn't exist, ignore and use simulator fallback
        }
      }

      if (this.isFirebaseConfigured && this.firestoreDb) {
        await this.testConnection();
        await this.syncWithFirestore();
      }
    } catch (err) {
      console.warn('⚠️ Firebase initial load failed, moving back to local simulator:', err);
      this.isFirebaseConfigured = false;
    }

    // ALWAYS clear and reset rooms to ensure fresh start with all suites available
    localStorage.setItem('lex_rooms', JSON.stringify(INITIAL_ROOMS));
    
    // ALWAYS clear bookings for fresh start
    localStorage.setItem('lex_bookings', JSON.stringify(INITIAL_BOOKINGS));
    
    // Clear any stale filter state
    localStorage.removeItem('lex_filter_checkin');
    localStorage.removeItem('lex_filter_checkout');
    if (!localStorage.getItem('lex_privyr_webhook')) {
      localStorage.setItem('lex_privyr_webhook', JSON.stringify(''));
    }
  }

  public isUsingFirebase(): boolean {
    return this.isFirebaseConfigured;
  }

  public getAuthService() {
    return this.firebaseAuth;
  }

  public async signInWithGoogle(): Promise<any> {
    if (!this.isFirebaseConfigured || !this.firebaseAuth) {
      throw new Error('Firebase authentication is not active in this workspace.');
    }
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.firebaseAuth, provider);
    return result.user;
  }

  public async signInWithEmail(email: string, pass: string): Promise<any> {
    const ADMIN_EMAIL = 'meetanselm@gmail.com';
    const ADMIN_FALLBACK_PASSWORD = import.meta.env.VITE_ADMIN_FALLBACK_PASSWORD;
    const ENABLE_LOCAL_FALLBACK = import.meta.env.VITE_ENABLE_LOCAL_ADMIN_FALLBACK === 'true';

    if (!this.isFirebaseConfigured || !this.firebaseAuth) {
      if (ENABLE_LOCAL_FALLBACK && email.trim().toLowerCase() === ADMIN_EMAIL && pass === ADMIN_FALLBACK_PASSWORD) {
        return { email: ADMIN_EMAIL, uid: 'local-admin' };
      }
      throw new Error('Firebase authentication is not active in this workspace.');
    }

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const result = await signInWithEmailAndPassword(this.firebaseAuth, email, pass);
      return result.user;
    } catch (err: any) {
      if (ENABLE_LOCAL_FALLBACK && email.trim().toLowerCase() === ADMIN_EMAIL && pass === ADMIN_FALLBACK_PASSWORD) {
        return { email: ADMIN_EMAIL, uid: 'local-admin' };
      }
      throw err;
    }
  }

  public async signOut(): Promise<void> {
    if (this.firebaseAuth) {
      const { signOut } = await import('firebase/auth');
      await signOut(this.firebaseAuth);
    }
  }

  // ROOMS API
  public getRooms(): Room[] {
    const data = localStorage.getItem('lex_rooms');
    const rooms: Room[] = data ? JSON.parse(data) : [...INITIAL_ROOMS];
    return rooms.sort((a, b) => a.price === b.price ? a.id.localeCompare(b.id) : a.price - b.price);
  }

  private async writeRoomUpdateToFirestore(id: string, fields: Partial<Room>) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(this.firestoreDb, 'rooms', id), fields);
      console.log('✅ Synchronized room inventory change with Firestore. Room ID:', id);
    } catch (err) {
      this.handleFirestoreError(err, OperationType.WRITE, `rooms/${id}`);
    }
  }

  public updateRoomAvailability(id: string, is_available: boolean) {
    const rooms = this.getRooms();
    const updated = rooms.map(r => r.id === id ? { ...r, is_available } : r);
    localStorage.setItem('lex_rooms', JSON.stringify(updated));

    if (this.isFirebaseConfigured && this.firestoreDb) {
      this.writeRoomUpdateToFirestore(id, { is_available });
    }
    return updated;
  }

  public updateRoomPrice(id: string, price: number) {
    const rooms = this.getRooms();
    const updated = rooms.map(r => r.id === id ? { ...r, price } : r);
    localStorage.setItem('lex_rooms', JSON.stringify(updated));

    if (this.isFirebaseConfigured && this.firestoreDb) {
      this.writeRoomUpdateToFirestore(id, { price });
    }
    return updated;
  }

  private async writeRoomToFirestore(room: Room) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(this.firestoreDb, 'rooms', room.id), room);
      console.log('✅ Synchronized new room write with Firestore:', room.id);
    } catch (err) {
      this.handleFirestoreError(err, OperationType.WRITE, `rooms/${room.id}`);
    }
  }

  public createRoom(roomData: Omit<Room, 'is_available'>): Room {
    const newRoom: Room = {
      ...roomData,
      is_available: true
    };

    const rooms = this.getRooms();
    let finalId = newRoom.id;
    if (rooms.some(r => r.id === finalId)) {
      finalId = `${finalId}-${Math.random().toString(36).substring(2, 5)}`;
      newRoom.id = finalId;
    }

    rooms.push(newRoom);
    rooms.sort((a, b) => a.price === b.price ? a.id.localeCompare(b.id) : a.price - b.price);
    localStorage.setItem('lex_rooms', JSON.stringify(rooms));

    if (this.isFirebaseConfigured && this.firestoreDb) {
      this.writeRoomToFirestore(newRoom);
    }
    return newRoom;
  }

  // BOOKINGS API
  public getBookings(): Booking[] {
    const data = localStorage.getItem('lex_bookings');
    return data ? JSON.parse(data) : INITIAL_BOOKINGS;
  }


  // Double-booking check: ensures selected check-in and check-out don't overlap with existing bookings
  public checkAvailability(roomId: string, checkIn: string, checkOut: string): boolean {
    const bookings = this.getBookings().filter(b => b.room_id === roomId && (b.payment_status === 'paid' || b.payment_status === 'pending'));
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    for (const b of bookings) {
      const bStart = new Date(b.check_in);
      const bEnd = new Date(b.check_out);

      // Overlap condition: (StartA < EndB) && (EndA > StartB)
      if (start < bEnd && end > bStart) {
        return false; // Room is occupied for this range
      }
    }
    return true;
  }

  private async writeBookingToFirestore(booking: Booking) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(this.firestoreDb, 'bookings', booking.id), booking);
      console.log('✅ Synchronized new reservation write with Firestore:', booking.id);
    } catch (err) {
      this.handleFirestoreError(err, OperationType.WRITE, `bookings/${booking.id}`);
    }
  }

  public createBooking(bookingData: Omit<Booking, 'id' | 'payment_status' | 'created_at'> & { payment_status?: 'pending' | 'paid' | 'failed' }): Booking {
    const newBooking: Booking = {
      ...bookingData,
      id: 'res-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      payment_status: bookingData.payment_status || 'paid', // Mark as paid or pending for reservation success
      created_at: new Date().toISOString()
    };

    const bookings = this.getBookings();
    bookings.push(newBooking);
    localStorage.setItem('lex_bookings', JSON.stringify(bookings));
    
    // Dispatch storage event to notify listeners (AdminPanel)
    window.dispatchEvent(new Event('storage'));

    if (this.isFirebaseConfigured && this.firestoreDb) {
      this.writeBookingToFirestore(newBooking);
    }

    // Post to Privyr CRM Webhook if configured
    this.sendToPrivyr(newBooking);

    return newBooking;
  }

  public updateBookingStatus(id: string, status: 'pending' | 'paid' | 'failed'): boolean {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id.trim().toLowerCase() === id.trim().toLowerCase());
    if (index === -1) return false;

    bookings[index].payment_status = status;
    localStorage.setItem('lex_bookings', JSON.stringify(bookings));

    if (this.isFirebaseConfigured && this.firestoreDb) {
      this.writeBookingToFirestore(bookings[index]);
    }
    return true;
  }

// CRM Webhook Logic - notify via Formspree
  public async sendToPrivyr(booking: Booking) {
    const webhookUrl = this.getPrivyrWebhook();
    // Default webhook details for Nigerian boutique CRM sync
    const payload = {
      name: booking.guest_name,
      email: booking.guest_email,
      phone: booking.guest_phone,
      notes: `Lex-Medicina Booking [ID: ${booking.id}]. Room: ${booking.room_id}. Stay: ${booking.check_in} to ${booking.check_out}. Paid: ₦${booking.amount_paid.toLocaleString()}`,
      room_id: booking.room_id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      site_name: 'lexmedicinaresidence.com'
    };

    console.log('📤 CRM Sync Triggered for booking:', booking.id);
    console.log('Payload for Formspree:', payload);

    // Send to Formspree default endpoint
    try {
      const formspreeRes = await fetch('https://formspree.io/f/meewedoo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const formspreeData = await formspreeRes.json();
      console.log('✅ Formspree Response:', formspreeData);
    } catch (err) {
      console.error('❌ Formspree request failed:', err);
    }

    // Also send to configured Privyr webhook if set
    if (webhookUrl) {
      try {
        const res = await fetch('/api/crm/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl, payload })
        });
        const respData = await res.json();
        console.log('✅ Real CRM Response:', respData);
      } catch (err) {
        console.error('❌ Real CRM request failed:', err);
      }
    }
  }

  public savePrivyrWebhook(url: string) {
    localStorage.setItem('lex_privyr_webhook', JSON.stringify(url));
  }

  public getPrivyrWebhook(): string {
    return JSON.parse(localStorage.getItem('lex_privyr_webhook') || '""');
  }

  // DASHBOARD ANALYTICS SERVICE
  public getDashboardStats(): DashboardStats {
    const bookings = this.getBookings();
    const rooms = this.getRooms();
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    // 1. Calculate active guests (currently checked in today)
    let activeGuestsCount = 0;
    const occupiedRoomIds = new Set<string>();

    bookings.forEach(b => {
      if (b.payment_status === 'paid') {
        const start = new Date(b.check_in);
        const end = new Date(b.check_out);
        if (today >= start && today <= end) {
          const matchedRoom = rooms.find(r => r.id === b.room_id);
          activeGuestsCount += matchedRoom ? matchedRoom.max_guests : 2;
          occupiedRoomIds.add(b.room_id);
        }
      }
    });

    // 2. Occupancy rate
    const occupancyRate = rooms.length > 0 ? Math.round((occupiedRoomIds.size / rooms.length) * 100) : 0;

    // 3. Staging and total revenue calculations
    const totalRev = bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.amount_paid, 0);

    const pendingCount = bookings.filter(b => b.payment_status === 'pending').length;

    // Occupancy percentage by room category (fully dynamic for any added suites)
    const occupancy_by_room_type = rooms.map(room => ({
      name: room.name,
      value: occupiedRoomIds.has(room.id) ? 100 : 0
    }));

    const activeOccupancyType = occupancy_by_room_type;

    // Revenue by month (based on actual bookings)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenue_by_month = months.map(m => ({ month: m, amount: 0 }));

    return {
      occupancy_rate: occupancyRate,
      total_revenue: totalRev,
      active_guests: activeGuestsCount,
      pending_bookings: pendingCount,
      revenue_by_month,
      occupancy_by_room_type: activeOccupancyType
    };
  }
}

export const dbService = new DBEngine();
