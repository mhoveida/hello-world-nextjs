'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ProfileForm({ user, profile }: { user: any; profile: any }) {
    const supabase = createClient();
    const router = useRouter();

    const [firstName, setFirstName] = useState(profile?.first_name || '');
    const [lastName, setLastName] = useState(profile?.last_name || '');
    const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Handle uploading an image to Supabase Storage
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setMessage(null);

            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            // Keep filename unique per upload
            const filePath = `${user.id}-${Date.now()}.${fileExt}`;

            // 1. Upload binary file into 'avatars' storage bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get the clean public URL for the uploaded file
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            setAvatarUrl(data.publicUrl);
            setMessage('Photo uploaded! Click "Save Profile" to apply changes.');
        } catch (error: any) {
            setMessage(`Upload error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                phone_number: phoneNumber,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        setLoading(false);

        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage('Profile updated successfully!');
            router.refresh();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3 pb-4 border-b border-gray-100">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 border border-gray-300 flex items-center justify-center">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Profile avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-gray-400 text-xs font-medium">No Image</span>
                    )}
                </div>

                <div>
                    <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-700 transition inline-block">
                        {uploading ? 'Uploading...' : 'Choose Avatar Photo'}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Email
                </label>
                <input
                    type="text"
                    disabled
                    value={user.email || ''}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed text-sm"
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    First Name
                </label>
                <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Last Name
                </label>
                <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number
                </label>
                <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(Optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
            </div>

            {message && (
                <p className={`text-sm ${message.startsWith('Error') || message.startsWith('Upload error') ? 'text-red-600' : 'text-green-600'}`}>
                    {message}
                </p>
            )}

            <button
                type="submit"
                disabled={loading || uploading}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md font-medium text-sm transition"
            >
                {loading ? 'Saving...' : 'Save Profile'}
            </button>
        </form>
    );
}