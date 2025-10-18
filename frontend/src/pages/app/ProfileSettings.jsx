import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUser } from '../../api/authApi';
import { uploadPublicFile } from '../../api/filesApi';
import { User, Mail, Save, AlertCircle, CheckCircle } from 'lucide-react';
import './ProfileSettings.css';

const extractErrorMessage = (error, fallback) => {
        const detail = error?.response?.data?.detail;

        if (typeof detail === 'string') {
                return detail;
        }

        if (Array.isArray(detail)) {
                const combined = detail
                        .map(item => item?.msg)
                        .filter(Boolean)
                        .join(' ');
                if (combined) {
                        return combined;
                }
        }

        if (detail?.msg) {
                return detail.msg;
        }

        if (detail?.message) {
                return detail.message;
        }

        return error?.message || fallback;
};

export default function ProfileSettings() {
        const { user, fetchAndSetCurrentUser } = useAuth();
        const [formData, setFormData] = useState({
                username: '',
                email: '',
                profile_image_url: ''
        });
        const [loading, setLoading] = useState(false);
        const [isUploadingImage, setIsUploadingImage] = useState(false);
        const [message, setMessage] = useState({ type: '', text: '' });
        const fileInputRef = useRef(null);

        useEffect(() => {
                if (user) {
                        setFormData({
                                username: user.username || '',
                                email: user.email || '',
                                profile_image_url: user.profile_image_url || ''
                        });
                }
        }, [user]);

        const handleChange = (e) => {
                const { name, value } = e.target;
                setFormData(prev => ({ ...prev, [name]: value }));
                setMessage({ type: '', text: '' });
        };

        const handleProfileImageClick = () => {
                if (isUploadingImage) {
                        return;
                }

                fileInputRef.current?.click();
        };

        const handleProfileImageChange = async (event) => {
                const selectedFile = event.target.files?.[0];
                if (!selectedFile || !user) {
                        return;
                }

                setMessage({ type: '', text: '' });
                setIsUploadingImage(true);

                try {
                        const uploadedUrl = await uploadPublicFile(user.id, 'profile', selectedFile);
                        setFormData(prev => ({ ...prev, profile_image_url: uploadedUrl }));
                        setMessage({ type: 'info', text: 'Image uploaded. Click "Save Changes" to apply it to your profile.' });
                } catch (error) {
                        console.error('Profile image upload error:', error);
                        const errorMessage = extractErrorMessage(error, 'Failed to upload image. Please try again.');
                        setMessage({ type: 'error', text: errorMessage });
                } finally {
                        setIsUploadingImage(false);
                        event.target.value = '';
                }
        };

        const handleSubmit = async (e) => {
                e.preventDefault();
                setLoading(true);
                setMessage({ type: '', text: '' });

                try {
                        const updateData = {};
                        if (formData.username !== user.username) updateData.username = formData.username;
                        if (formData.profile_image_url !== (user.profile_image_url || '')) updateData.profile_image_url = formData.profile_image_url;
                        if (Object.keys(updateData).length === 0) {
                                setMessage({ type: 'info', text: 'No changes to save' });
                                setLoading(false);
                                return;
                        }

                        await updateUser(user.id, updateData);
                        await fetchAndSetCurrentUser();
                        setMessage({ type: 'success', text: 'Profile updated successfully!' });
                } catch (error) {
                        console.error('Profile update error:', error);
                        const errorMessage = extractErrorMessage(error, 'Failed to update profile. Please try again.');
                        setMessage({ type: 'error', text: errorMessage });
                } finally {
                        setLoading(false);
                }
        };

        if (!user) {
                return (
                        <div className="p-8 flex items-center justify-center">
                                <div className="text-[#2D2D2D] opacity-60">Loading...</div>
                        </div>
                );
        }

        return (
                <div className="p-8 profile-settings-container">
                        <div className="max-w-3xl mx-auto">
                                {/* Header */}
                                <div className="mb-8">
                                        <h1 className="text-4xl font-bold text-[#035035] mb-2">Profile Settings</h1>
                                        <p className="text-[#2D2D2D] opacity-60">Manage your account information</p>
                                </div>

                                {/* Profile Form */}
                                <div className="bg-white rounded-2xl border border-[#F5F5F5] p-8">
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                                {/* Profile Image Preview */}
                                                <div className="flex items-center gap-6 pb-6 border-b border-[#F5F5F5]">
                                                        <button
                                                                type="button"
                                                                onClick={handleProfileImageClick}
                                                                className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-[#A8C9B8] profile-image-preview focus:outline-none focus:ring-4 focus:ring-[#035035] transition-all relative disabled:opacity-70"
                                                                aria-label="Change profile image"
                                                                disabled={isUploadingImage}
                                                        >
                                                                <img
                                                                        src={formData.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`}
                                                                        alt={formData.username}
                                                                        className="w-full h-full object-cover"
                                                                />
                                                                {isUploadingImage && (
                                                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-sm">
                                                                                Uploading...
                                                                        </div>
                                                                )}
                                                        </button>
                                                        <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={handleProfileImageChange}
                                                        />
                                                        <div className="flex-1">
                                                                <h3 className="text-lg font-semibold text-[#2D2D2D] mb-1">{formData.username}</h3>
                                                                <p className="text-sm text-[#2D2D2D] opacity-60">{formData.email}</p>
                                                                <p className="text-xs text-[#2D2D2D] opacity-60 mt-2">Click your avatar to upload a new profile image.</p>
                                                        </div>
                                                </div>

                                                {/* Username Field */}
                                                <div>
                                                        <label htmlFor="username" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                                                <User className="w-4 h-4 inline mr-2" />
                                                                Username
                                                        </label>
                                                        <input
                                                                type="text"
                                                                id="username"
                                                                name="username"
                                                                value={formData.username}
                                                                onChange={handleChange}
                                                                className="w-full px-4 py-3 rounded-xl border border-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#035035] transition-all"
                                                                required
                                                        />
                                                </div>

                                                {/* Email Field */}
                                                <div>
                                                        <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                                                <Mail className="w-4 h-4 inline mr-2" />
                                                                Email
                                                        </label>
                                                        <input
                                                                type="email"
                                                                id="email"
                                                                name="email"
                                                                value={formData.email}
                                                                readOnly
                                                                disabled
                                                                className="w-full px-4 py-3 rounded-xl border border-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#035035] transition-all"
                                                                required
                                                        />
                                                </div>

                                                {/* Message Display */}
                                                {message.text && (
                                                        <div className={`flex items-center gap-2 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700' :
                                                                message.type === 'error' ? 'bg-red-50 text-red-700' :
                                                                        'bg-blue-50 text-blue-700'
                                                                }`}>
                                                                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                                                <span className="text-sm font-medium">{message.text}</span>
                                                        </div>
                                                )}

                                                {/* Submit Button */}
                                                <button
                                                        type="submit"
                                                        disabled={!user || !((formData.username !== (user.username || '')) || (formData.profile_image_url !== (user.profile_image_url || ''))) || loading || isUploadingImage}
                                                        className="w-full bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                                >
                                                        <Save className="w-5 h-5" />
                                                        {loading ? 'Saving...' : isUploadingImage ? 'Uploading image...' : 'Save Changes'}
                                                </button>
                                        </form>
                                </div>

                                {/* Account Info */}
                                <div className="mt-6 bg-[#FFF8F0] rounded-2xl p-6">
                                        <h3 className="text-lg font-semibold text-[#035035] mb-4">Account Information</h3>
                                        <div className="space-y-2 text-sm text-[#2D2D2D]">
                                                <div className="flex justify-between">
                                                        <span className="opacity-60">Account Created</span>
                                                        <span className="font-medium">
                                                                {new Date(user.created_at).toLocaleDateString()}
                                                        </span>
                                                </div>
                                                <div className="flex justify-between">
                                                        <span className="opacity-60">Last Login</span>
                                                        <span className="font-medium">
                                                                {new Date(user.last_login).toLocaleDateString()}
                                                        </span>
                                                </div>
                                                <div className="flex justify-between">
                                                        <span className="opacity-60">Login Streak</span>
                                                        <span className="font-medium">{user.login_streak} days</span>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        );
}
