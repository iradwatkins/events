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
} from "lucide-react";
import Link from "next/link";

type StaffRole = "SELLER" | "SCANNER" | "ASSISTANT";

export default function StaffManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<StaffRole>("SELLER");

  // Form state
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [commissionValue, setCommissionValue] = useState("");

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const eventStaff = useQuery(api.staff.queries.getEventStaff, { eventId });

  const addStaffMember = useMutation(api.staff.mutations.addStaffMember);
  const removeStaffMember = useMutation(api.staff.mutations.removeStaffMember);

  const isLoading = !event || !currentUser || !eventStaff;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Check if user is the organizer
  if (event.organizerId !== currentUser._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
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
        commissionType,
        commissionValue: commissionAmount,
      });

      // Reset form
      setStaffEmail("");
      setStaffName("");
      setStaffPhone("");
      setCommissionValue("");
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
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Staff
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
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

        {/* Staff List */}
        {filteredStaff.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No staff members yet</h3>
            <p className="text-gray-600 mb-6">
              Add staff members to help sell tickets for this event
            </p>
            <button
              onClick={() => setShowAddStaff(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-blue-600" />
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

                      <div className="flex items-center gap-3 mt-3">
                        <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                          {staff.role}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          {staff.commissionType === "PERCENTAGE" ? (
                            <>
                              <Percent className="w-4 h-4" />
                              {staff.commissionValue}% commission
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4" />
                              ${(staff.commissionValue / 100).toFixed(2)} per ticket
                            </>
                          )}
                        </div>
                      </div>

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
                <div className="grid grid-cols-3 gap-3">
                  {["SELLER", "SCANNER", "ASSISTANT"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role as StaffRole)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedRole === role
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{role}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {role === "SELLER" && "Sells tickets"}
                        {role === "SCANNER" && "Scans tickets"}
                        {role === "ASSISTANT" && "General help"}
                      </p>
                    </button>
                  ))}
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
                            ? "border-blue-600 bg-blue-50"
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
                            ? "border-blue-600 bg-blue-50"
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
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
