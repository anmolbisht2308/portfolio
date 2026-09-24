import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { site } from "@/content/content";
import CursorMount from "@/components/global/CursorMount";
import Grain from "@/components/global/Grain";
import IntroScript from "@/components/global/IntroScript";
import Preloader from "@/components/global/Preloader";
import ScrollStream from "@/components/global/ScrollStream";
import SmoothScroll from "@/components/providers/SmoothScroll";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: "variable",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: "400",
  style: "italic",
  display: "swap",
  preload: false, // accent only; only the LCP display face is preloaded
});
const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap", preload: false });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", preload: false });

const title = `${site.name} — ${site.shortTitle}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s — ${site.name}` },
  description: site.description,
  keywords: [...site.keywords],
  authors: [{ name: site.name, url: site.linkedin }],
  creator: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: site.name,
    title,
    description: site.tagline,
    locale: "en_IN",
    firstName: "Anmol",
    lastName: "Bisht",
  },
  twitter: { card: "summary_large_image", title, description: site.tagline },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0d1a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning /* IntroScript sets data-intro before hydration */
      className={`${display.variable} ${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <IntroScript />
        <noscript>
          <style>{`.preloader{display:none}`}</style>
        </noscript>
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-[110] rounded-full bg-ember px-4 py-2 text-void focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        <Preloader />
        <SmoothScroll />
        {children}
        <ScrollStream />
        <Grain />
        <CursorMount />
      </body>
    </html>
  );
}
