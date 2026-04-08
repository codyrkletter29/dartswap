import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastActiveAt: Date;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  verificationAttempts: number;
  isVerified: boolean;
  lastCodeSentAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.*@dartmouth\.edu$/, 'Must be a valid Dartmouth email (@dartmouth.edu)'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false, // Don't include password hash in queries by default
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
  verificationCode: {
    type: String,
    select: false, // Don't include verification code in queries by default
  },
  verificationCodeExpiry: {
    type: Date,
  },
  verificationAttempts: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  lastCodeSentAt: {
    type: Date,
  },
});

// Create index on email for faster lookups
UserSchema.index({ email: 1 });

// Create index on isVerified for query performance
UserSchema.index({ isVerified: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;