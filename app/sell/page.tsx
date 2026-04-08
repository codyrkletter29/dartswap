'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ImageCropper from '@/components/ImageCropper';
import VerificationGuard from '@/components/VerificationGuard';

interface ImagePreview {
  dataUrl: string;
  file: File;
}

export default function SellPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('General');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  
  const router = useRouter();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Take only the first file for cropping
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes (before cropping)

    // Validate file size
    if (file.size > maxSize) {
      setError(`Image "${file.name}" is too large. Maximum size is 5MB.`);
      e.target.value = '';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(`File "${file.name}" is not an image.`);
      e.target.value = '';
      return;
    }

    // Check if adding this image would exceed the limit
    if (images.length >= 4) {
      setError('Maximum 4 images allowed.');
      e.target.value = '';
      return;
    }

    // Convert to base64 and open cropper
    try {
      const dataUrl = await fileToBase64(file);
      setCropperImage(dataUrl);
      setPendingImageFile(file);
      setError('');
    } catch (err) {
      setError(`Failed to process image "${file.name}".`);
    }

    // Reset input
    e.target.value = '';
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    if (pendingImageFile) {
      // Create a new File object from the cropped image
      const newImage: ImagePreview = {
        dataUrl: croppedImageUrl,
        file: pendingImageFile,
      };
      setImages([...images, newImage]);
    }
    setCropperImage(null);
    setPendingImageFile(null);
  };

  const handleCropCancel = () => {
    setCropperImage(null);
    setPendingImageFile(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate price
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        throw new Error('Please enter a valid price.');
      }

      // Validate images
      if (images.length === 0) {
        throw new Error('At least one image is required.');
      }

      // Prepare listing data
      const listingData = {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        category: category || 'General',
        images: images.map(img => img.dataUrl),
      };

      // Submit to API
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing');
      }

      const data = await response.json();
      
      // Redirect to the new listing page
      router.push(`/listings/${data.listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VerificationGuard>
      <>
        {cropperImage && (
          <ImageCropper
            imageUrl={cropperImage}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
        
        <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold text-text mb-2">
            Create New Listing
          </h1>
          <p className="text-text-secondary mb-8">
            List an item for sale on DartSwap
          </p>

          {error && (
            <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Textbook for COSC 50"
                className="input"
                required
                maxLength={100}
              />
              <p className="text-xs text-text-secondary mt-1">
                {title.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item in detail..."
                className="input min-h-[120px] resize-y"
                required
                maxLength={2000}
              />
              <p className="text-xs text-text-secondary mt-1">
                {description.length}/2000 characters
              </p>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-text mb-2">
                Price ($) *
              </label>
              <input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="input"
                required
                min="0"
                step="0.01"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text mb-2">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                <option value="General">General</option>
                <option value="Textbooks">Textbooks</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Clothing">Clothing</option>
                <option value="Sports">Sports & Outdoors</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Images *
              </label>
              <p className="text-xs text-text-secondary mb-3">
                Upload 1-4 images (required). Max 1MB per image. Supported formats: JPEG, PNG, GIF, WebP
              </p>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-light">
                        <Image
                          src={img.dataUrl}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {images.length < 4 && (
                <div>
                  <input
                    type="file"
                    id="images"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="images"
                    className="inline-flex items-center justify-center px-4 py-2 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2 text-text-secondary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-text-secondary">
                      Add Images ({images.length}/4)
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
      </>
    </VerificationGuard>
  );
}