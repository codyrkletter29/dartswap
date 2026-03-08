import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { sendMessageSchema } from '@/lib/validations';
import { sendMessageNotification } from '@/lib/email';
import mongoose from 'mongoose';

// GET /api/conversations/[id]/messages - Get all messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

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
      (p) => p.toString() === user.userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get messages
    const messages = await Message.find({ conversationId: id })
      .populate('sender', 'name')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      messages: messages.map((msg) => ({
        id: msg._id.toString(),
        sender: {
          id: (msg.sender as any)._id.toString(),
          name: (msg.sender as any).name,
        },
        content: msg.content,
        readBy: msg.readBy.map((id) => id.toString()),
        createdAt: msg.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    await connectDB();

    const { id } = params;

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
      (p) => p.toString() === user.userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create message
    const message = await Message.create({
      conversationId: id,
      sender: user.userId,
      content: validatedData.content,
      readBy: [user.userId], // Sender has read their own message
    });

    // Update conversation
    const otherParticipantId = conversation.participants.find(
      (p) => p.toString() !== user.userId
    )?.toString();

    const unreadCounts = conversation.unreadCounts;
    if (otherParticipantId) {
      const currentCount = unreadCounts.get(otherParticipantId) || 0;
      unreadCounts.set(otherParticipantId, currentCount + 1);
    }

    conversation.lastMessage = validatedData.content;
    conversation.lastMessageAt = new Date();
    conversation.unreadCounts = unreadCounts;
    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'name');

    // Check if recipient needs email notification
    if (otherParticipantId) {
      try {
        const recipient = await User.findById(otherParticipantId);
        if (recipient) {
          const now = new Date();
          const lastActive = recipient.lastActiveAt || recipient.createdAt;
          const inactiveMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
          
          // Send email if user has been inactive for more than 15 minutes
          const INACTIVE_THRESHOLD_MINUTES = 15;
          if (inactiveMinutes > INACTIVE_THRESHOLD_MINUTES) {
            // Await email notification to ensure it completes on serverless platforms
            try {
              await sendMessageNotification({
                recipientEmail: recipient.email,
                recipientName: recipient.name,
                senderName: user.name,
                messagePreview: validatedData.content,
              });
            } catch (emailError) {
              // Log error but don't fail the request
              console.error('Failed to send email notification:', emailError);
            }
          }
        }
      } catch (error) {
        // Log error but don't fail the request
        console.error('Error checking recipient activity for email notification:', error);
      }
    }

    return NextResponse.json(
      {
        message: {
          id: message._id.toString(),
          sender: {
            id: (message.sender as any)._id.toString(),
            name: (message.sender as any).name,
          },
          content: message.content,
          readBy: message.readBy.map((id) => id.toString()),
          createdAt: message.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Send message error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}