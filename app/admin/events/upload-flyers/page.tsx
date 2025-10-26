"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Upload, X, CheckCircle, AlertCircle, Sparkles, DollarSign,
  Loader2, Eye, ImageIcon, Zap, TrendingUp, Package
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
  const [selectedFlyerId, setSelectedFlyerId] = useState<string | null>(null);

  const logFlyer = useMutation(api.flyers.mutations.logUploadedFlyer);
  const updateExtractedData = useMutation(api.flyers.mutations.updateFlyerWithExtractedData);
  const createEvent = useMutation(api.flyers.mutations.createClaimableEventFromFlyer);

  const creditStats = useQuery(api.admin.queries.getCreditStats);
  const flyerStats = useQuery(api.admin.queries.getFlyerUploadStats);
  const recentFlyers = useQuery(api.flyers.queries.getRecentFlyers, { limit: 8 });

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
          const errorData = await response.json();
          if (response.status === 409) {
            throw new Error("Duplicate flyer - this file has already been uploaded");
          }
          throw new Error(errorData.error || "Upload failed");
        }

        const data = await response.json();

        const logResult = await logFlyer({
          filename: data.filename,
          fileHash: data.hash,
          filepath: data.path,
          originalSize: data.originalSize,
          optimizedSize: data.optimizedSize,
        });

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

  const extractFlyerData = async (flyer: UploadedFlyer | any, isFromDatabase = false) => {
    const filepath = isFromDatabase ? flyer.filepath : flyer.filepath;
    const flyerId = isFromDatabase ? flyer._id : flyer.flyerId;

    if (!filepath) return;

    if (!isFromDatabase) {
      setFlyers((prev) =>
        prev.map((f) => (f.id === flyer.id ? { ...f, status: "extracting" } : f))
      );
    }

    try {
      const response = await fetch("/api/ai/extract-flyer-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Extraction failed");
      }

      const data = await response.json();

      if (flyerId) {
        await updateExtractedData({
          flyerId: flyerId,
          extractedData: data.extractedData,
        });
      }

      if (!isFromDatabase) {
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
      }
    } catch (error) {
      if (!isFromDatabase) {
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
      alert("Extraction failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const createEventFromFlyer = async (flyer: UploadedFlyer | any, isFromDatabase = false) => {
    const flyerId = isFromDatabase ? flyer._id : flyer.flyerId;
    const extractedData = flyer.extractedData;

    if (!flyerId || !extractedData) return;

    try {
      const result = await createEvent({
        flyerId: flyerId,
        eventData: {
          name: extractedData.eventName || "Untitled Event",
          description: extractedData.description || "",
          eventType: "TICKETED_EVENT",
          location: extractedData.city && extractedData.state ? {
            venueName: extractedData.venueName,
            address: extractedData.address,
            city: extractedData.city,
            state: extractedData.state,
            zipCode: extractedData.zipCode,
            country: "USA",
          } : undefined,
          isClaimable: true,
          claimCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        },
      });

      if (result.success) {
        alert("Event created successfully! Organizers can now claim this event.");
        if (!isFromDatabase) {
          setFlyers((prev) => prev.filter((f) => f.id !== flyer.id));
        }
      }
    } catch (error) {
      alert("Failed to create event: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const pendingCount = flyers.filter((f) => f.status === "pending").length;
  const selectedFlyer = selectedFlyerId ? recentFlyers?.find(f => f._id === selectedFlyerId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Zap className="w-10 h-10 text-blue-600" />
            AI Flyer Manager
          </h1>
          <p className="text-lg text-gray-600">
            Upload event flyers and let AI extract all the details automatically
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {creditStats && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-gray-600">Credits Remaining</p>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {creditStats.overall.totalCreditsRemaining.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  ${creditStats.revenue.monthlyRevenue}
                </p>
              </div>
            </>
          )}

          {flyerStats && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-medium text-gray-600">AI Processed</p>
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {flyerStats.flyers.aiProcessed}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  <p className="text-sm font-medium text-gray-600">Events Created</p>
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  {flyerStats.flyers.eventsCreated}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload Area */}
          <div className="space-y-6">
            {/* Upload Dropzone */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload New Flyers</h2>

              <div
                {...getRootProps()}
                className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50 scale-105"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? "text-blue-500" : "text-gray-400"}`} />
                {isDragActive ? (
                  <p className="text-xl text-blue-600 font-semibold">Drop your flyers here!</p>
                ) : (
                  <>
                    <p className="text-xl text-gray-700 font-semibold mb-2">
                      Drag & Drop Flyers
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      or click to browse your computer
                    </p>
                    <p className="text-xs text-gray-400">
                      Supports: JPG, PNG, WEBP • Multiple files OK
                    </p>
                  </>
                )}
              </div>

              {/* Pending Flyers */}
              {flyers.length > 0 && (
                <div className="mt-6 space-y-3">
                  {flyers.map((flyer) => (
                    <div
                      key={flyer.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <img
                        src={flyer.preview}
                        alt={flyer.file.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {flyer.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(flyer.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {flyer.status === "pending" && (
                          <button
                            onClick={() => removeFlyer(flyer.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                        {flyer.status === "uploading" && (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        )}
                        {flyer.status === "success" && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {flyer.status === "error" && (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={uploadAllFlyers}
                      disabled={uploading || pendingCount === 0}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                    >
                      {uploading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        `Upload ${pendingCount} Flyer${pendingCount !== 1 ? "s" : ""}`
                      )}
                    </button>
                    <button
                      onClick={() => setFlyers([])}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                How It Works
              </h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Upload flyers - system optimizes and checks for duplicates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Click "Extract with AI" - Gemini reads the flyer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Review extracted data - verify accuracy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Create event - organizers can claim it</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Right Column - Recent Flyers */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-gray-600" />
                Recently Uploaded Flyers
              </h2>

              {!recentFlyers || recentFlyers.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No flyers uploaded yet</p>
                  <p className="text-sm text-gray-400 mt-2">Upload your first flyer to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {recentFlyers.map((flyer) => (
                    <motion.div
                      key={flyer._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative cursor-pointer"
                      onClick={() => setSelectedFlyerId(flyer._id)}
                    >
                      <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all shadow-sm hover:shadow-md">
                        <img
                          src={flyer.filepath}
                          alt={flyer.filename}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-xs font-medium truncate">
                              {flyer.filename}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          {flyer.eventCreated && (
                            <div className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                              Event Created
                            </div>
                          )}
                          {!flyer.eventCreated && flyer.aiProcessed && (
                            <div className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                              AI Extracted
                            </div>
                          )}
                          {!flyer.eventCreated && !flyer.aiProcessed && (
                            <div className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                              New
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Flyer Detail Modal */}
        <AnimatePresence>
          {selectedFlyer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedFlyerId(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col md:flex-row max-h-[90vh]">
                  {/* Left - Image */}
                  <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-6">
                    <img
                      src={selectedFlyer.filepath}
                      alt={selectedFlyer.filename}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    />
                  </div>

                  {/* Right - Details */}
                  <div className="md:w-1/2 flex flex-col">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {selectedFlyer.extractedData?.eventName || selectedFlyer.filename}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(selectedFlyer.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedFlyerId(null)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-6 h-6 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                      {selectedFlyer.extractedData ? (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            AI Extracted Data
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {Object.entries(selectedFlyer.extractedData)
                              .filter(([_, value]) => value)
                              .map(([key, value]) => (
                                <div key={key} className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </p>
                                  <p className="text-sm text-gray-900">{String(value)}</p>
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 mb-4">No AI data extracted yet</p>
                        </div>
                      )}
                    </div>

                    <div className="p-6 border-t border-gray-200 space-y-3">
                      {!selectedFlyer.aiProcessed && (
                        <button
                          onClick={() => extractFlyerData(selectedFlyer, true)}
                          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          Extract with AI
                        </button>
                      )}
                      {selectedFlyer.aiProcessed && !selectedFlyer.eventCreated && (
                        <button
                          onClick={() => createEventFromFlyer(selectedFlyer, true)}
                          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                        >
                          Create Claimable Event
                        </button>
                      )}
                      {selectedFlyer.eventCreated && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-green-800 font-semibold">Event Created!</p>
                          <p className="text-sm text-green-600 mt-1">
                            Organizers can now claim this event
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
