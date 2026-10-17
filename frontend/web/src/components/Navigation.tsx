'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  CreditCard, 
  Bus, 
  LayoutDashboard, 
  Sliders, 
  ArrowRight,
  Menu,
  X,
  Wallet,
  HeartPulse,
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Account';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/accommodation', label: 'Housing & Bills', icon: Building2 },
    { href: '/transport', label: 'Transit Passes', icon: Bus },
    { href: '/banking', label: 'Student Banking', icon: CreditCard },
    { href: '/healthcare', label: 'NHS Healthcare', icon: HeartPulse },
    { href: '/onboarding', label: 'My Budget', icon: Sliders },
  ];

  return (
    <header suppressHydrationWarning className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition">
              <Wallet className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base block leading-none">
                The Hidden Cost
              </span>
              <span className="text-[11px] text-slate-500 font-medium">of Being a Student</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {user ? (
              <Link
                href="/profile"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  pathname === '/profile'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                <span className="max-w-[120px] truncate">{displayName}</span>
              </Link>
            ) : (
              <Link
                href="/auth"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  pathname === '/auth'
                    ? 'bg-slate-100 text-slate-900 border-slate-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                Sign In
              </Link>
            )}
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition"
            >
              Start Comparing
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 animate-slide-down">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
          <Link
            href={user ? '/profile' : '/auth'}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold ${
              pathname === '/profile' || pathname === '/auth'
                ? 'bg-slate-100 text-slate-900 border border-slate-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserIcon className="w-4 h-4 text-teal-700" />
            {user ? `My Profile (${displayName})` : 'Sign In / Register'}
          </Link>
          <div className="pt-2">
            <Link
              href="/onboarding"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 shadow-sm"
            >
              Start Comparing
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer suppressHydrationWarning className="bg-slate-950 text-slate-400 text-xs py-12 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-2">
              <Wallet className="w-4 h-4 text-teal-400" />
              The Hidden Cost of Being a Student
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Helping students make integrated, transparent financial choices across housing, transit passes, and banking perks. 
              Designed for simple, honest decision-making at GUTS Hackathon 2026.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">UK Higher Education</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">No Sponsored Rankings</span>
              <span>•</span>
              <span className="text-teal-400">Live API Ready</span>
            </div>
          </div>

          <div>
            <div className="text-slate-200 font-semibold mb-3 text-xs uppercase tracking-wider">Comparison Modules</div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/accommodation" className="hover:text-white transition">Accommodation & Bills</Link>
              </li>
              <li>
                <Link href="/transport" className="hover:text-white transition">Subway, Bus & Transit</Link>
              </li>
              <li>
                <Link href="/banking" className="hover:text-white transition">Student Overdrafts & Railcards</Link>
              </li>
              <li>
                <Link href="/healthcare" className="hover:text-white transition">NHS Healthcare & IHS Visa</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">Living Cost Dashboard</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-slate-200 font-semibold mb-3 text-xs uppercase tracking-wider">Student Rights & Council Tax</div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Full-time students in the UK are 100% exempt from Council Tax. Always verify that your landlord registers your student exemption certificate so you are not wrongfully charged.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© 2026 GUTS Hackathon — Making Student Life Cost Less.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-200">Home</Link>
            <Link href="/onboarding" className="hover:text-slate-200">Set Budget</Link>
            <Link href="/dashboard" className="hover:text-slate-200">Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
