'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function VoteControls({
                                         captionId,
                                         initialScore,
                                         userVote,
                                         isLoggedIn,
                                     }: {
    captionId: string;
    initialScore: number;
    userVote: number | null;
    isLoggedIn: boolean;
}) {
    const supabase = createClient();
    const [score, setScore] = useState(initialScore);
    const [currentVote, setCurrentVote] = useState<number | null>(userVote);
    const [loading, setLoading] = useState(false);

    const handleVote = async (value: 1 | -1) => {
        if (!isLoggedIn) {
            alert('You must be signed in to submit a vote.');
            return;
        }

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Mutate data: Upsert vote into votes table
        const { error } = await supabase
            .from('votes')
            .upsert(
                {
                    caption_id: captionId,
                    user_id: user.id,
                    vote_value: value,
                },
                { onConflict: 'caption_id,user_id' }
            );

        setLoading(false);

        if (!error) {
            if (currentVote === value) return;
            const difference = currentVote ? value - currentVote : value;
            setScore((prev) => prev + difference);
            setCurrentVote(value);
        } else {
            console.error('Vote mutation failed:', error.message);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                disabled={loading}
                onClick={() => handleVote(1)}
                className={`px-2.5 py-1 text-xs font-semibold rounded border transition ${
                    currentVote === 1
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
            >
                ▲ Upvote
            </button>

            <span className="text-sm font-bold min-w-6 text-center text-gray-800">
        {score}
      </span>

            <button
                disabled={loading}
                onClick={() => handleVote(-1)}
                className={`px-2.5 py-1 text-xs font-semibold rounded border transition ${
                    currentVote === -1
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
            >
                ▼ Downvote
            </button>
        </div>
    );
}