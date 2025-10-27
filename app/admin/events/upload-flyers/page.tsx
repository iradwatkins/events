"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Upload, X, CheckCircle, AlertCircle, Sparkles, DollarSign,
  Loader2, Zap, TrendingUp, Package, Trash2, Send
} from "lucide-react";
import { motion } from "framer-motion";
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
  extractionProgress?: string;
}

export default function BulkFlyerUploadPage() {
  const [flyers, setFlyers] = useState<UploadedFlyer[]>([]);
  const [editingFlyerId, setEditingFlyerId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any>>({});

  const logFlyer = useMutation(api.flyers.mutations.logUploadedFlyer);
  const updateExtractedData = useMutation(api.flyers.mutations.updateFlyerWithExtractedData);
  const autoCreateEvent = useMutation(api.flyers.mutations.autoCreateEventFromExtractedData);
  const deleteFlyer = useAction(api.flyers.mutations.deleteFlyerWithCleanup);

  const creditStats = useQuery(api.admin.queries.getCreditStats);
  const flyerStats = useQuery(api.admin.queries.getFlyerUploadStats);
  const draftFlyers = useQuery(api.flyers.queries.getDraftFlyers);

  const processFlyer = async (flyer: UploadedFlyer) => {
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
                status: "extracting",
                optimizedSize: data.optimizedSize,
                flyerId: logResult.flyerId,
                filepath: data.path,
              }
            : f
        )
      );

      // Automatically extract AI data with single-read extraction
      try {
        setFlyers((prev) =>
          prev.map((f) =>
            f.id === flyer.id
              ? { ...f, status: "extracting", extractionProgress: "Reading flyer with AI..." }
              : f
          )
        );

        const extractResponse = await fetch("/api/ai/extract-flyer-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filepath: data.path }),
        });

        const extractData = await extractResponse.json();

        let extractedData: any;

        // Handle incomplete flyer data (Save the Date flyers, etc.)
        if (!extractResponse.ok && extractData.error === "INCOMPLETE_FLYER_DATA") {
          console.warn("⚠️ Incomplete flyer data:", extractData.message);
          console.warn("Partial data:", extractData.partialData);
          // Use partial data if available, otherwise throw
          if (extractData.partialData && Object.keys(extractData.partialData).length > 0) {
            extractedData = extractData.partialData;
          } else {
            throw new Error(extractData.message || "AI extraction failed: Missing required fields");
          }
        } else if (!extractResponse.ok) {
          throw new Error(extractData.details || extractData.error || "AI extraction failed");
        } else {
          extractedData = extractData.extractedData;
        }

        console.log("✅ AI Extraction Complete:", extractedData);

        // Save extracted data to database
        await updateExtractedData({
          flyerId: logResult.flyerId,
          extractedData: extractedData,
        });

        setFlyers((prev) =>
          prev.map((f) =>
            f.id === flyer.id
              ? {
                  ...f,
                  status: "success",
                  extractedData: extractedData,
                  extractionProgress: undefined,
                }
              : f
          )
        );

        // Remove from upload queue after 2 seconds
        setTimeout(() => {
          setFlyers((prev) => prev.filter((f) => f.id !== flyer.id));
        }, 2000);
      } catch (aiError) {
        console.error("AI processing error:", aiError);
        setFlyers((prev) =>
          prev.map((f) =>
            f.id === flyer.id
              ? {
                  ...f,
                  status: "error",
                  errorMessage: aiError instanceof Error ? aiError.message : "AI processing failed",
                  extractionProgress: undefined,
                }
              : f
          )
        );
      }
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
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFlyers = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
    }));
    setFlyers((prev) => [...prev, ...newFlyers]);

    // Automatically start processing immediately
    for (const flyer of newFlyers) {
      processFlyer(flyer);
    }
  }, [logFlyer, updateExtractedData]);

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

  const handleDeleteFlyer = async (flyerId: Id<"uploadedFlyers">) => {
    try {
      await deleteFlyer({ flyerId });
      // Page will auto-refresh via Convex reactivity
    } catch (error) {
      alert("Failed to delete flyer: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleSaveEdit = async (flyerId: Id<"uploadedFlyers">) => {
    const dataToSave = editedData[flyerId];
    if (!dataToSave) return;

    try {
      await updateExtractedData({
        flyerId,
        extractedData: dataToSave,
      });
      setEditingFlyerId(null);
      // Page will auto-refresh via Convex reactivity
    } catch (error) {
      alert("Failed to save changes: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleRetryExtraction = async (flyerId: Id<"uploadedFlyers">, filepath: string) => {
    try {
      // Find the draft flyer to update its status
      const draftFlyer = draftFlyers?.find(f => f._id === flyerId);
      if (!draftFlyer) return;

      console.log(`🔄 Retrying AI extraction for: ${filepath}`);

      const extractResponse = await fetch("/api/ai/extract-flyer-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath }),
      });

      const extractData = await extractResponse.json();

      let extractedData: any;

      // Handle incomplete flyer data (Save the Date flyers, etc.)
      if (!extractResponse.ok && extractData.error === "INCOMPLETE_FLYER_DATA") {
        console.warn("⚠️ Incomplete flyer data:", extractData.message);
        console.warn("Partial data:", extractData.partialData);
        // Use partial data if available, otherwise throw
        if (extractData.partialData && Object.keys(extractData.partialData).length > 0) {
          extractedData = extractData.partialData;
        } else {
          throw new Error(extractData.message || "AI extraction failed: Missing required fields");
        }
      } else if (!extractResponse.ok) {
        throw new Error(extractData.details || extractData.error || "AI extraction failed");
      } else {
        extractedData = extractData.extractedData;
      }

      console.log("✅ AI Retry Extraction Complete:", extractedData);

      // Save extracted data to database
      await updateExtractedData({
        flyerId: flyerId,
        extractedData: extractedData,
      });

      // Success - page will auto-refresh via Convex reactivity
    } catch (error) {
      console.error("Retry extraction error:", error);
      alert("Retry failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handlePublish = async (flyerId: Id<"uploadedFlyers">) => {
    try {
      const result = await autoCreateEvent({ flyerId });
      // Success - page will auto-refresh via Convex reactivity
    } catch (error) {
      alert("Failed to publish event: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const startEditing = (flyerId: string, data: any) => {
    setEditingFlyerId(flyerId);
    setEditedData({ ...editedData, [flyerId]: data });
  };

  const updateField = (flyerId: string, field: string, value: string) => {
    setEditedData({
      ...editedData,
      [flyerId]: {
        ...editedData[flyerId],
        [field]: value,
      },
    });
  };

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
            Upload flyers, review AI-extracted data, and publish events
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

        {/* Upload Dropzone */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-7 h-7 text-blue-600" />
            Upload New Flyers
          </h2>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
              ${
                isDragActive
                  ? "border-blue-600 bg-blue-50 scale-[1.02]"
                  : "border-gray-300 hover:border-blue-500 hover:bg-gray-50"
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? "text-blue-600" : "text-gray-400"}`} />
            {isDragActive ? (
              <p className="text-xl text-blue-600 font-semibold">Drop your flyers here!</p>
            ) : (
              <>
                <p className="text-xl text-gray-700 font-semibold mb-2">
                  Drag & Drop Flyers
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  or click to browse your computer
                </p>
                <p className="text-xs text-gray-400">
                  Supports: JPG, PNG, WEBP • Multiple files OK
                </p>
              </>
            )}
          </div>

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
                    {flyer.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{flyer.errorMessage}</p>
                    )}
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
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-600">Uploading...</span>
                      </div>
                    )}
                    {flyer.status === "extracting" && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                        <span className="text-sm text-purple-600">AI Processing...</span>
                      </div>
                    )}
                    {flyer.status === "success" && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-600">Ready for review!</span>
                      </div>
                    )}
                    {flyer.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Draft Flyers Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Draft Flyers Awaiting Review ({draftFlyers?.length || 0})
          </h2>

          {!draftFlyers || draftFlyers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-16 text-center">
              <Sparkles className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No draft flyers</p>
              <p className="text-sm text-gray-400">Upload flyers above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {draftFlyers.map((flyer) => {
                const isEditing = editingFlyerId === flyer._id;
                const data = isEditing ? editedData[flyer._id] : flyer.extractedData;

                return (
                  <motion.div
                    key={flyer._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Flyer Image - Left */}
                      <div className="w-full md:w-2/5 lg:w-2/5 bg-gray-100 p-4 flex items-center justify-center flex-shrink-0">
                        <img
                          src={flyer.filepath}
                          alt={flyer.filename}
                          className="max-w-full h-auto rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(flyer.filepath, '_blank')}
                          title="Click to view full-size flyer"
                        />
                      </div>

                      {/* Editable Fields - Right */}
                      <div className="w-full md:w-3/5 lg:w-3/5 p-6 flex flex-col">
                        <div className="flex-1 space-y-3 max-h-[500px] overflow-y-auto">
                          {/* Event Name */}
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                              Event Name *
                            </label>
                            <input
                              type="text"
                              value={data?.eventName || ""}
                              onChange={(e) =>
                                isEditing && updateField(flyer._id, "eventName", e.target.value)
                              }
                              disabled={!isEditing}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                            />
                          </div>

                          {/* Date & Time */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                Start Date *
                              </label>
                              <input
                                type="text"
                                value={data?.eventDate || data?.date || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "eventDate", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                                placeholder="e.g. Saturday, December 27, 2025"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                Start Time *
                              </label>
                              <input
                                type="text"
                                value={data?.eventTime || data?.time || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "eventTime", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                                placeholder="e.g. 7:00 PM"
                              />
                            </div>
                          </div>

                          {/* End Date & Time (for multi-day events) */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                End Date <span className="text-gray-400 font-normal">(if multi-day)</span>
                              </label>
                              <input
                                type="text"
                                value={data?.eventEndDate || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "eventEndDate", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                                placeholder="e.g. Sunday, December 29, 2025"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                End Time <span className="text-gray-400 font-normal">(optional)</span>
                              </label>
                              <input
                                type="text"
                                value={data?.eventEndTime || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "eventEndTime", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                                placeholder="e.g. 2:00 AM"
                              />
                            </div>
                          </div>

                          {/* Venue Name */}
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                              Venue Name
                            </label>
                            <input
                              type="text"
                              value={data?.venueName || ""}
                              onChange={(e) =>
                                isEditing && updateField(flyer._id, "venueName", e.target.value)
                              }
                              disabled={!isEditing}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                            />
                          </div>

                          {/* Address */}
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                              Address
                            </label>
                            <input
                              type="text"
                              value={data?.address || ""}
                              onChange={(e) =>
                                isEditing && updateField(flyer._id, "address", e.target.value)
                              }
                              disabled={!isEditing}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                            />
                          </div>

                          {/* City, State, Zip */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                City
                              </label>
                              <input
                                type="text"
                                value={data?.city || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "city", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                State
                              </label>
                              <input
                                type="text"
                                value={data?.state || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "state", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                Zip Code
                              </label>
                              <input
                                type="text"
                                value={data?.zipCode || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "zipCode", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                              Description
                            </label>
                            <textarea
                              value={data?.description || ""}
                              onChange={(e) =>
                                isEditing && updateField(flyer._id, "description", e.target.value)
                              }
                              disabled={!isEditing}
                              rows={4}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                            />
                          </div>

                          {/* Organizer & Contact */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                Host/Organizer
                              </label>
                              <input
                                type="text"
                                value={data?.hostOrganizer || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "hostOrganizer", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                Contact Info
                              </label>
                              <input
                                type="text"
                                value={data?.contactInfo || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "contactInfo", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                              />
                            </div>
                          </div>

                          {/* Ticket Price & Age Restriction */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                Ticket Price
                              </label>
                              <input
                                type="text"
                                value={data?.ticketPrice || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "ticketPrice", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                Age Restriction
                              </label>
                              <input
                                type="text"
                                value={data?.ageRestriction || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "ageRestriction", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700"
                              />
                            </div>
                          </div>

                          {/* Categories */}
                          {data?.categories && (
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                Categories
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {data.categories.map((cat: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Event Type */}
                          {data?.eventType && (
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                Event Type
                              </label>
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-lg">
                                {data.eventType}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 space-y-3">
                          {isEditing ? (
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleSaveEdit(flyer._id)}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => setEditingFlyerId(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handlePublish(flyer._id)}
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg"
                              >
                                <Send className="w-5 h-5" />
                                Publish Event
                              </button>
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleRetryExtraction(flyer._id, flyer.filepath)}
                                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                >
                                  <Zap className="w-4 h-4" />
                                  Retry AI Extraction
                                </button>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => startEditing(flyer._id, flyer.extractedData)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFlyer(flyer._id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
