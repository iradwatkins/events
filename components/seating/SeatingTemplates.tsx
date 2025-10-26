"use client";

import { Building2, Theater, Music, Users as UsersIcon, Tent as TentIcon, Grid } from "lucide-react";
import { motion } from "framer-motion";

export interface SeatingTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "theater" | "stadium" | "concert" | "conference" | "outdoor" | "custom";
  sections: any[];
  estimatedCapacity: number;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

type SeatType = "STANDARD" | "WHEELCHAIR" | "COMPANION" | "VIP" | "BLOCKED" | "STANDING" | "PARKING" | "TENT";

const generateSeats = (count: number, type: SeatType = "STANDARD") => {
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    number: String(i + 1),
    type,
    status: "AVAILABLE" as const,
  }));
};

export const seatingTemplates: SeatingTemplate[] = [
  {
    id: "theater-small",
    name: "Small Theater",
    description: "200-seat theater with center aisle, 10 rows",
    icon: <Theater className="w-8 h-8" />,
    category: "theater",
    estimatedCapacity: 200,
    sections: [
      {
        id: "left-orchestra",
        name: "Left Orchestra",
        color: "#3B82F6",
        x: 150,
        y: 250,
        width: 300,
        height: 400,
        rotation: 0,
        rows: Array.from({ length: 10 }, (_, rowIndex) => ({
          id: generateId(),
          label: String.fromCharCode(65 + rowIndex), // A-J
          seats: generateSeats(10),
        })),
      },
      {
        id: "right-orchestra",
        name: "Right Orchestra",
        color: "#3B82F6",
        x: 500,
        y: 250,
        width: 300,
        height: 400,
        rotation: 0,
        rows: Array.from({ length: 10 }, (_, rowIndex) => ({
          id: generateId(),
          label: String.fromCharCode(65 + rowIndex),
          seats: generateSeats(10),
        })),
      },
    ],
  },
  {
    id: "stadium-section",
    name: "Stadium Section",
    description: "Single stadium section with 15 rows, 20 seats per row",
    icon: <Building2 className="w-8 h-8" />,
    category: "stadium",
    estimatedCapacity: 300,
    sections: [
      {
        id: "section-101",
        name: "Section 101",
        color: "#8B5CF6",
        x: 200,
        y: 200,
        width: 400,
        height: 500,
        rotation: 0,
        rows: Array.from({ length: 15 }, (_, rowIndex) => ({
          id: generateId(),
          label: String(rowIndex + 1),
          seats: generateSeats(20),
        })),
      },
    ],
  },
  {
    id: "concert-ga",
    name: "General Admission Concert",
    description: "Standing room + seated VIP section",
    icon: <Music className="w-8 h-8" />,
    category: "concert",
    estimatedCapacity: 500,
    sections: [
      {
        id: "vip-section",
        name: "VIP Seating",
        color: "#A855F7",
        x: 200,
        y: 150,
        width: 400,
        height: 200,
        rotation: 0,
        rows: Array.from({ length: 5 }, (_, rowIndex) => ({
          id: generateId(),
          label: String.fromCharCode(65 + rowIndex),
          seats: generateSeats(12, "VIP"),
        })),
      },
      {
        id: "ga-floor",
        name: "GA Floor (Standing)",
        color: "#10B981",
        x: 200,
        y: 400,
        width: 400,
        height: 300,
        rotation: 0,
        rows: [
          {
            id: generateId(),
            label: "FLOOR",
            seats: generateSeats(440, "STANDING"),
          },
        ],
      },
    ],
  },
  {
    id: "conference-room",
    name: "Conference Room",
    description: "U-shaped seating for 40 people",
    icon: <UsersIcon className="w-8 h-8" />,
    category: "conference",
    estimatedCapacity: 40,
    sections: [
      {
        id: "head-table",
        name: "Head Table",
        color: "#EF4444",
        x: 300,
        y: 150,
        width: 300,
        height: 100,
        rotation: 0,
        rows: [
          {
            id: generateId(),
            label: "HEAD",
            seats: generateSeats(10),
          },
        ],
      },
      {
        id: "left-side",
        name: "Left Side",
        color: "#3B82F6",
        x: 150,
        y: 300,
        width: 100,
        height: 300,
        rotation: 0,
        rows: Array.from({ length: 3 }, (_, i) => ({
          id: generateId(),
          label: `L${i + 1}`,
          seats: generateSeats(5),
        })),
      },
      {
        id: "right-side",
        name: "Right Side",
        color: "#3B82F6",
        x: 650,
        y: 300,
        width: 100,
        height: 300,
        rotation: 0,
        rows: Array.from({ length: 3 }, (_, i) => ({
          id: generateId(),
          label: `R${i + 1}`,
          seats: generateSeats(5),
        })),
      },
    ],
  },
  {
    id: "outdoor-festival",
    name: "Outdoor Festival",
    description: "Mix of seating, tents, and parking",
    icon: <TentIcon className="w-8 h-8" />,
    category: "outdoor",
    estimatedCapacity: 200,
    sections: [
      {
        id: "seating-area",
        name: "Seating Area",
        color: "#F59E0B",
        x: 200,
        y: 150,
        width: 300,
        height: 250,
        rotation: 0,
        rows: Array.from({ length: 8 }, (_, i) => ({
          id: generateId(),
          label: String.fromCharCode(65 + i),
          seats: generateSeats(12),
        })),
      },
      {
        id: "tent-camping",
        name: "Tent Camping",
        color: "#059669",
        x: 550,
        y: 150,
        width: 250,
        height: 250,
        rotation: 0,
        rows: Array.from({ length: 5 }, (_, i) => ({
          id: generateId(),
          label: `T${i + 1}`,
          seats: generateSeats(8, "TENT"),
        })),
      },
      {
        id: "parking",
        name: "Parking Spaces",
        color: "#6B7280",
        x: 200,
        y: 450,
        width: 600,
        height: 150,
        rotation: 0,
        rows: [
          {
            id: generateId(),
            label: "P1",
            seats: generateSeats(30, "PARKING"),
          },
        ],
      },
    ],
  },
  {
    id: "blank-canvas",
    name: "Blank Canvas",
    description: "Start from scratch with no pre-defined sections",
    icon: <Grid className="w-8 h-8" />,
    category: "custom",
    estimatedCapacity: 0,
    sections: [],
  },
];

