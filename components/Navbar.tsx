'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, loading, mounted } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <rect width="512" height="512" rx="115" fill="#1E5631"/>
              <path d="M120 192L120 160L352 160L352 128L416 176L352 224L352 192L120 192Z" fill="white"/>
              <path d="M392 320L392 352L160 352L160 384L96 336L160 288L160 320L392 320Z" fill="white"/>
            </svg>
            <span className="text-2xl font-bold text-primary">DartSwap</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {mounted && !loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/sell"
                      className="btn-primary"
                    >
                      Sell Item
                    </Link>
                    <Link
                      href="/my-listings"
                      className="text-text hover:text-primary transition-colors"
                    >
                      My Listings
                    </Link>
                    <Link
                      href="/messages"
                      className="text-text hover:text-primary transition-colors"
                    >
                      Messages
                    </Link>
                    <div className="flex items-center space-x-3">
                      <span className="text-text-secondary text-sm">
                        {user.name}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="text-text hover:text-primary transition-colors text-sm"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-text hover:text-primary transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="btn-primary"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}