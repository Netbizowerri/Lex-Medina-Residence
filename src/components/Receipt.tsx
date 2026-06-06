import React from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Booking, Room } from '../types';
import { dbService } from '../db';
import { ShieldCheck, Mail, Calendar, CalendarDays, ExternalLink, Printer, Download, MapPin, CheckCircle } from 'lucide-react';

interface ReceiptProps {
  booking: Booking;
  onDone: () => void;
}

const textWithNaira = (
  doc: jsPDF,
  amount: number,
  x: number,
  y: number,
  align: 'left' | 'right' | 'center' = 'left',
  color?: [number, number, number]
) => {
  const amountStr = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(amount);
  const textStr = `N${amountStr}`;
  doc.text(textStr, x, y, { align });

  const textWidth = doc.getTextWidth(textStr);
  const nWidth = doc.getTextWidth('N');
  
  let nLeft = x;
  if (align === 'right') {
    nLeft = x - textWidth;
  } else if (align === 'center') {
    nLeft = x - textWidth / 2;
  }

  const fontSize = doc.getFontSize();
  const fontSizeMm = fontSize * 0.352778; // Convert pt to mm
  const capHeight = fontSizeMm * 0.72; // Approximate Helvetica cap height

  const middleY = y - (capHeight / 2);
  const lineGap = capHeight * 0.095;
  const lineY1 = middleY - lineGap;
  const lineY2 = middleY + lineGap;

  const padding = nWidth * 0.08;
  const lineXStart = nLeft - padding;
  const lineXEnd = nLeft + nWidth + padding;

  const prevLineWidth = doc.getLineWidth();
  const prevDrawColor = doc.getDrawColor();

  doc.setLineWidth(fontSizeMm * 0.075);
  
  if (color) {
    doc.setDrawColor(color[0], color[1], color[2]);
  } else {
    doc.setDrawColor(18, 18, 18);
  }

  doc.line(lineXStart, lineY1, lineXEnd, lineY1);
  doc.line(lineXStart, lineY2, lineXEnd, lineY2);

  doc.setLineWidth(prevLineWidth);
  doc.setDrawColor(prevDrawColor);
};

