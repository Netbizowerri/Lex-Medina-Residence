import { useMemo, type ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';

export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}

export const isAdminEmail = (email: string | null | undefined) =>
  email?.trim().toLowerCase() === 'meetanselm@gmail.com';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const guardContent = useMemo(() => {
    return (
      <AuthGuard>
        {children}
      </AuthGuard>
    );
  }, [children]);

  return <>{guardContent}</>;
}
