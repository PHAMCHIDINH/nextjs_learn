"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

const API_USERS_PATH = "/api/users";
const BACKEND_TARGET =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasUsers = useMemo(() => users.length > 0, [users.length]);

  const loadUsers = async () => {
    setError(null);

    try {
      const response = await fetch(API_USERS_PATH, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Cannot load users: ${response.status}`);
      }

      const data = (await response.json()) as User[];
      setUsers(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unknown error");
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_USERS_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Cannot create user: ${response.status}`);
      }

      setName("");
      setEmail("");
      await loadUsers();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 bg-zinc-50 p-6 text-zinc-900">
      <header className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Frontend to Backend test</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Proxy API: <code>{API_USERS_PATH}</code> to <code>{BACKEND_TARGET}</code>
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create user</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={handleSubmit}>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            className="rounded-lg bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Users</h2>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="rounded-lg border border-zinc-300 px-3 py-1 text-sm"
          >
            Refresh
          </button>
        </div>

        {!hasUsers ? (
          <p className="mt-4 text-sm text-zinc-500">No users yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {users.map((user) => (
              <li key={user.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                <p className="font-medium">{user.name}</p>
                <p className="text-zinc-600">{user.email}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
