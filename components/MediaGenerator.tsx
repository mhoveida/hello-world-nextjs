'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function MediaGenerator({ userId }: { userId: string }) {
    const supabase = createClient();
    const router = useRouter();

    const [uploading, setUploading] = useState(false);
    const [statusText, setStatusText] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            const file = e.target.files[0];
            setUploading(true);
            setStatusText('Uploading media to storage...');

            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/${Date.now()}.${fileExt}`;

            // 1. Upload to content-images bucket
            const { error: uploadError } = await supabase.storage
                .from('content-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Retrieve public URL
            const { data: { publicUrl } } = supabase.storage
                .from('content-images')
                .getPublicUrl(filePath);

            setStatusText('Analyzing visual details & running 2-step prompt chain...');

            // 3. Trigger server API route
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: publicUrl }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Generation failed');

            setStatusText('Caption generated successfully!');
            router.refresh();
        } catch (err: any) {
            setStatusText(`Error: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Create AI Generation</h2>
            <p className="text-sm text-gray-600">
                Upload a photo. The system will describe the scene and generate a tailored satirical caption.
            </p>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-indigo-500 transition bg-gray-50">
        <span className="text-sm font-medium text-gray-700">
          {uploading ? 'Processing with Gemini...' : 'Click to upload image'}
        </span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG, or WEBP</span>
                <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </label>

            {statusText && (
                <p className={`text-xs font-medium ${statusText.startsWith('Error') ? 'text-red-600' : 'text-indigo-600'}`}>
                    {statusText}
                </p>
            )}
        </div>
    );
}