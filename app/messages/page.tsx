'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import VerificationGuard from '@/components/VerificationGuard';

interface Conversation {
  id: string;
  otherParticipant: {
    id: string;
    name: string;
  } | null;
  listing: {
    id: string;
    title: string;
  } | null;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Only fetch conversations if user is authenticated
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const data = await response.json();
        setConversations(data.conversations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <VerificationGuard>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-text mb-6">Messages</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-border rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-border rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-border rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </VerificationGuard>
    );
  }

  if (error) {
    return (
      <VerificationGuard>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-text mb-4">{error}</h2>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </VerificationGuard>
    );
  }

  return (
    <VerificationGuard>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text">Messages</h1>
        <Link href="/" className="text-primary hover:text-primaryHover transition-colors">
          Browse Listings
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="card text-center py-12">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-text mb-2">
            No messages yet
          </h2>
          <p className="text-text-secondary mb-6">
            Start browsing listings to connect with sellers!
          </p>
          <Link href="/" className="btn-primary inline-block">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="card hover:bg-surface/80 transition-colors cursor-pointer block"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {conversation.otherParticipant?.name.charAt(0).toUpperCase() || '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text truncate">
                        {conversation.otherParticipant?.name || 'Unknown User'}
                      </h3>
                      {conversation.listing && (
                        <p className="text-sm text-text-secondary truncate">
                          Re: {conversation.listing.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-text-secondary">
                        {formatTimestamp(conversation.lastMessageAt)}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-text-secondary truncate">
                      {conversation.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </VerificationGuard>
  );
}