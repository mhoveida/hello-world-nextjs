import { createClient } from '@/lib/supabase/server';
import LoginButton from '@/components/LoginButton';
import VoteControls from '@/components/VoteControls';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all captions joined with their image and votes
    const { data: captions } = await supabase
        .from('captions')
        .select(`
      id,
      caption_text,
      prompt,
      created_at,
      images (
        id,
        image_url,
        image_description
      ),
      votes (
        user_id,
        vote_value
      )
    `)
        .order('created_at', { ascending: false });

    return (
        <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 text-gray-900">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header Bar */}
                <header className="flex flex-col sm:flex-row items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Columbia Campus Rater</h1>
                        <p className="text-xs text-gray-500 mt-1">Rate AI-generated satire on student life</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/protected"
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
                                >
                                    + Generate New Media
                                </Link>
                                <Link
                                    href="/profile"
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
                                >
                                    Profile
                                </Link>
                                <form action="/auth/signout" method="post">
                                    <button
                                        type="submit"
                                        className="text-xs text-gray-500 hover:text-red-600 underline"
                                    >
                                        Sign out
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Sign in to vote:</span>
                                <LoginButton />
                            </div>
                        )}
                    </div>
                </header>

                {/* Captions Feed */}
                <section className="space-y-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Community Submissions
                    </h2>

                    {!captions || captions.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 text-sm">
                            No generations yet. {user ? <Link href="/protected" className="text-indigo-600 underline">Upload the first image</Link> : 'Sign in to upload one!'}
                        </div>
                    ) : (
                        captions.map((item: any) => {
                            // Calculate total upvotes/downvotes
                            const score = (item.votes || []).reduce(
                                (sum: number, v: { vote_value: number }) => sum + v.vote_value,
                                0
                            );

                            // Check if currently logged-in user already voted
                            const userVoteObj = (item.votes || []).find(
                                (v: { user_id: string; vote_value: number }) => v.user_id === user?.id
                            );
                            const userVote = userVoteObj ? userVoteObj.vote_value : null;

                            return (
                                <article
                                    key={item.id}
                                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                                >
                                    {item.images?.image_url && (
                                        <div className="w-full max-h-96 bg-gray-100 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={item.images.image_url}
                                                alt={item.images.image_description || 'Uploaded scene'}
                                                className="w-full object-contain max-h-96"
                                            />
                                        </div>
                                    )}

                                    <div className="p-5 space-y-4">
                                        <p className="text-base font-medium text-gray-900 leading-snug">
                                            “{item.caption_text}”
                                        </p>

                                        {/* Metadata Drawer */}
                                        <details className="text-xs text-gray-400 cursor-pointer">
                                            <summary className="hover:text-gray-600">View Generation Prompt & Vision Detail</summary>
                                            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-100 space-y-1 font-mono text-[11px] text-gray-600">
                                                <p><strong>Vision Analysis:</strong> {item.images?.image_description}</p>
                                                <p><strong>Prompt:</strong> {item.prompt}</p>
                                            </div>
                                        </details>

                                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                            <VoteControls
                                                captionId={item.id}
                                                initialScore={score}
                                                userVote={userVote}
                                                isLoggedIn={!!user}
                                            />
                                            <time className="text-[11px] text-gray-400">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </time>
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </section>
            </div>
        </main>
    );
}