import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { getCurrentUser } from '@/lib/auth';
import mongoose from 'mongoose';

// PUT /api/conversations/[id]/read - Mark messages as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === user.userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Mark all messages as read by adding user to readBy array
    await Message.updateMany(
      {
        conversationId: id,
        readBy: { $ne: user.userId }, // Only update messages not already read
      },
      {
        $addToSet: { readBy: user.userId },
      }
    );

    // Reset unread count for this user
    const unreadCounts = conversation.unreadCounts;
    unreadCounts.set(user.userId, 0);
    conversation.unreadCounts = unreadCounts;
    await conversation.save();

    return NextResponse.json({
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
