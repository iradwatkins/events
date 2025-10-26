"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Upload, X, CheckCircle, AlertCircle, Sparkles, DollarSign,
  TrendingUp, Users, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";

interface UploadedFlyer {
  id: string;
  flyerId?: Id<"uploadedFlyers">;
  file: File;
  preview: string;
  filepath?: string;
  status: "pending" | "uploading" | "success" | "extracting" | "extracted" | "error";
  errorMessage?: string;
  optimizedSize?: number;
  extractedData?: any;
}

export default function BulkFlyerUploadPage() {
  const [flyers, setFlyers] = useState<UploadedFlyer[]>([]);
  const [uploading, setUploading] = useState(false);
  const [expandedFlyerId, setExpandedFlyerId] = useState<string | null>(null);

  const logFlyer = useMutation(api.flyers.mutations.logUploadedFlyer);
  const updateExtractedData = useMutation(api.flyers.mutations.updateFlyerWithExtractedData);
  const createEvent = useMutation(api.flyers.mutations.createClaimableEventFromFlyer);

  const creditStats = useQuery(api.admin.queries.getCreditStats);
  const flyerStats = useQuery(api.admin.queries.getFlyerUploadStats);

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
        const logResult = await logFlyer({
          filename: data.filename,
          fileHash: data.hash,
          filepath: data.path,
          originalSize: data.originalSize,
          optimizedSize: data.optimizedSize,
        });

        // Update status to success
        setFlyers((prev) =>
          prev.map((f) =>
            f.id === flyer.id
              ? {
                  ...f,
                  status: "success",
                  optimizedSize: data.optimizedSize,
                  flyerId: logResult.flyerId,
                  filepath: data.path,
                }
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

  const extractFlyerData = async (flyer: UploadedFlyer) => {
    if (!flyer.filepath) return;

    setFlyers((prev) =>
      prev.map((f) => (f.id === flyer.id ? { ...f, status: "extracting" } : f))
    );

    try {
      const response = await fetch("/api/ai/extract-flyer-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath: flyer.filepath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Extraction failed");
      }

      const data = await response.json();

      // Save to database
      if (flyer.flyerId) {
        await updateExtractedData({
          flyerId: flyer.flyerId,
          extractedData: data.extractedData,
        });
      }

      // Update local state
      setFlyers((prev) =>
        prev.map((f) =>
          f.id === flyer.id
            ? {
                ...f,
                status: "extracted",
                extractedData: data.extractedData,
              }
            : f
        )
      );
    } catch (error) {
      setFlyers((prev) =>
        prev.map((f) =>
          f.id === flyer.id
            ? {
                ...f,
                status: "error",
                errorMessage: error instanceof Error ? error.message : "Extraction failed",
              }
            : f
        )
      );
    }
  };

  const createEventFromFlyer = async (flyer: UploadedFlyer) => {
    if (!flyer.flyerId || !flyer.extractedData) return;

    try {
      const result = await createEvent({
        flyerId: flyer.flyerId,
        eventData: {
          name: flyer.extractedData.eventName || "Untitled Event",
          description: flyer.extractedData.description || "",
          eventType: "TICKETED_EVENT",
          location: flyer.extractedData.city && flyer.extractedData.state ? {
            venueName: flyer.extractedData.venueName,
            address: flyer.extractedData.address,
            city: flyer.extractedData.city,
            state: flyer.extractedData.state,
            zipCode: flyer.extractedData.zipCode,
            country: "USA",
          } : undefined,
          isClaimable: true,
          claimCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        },
      });

      if (result.success) {
        alert(`Event created successfully! Claim code: ${result.message}`);
        // Remove from local state
        setFlyers((prev) => prev.filter((f) => f.id !== flyer.id));
      }
    } catch (error) {
      alert("Failed to create event: " + (error instanceof Error ? error.message : "Unknown error"));
    }
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
            Bulk Flyer Upload & AI Extraction
          </h1>
          <p className="text-gray-600 mb-4">
            Upload event flyers, extract data with AI, and create claimable events.
          </p>
        </div>

        {/* Credit Stats Widget */}
        {creditStats && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Platform Credit Statistics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Total Credits Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {creditStats.overall.totalCreditsUsed.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {creditStats.overall.utilizationRate} utilized
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Credits Remaining</p>
                <p className="text-2xl font-bold text-green-600">
                  {creditStats.overall.totalCreditsRemaining.toLocaleString()}
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${creditStats.revenue.monthlyRevenue}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {creditStats.revenue.monthlyTickets} tickets sold
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Active Organizers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {creditStats.organizers.activeOrganizers}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg {creditStats.organizers.avgCreditsPerOrganizer} credits/organizer
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Flyer Stats Widget */}
        {flyerStats && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Flyers</p>
                <p className="text-xl font-bold text-gray-900">{flyerStats.flyers.totalUploaded}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">AI Processed</p>
                <p className="text-xl font-bold text-blue-600">{flyerStats.flyers.aiProcessed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Events Created</p>
                <p className="text-xl font-bold text-green-600">{flyerStats.flyers.eventsCreated}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold text-orange-600">{flyerStats.flyers.pendingExtraction}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Storage Saved</p>
                <p className="text-xl font-bold text-purple-600">{flyerStats.flyers.totalSizeSaved}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Stats */}
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
          <div className="mt-8 space-y-6">
            <AnimatePresence>
              {flyers.map((flyer) => (
                <motion.div
                  key={flyer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                >
                  <div className="p-6">
                    <div className="flex gap-6">
                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        <img
                          src={flyer.preview}
                          alt={flyer.file.name}
                          className="w-40 h-56 object-cover rounded-lg border border-gray-200"
                        />
                      </div>

                      {/* Flyer Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {flyer.file.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {(flyer.file.size / 1024 / 1024).toFixed(2)} MB
                              {flyer.optimizedSize && (
                                <> → {(flyer.optimizedSize / 1024 / 1024).toFixed(2)} MB</>
                              )}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            {flyer.status === "pending" && (
                              <button
                                onClick={() => removeFlyer(flyer.id)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                            {flyer.status === "uploading" && (
                              <div className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">Uploading...</span>
                              </div>
                            )}
                            {flyer.status === "success" && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Uploaded</span>
                              </div>
                            )}
                            {flyer.status === "extracting" && (
                              <div className="flex items-center gap-2 text-purple-600">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">Extracting...</span>
                              </div>
                            )}
                            {flyer.status === "extracted" && (
                              <div className="flex items-center gap-2 text-green-600">
                                <Sparkles className="w-5 h-5" />
                                <span className="text-sm font-medium">Extracted</span>
                              </div>
                            )}
                            {flyer.status === "error" && (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Error</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Error Message */}
                        {flyer.errorMessage && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{flyer.errorMessage}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                          {flyer.status === "success" && !flyer.extractedData && (
                            <button
                              onClick={() => extractFlyerData(flyer)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              Extract with AI
                            </button>
                          )}
                          {flyer.status === "extracted" && (
                            <>
                              <button
                                onClick={() => setExpandedFlyerId(expandedFlyerId === flyer.id ? null : flyer.id)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                              >
                                {expandedFlyerId === flyer.id ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Review Data
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => createEventFromFlyer(flyer)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                              >
                                Create Claimable Event
                              </button>
                            </>
                          )}
                        </div>

                        {/* Extracted Data Display */}
                        {expandedFlyerId === flyer.id && flyer.extractedData && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3">Extracted Event Data</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {Object.entries(flyer.extractedData)
                                .filter(([_, value]) => value)
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <span className="text-gray-600 font-medium">{key}:</span>
                                    <p className="text-gray-900">{String(value)}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
