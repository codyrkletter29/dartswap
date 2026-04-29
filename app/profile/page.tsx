'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';
import VerificationGuard from '@/components/VerificationGuard';
import ImageCropper from '@/components/ImageCropper';

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

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Profile editing states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  
  // Photo upload states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);

  // Fetch fresh user data on mount to ensure username and profilePhoto are loaded
  useEffect(() => {
    refreshUser();
  }, []);

  // Refetch listings whenever user is available
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchMyListings();
    }
  }, [user]);

  // Refetch listings when navigating to this page
  useEffect(() => {
    if (user && pathname === '/profile') {
      setRefreshKey(prev => prev + 1);
    }
  }, [pathname, user]);

  // Refetch when refreshKey changes
  useEffect(() => {
    if (user && refreshKey > 0) {
      fetchMyListings();
    }
  }, [refreshKey]);

  const fetchMyListings = async () => {
    try {
      // Fetch all listings for all statuses to get user's complete listing collection
      const statuses = ['active', 'hidden', 'sold'];
      const allListings: Listing[] = [];
      
      // Fetch listings for each status
      for (const status of statuses) {
        const response = await fetch(`/api/listings?status=${status}`);
        if (response.ok) {
          const data = await response.json();
          // Filter to only current user's listings
          const userListings = data.listings.filter(
            (listing: Listing) => listing.seller.id === user?.id
          );
          allListings.push(...userListings);
        }
      }
      
      setListings(allListings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUsername = () => {
    setNewUsername(user?.username || '');
    setUsernameError(null);
    setIsEditingUsername(true);
  };

  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    setNewUsername('');
    setUsernameError(null);
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }

    setIsSavingUsername(true);
    setUsernameError(null);

    try {
      console.log('Updating username to:', newUsername.trim());
      
      const response = await fetch('/api/user/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update username');
      }

      const responseData = await response.json();
      console.log('Username update response:', responseData);
      console.log('Calling refreshUser()...');
      console.log('BEFORE refreshUser - user.username:', user?.username);
      console.log('BEFORE refreshUser - user.profilePhoto:', user?.profilePhoto);
      
      // Refresh user data from server
      await refreshUser();
      
      console.log('AFTER refreshUser - user.username (STALE - closure):', user?.username);
      console.log('AFTER refreshUser - user.profilePhoto (STALE - closure):', user?.profilePhoto);
      console.log('NOTE: The above values are STALE due to React closure. The actual state has been updated.');
      console.log('The component will re-render with the new values shortly.');
      
      // Close edit form and clear state
      setIsEditingUsername(false);
      setNewUsername('');
      setUsernameError('');
    } catch (err) {
      console.error('Error updating username:', err);
      setUsernameError(err instanceof Error ? err.message : 'Failed to update username');
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file');
      return;
    }

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setPhotoError('Image must be less than 15MB');
      return;
    }

    setPhotoError(null);

    try {
      // Convert to base64
      const dataUrl = await fileToBase64(file);
      
      // Open cropper
      setCropperImage(dataUrl);
    } catch (err) {
      setPhotoError('Failed to process image');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    setIsUploadingPhoto(true);
    setPhotoError(null);
    setCropperImage(null);

    try {
      console.log('Uploading profile photo...');
      
      // Update user profile photo
      const response = await fetch('/api/user/photo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhoto: croppedImageUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update photo');
      }

      const responseData = await response.json();
      console.log('Photo update response:', responseData);
      console.log('Calling refreshUser()...');
      console.log('BEFORE refreshUser - user.username:', user?.username);
      console.log('BEFORE refreshUser - user.profilePhoto:', user?.profilePhoto);
      
      // Refresh user data from server
      await refreshUser();
      
      console.log('AFTER refreshUser - user.username (STALE - closure):', user?.username);
      console.log('AFTER refreshUser - user.profilePhoto (STALE - closure):', user?.profilePhoto);
      console.log('NOTE: The above values are STALE due to React closure. The actual state has been updated.');
      console.log('The component will re-render with the new values shortly.');
      
      // Clear error state
      setPhotoError('');
    } catch (err) {
      console.error('Error uploading photo:', err);
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCropCancel = () => {
    setCropperImage(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          <div className="card p-8 mb-8 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-border"></div>
              <div className="flex-1">
                <div className="bg-border h-6 rounded w-48 mb-2"></div>
                <div className="bg-border h-4 rounded w-32"></div>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-text mb-6">My Listings</h2>
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
          <h1 className="text-3xl font-bold text-text mb-8">Profile</h1>
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
      <>
        {cropperImage && (
          <ImageCropper
            imageUrl={cropperImage}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspectRatio={1}
          />
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="card p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Profile Photo */}
            <div className="relative">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-24 h-24 aspect-square rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary bg-opacity-20 flex items-center justify-center border-2 border-border">
                  <span className="text-2xl font-bold text-primary">
                    {user ? getInitials(user.name) : '?'}
                  </span>
                </div>
              )}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-background bg-opacity-75 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-text mb-1">
                  {user?.username || 'Set username'}
                </h1>
                {!isEditingUsername ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleEditUsername}
                      className="text-sm text-primary hover:text-primary-dark transition-colors"
                    >
                      Edit Username
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Enter username"
                        className="input max-w-xs"
                        disabled={isSavingUsername}
                      />
                      <button
                        onClick={handleSaveUsername}
                        disabled={isSavingUsername}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        {isSavingUsername ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEditUsername}
                        disabled={isSavingUsername}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                    {usernameError && (
                      <p className="text-error text-sm">{usernameError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Upload Photo Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="btn-secondary text-sm"
                >
                  {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
                {photoError && (
                  <p className="text-error text-sm mt-2">{photoError}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* My Listings Section */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-text">My Listings</h2>
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
      </>
    </VerificationGuard>
  );
}
