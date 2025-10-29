"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Save,
  Eye,
  Info,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import SeatingTemplates, { seatingTemplates } from "@/components/seating/SeatingTemplates";
import TemplateBuilder from "@/components/template-builder/TemplateBuilder";

type SeatingStyle = "ROW_BASED" | "TABLE_BASED" | "MIXED";
type Category = "theater" | "stadium" | "concert" | "conference" | "outdoor" | "wedding" | "gala" | "banquet" | "custom";

interface TemplateFormData {
  name: string;
  description: string;
  category: Category;
  seatingStyle: SeatingStyle;
  estimatedCapacity: number;
  isPublic: boolean;
}

function CreateTemplatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<"choose" | "configure" | "build">("choose");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedBaseTemplate, setSelectedBaseTemplate] = useState<any>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    description: "",
    category: "custom",
    seatingStyle: "MIXED",
    estimatedCapacity: 0,
    isPublic: false,
  });

  const [layoutSections, setLayoutSections] = useState<any[]>([]);

  const createTemplate = useMutation(api.templates.mutations.createRoomTemplate);

  // Check if template was auto-selected from gallery
  useEffect(() => {
    const autoSelect = searchParams.get('autoSelect');
    if (autoSelect === 'true') {
      const storedTemplate = sessionStorage.getItem('selectedTemplate');
      if (storedTemplate) {
        try {
          const template = JSON.parse(storedTemplate);
          handleSelectTemplate(template);
          sessionStorage.removeItem('selectedTemplate'); // Clean up
        } catch (error) {
          console.error('Failed to parse stored template:', error);
        }
      }
    }
  }, [searchParams]);

  const handleStartFromScratch = () => {
    setCurrentStep("configure");
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedBaseTemplate(template);
    setFormData({
      ...formData,
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      estimatedCapacity: template.estimatedCapacity,
    });
    setShowTemplateSelector(false);
    setCurrentStep("configure");
  };

  const handleProceedToBuild = () => {
    if (!formData.name.trim()) {
      alert("Please enter a template name");
      return;
    }

    if (!formData.description.trim()) {
      alert("Please enter a description");
      return;
    }

    setCurrentStep("build");
  };

  const handleSaveFromBuilder = async (sections: any[], totalCapacity: number) => {
    try {
      const templateId = await createTemplate({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        seatingStyle: formData.seatingStyle,
        estimatedCapacity: totalCapacity, // Use calculated capacity from builder
        sections: sections,
        isPublic: formData.isPublic,
      });

      router.push("/organizer/templates");
    } catch (error: any) {
      alert(error.message || "Failed to create template");
    }
  };

  const handleCancelBuild = () => {
    setCurrentStep("configure");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/organizer/templates"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">Create Room Template</h1>
          <p className="text-gray-600 mt-2">
            Design a reusable room layout that you can apply to future events
          </p>
        </div>

        {/* Step 1: Choose Starting Point */}
        {currentStep === "choose" && (
          <div className="space-y-6">
            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-6"
            >
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">About Room Templates</h3>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    Room templates are reusable seating layouts that you can apply to multiple events.
                    Choose to start from scratch or customize one of our pre-built templates to match
                    your venue's configuration.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Choice Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                onClick={handleStartFromScratch}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer p-8 border-2 border-transparent hover:border-blue-500 group"
              >
                <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Start from Scratch</h3>
                <p className="text-gray-600">
                  Build your room layout from the ground up with a blank canvas. Perfect for unique
                  venues or custom configurations.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setShowTemplateSelector(true)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer p-8 border-2 border-transparent hover:border-purple-500 group"
              >
                <div className="text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Use a Pre-built Template</h3>
                <p className="text-gray-600">
                  Choose from {seatingTemplates.length}+ professionally designed templates for theaters,
                  weddings, conferences, and more.
                </p>
                <div className="mt-4">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    Recommended
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Step 2: Configure Template Details */}
        {currentStep === "configure" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Template Details</h2>

            <div className="space-y-6">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grand Ballroom Layout"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this room layout..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="theater">Theater</option>
                  <option value="stadium">Stadium</option>
                  <option value="concert">Concert</option>
                  <option value="conference">Conference</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="wedding">Wedding</option>
                  <option value="gala">Gala</option>
                  <option value="banquet">Banquet</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Seating Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seating Style
                </label>
                <select
                  value={formData.seatingStyle}
                  onChange={(e) => setFormData({ ...formData, seatingStyle: e.target.value as SeatingStyle })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ROW_BASED">Row-Based (Theater, Stadium)</option>
                  <option value="TABLE_BASED">Table-Based (Wedding, Gala)</option>
                  <option value="MIXED">Mixed (Tables + Rows)</option>
                </select>
              </div>

              {/* Estimated Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Capacity
                </label>
                <input
                  type="number"
                  value={formData.estimatedCapacity}
                  onChange={(e) => setFormData({ ...formData, estimatedCapacity: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 150"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Public/Private */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  <span className="font-medium">Make this template public</span>
                  <p className="text-gray-500 mt-1">
                    Public templates can be discovered and used by other organizers on the platform
                  </p>
                </label>
              </div>

              {/* Base Template Info */}
              {selectedBaseTemplate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Based on:</strong> {selectedBaseTemplate.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    You can further customize this template in the seating builder
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  onClick={() => setCurrentStep("choose")}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push("/organizer/templates")}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToBuild}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    Next: Build Layout
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Visual Builder */}
        {currentStep === "build" && (
          <div className="h-[calc(100vh-12rem)]">
            <TemplateBuilder
              initialItems={[]} // TODO: Load from selectedBaseTemplate if applicable
              onSave={handleSaveFromBuilder}
              onCancel={handleCancelBuild}
            />
          </div>
        )}

        {/* Template Selector Modal */}
        {showTemplateSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <SeatingTemplates
                onSelectTemplate={handleSelectTemplate}
                onClose={() => setShowTemplateSelector(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateTemplatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <CreateTemplatePageContent />
    </Suspense>
  );
}