export function Receipt({ booking, onDone }: ReceiptProps) {
  const rooms = dbService.getRooms();
  const room = rooms.find(r => r.id === booking.room_id) || rooms[0];
  const [isDownloading, setIsDownloading] = React.useState(false);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const nights = React.useMemo(() => {
    const start = new Date(booking.check_in);
    const end = new Date(booking.check_out);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [booking.check_in, booking.check_out]);

  const baseTotal = room.price * nights;

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const totalAmount = booking.payment_status === 'pending'
        ? baseTotal
        : (booking.amount_paid || baseTotal);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Outer Border
      doc.setDrawColor(214, 187, 131); // Warm gold color matching Lex Medicina #d6bb83
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 277);

      // Decorative Gold Line at top
      doc.setFillColor(214, 187, 131);
      doc.rect(10, 10, 190, 3, 'F');

      // WATERMARK (Drawn early so other elements/boxes sit neatly on top)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(246, 244, 240); // extremely faint premium gold-gray
      doc.text('RESERVATION RECEIPT', 105, 125, { align: 'center', angle: 320 });
      doc.text('LEX MEDICINA RESIDENCE', 105, 165, { align: 'center', angle: 320 });
      doc.text('CONFIRMED LODGING LOCK', 105, 205, { align: 'center', angle: 320 });

      // Load corporate logo asynchronously
      const logoUrl = "https://i.ibb.co/7Jvy2BD3/hero-1-removebg-preview-1-compressed.png";
      let imageLoaded = false;

      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = url;
        });
      };

      try {
        const logoImg = await loadImage(logoUrl);
        const imgWidth = 72;
        const imgHeight = 21.6; // Exactly 10:3 aspect ratio matching design 
        doc.addImage(logoImg, 'PNG', 105 - (imgWidth / 2), 14, imgWidth, imgHeight);
        imageLoaded = true;
      } catch (e) {
        console.warn("Could not load logo into PDF, falling back to corporate crest vectors", e);
      }

      if (!imageLoaded) {
        // Fallback: 1. Draw Elegant Vector Logo / Crest at Top
        doc.setDrawColor(214, 187, 131); // #d6bb83
        doc.setLineWidth(0.4);
        doc.circle(105, 22, 7, 'D');   // Outer gold circle
        doc.circle(105, 23, 6.2, 'D'); // Inner gold circle
        
        // Cross hairs/fine keys inside outer crest
        doc.line(105, 13, 105, 15);
        doc.line(105, 31, 105, 33);
        doc.line(95, 23, 97, 23);
        doc.line(113, 23, 115, 23);

        // Monogram text in the crest
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(214, 187, 131);
        doc.text('LM', 105, 25.5, { align: 'center' });

        // Corporate Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(18, 18, 18);
        doc.text('LEX MEDICINA RESIDENCE', 105, 38, { align: 'center' });
      }

      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('PREMIUM BOUTIQUE SUITE RESERVATION RECEIPT', 105, 43, { align: 'center' });

      // Header Address & Contact Details Block
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text('House 36, Claude Ake Street (142 Road), Off Road, Gwarinpa Estate, FCT, Abuja, Nigeria', 105, 48, { align: 'center' });
      doc.text('Tel: +234 806 779 8893  |  Email: lexmedicinaresidence@gmail.com  |  Website: www.lexmedicinaresidence.com', 105, 52, { align: 'center' });

      // Dividers & Horizontal line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(20, 56, 190, 56);

      // Metadata Block Left
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text('RECEIPT NUMBER', 20, 63);
      doc.setFont('courier', 'bold');
      doc.setFontSize(10.5);
    doc.setTextColor(18, 18, 18);
    doc.text(booking.id, 20, 68);

    // Metadata Block Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text('DATE OCCUPIED', 140, 63);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(18, 18, 18);
    const dateStr = new Date(booking.created_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    doc.text(dateStr, 140, 68);

    doc.line(20, 73, 190, 73);

    // Section 1: Stay Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(214, 187, 131); // Gold accent
    doc.text('1. STAYING & SUITE REGISTRY', 20, 81);

    // Details Box
    doc.setFillColor(252, 252, 252);
    doc.rect(20, 85, 170, 42, 'F');
    doc.setDrawColor(235, 235, 235);
    doc.rect(20, 85, 170, 42, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Reserved Suite:', 25, 94);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 18, 18);
    doc.text(room.name, 65, 94);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Check-In Date:', 25, 102);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(18, 18, 18);
    doc.text(booking.check_in, 65, 102);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Check-Out Date:', 25, 110);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(18, 18, 18);
    doc.text(booking.check_out, 65, 110);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Duration:', 25, 118);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 18, 18);
    doc.text(`${nights} Nights Stay`, 65, 118);

    // Section 2: Guest Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(214, 187, 131);
    doc.text('2. GUEST REGISTRY DATA', 20, 135);

    doc.setFillColor(252, 252, 252);
    doc.rect(20, 139, 170, 32, 'F');
    doc.setDrawColor(235, 235, 235);
    doc.rect(20, 139, 170, 32, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Registrant Name:', 25, 147);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 18, 18);
    doc.text(booking.guest_name, 65, 147);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Connected Phone:', 25, 155);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(18, 18, 18);
    doc.text(booking.guest_phone, 65, 155);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Email Address:', 25, 163);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(18, 18, 18);
    doc.text(booking.guest_email, 65, 163);

    // Section 3: Financials
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(214, 187, 131);
    doc.text('3. FINANCIAL BREAKDOWN', 20, 179);

    // Billing rate & Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    
    const prefixText = 'Accommodation Rate (';
    doc.text(prefixText, 20, 188);
    const prefixWidth = doc.getTextWidth(prefixText);
    const nairaX = 20 + prefixWidth;
    
    textWithNaira(doc, room.price, nairaX, 188, 'left', [80, 80, 80]);
    const priceFormattedStr = `N${new Intl.NumberFormat('en-NG').format(room.price)}`;
    const priceWidth = doc.getTextWidth(priceFormattedStr);
    const suffixText = ` x ${nights} Nights)`;
    doc.text(suffixText, nairaX + priceWidth, 188);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 18, 18);
    textWithNaira(doc, baseTotal, 190, 188, 'right', [18, 18, 18]);

    // Divider Line
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 194, 190, 194);

    // Grand Total Box
    doc.setFillColor(246, 245, 241);
    doc.rect(20, 198, 170, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(18, 18, 18);
    doc.text('TOTAL RATE / AMOUNT PAID:', 25, 207);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(214, 187, 131);
    textWithNaira(doc, totalAmount, 185, 207, 'right', [214, 187, 131]);

    // High-contrast, very professional Status Annotation Badges matching requirements
    if (booking.payment_status === 'pending') {
      doc.setFillColor(254, 242, 242); // very soft elegant red
      doc.rect(20, 218, 170, 8, 'F');
      doc.setDrawColor(248, 113, 113); // soft red border
      doc.rect(20, 218, 170, 8, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(185, 28, 28); // deep solid text
      doc.text('PAYMENT STATUS: ROOM IS YET TO BE PAID FOR (RESERVED & DUE ON ARRIVAL AT LOBBY)', 105, 223, { align: 'center' });
    } else {
      doc.setFillColor(240, 253, 244); // soft elegant green
      doc.rect(20, 218, 170, 8, 'F');
      doc.setDrawColor(74, 222, 128); // soft green border
      doc.rect(20, 218, 170, 8, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(21, 128, 61); // deep solid green text
      doc.text('PAYMENT STATUS: PAYMENT COMPLETED & SECURED ONLINE', 105, 223, { align: 'center' });
    }

    // Section 4: GPS & Directions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(214, 187, 131);
    doc.text('4. ARRIVAL INSTRUCTIONS', 20, 235);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text('Address: House 36, Claude Ake Street (142 Road), Off Road, Gwarinpa Estate, FCT, Abuja.', 20, 243);
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('GPS Location Coordinates: 9.1026 N, 7.3754 E (Concierge Desk & Security on Duty 24/7)', 20, 249);

    // Elegant Thank You footer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(214, 187, 131);
    doc.text('Thank you for choosing Lex Medicina Residence.', 105, 268, { align: 'center' });

    // Customized filename with guest name, residence name and unique identifier
    const sanitizedGuestName = booking.guest_name.trim().replace(/[^a-zA-Z0-9]/g, '_') || 'Guest';
    doc.save(`LexMedicina_Receipt_${sanitizedGuestName}_${booking.id}.pdf`);
    } catch (err) {
      console.error("Error generating receipt PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-12 md:px-8 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-lg bg-[#121212] border border-white/10 shadow-xl"
      >
        {/* Dynamic header confirmation badge */}
        <div className="bg-[#0b0b0c] text-center p-8 space-y-3 relative overflow-hidden text-white border-b border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)]" />
          <div className="inline-flex items-center justify-center bg-gold-400/10 p-2.5 rounded-full border border-gold-500/20 mb-1">
            <CheckCircle className="w-8 h-8 text-gold-450" />
          </div>
          <h2 className="font-serif text-xl font-bold uppercase tracking-widest text-gold-400">
            Reservation Certified
          </h2>
          <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed">
            Your premium suite has been securely locked. An automated CRM dispatch alert has notified Gwarinpa concierge.
          </p>
        </div>

        {/* Digital invoice slip area */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Invoice identifiers */}
          <div className="flex justify-between items-start text-xs border-b border-white/5 pb-4">
            <div className="space-y-1">
              <span className="block text-white/40 uppercase font-display tracking-wider">Receipt Number</span>
              <span className="block font-mono font-semibold text-white text-sm">{booking.id}</span>
            </div>
            <div className="text-right space-y-1">
              <span className="block text-white/40 uppercase font-display tracking-wider">Lodger Lock-out</span>
              <span className="block text-white/70 font-mono italic">{new Date(booking.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Accommodation Info */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-gold-400 font-display font-bold">
              1. Staying Details
            </h4>
            <div className="p-4 bg-[#1a1a1a] rounded-md border border-white/10 grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 space-y-1">
                <span className="block text-white/40">Reserved Suite</span>
                <span className="block font-serif text-base text-white font-semibold">{room.name}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-white/40 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gold-500" /> Check-In
                </span>
                <span className="block font-semibold text-white/95 font-mono">{booking.check_in}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-white/40 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gold-500" /> Check-Out
                </span>
                <span className="block font-semibold text-white/95 font-mono">{booking.check_out}</span>
              </div>
              <div className="col-span-2 space-y-1 border-t border-white/5 pt-2 flex justify-between">
                <span className="text-white/40">Billing Duration</span>
                <span className="font-semibold text-white/90 font-display">{nights} Nights Stay</span>
              </div>
            </div>
          </div>

          {/* Guest Info */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-gold-400 font-display font-bold">
              2. Guest Registry Entry
            </h4>
            <div className="p-4 bg-[#1a1a1a] border border-white/10 rounded-md space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Registrant Name</span>
                <span className="font-medium text-white">{booking.guest_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Connected Phone</span>
                <span className="font-mono text-white/80">{booking.guest_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Communication Email</span>
                <span className="text-white/70 font-light break-all">{booking.guest_email}</span>
              </div>
            </div>
          </div>

          {/* Billing Breakdown Details */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs uppercase tracking-widest text-gold-400 font-display font-bold">
              3. Financial Breakdown
            </h4>
            <div className="space-y-2.5 text-xs text-white/75">
              <div className="flex justify-between">
                <span>Accommodation Rate ({formatNaira(room.price)} x {nights} nights)</span>
                <span>{formatNaira(baseTotal)}</span>
              </div>
              <hr className="border-white/5 my-2" />
              {booking.payment_status === 'pending' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-white/50 bg-white/5 border border-white/5 px-3 py-2 rounded">
                    <span>Settled Amount Online</span>
                    <span className="font-mono text-amber-500 font-semibold uppercase">{formatNaira(0)} (Pay on Arrival)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold text-white bg-gold-400/10 border border-gold-500/20 p-3.5 rounded">
                    <span className="text-gold-400 font-display">Total Due Upon Check-In</span>
                    <span className="text-base text-gold-400 font-serif font-bold">{formatNaira(baseTotal)}</span>
                  </div>
                  <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-450 text-xs rounded flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    <span><strong>ROOM YET TO BE PAID FOR</strong> (Balance of {formatNaira(baseTotal)} is outstanding and due at reception upon check-in)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-white/50 bg-white/5 border border-white/5 px-3 py-2 rounded">
                    <span>Settled Amount Online</span>
                    <span className="font-mono text-emerald-450 font-semibold uppercase">{formatNaira(booking.amount_paid || baseTotal)}</span>
                  </div>
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span><strong>PAYMENT COMPLETED</strong> (Sovereign online ledger fully settled &amp; security deposit cleared)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GPS Location & Instructions for arrival */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-md space-y-2.5 text-xs text-white/80">
            <span className="font-semibold text-gold-400 uppercase tracking-wider font-display block">Arrival Instructions</span>
            <div className="flex gap-2">
              <MapPin className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-light">
                Lex Medicina Residence is located at <span className="font-semibold">House 36, Claude Ake Street (142 Road), Off Road, Gwarinpa Estate, FCT.</span>
              </p>
            </div>
            <div className="bg-black border border-white/5 text-white p-2.5 rounded font-mono text-[9px] text-center select-all">
              GPS Coordinates: 9.1026° N, 7.3754° E • Abuja FCT
            </div>
          </div>

          {/* Interactive footer actions */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-white/10 text-white/85 text-xs font-display font-medium rounded-sm hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 shrink-0 animate-bounce" style={{ animationDuration: isDownloading ? '1s' : '0s' }} />
              <span>{isDownloading ? 'Preparing PDF...' : 'Download Receipt'}</span>
            </button>
            <button
              onClick={onDone}
              className="flex-1 py-3 bg-gold-500 text-black text-xs font-display font-bold uppercase tracking-widest text-center rounded-sm hover:bg-gold-600 hover:shadow-md transition-all cursor-pointer"
            >
              Back To Residence
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
