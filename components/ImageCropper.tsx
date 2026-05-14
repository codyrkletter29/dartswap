'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // Optional: 4/3 for listings, 1 for profiles. Defaults to 4/3
}

export default function ImageCropper({ imageUrl, onCropComplete, onCancel, aspectRatio = 4 / 3 }: ImageCropperProps) {
  const ASPECT_RATIO = aspectRatio;

  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, size: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // ── Pointer helpers (unify mouse + touch) ──────────────────────────────────

  const getClientXY = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  // ── Drag (move crop box) ───────────────────────────────────────────────────

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getClientXY(e);
    setIsDragging(true);
    setDragStart({ x: x - crop.x, y: y - crop.y });
  };

  // ── Resize ────────────────────────────────────────────────────────────────

  const startResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = getClientXY(e);
    setIsResizing(true);
    setResizeStart({ x, y, size: crop.size });
  };

  // ── Move handler (shared mouse + touch) ──────────────────────────────────

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    if (!isDragging && !isResizing) return;

    e.preventDefault();
    const { x, y } = getClientXY(e);
    const rect = containerRef.current.getBoundingClientRect();
    const cropWidth = crop.size;
    const cropHeight = crop.size / ASPECT_RATIO;

    if (isDragging) {
      const newX = Math.max(0, Math.min(x - dragStart.x, rect.width - cropWidth));
      const newY = Math.max(0, Math.min(y - dragStart.y, rect.height - cropHeight));
      setCrop((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      const delta = Math.max(deltaX, deltaY * ASPECT_RATIO);
      const newSize = Math.max(60, Math.min(
        resizeStart.size + delta,
        Math.min(rect.width - crop.x, (rect.height - crop.y) * ASPECT_RATIO)
      ));
      setCrop((prev) => ({ ...prev, size: newSize }));
    }
  }, [isDragging, isResizing, dragStart, resizeStart, crop.x, crop.y, crop.size, ASPECT_RATIO]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Attach global listeners so dragging outside the box still works
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMove, { passive: false });
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isResizing, handleMove, handleEnd]);

  // ── Initialise crop box centred when image loads ──────────────────────────

  const initialiseCrop = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const maxW = rect.width * 0.8;
    const maxH = rect.height * 0.8;
    const sizeByW = maxW;
    const sizeByH = maxH * ASPECT_RATIO;
    const size = Math.min(sizeByW, sizeByH);
    const cropW = size;
    const cropH = size / ASPECT_RATIO;
    setCrop({
      x: (rect.width - cropW) / 2,
      y: (rect.height - cropH) / 2,
      size,
    });
  };

  // ── Apply crop ────────────────────────────────────────────────────────────

  const handleCrop = async () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const container = containerRef.current;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const imageAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = containerWidth / containerHeight;

    let displayedWidth, displayedHeight, offsetX, offsetY;

    if (imageAspect > containerAspect) {
      displayedWidth = containerWidth;
      displayedHeight = containerWidth / imageAspect;
      offsetX = 0;
      offsetY = (containerHeight - displayedHeight) / 2;
    } else {
      displayedHeight = containerHeight;
      displayedWidth = containerHeight * imageAspect;
      offsetX = (containerWidth - displayedWidth) / 2;
      offsetY = 0;
    }

    const cropWidth = crop.size;
    const cropHeight = crop.size / ASPECT_RATIO;

    const outputWidth = ASPECT_RATIO >= 1 ? 1200 : 900;
    const outputHeight = outputWidth / ASPECT_RATIO;

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    const cropLeft = crop.x;
    const cropTop = crop.y;
    const cropRight = crop.x + cropWidth;
    const cropBottom = crop.y + cropHeight;

    const overlapLeft = Math.max(cropLeft, offsetX);
    const overlapTop = Math.max(cropTop, offsetY);
    const overlapRight = Math.min(cropRight, offsetX + displayedWidth);
    const overlapBottom = Math.min(cropTop + cropHeight, offsetY + displayedHeight);

    if (overlapRight > overlapLeft && overlapBottom > overlapTop) {
      const sourceX = ((overlapLeft - offsetX) / displayedWidth) * img.naturalWidth;
      const sourceY = ((overlapTop - offsetY) / displayedHeight) * img.naturalHeight;
      const sourceWidth = ((overlapRight - overlapLeft) / displayedWidth) * img.naturalWidth;
      const sourceHeight = ((overlapBottom - overlapTop) / displayedHeight) * img.naturalHeight;

      const destX = ((overlapLeft - cropLeft) / cropWidth) * outputWidth;
      const destY = ((overlapTop - cropTop) / cropHeight) * outputHeight;
      const destWidth = ((overlapRight - overlapLeft) / cropWidth) * outputWidth;
      const destHeight = ((overlapBottom - overlapTop) / cropHeight) * outputHeight;

      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
    }

    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedImageUrl);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border flex-shrink-0">
        <button
          onClick={onCancel}
          className="text-text-secondary hover:text-text transition-colors p-1"
        >
          Cancel
        </button>
        <h2 className="text-base font-semibold text-text">Crop Image</h2>
        <button
          onClick={handleCrop}
          className="btn-primary text-sm py-1.5 px-4"
        >
          Apply
        </button>
      </div>

      {/* Crop area — fills remaining space */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          ref={containerRef}
          className="relative w-full bg-black rounded-lg overflow-hidden"
          style={{ aspectRatio: '4/3', maxHeight: '70vh', maxWidth: '100%' }}
          onLoad={initialiseCrop}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Crop preview"
            className="w-full h-full object-contain"
            draggable={false}
            onLoad={initialiseCrop}
          />

          {/* Dark overlay around crop box */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(to bottom,
                  rgba(0,0,0,0.55) ${crop.y}px,
                  transparent ${crop.y}px,
                  transparent ${crop.y + crop.size / ASPECT_RATIO}px,
                  rgba(0,0,0,0.55) ${crop.y + crop.size / ASPECT_RATIO}px
                ),
                linear-gradient(to right,
                  rgba(0,0,0,0.55) ${crop.x}px,
                  transparent ${crop.x}px,
                  transparent ${crop.x + crop.size}px,
                  rgba(0,0,0,0.55) ${crop.x + crop.size}px
                )
              `,
            }}
          />

          {/* Draggable crop box */}
          <div
            className="absolute border-2 border-white cursor-move touch-none"
            style={{
              left: `${crop.x}px`,
              top: `${crop.y}px`,
              width: `${crop.size}px`,
              height: `${crop.size / ASPECT_RATIO}px`,
            }}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          >
            {/* Rule-of-thirds grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
              <div className="absolute top-2/3 left-0 right-0 border-t border-white/30" />
              <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
              <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30" />
            </div>

            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-white rounded-sm" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-sm" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white rounded-sm" />

            {/* Bottom-right resize handle — larger for touch */}
            <div
              className="absolute -bottom-3 -right-3 w-8 h-8 flex items-center justify-center cursor-se-resize touch-none"
              onMouseDown={startResize}
              onTouchStart={startResize}
            >
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-text-secondary pb-4 flex-shrink-0">
        Drag to move · Drag corner to resize
      </p>
    </div>
  );
}
