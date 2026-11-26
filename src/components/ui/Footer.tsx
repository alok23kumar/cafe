import Link from "next/link";
import { Coffee, MapPin, Clock, Phone, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-cafe-border bg-cafe-surface/60">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cafe-accent/40 bg-cafe-bg text-cafe-accent">
                <Coffee className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-xl font-semibold text-cafe-cream">
                  Ember &amp; Bean Roastery
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-cafe-accent">
                  Small-Batch Indian Arabica
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cafe-muted">
              Warm walnut booths, terracotta arches, brushed brass pendants, and
              Tuesday-roasted Chikmagalur &amp; Ratnagiri estate coffees — built for
              unhurried mornings and fast pickup orders.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-cafe-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cafe-border bg-cafe-bg px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-cafe-accent" />
                UPI / GPay / Cards via Razorpay
              </span>
              <span className="rounded-full border border-cafe-border bg-cafe-bg px-3 py-1">
                100% FSSAI Veg &amp; Non-Veg Labeled
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-cafe-accent">
              Visit the Cafe
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-cafe-muted">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cafe-accent" />
                <span>100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-cafe-accent" />
                <span>Daily · 7:30 AM – 10:30 PM</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-cafe-accent" />
                <span>+91 80 4123 8890</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-cafe-accent">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-cafe-muted">
              <li>
                <Link href="/menu" className="hover:text-cafe-accent">
                  Full Cafe Menu
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-cafe-accent">
                  3D Coffee Bean Shop
                </Link>
              </li>
              <li>
                <Link href="/reserve" className="hover:text-cafe-accent">
                  Reserve a Table
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cafe-accent">
                  Owner Admin Console
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cafe-border/70 pt-6 text-xs text-cafe-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Ember &amp; Bean Roastery. All rights reserved.</p>
          <p>Prices in INR (₹) inclusive of cafe craft.</p>
        </div>
      </div>
    </footer>
  );
}
