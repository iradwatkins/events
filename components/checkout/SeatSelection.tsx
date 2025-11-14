"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Accessibility, AlertCircle, Check, Crown, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SeatSelectionProps {
  eventId: Id<"events">;
  ticketTierId?: Id<"ticketTiers">;
  requiredSeats: number;
  onSeatsSelected: (seats: SelectedSeat[]) => void;
}

export interface SelectedSeat {
  sectionId: string;
  sectionName: string;
  rowId?: string;
  rowLabel?: string;
  tableId?: string;
  tableNumber?: string | number;
  seatId: string;
  seatNumber: string;
}

export default function SeatSelection({
  eventId,
  ticketTierId,
  requiredSeats,
  onSeatsSelected,
}: SeatSelectionProps) {
  const seatingChart = useQuery(api.seating.queries.getPublicSeatingChart, { eventId });
  const ticketTier = useQuery(
    api.tickets.queries.getTicketTier,
    ticketTierId ? { tierId: ticketTierId } : "skip"
  );
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);

  // Check if this is a table package tier
  const isTablePackage = ticketTier?.isTablePackage || false;
  const tableCapacity = ticketTier?.tableCapacity;

  // Auto-submit when required seats are selected
  useEffect(() => {
    if (selectedSeats.length === requiredSeats) {
      onSeatsSelected(selectedSeats);
    } else if (selectedSeats.length < requiredSeats) {
      onSeatsSelected([]);
    }
  }, [selectedSeats, requiredSeats, onSeatsSelected]);

  if (!seatingChart) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Loading seating chart...</p>
      </div>
    );
  }

  // Filter sections by ticket tier if specified
  const availableSections = seatingChart.sections.filter((section) => {
    if (!ticketTierId) return true;
    return section.ticketTierId === ticketTierId || !section.ticketTierId;
  });

  if (availableSections.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900">No Seating Available</p>
            <p className="text-sm text-yellow-700 mt-1">
              There are no seats available for this ticket tier.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const toggleSeat = (
    sectionId: string,
    sectionName: string,
    seatId: string,
    seatNumber: string,
    rowId?: string,
    rowLabel?: string,
    tableId?: string,
    tableNumber?: string | number
  ) => {
    const seatKey = rowId
      ? `${sectionId}-row-${rowId}-${seatId}`
      : `${sectionId}-table-${tableId}-${seatId}`;

    const isSelected = selectedSeats.some((s) => {
      if (s.rowId) {
        return `${s.sectionId}-row-${s.rowId}-${s.seatId}` === seatKey;
      } else {
        return `${s.sectionId}-table-${s.tableId}-${s.seatId}` === seatKey;
      }
    });

    if (isSelected) {
      setSelectedSeats(
        selectedSeats.filter((s) => {
          if (s.rowId) {
            return `${s.sectionId}-row-${s.rowId}-${s.seatId}` !== seatKey;
          } else {
            return `${s.sectionId}-table-${s.tableId}-${s.seatId}` !== seatKey;
          }
        })
      );
    } else {
      if (selectedSeats.length < requiredSeats) {
        setSelectedSeats([
          ...selectedSeats,
          { sectionId, sectionName, rowId, rowLabel, tableId, tableNumber, seatId, seatNumber },
        ]);
      }
    }
  };

  const isSeatSelected = (sectionId: string, seatId: string, rowId?: string, tableId?: string) => {
    const seatKey = rowId
      ? `${sectionId}-row-${rowId}-${seatId}`
      : `${sectionId}-table-${tableId}-${seatId}`;

    return selectedSeats.some((s) => {
      if (s.rowId) {
        return `${s.sectionId}-row-${s.rowId}-${s.seatId}` === seatKey;
      } else {
        return `${s.sectionId}-table-${s.tableId}-${s.seatId}` === seatKey;
      }
    });
  };

  // Select all seats at a table (for table package purchases)
  const selectEntireTable = (
    sectionId: string,
    sectionName: string,
    tableId: string,
    tableNumber: string | number,
    seats: any[]
  ) => {
    const availableSeats = seats.filter((s) => s.status === "AVAILABLE");

    if (availableSeats.length === 0) {
      return; // No available seats
    }

    // Check if all seats at this table are already selected
    const allSeatsSelected = availableSeats.every((seat) =>
      isSeatSelected(sectionId, seat.id, undefined, tableId)
    );

    if (allSeatsSelected) {
      // Deselect all seats at this table
      setSelectedSeats(
        selectedSeats.filter((s) => s.tableId !== tableId || s.sectionId !== sectionId)
      );
    } else {
      // Select all available seats at this table
      const tableSeats: SelectedSeat[] = availableSeats.map((seat) => ({
        sectionId,
        sectionName,
        tableId,
        tableNumber,
        seatId: seat.id,
        seatNumber: seat.number,
      }));

      // Replace any existing selections with this table's seats
      setSelectedSeats(tableSeats);
    }
  };

  // Check if entire table is selected
  const isEntireTableSelected = (sectionId: string, tableId: string, seats: any[]) => {
    const availableSeats = seats.filter((s) => s.status === "AVAILABLE");
    if (availableSeats.length === 0) return false;

    return availableSeats.every((seat) => isSeatSelected(sectionId, seat.id, undefined, tableId));
  };

  const getAvailableSeatCount = () => {
    return availableSections.reduce((total, section) => {
      let sectionTotal = 0;

      // Count row seats
      if (section.rows) {
        sectionTotal += section.rows.reduce((rowTotal, row) => {
          return rowTotal + row.seats.filter((s) => s.status === "AVAILABLE").length;
        }, 0);
      }

      // Count table seats
      if (section.tables) {
        sectionTotal += section.tables.reduce((tableTotal, table) => {
          return tableTotal + table.seats.filter((s) => s.status === "AVAILABLE").length;
        }, 0);
      }

      return total + sectionTotal;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Selection Progress */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-900">
            Select {requiredSeats} {requiredSeats === 1 ? "seat" : "seats"}
          </span>
          <span className="text-sm text-gray-700">
            {selectedSeats.length} / {requiredSeats} selected
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(selectedSeats.length / requiredSeats) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Selected Seats Summary */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-2">Selected Seats:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seat, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {seat.sectionName} -{" "}
                      {seat.rowId ? (
                        <>
                          Row {seat.rowLabel}, Seat {seat.seatNumber}
                        </>
                      ) : (
                        <>
                          Table {seat.tableNumber}, Seat {seat.seatNumber}
                        </>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seating Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-8">
          {availableSections.map((section) => (
            <div key={section.id}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: section.color || "#3B82F6" }}
                ></div>
                <h3 className="text-lg font-bold text-gray-900">{section.name}</h3>
                <span className="text-sm text-gray-600">
                  (
                  {(() => {
                    let available = 0;
                    if (section.rows) {
                      available += section.rows.reduce(
                        (total, row) =>
                          total + row.seats.filter((s) => s.status === "AVAILABLE").length,
                        0
                      );
                    }
                    if (section.tables) {
                      available += section.tables.reduce(
                        (total, table) =>
                          total + table.seats.filter((s) => s.status === "AVAILABLE").length,
                        0
                      );
                    }
                    return available;
                  })()}{" "}
                  available)
                </span>
              </div>

              {/* Row-based seating */}
              {section.rows && section.rows.length > 0 && (
                <div className="space-y-2 overflow-x-auto pb-2">
                  {section.rows.map((row) => (
                    <div key={row.id} className="flex items-center gap-2 min-w-max">
                      <span className="w-12 text-sm font-medium text-gray-600 text-right flex-shrink-0">
                        Row {row.label}
                      </span>
                      <div className="flex gap-1">
                        {row.seats.map((seat) => {
                          const isSelected = isSeatSelected(section.id, seat.id, row.id);
                          const isAvailable = seat.status === "AVAILABLE";
                          const isReserved = seat.status === "RESERVED";
                          const isWheelchair = seat.type === "WHEELCHAIR";

                          const isVIP = seat.type === "VIP";
                          const isCompanion = seat.type === "COMPANION";

                          return (
                            <button
                              key={seat.id}
                              onClick={() => {
                                if (isAvailable) {
                                  toggleSeat(
                                    section.id,
                                    section.name,
                                    seat.id,
                                    seat.number,
                                    row.id,
                                    row.label
                                  );
                                }
                              }}
                              disabled={!isAvailable}
                              className={`w-10 h-10 rounded flex items-center justify-center text-xs font-medium transition-all border-2 ${
                                isSelected
                                  ? "bg-green-600 text-white border-green-700 scale-110"
                                  : isReserved
                                    ? "bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed"
                                    : isWheelchair
                                      ? "bg-white text-black border-black hover:bg-green-50 cursor-pointer"
                                      : isVIP
                                        ? "bg-white text-black border-yellow-600 hover:bg-green-50 cursor-pointer"
                                        : isCompanion
                                          ? "bg-white text-black border-black hover:bg-green-50 cursor-pointer"
                                          : "bg-white text-gray-900 border-gray-900 hover:bg-green-50 cursor-pointer"
                              }`}
                              title={
                                isReserved
                                  ? "Reserved"
                                  : isWheelchair
                                    ? `Wheelchair Accessible Seat ${seat.number}`
                                    : isVIP
                                      ? `VIP Seat ${seat.number}`
                                      : isCompanion
                                        ? `Companion Seat ${seat.number}`
                                        : `Seat ${seat.number}`
                              }
                            >
                              {isWheelchair ? (
                                <Accessibility className="w-4 h-4" />
                              ) : isVIP ? (
                                <Crown className="w-4 h-4" />
                              ) : isCompanion ? (
                                <Users className="w-4 h-4" />
                              ) : (
                                <span>{seat.number}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Table-based seating */}
              {section.tables && section.tables.length > 0 && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 mb-4">
                    {isTablePackage
                      ? `Purchase entire tables (${tableCapacity} seats each)`
                      : "Click on a seat at any table to select it"}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.tables.map((table) => {
                      const availableSeatsAtTable = table.seats.filter(
                        (s) => s.status === "AVAILABLE"
                      ).length;
                      const tableSelected = isEntireTableSelected(
                        section.id,
                        table.id,
                        table.seats
                      );
                      const tableFullyAvailable = availableSeatsAtTable === table.seats.length;

                      return (
                        <div
                          key={table.id}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            isTablePackage
                              ? tableSelected
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 bg-gray-50 hover:border-primary/40"
                              : "border-gray-200 bg-gray-50 hover:border-border"
                          }`}
                        >
                          <h4 className="font-semibold text-gray-900 mb-3 text-center">
                            Table {table.number}
                          </h4>

                          {isTablePackage ? (
                            /* Table Package Mode - Show "Buy This Table" Button */
                            <div className="space-y-3">
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-sm text-gray-600 text-center mb-1">
                                  {table.seats.length} seats
                                </p>
                                <p className="text-xs text-center">
                                  {availableSeatsAtTable === table.seats.length ? (
                                    <span className="text-green-600 font-medium">
                                      All seats available
                                    </span>
                                  ) : availableSeatsAtTable === 0 ? (
                                    <span className="text-red-600 font-medium">
                                      No seats available
                                    </span>
                                  ) : (
                                    <span className="text-yellow-600 font-medium">
                                      Only {availableSeatsAtTable} seats available
                                    </span>
                                  )}
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  if (tableFullyAvailable) {
                                    selectEntireTable(
                                      section.id,
                                      section.name,
                                      table.id,
                                      table.number,
                                      table.seats
                                    );
                                  }
                                }}
                                disabled={!tableFullyAvailable}
                                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                                  tableFullyAvailable
                                    ? tableSelected
                                      ? "bg-green-600 text-white hover:bg-green-700"
                                      : "bg-primary text-white hover:bg-primary/90"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                              >
                                {tableSelected ? (
                                  <>
                                    <Check className="w-4 h-4 inline mr-2" />
                                    Table Selected
                                  </>
                                ) : tableFullyAvailable ? (
                                  `Buy This Table`
                                ) : (
                                  "Table Unavailable"
                                )}
                              </button>

                              {ticketTier?.price && tableFullyAvailable && (
                                <p className="text-xs text-center text-gray-600">
                                  ${(ticketTier.price / 100).toFixed(2)} for {table.seats.length}{" "}
                                  seats
                                  <br />
                                  (${(ticketTier.price / 100 / table.seats.length).toFixed(2)} per
                                  seat)
                                </p>
                              )}
                            </div>
                          ) : (
                            /* Normal Mode - Show Individual Seats */
                            <div className="flex flex-wrap gap-2 justify-center">
                              {table.seats.map((seat) => {
                                const isSelected = isSeatSelected(
                                  section.id,
                                  seat.id,
                                  undefined,
                                  table.id
                                );
                                const isAvailable = seat.status === "AVAILABLE";
                                const isReserved = seat.status === "RESERVED";
                                const isWheelchair = seat.type === "WHEELCHAIR";
                                const isVIP = seat.type === "VIP";
                                const isCompanion = seat.type === "COMPANION";

                                return (
                                  <button
                                    key={seat.id}
                                    onClick={() => {
                                      if (isAvailable) {
                                        toggleSeat(
                                          section.id,
                                          section.name,
                                          seat.id,
                                          seat.number,
                                          undefined,
                                          undefined,
                                          table.id,
                                          table.number
                                        );
                                      }
                                    }}
                                    disabled={!isAvailable}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-medium transition-all border-2 ${
                                      isSelected
                                        ? "bg-green-600 text-white border-green-700 scale-110"
                                        : isReserved
                                          ? "bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed"
                                          : isWheelchair
                                            ? "bg-white text-black border-black hover:bg-green-50 cursor-pointer"
                                            : isVIP
                                              ? "bg-white text-black border-yellow-600 hover:bg-green-50 cursor-pointer"
                                              : isCompanion
                                                ? "bg-white text-black border-black hover:bg-green-50 cursor-pointer"
                                                : "bg-white text-gray-900 border-gray-900 hover:bg-green-50 cursor-pointer"
                                    }`}
                                    title={
                                      isReserved
                                        ? "Reserved"
                                        : isWheelchair
                                          ? `Wheelchair Accessible Seat ${seat.number}`
                                          : isVIP
                                            ? `VIP Seat ${seat.number}`
                                            : isCompanion
                                              ? `Companion Seat ${seat.number}`
                                              : `Seat ${seat.number}`
                                    }
                                  >
                                    {isWheelchair ? (
                                      <Accessibility className="w-4 h-4" />
                                    ) : isVIP ? (
                                      <Crown className="w-4 h-4" />
                                    ) : isCompanion ? (
                                      <Users className="w-4 h-4" />
                                    ) : (
                                      <span>{seat.number}</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {!isTablePackage && (
                            <p className="text-xs text-gray-600 text-center mt-3">
                              {table.seats.filter((s) => s.status === "AVAILABLE").length} of{" "}
                              {table.seats.length} available
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white border-2 border-gray-900 rounded"></div>
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 border-2 border-green-700 rounded"></div>
            <span className="text-gray-700">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 border-2 border-gray-400 rounded"></div>
            <span className="text-gray-700">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white border-2 border-black rounded flex items-center justify-center">
              <Accessibility className="w-4 h-4 text-black" />
            </div>
            <span className="text-gray-700">Wheelchair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white border-2 border-yellow-600 rounded flex items-center justify-center">
              <Crown className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-gray-700">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white border-2 border-black rounded flex items-center justify-center">
              <Users className="w-4 h-4 text-black" />
            </div>
            <span className="text-gray-700">Companion</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="text-center text-sm text-gray-600">
        <p>
          {getAvailableSeatCount()} seats available • {selectedSeats.length} of {requiredSeats}{" "}
          required seats selected
        </p>
      </div>
    </div>
  );
}
