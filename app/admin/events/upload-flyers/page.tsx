"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2,
  Zap,
  Package,
  Trash2,
  Send,
  Play,
  ToggleLeft,
  ToggleRight,
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
  const [duplicateHash, setDuplicateHash] = useState<string | null>(null);
  const [duplicateFile, setDuplicateFile] = useState<File | null>(null);
  const [autoProcess, setAutoProcess] = useState<boolean>(false); // Auto-process toggle - OFF by default

  const logFlyer = useMutation(api.flyers.mutations.logUploadedFlyer);
  const updateExtractedData = useMutation(api.flyers.mutations.updateFlyerWithExtractedData);
  const autoCreateEvent = useMutation(api.flyers.mutations.autoCreateEventFromExtractedData);
  const deleteFlyer = useAction(api.flyers.mutations.deleteFlyerWithCleanup);

  const creditStats = useQuery(api.admin.queries.getCreditStats);
  const flyerStats = useQuery(api.admin.queries.getFlyerUploadStats);
  const draftFlyers = useQuery(api.flyers.queries.getDraftFlyers);

  // Query for duplicate flyer when we detect one
  const duplicateFlyer = useQuery(
    api.flyers.queries.getFlyerByHash,
    duplicateHash ? { fileHash: duplicateHash } : "skip"
  );

  // Auto-dismiss duplicate alert after 5 seconds
  useEffect(() => {
    if (duplicateHash) {
      const timer = setTimeout(() => {
        setDuplicateHash(null);
        setDuplicateFile(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [duplicateHash]);

  const processFlyer = async (flyer: UploadedFlyer) => {
    setFlyers((prev) => prev.map((f) => (f.id === flyer.id ? { ...f, status: "uploading" } : f)));

    try {
      const formData = new FormData();
      formData.append("file", flyer.file);

      const response = await fetch("/api/admin/upload-flyer", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409 && errorData.isDuplicate) {
          // Store the duplicate hash so we can query for the existing flyer
          if (errorData.fileHash) {
            setDuplicateHash(errorData.fileHash);
            setDuplicateFile(flyer.file); // Store the file for potential re-upload
          }

          // Remove the failed upload from queue after showing error briefly
          setTimeout(() => {
            setFlyers((prev) => prev.filter((f) => f.id !== flyer.id));
          }, 2000);

          throw new Error(
            errorData.message || "Duplicate flyer - this file has already been uploaded"
          );
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

        // If auto-process is enabled, automatically publish the event
        if (autoProcess) {
          try {
            await autoCreateEvent({ flyerId: logResult.flyerId });
          } catch (publishError) {
            console.error("❌ Auto-publish failed:", publishError);
            // Keep the flyer in draft if auto-publish fails
          }
        }

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

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFlyers = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const,
      }));
      setFlyers((prev) => [...prev, ...newFlyers]);

      // Automatically start processing if auto-process is enabled
      if (autoProcess) {
        for (const flyer of newFlyers) {
          processFlyer(flyer);
        }
      }
    },
    [autoProcess, logFlyer, updateExtractedData]
  );

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

      // Give the backend a moment to complete file deletion
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear any cached duplicate hashes
      setDuplicateHash(null);
      setDuplicateFile(null);

      // Page will auto-refresh via Convex reactivity
    } catch (error) {
      console.error(`❌ Failed to delete flyer:`, error);
      alert(
        "Failed to delete flyer: " + (error instanceof Error ? error.message : "Unknown error")
      );
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
      alert(
        "Failed to save changes: " + (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const handleRetryExtraction = async (flyerId: Id<"uploadedFlyers">, filepath: string) => {
    try {
      // Find the draft flyer to update its status
      const draftFlyer = draftFlyers?.find((f) => f._id === flyerId);
      if (!draftFlyer) return;


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
      alert(
        "Failed to publish event: " + (error instanceof Error ? error.message : "Unknown error")
      );
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
    <div className="min-h-screen bg-primary p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                AI Flyer Manager
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                Upload flyers, review AI-extracted data, and publish events
              </p>
            </div>

            {/* Auto-Process Toggle */}
            <div className="flex items-center gap-3 bg-white rounded-xl shadow-md border-2 border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700">Auto-Process</p>
                <p className="text-xs text-gray-500">{autoProcess ? "ON" : "OFF"}</p>
              </div>
              <button
                onClick={() => setAutoProcess(!autoProcess)}
                className={`
                  relative w-14 h-8 sm:w-16 sm:h-9 rounded-full transition-all duration-300 flex items-center
                  ${autoProcess ? "bg-green-600" : "bg-gray-300"}
                `}
              >
                <div
                  className={`
                    absolute w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-full shadow-md transition-all duration-300
                    ${autoProcess ? "translate-x-7 sm:translate-x-8" : "translate-x-1"}
                  `}
                />
                {autoProcess ? (
                  <ToggleRight className="absolute right-1 w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <ToggleLeft className="absolute left-1 w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          {flyerStats && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <p className="text-xs sm:text-sm font-medium text-gray-600">AI Processed</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-primary">
                  {flyerStats.flyers.aiProcessed}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Events Created</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-orange-600">
                  {flyerStats.flyers.eventsCreated}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Upload Dropzone */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 sm:p-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            Upload New Flyers
          </h2>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all
              ${
                isDragActive
                  ? "border-primary bg-accent scale-[1.02]"
                  : "border-gray-300 hover:border-primary hover:bg-gray-50"
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload
              className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${isDragActive ? "text-primary" : "text-gray-400"}`}
            />
            {isDragActive ? (
              <p className="text-lg sm:text-xl text-primary font-semibold">
                Drop your flyers here!
              </p>
            ) : (
              <>
                <p className="text-lg sm:text-xl text-gray-700 font-semibold mb-2">
                  Drag & Drop Flyers
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mb-3">
                  or click to browse your computer
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP • Multiple files OK</p>
              </>
            )}
          </div>

          {/* Duplicate Flyer Alert - Auto-dismisses after 5 seconds */}
          {duplicateHash && duplicateFlyer && (
            <div className="mt-6 bg-amber-50 border-2 border-amber-400 rounded-xl p-4 shadow-lg animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-900 mb-1">
                    Duplicate Flyer Detected
                  </h3>
                  <p className="text-sm text-amber-800 mb-2">
                    This flyer has already been uploaded. The duplicate flyer can be found in the
                    draft section below.
                  </p>
                  <p className="text-xs text-amber-700 italic">
                    This message will automatically dismiss in 5 seconds...
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDuplicateHash(null);
                    setDuplicateFile(null);
                  }}
                  className="text-amber-600 hover:text-amber-800 transition-colors"
                  title="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

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
                    <p className="text-sm font-medium text-gray-900 truncate">{flyer.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(flyer.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {flyer.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{flyer.errorMessage}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {flyer.status === "pending" && (
                      <>
                        {!autoProcess && (
                          <button
                            onClick={() => processFlyer(flyer)}
                            className="px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1.5"
                          >
                            <Play className="w-4 h-4" />
                            Process
                          </button>
                        )}
                        <button
                          onClick={() => removeFlyer(flyer.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {flyer.status === "uploading" && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <span className="text-sm text-primary">Uploading...</span>
                      </div>
                    )}
                    {flyer.status === "extracting" && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <span className="text-sm text-primary">AI Processing...</span>
                      </div>
                    )}
                    {flyer.status === "success" && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-600">Ready for review!</span>
                      </div>
                    )}
                    {flyer.status === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Draft Flyers - Full Width Layout */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Draft Flyers Awaiting Review ({draftFlyers?.length || 0})
          </h2>

          {!draftFlyers || draftFlyers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-16 text-center">
              <Sparkles className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No draft flyers</p>
              <p className="text-sm text-gray-400">Upload flyers above to get started</p>
            </div>
          ) : (
            <div className="space-y-8">
              {draftFlyers.map((flyer) => {
                const isEditing = editingFlyerId === flyer._id;
                const data = isEditing ? editedData[flyer._id] : flyer.extractedData;

                return (
                  <motion.div
                    key={flyer._id}
                    id={`flyer-${flyer._id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all"
                  >
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-0">
                      {/* Flyer Image - Left Side */}
                      <div className="xl:col-span-4 bg-primary p-6 flex items-start justify-center">
                        <div className="sticky top-6 w-full">
                          <img
                            src={flyer.filepath}
                            alt={flyer.filename}
                            className="w-full h-auto rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
                            onClick={() => window.open(flyer.filepath, "_blank")}
                            title="Click to view full-size flyer"
                          />
                          <p className="text-xs text-gray-500 text-center mt-3">Click to enlarge</p>
                        </div>
                      </div>

                      {/* Editable Fields - Right Side (Wider) */}
                      <div className="xl:col-span-8 p-8">
                        <div className="space-y-6">
                          {/* Event Name */}
                          <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2">
                              Event Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={data?.eventName || ""}
                              onChange={(e) =>
                                isEditing && updateField(flyer._id, "eventName", e.target.value)
                              }
                              disabled={!isEditing}
                              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                            />
                          </div>

                          {/* Date & Time */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                Start Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={data?.eventDate || data?.date || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "eventDate", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                                placeholder="e.g. Saturday, December 27, 2025"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                Start Time <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={data?.eventTime || data?.time || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "eventTime", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                                placeholder="e.g. 7:00 PM"
                              />
                            </div>
                          </div>

                          {/* End Date & Time (for multi-day events) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                End Date{" "}
                                <span className="text-gray-500 font-normal text-xs">
                                  (if multi-day)
                                </span>
                              </label>
                              <input
                                type="text"
                                value={data?.eventEndDate || ""}
                                onChange={(e) =>
                                  isEditing &&
                                  updateField(flyer._id, "eventEndDate", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                                placeholder="e.g. Sunday, December 29, 2025"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                End Time{" "}
                                <span className="text-gray-500 font-normal text-xs">
                                  (optional)
                                </span>
                              </label>
                              <input
                                type="text"
                                value={data?.eventEndTime || ""}
                                onChange={(e) =>
                                  isEditing &&
                                  updateField(flyer._id, "eventEndTime", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                                placeholder="e.g. 2:00 AM"
                              />
                            </div>
                          </div>

                          {/* Location Section Header */}
                          <div className="pt-4 border-t-2 border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">
                              Location Details
                            </h3>
                          </div>

                          {/* Venue Name */}
                          <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2">
                              Venue Name
                            </label>
                            <input
                              type="text"
                              value={data?.venueName || ""}
                              onChange={(e) =>
                                isEditing && updateField(flyer._id, "venueName", e.target.value)
                              }
                              disabled={!isEditing}
                              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                            />
                          </div>

                          {/* Address */}
                          <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2">
                              Address
                            </label>
                            <input
                              type="text"
                              value={data?.address || ""}
                              onChange={(e) =>
                                isEditing && updateField(flyer._id, "address", e.target.value)
                              }
                              disabled={!isEditing}
                              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                            />
                          </div>

                          {/* City, State, Zip */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={data?.city || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "city", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                State
                              </label>
                              <input
                                type="text"
                                value={data?.state || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "state", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                              />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                Zip Code
                              </label>
                              <input
                                type="text"
                                value={data?.zipCode || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "zipCode", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2">
                              Description
                            </label>
                            <textarea
                              value={data?.description || ""}
                              onChange={(e) =>
                                isEditing && updateField(flyer._id, "description", e.target.value)
                              }
                              disabled={!isEditing}
                              rows={5}
                              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                            />
                          </div>

                          {/* Additional Info Section Header */}
                          <div className="pt-4 border-t-2 border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">
                              Additional Information
                            </h3>
                          </div>

                          {/* Organizer & Contact */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                Host/Organizer
                              </label>
                              <input
                                type="text"
                                value={data?.hostOrganizer || ""}
                                onChange={(e) =>
                                  isEditing &&
                                  updateField(flyer._id, "hostOrganizer", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                Contact Info
                              </label>
                              <input
                                type="text"
                                value={data?.contactInfo || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "contactInfo", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                              />
                            </div>
                          </div>

                          {/* Ticket Price & Age Restriction */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                Ticket Price
                              </label>
                              <input
                                type="text"
                                value={data?.ticketPrice || ""}
                                onChange={(e) =>
                                  isEditing && updateField(flyer._id, "ticketPrice", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                Age Restriction
                              </label>
                              <input
                                type="text"
                                value={data?.ageRestriction || ""}
                                onChange={(e) =>
                                  isEditing &&
                                  updateField(flyer._id, "ageRestriction", e.target.value)
                                }
                                disabled={!isEditing}
                                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-700 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all"
                              />
                            </div>
                          </div>

                          {/* Categories */}
                          {data?.categories && (
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                Categories
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {data.categories.map((cat: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-4 py-2 bg-accent text-primary text-sm font-semibold rounded-full"
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
                              <label className="text-sm font-semibold text-gray-700 block mb-2">
                                Event Type
                              </label>
                              <span className="inline-block px-4 py-2 bg-green-100 text-green-700 text-base font-semibold rounded-lg">
                                {data.eventType}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 space-y-2 sm:space-y-3">
                          {isEditing ? (
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                              <button
                                onClick={() => handleSaveEdit(flyer._id)}
                                className="flex-1 px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => setEditingFlyerId(null)}
                                className="px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm sm:text-base"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handlePublish(flyer._id)}
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base sm:text-lg"
                              >
                                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                Publish Event
                              </button>
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleRetryExtraction(flyer._id, flyer.filepath)}
                                  className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                  <Zap className="w-4 h-4" />
                                  Retry AI Extraction
                                </button>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                  <button
                                    onClick={() => startEditing(flyer._id, flyer.extractedData)}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFlyer(flyer._id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm sm:text-base"
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
