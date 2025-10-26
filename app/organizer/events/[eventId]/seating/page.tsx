"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Grid,
  CircleDot,
  Accessibility,
  Users,
  AlertCircle,
  Eye,
  Crown,
  Ban,
  User,
  Car,
  Tent,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import VenueImageUploader from "@/components/seating/VenueImageUploader";
import SeatTypePalette, {
  type SeatType,
  getSeatTypeIcon,
  getSeatTypeBgColor,
} from "@/components/seating/SeatTypePalette";

type SeatStatus = "AVAILABLE" | "RESERVED" | "UNAVAILABLE";

interface Seat {
  id: string;
  number: string;
  type: SeatType;
  status: SeatStatus;
}

interface Row {
  id: string;
  label: string;
  seats: Seat[];
}

interface Section {
  id: string;
  name: string;
  color?: string;
  rows: Row[];
  ticketTierId?: Id<"ticketTiers">;
}

export default function SeatingChartBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const existingChart = useQuery(api.seating.queries.getEventSeatingChart, { eventId });
  const ticketTiers = useQuery(api.events.queries.getEventTicketTiers, { eventId });

  const createSeatingChart = useMutation(api.seating.mutations.createSeatingChart);
  const updateSeatingChart = useMutation(api.seating.mutations.updateSeatingChart);
  const deleteSeatingChart = useMutation(api.seating.mutations.deleteSeatingChart);

  const [chartName, setChartName] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Venue image state (NEW)
  const [venueImageId, setVenueImageId] = useState<Id<"_storage"> | undefined>();
  const [venueImageUrl, setVenueImageUrl] = useState<string | undefined>();

  // Initialize with existing chart data
  useState(() => {
    if (existingChart && sections.length === 0) {
      setChartName(existingChart.name);
      setSections(existingChart.sections as Section[]);
      setVenueImageId(existingChart.venueImageId);
      setVenueImageUrl(existingChart.venueImageUrl);
    }
  });

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const addSection = () => {
    const newSection: Section = {
      id: generateId(),
      name: `Section ${sections.length + 1}`,
      color: "#3B82F6",
      rows: [],
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)));
  };

  const deleteSection = (sectionId: string) => {
    if (!confirm("Delete this section and all its seats?")) return;
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const addRow = (sectionId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          const rowLabel = String.fromCharCode(65 + s.rows.length); // A, B, C, ...
          const newRow: Row = {
            id: generateId(),
            label: rowLabel,
            seats: [],
          };
          return { ...s, rows: [...s.rows, newRow] };
        }
        return s;
      })
    );
  };

  const deleteRow = (sectionId: string, rowId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, rows: s.rows.filter((r) => r.id !== rowId) };
        }
        return s;
      })
    );
  };

  const addSeats = (sectionId: string, rowId: string, count: number) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            rows: s.rows.map((r) => {
              if (r.id === rowId) {
                const startNum = r.seats.length + 1;
                const newSeats: Seat[] = Array.from({ length: count }, (_, i) => ({
                  id: generateId(),
                  number: String(startNum + i),
                  type: "STANDARD" as SeatType,
                  status: "AVAILABLE" as SeatStatus,
                }));
                return { ...r, seats: [...r.seats, ...newSeats] };
              }
              return r;
            }),
          };
        }
        return s;
      })
    );
  };

  const updateSeat = (sectionId: string, rowId: string, seatId: string, updates: Partial<Seat>) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            rows: s.rows.map((r) => {
              if (r.id === rowId) {
                return {
                  ...r,
                  seats: r.seats.map((seat) =>
                    seat.id === seatId ? { ...seat, ...updates } : seat
                  ),
                };
              }
              return r;
            }),
          };
        }
        return s;
      })
    );
  };

  const deleteSeat = (sectionId: string, rowId: string, seatId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            rows: s.rows.map((r) => {
              if (r.id === rowId) {
                return { ...r, seats: r.seats.filter((seat) => seat.id !== seatId) };
              }
              return r;
            }),
          };
        }
        return s;
      })
    );
  };

  const handleSave = async () => {
    if (!chartName.trim()) {
      alert("Please enter a chart name");
      return;
    }

    if (sections.length === 0) {
      alert("Please add at least one section");
      return;
    }

    setIsSaving(true);
    try {
      if (existingChart) {
        await updateSeatingChart({
          seatingChartId: existingChart._id,
          name: chartName,
          venueImageId,
          venueImageUrl,
          sections: sections,
        });
        alert("Seating chart updated successfully!");
      } else {
        await createSeatingChart({
          eventId,
          name: chartName,
          venueImageId,
          venueImageUrl,
          sections: sections,
        });
        alert("Seating chart created successfully!");
      }
      router.push(`/organizer/events/${eventId}`);
    } catch (error: any) {
      alert(error.message || "Failed to save seating chart");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingChart) return;
    if (!confirm("Delete this seating chart? This cannot be undone.")) return;

    try {
      await deleteSeatingChart({ seatingChartId: existingChart._id });
      alert("Seating chart deleted");
      router.push(`/organizer/events/${eventId}`);
    } catch (error: any) {
      alert(error.message || "Failed to delete seating chart");
    }
  };

  const getTotalSeats = () => {
    return sections.reduce((total, section) => {
      return total + section.rows.reduce((rowTotal, row) => rowTotal + row.seats.length, 0);
    }, 0);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/organizer/events/${eventId}`}
                className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Event
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Seating Chart Builder</h1>
                <p className="text-sm text-gray-600">{event.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {existingChart && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? "Edit" : "Preview"}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Chart"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {!showPreview ? (
          <div className="space-y-6">
            {/* Chart Name */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart Name
              </label>
              <input
                type="text"
                value={chartName}
                onChange={(e) => setChartName(e.target.value)}
                placeholder="e.g., Main Hall Seating"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Venue Image Uploader (NEW) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <VenueImageUploader
                currentImageUrl={venueImageUrl}
                onImageUploaded={(storageId, url) => {
                  setVenueImageId(storageId as Id<"_storage">);
                  setVenueImageUrl(url);
                }}
                onImageRemoved={() => {
                  setVenueImageId(undefined);
                  setVenueImageUrl(undefined);
                }}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center gap-3">
                  <Grid className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Sections</p>
                    <p className="text-2xl font-bold text-gray-900">{sections.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center gap-3">
                  <CircleDot className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Seats</p>
                    <p className="text-2xl font-bold text-gray-900">{getTotalSeats()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center gap-3">
                  <Accessibility className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Wheelchair Seats</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sections.reduce(
                        (total, section) =>
                          total +
                          section.rows.reduce(
                            (rowTotal, row) =>
                              rowTotal + row.seats.filter((s) => s.type === "WHEELCHAIR").length,
                            0
                          ),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Section Button */}
            <button
              onClick={addSection}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Section
            </button>

            {/* Sections */}
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Section Name
                      </label>
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => updateSection(section.id, { name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <input
                        type="color"
                        value={section.color || "#3B82F6"}
                        onChange={(e) => updateSection(section.id, { color: e.target.value })}
                        className="w-full h-10 px-2 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>

                    {ticketTiers && ticketTiers.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ticket Tier
                        </label>
                        <select
                          value={section.ticketTierId || ""}
                          onChange={(e) =>
                            updateSection(section.id, {
                              ticketTierId: e.target.value
                                ? (e.target.value as Id<"ticketTiers">)
                                : undefined,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">No tier assigned</option>
                          {ticketTiers.map((tier) => (
                            <option key={tier._id} value={tier._id}>
                              {tier.name} - ${(tier.price / 100).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteSection(section.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Rows */}
                <div className="space-y-3">
                  {section.rows.map((row) => (
                    <div key={row.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <h4 className="font-semibold text-gray-900">Row {row.label}</h4>
                          <span className="text-sm text-gray-600">
                            {row.seats.length} seats
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => addSeats(section.id, row.id, 5)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            +5 Seats
                          </button>
                          <button
                            onClick={() => deleteRow(section.id, row.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Seats */}
                      <div className="flex flex-wrap gap-2">
                        {row.seats.map((seat) => (
                          <div
                            key={seat.id}
                            className="relative group"
                            title={`Seat ${seat.number} - ${seat.type}`}
                          >
                            <button
                              className={`w-10 h-10 rounded flex items-center justify-center text-xs font-medium transition-colors ${getSeatTypeBgColor(
                                seat.type
                              )}`}
                              onClick={() => {
                                // Cycle through all seat types
                                const typeOrder: SeatType[] = [
                                  "STANDARD",
                                  "WHEELCHAIR",
                                  "COMPANION",
                                  "VIP",
                                  "BLOCKED",
                                  "STANDING",
                                  "PARKING",
                                  "TENT",
                                ];
                                const currentIndex = typeOrder.indexOf(seat.type);
                                const nextIndex = (currentIndex + 1) % typeOrder.length;
                                updateSeat(section.id, row.id, seat.id, {
                                  type: typeOrder[nextIndex],
                                });
                              }}
                            >
                              {["WHEELCHAIR", "VIP", "BLOCKED", "STANDING", "PARKING", "TENT"].includes(
                                seat.type
                              ) ? (
                                <div className="w-4 h-4">{getSeatTypeIcon(seat.type)}</div>
                              ) : (
                                seat.number
                              )}
                            </button>
                            <button
                              onClick={() => deleteSeat(section.id, row.id, seat.id)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addRow(section.id)}
                  className="mt-4 w-full py-2 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm text-gray-600 hover:text-blue-600 font-medium"
                >
                  + Add Row
                </button>
              </div>
            ))}

            {/* Help Card with Seat Type Legend */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Seating Chart Tips</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside mb-4">
                    <li>Upload a venue floor plan image to visualize your layout</li>
                    <li>Click "+5 Seats" to quickly add seats to a row</li>
                    <li>Click on a seat to cycle through 8 different types</li>
                    <li>Hover over a seat to see the delete button</li>
                    <li>Assign ticket tiers to sections to link pricing</li>
                    <li>Use different colors for sections to help customers identify areas</li>
                  </ul>
                  <div className="pt-4 border-t border-blue-300">
                    <p className="text-sm font-semibold text-blue-900 mb-3">
                      Available Seat Types:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                          <Accessibility className="w-4 h-4 text-blue-700" />
                        </div>
                        <span className="text-blue-900">Wheelchair</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                          <Crown className="w-4 h-4 text-purple-700" />
                        </div>
                        <span className="text-blue-900">VIP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                          <Ban className="w-4 h-4 text-red-700" />
                        </div>
                        <span className="text-blue-900">Blocked</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                          <User className="w-4 h-4 text-orange-700" />
                        </div>
                        <span className="text-blue-900">Standing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                          <Car className="w-4 h-4 text-gray-700" />
                        </div>
                        <span className="text-blue-900">Parking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-teal-100 rounded flex items-center justify-center">
                          <Tent className="w-4 h-4 text-teal-700" />
                        </div>
                        <span className="text-blue-900">Tent/Camping</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-100 rounded flex items-center justify-center text-yellow-700 font-bold">
                          C
                        </div>
                        <span className="text-blue-900">Companion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-700 font-bold">
                          #
                        </div>
                        <span className="text-blue-900">Standard</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Preview Mode
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{chartName}</h2>

            <div className="space-y-8">
              {sections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: section.color || "#3B82F6" }}
                    ></div>
                    <h3 className="text-xl font-bold text-gray-900">{section.name}</h3>
                    {section.ticketTierId && ticketTiers && (
                      <span className="text-sm text-gray-600">
                        ({ticketTiers.find((t) => t._id === section.ticketTierId)?.name})
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {section.rows.map((row) => (
                      <div key={row.id} className="flex items-center gap-2">
                        <span className="w-8 text-sm font-medium text-gray-600 text-right">
                          {row.label}
                        </span>
                        <div className="flex gap-1">
                          {row.seats.map((seat) => (
                            <div
                              key={seat.id}
                              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                                seat.type === "WHEELCHAIR"
                                  ? "bg-green-100 text-green-800"
                                  : seat.type === "COMPANION"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                              style={{
                                backgroundColor:
                                  seat.type === "STANDARD" ? section.color : undefined,
                                color: seat.type === "STANDARD" ? "white" : undefined,
                              }}
                            >
                              {seat.type === "WHEELCHAIR" ? (
                                <Accessibility className="w-4 h-4" />
                              ) : (
                                seat.number
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  <span className="text-gray-700">Standard Seat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                    <Accessibility className="w-4 h-4 text-green-800" />
                  </div>
                  <span className="text-gray-700">Wheelchair Accessible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-100 rounded"></div>
                  <span className="text-gray-700">Companion Seat</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
