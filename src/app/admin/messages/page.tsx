"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { P, H } from '@/components/common/typography';
import { Eye, Mail, MessageCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { ContactMessage, ContactStats, ContactReply } from '@/models/contact';
import AdminNav from '@/components/admin/admin-nav';
import { toast } from 'sonner';

const AdminMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<ContactStats>({ total: 0, unread: 0, replied: 0, recent: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const router = useRouter();

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/contact');
      
      if (response.status === 401) {
        // Unauthorized - redirect to login
        router.push('/admin/login?redirect=/admin/messages');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
        setStats(data.stats);
      } else {
        toast.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to fetch messages');
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
        const response = await fetch('/api/admin/verify');
        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push('/admin/login?redirect=/admin/messages');
          return;
        }
        
        // Authenticated, load messages inline
        try {
          const messagesResponse = await fetch('/api/contact');
          
          if (messagesResponse.status === 401) {
            // Unauthorized - redirect to login
            router.push('/admin/login?redirect=/admin/messages');
            return;
          }

          if (messagesResponse.ok) {
            const data = await messagesResponse.json();
            
            if (data.success) {
              setMessages(data.messages);
              setStats(data.stats);
            } else {
              toast.error('Failed to fetch messages');
            }
          } else {
            toast.error('Failed to fetch messages');
          }
        } catch (messagesError) {
          console.error('Failed to fetch messages:', messagesError);
          toast.error('Failed to fetch messages');
          setMessages([]);
          setStats({ total: 0, unread: 0, replied: 0, recent: 0 });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin/login?redirect=/admin/messages');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const filteredMessages = messages.filter(message => {
    if (filter === 'unread') return !message.isRead;
    if (filter === 'replied') return message.replies && message.replies.length > 0;
    return true;
  });

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' }),
      });

      if (response.status === 401) {
        router.push('/admin/login?redirect=/admin/messages');
        return;
      }

      const result = await response.json();
      if (response.ok && result.success) {
        setMessages(prev => prev.map(msg => 
          msg.messageId === messageId ? { ...msg, isRead: true } : msg
        ));
        setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
        toast.success('Message marked as read');
      } else {
        toast.error('Failed to mark message as read');
      }
    } catch (error) {
      console.error('Mark as read failed:', error);
      toast.error('Failed to mark message as read');
    }
  };

  const sendReply = async (messageId: string) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSendingReply(true);

    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', replyMessage: replyText.trim() }),
      });

      if (response.status === 401) {
        router.push('/admin/login?redirect=/admin/messages');
        return;
      }

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Reply sent successfully!');
        setReplyText('');
        setSelectedMessage(null);
        await fetchMessages();
      } else {
        toast.error('Failed to send reply: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Reply failed:', error);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        router.push('/admin/login?redirect=/admin/messages');
        return;
      }

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.messageId !== messageId));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
        toast.success('Message deleted successfully');
      } else {
        toast.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete message');
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <div className=''>
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
                  <P className="text-sm text-gray-600">Total</P>
                  <P className="text-2xl font-bold text-gray-800">{stats.total}</P>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Unread</P>
                  <P className="text-2xl font-bold text-orange-600">{stats.unread}</P>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Replied</P>
                  <P className="text-2xl font-bold text-green-600">{stats.replied}</P>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Recent (24h)</P>
                  <P className="text-2xl font-bold text-purple-600">{stats.recent}</P>
                </div>
                <Mail className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg p-1 mb-6 inline-flex">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'replied', label: 'Replied' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-[#68191E] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Messages Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <P className="font-semibold">Messages ({filteredMessages.length})</P>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                          <P className="text-sm font-medium text-gray-900">{message.name}</P>
                          <P className="text-sm text-gray-500">{message.email}</P>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <P className="text-sm text-gray-900 max-w-md truncate">{message.message}</P>
                      </td>
                      <td className="px-6 py-4">
                        <P className="text-sm text-gray-500">{formatDate(message.createdAt)}</P>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMessage(message)}
                            className="p-1 text-blue-400 hover:text-blue-600"
                            title="View/Reply"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!message.isRead && (
                            <button
                              onClick={() => markAsRead(message.messageId)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Mark as Read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteMessage(message.messageId)}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Delete"
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

            {filteredMessages.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <P className="text-gray-500">No messages found</P>
              </div>
            )}
          </div>

          {/* Message Modal */}
          {selectedMessage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <H className="text-lg">Message Details</H>
                  <button
                    onClick={() => {
                      setSelectedMessage(null);
                      setReplyText('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <P className="text-sm text-gray-600">From:</P>
                    <P className="font-medium">{selectedMessage.name} ({selectedMessage.email})</P>
                  </div>

                  <div>
                    <P className="text-sm text-gray-600">Sent:</P>
                    <P className="font-medium">{formatDate(selectedMessage.createdAt)}</P>
                  </div>

                  <div>
                    <P className="text-sm text-gray-600">Message ID:</P>
                    <P className="font-mono text-sm">{selectedMessage.messageId}</P>
                  </div>

                  <div>
                    <P className="text-sm text-gray-600">Message:</P>
                    <div className="bg-gray-50 p-4 rounded-lg mt-2">
                      <P className="whitespace-pre-wrap">{selectedMessage.message}</P>
                    </div>
                  </div>

                  {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                    <div>
                      <P className="text-sm text-gray-600 mb-2">Previous Replies ({selectedMessage.replies.length}):</P>
                      {selectedMessage.replies.map((reply: ContactReply, index: number) => (
                        <div key={index} className="bg-blue-50 p-4 rounded-lg mb-2">
                          <div className="flex justify-between items-center mb-2">
                            <P className="text-sm font-medium">Admin Reply</P>
                            <P className="text-xs text-gray-500">
                              {formatDate(reply.sentAt)} {reply.emailSent ? '✓' : '✗'}
                            </P>
                          </div>
                          <P className="text-sm whitespace-pre-wrap">{reply.message}</P>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <P className="text-sm text-gray-600 mb-2">Send Reply:</P>
                  
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent"
                    placeholder="Type your reply here..."
                    disabled={sendingReply}
                    maxLength={1000}
                  />
                  
                  <div className="flex justify-between items-center mt-4">
                    <P className="text-xs text-gray-500">{replyText.length}/1000</P>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedMessage(null);
                          setReplyText('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        disabled={sendingReply}
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={() => sendReply(selectedMessage.messageId)}
                        disabled={!replyText.trim() || sendingReply}
                        className="px-4 py-2 bg-[#68191E] text-white rounded-lg hover:bg-[#5a1519] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingReply ? 'Sending...' : 'Send Reply'}
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