import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { verifyEmailSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = verifyEmailSchema.parse(body);

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

    // Find user and include verification fields
    const user = await User.findById(currentUser.userId).select('+verificationCode');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user is already verified, return success
    if (user.isVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
      });
    }

    // Check if user has a verification code set
    if (!user.verificationCode) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if the code has expired
    if (!user.verificationCodeExpiry || user.verificationCodeExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if verification attempts >= 5
    if (user.verificationAttempts >= 5) {
      // Invalidate the code
      user.verificationCode = undefined;
      user.verificationCodeExpiry = undefined;
      user.verificationAttempts = 0;
      await user.save();
      
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new verification code.' },
        { status: 400 }
      );
    }

    // Compare the submitted code with the stored verificationCode
    if (validatedData.code !== user.verificationCode) {
      // Increment verification attempts
      user.verificationAttempts += 1;
      await user.save();
      
      const attemptsRemaining = 5 - user.verificationAttempts;
      return NextResponse.json(
        { 
          error: `Invalid verification code. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.` 
        },
        { status: 400 }
      );
    }

    // Code matches - verify the user
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    user.verificationAttempts = 0;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
