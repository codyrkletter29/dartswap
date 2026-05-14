'use client';

import { useEffect, useState, useMemo } from 'react';
import ListingCard from './ListingCard';

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
  gender?: 'mens' | 'womens' | 'unisex';
  clothingSubcategory?: 'tops' | 'bottoms' | 'dresses-skirts' | 'shoes' | 'outerwear';
  size?: string;
}

type GenderFilter = 'all' | 'womens' | 'mens';

const SUBCATEGORY_LABELS: Record<string, string> = {
  'tops': 'Tops',
  'bottoms': 'Bottoms',
  'dresses-skirts': 'Dresses & Skirts',
  'shoes': 'Shoes',
  'outerwear': 'Outerwear',
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '0', '2', '4', '6', '8', '10', '12', '14'];

export default function ListingsGrid() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/listings');
      if (!response.ok) throw new Error('Failed to fetch listings');

      const data = await response.json();
      setListings(data.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Determine if any clothing filters are relevant (i.e. any clothing listings exist)
  const hasClothingListings = useMemo(
    () => listings.some((l) => l.gender || l.clothingSubcategory || l.size),
    [listings]
  );

  // Derived filtered list
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      // Gender filter
      if (genderFilter !== 'all') {
        // Unisex items show under both mens and womens
        if (listing.gender !== genderFilter && listing.gender !== 'unisex') return false;
      }

      // Subcategory filter
      if (subcategoryFilter !== 'all') {
        if (listing.clothingSubcategory !== subcategoryFilter) return false;
      }

      // Size filter
      if (sizeFilter !== 'all') {
        if (listing.size !== sizeFilter) return false;
      }

      return true;
    });
  }, [listings, genderFilter, subcategoryFilter, sizeFilter]);

  const activeFilterCount = [
    genderFilter !== 'all',
    subcategoryFilter !== 'all',
    sizeFilter !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setGenderFilter('all');
    setSubcategoryFilter('all');
    setSizeFilter('all');
  };

  if (loading) {
    return (
      <div>
        {/* Skeleton filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-5 border-b border-border animate-pulse">
          <div className="h-9 w-24 bg-border rounded-lg" />
          <div className="h-9 w-24 bg-border rounded-lg" />
          <div className="h-9 w-32 bg-border rounded-lg" />
          <div className="h-9 w-28 bg-border rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="bg-border h-48 rounded-lg mb-4"></div>
              <div className="bg-border h-4 rounded mb-2"></div>
              <div className="bg-border h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error mb-4">{error}</p>
        <button onClick={fetchListings} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ── Filter Bar ── */}
      <div className="mb-6 pb-5 border-b border-border">
        {/* Row 1: gender toggle + item count */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['all', 'womens', 'mens'] as GenderFilter[]).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  genderFilter === g
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-secondary hover:text-text hover:bg-border'
                }`}
              >
                {g === 'all' ? 'All' : g === 'womens' ? "Women's" : "Men's"}
              </button>
            ))}
          </div>
          {!loading && (
            <span className="text-sm text-text-secondary">
              {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {/* Row 2: dropdowns + clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subcategory dropdown */}
          <div className="relative">
            <select
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              className={`appearance-none pl-3 pr-7 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                subcategoryFilter !== 'all'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-surface border-border text-text-secondary hover:text-text hover:bg-border'
              }`}
            >
              <option value="all">Category</option>
              {Object.entries(SUBCATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${subcategoryFilter !== 'all' ? 'text-white' : 'text-text-secondary'}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>

          {/* Size dropdown */}
          <div className="relative">
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className={`appearance-none pl-3 pr-7 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                sizeFilter !== 'all'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-surface border-border text-text-secondary hover:text-text hover:bg-border'
              }`}
            >
              <option value="all">Size</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${sizeFilter !== 'all' ? 'text-white' : 'text-text-secondary'}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary hover:text-text transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Clear
              <span className="ml-0.5 bg-border text-text text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Listings ── */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary text-lg mb-3">No listings match your filters.</p>
          <button onClick={clearFilters} className="btn-secondary text-sm">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}