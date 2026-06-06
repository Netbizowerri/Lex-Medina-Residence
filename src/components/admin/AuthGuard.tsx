import { useEffect, useState, type ReactNode } from 'react';
import { auth } from '../../firebase/config';
import { onAuthStateChanged, type User } from 'firebase/auth';

type Session = { user: User } | null;

export function AuthGuard({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setSession(u);
      setReady(true);
    });
    return unsub;
  }, []);

  if (!ready) return <div className="p-8 text-white/60">Loading session...</div>;
  if (!session) return <div className="p-8 text-white/70">Unauthenticated. Please sign in.</div>;
  if (session.user.email?.trim().toLowerCase() !== 'meetanselm@gmail.com') {
    return <div className="p-8 text-red-400">Forbidden: administrative access requires meetanselm@gmail.com.</div>;
  }

  return <>{children}</>;
}
