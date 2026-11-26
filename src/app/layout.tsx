import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ember & Bean Roastery — Specialty Coffee, Fresh Roasts & Table Bookings",
    template: "%s | Ember & Bean Roastery",
  },
  description:
    "Small-batch Indian single-origin coffee, artisanal bakes, interactive 3D roast explorer, and cozy table reservations at Ember & Bean Roastery.",
  keywords: [
    "specialty coffee",
    "Indian coffee roastery",
    "Chikmagalur arabica",
    "artisan cafe",
    "table reservation",
  ],
};

export const viewport: Viewport = {
  themeColor: "#120e0c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-cafe-bg text-cafe-cream antialiased selection:bg-cafe-accent/30 selection:text-cafe-cream">
        {children}
      </body>
    </html>
  );
}
