'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: crop.width,
      height: crop.height,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, rect.width - crop.width));
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y, rect.height - crop.height));
      setCrop({ ...crop, x: newX, y: newY });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(50, Math.min(resizeStart.width + deltaX, rect.width - crop.x));
      const newHeight = Math.max(50, Math.min(resizeStart.height + deltaY, rect.height - crop.y));
      
      setCrop({ ...crop, width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleCrop = async () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const container = containerRef.current;
    
    // Calculate scale factor
    const scaleX = img.naturalWidth / container.offsetWidth;
    const scaleY = img.naturalHeight / container.offsetHeight;

    // Set canvas size to cropped area
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    // Draw cropped image
    ctx.drawImage(
      img,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert to base64
    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedImageUrl);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-text mb-4">Crop Image</h2>
          
          <div
            ref={containerRef}
            className="relative w-full aspect-video bg-background rounded-lg overflow-hidden mb-6"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="w-full h-full object-contain"
              draggable={false}
            />
            
            {/* Crop overlay */}
            <div
              className="absolute border-2 border-primary bg-primary bg-opacity-20 cursor-move"
              style={{
                left: `${crop.x}px`,
                top: `${crop.y}px`,
                width: `${crop.width}px`,
                height: `${crop.height}px`,
              }}
              onMouseDown={handleMouseDown}
            >
              {/* Resize handle in bottom-right corner */}
              <div
                className="absolute -right-1 -bottom-1 w-6 h-6 bg-primary rounded-sm cursor-se-resize flex items-center justify-center shadow-lg hover:bg-opacity-90 transition-all"
                onMouseDown={handleResizeMouseDown}
                style={{ touchAction: 'none' }}
              >
                {/* Resize icon - diagonal lines */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="pointer-events-none"
                >
                  <path
                    d="M14 2L2 14M14 7L7 14M14 12L12 14"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              className="flex-1 btn-primary"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
