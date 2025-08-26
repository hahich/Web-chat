import { Image, Send, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../store/useChatStore';
import { toast } from 'react-hot-toast';

const MessageInput = ({ disabled = false, placeholder = 'Type a message...' }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, sendGroupMessage, startTyping, stopTyping, selectedUser, selectedGroup } = useChatStore();
  const typingTimeoutRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }
  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
  // Handle typing indicators
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    if (selectedUser) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Start typing indicator
      startTyping(selectedUser._id);
      
      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedUser._id);
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (disabled) return;
    if (!text.trim() && !imagePreview) {
      return;
    }
    
    // Stop typing indicator
    if (selectedUser) {
      stopTyping(selectedUser._id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    
    try {
      if (selectedGroup) {
        await sendGroupMessage({
          text: text.trim(),
          image: imagePreview,
        });
      } else {
        await sendMessage({
          text: text.trim(),
          image: imagePreview,
        });
      }

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className='p-4 w-full'>
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="size-20 object-cover rounded-lg border border-zinc-700" />
            <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-base-300 flex items-center justofy-center" type="button">
              <X className='size-3' />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className='flex items-center gap-2'>
        <div className="flex-1 flex gap-2">
          <input type="text"
            className='w-full input input-bordered rounded-lg input-sm sm:imput-md'
            placeholder={placeholder}
            value={text}
            onChange={handleTextChange}
            disabled={disabled}
          />
          <input type='file'
            accept='image/*'
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={disabled}
          />
          <button type='button' className={`hidden sm:flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Image size={20} />
          </button>
        </div>
        <button type='submit' className="btn btn-sm btn-circle"
          disabled={disabled || (!text.trim() && !imagePreview)}
        >
          <Send size={22} />
        </button>
      </form>
    </div >
  )
}

export default MessageInput