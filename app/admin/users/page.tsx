"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users as UsersIcon,
  Search,
  Shield,
  Briefcase,
  User,
  Trash2,
  AlertCircle,
  Calendar,
  ShoppingCart,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

export default function UsersManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "organizer" | "user">("all");
  const [selectedUser, setSelectedUser] = useState<Id<"users"> | null>(null);

  const allUsers = useQuery(api.adminPanel.queries.getAllUsers, {});
  const searchResults = useQuery(
    api.adminPanel.queries.searchUsers,
    searchQuery.length > 0 ? { query: searchQuery } : "skip"
  );

  const updateUserRole = useMutation(api.adminPanel.mutations.updateUserRole);
  const deleteUser = useMutation(api.adminPanel.mutations.deleteUser);

  const displayUsers = searchQuery.length > 0 ? searchResults : allUsers;

  const filteredUsers = displayUsers?.filter((user) => {
    if (roleFilter === "all") return true;
    return user.role === roleFilter;
  });

  const handleRoleChange = async (userId: Id<"users">, newRole: "admin" | "organizer" | "user") => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      await updateUserRole({ userId, role: newRole });
      alert("User role updated successfully");
    } catch (error: unknown) {
      alert(`Failed to update role: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDeleteUser = async (userId: Id<"users">, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser({ userId });
      alert("User deleted successfully");
    } catch (error: unknown) {
      alert(`Failed to delete user: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!filteredUsers) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stats = {
    total: allUsers?.length || 0,
    admins: allUsers?.filter((u) => u.role === "admin").length || 0,
    organizers: allUsers?.filter((u) => u.role === "organizer").length || 0,
    users: allUsers?.filter((u) => !u.role || u.role === "user").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage all platform users and permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Organizers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.organizers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Regular Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="organizer">Organizers</option>
              <option value="user">Regular Users</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <UsersIcon className="w-4 h-4" />
          <span>
            Showing {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-600"
                              : user.role === "organizer"
                              ? "bg-purple-100 text-purple-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <Shield className="w-5 h-5" />
                          ) : user.role === "organizer" ? (
                            <Briefcase className="w-5 h-5" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || "Unnamed User"}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : user.role === "organizer"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role || "user"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{(user as any).eventCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="w-4 h-4" />
                          <span>{(user as any).orderCount || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Role Change Dropdown */}
                        <div className="relative group">
                          <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1">
                            Change Role
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <div className="absolute left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => handleRoleChange(user._id, "admin")}
                              disabled={user.role === "admin"}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Make Admin
                            </button>
                            <button
                              onClick={() => handleRoleChange(user._id, "organizer")}
                              disabled={user.role === "organizer"}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Make Organizer
                            </button>
                            <button
                              onClick={() => handleRoleChange(user._id, "user")}
                              disabled={user.role === "user" || !user.role}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Make Regular User
                            </button>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name || user.email)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium mb-1">User Management Guidelines</p>
          <ul className="list-disc list-inside space-y-1">
            <li>You cannot change your own role or delete your own account</li>
            <li>Users with existing events cannot be deleted</li>
            <li>Organizers can create and manage events</li>
            <li>Admins have full platform access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
