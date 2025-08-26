import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, MessageSquare } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { formatMessageTime } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { authUser } = useAuthStore();

  const searchMessages = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axiosInstance.get(`/messages/search?query=${encodeURIComponent(searchQuery)}`);
      setResults(response.data.messages);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search messages');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchMessages(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const getOtherUser = (message) => {
    if (message.senderId._id === authUser._id) {
      return message.receiverId;
    }
    return message.senderId;
  };

  const highlightText = (text, searchQuery) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-base-100 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Search Messages</h2>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-base-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" size={20} />
            <input
              type="text"
              placeholder="Search messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-base-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading loading-spinner loading-md"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((message) => {
                const otherUser = getOtherUser(message);
                return (
                  <div
                    key={message._id}
                    className="p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                    onClick={() => {
                      // TODO: Navigate to the chat with this user
                      onClose();
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={otherUser.profilePicture || "/avatar-default.svg"}
                        alt={otherUser.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/avatar-default.svg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium truncate">{otherUser.fullName}</h3>
                          <span className="text-xs text-base-content/50">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                        {message.text && (
                          <p
                            className="text-sm text-base-content/70 line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(message.text, query)
                            }}
                          />
                        )}
                        {message.image && (
                          <div className="flex items-center gap-2 mt-2">
                            <MessageSquare size={16} className="text-base-content/50" />
                            <span className="text-xs text-base-content/50">Image message</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : query.trim() ? (
            <div className="text-center py-8 text-base-content/50">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>No messages found for "{query}"</p>
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/50">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>Start typing to search messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SearchModal;
