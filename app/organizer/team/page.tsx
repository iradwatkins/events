"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users,
  Plus,
  Mail,
  Phone,
  DollarSign,
  Percent,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

type StaffRole = "TEAM_MEMBERS" | "STAFF";

export default function DefaultTeamPage() {
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "TEAM_MEMBERS" as StaffRole,
    commissionType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    commissionValue: "",
    autoAssignToNewEvents: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const globalStaffWithPerformance = useQuery(api.staff.queries.getGlobalStaffWithPerformance);
  const addGlobalStaff = useMutation(api.staff.mutations.addGlobalStaff);
  const toggleAutoAssign = useMutation(api.staff.mutations.toggleStaffAutoAssign);
  const removeStaff = useMutation(api.staff.mutations.removeStaffMember);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email) {
      setError("Please enter staff name and email");
      return;
    }

    const commissionAmount =
      formData.commissionType === "PERCENTAGE"
        ? parseFloat(formData.commissionValue)
        : parseFloat(formData.commissionValue) * 100; // Convert dollars to cents

    try {
      await addGlobalStaff({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        canScan: formData.role === "STAFF",
        commissionType: formData.commissionType,
        commissionValue: commissionAmount,
        autoAssignToNewEvents: formData.autoAssignToNewEvents,
      });

      setSuccess("Default staff member added successfully!");
      setShowAddStaff(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "TEAM_MEMBERS",
        commissionType: "PERCENTAGE",
        commissionValue: "",
        autoAssignToNewEvents: true,
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add staff member");
    }
  };

  const handleToggleAutoAssign = async (staffId: Id<"eventStaff">, currentValue: boolean) => {
    try {
      await toggleAutoAssign({
        staffId,
        autoAssignToNewEvents: !currentValue,
      });
    } catch (err: any) {
      alert(err.message || "Failed to toggle auto-assign");
    }
  };

  const handleRemoveStaff = async (staffId: Id<"eventStaff">) => {
    try {
      await removeStaff({ staffId });
    } catch (err: any) {
      alert(err.message || "Failed to remove staff member");
    }
  };

  if (!globalStaffWithPerformance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const globalStaff = globalStaffWithPerformance;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-8 h-8" />
          Default Team
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your default staff roster. These team members will be automatically assigned to all
          new events you create.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 bg-accent border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-accent-foreground">
            <p className="font-semibold mb-1">How Default Team Works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Staff members added here are your "default roster"</li>
              <li>
                When you create a new event, they'll be automatically added with their commission
                rates
              </li>
              <li>You can still customize allocations and settings per event after creation</li>
              <li>Toggle auto-assign on/off for each staff member individually</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Staff Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddStaff(true)}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Default Staff Member
        </button>
      </div>

      {/* Staff List */}
      {globalStaff.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Default Team Members Yet</h3>
          <p className="text-gray-600 mb-6">
            Add staff members to your default team to speed up event creation.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Events
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Earned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auto-Assign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {globalStaff.map((staff) => (
                  <tr key={staff._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{staff.name}</div>
                      <div className="text-xs text-gray-500">Referral: {staff.referralCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {staff.email}
                        </div>
                        {staff.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {staff.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        {staff.commissionType === "PERCENTAGE" ? (
                          <>
                            <Percent className="w-4 h-4" />
                            {staff.commissionValue}%
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4" />$
                            {((staff.commissionValue || 0) / 100).toFixed(2)}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {staff.performance?.activeEventCount || 0} active
                        </div>
                        <div className="text-xs text-gray-500">
                          {staff.performance?.totalEventCount || 0} total
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {staff.performance?.totalTicketsSold || 0} tickets
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg: {staff.performance?.avgTicketsPerEvent || 0}/event
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        ${((staff.performance?.totalCommissionEarned || 0) / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Net: ${((staff.performance?.netPayout || 0) / 100).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleToggleAutoAssign(staff._id, staff.autoAssignToNewEvents || false)
                        }
                        className="flex items-center gap-2"
                      >
                        {staff.autoAssignToNewEvents ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Enabled</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <XCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Disabled</span>
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRemoveStaff(staff._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove staff member"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Add Default Staff Member</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as StaffRole })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="TEAM_MEMBERS">Team Member (Seller)</option>
                    <option value="STAFF">Door Staff (Scanner)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Team Members sell tickets with commission. Door Staff scan tickets at entry.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Type
                  </label>
                  <select
                    value={formData.commissionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commissionType: e.target.value as "PERCENTAGE" | "FIXED",
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Value
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.commissionValue}
                      onChange={(e) =>
                        setFormData({ ...formData, commissionValue: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder={formData.commissionType === "PERCENTAGE" ? "10" : "5.00"}
                    />
                    {formData.commissionType === "PERCENTAGE" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        %
                      </span>
                    )}
                    {formData.commissionType === "FIXED" && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-accent border border-border rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoAssignToNewEvents}
                      onChange={(e) =>
                        setFormData({ ...formData, autoAssignToNewEvents: e.target.checked })
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-ring"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Auto-assign to new events
                      </span>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Automatically add this staff member when you create new events
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-semibold"
                >
                  Add to Default Team
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaff(false);
                    setError("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
