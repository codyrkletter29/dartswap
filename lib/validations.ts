import { z } from 'zod';

// Auth validations
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z
    .string()
    .email('Invalid email format')
    .regex(/.*@dartmouth\.edu$/, 'Must be a Dartmouth email (@dartmouth.edu)'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be a 6-digit number'),
});

// Listing validations
export const createListingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  price: z.number().min(0, 'Price cannot be negative'),
  category: z.string().optional().default('General'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  images: z.array(z.string()).min(1, 'At least one image is required').max(4, 'Maximum 4 images allowed').optional(),
}).refine(
  (data) => data.images || data.imageUrl,
  { message: 'Either images array or imageUrl is required' }
);

// Messaging validations
export const createConversationSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  sellerId: z.string().min(1, 'Seller ID is required'),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;