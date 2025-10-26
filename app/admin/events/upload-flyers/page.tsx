"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadedFlyer {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
  optimizedSize?: number;
}

export default function BulkFlyerUploadPage() {
  const [flyers, setFlyers] = useState<UploadedFlyer[]>([]);
  const [uploading, setUploading] = useState(false);
  const logFlyer = useMutation(api.flyers.mutations.logUploadedFlyer);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFlyers = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
    }));
    setFlyers((prev) => [...prev, ...newFlyers]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: true,
  });

  const removeFlyer = (id: string) => {
    setFlyers((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAllFlyers = async () => {
    setUploading(true);

    for (const flyer of flyers) {
      if (flyer.status !== "pending") continue;

      // Update status to uploading
      setFlyers((prev) =>
        prev.map((f) => (f.id === flyer.id ? { ...f, status: "uploading" } : f))
      );

      try {
        const formData = new FormData();
        formData.append("file", flyer.file);

        const response = await fetch("/api/admin/upload-flyer", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();

        // Log to database
        try {
          await logFlyer({
            filename: data.filename,
            fileHash: data.hash,
            filepath: data.path,
            originalSize: data.originalSize,
            optimizedSize: data.optimizedSize,
          });
        } catch (logError) {
          console.error("Failed to log flyer:", logError);
        }

        // Update status to success
        setFlyers((prev) =>
          prev.map((f) =>
            f.id === flyer.id
              ? { ...f, status: "success", optimizedSize: data.optimizedSize }
              : f
          )
        );
      } catch (error) {
        // Update status to error
        setFlyers((prev) =>
          prev.map((f) =>
            f.id === flyer.id
              ? {
                  ...f,
                  status: "error",
                  errorMessage: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
      }
    }

    setUploading(false);
  };

  const pendingCount = flyers.filter((f) => f.status === "pending").length;
  const successCount = flyers.filter((f) => f.status === "success").length;
  const errorCount = flyers.filter((f) => f.status === "error").length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bulk Flyer Upload
          </h1>
          <p className="text-gray-600 mb-4">
            Upload event flyers in bulk. Images will be optimized and saved.
          </p>

          {/* Workflow Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Admin Workflow:</h3>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Upload flyers here (bulk upload with optimization)</li>
              <li>System detects duplicates and optimizes images</li>
              <li>Later: Create SAVE-THE-DATE or claimable events from flyers</li>
              <li>Real organizers can claim these events</li>
              <li>After claiming, organizers set up tickets/payment</li>
            </ol>
            <p className="text-xs text-blue-700 mt-3">
              <strong>Note:</strong> Admins don't sell tickets - you create events for organizers to claim!
            </p>
          </div>
        </div>

        {/* Stats */}
        {flyers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total Flyers</p>
              <p className="text-2xl font-bold text-gray-900">{flyers.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Uploaded</p>
              <p className="text-2xl font-bold text-green-600">{successCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">{errorCount}</p>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-lg text-blue-600 font-medium">Drop flyers here...</p>
          ) : (
            <>
              <p className="text-lg text-gray-700 font-medium mb-2">
                Drag & drop flyers here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports: JPG, PNG, WEBP (multiple files)
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {flyers.length > 0 && (
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={uploadAllFlyers}
              disabled={uploading || pendingCount === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? "Uploading..." : `Upload ${pendingCount} Flyer${pendingCount !== 1 ? "s" : ""}`}
            </button>
            <button
              onClick={() => setFlyers([])}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Flyer Grid */}
        {flyers.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {flyers.map((flyer) => (
                <motion.div
                  key={flyer.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image Preview */}
                  <div className="relative aspect-[3/4] bg-gray-100">
                    <img
                      src={flyer.preview}
                      alt={flyer.file.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Status Overlay */}
                    <div className="absolute top-2 right-2">
                      {flyer.status === "pending" && (
                        <button
                          onClick={() => removeFlyer(flyer.id)}
                          className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                      {flyer.status === "uploading" && (
                        <div className="p-2 bg-blue-600 rounded-full">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {flyer.status === "success" && (
                        <div className="p-2 bg-green-600 rounded-full">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {flyer.status === "error" && (
                        <div className="p-2 bg-red-600 rounded-full">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="p-4">
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                      {flyer.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(flyer.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {flyer.status === "success" && flyer.optimizedSize && (
                      <p className="text-xs text-green-600 mt-1">
                        Optimized: {(flyer.optimizedSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}

                    {flyer.status === "error" && flyer.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {flyer.errorMessage}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
