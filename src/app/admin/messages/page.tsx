"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { P, H } from "@/components/common/typography";
import {
  Eye,
  Mail,
  MessageCircle,
  CheckCircle,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ContactMessage, ContactStats } from "@/models/contact";
import AdminNav from "@/components/admin/admin-nav";
import { toast } from "sonner";

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface MessagesResponse {
  success: boolean;
  messages: ContactMessage[];
  stats: ContactStats;
  pagination: PaginationData;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<ContactStats>({
    total: 0,
    unread: 0,
    replied: 0,
    recent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null
  );
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const router = useRouter();

  const fetchMessages = async (page: number = 1) => {
    try {
      const params = new URLSearchParams();
      if (page > 1) params.append("page", page.toString());

      const response = await fetch(`/api/contact?${params.toString()}`);

      if (response.status === 401) {
        router.push("/admin/login?redirect=/admin/messages");
        return;
      }

      const data: MessagesResponse = await response.json();

      if (data.success) {
        setMessages(data.messages);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch messages");
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to fetch messages");
      setMessages([]);
      setStats({ total: 0, unread: 0, replied: 0, recent: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check authentication using the new API
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify");
        if (!response.ok) {
          router.push("/admin/login?redirect=/admin/messages");
          return;
        }

        // Authenticated, load messages inline
        try {
          const params = new URLSearchParams();
          if (pagination.page > 1)
            params.append("page", pagination.page.toString());

          const messagesResponse = await fetch(
            `/api/contact?${params.toString()}`
          );

          if (messagesResponse.status === 401) {
            router.push("/admin/login?redirect=/admin/messages");
            return;
          }

          if (messagesResponse.ok) {
            const data: MessagesResponse = await messagesResponse.json();

            if (data.success) {
              setMessages(data.messages);
              setStats(data.stats);
              setPagination(data.pagination);
            } else {
              toast.error("Failed to fetch messages");
            }
          } else {
            toast.error("Failed to fetch messages");
          }
        } catch (messagesError) {
          console.error("Failed to fetch messages:", messagesError);
          toast.error("Failed to fetch messages");
          setMessages([]);
          setStats({ total: 0, unread: 0, replied: 0, recent: 0 });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/admin/login?redirect=/admin/messages");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pagination.page]);

  const filteredMessages = messages.filter((message) => {
    if (filter === "unread") return !message.isRead;
    if (filter === "replied")
      return message.replies && message.replies.length > 0;
    return true;
  });

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      });

      if (response.status === 401) {
        router.push("/admin/login?redirect=/admin/messages");
        return;
      }

      const result = await response.json();
      if (response.ok && result.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.messageId === messageId ? { ...msg, isRead: true } : msg
          )
        );
        setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
        toast.success("Message marked as read");
      } else {
        toast.error("Failed to mark message as read");
      }
    } catch (error) {
      console.error("Mark as read failed:", error);
      toast.error("Failed to mark message as read");
    }
  };

  const sendReply = async (messageId: string) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setSendingReply(true);

    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          replyMessage: replyText.trim(),
        }),
      });

      if (response.status === 401) {
        router.push("/admin/login?redirect=/admin/messages");
        return;
      }

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Reply sent successfully!");
        setReplyText("");
        setSelectedMessage(null);
        await fetchMessages(pagination.page);
      } else {
        toast.error(
          "Failed to send reply: " + (result.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Reply failed:", error);
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;

    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.push("/admin/login?redirect=/admin/messages");
        return;
      }

      if (response.ok) {
        setMessages((prev) =>
          prev.filter((msg) => msg.messageId !== messageId)
        );
        setStats((prev) => ({ ...prev, total: prev.total - 1 }));
        toast.success("Message deleted successfully");
      } else {
        toast.error("Failed to delete message");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete message");
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div>
        <AdminNav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#68191E]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <AdminNav />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <H className="text-3xl mb-2 text-[#68191E]">Messages</H>
            <P className="text-gray-600">Manage customer inquiries</P>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Total Messages</P>
                  <P className="text-2xl font-bold text-blue-600">
                    {pagination.totalCount}
                  </P>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Unread</P>
                  <P className="text-2xl font-bold text-orange-600">
                    {stats.unread}
                  </P>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Replied</P>
                  <P className="text-2xl font-bold text-green-600">
                    {stats.replied}
                  </P>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Recent (24h)</P>
                  <P className="text-2xl font-bold text-purple-600">
                    {stats.recent}
                  </P>
                </div>
                <Mail className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg p-1 mb-6 inline-flex">
            {[
              { key: "all", label: "All" },
              { key: "unread", label: "Unread" },
              { key: "replied", label: "Replied" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-[#68191E] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Messages Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <P className="font-semibold">
                Messages ({filteredMessages.length} of {pagination.totalCount})
              </P>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMessages.map((message) => (
                    <tr key={message.messageId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!message.isRead && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                          {message.replies && message.replies.length > 0 && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <P className="text-sm font-medium text-gray-900">
                            {message.name}
                          </P>
                          <P className="text-sm text-gray-500">
                            {message.email}
                          </P>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <P className="text-sm text-gray-900 max-w-md truncate">
                          {message.message}
                        </P>
                      </td>
                      <td className="px-6 py-4">
                        <P className="text-sm text-gray-500">
                          {formatDate(message.createdAt)}
                        </P>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMessage(message)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!message.isRead && (
                            <button
                              onClick={() => markAsRead(message.messageId)}
                              className="p-1 text-blue-400 hover:text-blue-600"
                              title="Mark as Read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteMessage(message.messageId)}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Delete Message"
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.totalCount
                    )}{" "}
                    of {pagination.totalCount} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Detail Modal */}
          {selectedMessage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <H className="text-xl mb-2">{selectedMessage.name}</H>
                      <P className="text-gray-600">{selectedMessage.email}</P>
                      <P className="text-sm text-gray-500 mt-1">
                        {formatDate(selectedMessage.createdAt)}
                      </P>
                    </div>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mb-6">
                    <P className="text-sm text-gray-600 mb-2">Message</P>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <P className="text-gray-900">{selectedMessage.message}</P>
                    </div>
                  </div>

                  {selectedMessage.replies &&
                    selectedMessage.replies.length > 0 && (
                      <div className="mb-6">
                        <P className="text-sm text-gray-600 mb-2">Replies</P>
                        <div className="space-y-3">
                          {selectedMessage.replies.map((reply, index) => (
                            <div
                              key={index}
                              className="bg-blue-50 rounded-lg p-4"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <P className="text-sm font-medium text-blue-900">
                                  Admin Reply
                                </P>
                                <P className="text-xs text-blue-600">
                                  {formatDate(reply.sentAt)}
                                </P>
                              </div>
                              <P className="text-blue-800">{reply.message}</P>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="border-t border-gray-200 pt-4">
                    <P className="text-sm text-gray-600 mb-2">Send Reply</P>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent"
                      rows={4}
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => sendReply(selectedMessage.messageId)}
                        disabled={!replyText.trim() || sendingReply}
                        className="px-4 py-2 bg-[#68191E] text-white rounded-lg hover:bg-[#5a1519] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingReply ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
