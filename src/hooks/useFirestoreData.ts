import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Apartment, Kitchen } from '../types';

export function useFirestoreData() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [apSnap, kSnap] = await Promise.all([
          getDocs(query(collection(db, 'apartments'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'kitchens'), orderBy('name', 'asc')))
        ]);
        if (cancelled) return;
        setApartments(apSnap.docs.map(d => ({ id: d.id, ...d.data() } as Apartment)));
        setKitchens(kSnap.docs.map(d => ({ id: d.id, ...d.data() } as Kitchen)));
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return { apartments, kitchens, ready };
}
