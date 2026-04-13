import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Listing from '@/models/Listing';
import { getCurrentUser } from '@/lib/auth';
import { createListingSchema } from '@/lib/validations';

// GET /api/listings - Get all listings (public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    const listings = await Listing.find({ status })
      .populate('seller', 'name username profilePhoto')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      listings: listings.map((listing) => ({
        id: listing._id.toString(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        imageUrl: listing.imageUrl,
        images: listing.images,
        seller: {
          id: (listing.seller as any)._id.toString(),
          name: (listing.seller as any).name,
          username: (listing.seller as any).username,
          profilePhoto: (listing.seller as any).profilePhoto,
        },
        status: listing.status,
        createdAt: listing.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST /api/listings - Create a new listing (requires auth)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Received listing data:', {
      hasImages: !!body.images,
      imagesCount: body.images?.length,
      hasImageUrl: !!body.imageUrl,
      firstImagePreview: body.images?.[0]?.substring(0, 50) + '...'
    });
    
    const validatedData = createListingSchema.parse(body);
    console.log('Validated listing data:', {
      hasImages: !!validatedData.images,
      imagesCount: validatedData.images?.length,
      hasImageUrl: !!validatedData.imageUrl
    });

    // Connect to database
    await connectDB();

    // Create listing
    const listing = await Listing.create({
      ...validatedData,
      seller: user.userId,
    });
    
    console.log('Created listing in DB:', {
      id: listing._id.toString(),
      hasImages: !!listing.images,
      imagesCount: listing.images?.length,
      hasImageUrl: !!listing.imageUrl
    });

    // Populate seller info
    await listing.populate('seller', 'name email');

    return NextResponse.json(
      {
        listing: {
          id: listing._id.toString(),
          title: listing.title,
          description: listing.description,
          price: listing.price,
          category: listing.category,
          imageUrl: listing.imageUrl,
          images: listing.images,
          seller: listing.seller,
          status: listing.status,
          createdAt: listing.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create listing error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}