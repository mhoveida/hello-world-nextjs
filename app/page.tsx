import { supabase } from '@/lib/supabase';

export const revalidate = 0;

interface Idea {
  id: number;
  title: string;
  description: string;
  category: string;
}

export default async function HomePage() {
  const { data: ideas, error } = await supabase
      .from('ideas')
      .select('*')
      .order('id', { ascending: true });

  if (error) {
    return (
        <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
          <p className="text-red-600">Error loading data: {error.message}</p>
        </main>
    );
  }

  return (
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              Project Ideas
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Live records fetched directly from Supabase Postgres
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-1">
            {ideas?.map((item: Idea) => (
                <div
                    key={item.id}
                    className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {item.category}
                </span>
                  </div>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
            ))}
          </div>
        </div>
      </main>
  );
}