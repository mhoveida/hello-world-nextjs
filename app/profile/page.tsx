import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProfileForm from '@/components/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const supabase = await createClient();

    // 1. Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/');
    }

    // 2. Fetch public profile row
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const isMissingName = !profile?.first_name || !profile?.last_name;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 text-gray-900">
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
                    <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        &larr; Back to Home
                    </Link>
                </div>

                {/* Prompt if name is missing */}
                {isMissingName && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                        <strong>Welcome!</strong> Please complete your profile by providing your first and last name below.
                    </div>
                )}

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <ProfileForm user={user} profile={profile} />
                </div>
            </div>
        </div>
    );
}