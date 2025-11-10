"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";

type StaffRole = "SELLER" | "SCANNER";

// Recursive component for hierarchy tree visualization
function HierarchyNode({ staff, handleRemoveStaff, level = 0 }: {
  staff: any;
  handleRemoveStaff: (id: Id<"eventStaff">) => void;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubSellers = staff.subSellers && staff.subSellers.length > 0;

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-300 pl-4' : ''}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-2 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {hasSubSellers && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? '▼' : '▶'}
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
                <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg">
                  <PackageCheck className="w-4 h-4 text-blue-600" />
                  <div className="flex flex-col">
                    <span className="font-bold text-blue-900">{staff.allocatedTickets || 0}</span>
                    <span className="text-xs text-blue-600">allocated</span>
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
                <div className="flex items-center gap-2 text-sm bg-purple-50 px-3 py-2 rounded-lg">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <div className="flex flex-col">
                    <span className="font-bold text-purple-900">${(staff.commissionEarned / 100).toFixed(2)}</span>
                    <span className="text-xs text-purple-600">earned</span>
                  </div>
                </div>

                {/* Sub-sellers count if applicable */}
                {hasSubSellers && (
                  <div className="flex items-center gap-2 text-sm bg-indigo-50 px-3 py-2 rounded-lg">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <div className="flex flex-col">
                      <span className="font-bold text-indigo-900">{staff.subSellers.length}</span>
                      <span className="text-xs text-indigo-600">sub-sellers</span>
                    </div>
                  </div>
                )}
              </div>
              {staff.parentCommissionPercent !== undefined && staff.subSellerCommissionPercent !== undefined && (
                <div className="mt-2 text-xs text-gray-600">
                  Commission split: Parent {staff.parentCommissionPercent}% | Sub-seller {staff.subSellerCommissionPercent}%
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => handleRemoveStaff(staff._id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove staff member"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<StaffRole>("SELLER");
  const [viewMode, setViewMode] = useState<"list" | "hierarchy">("list");

  // Form state
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [commissionValue, setCommissionValue] = useState("");
  const [canScan, setCanScan] = useState(false);

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const eventStaff = useQuery(api.staff.queries.getEventStaff, { eventId });

  const addStaffMember = useMutation(api.staff.mutations.addStaffMember);
  const removeStaffMember = useMutation(api.staff.mutations.removeStaffMember);
  const updateStaffPermissions = useMutation(api.staff.mutations.updateStaffPermissions);
  const hierarchyTree = useQuery(api.staff.queries.getHierarchyTree, { eventId });

  const isLoading = !event || !currentUser || !eventStaff;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Check if user is the organizer
  if (event.organizerId !== currentUser._id) {
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

  const handleAddStaff = async () => {
    if (!staffEmail || !staffName) {
      alert("Please enter staff email and name");
      return;
    }

    const commissionAmount = commissionType === "PERCENTAGE"
      ? parseFloat(commissionValue)
      : parseFloat(commissionValue) * 100; // Convert dollars to cents

    try {
      await addStaffMember({
        eventId,
        email: staffEmail,
        name: staffName,
        phone: staffPhone || undefined,
        role: selectedRole,
        canScan: selectedRole === "SELLER" ? canScan : undefined,
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

  const handleToggleSubSellerPermission = async (staffId: Id<"eventStaff">, currentValue: boolean) => {
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

  const filteredStaff = eventStaff.filter((staff) =>
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
            <button
              onClick={() => setShowAddStaff(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Staff
            </button>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
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
                  <HierarchyNode key={staff._id} staff={staff} handleRemoveStaff={handleRemoveStaff} />
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
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
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
                              <DollarSign className="w-4 h-4" />
                              ${((staff.commissionValue || 0) / 100).toFixed(2)} per ticket
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
                              onChange={() => handleToggleSubSellerPermission(staff._id, staff.canAssignSubSellers || false)}
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

                  <button
                    onClick={() => handleRemoveStaff(staff._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove staff member"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
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
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["SELLER", "SCANNER"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role as StaffRole)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedRole === role
                          ? "border-primary bg-accent"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{role}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {role === "SELLER" && "Sells tickets"}
                        {role === "SCANNER" && "Scans at entry"}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Additional Permissions for Sellers */}
                {selectedRole === "SELLER" && (
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Commission Structure (only for SELLER role) */}
              {selectedRole === "SELLER" && (
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
                        {commissionType === "PERCENTAGE" ? "Percentage (%)" : "Amount per Ticket ($)"}
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
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
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
    </div>
  );
}
