import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "CoinFlow — Smart Coin Detection & Sorting Dashboard",
  description: "Premium IoT dashboard for automated Sri Lankan coin sorting machine. Real-time coin detection, analytics, and machine health monitoring.",
  keywords: "CoinFlow, Sri Lankan coins, coin sorting, ESP32, IoT dashboard, fintech",
  authors: [{ name: "CoinFlow Team" }],
  openGraph: {
    title: "CoinFlow — Smart Coin Detection & Sorting",
    description: "Real-time IoT dashboard for automated coin sorting",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A0A0F" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
