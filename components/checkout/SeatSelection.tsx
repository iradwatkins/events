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
  rowId: string;
  rowLabel: string;
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
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);

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
    rowId: string,
    rowLabel: string,
    seatId: string,
    seatNumber: string
  ) => {
    const seatKey = `${sectionId}-${rowId}-${seatId}`;
    const isSelected = selectedSeats.some(
      (s) => `${s.sectionId}-${s.rowId}-${s.seatId}` === seatKey
    );

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => `${s.sectionId}-${s.rowId}-${s.seatId}` !== seatKey));
    } else {
      if (selectedSeats.length < requiredSeats) {
        setSelectedSeats([
          ...selectedSeats,
          { sectionId, sectionName, rowId, rowLabel, seatId, seatNumber },
        ]);
      }
    }
  };

  const isSeatSelected = (sectionId: string, rowId: string, seatId: string) => {
    const seatKey = `${sectionId}-${rowId}-${seatId}`;
    return selectedSeats.some((s) => `${s.sectionId}-${s.rowId}-${s.seatId}` === seatKey);
  };

  const getAvailableSeatCount = () => {
    return availableSections.reduce((total, section) => {
      return (
        total +
        section.rows.reduce((rowTotal, row) => {
          return rowTotal + row.seats.filter((s) => s.status === "AVAILABLE").length;
        }, 0)
      );
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Selection Progress */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-blue-900">
            Select {requiredSeats} {requiredSeats === 1 ? "seat" : "seats"}
          </span>
          <span className="text-sm text-blue-700">
            {selectedSeats.length} / {requiredSeats} selected
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                      {seat.sectionName} - Row {seat.rowLabel}, Seat {seat.seatNumber}
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
                  {section.rows.reduce(
                    (total, row) =>
                      total + row.seats.filter((s) => s.status === "AVAILABLE").length,
                    0
                  )}{" "}
                  available)
                </span>
              </div>

              <div className="space-y-2 overflow-x-auto pb-2">
                {section.rows.map((row) => (
                  <div key={row.id} className="flex items-center gap-2 min-w-max">
                    <span className="w-12 text-sm font-medium text-gray-600 text-right flex-shrink-0">
                      Row {row.label}
                    </span>
                    <div className="flex gap-1">
                      {row.seats.map((seat) => {
                        const isSelected = isSeatSelected(section.id, row.id, seat.id);
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
                                  row.id,
                                  row.label,
                                  seat.id,
                                  seat.number
                                );
                              }
                            }}
                            disabled={!isAvailable}
                            className={`w-10 h-10 rounded flex items-center justify-center text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-green-500 text-white ring-2 ring-green-600 scale-110"
                                : isReserved
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : isWheelchair
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                                : isVIP
                                ? "bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer"
                                : isCompanion
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer"
                                : "bg-blue-50 hover:bg-blue-100 cursor-pointer"
                            }`}
                            style={{
                              backgroundColor:
                                !isSelected && !isReserved && !isWheelchair && !isVIP && !isCompanion && isAvailable
                                  ? `${section.color}20`
                                  : undefined,
                              borderColor: section.color,
                              borderWidth: isAvailable && !isSelected ? "2px" : undefined,
                            }}
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
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 border-2 border-blue-500 rounded"></div>
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded"></div>
            <span className="text-gray-700">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <span className="text-gray-700">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <Accessibility className="w-4 h-4 text-blue-800" />
            </div>
            <span className="text-gray-700">Wheelchair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
              <Crown className="w-4 h-4 text-purple-800" />
            </div>
            <span className="text-gray-700">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
              <Users className="w-4 h-4 text-yellow-800" />
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
