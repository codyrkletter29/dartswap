'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ListingCardProps {
  listing: {
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
    gender?: 'mens' | 'womens' | 'unisex';
    clothingSubcategory?: 'tops' | 'bottoms' | 'dresses-skirts' | 'shoes' | 'outerwear';
    size?: string;
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();

  const handleSellerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/profile/${listing.seller.id}`);
  };

  // Get the first image - prefer images array, fallback to imageUrl
  const displayImage = listing.images && listing.images.length > 0
    ? listing.images[0]
    : listing.imageUrl;

  // Get seller display name - prefer username, fallback to name
  const sellerDisplayName = listing.seller.username || listing.seller.name;
  
  // Get seller initials for placeholder avatar
  const sellerInitials = listing.seller.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format timestamp
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const createdDate = new Date(dateString);
    const diffMs = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Check if posted today
    const isToday = now.toDateString() === createdDate.toDateString();
    if (isToday) {
      return 'posted today';
    }
    
    // Less than 7 days
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
    
    // Less than 4 weeks (28 days)
    if (diffDays < 28) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'wk' : 'wks'} ago`;
    }
    
    // Less than 12 months (365 days)
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    // 1+ years
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'yr' : 'yrs'} ago`;
  };

  return (
    <Link href={`/listings/${listing.id}`} className="card hover:border-primary transition-colors cursor-pointer">
      {/* Image - Fixed 4:3 aspect ratio */}
      <div className="relative w-full bg-border rounded-lg mb-4 overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {displayImage ? (
          <Image
            src={displayImage}
            alt={listing.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-secondary">
            No Image
          </div>
        )}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="text-white font-bold text-xl">SOLD</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <h3 className="text-lg font-semibold text-text mb-1 truncate">
          {listing.title}
        </h3>
        <p className="text-xs text-text-secondary mb-2">
          {formatTimeAgo(listing.createdAt)}
        </p>
        <p className="text-2xl font-bold text-primary mb-2">
          {listing.price === 0 ? 'Free' : `$${listing.price.toFixed(2)}`}
        </p>
        
        {/* Clothing info - only show for clothing listings */}
        {listing.category === 'Clothing' && listing.gender && listing.size && (
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
            <span className="capitalize">{listing.gender}</span>
            <span>•</span>
            <span>Size {listing.size}</span>
            {listing.clothingSubcategory && (
              <>
                <span>•</span>
                <span className="capitalize">{listing.clothingSubcategory.replace('-', '/')}</span>
              </>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{listing.category}</span>
          <button
            onClick={handleSellerClick}
            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors group"
          >
            {/* Profile Photo or Placeholder */}
            {listing.seller.profilePhoto ? (
              <div className="relative w-6 h-6 aspect-square rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={listing.seller.profilePhoto}
                  alt={sellerDisplayName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {sellerInitials}
              </div>
            )}
            <span className="group-hover:underline">{sellerDisplayName}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}