"use client";

import { useState, useEffect, useRef } from "react";
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
import { type TableShape } from "@/components/seating/TableShapePalette";
import ToolPalette, { type ToolType } from "@/components/seating/ToolPalette";
import PropertiesPanel from "@/components/seating/PropertiesPanel";

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

  // Seating chart feature is currently disabled
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <Grid className="w-16 h-16 text-gray-400 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Seating Chart Builder Coming Soon</h1>
        <p className="text-gray-600 mb-6">
          The visual seating chart builder is currently being enhanced and will be available soon.
        </p>
        <Link
          href={`/organizer/events/${eventId}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event Dashboard
        </Link>
      </div>
    </div>
  );
}
