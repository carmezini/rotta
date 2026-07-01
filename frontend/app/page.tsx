"use client";

import { useEffect, useState } from "react";

type Goal = {
    id: string;
    user_id: string;
    name: string;
    description: string;
    type: "limit" | "streak" | "accumulate";
    target_value: number;
    current_value: number;
    period: "daily" | "weekly" | "monthly" | "none";
    start_date: string;
    end_date?: string;
    created_at: string;
    updated_at: string;
};

type CheckIn = {
    id: string;
    goal_id: string;
    value: number;
    notes?: string;
    timestamp: string;
};

const API_BASE = "http://localhost:8080/api";
const USER_ID = "1"; // Default test user

export default function Home() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [filterType, setFilterType] = useState<"all" | "limit" | "streak" | "accumulate">("all");

    // Modal state
    const [activeModal, setActiveModal] = useState<"create" | "edit" | "checkin" | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

    // Goal Form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"limit" | "streak" | "accumulate">("accumulate");
    const [targetValue, setTargetValue] = useState(1);
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "none">("daily");

    // CheckIn Form fields
    const [checkInValue, setCheckInValue] = useState(1);
    const [checkInNotes, setCheckInNotes] = useState("");

    // CheckIn Log storage
    const [checkInLogs, setCheckInLogs] = useState<Record<string, CheckIn[]>>({});
    const [loadingLogsGoalId, setLoadingLogsGoalId] = useState<string | null>(null);
    const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

    // Fetch initial goals
    const fetchGoals = async () => {
        const res = await fetch(`${API_BASE}/goals?user_id=${USER_ID}`);
        if (!res.ok) {
            throw new Error("Não foi possível conectar ao servidor backend.");
        }
        return res.json();
    };

    useEffect(() => {
        fetchGoals()
            .then((data) => {
                setGoals(data || []);
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "Erro ao carregar metas.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Fetch check-ins for a goal
    const fetchCheckIns = async (goalId: string) => {
        try {
            setLoadingLogsGoalId(goalId);
            const res = await fetch(`${API_BASE}/goals/${goalId}/checkins`);
            if (res.ok) {
                const data = await res.json();
                setCheckInLogs((prev) => ({ ...prev, [goalId]: data || [] }));
            }
        } catch (err) {
            console.error("Erro ao buscar logs:", err);
        } finally {
            setLoadingLogsGoalId(null);
        }
    };

    const toggleHistory = (goalId: string) => {
        if (expandedGoalId === goalId) {
            setExpandedGoalId(null);
        } else {
            setExpandedGoalId(goalId);
            if (!checkInLogs[goalId]) {
                fetchCheckIns(goalId);
            }
        }
    };

    // Actions
    const handleOpenCreate = () => {
        setName("");
        setDescription("");
        setType("accumulate");
        setTargetValue(1);
        setPeriod("daily");
        setActiveModal("create");
    };

    const handleOpenEdit = (goal: Goal) => {
        setSelectedGoal(goal);
        setName(goal.name);
        setDescription(goal.description);
        setType(goal.type);
        setTargetValue(goal.target_value);
        setPeriod(goal.period);
        setActiveModal("edit");
    };

    const handleOpenCheckIn = (goal: Goal) => {
        setSelectedGoal(goal);
        setCheckInValue(1);
        setCheckInNotes("");
        setActiveModal("checkin");
    };

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/goals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: USER_ID,
                    name,
                    description,
                    type,
                    target_value: Number(targetValue),
                    period,
                }),
            });
            if (!res.ok) throw new Error("Erro ao criar meta.");
            const newGoal = await res.json();
            setGoals((prev) => [...prev, newGoal]);
            setActiveModal(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao criar meta.");
        }
    };

    const handleUpdateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoal) return;
        try {
            const res = await fetch(`${API_BASE}/goals/${selectedGoal.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    target_value: Number(targetValue),
                    period,
                }),
            });
            if (!res.ok) throw new Error("Erro ao atualizar meta.");
            const updatedGoal = await res.json();
            setGoals((prev) => prev.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
            setActiveModal(null);
            setSelectedGoal(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao atualizar meta.");
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        if (!confirm("Tem certeza que deseja deletar esta meta?")) return;
        try {
            const res = await fetch(`${API_BASE}/goals/${goalId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Erro ao deletar meta.");
            setGoals((prev) => prev.filter((g) => g.id !== goalId));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao deletar meta.");
        }
    };

    const handleAddCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoal) return;
        try {
            const res = await fetch(`${API_BASE}/goals/${selectedGoal.id}/checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    value: Number(checkInValue),
                    notes: checkInNotes || undefined,
                }),
            });
            if (!res.ok) throw new Error("Erro ao registrar check-in.");

            // Refresh goals from backend or update state directly
            // Backend returns: {"checkin": {...}, "current_value": X, "target_value": Y}
            const result = await res.json();

            setGoals((prev) =>
                prev.map((g) =>
                    g.id === selectedGoal.id
                        ? { ...g, current_value: result.current_value }
                        : g
                )
            );

            // Refresh logs list for this goal if it is cached
            if (checkInLogs[selectedGoal.id]) {
                fetchCheckIns(selectedGoal.id);
            }

            setActiveModal(null);
            setSelectedGoal(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao registrar check-in.");
        }
    };

    const getGoalTypeColor = (type: Goal["type"]) => {
        switch (type) {
            case "limit":
                return "bg-primary-blue";
            case "streak":
                return "bg-primary-yellow";
            case "accumulate":
                return "bg-primary-green";
            default:
                return "bg-white";
        }
    };

    const getGoalTypeLabel = (type: Goal["type"]) => {
        switch (type) {
            case "limit":
                return "Limite ⛔";
            case "streak":
                return "Streak 🔥";
            case "accumulate":
                return "Acumular 📈";
        }
    };

    const getPeriodLabel = (period: Goal["period"]) => {
        switch (period) {
            case "daily":
                return "Diário";
            case "weekly":
                return "Semanal";
            case "monthly":
                return "Mensal";
            case "none":
                return "Sem prazo";
        }
    };

    const filteredGoals = goals.filter((g) => filterType === "all" || g.type === filterType);

    return (
        <div className="min-h-screen bg-[#A5B4FB] font-sans flex items-start justify-center py-4 px-2 sm:py-8 sm:px-4">
            {/* Mobile Device Frame Mockup */}
            <main className="w-full max-w-md bg-white rounded-[32px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col min-h-[90vh]">

                {/* App Sticky Header */}
                <header className="bg-primary-purple text-white p-6 border-b-4 border-black flex flex-col gap-2 relative">
                    {/* Visual Retro Header Buttons */}
                    <div className="flex gap-1.5 absolute top-4 right-4">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-black bg-primary-red" />
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-black bg-primary-yellow" />
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-black bg-primary-green" />
                    </div>

                    <h1 className="text-3xl font-black text-center tracking-tight text-black select-none">
                        ROTTA
                    </h1>

                    {/* Quick Stats Panel */}
                    <div className="mt-4 bg-black text-white p-3 border-2 border-white rounded-xl flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                        <div className="text-center flex-1 border-r border-zinc-800">
                            <span className="block text-2xl font-black text-primary-yellow">
                                {goals.length}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-zinc-400">Total</span>
                        </div>
                        <div className="text-center flex-1 border-r border-zinc-800">
                            <span className="block text-2xl font-black text-primary-green">
                                {goals.filter((g) => g.current_value >= g.target_value).length}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-zinc-400">Concluídas</span>
                        </div>
                        <div className="text-center flex-1">
                            <span className="block text-2xl font-black text-primary-blue">
                                {goals.filter((g) => g.type === "streak" && g.current_value > 0).length}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-zinc-400">Streaks</span>
                        </div>
                    </div>
                </header>

                {/* Tab Filtering & Add Controls */}
                <div className="p-4 bg-zinc-50 border-b-4 border-black flex flex-col gap-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {(["all", "limit", "streak", "accumulate"] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 text-xs font-black border-2 border-black rounded-lg whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${filterType === type
                                    ? "bg-primary-pink text-black"
                                    : "bg-white text-zinc-700"
                                    }`}
                            >
                                {type === "all" ? "Todas" : getGoalTypeLabel(type).split(" ")[0]}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleOpenCreate}
                        className="w-full bg-[#A6FAFF] text-black font-black border-3 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#79F7FF] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none rounded-xl flex items-center justify-center gap-2"
                    >
                        <span>CRIAR NOVA META ➕</span>
                    </button>
                </div>

                {/* Goals Scrollable Content */}
                <div className="flex-1 p-4 overflow-y-auto space-y-5 bg-zinc-50">
                    {loading && (
                        <div className="py-12 text-center">
                            <div className="animate-spin inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full mb-3" />
                            <p className="font-bold text-black text-sm">Carregando suas metas...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-primary-red border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <p className="font-black text-black">Erro: {error}</p>
                            <button
                                onClick={() => {
                                    setLoading(true);
                                    setError(null);
                                    fetchGoals()
                                        .then((data) => {
                                            setGoals(data || []);
                                        })
                                        .catch((err) => {
                                            setError(err instanceof Error ? err.message : "Erro ao carregar metas.");
                                        })
                                        .finally(() => {
                                            setLoading(false);
                                        });
                                }}
                                className="mt-2 text-xs font-bold underline text-black hover:text-white"
                            >
                                Tentar novamente 🔄
                            </button>
                        </div>
                    )}

                    {!loading && !error && filteredGoals.length === 0 && (
                        <div className="py-12 px-4 text-center border-4 border-dashed border-zinc-400 rounded-2xl bg-white">
                            <p className="text-lg font-black text-zinc-400 mb-2">Nenhuma meta por aqui! 📭</p>
                            <p className="text-xs text-zinc-500 font-medium">
                                Toque no botão acima para adicionar sua primeira meta.
                            </p>
                        </div>
                    )}

                    {!loading && !error && filteredGoals.map((goal) => {
                        const progressPercent = Math.min((goal.current_value / goal.target_value) * 100, 100);
                        const isCompleted = goal.current_value >= goal.target_value;

                        return (
                            <div
                                key={goal.id}
                                className="bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
                            >
                                {/* Card Header with Type Badge */}
                                <div className={`p-4 border-b-3 border-black flex justify-between items-start gap-2 ${getGoalTypeColor(goal.type)}`}>
                                    <div>
                                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border-2 border-black bg-white rounded-full text-black mb-1.5">
                                            {getGoalTypeLabel(goal.type)}
                                        </span>
                                        <h2 className="text-xl font-black text-black tracking-tight line-clamp-1">{goal.name}</h2>
                                    </div>
                                    <span className="text-xs font-black px-2 py-1 bg-black text-white border-2 border-black rounded-md">
                                        {getPeriodLabel(goal.period)}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="p-4 flex-1 flex flex-col gap-3">
                                    {goal.description && (
                                        <p className="text-xs font-bold text-zinc-700 bg-zinc-100 border border-zinc-300 p-2.5 rounded-lg line-clamp-2">
                                            {goal.description}
                                        </p>
                                    )}

                                    {/* Progress numbers */}
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] uppercase font-black text-zinc-400">Progresso</span>
                                        <span className="text-xl font-black text-black">
                                            {goal.current_value} <span className="text-sm font-bold text-zinc-500">/ {goal.target_value}</span>
                                        </span>
                                    </div>

                                    {/* Neo-brutalist Progress Bar */}
                                    <div className="h-5 w-full bg-zinc-200 border-2 border-black rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative">
                                        <div
                                            className={`h-full border-r-2 border-black transition-all duration-500 ${isCompleted ? "bg-primary-green" : "bg-primary-pink"
                                                }`}
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                        {isCompleted && (
                                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-black uppercase tracking-wider">
                                                Meta Batida! 🎉
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons inside Card */}
                                    <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-200">
                                        <button
                                            onClick={() => handleOpenCheckIn(goal)}
                                            className="flex-1 bg-primary-green text-black font-black border-2 border-black py-2 rounded-lg text-xs tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#6cb07b] transition-all flex items-center justify-center gap-1"
                                        >
                                            <span>CHECK-IN 👍</span>
                                        </button>

                                        <button
                                            onClick={() => toggleHistory(goal.id)}
                                            className="bg-white text-black font-bold border-2 border-black p-2 rounded-lg text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-zinc-100 transition-all flex items-center justify-center"
                                            title="Histórico"
                                        >
                                            <span>📜</span>
                                        </button>

                                        <button
                                            onClick={() => handleOpenEdit(goal)}
                                            className="bg-white text-black font-bold border-2 border-black p-2 rounded-lg text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-zinc-100 transition-all flex items-center justify-center"
                                            title="Editar"
                                        >
                                            <span>✏️</span>
                                        </button>

                                        <button
                                            onClick={() => handleDeleteGoal(goal.id)}
                                            className="bg-primary-red text-white font-bold border-2 border-black p-2 rounded-lg text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-red-500 transition-all flex items-center justify-center"
                                            title="Excluir"
                                        >
                                            <span>🗑️</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Collapsible History / Check-in Logs */}
                                {expandedGoalId === goal.id && (
                                    <div className="bg-zinc-100 border-t-2 border-black p-3 space-y-2 text-xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-black text-black uppercase tracking-wider">Histórico de Check-ins</span>
                                            {loadingLogsGoalId === goal.id && (
                                                <span className="animate-pulse font-bold text-zinc-500">Buscando...</span>
                                            )}
                                        </div>

                                        {checkInLogs[goal.id] && checkInLogs[goal.id].length === 0 && (
                                            <p className="text-zinc-500 py-2 text-center font-bold">Nenhum check-in ainda.</p>
                                        )}

                                        {checkInLogs[goal.id] && (
                                            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                                {checkInLogs[goal.id].map((log) => (
                                                    <div
                                                        key={log.id}
                                                        className="bg-white border-2 border-black p-2 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                                    >
                                                        <div className="flex justify-between font-bold text-black">
                                                            <span>+{log.value} unidades</span>
                                                            <span className="text-[10px] text-zinc-500">
                                                                {new Date(log.timestamp).toLocaleDateString("pt-BR", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                })}
                                                            </span>
                                                        </div>
                                                        {log.notes && (
                                                            <p className="text-zinc-600 mt-1 font-semibold border-t border-zinc-200 pt-1">
                                                                {log.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* MODALS / OVERLAYS */}
            {activeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-black rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">

                        {/* Modal Header */}
                        <div className={`p-4 border-b-4 border-black flex justify-between items-center ${activeModal === "create" ? "bg-primary-blue" : activeModal === "edit" ? "bg-primary-pink" : "bg-primary-green"
                            }`}>
                            <h3 className="font-black text-xl text-black">
                                {activeModal === "create" && "Nova Meta ✨"}
                                {activeModal === "edit" && "Editar Meta ✏️"}
                                {activeModal === "checkin" && "Registrar Progresso 👍"}
                            </h3>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="w-8 h-8 rounded-full border-2 border-black bg-white text-black hover:bg-zinc-100 flex items-center justify-center font-black text-sm active:translate-y-0.5 active:translate-x-0.5"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Forms */}
                        <div className="p-5">
                            {/* Create / Edit Form */}
                            {(activeModal === "create" || activeModal === "edit") && (
                                <form onSubmit={activeModal === "create" ? handleCreateGoal : handleUpdateGoal} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-black mb-1">Nome da Meta</label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: Treinar, Beber água"
                                            className="w-full bg-white border-2 border-black rounded-lg p-2.5 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-black"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-black mb-1">Descrição</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Descreva o hábito ou limite..."
                                            className="w-full bg-white border-2 border-black rounded-lg p-2.5 text-sm font-bold text-black outline-none h-16 resize-none focus:ring-2 focus:ring-black"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-black uppercase text-black mb-1">Tipo</label>
                                            <select
                                                value={type}
                                                disabled={activeModal === "edit"}
                                                onChange={(e) => setType(e.target.value as Goal["type"])}
                                                className="w-full bg-white border-2 border-black rounded-lg p-2.5 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                                            >
                                                <option value="accumulate">Acumular 📈</option>
                                                <option value="limit">Limite ⛔</option>
                                                <option value="streak">Streak 🔥</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black uppercase text-black mb-1">Período</label>
                                            <select
                                                value={period}
                                                onChange={(e) => setPeriod(e.target.value as Goal["period"])}
                                                className="w-full bg-white border-2 border-black rounded-lg p-2.5 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-black"
                                            >
                                                <option value="daily">Diário</option>
                                                <option value="weekly">Semanal</option>
                                                <option value="monthly">Mensal</option>
                                                <option value="none">Sem limite</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-black mb-1">
                                            {type === "limit" ? "Valor Limite Máximo" : "Valor Alvo / Meta"}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            value={targetValue}
                                            onChange={(e) => setTargetValue(Number(e.target.value))}
                                            className="w-full bg-white border-2 border-black rounded-lg p-2.5 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-black"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-primary-pink text-black font-black border-3 border-black p-3 rounded-lg text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all mt-6 uppercase tracking-wider"
                                    >
                                        {activeModal === "create" ? "Criar Meta 🏁" : "Salvar Alterações 💾"}
                                    </button>
                                </form>
                            )}

                            {/* Check-In Form */}
                            {activeModal === "checkin" && selectedGoal && (
                                <form onSubmit={handleAddCheckIn} className="space-y-4">
                                    <div className="bg-zinc-100 border-2 border-black p-3.5 rounded-xl mb-4">
                                        <p className="text-xs font-black text-zinc-500 uppercase">Meta Selecionada</p>
                                        <p className="text-base font-black text-black">{selectedGoal.name}</p>
                                        <p className="text-xs text-zinc-600 font-semibold mt-1">
                                            Progresso Atual: {selectedGoal.current_value} / {selectedGoal.target_value}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-black mb-1">Valor do Progresso</label>
                                        <input
                                            type="number"
                                            required
                                            min={0.1}
                                            step="any"
                                            value={checkInValue}
                                            onChange={(e) => setCheckInValue(Number(e.target.value))}
                                            className="w-full bg-white border-2 border-black rounded-lg p-2.5 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-black"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-black mb-1">Notas / Observações</label>
                                        <textarea
                                            value={checkInNotes}
                                            onChange={(e) => setCheckInNotes(e.target.value)}
                                            placeholder="Ex: Treinei perna forte hoje, bebi 500ml..."
                                            className="w-full bg-white border-2 border-black rounded-lg p-2.5 text-sm font-bold text-black outline-none h-20 resize-none focus:ring-2 focus:ring-black"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-primary-green text-black font-black border-3 border-black p-3 rounded-lg text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all mt-6 uppercase tracking-wider"
                                    >
                                        Registrar Check-In 🚀
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

