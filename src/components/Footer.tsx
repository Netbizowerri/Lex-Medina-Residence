import React from 'react';
import { Mail, Phone, MapPin, Landmark, HeartHandshake, Zap, Shield, Wifi, Building } from 'lucide-react';

interface FooterProps {
  setTab: (tab: string) => void;
}

export function Footer({ setTab }: FooterProps) {
  return (
    <footer className="bg-white border-t border-gray-100 text-gray-800 font-sans shadow-inner">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 md:grid-cols-2">
          
          {/* Column 1 - Brand Identity & Description */}
          <div className="flex flex-col gap-4">
            <span className="font-serif text-2xl font-bold tracking-wider text-gray-900 uppercase">
              Lex Medicina
            </span>
            <p className="text-gray-500 text-sm leading-relaxed font-light">
              An elite, design-centric boutique residence nestled within Gwarinpa, Abuja. Serving corporate delegates with high-end, secure, and private luxury.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <HeartHandshake className="w-4 h-4 text-gold-600" />
              <span className="text-[11px] font-display uppercase tracking-widest text-gold-600 font-bold">
                The Standard of Grace
              </span>
            </div>
          </div>

          {/* Column 2 - Quick Navigation */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gold-600 mb-6">
              Navigation
            </h3>
            <ul className="space-y-4 text-sm font-light text-gray-600">
              <li>
                <button onClick={() => setTab('home')} className="hover:text-gold-600 transition-colors cursor-pointer text-left">
                  The Residence
                </button>
              </li>
              <li>
                <button onClick={() => setTab('rooms')} className="hover:text-gold-600 transition-colors cursor-pointer text-left">
                  Rooms & Pricing
                </button>
              </li>
              <li>
                <button onClick={() => setTab('contact')} className="hover:text-gold-600 transition-colors cursor-pointer text-left">
                  Directions & Maps
                </button>
              </li>
              <li>
                <button onClick={() => setTab('admin-login')} className="hover:text-gold-600 transition-colors cursor-pointer text-left">
                  Staff Login
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 - Amenities Preview */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gold-600 mb-6 font-bold">
              EXPERIENCE
            </h3>
            <ul className="space-y-4 text-sm font-light text-gray-600">
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Uninterrupted 24/7 Power</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">360 deg infrared CCTV surveillance</span>
              </li>
              <li className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Dedicated High Speed Wifi</span>
              </li>
              <li className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Hybrid Luxury Residence</span>
              </li>
            </ul>
          </div>

          {/* Column 4 - Contact Details */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gold-600 mb-6 font-bold">
              CONNECT
            </h3>
            <ul className="space-y-4 text-sm font-light text-gray-600">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-gray-600">
                  House 36, Claude Ake Street (142 Road), Off 14 Road, Gwarinpa Estate, Gwarinpa, Abuja, Nigeria.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold-600 shrink-0" />
                <span>+234 8067798893</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold-600 shrink-0" />
                <span className="break-all hover:text-gold-600 cursor-pointer transition-colors">lexmedicinaresidence@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright notice */}
        <div className="mt-16 border-t border-gray-150 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-light">
          <p>© {new Date().getFullYear()} Lex Medicina Residence. All luxury rights reserved.</p>
          <p className="font-display tracking-widest uppercase text-gold-600 text-[10px] font-bold">
            Designed by{' '}
            <a 
              href="https://canva.link/02u0jxj0ngbmicu" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gold-450 hover:font-black hover:underline transition-all duration-200"
            >
              Anselm Technology
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
