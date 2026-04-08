import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Listing from '@/models/Listing';
import mongoose from 'mongoose';
import { getCurrentUser } from '@/lib/auth';

// GET /api/listings/[id] - Get a single listing (public)
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    await connectDB();

    const { id } = await context.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    const listing = await Listing.findById(id)
      .populate('seller', 'name email createdAt')
      .lean();

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      listing: {
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
          email: (listing.seller as any).email,
          memberSince: (listing.seller as any).createdAt,
        },
        status: listing.status,
        createdAt: listing.createdAt,
      },
    });
  } catch (error) {
    console.error('Get listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PUT /api/listings/[id] - Update a listing (authenticated, owner only)
export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    await connectDB();

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    // Find the listing
    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (listing.seller.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this listing' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description, price, category, images, status } = body;

    // Update fields if provided
    if (title !== undefined) listing.title = title;
    if (description !== undefined) listing.description = description;
    if (price !== undefined) listing.price = price;
    if (category !== undefined) listing.category = category;
    if (images !== undefined) listing.images = images;
    if (status !== undefined) listing.status = status;

    await listing.save();

    // Populate seller info for response
    await listing.populate('seller', 'name email createdAt');

    return NextResponse.json({
      listing: {
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
          email: (listing.seller as any).email,
          memberSince: (listing.seller as any).createdAt,
        },
        status: listing.status,
        createdAt: listing.createdAt,
      },
    });
  } catch (error) {
    console.error('Update listing error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/[id] - Delete a listing (authenticated, owner only)
export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    await connectDB();

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    // Find the listing
    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (listing.seller.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this listing' },
        { status: 403 }
      );
    }

    // Soft delete by setting status to 'deleted'
    listing.status = 'deleted';
    await listing.save();

    return NextResponse.json({
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
