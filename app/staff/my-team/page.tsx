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
  Percent,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type StaffRole = "SELLER" | "SCANNER";

export default function MyTeamPage() {
  const [showAddSubSeller, setShowAddSubSeller] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "SELLER" as StaffRole,
    parentCommissionPercent: "",
    subSellerCommissionPercent: "",
    autoAssignToNewEvents: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const myGlobalSubSellers = useQuery(api.staff.queries.getMyGlobalSubSellers);
  const addGlobalSubSeller = useMutation(api.staff.mutations.addGlobalSubSeller);
  const toggleAutoAssign = useMutation(api.staff.mutations.toggleStaffAutoAssign);
  const removeStaff = useMutation(api.staff.mutations.removeStaffMember);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email) {
      setError("Please enter name and email");
      return;
    }

    const parentPercent = parseFloat(formData.parentCommissionPercent);
    const subSellerPercent = parseFloat(formData.subSellerCommissionPercent);

    if (isNaN(parentPercent) || isNaN(subSellerPercent)) {
      setError("Please enter valid commission percentages");
      return;
    }

    if (parentPercent + subSellerPercent > 100) {
      setError("Total commission cannot exceed 100%");
      return;
    }

    try {
      await addGlobalSubSeller({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        canScan: formData.role === "SCANNER",
        parentCommissionPercent: parentPercent,
        subSellerCommissionPercent: subSellerPercent,
        autoAssignToNewEvents: formData.autoAssignToNewEvents,
      });

      setSuccess("Sub-seller added to your default team!");
      setShowAddSubSeller(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "SELLER",
        parentCommissionPercent: "",
        subSellerCommissionPercent: "",
        autoAssignToNewEvents: true,
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add sub-seller");
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

  const handleRemoveSubSeller = async (staffId: Id<"eventStaff">) => {
    try {
      await removeStaff({ staffId });
    } catch (err: any) {
      alert(err.message || "Failed to remove sub-seller");
    }
  };

  if (myGlobalSubSellers === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/staff/dashboard"
          className="inline-flex items-center gap-2 text-primary hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-8 h-8" />
          My Default Team
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your default sub-seller roster. These team members will be automatically assigned
          to events when you join them.
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
            <p className="font-semibold mb-1">How Your Default Team Works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sub-sellers added here are your default roster</li>
              <li>When you join a new event, they'll be automatically added under you</li>
              <li>You can still customize their settings per event after creation</li>
              <li>Toggle auto-assign on/off for each sub-seller individually</li>
              <li>Commission splits are configured here and applied to all new events</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Sub-Seller Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddSubSeller(true)}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Default Sub-Seller
        </button>
      </div>

      {/* Sub-Sellers List */}
      {myGlobalSubSellers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Default Sub-Sellers Yet</h3>
          <p className="text-gray-600 mb-6">
            Add sub-sellers to your default team to have them automatically assigned when you join
            events.
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
                    Commission Split
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
                {myGlobalSubSellers.map((subSeller) => (
                  <tr key={subSeller._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{subSeller.name}</div>
                      <div className="text-xs text-gray-500">
                        Referral: {subSeller.referralCode}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {subSeller.email}
                        </div>
                        {subSeller.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {subSeller.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                        {subSeller.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Percent className="w-4 h-4 text-green-600" />
                          <span className="font-medium">
                            You: {subSeller.parentCommissionPercent}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Percent className="w-4 h-4 text-primary" />
                          <span>Them: {subSeller.subSellerCommissionPercent}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleToggleAutoAssign(
                            subSeller._id,
                            subSeller.autoAssignToNewEvents || false
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        {subSeller.autoAssignToNewEvents ? (
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
                        onClick={() => handleRemoveSubSeller(subSeller._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove sub-seller"
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

      {/* Add Sub-Seller Modal */}
      {showAddSubSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Add Default Sub-Seller</h2>
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
                    <option value="SELLER">Seller</option>
                    <option value="SCANNER">Scanner</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Commission Split</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure how commissions are split between you and your sub-seller
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Commission %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.parentCommissionPercent}
                          onChange={(e) =>
                            setFormData({ ...formData, parentCommissionPercent: e.target.value })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                          placeholder="50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          %
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub-Seller Commission %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.subSellerCommissionPercent}
                          onChange={(e) =>
                            setFormData({ ...formData, subSellerCommissionPercent: e.target.value })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                          placeholder="30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Total must not exceed 100%. Remaining percentage goes to the event organizer.
                  </p>
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
                        Automatically add this sub-seller when you join new events
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
                    setShowAddSubSeller(false);
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
