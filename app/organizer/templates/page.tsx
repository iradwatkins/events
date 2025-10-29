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
type CategoryFilter = "all" | "theater" | "stadium" | "concert" | "conference" | "outdoor" | "wedding" | "gala" | "banquet" | "custom";

export default function TemplatesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Get user's custom templates from database
  const userTemplates = useQuery(api.templates.queries.getUserTemplates);
  const templateStats = useQuery(api.templates.queries.getTemplateStats);

  // Mutations
  const deleteTemplate = useMutation(api.templates.mutations.deleteRoomTemplate);

  // Handle delete template
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)) {
      try {
        await deleteTemplate({ templateId: templateId as any });
        setOpenDropdownId(null);
      } catch (error: any) {
        alert(error.message || "Failed to delete template");
      }
    }
  };

  // Combine pre-built templates with user templates
  const allTemplates = [
    ...seatingTemplates.map(t => ({ ...t, isCustom: false })),
    ...(userTemplates || []).map((t: any) => ({
      id: t._id,
      name: t.name,
      description: t.description,
      icon: <Sparkles className="w-8 h-8" />,
      category: t.category,
      sections: t.sections,
      estimatedCapacity: t.estimatedCapacity,
      isCustom: true,
    })),
  ];

  // Filter templates
  const filteredTemplates = allTemplates.filter(template => {
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: "all", name: "All Templates", color: "bg-gray-100 text-gray-700", icon: <GridIcon className="w-4 h-4" /> },
    { id: "theater", name: "Theater", color: "bg-blue-100 text-blue-700" },
    { id: "stadium", name: "Stadium", color: "bg-purple-100 text-purple-700" },
    { id: "concert", name: "Concert", color: "bg-pink-100 text-pink-700" },
    { id: "conference", name: "Conference", color: "bg-red-100 text-red-700" },
    { id: "outdoor", name: "Outdoor", color: "bg-green-100 text-green-700" },
    { id: "wedding", name: "Wedding", color: "bg-pink-100 text-pink-700" },
    { id: "gala", name: "Gala", color: "bg-purple-100 text-purple-700" },
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
              <h1 className="text-3xl font-bold text-gray-900">Room Templates</h1>
              <p className="text-gray-600 mt-2">
                Browse and create reusable room layouts for your events
              </p>
            </div>

            <Link
              href="/organizer/templates/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
                <GridIcon className="w-5 h-5 text-blue-600" />
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
                <Sparkles className="w-5 h-5 text-purple-600" />
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
              <p className="text-3xl font-bold text-gray-900">{Object.keys(templateStats.byCategory || {}).length}</p>
            </motion.div>
          </div>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <GridIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
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
                    ? "ring-2 ring-blue-500 " + category.color
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
                        sessionStorage.setItem('selectedTemplate', JSON.stringify(templateData));
                        router.push('/organizer/templates/create?autoSelect=true');
                      } catch (error) {
                        console.error('Failed to store template:', error);
                        alert('Failed to select template. Please try again.');
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-blue-600 group-hover:scale-110 transition-transform">
                        {template.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        {(template as any).isCustom && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Custom
                          </span>
                        )}
                        {/* Action menu for custom templates */}
                        {(template as any).isCustom && (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === template.id ? null : String(template.id))}
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
                                  onClick={() => handleDeleteTemplate(String(template.id), template.name)}
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h3>
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
                    <div className="text-blue-600">{template.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        {(template as any).isCustom && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Custom
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
      </div>
    </div>
  );
}
