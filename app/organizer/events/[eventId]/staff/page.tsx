"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Plus,
  Users,
  Search,
  MoreVertical,
  UserPlus,
  DollarSign,
  Percent,
  Mail,
  Phone,
  Trash2,
  Edit,
  Ticket,
  PackageCheck,
  TrendingDown,
  Copy,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";

type StaffRole = "STAFF" | "TEAM_MEMBERS" | "ASSOCIATES";

// Recursive component for hierarchy tree visualization
function HierarchyNode({
  staff,
  handleRemoveStaff,
  handleEditStaff,
  level = 0,
}: {
  staff: any;
  handleRemoveStaff: (id: Id<"eventStaff">) => void;
  handleEditStaff: (staff: any) => void;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubSellers = staff.subSellers && staff.subSellers.length > 0;

  return (
    <div className={`${level > 0 ? "ml-8 border-l-2 border-gray-300 pl-4" : ""}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-2 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {hasSubSellers && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            )}
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-gray-900">{staff.name}</h4>
                <span className="px-2 py-0.5 text-xs font-semibold bg-accent text-primary rounded-full">
                  {staff.role}
                </span>
                {staff.hierarchyLevel > 1 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-primary rounded-full">
                    Level {staff.hierarchyLevel}
                  </span>
                )}
                {staff.canAssignSubSellers && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                    Can Assign
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Mail className="w-3 h-3" />
                {staff.email}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {/* Allocated Tickets */}
                <div className="flex items-center gap-2 text-sm bg-accent px-3 py-2 rounded-lg">
                  <PackageCheck className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{staff.allocatedTickets || 0}</span>
                    <span className="text-xs text-primary">allocated</span>
                  </div>
                </div>

                {/* Tickets Sold */}
                <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-2 rounded-lg">
                  <Ticket className="w-4 h-4 text-green-600" />
                  <div className="flex flex-col">
                    <span className="font-bold text-green-900">{staff.ticketsSold || 0}</span>
                    <span className="text-xs text-green-600">sold</span>
                  </div>
                </div>

                {/* Tickets Remaining */}
                <div className="flex items-center gap-2 text-sm bg-orange-50 px-3 py-2 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <div className="flex flex-col">
                    <span className="font-bold text-orange-900">{staff.ticketsRemaining || 0}</span>
                    <span className="text-xs text-orange-600">remaining</span>
                  </div>
                </div>

                {/* Commission Earned */}
                <div className="flex items-center gap-2 text-sm bg-accent px-3 py-2 rounded-lg">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">
                      ${(staff.commissionEarned / 100).toFixed(2)}
                    </span>
                    <span className="text-xs text-primary">earned</span>
                  </div>
                </div>

                {/* Sub-sellers count if applicable */}
                {hasSubSellers && (
                  <div className="flex items-center gap-2 text-sm bg-accent px-3 py-2 rounded-lg">
                    <Users className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-bold text-indigo-900">{staff.subSellers.length}</span>
                      <span className="text-xs text-primary">sub-sellers</span>
                    </div>
                  </div>
                )}
              </div>
              {staff.parentCommissionPercent !== undefined &&
                staff.subSellerCommissionPercent !== undefined && (
                  <div className="mt-2 text-xs text-gray-600">
                    Commission split: Parent {staff.parentCommissionPercent}% | Sub-seller{" "}
                    {staff.subSellerCommissionPercent}%
                  </div>
                )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEditStaff(staff)}
              className="p-2 text-gray-400 hover:text-primary hover:bg-accent rounded-lg transition-colors"
              title="Edit staff member"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRemoveStaff(staff._id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove staff member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Render sub-sellers recursively */}
      {isExpanded && hasSubSellers && (
        <div className="mt-2">
          {staff.subSellers.map((subSeller: any) => (
            <HierarchyNode
              key={subSeller._id}
              staff={subSeller}
              handleRemoveStaff={handleRemoveStaff}
              handleEditStaff={handleEditStaff}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StaffManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [showCopyRoster, setShowCopyRoster] = useState(false);
  const [selectedSourceEvent, setSelectedSourceEvent] = useState<string>("");
  const [copyAllocations, setCopyAllocations] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState<"allocations" | "commission" | "deactivate" | null>(
    null
  );
  const [bulkAllocationValue, setBulkAllocationValue] = useState("");
  const [bulkCommissionType, setBulkCommissionType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE"
  );
  const [bulkCommissionValue, setBulkCommissionValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<StaffRole>("TEAM_MEMBERS");
  const [viewMode, setViewMode] = useState<"list" | "hierarchy">("list");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  // Form state
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [commissionValue, setCommissionValue] = useState("");
  const [canScan, setCanScan] = useState(false);

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const eventStaff = useQuery(api.staff.queries.getEventStaff, { eventId });
  const organizerEvents = useQuery(api.staff.queries.getOrganizerEventsForCopy);

  const addStaffMember = useMutation(api.staff.mutations.addStaffMember);
  const removeStaffMember = useMutation(api.staff.mutations.removeStaffMember);
  const updateStaffMember = useMutation(api.staff.mutations.updateStaffMember);
  const updateStaffPermissions = useMutation(api.staff.mutations.updateStaffPermissions);
  const copyRosterFromEvent = useMutation(api.staff.mutations.copyRosterFromEvent);
  const hierarchyTree = useQuery(api.staff.queries.getHierarchyTree, { eventId });

  // Redirect if event not found
  useEffect(() => {
    if (event === null) {
      router.push("/organizer/events");
    }
  }, [event, router]);

  const isLoading = event === undefined || currentUser === null || eventStaff === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Event not found
  if (event === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-gray-600 mb-4">Event not found or has been deleted.</p>
          <Link href="/organizer/events" className="text-primary hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  // Debug logging

  // Check if user is the organizer (removed for now to allow access)
  // TEMPORARY: Commenting out permission check to debug
  /*
  if (event.organizerId !== currentUser._id && currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }
  */

  const handleAddStaff = async () => {
    if (!staffEmail || !staffName) {
      alert("Please enter staff email and name");
      return;
    }

    const commissionAmount =
      commissionType === "PERCENTAGE"
        ? parseFloat(commissionValue)
        : parseFloat(commissionValue) * 100; // Convert dollars to cents

    try {
      await addStaffMember({
        eventId,
        email: staffEmail,
        name: staffName,
        phone: staffPhone || undefined,
        role: selectedRole,
        canScan: selectedRole === "TEAM_MEMBERS" ? canScan : undefined,
        commissionType,
        commissionValue: commissionAmount,
      });

      // Reset form
      setStaffEmail("");
      setStaffName("");
      setStaffPhone("");
      setCommissionValue("");
      setCanScan(false);
      setShowAddStaff(false);
      alert("Staff member added successfully!");
    } catch (error: any) {
      console.error("Add staff error:", error);
      alert(error.message || "Failed to add staff member");
    }
  };

  const handleRemoveStaff = async (staffId: Id<"eventStaff">) => {
    if (!confirm("Are you sure you want to remove this staff member?")) {
      return;
    }

    try {
      await removeStaffMember({ staffId });
      alert("Staff member removed successfully!");
    } catch (error: any) {
      console.error("Remove staff error:", error);
      alert(error.message || "Failed to remove staff member");
    }
  };

  const handleEditStaff = (staff: any) => {
    setEditingStaff(staff);
    setStaffName(staff.name);
    setStaffPhone(staff.phone || "");
    setCanScan(staff.canScan || false);
    setCommissionType(staff.commissionType || "PERCENTAGE");
    setCommissionValue(
      staff.commissionType === "FIXED"
        ? (staff.commissionValue / 100).toString()
        : staff.commissionValue?.toString() || ""
    );
    setShowEditStaff(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff || !staffName) {
      alert("Please enter staff name");
      return;
    }

    const commissionAmount =
      commissionType === "PERCENTAGE"
        ? parseFloat(commissionValue)
        : parseFloat(commissionValue) * 100; // Convert dollars to cents

    try {
      await updateStaffMember({
        staffId: editingStaff._id,
        name: staffName,
        phone: staffPhone || undefined,
        canScan,
        commissionType,
        commissionValue: commissionAmount,
      });

      // Reset form
      setEditingStaff(null);
      setStaffName("");
      setStaffPhone("");
      setCommissionValue("");
      setCanScan(false);
      setShowEditStaff(false);
      alert("Staff member updated successfully!");
    } catch (error: any) {
      console.error("Update staff error:", error);
      alert(error.message || "Failed to update staff member");
    }
  };

  const handleToggleSubSellerPermission = async (
    staffId: Id<"eventStaff">,
    currentValue: boolean
  ) => {
    try {
      await updateStaffPermissions({
        staffId,
        canAssignSubSellers: !currentValue,
      });
    } catch (error: any) {
      console.error("Update permissions error:", error);
      alert(error.message || "Failed to update permissions");
    }
  };

  const handleCopyRoster = async () => {
    if (!selectedSourceEvent) {
      alert("Please select an event to copy from");
      return;
    }

    if (selectedSourceEvent === eventId) {
      alert("Cannot copy roster from the same event");
      return;
    }

    try {
      const result = await copyRosterFromEvent({
        sourceEventId: selectedSourceEvent as Id<"events">,
        targetEventId: eventId,
        copyAllocations,
      });

      alert(result.message || "Staff roster copied successfully!");
      setShowCopyRoster(false);
      setSelectedSourceEvent("");
      setCopyAllocations(false);
    } catch (error: any) {
      console.error("Copy roster error:", error);
      alert(error.message || "Failed to copy roster");
    }
  };

  const handleSelectAll = () => {
    if (selectedStaff.size === filteredStaff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(filteredStaff.map((s) => s._id)));
    }
  };

  const handleSelectStaff = (staffId: string) => {
    const newSelected = new Set(selectedStaff);
    if (newSelected.has(staffId)) {
      newSelected.delete(staffId);
    } else {
      newSelected.add(staffId);
    }
    setSelectedStaff(newSelected);
  };

  const handleBulkAllocations = async () => {
    if (!bulkAllocationValue || selectedStaff.size === 0) {
      alert("Please enter allocation value and select staff members");
      return;
    }

    try {
      const allocation = parseInt(bulkAllocationValue);
      const promises = Array.from(selectedStaff).map((staffId) =>
        updateStaffMember({
          staffId: staffId as Id<"eventStaff">,
          allocatedTickets: allocation,
        })
      );

      await Promise.all(promises);
      alert(`Updated allocations for ${selectedStaff.size} staff members`);
      setShowBulkActions(false);
      setBulkAction(null);
      setBulkAllocationValue("");
      setSelectedStaff(new Set());
    } catch (error: any) {
      console.error("Bulk allocation error:", error);
      alert(error.message || "Failed to update allocations");
    }
  };

  const handleBulkCommission = async () => {
    if (!bulkCommissionValue || selectedStaff.size === 0) {
      alert("Please enter commission value and select staff members");
      return;
    }

    try {
      const commissionAmount =
        bulkCommissionType === "PERCENTAGE"
          ? parseFloat(bulkCommissionValue)
          : parseFloat(bulkCommissionValue) * 100;

      const promises = Array.from(selectedStaff).map((staffId) =>
        updateStaffMember({
          staffId: staffId as Id<"eventStaff">,
          commissionType: bulkCommissionType,
          commissionValue: commissionAmount,
        })
      );

      await Promise.all(promises);
      alert(`Updated commission for ${selectedStaff.size} staff members`);
      setShowBulkActions(false);
      setBulkAction(null);
      setBulkCommissionValue("");
      setSelectedStaff(new Set());
    } catch (error: any) {
      console.error("Bulk commission error:", error);
      alert(error.message || "Failed to update commission");
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedStaff.size === 0) {
      alert("Please select staff members to deactivate");
      return;
    }

    if (!confirm(`Are you sure you want to deactivate ${selectedStaff.size} staff member(s)?`)) {
      return;
    }

    try {
      const promises = Array.from(selectedStaff).map((staffId) =>
        removeStaffMember({ staffId: staffId as Id<"eventStaff"> })
      );

      await Promise.all(promises);
      alert(`Deactivated ${selectedStaff.size} staff members`);
      setShowBulkActions(false);
      setBulkAction(null);
      setSelectedStaff(new Set());
    } catch (error: any) {
      console.error("Bulk deactivate error:", error);
      alert(error.message || "Failed to deactivate staff");
    }
  };

  const filteredStaff = eventStaff.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href={`/organizer/events`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-gray-600 mt-1">{event.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCopyRoster(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-primary border-2 border-primary rounded-lg hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg"
              >
                <Copy className="w-5 h-5" />
                Copy Roster
              </button>
              <button
                onClick={() => setShowAddStaff(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Staff
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* View Mode Switcher */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === "list"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("hierarchy")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === "hierarchy"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Hierarchy Tree
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {viewMode === "list" && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              {filteredStaff.length > 0 && (
                <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={
                      selectedStaff.size === filteredStaff.length && filteredStaff.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Select All
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {viewMode === "list" && selectedStaff.size > 0 && (
          <div className="bg-primary/10 border border-primary rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-primary" />
                <span className="font-semibold text-gray-900">
                  {selectedStaff.size} staff member{selectedStaff.size !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setSelectedStaff(new Set())}
                  className="text-sm text-primary hover:underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBulkAction("allocations");
                    setShowBulkActions(true);
                  }}
                  className="px-4 py-2 bg-white text-primary border border-primary rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Set Allocations
                </button>
                <button
                  onClick={() => {
                    setBulkAction("commission");
                    setShowBulkActions(true);
                  }}
                  className="px-4 py-2 bg-white text-primary border border-primary rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Set Commission
                </button>
                <button
                  onClick={() => {
                    setBulkAction("deactivate");
                    setShowBulkActions(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Staff List or Hierarchy Tree */}
        {viewMode === "hierarchy" ? (
          // Hierarchy Tree View
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Staff Hierarchy Tree</h3>
            {hierarchyTree && hierarchyTree.length > 0 ? (
              <div className="space-y-4">
                {hierarchyTree.map((staff) => (
                  <HierarchyNode
                    key={staff._id}
                    staff={staff}
                    handleRemoveStaff={handleRemoveStaff}
                    handleEditStaff={handleEditStaff}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No staff members yet. Add your first staff member to get started.
              </div>
            )}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No staff members yet</h3>
            <p className="text-gray-600 mb-6">
              Add staff members to help sell tickets for this event
            </p>
            <button
              onClick={() => setShowAddStaff(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Staff Member
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStaff.map((staff) => (
              <div
                key={staff._id}
                className={`bg-white rounded-lg shadow-md border-2 p-6 hover:shadow-lg transition-all ${
                  selectedStaff.has(staff._id) ? "border-primary bg-blue-50/30" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Checkbox for bulk selection */}
                    <input
                      type="checkbox"
                      checked={selectedStaff.has(staff._id)}
                      onChange={() => handleSelectStaff(staff._id)}
                      className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                    />
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{staff.name}</h3>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {staff.email}
                        </div>
                        {staff.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {staff.phone}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="px-3 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                          {staff.role}
                        </span>
                        {staff.hierarchyLevel && staff.hierarchyLevel > 1 && (
                          <span className="px-3 py-1 text-xs font-semibold bg-primary text-primary rounded-full">
                            Level {staff.hierarchyLevel}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          {staff.commissionType === "PERCENTAGE" ? (
                            <>
                              <Percent className="w-4 h-4" />
                              {staff.commissionValue}% commission
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4" />$
                              {((staff.commissionValue || 0) / 100).toFixed(2)} per ticket
                            </>
                          )}
                        </div>
                      </div>

                      {/* Hierarchy Permissions */}
                      {staff.hierarchyLevel === 1 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={staff.canAssignSubSellers || false}
                              onChange={() =>
                                handleToggleSubSellerPermission(
                                  staff._id,
                                  staff.canAssignSubSellers || false
                                )
                              }
                              className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-ring"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">
                                Can assign sub-sellers
                              </span>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Allow this staff member to recruit and manage their own sales team
                              </p>
                            </div>
                          </label>
                        </div>
                      )}

                      <div className="mt-3 text-sm text-gray-500">
                        Added {new Date(staff.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStaff(staff)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-accent rounded-lg transition-colors"
                      title="Edit staff member"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveStaff(staff._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove staff member"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Add Staff Member</h2>
              <p className="text-gray-600 mt-1">
                Add a team member to help sell tickets for this event
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "STAFF", label: "Door Staff", desc: "Scans tickets at entry" },
                    {
                      value: "TEAM_MEMBERS",
                      label: "Team Member",
                      desc: "Sells tickets with commission",
                    },
                    {
                      value: "ASSOCIATES",
                      label: "Associate",
                      desc: "Sub-seller under team member",
                    },
                  ].map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value as StaffRole)}
                      className={`p-3 border-2 rounded-lg transition-all text-left ${
                        selectedRole === role.value
                          ? "border-primary bg-accent"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">{role.label}</p>
                      <p className="text-xs text-gray-600 mt-1">{role.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Additional Permissions for Team Members */}
                {selectedRole === "TEAM_MEMBERS" && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={canScan}
                        onChange={(e) => setCanScan(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-ring"
                      />
                      <span className="text-sm text-gray-700">
                        Also allow this seller to scan tickets at entry
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Staff Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Commission Structure (only for TEAM_MEMBERS and ASSOCIATES roles) */}
              {(selectedRole === "TEAM_MEMBERS" || selectedRole === "ASSOCIATES") && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Commission Structure</h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setCommissionType("PERCENTAGE")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          commissionType === "PERCENTAGE"
                            ? "border-primary bg-accent"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Percent className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                        <p className="font-semibold text-gray-900">Percentage</p>
                        <p className="text-xs text-gray-600 mt-1">% of ticket price</p>
                      </button>

                      <button
                        onClick={() => setCommissionType("FIXED")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          commissionType === "FIXED"
                            ? "border-primary bg-accent"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <DollarSign className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                        <p className="font-semibold text-gray-900">Fixed</p>
                        <p className="text-xs text-gray-600 mt-1">$ per ticket</p>
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {commissionType === "PERCENTAGE"
                          ? "Percentage (%)"
                          : "Amount per Ticket ($)"}
                      </label>
                      <div className="relative">
                        {commissionType === "FIXED" && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            $
                          </span>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          value={commissionValue}
                          onChange={(e) => setCommissionValue(e.target.value)}
                          placeholder={commissionType === "PERCENTAGE" ? "10" : "5.00"}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                            commissionType === "FIXED" ? "pl-8" : ""
                          }`}
                        />
                        {commissionType === "PERCENTAGE" && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            %
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddStaff(false)}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditStaff && editingStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Edit Staff Member</h2>
              <p className="text-gray-600 mt-1">Update {editingStaff.name}'s information</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Role Display (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="font-semibold text-gray-900">{editingStaff.role}</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Role cannot be changed after creation
                  </p>
                </div>
              </div>

              {/* Staff Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-900">{editingStaff.email}</span>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Scanning Permission for Team Members */}
              {editingStaff.role === "TEAM_MEMBERS" && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canScan}
                      onChange={(e) => setCanScan(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-ring"
                    />
                    <span className="text-sm text-gray-700">
                      Also allow this seller to scan tickets at entry
                    </span>
                  </label>
                </div>
              )}

              {/* Commission Structure (only for TEAM_MEMBERS and ASSOCIATES roles) */}
              {(editingStaff.role === "TEAM_MEMBERS" || editingStaff.role === "ASSOCIATES") && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Commission Structure</h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setCommissionType("PERCENTAGE")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          commissionType === "PERCENTAGE"
                            ? "border-primary bg-accent"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Percent className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                        <p className="font-semibold text-gray-900">Percentage</p>
                        <p className="text-xs text-gray-600 mt-1">% of ticket price</p>
                      </button>

                      <button
                        onClick={() => setCommissionType("FIXED")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          commissionType === "FIXED"
                            ? "border-primary bg-accent"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <DollarSign className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                        <p className="font-semibold text-gray-900">Fixed</p>
                        <p className="text-xs text-gray-600 mt-1">$ per ticket</p>
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {commissionType === "PERCENTAGE"
                          ? "Percentage (%)"
                          : "Amount per Ticket ($)"}
                      </label>
                      <div className="relative">
                        {commissionType === "FIXED" && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            $
                          </span>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          value={commissionValue}
                          onChange={(e) => setCommissionValue(e.target.value)}
                          placeholder={commissionType === "PERCENTAGE" ? "10" : "5.00"}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                            commissionType === "FIXED" ? "pl-8" : ""
                          }`}
                        />
                        {commissionType === "PERCENTAGE" && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            %
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditStaff(false);
                  setEditingStaff(null);
                  setStaffName("");
                  setStaffPhone("");
                  setCommissionValue("");
                  setCanScan(false);
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStaff}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Roster Modal */}
      {showCopyRoster && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Copy Staff Roster</h2>
              <p className="text-gray-600 mt-1">
                Copy staff members from another event to this event
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Event Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event to Copy From *
                </label>
                <select
                  value={selectedSourceEvent}
                  onChange={(e) => setSelectedSourceEvent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">-- Select an event --</option>
                  {organizerEvents
                    ?.filter((e) => e._id !== eventId)
                    .map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name}{" "}
                        {e.startDate ? `(${new Date(e.startDate).toLocaleDateString()})` : ""}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only events you organize are shown</p>
              </div>

              {/* Preview */}
              {selectedSourceEvent && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">What will be copied?</h3>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        <li>• All active staff members from the selected event</li>
                        <li>• Staff roles and commission settings</li>
                        <li>• Parent-child relationships (team members and their associates)</li>
                        <li>• Permissions (scanning, sub-seller assignment)</li>
                      </ul>
                      <p className="text-sm text-gray-700 mt-3 font-medium">
                        Note: Sales history and commission earned will NOT be copied (starts fresh
                        for this event)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Copy Allocations Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  id="copyAllocations"
                  checked={copyAllocations}
                  onChange={(e) => setCopyAllocations(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="copyAllocations" className="flex-1 cursor-pointer">
                  <div className="font-medium text-gray-900">Copy ticket allocations</div>
                  <div className="text-sm text-gray-600 mt-1">
                    If checked, staff members will receive the same ticket allocations as the source
                    event. If unchecked, allocations will start at 0 and you can set them manually.
                  </div>
                </label>
              </div>

              {/* Warnings */}
              {eventStaff.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-yellow-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800">
                        Warning: This event already has staff
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This event has {eventStaff.length} existing staff member
                        {eventStaff.length !== 1 ? "s" : ""}. Copying will add new staff members
                        from the selected event. No existing staff will be removed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={() => {
                  setShowCopyRoster(false);
                  setSelectedSourceEvent("");
                  setCopyAllocations(false);
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyRoster}
                disabled={!selectedSourceEvent}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copy Staff Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkActions && bulkAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {bulkAction === "allocations" && "Set Ticket Allocations"}
                {bulkAction === "commission" && "Set Commission"}
                {bulkAction === "deactivate" && "Deactivate Staff Members"}
              </h2>
              <p className="text-gray-600 mt-1">
                {bulkAction === "deactivate"
                  ? `Deactivate ${selectedStaff.size} selected staff member(s)`
                  : `Update ${selectedStaff.size} selected staff member(s)`}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {bulkAction === "allocations" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Allocation *
                  </label>
                  <input
                    type="number"
                    value={bulkAllocationValue}
                    onChange={(e) => setBulkAllocationValue(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter number of tickets"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will set the ticket allocation for all selected staff members
                  </p>
                </div>
              )}

              {bulkAction === "commission" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Type *
                    </label>
                    <select
                      value={bulkCommissionType}
                      onChange={(e) =>
                        setBulkCommissionType(e.target.value as "PERCENTAGE" | "FIXED")
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Value *
                    </label>
                    <input
                      type="number"
                      value={bulkCommissionValue}
                      onChange={(e) => setBulkCommissionValue(e.target.value)}
                      min="0"
                      step={bulkCommissionType === "PERCENTAGE" ? "0.1" : "0.01"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder={
                        bulkCommissionType === "PERCENTAGE"
                          ? "Enter percentage (e.g., 10)"
                          : "Enter dollar amount (e.g., 5.00)"
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {bulkCommissionType === "PERCENTAGE"
                        ? "Percentage of ticket price"
                        : "Fixed dollar amount per ticket sold"}
                    </p>
                  </div>
                </div>
              )}

              {bulkAction === "deactivate" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-red-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800">
                        Warning: This action cannot be undone
                      </h4>
                      <p className="text-sm text-red-700 mt-1">Deactivating staff members will:</p>
                      <ul className="text-sm text-red-700 mt-2 space-y-1 ml-4">
                        <li>• Remove them from this event</li>
                        <li>• Prevent them from selling tickets</li>
                        <li>• Keep their sales history intact</li>
                      </ul>
                      <p className="text-sm text-red-700 mt-2 font-medium">
                        You can add them back later if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={() => {
                  setShowBulkActions(false);
                  setBulkAction(null);
                  setBulkAllocationValue("");
                  setBulkCommissionValue("");
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bulkAction === "allocations") handleBulkAllocations();
                  else if (bulkAction === "commission") handleBulkCommission();
                  else if (bulkAction === "deactivate") handleBulkDeactivate();
                }}
                className={`px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2 ${
                  bulkAction === "deactivate"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {bulkAction === "allocations" && "Update Allocations"}
                {bulkAction === "commission" && "Update Commission"}
                {bulkAction === "deactivate" && "Deactivate Staff"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
