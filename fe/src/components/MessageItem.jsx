import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatMessageTime } from '../lib/utils';
import { MoreVertical, Edit, Trash2, Smile } from 'lucide-react';
import toast from 'react-hot-toast';

const MessageItem = ({ message, selectedUser, authUser }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text || '');
  const [showReactions, setShowReactions] = useState(false);
  const reactionsRef = useRef(null);

  const { editMessage, deleteMessage, addReaction } = useChatStore();

  const isOwnMessage = message.senderId === authUser._id;

  const handleEdit = async () => {
    if (editedText.trim().length === 0) {
      toast.error("Message cannot be empty");
      return;
    }

    await editMessage(message._id, editedText.trim());
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(message._id);
      setShowMenu(false);
    }
  };

  const handleReaction = async (emoji) => {
    await addReaction(message._id, emoji);
    setShowReactions(false);
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  // Close reactions popup on outside click
  useEffect(() => {
    if (!showReactions) return;
    const handleClickOutside = (event) => {
      if (reactionsRef.current && !reactionsRef.current.contains(event.target)) {
        setShowReactions(false);
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReactions]);

  return (
    <div className={`chat mt-[30px] ${isOwnMessage ? "chat-end" : "chat-start"}`}>
      <div className="chat-image avatar">
        <div className="size-10 rounded-full border">
          <img
            src={isOwnMessage ? authUser.profilePicture || "avatar-default.svg" : selectedUser.profilePicture || "avatar-default.svg"}
            alt="ProfilePicture"
          />
        </div>
      </div>

      <div className="chat-header mb-1">
        <time className='text-xs opacity-50 ml-1'>
          {formatMessageTime(message.createdAt)}
          {message.isEdited && <span className="ml-1 text-xs opacity-50">(edited)</span>}
        </time>
      </div>

      <div className="chat-bubble relative group overflow-visible">
        {message.image && (
          <img src={message.image} alt="Image" className='sm:max-w-[200px] rounded-md mb-2' />
        )}

        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="flex-1 bg-base-200 rounded px-2 py-1 text-sm"
              autoFocus
            />
            <button
              onClick={handleEdit}
              className="btn btn-xs btn-primary"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedText(message.text || '');
              }}
              className="btn btn-xs btn-ghost"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p>{message.text}</p>
        )}

        {/* Message actions menu */}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="dropdown dropdown-end">
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={12} />
            </button>
            {showMenu && (
              <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 z-50">
                <li>
                  <button onClick={() => setShowReactions(!showReactions)}>
                    <Smile size={12} />
                    React
                  </button>
                </li>
                {isOwnMessage && (
                  <li>
                    <button onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}>
                      <Edit size={12} />
                      Edit
                    </button>
                  </li>
                )}
                {isOwnMessage && (
                  <li>
                    <button onClick={handleDelete} className="text-error">
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Reactions popup */}
        {showReactions && (
          <div ref={reactionsRef} className="absolute bottom-full left-0 mb-2 bg-base-200 border border-base-300 rounded-lg p-2 shadow-lg z-50 w-max max-w-[90vw] overflow-visible">
            <div className="flex gap-1 flex-wrap">
              {commonReactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="hover:bg-base-300 p-1 rounded text-lg focus:outline-none focus-visible:outline-none focus:ring-0"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Display reactions (anchored to bubble) */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`absolute top-full mt-1 ${isOwnMessage ? 'right-0 pr-2' : 'left-0 pl-2'} w-max max-w-[90vw]`}>
            <div className="flex gap-1 flex-wrap">
              {Object.entries(
                message.reactions.reduce((acc, reaction) => {
                  acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <span
                  key={emoji}
                  className="bg-base-300 inline-flex items-center gap-1 whitespace-nowrap h-6 px-2 rounded-full text-xs cursor-pointer hover:bg-base-400"
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji} {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
