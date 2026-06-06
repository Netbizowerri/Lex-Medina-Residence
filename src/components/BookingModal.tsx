import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, Booking } from '../types';
import { dbService } from '../db';
import { X, Calendar, User, Mail, Phone, CreditCard, ShieldCheck, TicketCheck, Terminal, HelpCircle } from 'lucide-react';

interface BookingModalProps {
  room: Room;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

export function BookingModal({ room, onClose, onSuccess }: BookingModalProps) {
  // Stay parameters
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  
  // Custom Interactive Calendar States
  const [isCheckInCalendarOpen, setIsCheckInCalendarOpen] = useState(false);
  const [isCheckOutCalendarOpen, setIsCheckOutCalendarOpen] = useState(false);

  // References for outside click dismissal detection hooks
  const checkInRef = React.useRef<HTMLDivElement>(null);
  const checkOutRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        checkInRef.current && 
        !checkInRef.current.contains(event.target as Node)
      ) {
        setIsCheckInCalendarOpen(false);
      }
      if (
        checkOutRef.current && 
        !checkOutRef.current.contains(event.target as Node)
      ) {
        setIsCheckOutCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load booked dates for this suite to prevent double allocation or highlight busy calendars
  const bookedDatesSet = React.useMemo(() => {
    const dates = new Set<string>();
    try {
      const suiteBookings = dbService.getBookings().filter(b => b.room_id === room.id);
      for (const b of suiteBookings) {
        if (!b.check_in || !b.check_out) continue;
        let current = new Date(b.check_in + "T00:00:00");
        const end = new Date(b.check_out + "T00:00:00");
        while (current <= end) {
          const yyyy = current.getFullYear();
          const mm = String(current.getMonth() + 1).padStart(2, '0');
          const dd = String(current.getDate()).padStart(2, '0');
          const localDateStr = `${yyyy}-${mm}-${dd}`;
          dates.add(localDateStr);
          current.setDate(current.getDate() + 1);
        }
      }
    } catch (err) {
      console.warn("Could not synchronize existing bookings:", err);
    }
    return dates;
  }, [room.id]);

  // Guest registration details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Payment process simulation
  const [activeStep, setActiveStep] = useState<'dates' | 'checkout' | 'processing'>('dates');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'reserve'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [errorText, setErrorText] = useState('');

  // Auxiliary state variables
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculations for Pricing Breakdown
  const nights = React.useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const result = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return result > 0 ? result : 0;
  }, [checkIn, checkOut]);

  const basePrice = room.price * nights;
  const VAT = 0; // Removed VAT per user request
  const serviceCharge = 0; // Removed service charge per user request
  const totalPayable = basePrice;

  // Format currency
  const formatNairaValue = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!checkIn || !checkOut) {
      setErrorText('Please select both Check-In and Check-Out dates.');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      setErrorText('Check-Out date must be strictly after Check-In date.');
      return;
    }

    // Call Real-time overlap resolver database layer
    const isRoomAvailable = dbService.checkAvailability(room.id, checkIn, checkOut);
    if (!isRoomAvailable) {
      setErrorText('This suite is fully booked or has an overlapping reservation for the selected range. Please check other dates!');
      return;
    }

    setActiveStep('checkout');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!guestName || !guestEmail || !guestPhone) {
      setErrorText('Please provide all guest identification parameters.');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber || !cardCvv || !cardExpiry) {
        setErrorText('Please complete your credit card fields to process checkout.');
        return;
      }
    }

    // Step 3: Trigger premium loading sequence
    setActiveStep('processing');

    setTimeout(() => {
      try {
        // Build booking record
        const newBooking = dbService.createBooking({
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          room_id: room.id,
          check_in: checkIn,
          check_out: checkOut,
          amount_paid: paymentMethod === 'card' ? totalPayable : 0,
          payment_status: paymentMethod === 'card' ? 'paid' : 'pending'
        });

        // Trigger parent callback
        onSuccess(newBooking);
      } catch (err) {
        setErrorText('Failed to sync booking data with Firestore database.');
        setActiveStep('checkout');
      }
    }, 2800); // realistic payment completion latency
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl max-h-[96vh] sm:max-h-[90vh] flex flex-col rounded-lg bg-[#121212] shadow-2xl border border-white/10"
      >
        {/* Dynamic header title */}
        <div className="flex-shrink-0 flex items-center justify-between bg-black px-6 py-4 border-b border-white/10 text-white rounded-t-lg border-t border-x border-white/10">
          <div>
            <h3 className="font-serif text-lg tracking-wide uppercase text-gold-400">
              {activeStep === 'dates' ? 'Reserve Suite' : activeStep === 'checkout' ? 'Secure Checkout' : 'Processing Stay'}
            </h3>
            <p className="text-[11px] font-display text-white/50 tracking-wider uppercase">
              {room.name} — {formatNairaValue(room.price)} / Night
            </p>
          </div>
          {activeStep !== 'processing' && (
            <button
              onClick={onClose}
              className="p-1 px-2.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progression Bar */}
        {activeStep !== 'processing' && (
          <div className="flex-shrink-0 flex border-b border-white/5 bg-black/40 text-xs font-display font-medium text-white/40">
            <div className={`flex-1 py-3 text-center border-b-2 ${activeStep === 'dates' ? 'border-gold-500 text-gold-400 font-semibold' : 'border-transparent text-white/40'}`}>
              Stay Schedule
            </div>
            <div className={`flex-1 py-3 text-center border-b-2 ${activeStep === 'checkout' ? 'border-gold-500 text-gold-400 font-semibold' : 'border-transparent text-white/40'}`}>
              Identity & Payment
            </div>
          </div>
        )}

        {/* Scrollable Main interactive cards structure */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {errorText && (
            <div className="p-3 bg-red-950/40 border-l-4 border-red-500 text-red-200 text-xs leading-relaxed font-sans rounded-r-md border border-red-800/30 mb-5">
              {errorText}
            </div>
          )}
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Date & Scheduling Selection */}
            {activeStep === 'dates' && (
              <motion.form
                key="step-dates"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleNextStep}
                className="space-y-6 min-h-[410px]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-30">
                  <div className="relative" ref={checkInRef}>
                    <label className="block text-xs uppercase tracking-widest text-gold-400 font-display mb-2 font-bold">
                      1. Check-In Date
                    </label>
                    <div className="relative">
                      <Calendar 
                        className="absolute left-3.5 top-3.5 w-4 h-4 text-gold-400 cursor-pointer hover:scale-110 hover:text-gold-300 transition-all z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCheckInCalendarOpen(!isCheckInCalendarOpen);
                          setIsCheckOutCalendarOpen(false);
                        }}
                      />
                      <input
                        type="text"
                        readOnly
                        placeholder="Choose arrival date..."
                        value={checkIn ? new Date(checkIn + "T00:00:00").toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCheckInCalendarOpen(!isCheckInCalendarOpen);
                          setIsCheckOutCalendarOpen(false);
                        }}
                        className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-md py-2.5 pl-11 pr-4 text-sm focus:border-gold-400 focus:outline-none cursor-pointer text-left select-none relative"
                        required
                      />
                      {isCheckInCalendarOpen && (
                        <CalendarPopover
                          selectedDate={checkIn}
                          bookedDates={bookedDatesSet}
                          onSelect={(date) => {
                            setCheckIn(date);
                            setIsCheckInCalendarOpen(false);
                            // Auto open checkout calendar if not set or invalid
                            if (!checkOut || date >= checkOut) {
                              setCheckOut(''); // Reset invalid checkout
                              setIsCheckOutCalendarOpen(true);
                            }
                          }}
                          onClose={() => setIsCheckInCalendarOpen(false)}
                          labelName="Arrival check-in"
                          align="left"
                        />
                      )}
                    </div>
                  </div>

                  <div className="relative" ref={checkOutRef}>
                    <label className="block text-xs uppercase tracking-widest text-gold-400 font-display mb-2 font-bold">
                      2. Check-Out Date
                    </label>
                    <div className="relative">
                      <Calendar 
                        className="absolute left-3.5 top-3.5 w-4 h-4 text-gold-400 cursor-pointer hover:scale-110 hover:text-gold-300 transition-all z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCheckOutCalendarOpen(!isCheckOutCalendarOpen);
                          setIsCheckInCalendarOpen(false);
                        }}
                      />
                      <input
                        type="text"
                        readOnly
                        placeholder="Choose departure date..."
                        value={checkOut ? new Date(checkOut + "T00:00:00").toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCheckOutCalendarOpen(!isCheckOutCalendarOpen);
                          setIsCheckInCalendarOpen(false);
                        }}
                        className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-md py-2.5 pl-11 pr-4 text-sm focus:border-gold-400 focus:outline-none cursor-pointer text-left select-none relative"
                        required
                      />
                      {isCheckOutCalendarOpen && (
                        <CalendarPopover
                          selectedDate={checkOut}
                          bookedDates={bookedDatesSet}
                          minDate={checkIn || todayStr}
                          onSelect={(date) => {
                            setCheckOut(date);
                            setIsCheckOutCalendarOpen(false);
                          }}
                          onClose={() => setIsCheckOutCalendarOpen(false)}
                          labelName="Departure check-out"
                          align="right"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-md space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold-400 font-display">
                      Stay Summary ({nights} nights)
                    </p>
                    <div className="space-y-1.5 text-xs text-white/80">
                      <div className="flex justify-between">
                        <span>Base Lodging ({formatNairaValue(room.price)} x {nights} nights)</span>
                        <span>{formatNairaValue(basePrice)}</span>
                      </div>
                      <hr className="border-white/5 my-1" />
                      <div className="flex justify-between font-semibold text-sm text-white font-display">
                        <span>Total Payable</span>
                        <span>{formatNairaValue(totalPayable)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gold-500 text-black font-display text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-gold-600 hover:shadow-md transition-all cursor-pointer"
                >
                  CONTINUE TO CHECKOUT
                </button>
              </motion.form>
            )}             {/* STEP 2: Identity Registration & Simulated Online Gateway */}
            {activeStep === 'checkout' && (
              <motion.form
                key="step-checkout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handlePaymentSubmit}
                className="space-y-8"
              >
                {/* PART A: Guest Specifications (for CRM integration) */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <h4 className="text-xs uppercase tracking-widest text-[#d6bb83] font-display font-bold">
                      1. Guest Registration Info
                    </h4>
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-[10px] text-[#ff6b6b] hover:text-[#ff8787] transition-colors uppercase tracking-widest font-display font-bold flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-[#ff6b6b]/10 px-2.5 py-1 rounded border border-[#ff6b6b]/20"
                    >
                      <X className="w-3 h-3" />
                      Exit Booking
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#d6bb83]/80 font-display mb-2 font-bold">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          placeholder="Dr. John Doe"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-md py-2.5 pl-10 pr-4 text-sm focus:border-gold-400 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#d6bb83]/80 font-display mb-2 font-bold">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                        <input
                          type="tel"
                          placeholder="+234 800 000 0000"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-md py-2.5 pl-10 pr-4 text-sm focus:border-gold-400 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest text-[#d6bb83]/80 font-display mb-2 font-bold">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                        <input
                          type="email"
                          placeholder="john.doe@hospital.ng"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-md py-2.5 pl-10 pr-4 text-sm focus:border-gold-400 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-white/5 my-5" />

                {/* Choosing Payment / Reservation Mode */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest text-gold-400 font-display font-bold">
                    2. Choose Booking & Payment Option
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Pay Online Card */}
                    <div
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'card'
                          ? 'border-gold-500 bg-gold-500/10 text-white'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <CreditCard className={`w-4 h-4 ${paymentMethod === 'card' ? 'text-gold-400' : 'text-white/40'}`} />
                        <span className="font-display text-xs font-semibold uppercase tracking-wider">
                          Pay Online Now
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 leading-relaxed">
                        Authorize via our secure sandbox card gateway. Guarantees check-in with an instant booking receipt.
                      </p>
                    </div>

                    {/* Reserve Only Card */}
                    <div
                      onClick={() => setPaymentMethod('reserve')}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'reserve'
                          ? 'border-gold-500 bg-gold-500/10 text-white'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Calendar className={`w-4 h-4 ${paymentMethod === 'reserve' ? 'text-gold-400' : 'text-white/40'}`} />
                        <span className="font-display text-xs font-semibold uppercase tracking-wider">
                          Reserve & Pay Later
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 leading-relaxed">
                        Submit reservation request directly. Hold dates and settle total balance at the desk upon check-in.
                      </p>
                    </div>
                  </div>
                </div>

                <hr className="border-white/5 my-4" />

                {paymentMethod === 'card' ? (
                  /* PART B: Paystack/Flutterwave Custom Secured Sandbox Gateway */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs uppercase tracking-widest text-gold-400 font-display font-bold flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-gold-500" />
                        <span>3. Payment Details (Sandboxed Gateway)</span>
                      </h4>
                      <span className="text-[10px] bg-white/5 border border-white/5 text-gold-400 px-2 py-0.5 rounded font-display select-none">
                        Secured Direct Integration
                      </span>
                    </div>

                    <div className="p-4 bg-[#1a1a1a]/60 border border-white/10 rounded-md grid grid-cols-3 gap-3.5">
                      <div className="col-span-3">
                        <label className="block text-[10px] uppercase tracking-wider text-white/60 font-display mb-1 font-semibold">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="••••  ••••  ••••  ••••"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                          className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-md py-2 px-3 text-sm focus:border-gold-400 focus:outline-none font-mono"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] uppercase tracking-wider text-white/60 font-display mb-1 font-semibold">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value.replace(/(\d{2})(\d{1,2})/, '$1/$2'))}
                          className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-md py-2 px-3 text-sm focus:border-gold-400 focus:outline-none font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-white/60 font-display mb-1 font-semibold">
                          CVV Code
                        </label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-md py-2 px-3 text-sm focus:border-gold-400 focus:outline-none font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* PART B: Alternative Desk Settlement Guarantee */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs uppercase tracking-widest text-gold-400 font-display font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-gold-500" />
                        <span>3. Desk Settlement Hold Guarantee</span>
                      </h4>
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-display select-none">
                        No Card Needed
                      </span>
                    </div>

                    <div className="p-4 bg-emerald-950/10 border border-gold-500/20 rounded-md space-y-2">
                      <p className="text-xs text-white/90 leading-relaxed font-light">
                        By selecting <span className="text-gold-400 font-semibold">Reserve & Pay Later</span>, Lex Medicina Residence will put a standard hold on your dates.
                      </p>
                      <ul className="text-[11px] text-white/65 space-y-1 list-disc list-inside">
                        <li>You will pay your total balance of <span className="text-gold-400 font-mono font-medium">{formatNairaValue(totalPayable)}</span> at the front desk.</li>
                        <li>A booking receipt is instantly issued with payment designated as <span className="text-amber-400 font-bold">Pending Arrival</span>.</li>
                        <li>Flexible cancel-free policies apply.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Confirm pricing summary banner */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-black border border-white/5 text-gold-400 p-4 rounded-sm gap-4">
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-[#F5F5F0]/40">Lodging Total</span>
                    <span className="text-lg font-serif font-semibold">{formatNairaValue(totalPayable)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-2.5 px-4 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-[#ff6b6b] font-display text-xs font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      Cancel & Exit
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-6 bg-gold-500 text-black font-display text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-gold-600 hover:shadow-md transition-all cursor-pointer"
                    >
                      {paymentMethod === 'card' ? 'Secure Room Link' : 'Confirm Reservation'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}

            {/* STEP 3: Live Verification & Transaction Settlement Loader */}
            {activeStep === 'processing' && (
              <motion.div
                key="step-processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                tabIndex={-1}
                className="py-12 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="relative w-16 h-16">
                  {/* Outer spinning luxury ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-gold-500 animate-spin"></div>
                  {/* Core security icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-gold-500 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2 max-w-sm">
                  <h4 className="font-serif text-lg font-medium text-white">
                    {paymentMethod === 'card' ? 'Authorizing Ledger Settlement' : 'Securing Suite Reservation'}
                  </h4>
                  <p className="text-xs text-white/50 leading-relaxed font-light">
                    {paymentMethod === 'card'
                      ? 'Securing your luxury suite at Gwarinpa, locks are in progress to prevent double allocation. Posting CRM data...'
                      : 'Placing reservation lock on your suite dates. Synchronizing with our Abuja desk ledger...'}
                  </p>
                </div>

                <div className="w-56 bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gold-500 h-full animate-progress rounded-full"></div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

interface CalendarPopoverProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  minDate?: string;
  bookedDates: Set<string>;
  onClose: () => void;
  labelName: string;
  align?: 'left' | 'right';
}

function CalendarPopover({
  selectedDate,
  onSelect,
  minDate,
  bookedDates,
  onClose,
  labelName,
  align = 'left'
}: CalendarPopoverProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    if (selectedDate) return new Date(selectedDate + "T00:00:00");
    if (minDate) return new Date(minDate + "T00:00:00");
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const blankArray = Array.from({ length: firstDayIndex }, (_, i) => null);

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleDayClick = (e: React.MouseEvent, dayNum: number) => {
    e.preventDefault();
    e.stopPropagation();
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onSelect(dateStr);
    onClose();
  };

  const isDayDisabled = (dayNum: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    const localToday = (() => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    })();

    if (dateStr < localToday) return true;

    if (minDate) {
      const isCheckout = labelName.toLowerCase().includes('out');
      if (isCheckout) {
        if (dateStr <= minDate) return true;
      } else {
        if (dateStr < minDate) return true;
      }
    }

    if (bookedDates.has(dateStr)) return true;

    return false;
  };

  const isDaySelected = (dayNum: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    return dateStr === selectedDate;
  };

  const isDayBooked = (dayNum: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    return bookedDates.has(dateStr);
  };

  return (
    <div 
      className={`absolute z-50 mt-2 p-3 bg-[#111112] border border-gold-500/30 rounded-lg shadow-2xl text-white font-sans text-xs select-none w-[310px] max-w-[calc(100vw-48px)] ${
        align === 'right' ? 'right-0 md:left-auto' : 'left-0'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 px-2.5 text-[10px] bg-white/5 border border-white/10 hover:bg-[#d6bb83]/25 hover:text-[#d6bb83] text-gold-400 rounded transition-all cursor-pointer font-bold"
        >
          &larr;
        </button>
        <span className="font-serif font-semibold text-center tracking-wide text-white text-[11px] uppercase">
          {monthsList[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 px-2.5 text-[10px] bg-white/5 border border-white/10 hover:bg-[#d6bb83]/25 hover:text-[#d6bb83] text-gold-400 rounded transition-all cursor-pointer font-bold"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-display text-[8px] uppercase tracking-wider text-[#d6bb83]/60 font-bold py-2">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blankArray.map((_, idx) => (
          <div key={`blank-${idx}`} className="h-6 w-full" />
        ))}
        {daysArray.map((dayNum) => {
          const disabled = isDayDisabled(dayNum);
          const selected = isDaySelected(dayNum);
          const booked = isDayBooked(dayNum);
          return (
            <button
              key={`day-${dayNum}`}
              type="button"
              disabled={disabled}
              onClick={(e) => handleDayClick(e, dayNum)}
              className={`h-6 w-full text-[10px] font-mono rounded flex items-center justify-center transition-all ${
                selected
                  ? 'bg-gold-500 text-black font-semibold'
                  : disabled
                  ? booked
                    ? 'text-red-500/60 bg-red-950/20 line-through opacity-40 cursor-not-allowed'
                    : 'text-white/20 line-through opacity-30 cursor-not-allowed'
                  : 'text-white/80 hover:bg-[#d6bb83]/20 hover:text-[#d6bb83] cursor-pointer'
              }`}
              title={booked ? "Fully Reserved / Occupied" : ""}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[8px] text-white/40">
        <span>{labelName}</span>
        <span className="text-[#d6bb83] font-mono">Lex Medicina</span>
      </div>
    </div>
  );
}
