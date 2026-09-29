"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
    fetchCycles,
    fetchAssignments,
    assignReviewers,
    deleteAssignment,
    deleteCycle,
    fetchTargetReport,
} from "@/src/services/feedback360-service";
import { fetchAllUsers } from "@/src/services/user-service";
import CreateFeedbackCycleModal from "./CreateFeedbackCycleModal";

export default function FeedbackAssignmentManager() {
    const t = useTranslations("Feedback360");
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState<any>(null);
    useEffect(() => {
        const u = localStorage.getItem("user");
        if (u) {
            try {
                setCurrentUser(JSON.parse(u));
            } catch (e) {}
        }
    }, []);

    const [cycles, setCycles] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [selectedTargetId, setSelectedTargetId] = useState("");
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editCycleData, setEditCycleData] = useState<any>(null);

    const [newReviewerId, setNewReviewerId] = useState("");
    const [newReviewerType, setNewReviewerType] = useState("PEER");
    const [globalAssignments, setGlobalAssignments] = useState<any[]>([]);

    const [reportModalData, setReportModalData] = useState<any>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    const loadInitialData = async () => {
        try {
            const storedUser = localStorage.getItem("user");
            let currentUserId = "";
            let currentUserEmpId = "";
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    currentUserId = parsed.id;
                    currentUserEmpId = parsed.employee?.id;
                } catch (e) {}
            }

            const [cyclesData, usersData] = await Promise.all([
                fetchCycles(),
                fetchAllUsers(),
            ]);
            setCycles(cyclesData || []);

            const validUsers = (usersData || []).filter(
                (u: any) =>
                    u.employee &&
                    u.role !== "SUPER_ADMIN" &&
                    u.role !== "DIRECTOR" &&
                    u.role !== "HR_ADMIN" &&
                    u.id !== currentUserId &&
                    u.employee?.id !== currentUserEmpId,
            );
            setUsers(validUsers);

            if (cyclesData?.length > 0 && !selectedCycleId) {
                setSelectedCycleId(cyclesData[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedCycleId) {
            loadGlobalAssignments();
        } else {
            setGlobalAssignments([]);
        }
    }, [selectedCycleId]);

    const loadGlobalAssignments = async () => {
        try {
            const data = await fetchAssignments(selectedCycleId);
            setGlobalAssignments(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (selectedCycleId && selectedTargetId) {
            loadAssignments();
        } else {
            setAssignments([]);
        }
    }, [selectedCycleId, selectedTargetId]);

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const data = await fetchAssignments(selectedCycleId, selectedTargetId);
            const mapped = data.map((item: any) => ({
                reviewerId: item.reviewer.id,
                type: item.type,
                reviewerName: `${item.reviewer.firstName} ${item.reviewer.lastName}`,
                department: item.reviewer.department?.name || "-",
                position: item.reviewer.position?.title || "-",
            }));
            setAssignments(mapped);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const leaderboard = useMemo(() => {
        const completedAssignments = globalAssignments.filter(
            (a: any) => a.isCompleted && a.answers && a.answers.length > 0,
        );

        const targetMap: Record<
            string,
            {
                target: any;
                totalScore: number;
                answersCount: number;
                reviewsCount: number;
            }
        > = {};

        completedAssignments.forEach((asg: any) => {
            if (!asg.target) return;
            const tId = asg.target.id;
            if (!targetMap[tId]) {
                targetMap[tId] = {
                    target: asg.target,
                    totalScore: 0,
                    answersCount: 0,
                    reviewsCount: 0,
                };
            }
            targetMap[tId].reviewsCount += 1;
            (asg.answers || []).forEach((ans: any) => {
                targetMap[tId].totalScore += ans.score;
                targetMap[tId].answersCount += 1;
            });
        });

        return Object.values(targetMap)
            .map((item) => {
                const avgScore =
                    item.answersCount > 0
                        ? Number((item.totalScore / item.answersCount).toFixed(2))
                        : 0;
                return {
                    employeeId: item.target.id,
                    firstName: item.target.firstName,
                    lastName: item.target.lastName,
                    department: item.target.department?.name || "-",
                    position: item.target.position?.title || "-",
                    averageScore: avgScore,
                    reviewsCount: item.reviewsCount,
                };
            })
            .sort((a, b) => b.averageScore - a.averageScore)
            .map((item, idx) => ({
                rank: idx + 1,
                ...item,
            }));
    }, [globalAssignments]);

    const handleAddReviewer = () => {
        if (!newReviewerId) return;

        if (newReviewerId === selectedTargetId && newReviewerType !== "SELF") {
            showToast(t("cannotAssignSelfAsPeer") || "O'zingizni baholovchi qilib qo'sha olmaysiz", "error");
            return;
        }

        const exists = assignments.some((a) => a.reviewerId === newReviewerId);
        if (exists) {
            showToast(t("reviewerAlreadyAssigned") || "Bu baholovchi allaqachon biriktirilgan", "error");
            return;
        }

        const reviewerUser = users.find((u) => u.employee.id === newReviewerId);
        if (!reviewerUser) return;

        setAssignments([
            ...assignments,
            {
                reviewerId: newReviewerId,
                type: newReviewerType,
                reviewerName: `${reviewerUser.employee.firstName} ${reviewerUser.employee.lastName}`,
                department: reviewerUser.employee.department?.name || "-",
                position: reviewerUser.employee.position?.title || "-",
            },
        ]);

        setNewReviewerId("");
    };

    const handleRemoveReviewer = (reviewerId: string) => {
        setAssignments(assignments.filter((a) => a.reviewerId !== reviewerId));
    };

    const handleSaveAssignments = async () => {
        if (!selectedCycleId || !selectedTargetId) return;

        setSaving(true);
        try {
            await assignReviewers(
                selectedCycleId,
                selectedTargetId,
                assignments.map((a) => ({
                    reviewerId: a.reviewerId,
                    type: a.type,
                })),
            );
            showToast(t("successSave") || "Muvaffaqiyatli saqlandi!");
            loadAssignments();
            loadGlobalAssignments();
        } catch (err) {
            console.error(err);
            showToast(t("errorDefault") || "Xatolik yuz berdi", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCycle = async () => {
        if (!selectedCycleId) return;
        setDeleting(true);
        try {
            await deleteCycle(selectedCycleId);
            setSelectedCycleId("");
            loadInitialData();
            showToast("Sikl muvaffaqiyatli o'chirildi!");
            setIsDeleteModalOpen(false);
        } catch (err) {
            console.error(err);
            showToast("Siklni o'chirishda xatolik yuz berdi", "error");
        } finally {
            setDeleting(false);
        }
    };

    const handleConfirmDeleteAssignment = async () => {
        if (!deleteAssignmentId) return;
        try {
            await deleteAssignment(deleteAssignmentId);
            setGlobalAssignments(globalAssignments.filter((g: any) => g.id !== deleteAssignmentId));
            showToast("Biriktirish bekor qilindi!");
            setDeleteAssignmentId(null);
        } catch (err) {
            console.error(err);
            showToast("Xatolik yuz berdi", "error");
        }
    };

    const handleEditCycle = () => {
        if (!selectedCycleId) return;
        const cycleToEdit = cycles.find((c) => c.id === selectedCycleId);
        if (cycleToEdit) {
            setEditCycleData(cycleToEdit);
            setIsCreateModalOpen(true);
        }
    };

    const handleOpenReport = async (employeeId: string) => {
        setReportLoading(true);
        try {
            const report = await fetchTargetReport(employeeId, selectedCycleId);
            setReportModalData(report);
        } catch (err) {
            console.error(err);
            showToast("Hisobotni yuklashda xatolik yuz berdi", "error");
        } finally {
            setReportLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                    <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900">
                        {t("title")}
                    </h2>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-1">
                        {cycles.find((c) => c.id === selectedCycleId)?.title || t("selectCycle")}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditCycleData(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="bg-[#9327FF] text-white px-5 py-2.5 font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm hover:opacity-90 transition-all self-start sm:self-auto cursor-pointer"
                >
                    {t("createNewCycle") || "+ Yangi Sikl"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t("selectCycle")}
                    </label>
                    <div className="flex items-center gap-3 w-full">
                        <select
                            value={selectedCycleId}
                            onChange={(e) => setSelectedCycleId(e.target.value)}
                            className="flex-1 w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 px-4 py-2.5 outline-none bg-white transition-all text-sm font-medium text-gray-800"
                        >
                            <option value="">{t("selectCycleOption")}</option>
                            {cycles.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.title} ({c.status || "ACTIVE"})
                                </option>
                            ))}
                        </select>
                        {selectedCycleId && (
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={handleEditCycle}
                                    className="p-2.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all cursor-pointer"
                                    title="Tahrirlash"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                    title="O'chirish"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t("selectTarget")}
                    </label>
                    <select
                        value={selectedTargetId}
                        onChange={(e) => setSelectedTargetId(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 px-4 py-2.5 outline-none bg-white transition-all text-sm font-medium text-gray-800"
                    >
                        <option value="">{t("selectTargetOption")}</option>
                        {users.map((u) => (
                            <option key={u.employee.id} value={u.employee.id}>
                                {u.employee.firstName} {u.employee.lastName} ({u.email})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedCycleId && (
                <div className="flex flex-col gap-4 p-6 bg-gray-50/60 border border-gray-100 rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200/60">
                        <div>
                            <h3 className="text-base font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                                <span>🏆</span>
                                <span>{t("leaderboardTitle")}</span>
                            </h3>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                                {t("leaderboardSubtitle")}
                            </p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-xs">
                            {leaderboard.length} ta baholangan xodim
                        </span>
                    </div>

                    {leaderboard.length === 0 ? (
                        <div className="py-8 text-center text-xs font-medium uppercase tracking-wider text-gray-400 bg-white border border-dashed border-gray-200 p-6 rounded-xl">
                            {t("noLeaderboardData")}
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white border border-gray-100 rounded-xl shadow-xs">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                                        <th className="p-4 w-24 text-center">{t("rank")}</th>
                                        <th className="p-4">{t("employee")}</th>
                                        <th className="p-4">{t("tableDept")}</th>
                                        <th className="p-4">{t("tablePosition")}</th>
                                        <th className="p-4 text-center">{t("averageScore")}</th>
                                        <th className="p-4 text-center">{t("reviewsCount")}</th>
                                        <th className="p-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {leaderboard.map((item) => {
                                        const isFirst = item.rank === 1;
                                        const isSecond = item.rank === 2;
                                        const isThird = item.rank === 3;

                                        return (
                                            <tr
                                                key={item.employeeId}
                                                className={`transition-colors hover:bg-gray-50/80 ${
                                                    isFirst ? "bg-amber-50/40" : ""
                                                }`}
                                            >
                                                <td className="p-4 text-center whitespace-nowrap">
                                                    {isFirst ? (
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-black font-black text-xs shadow-xs">
                                                            🥇 1
                                                        </span>
                                                    ) : isSecond ? (
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black text-xs shadow-xs">
                                                            🥈 2
                                                        </span>
                                                    ) : isThird ? (
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/80 text-white font-black text-xs shadow-xs">
                                                            🥉 3
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
                                                            {item.rank}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 font-bold text-gray-900 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
                                                            {item.firstName[0]}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900">
                                                                {item.firstName} {item.lastName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-medium text-gray-600">
                                                    {item.department}
                                                </td>
                                                <td className="p-4 font-medium text-gray-600">
                                                    {item.position}
                                                </td>
                                                <td className="p-4 text-center whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                                                        <span>★</span>
                                                        <span>{item.averageScore.toFixed(2)} / 5.0</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center font-semibold text-gray-700">
                                                    {item.reviewsCount} ta baho
                                                </td>
                                                <td className="p-4 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleOpenReport(item.employeeId)}
                                                        className="px-3.5 py-1.5 bg-[#9327FF] text-white hover:opacity-90 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
                                                    >
                                                        {t("viewReport")}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {selectedCycleId && selectedTargetId && (
                <div className="flex flex-col gap-6 pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-bold uppercase tracking-wider text-gray-900">
                        {t("assignedReviewers")}
                    </h3>

                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {t("selectReviewer")}
                            </label>
                            <select
                                value={newReviewerId}
                                onChange={(e) => setNewReviewerId(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-gray-800"
                            >
                                <option value="">{t("selectReviewerOption")}</option>
                                {users.map((u) => (
                                    <option key={u.employee.id} value={u.employee.id}>
                                        {u.employee.firstName} {u.employee.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-56">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {t("role")}
                            </label>
                            <select
                                value={newReviewerType}
                                onChange={(e) => setNewReviewerType(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-gray-800"
                            >
                                <option value="PEER">{t("rolePeer")}</option>
                                <option value="MANAGER">{t("roleManager")}</option>
                                <option value="SUBORDINATE">{t("roleSubordinate")}</option>
                                <option value="SELF">{t("roleSelf")}</option>
                            </select>
                        </div>
                        <button
                            onClick={handleAddReviewer}
                            className="bg-[#9327FF] text-white px-6 py-2.5 font-bold uppercase tracking-wider text-xs rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                        >
                            {t("add")}
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-sm font-semibold uppercase text-gray-500 tracking-wider py-8 text-center">
                            {t("loading")}
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="text-sm font-medium uppercase text-gray-400 tracking-wider py-8 text-center border border-dashed border-gray-200 rounded-xl">
                            {t("noReviewers")}
                        </div>
                    ) : (
                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 text-gray-500 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-100">
                                        <th className="p-4">{t("tableReviewer")}</th>
                                        <th className="p-4">{t("tableRole")}</th>
                                        <th className="p-4">{t("tableDept")}</th>
                                        <th className="p-4">{t("tablePosition")}</th>
                                        <th className="p-4 w-24"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {assignments.map((a) => (
                                        <tr key={a.reviewerId} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="p-4 font-bold text-gray-900">
                                                {a.reviewerName}
                                            </td>
                                            <td className="p-4 font-semibold text-violet-700">
                                                <span className="bg-violet-50 px-2.5 py-1 rounded-md">
                                                    {t(`role${a.type.charAt(0) + a.type.slice(1).toLowerCase()}`)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {a.department}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {a.position}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveReviewer(a.reviewerId)}
                                                    className="text-xs font-bold text-red-500 uppercase tracking-wider hover:text-red-700 cursor-pointer"
                                                >
                                                    {t("remove")}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSaveAssignments}
                            disabled={saving || loading}
                            className="bg-[#9327FF] text-white px-8 py-3 font-bold uppercase tracking-wider text-xs rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                        >
                            {saving ? t("saving") : t("saveChanges")}
                        </button>
                    </div>
                </div>
            )}

            {selectedCycleId && (
                <div className="flex flex-col gap-6 pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-bold uppercase tracking-wider text-gray-900">
                        {t("allAssignments") || "Barcha biriktirilganlar (Sikl bo'yicha)"}
                    </h3>

                    {globalAssignments.length === 0 ? (
                        <div className="text-sm font-medium uppercase text-gray-400 tracking-wider py-8 text-center border border-dashed border-gray-200 rounded-xl">
                            {t("noAssignmentsGlobal") || "Hali hech kim biriktirilmagan."}
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white border border-gray-100 rounded-xl shadow-xs">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                                        <th className="p-4">{t("colTarget")}</th>
                                        <th className="p-4">{t("colReviewer")}</th>
                                        <th className="p-4">{t("colRole")}</th>
                                        <th className="p-4">{t("colDepartment")}</th>
                                        <th className="p-4">{t("colPosition")}</th>
                                        <th className="p-4">{t("colStatus") || "Holati"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {globalAssignments.map((a: any) => (
                                        <tr key={a.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="p-4 font-bold text-gray-900">
                                                {a.target?.firstName} {a.target?.lastName}
                                            </td>
                                            <td className="p-4 font-bold text-gray-900">
                                                {a.reviewer?.firstName} {a.reviewer?.lastName}
                                            </td>
                                            <td className="p-4 text-gray-600 font-medium">
                                                {a.type === "PEER" ? t("rolePeer") :
                                                 a.type === "MANAGER" ? t("roleManager") :
                                                 a.type === "SUBORDINATE" ? t("roleSubordinate") :
                                                 a.type === "SELF" ? t("roleSelf") : a.type}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {a.reviewer?.department?.name || "-"}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {a.reviewer?.position?.title || "-"}
                                            </td>
                                            <td className="p-4">
                                                {a.isCompleted ? (
                                                    <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                                                        {t("statusCompleted") || "Bajarildi"}
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-amber-700 font-bold uppercase tracking-wider text-[10px] bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                                                            {t("statusPending") || "Kutilmoqda"}
                                                        </span>
                                                        {currentUser?.employee?.id === a.reviewerId && (
                                                            <button
                                                                onClick={() => {
                                                                    const locale = window.location.pathname.split("/")[1] || "uz";
                                                                    router.push(`/${locale}/evaluate/${a.id}`);
                                                                }}
                                                                className="text-[11px] font-bold uppercase tracking-wider bg-[#9327FF] text-white px-3 py-1 rounded-lg hover:opacity-90 transition-all shadow-xs cursor-pointer"
                                                            >
                                                                {t("evaluateButton") || "Baholash"}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setDeleteAssignmentId(a.id)}
                                                            className="text-[11px] font-semibold uppercase tracking-wider text-red-500 hover:text-red-700 cursor-pointer"
                                                        >
                                                            Bekor qilish
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {isCreateModalOpen && (
                <CreateFeedbackCycleModal
                    initialData={editCycleData}
                    showToast={showToast}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={(isEdit?: boolean) => {
                        setIsCreateModalOpen(false);
                        loadInitialData();
                        showToast(isEdit ? "Sikl muvaffaqiyatli yangilandi!" : "Sikl muvaffaqiyatli yaratildi!");
                    }}
                />
            )}

            {reportModalData && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                            <div>
                                <h3 className="text-lg font-bold uppercase tracking-wider text-gray-900">
                                    {reportModalData.employee?.firstName} {reportModalData.employee?.lastName} — 360 Hisoboti
                                </h3>
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                                    {reportModalData.employee?.department || "-"} • {reportModalData.employee?.position || "-"}
                                </p>
                            </div>
                            <button
                                onClick={() => setReportModalData(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-4 bg-gray-50/80 p-5 rounded-xl border border-gray-100">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                        Baholar Soni
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {reportModalData.totalRespondents} ta
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                        Umumiy O'rtacha
                                    </span>
                                    <span className="text-2xl font-bold text-emerald-600">
                                        {reportModalData.competencies?.length > 0
                                            ? (reportModalData.competencies.reduce((acc: any, curr: any) => acc + curr.averageScore, 0) / reportModalData.competencies.length).toFixed(2)
                                            : 0} / 5.0
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                                    Kompetensiyalar bo'yicha natijalar:
                                </h4>
                                <div className="space-y-3">
                                    {reportModalData.competencies?.map((comp: any) => (
                                        <div key={comp.competency} className="p-4 bg-gray-50/60 border border-gray-100 rounded-xl">
                                            <div className="flex justify-between items-center text-xs font-bold mb-2">
                                                <span className="text-gray-800 uppercase tracking-wider">{comp.competency}</span>
                                                <span className="text-emerald-700 font-bold">{comp.averageScore} / 5.0</span>
                                            </div>
                                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-[#9327FF] h-full rounded-full transition-all"
                                                    style={{ width: `${(comp.averageScore / 5) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {reportModalData.anonymousComments?.length > 0 && (
                                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                                        Anonim Izohlar:
                                    </h4>
                                    <div className="space-y-2">
                                        {reportModalData.anonymousComments.map((comment: string, idx: number) => (
                                            <div key={idx} className="p-3.5 bg-amber-50/60 border border-amber-100 text-xs italic text-gray-700 rounded-xl">
                                                "{comment}"
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-center gap-3 transform transition-all duration-300 animate-in fade-in slide-in-from-top-4">
                    {toast.type === "error" ? (
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900">
                            {toast.message}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs ml-2 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-100">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Siklni o'chirish
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Haqiqatan ham bu siklni o'chirmoqchimisiz? Barcha biriktirishlar o'chib ketishi mumkin!
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={deleting}
                                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteCycle}
                                disabled={deleting}
                                className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 shadow-sm transition-colors cursor-pointer"
                            >
                                {deleting ? "..." : "O'chirish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteAssignmentId && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-100">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Biriktirishni bekor qilish
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Haqiqatan ham bu biriktirishni bekor qilmoqchimisiz?
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setDeleteAssignmentId(null)}
                                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteAssignment}
                                className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 shadow-sm transition-colors cursor-pointer"
                            >
                                O'chirish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
