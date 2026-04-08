import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(currentUser.userId).select('+verificationCode');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user is already verified, return error
    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Check if 60 seconds have passed since lastCodeSentAt (throttling)
    if (user.lastCodeSentAt) {
      const timeSinceLastCode = Date.now() - user.lastCodeSentAt.getTime();
      const secondsRemaining = Math.ceil((60000 - timeSinceLastCode) / 1000);
      
      if (timeSinceLastCode < 60000) {
        return NextResponse.json(
          { error: `Please wait ${secondsRemaining} second${secondsRemaining !== 1 ? 's' : ''} before requesting a new code` },
          { status: 429 }
        );
      }
    }

    // Check if we need to generate a new code
    const needsNewCode = 
      !user.verificationCode || 
      !user.verificationCodeExpiry || 
      user.verificationCodeExpiry < new Date() ||
      user.verificationAttempts >= 5;

    // Generate a new 6-digit code
    const newCode = generateVerificationCode();
    
    // Set verification fields
    user.verificationCode = newCode;
    user.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    user.lastCodeSentAt = new Date();
    user.verificationAttempts = 0;
    
    await user.save();

    // Send the verification email
    const emailSent = await sendVerificationEmail(user.email, user.name, newCode);
    
    if (!emailSent) {
      console.warn('Verification email could not be sent, but code was saved');
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);

    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
