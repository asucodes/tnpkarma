import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from './components/BottomNav';
import ThemeToggle from './components/ThemeToggle';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'tnpkarma — TnP Volunteer Tracker',
  description: 'Log hours, earn karma, climb the leaderboard. Training & Placement cell volunteer tracker.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-container">
          <div className="header-wrapper">
            <header className="header">
              <img src="/cat.png" alt="tnpkarma cat" className="header-mascot" />
              <h1 className="header-title">TnP Karma</h1>
            </header>
            <p className="header-sub">Training & Placement • Volunteer Tracker</p>
            <ThemeToggle />
          </div>

          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
