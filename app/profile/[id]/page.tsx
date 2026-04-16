'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ListingCard from '@/components/ListingCard';

interface User {
  id: string;
  name: string;
  username?: string;
  profilePhoto?: string;
  createdAt: string;
}

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
    username?: string;
    profilePhoto?: string;
  };
  status: string;
  createdAt: string;
}

interface ProfileData {
  user: User;
  listings: Listing[];
}

export default function UserProfilePage() {
  const params = useParams();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          }
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-border rounded-full"></div>
              <div>
                <div className="h-8 bg-border rounded w-48 mb-2"></div>
                <div className="h-4 bg-border rounded w-32"></div>
              </div>
            </div>
          </div>
          
          {/* Listings skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card">
                <div className="bg-border h-48 rounded-lg mb-4"></div>
                <div className="bg-border h-4 rounded mb-2"></div>
                <div className="bg-border h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center">
          <h2 className="text-2xl font-bold text-text mb-4">
            {error || 'Profile not found'}
          </h2>
          <Link href="/" className="btn-primary inline-block">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const { user, listings } = profileData;
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  // Separate active and sold listings
  const activeListings = listings.filter(l => l.status === 'active');
  const soldListings = listings.filter(l => l.status === 'sold');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center text-primary hover:text-primary-dark mb-6 transition-colors"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Listings
      </Link>

      {/* User Header */}
      <div className="card mb-8">
        <div className="flex items-center gap-6">
          {user.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.username || user.name}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 aspect-square bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {(user.username || user.name).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">{user.username || user.name}</h1>
            <p className="text-text-secondary">
              Member since {memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* Active Listings Section */}
      {activeListings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text mb-4">
            Active Listings ({activeListings.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  ...listing,
                  seller: {
                    id: user.id,
                    name: user.name,
                  },
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sold Listings Section */}
      {soldListings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text mb-4">
            Sold Listings ({soldListings.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {soldListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  ...listing,
                  seller: {
                    id: user.id,
                    name: user.name,
                  },
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {listings.length === 0 && (
        <div className="card text-center py-12">
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
          <h3 className="text-xl font-semibold text-text mb-2">
            No listings yet
          </h3>
          <p className="text-text-secondary">
            This user hasn't posted any listings.
          </p>
        </div>
      )}
    </div>
  );
}