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
  
  // Clothing-specific fields
  const [gender, setGender] = useState<'mens' | 'womens' | 'unisex'>('mens');
  const [clothingSubcategory, setClothingSubcategory] = useState<'tops' | 'bottoms' | 'dresses-skirts' | 'shoes' | 'outerwear'>('tops');
  const [size, setSize] = useState('');
  
  // Men's bottoms waist/length fields
  const [waist, setWaist] = useState('');
  const [length, setLength] = useState('');
  
  const router = useRouter();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Take only the first file for cropping
    const maxSize = 15 * 1024 * 1024; // 15MB in bytes (before cropping)

    // Validate file size
    if (file.size > maxSize) {
      setError(`Image "${file.name}" is too large. Maximum size is 15MB.`);
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

      // Validate clothing fields if category is Clothing
      if (category === 'Clothing') {
        if (!gender || !clothingSubcategory) {
          throw new Error('Gender and subcategory are required for clothing items.');
        }
        
        // For men's bottoms, validate waist and length
        if (gender === 'mens' && clothingSubcategory === 'bottoms') {
          if (!waist || !length) {
            throw new Error('Waist and length are required for men\'s bottoms.');
          }
        } else {
          // For all other clothing, validate size
          if (!size) {
            throw new Error('Size is required for clothing items.');
          }
        }
      }

      // Prepare listing data
      const listingData: any = {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        category: category || 'General',
        images: images.map(img => img.dataUrl),
      };

      // Add clothing fields if category is Clothing
      if (category === 'Clothing') {
        listingData.gender = gender;
        listingData.clothingSubcategory = clothingSubcategory;
        
        // For men's bottoms, combine waist and length into size
        if (gender === 'mens' && clothingSubcategory === 'bottoms') {
          listingData.size = `${waist}x${length}`;
        } else {
          listingData.size = size;
        }
      }

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
                onChange={(e) => {
                  setCategory(e.target.value);
                  // Clear clothing fields when switching away from Clothing
                  if (e.target.value !== 'Clothing') {
                    setGender('mens');
                    setClothingSubcategory('tops');
                    setSize('');
                    setWaist('');
                    setLength('');
                  }
                }}
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

            {/* Clothing-specific fields - only show when Clothing is selected */}
            {category === 'Clothing' && (
              <>
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Gender *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGender('mens');
                        // Reset size fields when changing gender
                        setSize('');
                        setWaist('');
                        setLength('');
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        gender === 'mens'
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-surface hover:border-primary'
                      }`}
                    >
                      Mens
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGender('womens');
                        // Reset size fields when changing gender
                        setSize('');
                        setWaist('');
                        setLength('');
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        gender === 'womens'
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-surface hover:border-primary'
                      }`}
                    >
                      Womens
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGender('unisex');
                        // Reset size fields when changing gender
                        setSize('');
                        setWaist('');
                        setLength('');
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        gender === 'unisex'
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-surface hover:border-primary'
                      }`}
                    >
                      Unisex
                    </button>
                  </div>
                </div>

                {/* Subcategory */}
                <div>
                  <label htmlFor="clothingSubcategory" className="block text-sm font-medium text-text mb-2">
                    Subcategory *
                  </label>
                  <select
                    id="clothingSubcategory"
                    value={clothingSubcategory}
                    onChange={(e) => {
                      setClothingSubcategory(e.target.value as any);
                      // Reset size fields when subcategory changes
                      setSize('');
                      setWaist('');
                      setLength('');
                    }}
                    className="input"
                  >
                    <option value="tops">Tops</option>
                    <option value="bottoms">Bottoms</option>
                    <option value="dresses-skirts">Dresses/Skirts</option>
                    <option value="shoes">Shoes</option>
                    <option value="outerwear">Outerwear</option>
                  </select>
                </div>

                {/* Size - Men's Bottoms use Waist/Length, others use standard sizes */}
                {gender === 'mens' && clothingSubcategory === 'bottoms' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Waist */}
                    <div>
                      <label htmlFor="waist" className="block text-sm font-medium text-text mb-2">
                        Waist *
                      </label>
                      <select
                        id="waist"
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                        className="input"
                        required={category === 'Clothing'}
                      >
                        <option value="">Select waist</option>
                        <option value="28">28</option>
                        <option value="29">29</option>
                        <option value="30">30</option>
                        <option value="31">31</option>
                        <option value="32">32</option>
                        <option value="33">33</option>
                        <option value="34">34</option>
                        <option value="35">35</option>
                        <option value="36">36</option>
                        <option value="38">38</option>
                        <option value="40">40</option>
                        <option value="42">42</option>
                      </select>
                    </div>
                    
                    {/* Length */}
                    <div>
                      <label htmlFor="length" className="block text-sm font-medium text-text mb-2">
                        Length *
                      </label>
                      <select
                        id="length"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="input"
                        required={category === 'Clothing'}
                      >
                        <option value="">Select length</option>
                        <option value="28">28</option>
                        <option value="30">30</option>
                        <option value="32">32</option>
                        <option value="34">34</option>
                        <option value="36">36</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-text mb-2">
                      Size *
                    </label>
                    <select
                      id="size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="input"
                      required={category === 'Clothing'}
                    >
                      <option value="">Select a size</option>
                      {clothingSubcategory === 'shoes' ? (
                        <>
                          <option value="5">5</option>
                          <option value="5.5">5.5</option>
                          <option value="6">6</option>
                          <option value="6.5">6.5</option>
                          <option value="7">7</option>
                          <option value="7.5">7.5</option>
                          <option value="8">8</option>
                          <option value="8.5">8.5</option>
                          <option value="9">9</option>
                          <option value="9.5">9.5</option>
                          <option value="10">10</option>
                          <option value="10.5">10.5</option>
                          <option value="11">11</option>
                          <option value="11.5">11.5</option>
                          <option value="12">12</option>
                          <option value="13">13</option>
                        </>
                      ) : (
                        <>
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </>
            )}

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