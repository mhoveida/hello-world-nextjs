import { createClient } from '@/lib/supabase/server';
import LoginButton from '@/components/LoginButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProtectedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Scenario 1: User is NOT authenticated (Gated UI)
    if (!user) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-900">
                <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center space-y-5">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                        🔒
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Access Restricted</h1>
                    <p className="text-sm text-gray-600">
                        This route is gated. You must be signed in with your Google account to view this content.
                    </p>
                    <div className="pt-2 flex justify-center">
                        <LoginButton />
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                        <Link href="/" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">
                            &larr; Return to Home
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Scenario 2: User IS authenticated (Show Protected Content)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-gray-900">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Gated Member Area</h1>
                    <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                        &larr; Back to Home
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Profile Avatar"
                                className="w-16 h-16 rounded-full object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 font-semibold flex items-center justify-center text-xl">
                                {profile?.first_name ? profile.first_name[0] : user.email?.[0].toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {profile?.first_name || profile?.last_name
                                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                                    : 'Welcome Member'}
                            </h2>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                        ✨ You are viewing a server-verified protected route. Your identity has been confirmed via Supabase OAuth.
                    </div>

                    <div className="pt-2 flex gap-4">
                        <Link
                            href="/profile"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 underline"
                        >
                            Edit your profile
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}