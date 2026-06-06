/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ReactNode } from 'react';
import { AdminPanel } from '../AdminPanel';

interface AdminDashboardProps {
  setTab?: (tab: string) => void;
  adminEmail?: string;
}

export default function AdminDashboard({ setTab = () => {}, adminEmail = '' }: AdminDashboardProps) {
  return <AdminPanel setTab={setTab} adminEmail={adminEmail} />;
}