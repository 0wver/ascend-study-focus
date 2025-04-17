import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers';
import StarBackground from "./components/ui/StarBackground";

export const metadata: Metadata = {
  title: 'Ascend Study Focus - Habit Tracker & Study Timer',
  description: 'Track your habits, improve focus with study timer, and reach your goals with detailed statistics and progress tracking.',
  openGraph: {
    title: 'Ascend Study Focus - Habit Tracker & Study Timer',
    description: 'Track your habits, improve focus with study timer, and reach your goals with detailed statistics and progress tracking.',
    url: 'https://ascend-study-focus.vercel.app',
    siteName: 'Ascend Study Focus',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ascend Study Focus App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans transition-colors duration-300 bg-background-light dark:bg-[#010101] text-text-light dark:text-text-dark">
        <div className="fixed inset-0 bg-black/60 -z-10" />
        <StarBackground />
        <Providers>
          <div className="relative z-10">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
