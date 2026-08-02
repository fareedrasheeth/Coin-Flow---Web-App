import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CoinFlowProvider } from "@/context/CoinFlowContext";

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
  title: "CoinFlow — Smart Coin Sorting and Collection System",
  description: "Modern IoT dashboard monitoring and controlling ESP32 smart coin sorting machine with automatic voice announcements and live telemetry.",
  keywords: "CoinFlow, Sri Lanka coins, coin sorting, ESP32, IoT dashboard, IR sensors, servo motors",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#090d16" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <CoinFlowProvider>{children}</CoinFlowProvider>
      </body>
    </html>
  );
}
