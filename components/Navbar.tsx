'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Conversation {
  id: string;
  unreadCount: number;
}

export default function Navbar() {
  const { user, logout, loading, mounted } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [totalUnread, setTotalUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push('/');
  };

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setTotalUnread(0);
      return;
    }
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        const total = data.conversations.reduce(
          (sum: number, conv: Conversation) => sum + conv.unreadCount,
          0
        );
        setTotalUnread(total);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [user]);

  // Fetch unread message count
  useEffect(() => {
    if (!user) {
      setTotalUnread(0);
      return;
    }

    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Re-fetch unread count when messages are marked as read
  useEffect(() => {
    const handler = () => fetchUnreadCount();
    window.addEventListener('unread-updated', handler);
    return () => window.removeEventListener('unread-updated', handler);
  }, [fetchUnreadCount]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <rect width="512" height="512" rx="115" fill="#1E5631"/>
              <path d="M120 192L120 160L352 160L352 128L416 176L352 224L352 192L120 192Z" fill="white"/>
              <path d="M392 320L392 352L160 352L160 384L96 336L160 288L160 320L392 320Z" fill="white"/>
            </svg>
            <span className="text-xl font-bold text-primary">DartSwap</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-4">
            {mounted && !loading && (
              <>
                {user ? (
                  <>
                    <Link href="/sell" className="btn-primary text-sm py-1.5 px-3">
                      Sell Item
                    </Link>
                    <Link
                      href="/messages"
                      className="text-text hover:text-primary transition-colors relative"
                    >
                      Messages
                      {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </Link>
                    <Link href="/profile" className="text-text hover:text-primary transition-colors">
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-text hover:text-primary transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-text hover:text-primary transition-colors">
                      Login
                    </Link>
                    <Link href="/register" className="btn-primary text-sm py-1.5 px-3">
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile: right side */}
          <div className="flex sm:hidden items-center gap-3">
            {mounted && !loading && user && (
              <Link href="/sell" className="btn-primary text-sm py-1.5 px-3">
                Sell
              </Link>
            )}
            {mounted && !loading && (
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="text-text p-1.5 rounded-md hover:bg-border transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  /* X icon */
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  /* Hamburger icon with optional red dot */
                  <span className="relative inline-flex">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    {totalUnread > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </span>
                )}
              </button>
            )}
            {mounted && !loading && !user && (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-text hover:text-primary transition-colors text-sm">
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm py-1.5 px-3">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && mounted && !loading && user && (
        <div className="sm:hidden border-t border-border bg-surface">
          <div className="px-4 py-2 space-y-1">
            <Link
              href="/messages"
              className="flex items-center justify-between py-3 text-text hover:text-primary transition-colors border-b border-border"
            >
              <span>Messages</span>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalUnread}
                </span>
              )}
            </Link>
            <Link
              href="/profile"
              className="block py-3 text-text hover:text-primary transition-colors border-b border-border"
            >
              Profile
            </Link>
            <Link
              href="/my-listings"
              className="block py-3 text-text hover:text-primary transition-colors border-b border-border"
            >
              My Listings
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left py-3 text-text hover:text-primary transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