interface SeatingTemplatesProps {
  onSelectTemplate: (template: SeatingTemplate) => void;
  onClose: () => void;
}

export default function SeatingTemplates({
  onSelectTemplate,
  onClose,
}: SeatingTemplatesProps) {
  const categories = [
    { id: "theater", name: "Theater", color: "bg-blue-100 text-blue-700" },
    { id: "stadium", name: "Stadium", color: "bg-purple-100 text-purple-700" },
    { id: "concert", name: "Concert", color: "bg-pink-100 text-pink-700" },
    { id: "conference", name: "Conference", color: "bg-red-100 text-red-700" },
    { id: "outdoor", name: "Outdoor", color: "bg-green-100 text-green-700" },
    { id: "custom", name: "Custom", color: "bg-gray-100 text-gray-700" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Choose a Seating Template</h2>
          <p className="text-blue-100">
            Start with a pre-built layout or create your own from scratch
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seatingTemplates.map((template) => {
              const category = categories.find((c) => c.id === template.category);

              return (
                <motion.button
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 text-left hover:border-blue-500 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${category?.color}`}
                      >
                        {category?.name}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="text-gray-500">
                      <span className="font-semibold">{template.sections.length}</span> sections
                    </div>
                    <div className="text-blue-600 font-semibold">
                      ~{template.estimatedCapacity} capacity
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
