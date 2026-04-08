import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
    });

    // Generate verification code and set verification fields
    const verificationCode = generateVerificationCode();
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = expiryTime;
    user.isVerified = false;
    user.verificationAttempts = 0;
    user.lastCodeSentAt = now;
    await user.save();

    // Send verification email (graceful degradation if it fails)
    try {
      await sendVerificationEmail(user.email, user.name, verificationCode);
      console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails to send
    }

    // Generate JWT token
    const token = await generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    // Set cookie
    await setAuthCookie(token);

    // Return user data (without password)
    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}