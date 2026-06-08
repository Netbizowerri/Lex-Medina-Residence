import React, { useState } from 'react';
import { Menu, X, Landmark, Compass, PhoneCall } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isFirebaseConnected: boolean;
}

export function Header({ currentTab, setTab, isFirebaseConnected }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Residence', icon: Compass },
    { id: 'rooms', label: 'Rooms & Rates', icon: Landmark },
    { id: 'contact', label: 'Location & Contact', icon: PhoneCall },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm">
      {/* Top micro status bar */}
      <div className="hidden border-b border-gray-200/50 bg-gray-50 py-2 px-6 text-[11px] uppercase tracking-widest text-gray-500 md:flex justify-between items-center font-display">
        <div className="flex items-center gap-4">
          <span>📞 +234 8067798893</span>
          <span className="w-1.5 h-1.5 bg-gold-600 rounded-full animate-pulse"></span>
          <span>📍 Gwarinpa Estate, Abuja, Nigeria</span>
        </div>
        <div className="flex items-center gap-3">
          {isFirebaseConnected ? (
            <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Secure Firebase Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-700 text-[10px] bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Local Database Engine
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-8">
        {/* Brand Identity / Logo */}
        <button 
          onClick={() => setTab('home')}
          className="flex items-center focus:outline-none group cursor-pointer"
        >
          <img 
            src="https://i.ibb.co/7Jvy2BD3/hero-1-removebg-preview-1-compressed.png" 
            alt="Lex Medicina Logo" 
            referrerPolicy="no-referrer"
            className="h-14 w-auto object-contain transition-transform group-hover:scale-102 duration-300"
          />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-display text-sm font-medium">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`relative py-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive 
                    ? 'text-gold-600 font-semibold' 
                    : 'text-gray-600 hover:text-gold-600'
                }`}
              >
                <Icon className="w-4 h-4 opacity-70" />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-gold-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => setTab('rooms')}
            className="px-5 py-2.5 bg-gold-500 text-black font-display text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-gold-600 hover:shadow-md transition-all cursor-pointer"
          >
            Book Your Stay
          </button>
        </div>

        {/* Mobile Hamburger toggle */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setTab('rooms')}
            className="px-3 py-1.5 bg-gold-500 text-black font-display text-[11px] font-bold tracking-widest uppercase rounded-sm hover:bg-gold-600 transition-all cursor-pointer"
          >
            Book
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-800 hover:text-gold-600 focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b border-gray-200 py-6 px-6 md:hidden shadow-lg animate-fadeIn z-50">
          <div className="flex flex-col gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 py-2.5 text-left text-base font-medium border-b border-gray-100 cursor-pointer ${
                    currentTab === item.id ? 'text-gold-600 font-semibold' : 'text-gray-700 hover:text-gold-600'
                  }`}
                >
                  <Icon className="w-5 h-5 text-gold-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
          </div>
        </div>
      )}
    </header>
  );
}
