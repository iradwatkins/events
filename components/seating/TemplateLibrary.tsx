"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Save,
  Download,
  Trash2,
  Globe,
  Lock,
  Users,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface TemplateLibraryProps {
  eventId: Id<"events">;
  onTemplateApplied?: () => void;
}

export default function TemplateLibrary({
  eventId,
  onTemplateApplied,
}: TemplateLibraryProps) {
  const templates = useQuery(api.seating.templates.getAvailableTemplates);
  const myTemplates = useQuery(api.seating.templates.getMyTemplates);

  const saveTemplate = useMutation(api.seating.templates.saveSeatingChartAsTemplate);
  const applyTemplate = useMutation(api.seating.templates.applyTemplateToEvent);
  const deleteTemplate = useMutation(api.seating.templates.deleteTemplate);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "OTHER" as const,
    isPublic: false,
    tags: "",
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSaveAsTemplate = async () => {
    if (!templateForm.name.trim()) {
      alert("Please enter a template name");
      return;
    }

    setSavingTemplate(true);
    try {
      await saveTemplate({
        eventId,
        templateName: templateForm.name,
        description: templateForm.description,
        category: templateForm.category,
        isPublic: templateForm.isPublic,
        tags: templateForm.tags ? templateForm.tags.split(",").map(t => t.trim()) : [],
      });

      alert("Template saved successfully!");
      setShowSaveDialog(false);
      setTemplateForm({
        name: "",
        description: "",
        category: "OTHER",
        isPublic: false,
        tags: "",
      });
    } catch (error: any) {
      alert(error.message || "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleApplyTemplate = async (templateId: Id<"seatingTemplates">) => {
    if (!confirm("This will replace your current seating chart. Continue?")) {
      return;
    }

    try {
      await applyTemplate({ eventId, templateId });
      alert("Template applied successfully!");
      onTemplateApplied?.();
    } catch (error: any) {
      alert(error.message || "Failed to apply template");
    }
  };

  const handleDeleteTemplate = async (templateId: Id<"seatingTemplates">) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      await deleteTemplate({ templateId });
      alert("Template deleted successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to delete template");
    }
  };

  const filteredTemplates = selectedCategory
    ? templates?.filter(t => t.category === selectedCategory)
    : templates;

  const categories = [
    { id: "WEDDING", label: "Weddings", icon: "💒" },
    { id: "CORPORATE", label: "Corporate", icon: "💼" },
    { id: "CONCERT", label: "Concerts", icon: "🎵" },
    { id: "GALA", label: "Galas", icon: "✨" },
    { id: "CONFERENCE", label: "Conferences", icon: "🎤" },
    { id: "OTHER", label: "Other", icon: "📋" },
  ];

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Seating Templates</h3>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Current Layout
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Templates
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates?.map((template) => {
          const isMyTemplate = myTemplates?.some(t => t._id === template._id);

          return (
            <div
              key={template._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {template.description}
                  </p>
                </div>
                {template.isPublic ? (
                  <Globe className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                )}
              </div>

              {/* Template Stats */}
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{template.totalCapacity} seats</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span>{template.usageCount} uses</span>
                </div>
              </div>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApplyTemplate(template._id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Apply
                </button>
                {isMyTemplate && (
                  <button
                    onClick={() => handleDeleteTemplate(template._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No templates found in this category</p>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-blue-600 hover:underline text-sm"
          >
            View all templates
          </button>
        </div>
      )}

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Save as Template
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, name: e.target.value })
                  }
                  placeholder="e.g., Wedding 150 Guests"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, description: e.target.value })
                  }
                  placeholder="Describe this seating layout..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={templateForm.category}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={templateForm.tags}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, tags: e.target.value })
                  }
                  placeholder="ballroom, 150-guests, round-tables"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={templateForm.isPublic}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, isPublic: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Make public (share with other organizers)
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsTemplate}
                disabled={savingTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {savingTemplate ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
