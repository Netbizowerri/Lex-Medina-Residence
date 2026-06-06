import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { Apartment, Kitchen, Booking } from '../types';
import { DEFAULT_APARTMENTS, DEFAULT_KITCHENS } from './inventorySeed';

const apartmentsCol = collection(db, 'apartments');
const kitchensCol = collection(db, 'kitchens');
const bookingsCol = collection(db, 'bookings');

type BookingRecord = Record<string, unknown> & {
  checkIn?: unknown;
  checkOut?: unknown;
  check_in?: unknown;
  check_out?: unknown;
  guestName?: unknown;
  guest_name?: unknown;
  email?: unknown;
  guest_email?: unknown;
  phone?: unknown;
  guest_phone?: unknown;
  roomId?: unknown;
  room_id?: unknown;
  payment_status?: unknown;
  amount_paid?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
};

const toDateString = (value: unknown) => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString().split('T')[0];
  }

  if (typeof value === 'string' && value) {
    return value.includes('T') ? value.split('T')[0] : value;
  }

  return '';
};

const toIsoString = (value: unknown) => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === 'string' && value) {
    return value;
  }

  return new Date().toISOString();
};

const normalizeBooking = (data: BookingRecord): Booking => ({
  id: typeof data.id === 'string' ? data.id : '',
  guest_name: typeof data.guest_name === 'string'
    ? data.guest_name
    : typeof data.guestName === 'string'
      ? data.guestName
      : '',
  guest_email: typeof data.guest_email === 'string'
    ? data.guest_email
    : typeof data.email === 'string'
      ? data.email
      : '',
  guest_phone: typeof data.guest_phone === 'string'
    ? data.guest_phone
    : typeof data.phone === 'string'
      ? data.phone
      : '',
  room_id: typeof data.room_id === 'string'
    ? data.room_id
    : typeof data.roomId === 'string'
      ? data.roomId
      : '',
  check_in: toDateString(data.check_in ?? data.checkIn),
  check_out: toDateString(data.check_out ?? data.checkOut),
  payment_status: data.payment_status === 'paid' || data.payment_status === 'failed' ? data.payment_status : 'pending',
  amount_paid: typeof data.amount_paid === 'number' ? data.amount_paid : 0,
  created_at: toIsoString(data.created_at ?? data.createdAt)
});

export const getApartments = async (): Promise<Apartment[]> => {
  const q = query(apartmentsCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Apartment));
};

export const subscribeToApartments = (callback: (items: Apartment[]) => void) =>
  onSnapshot(query(apartmentsCol, orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Apartment)));
  });

export const getKitchens = async (): Promise<Kitchen[]> => {
  const q = query(kitchensCol, orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Kitchen));
};

export const subscribeToKitchens = (callback: (items: Kitchen[]) => void) =>
  onSnapshot(query(kitchensCol, orderBy('name', 'asc')), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Kitchen)));
  });

export const addApartment = async (data: Omit<Apartment, 'id' | 'createdAt'>) => {
  const ref = doc(apartmentsCol);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
};

export const updateApartment = async (id: string, data: Partial<Apartment>) => {
  await updateDoc(doc(apartmentsCol, id), data);
};

export const deleteApartment = async (id: string) => {
  await deleteDoc(doc(apartmentsCol, id));
};

export const addKitchen = async (data: Omit<Kitchen, 'id'>) => {
  const ref = doc(kitchensCol);
  await setDoc(ref, data);
  return ref.id;
};

export const updateKitchen = async (id: string, data: Partial<Kitchen>) => {
  await updateDoc(doc(kitchensCol, id), data);
};

export const deleteKitchen = async (id: string) => {
  await deleteDoc(doc(kitchensCol, id));
};

export const getBookings = async (): Promise<Booking[]> => {
  const q = query(bookingsCol, orderBy('checkIn', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => normalizeBooking({ id: d.id, ...d.data() } as BookingRecord));
};

export const subscribeToBookings = (callback: (bookings: Booking[]) => void) => {
  const q = query(bookingsCol, orderBy('checkIn', 'desc'));
  return onSnapshot(q, snap => {
    const items = snap.docs.map(d => normalizeBooking({ id: d.id, ...d.data() } as BookingRecord));
    callback(items);
  });
};

export const addBooking = async (data: Omit<Booking, 'id'>) => {
  const ref = doc(bookingsCol);
  await setDoc(ref, {
    ...data,
    guestName: data.guest_name,
    email: data.guest_email,
    phone: data.guest_phone,
    roomId: data.room_id,
    checkIn: Timestamp.fromDate(new Date(data.check_in)),
    checkOut: Timestamp.fromDate(new Date(data.check_out)),
    check_in: data.check_in,
    check_out: data.check_out
  });
  return ref.id;
};

export const seedInventoryIfEmpty = async () => {
  const [apSnap, kSnap] = await Promise.all([getDocs(apartmentsCol), getDocs(kitchensCol)]);

  if (apSnap.empty) {
    await Promise.all(
      DEFAULT_APARTMENTS.map((item, idx) =>
        setDoc(doc(apartmentsCol, `apartment-${idx + 1}`), {
          ...item,
          createdAt: serverTimestamp()
        })
      )
    );
  }

  if (kSnap.empty) {
    await Promise.all(
      DEFAULT_KITCHENS.map((item, idx) =>
        setDoc(doc(kitchensCol, `kitchen-${idx + 1}`), item)
      )
    );
  }
};
