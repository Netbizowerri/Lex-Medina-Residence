import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addApartment,
  addKitchen,
  deleteApartment,
  deleteKitchen,
  seedInventoryIfEmpty,
  subscribeToApartments,
  subscribeToBookings,
  subscribeToKitchens,
  updateApartment,
  updateKitchen
} from '../firebase/db';
import { Apartment, Booking, DashboardStats, Kitchen } from '../types';
import { auth } from '../firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { DEFAULT_APARTMENTS, DEFAULT_KITCHENS } from '../firebase/inventorySeed';

export function useRealtimeBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  useEffect(() => {
    const unsub = subscribeToBookings(setBookings);
    return unsub;
  }, []);
  return bookings;
}

export function useFirebaseApollo() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const seededRef = useRef(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const markLoaded = () => {
      if (!hydratedRef.current) {
        hydratedRef.current = true;
        setLoading(false);
      }
    };

    const unsubApartments = subscribeToApartments(items => {
      setApartments(items);
      if (items.length === 0) {
        setApartments(DEFAULT_APARTMENTS.map((ap, idx) => ({ 
          ...ap, 
          id: `apartment-${idx + 1}`,
          createdAt: { seconds: 0, nanoseconds: 0 }
        } as Apartment)));
      }
      markLoaded();
    });
    const unsubKitchens = subscribeToKitchens(items => {
      setKitchens(items);
      if (items.length === 0) {
        setKitchens(DEFAULT_KITCHENS.map((k, idx) => ({ 
          ...k, 
          id: `kitchen-${idx + 1}` 
        } as Kitchen)));
      }
      markLoaded();
    });
    const unsubBookings = subscribeToBookings(items => {
      setBookings(items);
      markLoaded();
    });

    return () => {
      unsubApartments();
      unsubKitchens();
      unsubBookings();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const maybeSeed = async () => {
      if (seededRef.current) return;
      if (!user || user.email?.trim().toLowerCase() !== 'meetanselm@gmail.com') return;
      seededRef.current = true;
      try {
        await seedInventoryIfEmpty();
      } catch (err) {
        console.warn('Inventory seed skipped or failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    maybeSeed();

    if (apartments.length > 0 || kitchens.length > 0) {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [user, apartments.length, kitchens.length]);

  const stats: DashboardStats = useMemo(() => {
    const occupied = apartments.filter(a => a.status === 'occupied').length;
    const maintenance = apartments.filter(a => a.status === 'maintenance').length;
    const available = apartments.filter(a => a.status === 'available').length;
    const totalRevenue = bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + b.amount_paid, 0);
    const pendingBookings = bookings.filter(b => b.payment_status === 'pending').length;
    const activeGuests = bookings.filter(b => {
      if (b.payment_status !== 'paid') return false;
      const start = new Date(b.check_in);
      const end = new Date(b.check_out);
      const now = new Date();
      return now >= start && now <= end;
    }).length;

    return {
      occupancy_rate: apartments.length ? Math.round((occupied / apartments.length) * 100) : 0,
      total_revenue: totalRevenue,
      active_guests: activeGuests,
      pending_bookings: pendingBookings,
      revenue_by_month: [
        { month: 'Jan', amount: Math.round(totalRevenue * 0.08) },
        { month: 'Feb', amount: Math.round(totalRevenue * 0.11) },
        { month: 'Mar', amount: Math.round(totalRevenue * 0.12) },
        { month: 'Apr', amount: Math.round(totalRevenue * 0.13) },
        { month: 'May', amount: Math.round(totalRevenue * 0.17) },
        { month: 'Jun', amount: Math.round(totalRevenue * 0.39) }
      ],
      occupancy_by_room_type: [
        { name: 'Available', value: available },
        { name: 'Occupied', value: occupied },
        { name: 'Maintenance', value: maintenance }
      ]
    };
  }, [apartments, bookings]);

  const updateApartmentLocal = useMemo(() => ({
    add: async (data: Omit<Apartment, 'id' | 'createdAt'>) => {
      const id = await addApartment(data);
      setApartments(prev => [...prev, { ...data, id } as Apartment]);
    },
    update: async (id: string, data: Partial<Apartment>) => {
      await updateApartment(id, data);
      setApartments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    },
    remove: async (id: string) => {
      await deleteApartment(id);
      setApartments(prev => prev.filter(a => a.id !== id));
    }
  }), []);

  const updateKitchenLocal = useMemo(() => ({
    add: async (data: Omit<Kitchen, 'id'>) => {
      const id = await addKitchen(data);
      setKitchens(prev => [...prev, { ...data, id } as Kitchen]);
    },
    update: async (id: string, data: Partial<Kitchen>) => {
      await updateKitchen(id, data);
      setKitchens(prev => prev.map(k => k.id === id ? { ...k, ...data } : k));
    },
    remove: async (id: string) => {
      await deleteKitchen(id);
      setKitchens(prev => prev.filter(k => k.id !== id));
    }
  }), []);

  return { apartments, kitchens, bookings, loading, user, stats, updateApartmentLocal, updateKitchenLocal };
}
