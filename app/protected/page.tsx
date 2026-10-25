import { createClient } from '@/lib/supabase/server';
import LoginButton from '@/components/LoginButton';
import MediaGenerator from '@/components/MediaGenerator';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProtectedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Gated Fallback for unauthenticated visitors
    if (!user) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-900">
                <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center space-y-5">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                        🔒
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Sign In Required</h1>
                    <p className="text-sm text-gray-600">
                        Generating media and rating community submissions requires an authenticated user session.
                    </p>
                    <div className="pt-2 flex justify-center">
                        <LoginButton />
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                        <Link href="/" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">
                            &larr; Return to Public Feed
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Fetch only this user's generated captions
    const { data: userCaptions } = await supabase
        .from('captions')
        .select(`
      id,
      caption_text,
      created_at,
      images (
        image_url
      )
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 text-gray-900">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Media Generation Studio</h1>
                        <p className="text-xs text-gray-500">Authenticated user: {user.email}</p>
                    </div>
                    <Link href="/" className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold">
                        &larr; Back to Feed
                    </Link>
                </div>

                {/* Media Generator Component */}
                <MediaGenerator userId={user.id} />

                {/* User's Previous Creations */}
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Your Generated Media ({userCaptions?.length || 0})
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userCaptions?.map((item: any) => (
                            <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
                                {item.images?.image_url && (
                                    <img
                                        src={item.images.image_url}
                                        alt="Upload preview"
                                        className="w-full h-36 object-cover bg-gray-50"
                                    />
                                )}
                                <div className="p-3">
                                    <p className="text-xs font-medium text-gray-800 line-clamp-2">
                                        “{item.caption_text}”
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}