'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';

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
    email: string;
    memberSince: string;
  };
  status: string;
  createdAt: string;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHideModal, setShowHideModal] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch listing');
        }

        const data = await response.json();
        console.log('Fetched listing data:', {
          id: data.listing.id,
          hasImages: !!data.listing.images,
          imagesCount: data.listing.images?.length,
          hasImageUrl: !!data.listing.imageUrl,
          firstImagePreview: data.listing.images?.[0]?.substring(0, 50) + '...'
        });
        setListing(data.listing);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchListing();
    }
  }, [params.id]);

  const handleMessageSeller = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!listing) return;

    setMessageLoading(true);
    try {
      // Create or get existing conversation
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: listing.seller.id,
          listingId: listing.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      router.push(`/messages/${data.conversationId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleDeleteListing = async () => {
    setShowDeleteModal(false);
    setActionLoading(true);
    try {
      const response = await fetch(`/api/listings/${listing?.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete listing');
      }

      router.push('/my-listings');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete listing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleHidden = async () => {
    if (!listing) return;

    setShowHideModal(false);
    const newStatus = listing.status === 'hidden' ? 'active' : 'hidden';

    setActionLoading(true);
    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update listing');
      }

      const data = await response.json();
      setListing(data.listing);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update listing');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-border rounded-lg mb-6"></div>
          <div className="h-8 bg-border rounded w-3/4 mb-4"></div>
          <div className="h-6 bg-border rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-border rounded mb-6"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center">
          <h2 className="text-2xl font-bold text-text mb-4">
            {error || 'Listing not found'}
          </h2>
          <Link href="/" className="btn-primary inline-block">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const isOwnListing = user?.id === listing.seller.id;
  const formattedDate = new Date(listing.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const memberSince = new Date(listing.seller.memberSince).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  // Get seller display name - prefer username, fallback to name
  const sellerDisplayName = listing.seller.username || listing.seller.name;
  
  // Get seller initials for placeholder avatar
  const sellerInitials = listing.seller.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get the display image - prefer images array, fallback to imageUrl
  const displayImages = listing.images && listing.images.length > 0
    ? listing.images
    : listing.imageUrl
    ? [listing.imageUrl]
    : [];
  const hasImages = displayImages.length > 0;
  
  console.log('Display images:', {
    hasImages,
    count: displayImages.length,
    currentIndex: currentImageIndex,
    firstImagePreview: displayImages[0]?.substring(0, 50) + '...'
  });

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteListing}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Hide/Unhide Confirmation Modal */}
      <ConfirmModal
        isOpen={showHideModal}
        title={listing?.status === 'hidden' ? 'Unhide Listing' : 'Hide Listing'}
        message={
          listing?.status === 'hidden'
            ? 'Unhide this listing? It will be visible to other users again.'
            : 'Hide this listing? It will no longer be visible to other users, but you can unhide it later.'
        }
        confirmText={listing?.status === 'hidden' ? 'Unhide' : 'Hide'}
        cancelText="Cancel"
        variant="warning"
        onConfirm={handleToggleHidden}
        onCancel={() => setShowHideModal(false)}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <div className="card">
        {/* Image Gallery - Fixed 4:3 aspect ratio */}
        <div className="relative w-full bg-border rounded-lg mb-6 overflow-hidden group">
          {hasImages ? (
            <>
              <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                <Image
                  src={displayImages[currentImageIndex]}
                  alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              {/* Image navigation - only show if multiple images */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {/* Image counter */}
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {displayImages.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary text-xl">
              No Image Available
            </div>
          )}
          {listing.status === 'sold' && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">SOLD</span>
            </div>
          )}
        </div>

        {/* Title and Price */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text mb-2">{listing.title}</h1>
          <p className="text-4xl font-bold text-primary">
            {listing.price === 0 ? 'Free' : `$${listing.price.toFixed(2)}`}
          </p>
        </div>

        {/* Category and Date */}
        <div className="flex items-center gap-4 text-sm text-text-secondary mb-6 pb-6 border-b border-border">
          <span className="px-3 py-1 bg-background rounded-full">
            {listing.category}
          </span>
          <span>Posted on {formattedDate}</span>
        </div>

        {/* Description */}
        <div className="mb-6 pb-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text mb-3">Description</h2>
          <p className="text-text-secondary whitespace-pre-wrap">
            {listing.description}
          </p>
        </div>

        {/* Seller Info */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text mb-4">Seller Information</h2>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Profile Photo or Placeholder */}
              {listing.seller.profilePhoto ? (
                <div className="relative w-16 h-16 aspect-square rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={listing.seller.profilePhoto}
                    alt={sellerDisplayName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {sellerInitials}
                </div>
              )}
              <div>
                <Link
                  href={`/profile/${listing.seller.id}`}
                  className="text-lg font-semibold text-text hover:text-primary transition-colors block"
                >
                  {sellerDisplayName}
                </Link>
                <p className="text-sm text-text-secondary">
                  Member since {memberSince}
                </p>
                <Link
                  href={`/user/${listing.seller.id}/listings`}
                  className="text-sm text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1 mt-1"
                >
                  View all listings
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Message Button - Always visible with appropriate state */}
            {isOwnListing ? (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="btn-secondary"
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </span>
                  </Link>
                  <button
                    onClick={() => setShowHideModal(true)}
                    disabled={actionLoading}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {listing.status === 'hidden' ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
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
                      {listing.status === 'hidden' ? 'Unhide' : 'Hide'}
                    </span>
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={actionLoading}
                    className="btn-secondary bg-error hover:bg-red-600 text-white border-error disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete Listing
                    </span>
                  </button>
                </div>
              </div>
            ) : listing.status === 'sold' ? (
              <button
                disabled
                className="btn-secondary opacity-50 cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Sold
                </span>
              </button>
            ) : (
              <button
                onClick={handleMessageSeller}
                disabled={messageLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-shadow"
              >
                {messageLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                ) : !user ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    Log In to Message
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Message Seller
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}