"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload, Image as ImageIcon, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VenueImageUploaderProps {
  currentImageUrl?: string;
  onImageUploaded: (storageId: string, url: string) => void;
  onImageRemoved: () => void;
  compact?: boolean; // New prop for compact mode
}

export default function VenueImageUploader({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  compact = false,
}: VenueImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
  const getImageUrl = useMutation(api.upload.getImageUrl);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      await uploadImage(file);
    } else {
      alert("Please upload an image file (PNG, JPG, or SVG)");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Get the public URL
      const url = await getImageUrl({ storageId });

      if (url) {
        onImageUploaded(storageId, url);
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const scrollToCanvas = () => {
    const canvas = document.getElementById("seating-canvas");
    if (canvas) {
      canvas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Compact mode: Minimal UI when not expanded
  if (compact && !isExpanded && !preview) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-all text-sm font-medium text-gray-600"
      >
        <ImageIcon className="w-4 h-4" />
        <span>Add Background Image (Optional)</span>
        <ChevronDown className="w-4 h-4" />
      </button>
    );
  }

  // Compact mode with image loaded: Show minimal indicator
  if (compact && preview) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Background Image Loaded</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={isExpanded ? "Collapse" : "Expand preview"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <button
            onClick={handleRemove}
            className="p-1 hover:bg-red-50 rounded transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {compact && isExpanded && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Venue Background Image</h3>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ChevronUp className="w-3 h-3" />
            Collapse
          </button>
        </div>
      )}

      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Step 1: Venue Floor Plan (Optional)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {preview
                ? "Upload a venue image or floor plan to place sections visually"
                : "You can design on a blank canvas below, or upload a floor plan image"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!preview && (
              <button
                onClick={scrollToCanvas}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
              >
                Skip to Canvas →
              </button>
            )}
            {preview && (
              <button
                onClick={handleRemove}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Remove Image
              </button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-50"
          >
            <img src={preview} alt="Venue floor plan" className="w-full h-64 object-contain" />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Uploading...</span>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-lg border-2 border-dashed transition-all cursor-pointer ${
              isDragging
                ? "border-primary bg-accent"
                : "border-gray-300 hover:border-blue-400 hover:bg-accent"
            }`}
          >
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  isDragging ? "bg-accent" : "bg-gray-100"
                }`}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : isDragging ? (
                  <Upload className="w-8 h-8 text-primary" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {isDragging ? "Drop image here" : "Upload venue floor plan"}
              </h4>
              <p className="text-sm text-gray-600 text-center mb-4">
                Drag and drop an image, or click to browse
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-xs font-medium text-gray-500">OR</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              <p className="text-sm font-medium text-primary">
                Scroll down to start designing on a blank canvas →
              </p>
              <p className="text-xs text-gray-500 mt-2">Supports PNG, JPG, and SVG files</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {preview && (
        <div className="bg-accent border border-primary/30 rounded-lg p-4">
          <p className="text-sm text-foreground">
            <strong>Tip:</strong> You can now drag and position sections directly on this venue
            image using the canvas editor below.
          </p>
        </div>
      )}
    </div>
  );
}
