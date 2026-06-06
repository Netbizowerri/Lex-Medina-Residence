export interface Room {
  id: string;
  name: string;
  type: 'executive' | 'suite';
  price: number; // in NGN (Nigerian Naira) or USD, let's use NGN for Abuja
  is_available: boolean;
  features: string[];
  images: string[];
  max_guests: number;
  description: string;
}

export interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room_id: string;
  check_in: string; // ISO format date (YYYY-MM-DD)
  check_out: string; // ISO format date (YYYY-MM-DD)
  payment_status: 'pending' | 'paid' | 'failed';
  amount_paid: number;
  created_at: string;
}

export interface DashboardStats {
  occupancy_rate: number;
  total_revenue: number;
  active_guests: number;
  pending_bookings: number;
  revenue_by_month: { month: string; amount: number }[];
  occupancy_by_room_type: { name: string; value: number }[];
}

export interface PrivyrConfig {
  webhook_url: string;
  enabled: boolean;
}

// New Firebase-specific types
export interface FirebaseApartment {
  id: string;
  title: string;
  description: string;
  price: number;
  media: { type: 'image' | 'video'; url: string }[];
  features: string[];
  status: 'available' | 'occupied' | 'maintenance';
  createdAt?: any;
}

export type Apartment = FirebaseApartment;

export interface FirebaseKitchen {
  id: string;
  name: string;
  serviceType: string;
  image: string;
  menuLink: string;
}

export type Kitchen = FirebaseKitchen;

export interface FirebaseBooking {
  id?: string;
  guestName: string;
  email: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  paid: boolean;
  privyrSynced: boolean;
}
