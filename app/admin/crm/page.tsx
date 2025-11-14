"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  User,
  Calendar,
  Filter,
  Download,
  Users,
  Database,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";

export default function CRMPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Id<"eventContacts"> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const contacts = useQuery(api.crm.queries.getAllContacts, { search: searchQuery || undefined });
  const crmStats = useQuery(api.crm.queries.getCRMStats);
  const deleteContact = useMutation(api.crm.mutations.deleteContact);

  const handleDelete = async (contactId: Id<"eventContacts">, name: string) => {
    try {
      await deleteContact({ contactId });
    } catch (error) {
      alert(
        "Failed to delete contact: " + (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const exportToCSV = () => {
    if (!contacts || contacts.length === 0) {
      alert("No contacts to export");
      return;
    }

    const headers = ["Name", "Phone", "Email", "Role", "Organization", "Event", "Source"];
    const rows = contacts.map((c: any) => [
      c.name,
      c.phoneNumber || "",
      c.email || "",
      c.role || "",
      c.organization || "",
      c.eventName || "",
      c.extractedFrom,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-contacts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (!contacts || !crmStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM - Contact Management</h1>
          <p className="text-gray-600 mt-1">Manage event contacts and organizers</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent text-primary rounded-full flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{crmStats.totalContacts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">From Flyers</p>
              <p className="text-2xl font-bold text-gray-900">{crmStats.extractedFromFlyers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent text-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Manual</p>
              <p className="text-2xl font-bold text-gray-900">{crmStats.manuallyAdded}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Phone</p>
              <p className="text-2xl font-bold text-gray-900">{crmStats.withPhoneNumber}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Email</p>
              <p className="text-2xl font-bold text-gray-900">{crmStats.withEmail}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Linked</p>
              <p className="text-2xl font-bold text-gray-900">{crmStats.linkedToEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contacts by name, phone, email, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role / Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p>No contacts found</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-red-600 hover:underline mt-2"
                      >
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <motion.tr
                    key={contact._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          {contact.socialMedia?.instagram && (
                            <p className="text-xs text-gray-500">
                              @{contact.socialMedia.instagram}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.phoneNumber ? (
                        <a
                          href={`tel:${contact.phoneNumber}`}
                          className="flex items-center gap-2 text-gray-900 hover:text-red-600"
                        >
                          <Phone className="w-4 h-4" />
                          {contact.phoneNumber}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-2 text-gray-900 hover:text-red-600"
                        >
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {contact.role && (
                          <p className="text-sm font-medium text-gray-900">{contact.role}</p>
                        )}
                        {contact.organization && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {contact.organization}
                          </p>
                        )}
                        {!contact.role && !contact.organization && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {contact.eventName ? (
                        <span className="text-sm text-gray-900">{contact.eventName}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          contact.extractedFrom === "FLYER"
                            ? "bg-green-100 text-green-800"
                            : "bg-accent text-accent-foreground"
                        }`}
                      >
                        {contact.extractedFrom === "FLYER" ? "Flyer" : "Manual"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(contact._id, contact.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
