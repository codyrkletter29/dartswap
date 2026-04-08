import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';

export interface IListing extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  images?: string[];
  seller: mongoose.Types.ObjectId | IUser;
  status: 'active' | 'sold' | 'deleted' | 'hidden';
  createdAt: Date;
}

const ListingSchema = new Schema<IListing>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  images: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 4;
      },
      message: 'Maximum 4 images allowed',
    },
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required'],
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'deleted', 'hidden'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
ListingSchema.index({ status: 1, createdAt: -1 }); // For fetching active listings sorted by date
ListingSchema.index({ seller: 1 }); // For fetching user's listings

const Listing: Model<IListing> = mongoose.models.Listing || mongoose.model<IListing>('Listing', ListingSchema);

export default Listing;