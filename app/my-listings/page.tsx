'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';
import VerificationGuard from '@/components/VerificationGuard';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  images?: string[];
  seller: {
    id: string;
    name: string;
  };
  status: string;
  createdAt: string;
}

type TabType = 'active' | 'hidden';

export default function MyListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    try {
      const response = await fetch('/api/listings');
      if (!response.ok) throw new Error('Failed to fetch listings');
      
      const data = await response.json();
      // Filter listings to only show current user's listings (including hidden ones)
      const myListings = data.listings.filter(
        (listing: Listing) => listing.seller.id === user?.id
      );
      setListings(myListings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter listings based on active tab
  const activeListings = listings.filter(
    (listing) => listing.status !== 'hidden' && listing.status !== 'sold'
  );
  const hiddenListings = listings.filter(
    (listing) => listing.status === 'hidden'
  );
  const soldListings = listings.filter(
    (listing) => listing.status === 'sold'
  );

  const displayedListings = activeTab === 'active'
    ? [...activeListings, ...soldListings]
    : hiddenListings;

  if (loading) {
    return (
      <VerificationGuard>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-text mb-8">My Listings</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="bg-border h-48 rounded-lg mb-4"></div>
                <div className="bg-border h-4 rounded mb-2"></div>
                <div className="bg-border h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </VerificationGuard>
    );
  }

  if (error) {
    return (
      <VerificationGuard>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-text mb-8">My Listings</h1>
          <div className="text-center py-12">
            <p className="text-error mb-4">{error}</p>
            <button onClick={fetchMyListings} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </VerificationGuard>
    );
  }

  return (
    <VerificationGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text">My Listings</h1>
        <Link href="/sell" className="btn-primary">
          Create New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12 card">
          <svg
            className="w-16 h-16 mx-auto text-text-secondary mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-text-secondary text-lg mb-4">
            You haven't created any listings yet.
          </p>
          <Link href="/sell" className="btn-primary inline-block">
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'active'
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Active Listings
              {activeListings.length + soldListings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary bg-opacity-20 text-primary">
                  {activeListings.length + soldListings.length}
                </span>
              )}
              {activeTab === 'active' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('hidden')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'hidden'
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Hidden Listings
              {hiddenListings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary bg-opacity-20 text-primary">
                  {hiddenListings.length}
                </span>
              )}
              {activeTab === 'hidden' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
          </div>

          {/* Listings Grid */}
          {displayedListings.length === 0 ? (
            <div className="text-center py-12 card">
              <svg
                className="w-16 h-16 mx-auto text-text-secondary mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {activeTab === 'active' ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                )}
              </svg>
              <p className="text-text-secondary text-lg mb-4">
                {activeTab === 'active'
                  ? 'No active listings.'
                  : 'No hidden listings.'}
              </p>
              {activeTab === 'active' && (
                <Link href="/sell" className="btn-primary inline-block">
                  Create a Listing
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </VerificationGuard>
  );
}