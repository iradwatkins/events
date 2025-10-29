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
import VisualSeatingCanvas from "@/components/seating/VisualSeatingCanvas";
import SeatingTemplates, { type SeatingTemplate } from "@/components/seating/SeatingTemplates";
import TableShapePalette, { type TableShape } from "@/components/seating/TableShapePalette";
import TableEditor from "@/components/seating/TableEditor";

type SeatStatus = "AVAILABLE" | "RESERVED" | "UNAVAILABLE";
type EditorMode = "visual" | "list" | "preview";
type SeatingStyle = "ROW_BASED" | "TABLE_BASED" | "MIXED";
type ContainerType = "ROWS" | "TABLES";

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

interface Table {
  id: string;
  number: string | number;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  capacity: number;
  seats: Seat[];
}

interface Section {
  id: string;
  name: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  containerType?: ContainerType;
  rows?: Row[];
  tables?: Table[];
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

  // Venue image state
  const [venueImageId, setVenueImageId] = useState<Id<"_storage"> | undefined>();
  const [venueImageUrl, setVenueImageUrl] = useState<string | undefined>();

  // New visual editor state
  const [editorMode, setEditorMode] = useState<EditorMode>("visual");
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();

  // Table-based seating state
  const [seatingStyle, setSeatingStyle] = useState<SeatingStyle>("ROW_BASED");
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>();
  const [selectedTableShape, setSelectedTableShape] = useState<TableShape>("ROUND");
  const [showTableEditor, setShowTableEditor] = useState(false);

