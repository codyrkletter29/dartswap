import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Listing from '@/models/Listing';
import mongoose from 'mongoose';

// GET /api/users/[id] - Get public user profile and their listings
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { id } = await context.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch user (excluding sensitive fields)
    const user = await User.findById(id)
      .select('name username profilePhoto createdAt')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all non-deleted listings for this user
    // Sort by status (active first) then by creation date (newest first)
    const listings = await Listing.find({
      seller: id,
      status: { $ne: 'deleted' }
    })
      .sort({ status: 1, createdAt: -1 }) // 'active' comes before 'sold' alphabetically
      .lean();

    // Format response
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt,
      },
      listings: listings.map((listing) => ({
        id: listing._id.toString(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        imageUrl: listing.imageUrl,
        images: listing.images,
        status: listing.status,
        createdAt: listing.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
