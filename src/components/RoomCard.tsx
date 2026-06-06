import React from 'react';
import { Room } from '../types';
import { Check, Users, ShieldCheck, ArrowRight } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onSelect: (room: Room) => void;
  key?: string;
}

export function RoomCard({ room, onSelect }: RoomCardProps) {
  // Format price in Nigerian Naira (₦)
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-md border border-white/10 bg-[#121212] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* High-Resolution Room Image Gallery with Skeleton Overlay */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
        <img
          src={room.images[0] || 'https://picsum.photos/seed/suite/600/450'}
          alt={room.name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Availability Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`px-3 py-1 font-display text-[10px] font-semibold tracking-widest uppercase rounded-full shadow-sm ${
            room.is_available 
              ? 'bg-black/80 text-gold-400 border border-gold-500/40' 
              : 'bg-red-950/90 text-red-100 border border-red-800/40'
          }`}>
            {room.is_available ? 'Available' : 'Fully Booked'}
          </span>
        </div>

        {/* Backdrop visual gradient */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent z-10" />

        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 text-white/95 text-xs font-display">
          <Users className="w-3.5 h-3.5 text-gold-400" />
          <span>Accommodates up to {room.max_guests} Guests</span>
        </div>
      </div>

      {/* Card Information Body */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-serif text-xl font-medium tracking-tight text-white group-hover:text-gold-400 transition-colors">
            {room.name}
          </h3>
          <div className="text-right">
            <span className="block font-serif text-lg font-semibold text-gold-400">
              {formatNaira(room.price)}
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-[#F5F5F0]/40 font-display -mt-1">
              per night
            </span>
          </div>
        </div>

        <p className="mb-5 text-[#F5F5F0]/60 text-xs leading-relaxed font-light line-clamp-3">
          {room.description}
        </p>

        {/* Specific Luxury Highlight Badges */}
        <div className="mb-6 grid grid-cols-2 gap-y-2 gap-x-4 border-t border-white/5 pt-4">
          {room.features.slice(0, 4).map((feature, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[#F5F5F0]/80">
              <Check className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <span className="text-[11px] font-sans font-light truncate">{feature}</span>
            </div>
          ))}
        </div>

        {/* Checkout / Booking Action CTA */}
        <div className="mt-auto">
          <button
            onClick={() => onSelect(room)}
            disabled={!room.is_available}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-display text-xs font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer ${
              room.is_available
                ? 'bg-gold-500 text-black hover:bg-gold-600 hover:shadow-md'
                : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
            }`}
          >
            <span>{room.is_available ? 'RESERVE THIS SUITE' : 'LOCK OUT'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
