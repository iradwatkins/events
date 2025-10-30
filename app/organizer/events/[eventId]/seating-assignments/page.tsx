"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Users, ChevronDown, ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SeatingAssignmentsPage() {
  const params = useParams();
  const eventId = params.eventId as Id<"events">;

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const seatingChart = useQuery(api.seating.queries.getEventSeatingChart, { eventId });
  const assignments = useQuery(api.seating.queries.getEventTableAssignments, { eventId });

  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTable = (tableId: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };

  const exportToCSV = () => {
    if (!assignments || !assignments.sections) return;

    let csv = "Section,Table Number,Seat Number,Attendee Name,Attendee Email,Ticket Code\n";

    assignments.sections.forEach((section) => {
      section.tables?.forEach((table) => {
        table.seats.forEach((seat) => {
          csv += `"${section.sectionName}","${table.tableNumber}","${seat.seatNumber}","${seat.attendeeName || ""}","${seat.attendeeEmail || ""}","${seat.ticketCode || ""}"\n`;
        });
      });

      section.rows?.forEach((row) => {
        row.seats.forEach((seat) => {
          csv += `"${section.sectionName}","Row ${row.rowLabel}","${seat.seatNumber}","${seat.attendeeName || ""}","${seat.attendeeEmail || ""}","${seat.ticketCode || ""}"\n`;
        });
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seating-chart-${eventId}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isLoading = !event || !seatingChart || !assignments;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!seatingChart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-gray-600 mb-4">No seating chart found for this event.</p>
          <Link
            href={`/organizer/events/${eventId}`}
            className="inline-block text-blue-600 hover:underline"
          >
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  // Build a map of all tables with their capacities
  const tableCapacities = new Map<string, { capacity: number; shape: string }>();
  seatingChart.sections.forEach((section) => {
    section.tables?.forEach((table) => {
      tableCapacities.set(table.id, {
        capacity: table.capacity,
        shape: table.shape,
      });
    });
  });

  // Calculate statistics
  const totalTables = seatingChart.sections.reduce(
    (sum, section) => sum + (section.tables?.length || 0),
    0
  );
  const totalSeats = seatingChart.totalSeats;
  const assignedSeats = assignments?.totalAssignedSeats || 0;
  const availableSeats = totalSeats - assignedSeats;

  // Count occupied tables
  const occupiedTables = new Set(
    assignments?.sections.flatMap((s) => s.tables?.map((t) => t.tableId) || [])
  ).size;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/organizer/events/${eventId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Seating Assignments
              </h1>
              <p className="text-gray-600">{event.name}</p>
            </div>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tables</p>
                <p className="text-2xl font-bold text-gray-900">{totalTables}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Occupied Tables</p>
                <p className="text-2xl font-bold text-gray-900">{occupiedTables}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assigned Seats</p>
                <p className="text-2xl font-bold text-gray-900">{assignedSeats}/{totalSeats}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Seats</p>
                <p className="text-2xl font-bold text-gray-900">{availableSeats}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seating Chart Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {seatingChart.name}
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-700">
              <span className="font-medium">Style:</span> {seatingChart.seatingStyle}
            </span>
            <span className="text-gray-700">
              <span className="font-medium">Sections:</span> {seatingChart.sections.length}
            </span>
            <span className="text-gray-700">
              <span className="font-medium">Total Capacity:</span> {totalSeats} seats
            </span>
          </div>
        </div>

        {/* Table Assignments */}
        {assignments && assignments.sections && assignments.sections.length > 0 ? (
          <div className="space-y-6">
            {assignments.sections.map((section) => (
              <div key={section.sectionId} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {section.sectionName}
                </h2>

                {/* Tables */}
                {section.tables && section.tables.length > 0 && (
                  <div className="space-y-4">
                    {section.tables.map((table) => {
                      const tableInfo = tableCapacities.get(table.tableId);
                      const capacity = tableInfo?.capacity || table.seats.length;
                      const occupied = table.seats.length;
                      const isExpanded = expandedTables.has(table.tableId);
                      const occupancyPercent = Math.round((occupied / capacity) * 100);

                      return (
                        <div
                          key={table.tableId}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Table Header */}
                          <button
                            onClick={() => toggleTable(table.tableId)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                              )}
                              <div className="text-left">
                                <h3 className="font-semibold text-gray-900">
                                  Table {table.tableNumber}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {occupied}/{capacity} seats occupied ({occupancyPercent}%)
                                </p>
                              </div>
                            </div>

                            {/* Occupancy Badge */}
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                occupied === capacity
                                  ? "bg-red-100 text-red-800"
                                  : occupied > 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {occupied === capacity
                                ? "Full"
                                : occupied > 0
                                ? "Partial"
                                : "Empty"}
                            </div>
                          </button>

                          {/* Table Details */}
                          {isExpanded && (
                            <div className="border-t border-gray-200 p-4 bg-gray-50">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                        Seat
                                      </th>
                                      <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                        Attendee Name
                                      </th>
                                      <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                        Email
                                      </th>
                                      <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                        Ticket Code
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {table.seats.map((seat) => (
                                      <tr
                                        key={seat.seatId}
                                        className="border-b border-gray-100"
                                      >
                                        <td className="py-2 px-3 text-gray-900">
                                          Seat {seat.seatNumber}
                                        </td>
                                        <td className="py-2 px-3 text-gray-900">
                                          {seat.attendeeName || "-"}
                                        </td>
                                        <td className="py-2 px-3 text-gray-600">
                                          {seat.attendeeEmail || "-"}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-xs text-gray-600">
                                          {seat.ticketCode || "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Rows (if row-based seating) */}
                {section.rows && section.rows.length > 0 && (
                  <div className="space-y-4">
                    {section.rows.map((row) => (
                      <div
                        key={row.rowId}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Row {row.rowLabel} ({row.seats.length} seats)
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Seat
                                </th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Attendee Name
                                </th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Email
                                </th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Ticket Code
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.seats.map((seat) => (
                                <tr
                                  key={seat.seatId}
                                  className="border-b border-gray-100"
                                >
                                  <td className="py-2 px-3 text-gray-900">
                                    {seat.seatNumber}
                                  </td>
                                  <td className="py-2 px-3 text-gray-900">
                                    {seat.attendeeName || "-"}
                                  </td>
                                  <td className="py-2 px-3 text-gray-600">
                                    {seat.attendeeEmail || "-"}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-xs text-gray-600">
                                    {seat.ticketCode || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No seat assignments yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              Assignments will appear here when tickets are purchased.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
