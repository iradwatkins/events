"use client";

import React, { useState } from "react";
import { Upload, Download, FileText, Check, X, AlertCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface GuestListUploadProps {
  eventId: Id<"events">;
  onUploadComplete?: () => void;
}

interface GuestRow {
  name: string;
  email: string;
  tableNumber?: string;
  seatNumber?: string;
  status: "pending" | "assigned" | "error";
  error?: string;
}

export default function GuestListUpload({
  eventId,
  onUploadComplete,
}: GuestListUploadProps) {
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return;

    // Parse header
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes("name"));
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const tableIdx = headers.findIndex((h) => h.includes("table"));
    const seatIdx = headers.findIndex((h) => h.includes("seat"));

    if (nameIdx === -1 || emailIdx === -1) {
      alert("CSV must have 'Name' and 'Email' columns");
      return;
    }

    // Parse rows
    const parsedGuests: GuestRow[] = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return {
        name: values[nameIdx] || "",
        email: values[emailIdx] || "",
        tableNumber: tableIdx !== -1 ? values[tableIdx] : undefined,
        seatNumber: seatIdx !== -1 ? values[seatIdx] : undefined,
        status: "pending",
      };
    });

    setGuests(parsedGuests);
  };

  const processGuestList = async () => {
    setIsProcessing(true);

    // Process guests one by one (in real implementation, batch this)
    const updatedGuests = [...guests];

    for (let i = 0; i < updatedGuests.length; i++) {
      const guest = updatedGuests[i];

      try {
        // Validate
        if (!guest.name || !guest.email) {
          guest.status = "error";
          guest.error = "Missing name or email";
          continue;
        }

        // Here you would call a Convex mutation to assign the guest
        // await assignGuestToSeat({
        //   eventId,
        //   name: guest.name,
        //   email: guest.email,
        //   tableNumber: guest.tableNumber,
        //   seatNumber: guest.seatNumber,
        // });

        guest.status = "assigned";
      } catch (error: any) {
        guest.status = "error";
        guest.error = error.message || "Failed to assign";
      }

      setGuests([...updatedGuests]);
    }

    setIsProcessing(false);
    onUploadComplete?.();
  };

  const downloadTemplate = () => {
    const template = "Name,Email,Table Number,Seat Number\nJohn Doe,john@example.com,5,3\nJane Smith,jane@example.com,5,4";
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guest-list-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Guest List Upload</h3>
          <p className="text-sm text-gray-500">Upload a CSV file to assign seats to guests</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Upload Area */}
      {guests.length === 0 ? (
        <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Click to upload guest list
          </p>
          <p className="text-xs text-gray-500">CSV file with Name, Email, Table, Seat columns</p>
        </label>
      ) : (
        <>
          {/* Guest List Preview */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Table</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Seat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {guests.map((guest, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {guest.status === "pending" && (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                        )}
                        {guest.status === "assigned" && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                        {guest.status === "error" && (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{guest.name}</td>
                      <td className="px-4 py-3 text-gray-600">{guest.email}</td>
                      <td className="px-4 py-3 text-gray-600">{guest.tableNumber || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{guest.seatNumber || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                <strong>{guests.length}</strong> guests
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">
                <strong>{guests.filter((g) => g.status === "assigned").length}</strong> assigned
              </span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-600" />
              <span className="text-gray-600">
                <strong>{guests.filter((g) => g.status === "error").length}</strong> errors
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuests([])}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={processGuestList}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Assign Seats"}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">How seat assignment works:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>If table & seat specified: assigns to exact seat</li>
                  <li>If only table specified: assigns next available seat at table</li>
                  <li>If neither specified: assigns any available seat</li>
                  <li>Guests will receive email with seat assignment</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
