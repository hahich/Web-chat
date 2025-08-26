import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore';
import { Camera, Mail, User, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(authUser?.fullName || '');
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImage(base64Image);
      await updateProfile({ profilePicture: base64Image });
    }
  }

  const handleNameEdit = () => {
    setIsEditingName(true);
    setEditedName(authUser?.fullName || '');
  }

  const handleNameSave = async () => {
    if (editedName.trim().length < 2) {
      toast.error("Name must be at least 2 characters long");
      return;
    }
    
    await updateProfile({ fullName: editedName.trim() });
    setIsEditingName(false);
  }

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName(authUser?.fullName || '');
  }

  // Update editedName when authUser changes
  useEffect(() => {
    setEditedName(authUser?.fullName || '');
  }, [authUser?.fullName]);
  return (
    <div className='h-screen pt-20'>
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <div className="text-2xl font-semibold">Profile</div>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img src={selectedImage || authUser?.profilePicture || "avatar-default.svg"} alt="" className="size-32 rounded-full object-cover border-4" />
              <label htmlFor="avatar-upload" className={`absolute bottom-0 right-0 bg-base-content hover:scale-105 p-2 rounded-full cursor-pointer transition-all duration-200 ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}`}>
                <Camera className="size-5 text-base-200" />
                <input type="file" id="avatar-upload" className="hidden" accept='image/*' onChange={handleImageUpload} disabled={isUpdatingProfile} />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="size-4" />
                Full Name
              </div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-base-200 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isUpdatingProfile}
                  />
                  <button
                    onClick={handleNameSave}
                    disabled={isUpdatingProfile}
                    className="p-2.5 bg-primary text-primary-content rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Save className="size-4" />
                  </button>
                  <button
                    onClick={handleNameCancel}
                    disabled={isUpdatingProfile}
                    className="p-2.5 bg-base-300 text-base-content rounded-lg hover:bg-base-400 transition-colors disabled:opacity-50"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-2.5 bg-base-200 rounded-lg border">
                  <span>{authUser?.fullName}</span>
                  <button
                    onClick={handleNameEdit}
                    disabled={isUpdatingProfile}
                    className="p-1 hover:bg-base-300 rounded transition-colors disabled:opacity-50"
                  >
                    <Edit className="size-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="size-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className='text-green-500'>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage