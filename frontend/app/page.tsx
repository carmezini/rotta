"use client";

import { useEffect, useState } from "react";

type Goal = {
    id: string;
    user_id: string;
    name: string;
    description: string;
    type: string;
    target_value: number;
    current_value: number;
    period: string;
    start_date: string;
    end_date?: string;
    created_at: string;
    updated_at: string;
};

export default function Home() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchGoals() {
            try {
                // Fetch goals for a test user from the Go backend
                const res = await fetch("http://localhost:8080/api/goals?user_id=usuario_teste_1");
                if (!res.ok) {
                    throw new Error("Falha ao buscar metas. O backend está rodando?");
                }
                const data = await res.json();
                setGoals(data || []);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Erro desconhecido ao buscar metas.");
                }
            } finally {
                setLoading(false);
            }
        }

        fetchGoals();
    }, []);

    return (
        <div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black dark:text-white">
            <main className="mx-auto max-w-4xl">
                <h1 className="mb-8 text-4xl font-bold tracking-tight">Minhas Metas</h1>

                {loading && <p className="text-zinc-500">Carregando metas do servidor...</p>}
                {error && <p className="text-red-500">Erro: {error}</p>}

                {!loading && !error && goals.length === 0 && (
                    <p className="text-zinc-500">
                        Nenhuma meta encontrada. Crie uma meta chamando a API ou adicionando dados de teste!
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {goals.map((goal) => (
                        <div
                            key={goal.id}
                            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <h2 className="mb-2 text-xl font-semibold">{goal.name}</h2>
                            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                                {goal.description}
                            </p>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Progresso:</span>
                                <span className="text-lg font-bold">
                                    {goal.current_value} / {goal.target_value}
                                </span>
                            </div>

                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{
                                        width: `${Math.min(
                                            (goal.current_value / goal.target_value) * 100,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
