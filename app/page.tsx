import { createClient } from '@/lib/supabase/server';
import LoginButton from '@/components/LoginButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-900">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center space-y-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Assignment 3: Auth</h1>

          {user ? (
              <div className="space-y-4">
                <p className="text-sm text-green-700 bg-green-50 py-2 px-3 rounded-lg border border-green-200">
                  Signed in as: <strong className="font-semibold">{user.email}</strong>
                </p>

                <div className="flex flex-col gap-3 pt-2">
                  <Link
                      href="/profile"
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition text-center"
                  >
                    Go to Profile
                  </Link>
                  <Link
                      href="/protected"
                      className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition text-center"
                  >
                    Go to Gated Route
                  </Link>
                </div>

                <form action="/auth/signout" method="post" className="pt-2">
                  <button
                      type="submit"
                      className="text-sm text-gray-500 hover:text-red-600 underline transition"
                  >
                    Sign out
                  </button>
                </form>
              </div>
          ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Sign in with your Google account to access your profile and protected routes.
                </p>
                <div className="pt-2 flex justify-center">
                  <LoginButton />
                </div>
              </div>
          )}
        </div>
      </main>
  );
}