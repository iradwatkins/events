"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { seatingTemplates, type SeatingTemplate } from "@/components/seating/SeatingTemplates";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Grid as GridIcon,
  List,
  ArrowLeft,
  Users,
  Sparkles,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { useMutation } from "convex/react";

type ViewMode = "grid" | "list";
type CategoryFilter =
  | "all"
  | "theater"
  | "stadium"
  | "concert"
  | "conference"
  | "outdoor"
  | "wedding"
  | "gala"
  | "banquet"
  | "custom";

export default function TemplatesPage() {
  const router = useRouter();

  // Seating/Template feature is currently disabled
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Seating Templates Coming Soon</h1>
        <p className="text-gray-600 mb-6">
          The seating template feature is currently being enhanced and will be available soon.
        </p>
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>
    </div>
  );

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    deletedCount: number;
    failedCount: number;
    failedTemplates: Array<{ templateId: string; reason: string }>;
  } | null>(null);

  // Get user's custom templates from database
  const userTemplates = useQuery(api.templates.queries.getUserTemplates);
  const templateStats = useQuery(api.templates.queries.getTemplateStats);

  // Get seating/floor plan templates
  const floorPlanTemplates = useQuery(api.seating.templates.getMyTemplates);

  // Mutations
  const deleteTemplate = useMutation(api.templates.mutations.deleteRoomTemplate);
  const deleteFloorPlanTemplate = useMutation(api.seating.templates.deleteTemplate);
  const bulkDeleteFloorPlanTemplates = useMutation(api.seating.templates.bulkDeleteTemplates);

  // Helper functions for selection
  const toggleTemplateSelection = (templateId: string) => {
    const newSelection = new Set(selectedTemplates);
    if (newSelection.has(templateId)) {
      newSelection.delete(templateId);
    } else {
      newSelection.add(templateId);
    }
    setSelectedTemplates(newSelection);
  };

  const selectAllTemplates = () => {
    const customTemplates = allTemplates.filter((t: any) => t.isCustom);
    setSelectedTemplates(new Set(customTemplates.map((t: any) => t.id)));
  };

  const selectFloorPlanTemplates = () => {
    const floorPlans = allTemplates.filter((t: any) => t.isFloorPlan && t.isCustom);
    setSelectedTemplates(new Set(floorPlans.map((t: any) => t.id)));
  };

  const selectRoomTemplates = () => {
    const roomTemplates = allTemplates.filter((t: any) => !t.isFloorPlan && t.isCustom);
    setSelectedTemplates(new Set(roomTemplates.map((t: any) => t.id)));
  };

  // Handle delete template
  const handleDeleteTemplate = async (
    templateId: string,
    templateName: string,
    isFloorPlan: boolean = false
  ) => {
    try {
      if (isFloorPlan) {
        await deleteFloorPlanTemplate({ templateId: templateId as any });
      } else {
        await deleteTemplate({ templateId: templateId as any });
      }
      setOpenDropdownId(null);
    } catch (error: any) {
      alert(error.message || "Failed to delete template");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTemplates.size === 0) return;

    setIsDeleting(true);
    try {
      // Separate floor plan templates from room templates
      const selectedFloorPlans: string[] = [];
      const selectedRoomTemplates: string[] = [];

      selectedTemplates.forEach((templateId) => {
        const template = allTemplates.find((t: any) => t.id === templateId);
        if (template && (template as any).isFloorPlan) {
          selectedFloorPlans.push(templateId);
        } else if (template && (template as any).isCustom) {
          selectedRoomTemplates.push(templateId);
        }
      });

      let totalDeleted = 0;
      let totalFailed = 0;
      const allFailedTemplates: Array<{ templateId: string; reason: string }> = [];

      // Delete floor plan templates
      if (selectedFloorPlans.length > 0) {
        const result = await bulkDeleteFloorPlanTemplates({
          templateIds: selectedFloorPlans as any,
        });
        totalDeleted += result.deletedCount;
        totalFailed += result.failedCount;
        allFailedTemplates.push(...result.failedTemplates);
      }

      // Delete room templates one by one (no bulk endpoint)
      for (const templateId of selectedRoomTemplates) {
        try {
          await deleteTemplate({ templateId: templateId as any });
          totalDeleted++;
        } catch (error: any) {
          totalFailed++;
          allFailedTemplates.push({
            templateId,
            reason: error.message || "Failed to delete",
          });
        }
      }

      setDeleteResult({
        deletedCount: totalDeleted,
        failedCount: totalFailed,
        failedTemplates: allFailedTemplates,
      });
      setSelectedTemplates(new Set());
      setShowDeleteConfirm(false);

      // Show result message for a few seconds
      setTimeout(() => {
        setDeleteResult(null);
      }, 5000);
    } catch (error) {
      console.error("Error deleting templates:", error);
      alert(
        `Error deleting templates: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Combine pre-built templates with user templates and floor plan templates
  const allTemplates = [
    ...seatingTemplates.map((t) => ({ ...t, isCustom: false, isFloorPlan: false })),
    ...(userTemplates || []).map((t: any) => ({
      id: t._id,
      name: t.name,
      description: t.description,
      icon: <Sparkles className="w-8 h-8" />,
      category: t.category,
      sections: t.sections,
      estimatedCapacity: t.estimatedCapacity,
      isCustom: true,
      isFloorPlan: false,
    })),
    ...(floorPlanTemplates || []).map((t: any) => ({
      id: t._id,
      name: t.name,
      description: t.description,
      icon: <GridIcon className="w-8 h-8" />,
      category: t.category?.toLowerCase() || "custom",
      sections: t.sections,
      estimatedCapacity: t.totalCapacity || 0,
      isCustom: true,
      isFloorPlan: true,
    })),
  ];

  // Filter templates
  const filteredTemplates = allTemplates.filter((template) => {
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    {
      id: "all",
      name: "All Templates",
      color: "bg-gray-100 text-gray-700",
      icon: <GridIcon className="w-4 h-4" />,
    },
    { id: "theater", name: "Theater", color: "bg-accent text-primary" },
    { id: "stadium", name: "Stadium", color: "bg-accent text-primary" },
    { id: "concert", name: "Concert", color: "bg-pink-100 text-pink-700" },
    { id: "conference", name: "Conference", color: "bg-red-100 text-red-700" },
    { id: "outdoor", name: "Outdoor", color: "bg-green-100 text-green-700" },
    { id: "wedding", name: "Wedding", color: "bg-pink-100 text-pink-700" },
    { id: "gala", name: "Gala", color: "bg-accent text-primary" },
    { id: "banquet", name: "Banquet", color: "bg-orange-100 text-orange-700" },
    { id: "custom", name: "Custom", color: "bg-gray-100 text-gray-700" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/organizer/events"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seating & Floor Plan Templates</h1>
              <p className="text-gray-600 mt-2">
                Browse and create reusable seating layouts and floor plans for your events
              </p>
            </div>

            <Link
              href="/organizer/templates/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Template
            </Link>
          </div>
        </div>

        {/* Stats */}
        {templateStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Templates</span>
                <GridIcon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{allTemplates.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Pre-built</span>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{seatingTemplates.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Custom</span>
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{userTemplates?.length || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Categories</span>
                <Filter className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {Object.keys(templateStats.byCategory || {}).length}
              </p>
            </motion.div>
          </div>
        )}

        {/* Bulk Delete Controls */}
        {allTemplates.some((t: any) => t.isCustom) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Manage Templates</h2>
              {selectedTemplates.size > 0 && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedTemplates.size})
                </motion.button>
              )}
            </div>

            {/* Quick Select Buttons */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Quick Select:</span>
              <button
                onClick={selectAllTemplates}
                className="px-3 py-1.5 text-sm bg-accent text-primary rounded-md hover:bg-primary/20 transition-colors"
              >
                All Custom ({allTemplates.filter((t: any) => t.isCustom).length})
              </button>
              <button
                onClick={selectFloorPlanTemplates}
                className="px-3 py-1.5 text-sm bg-accent text-primary rounded-md hover:bg-primary/20 transition-colors"
              >
                Floor Plans ({allTemplates.filter((t: any) => t.isFloorPlan && t.isCustom).length})
              </button>
              <button
                onClick={selectRoomTemplates}
                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                Room Templates (
                {allTemplates.filter((t: any) => !t.isFloorPlan && t.isCustom).length})
              </button>
              <button
                onClick={() => setSelectedTemplates(new Set())}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Clear Selection
              </button>
              {selectedTemplates.size > 0 && (
                <span className="ml-auto text-sm font-medium text-gray-900">
                  {selectedTemplates.size} selected
                </span>
              )}
            </div>
          </div>
        )}

        {/* Delete Result Notification */}
        {deleteResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-4 p-4 rounded-lg ${
              deleteResult.failedCount > 0
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {deleteResult.deletedCount > 0 && (
                    <span className="text-green-700">
                      Successfully deleted {deleteResult.deletedCount} template
                      {deleteResult.deletedCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                {deleteResult.failedCount > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-yellow-700 mb-1">
                      Failed to delete {deleteResult.failedCount} template
                      {deleteResult.failedCount !== 1 ? "s" : ""}:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {deleteResult.failedTemplates.map((failed, i) => (
                        <li key={i}>• {failed.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => setDeleteResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            {/* Search */}
            <div className="flex-1 relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <GridIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setCategoryFilter(category.id as CategoryFilter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  categoryFilter === category.id
                    ? "ring-2 ring-primary " + category.color
                    : category.color + " hover:opacity-80"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4">
              <GridIcon className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Get started by creating your first template"}
            </p>
            <Link
              href="/organizer/templates/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Template
            </Link>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden group relative"
              >
                {viewMode === "grid" ? (
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => {
                      // Store selected template data (without icon) in sessionStorage
                      const templateData = {
                        id: template.id,
                        name: template.name,
                        description: template.description,
                        category: template.category,
                        sections: template.sections,
                        estimatedCapacity: template.estimatedCapacity,
                        isCustom: (template as any).isCustom,
                      };
                      try {
                        sessionStorage.setItem("selectedTemplate", JSON.stringify(templateData));
                        router.push("/organizer/templates/create?autoSelect=true");
                      } catch (error) {
                        console.error("Failed to store template:", error);
                        alert("Failed to select template. Please try again.");
                      }
                    }}
                  >
                    {/* Selection Checkbox for custom templates */}
                    {(template as any).isCustom && (
                      <div className="absolute top-4 left-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedTemplates.has(String(template.id))}
                          onChange={() => toggleTemplateSelection(String(template.id))}
                          className="w-5 h-5 text-primary bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-ring cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-primary group-hover:scale-110 transition-transform">
                        {template.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        {(template as any).isCustom && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Custom
                          </span>
                        )}
                        {(template as any).isFloorPlan && (
                          <span className="px-3 py-1 bg-accent text-primary text-xs font-medium rounded-full">
                            Floor Plan
                          </span>
                        )}
                        {/* Action menu for custom templates */}
                        {(template as any).isCustom && (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() =>
                                setOpenDropdownId(
                                  openDropdownId === template.id ? null : String(template.id)
                                )
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                            {openDropdownId === String(template.id) && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                <button
                                  onClick={() => {
                                    router.push(`/organizer/templates/${template.id}/edit`);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit Template
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteTemplate(
                                      String(template.id),
                                      template.name,
                                      (template as any).isFloorPlan
                                    )
                                  }
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Template
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        <Users className="w-4 h-4 inline mr-1" />
                        {template.estimatedCapacity} seats
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                        {template.category}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex items-center gap-6">
                    <div className="text-primary">{template.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                        {(template as any).isCustom && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Custom
                          </span>
                        )}
                        {(template as any).isFloorPlan && (
                          <span className="px-3 py-1 bg-accent text-primary text-xs font-medium rounded-full">
                            Floor Plan
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          <Users className="w-4 h-4 inline mr-1" />
                          {template.estimatedCapacity} seats
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Delete {selectedTemplates.size} Template
                    {selectedTemplates.size !== 1 ? "s" : ""}?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    This will permanently delete the selected template
                    {selectedTemplates.size !== 1 ? "s" : ""}.
                  </p>
                  <p className="text-red-600 text-sm font-semibold mt-2">
                    This action cannot be undone!
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete {selectedTemplates.size} Template
                      {selectedTemplates.size !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