  // Initialize with existing chart data
  useState(() => {
    if (existingChart && sections.length === 0) {
      setChartName(existingChart.name);
      setSections(existingChart.sections as Section[]);
      setVenueImageId(existingChart.venueImageId);
      setVenueImageUrl(existingChart.venueImageUrl);
      if (existingChart.seatingStyle) {
        setSeatingStyle(existingChart.seatingStyle as SeatingStyle);
      }
    }
  });

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const addSection = () => {
    const newSection: Section = {
      id: generateId(),
      name: `Section ${sections.length + 1}`,
      color: "#3B82F6",
      x: 100 + (sections.length * 50),
      y: 100 + (sections.length * 50),
      width: 200,
      height: 150,
      containerType: seatingStyle === "TABLE_BASED" ? "TABLES" : "ROWS",
      rows: seatingStyle === "TABLE_BASED" ? undefined : [],
      tables: seatingStyle === "TABLE_BASED" ? [] : undefined,
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
          const currentRows = s.rows || [];
          const rowLabel = String.fromCharCode(65 + currentRows.length); // A, B, C, ...
          const newRow: Row = {
            id: generateId(),
            label: rowLabel,
            seats: [],
          };
          return { ...s, rows: [...currentRows, newRow] };
        }
        return s;
      })
    );
  };

  const deleteRow = (sectionId: string, rowId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, rows: (s.rows || []).filter((r) => r.id !== rowId) };
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
            rows: (s.rows || []).map((r) => {
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
            rows: (s.rows || []).map((r) => {
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
            rows: s.rows?.map((r) => {
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

  // Table Management Functions
  const addTableToCanvas = (sectionId: string, x: number, y: number) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !section.tables) return;

    const tableNumber = (section.tables?.length || 0) + 1;
    const newTable: Table = {
      id: generateId(),
      number: tableNumber,
      shape: selectedTableShape,
      x,
      y,
      width: 100,
      height: 100,
      rotation: 0,
      capacity: 6,
      seats: Array.from({ length: 6 }, (_, i) => ({
        id: generateId(),
        number: String(i + 1),
        type: "STANDARD" as SeatType,
        status: "AVAILABLE" as SeatStatus,
      })),
    };

    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, tables: [...(s.tables || []), newTable] };
        }
        return s;
      })
    );
  };

  const updateTable = (sectionId: string, tableId: string, updates: Partial<Table>) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            tables: (s.tables || []).map((t) =>
              t.id === tableId ? { ...t, ...updates } : t
            ),
          };
        }
        return s;
      })
    );
  };

  const deleteTable = (sectionId: string, tableId: string) => {
    if (!confirm("Delete this table and all its seats?")) return;
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            tables: (s.tables || []).filter((t) => t.id !== tableId),
          };
        }
        return s;
      })
    );
    if (selectedTableId === tableId) {
      setSelectedTableId(undefined);
      setShowTableEditor(false);
    }
  };

  const handleTableSelect = (sectionId: string, tableId: string) => {
    setSelectedTableId(tableId);
    setSelectedSectionId(sectionId);
    setShowTableEditor(true);
  };

  const getSelectedTable = (): Table | undefined => {
    if (!selectedTableId || !selectedSectionId) return undefined;
    const section = sections.find((s) => s.id === selectedSectionId);
    return section?.tables?.find((t) => t.id === selectedTableId);
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
          seatingStyle,
          sections: sections,
        });
        alert("Seating chart updated successfully!");
      } else {
        await createSeatingChart({
          eventId,
          name: chartName,
          venueImageId,
          venueImageUrl,
          seatingStyle,
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
      let sectionTotal = 0;
      if (section.rows) {
        sectionTotal += section.rows.reduce((rowTotal, row) => rowTotal + row.seats.length, 0);
      }
      if (section.tables) {
        sectionTotal += section.tables.reduce((tableTotal, table) => tableTotal + table.seats.length, 0);
      }
      return total + sectionTotal;
    }, 0);
  };

  // Apply template
  const applyTemplate = (template: SeatingTemplate) => {
    setSections(template.sections);
    if (!chartName) {
      setChartName(template.name);
    }
  };

  // Update section (for visual canvas)
  const updateSectionVisually = (sectionId: string, updates: Partial<Section>) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)));
  };

  // Duplicate row
  const duplicateRow = (sectionId: string, rowId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          const currentRows = s.rows || [];
          const rowIndex = currentRows.findIndex((r) => r.id === rowId);
          if (rowIndex === -1) return s;

          const rowToDuplicate = currentRows[rowIndex];
          const newRow: Row = {
            ...rowToDuplicate,
            id: generateId(),
            label: String.fromCharCode(65 + currentRows.length), // Next letter
            seats: rowToDuplicate.seats.map((seat) => ({
              ...seat,
              id: generateId(),
            })),
          };

          return {
            ...s,
            rows: [...currentRows, newRow],
          };
        }
        return s;
      })
    );
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
              {/* Template Button */}
              <button
                onClick={() => setShowTemplates(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
              >
                <Grid className="w-4 h-4" />
                Templates
              </button>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setEditorMode("visual")}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    editorMode === "visual"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Visual
                </button>
                <button
                  onClick={() => setEditorMode("list")}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    editorMode === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setEditorMode("preview")}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    editorMode === "preview"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Preview
                </button>
              </div>

              {existingChart && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
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

      {/* Template Modal */}
      {showTemplates && (
        <SeatingTemplates
          onSelectTemplate={applyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {editorMode === "visual" ? (
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

            {/* Seating Style Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Seating Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSeatingStyle("ROW_BASED")}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    seatingStyle === "ROW_BASED"
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-1">Row-Based</h4>
                  <p className="text-xs text-gray-600">Theater, stadium, concert seating</p>
                </button>
                <button
                  onClick={() => setSeatingStyle("TABLE_BASED")}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    seatingStyle === "TABLE_BASED"
                      ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-1">Table-Based</h4>
                  <p className="text-xs text-gray-600">Wedding, gala, banquet seating</p>
                </button>
                <button
                  onClick={() => setSeatingStyle("MIXED")}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    seatingStyle === "MIXED"
                      ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-1">Mixed</h4>
                  <p className="text-xs text-gray-600">Combination of rows and tables</p>
                </button>
              </div>
            </div>

            {/* Table Shape Palette (only for table-based or mixed) */}
            {(seatingStyle === "TABLE_BASED" || seatingStyle === "MIXED") && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <TableShapePalette
                  currentShape={selectedTableShape}
                  onShapeSelect={setSelectedTableShape}
                />
              </div>
            )}

            {/* Venue Image Uploader */}
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

            {/* Visual Canvas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <VisualSeatingCanvas
                venueImageUrl={venueImageUrl}
                sections={sections}
                onSectionUpdate={updateSectionVisually}
                selectedSectionId={selectedSectionId}
                onSectionSelect={setSelectedSectionId}
                selectedTableId={selectedTableId}
                onTableSelect={handleTableSelect}
                onTableUpdate={updateTable}
              />
            </div>

            {/* Table Editor Sidebar */}
            {showTableEditor && selectedTableId && selectedSectionId && (
              <TableEditor
                table={getSelectedTable()!}
                onUpdate={(updates) => updateTable(selectedSectionId, selectedTableId, updates as Partial<Table>)}
                onDelete={() => deleteTable(selectedSectionId, selectedTableId)}
                onClose={() => {
                  setShowTableEditor(false);
                  setSelectedTableId(undefined);
                }}
              />
            )}

            {/* Quick Add Section Button */}
            <button
              onClick={addSection}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Section to Canvas
            </button>

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
                      {sections.reduce((total, section) => {
                        let wheelchairCount = 0;
                        if (section.rows) {
                          wheelchairCount += section.rows.reduce(
                            (rowTotal, row) =>
                              rowTotal + row.seats.filter((s) => s.type === "WHEELCHAIR").length,
                            0
                          );
                        }
                        if (section.tables) {
                          wheelchairCount += section.tables.reduce(
                            (tableTotal, table) =>
                              tableTotal + table.seats.filter((s) => s.type === "WHEELCHAIR").length,
                            0
                          );
                        }
                        return total + wheelchairCount;
                      }, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : editorMode === "list" ? (
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
                      {sections.reduce((total, section) => {
                        let wheelchairCount = 0;
                        if (section.rows) {
                          wheelchairCount += section.rows.reduce(
                            (rowTotal, row) =>
                              rowTotal + row.seats.filter((s) => s.type === "WHEELCHAIR").length,
                            0
                          );
                        }
                        if (section.tables) {
                          wheelchairCount += section.tables.reduce(
                            (tableTotal, table) =>
                              tableTotal + table.seats.filter((s) => s.type === "WHEELCHAIR").length,
                            0
                          );
                        }
                        return total + wheelchairCount;
                      }, 0)}
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
                {section.rows && section.rows.length > 0 && (
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
                            onClick={() => duplicateRow(section.id, row.id)}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors flex items-center gap-1"
                            title="Duplicate this row"
                          >
                            <Plus className="w-3 h-3" />
                            Copy Row
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
                )}

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
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{chartName}</h2>
              <p className="text-sm text-gray-600">Preview Mode - This is how customers will see your seating chart</p>
            </div>

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

                  {section.rows && section.rows.length > 0 && (
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
                  )}
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
