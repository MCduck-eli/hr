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
            alert(t("cannotAssignSelfAsPeer"));
            return;
        }

        const exists = assignments.some((a) => a.reviewerId === newReviewerId);
        if (exists) {
            alert(t("reviewerAlreadyAssigned"));
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
            alert(t("successSave"));
            loadAssignments();
            loadGlobalAssignments();
        } catch (err) {
            console.error(err);
            alert(t("errorDefault"));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCycle = async () => {
        if (!selectedCycleId) return;
        if (!window.confirm("Haqiqatan ham bu siklni o'chirmoqchimisiz? Barcha biriktirishlar o'chib ketishi mumkin!")) return;

        try {
            await deleteCycle(selectedCycleId);
            setSelectedCycleId("");
            loadInitialData();
        } catch (err) {
            console.error(err);
            alert("Siklni o'chirishda xatolik yuz berdi");
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
            alert("Hisobotni yuklashda xatolik yuz berdi");
        } finally {
            setReportLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 bg-white border border-gray-200 p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest text-black">
                        {t("title")}
                    </h2>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">
                        {cycles.find((c) => c.id === selectedCycleId)?.title || t("selectCycle")}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditCycleData(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="bg-black text-white px-6 py-2.5 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-sm self-start sm:self-auto"
                >
                    {t("createNewCycle") || "+ Yangi Sikl"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        {t("selectCycle")}
                    </label>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedCycleId}
                            onChange={(e) => setSelectedCycleId(e.target.value)}
                            className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium flex-1 outline-none focus:border-black transition-colors"
                        >
                            <option value="">{t("selectCycleOption")}</option>
                            {cycles.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.title} ({c.status || "ACTIVE"})
                                </option>
                            ))}
                        </select>
                        {selectedCycleId && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleEditCycle}
                                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
                                    title="Tahrirlash"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                </button>
                                <button
                                    onClick={handleDeleteCycle}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="O'chirish"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        {t("selectTarget")}
                    </label>
                    <select
                        value={selectedTargetId}
                        onChange={(e) => setSelectedTargetId(e.target.value)}
                        className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium outline-none focus:border-black transition-colors"
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
                <div className="flex flex-col gap-4 mt-2 p-6 bg-gray-50/70 border border-gray-200 rounded-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200">
                        <div>
                            <h3 className="text-base font-black uppercase tracking-wider text-black flex items-center gap-2">
                                <span>🏆</span>
                                <span>{t("leaderboardTitle")}</span>
                            </h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                {t("leaderboardSubtitle")}
                            </p>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-sm">
                            {leaderboard.length} ta baholangan xodim
                        </span>
                    </div>

                    {leaderboard.length === 0 ? (
                        <div className="py-8 text-center text-xs font-bold uppercase tracking-wider text-gray-400 bg-white border border-dashed border-gray-200 p-6 rounded-sm">
                            {t("noLeaderboardData")}
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white border border-gray-200 rounded-sm">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500 uppercase tracking-widest font-black">
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
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-black font-black text-xs shadow-sm">
                                                            🥇 1
                                                        </span>
                                                    ) : isSecond ? (
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black text-xs shadow-sm">
                                                            🥈 2
                                                        </span>
                                                    ) : isThird ? (
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/80 text-white font-black text-xs shadow-sm">
                                                            🥉 3
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
                                                            {item.rank}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 font-bold text-black whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold uppercase">
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
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-200">
                                                        <span>★</span>
                                                        <span>{item.averageScore.toFixed(2)} / 5.0</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center font-bold text-gray-700">
                                                    {item.reviewsCount} ta baho
                                                </td>
                                                <td className="p-4 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleOpenReport(item.employeeId)}
                                                        className="px-3 py-1.5 bg-black text-white hover:bg-gray-800 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors shadow-sm"
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
                <div className="flex flex-col gap-6 mt-4 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-black">
                        {t("assignedReviewers")}
                    </h3>

                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                {t("selectReviewer")}
                            </label>
                            <select
                                value={newReviewerId}
                                onChange={(e) => setNewReviewerId(e.target.value)}
                                className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium w-full outline-none focus:border-black"
                            >
                                <option value="">{t("selectReviewerOption")}</option>
                                {users.map((u) => (
                                    <option key={u.employee.id} value={u.employee.id}>
                                        {u.employee.firstName} {u.employee.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2 w-48">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                {t("role")}
                            </label>
                            <select
                                value={newReviewerType}
                                onChange={(e) => setNewReviewerType(e.target.value)}
                                className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium w-full outline-none focus:border-black"
                            >
                                <option value="PEER">{t("rolePeer")}</option>
                                <option value="MANAGER">{t("roleManager")}</option>
                                <option value="SUBORDINATE">{t("roleSubordinate")}</option>
                                <option value="SELF">{t("roleSelf")}</option>
                            </select>
                        </div>
                        <button
                            onClick={handleAddReviewer}
                            className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            {t("add")}
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-sm font-bold uppercase text-gray-500 tracking-widest py-8 text-center">
                            {t("loading")}
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="text-sm font-bold uppercase text-gray-500 tracking-widest py-8 text-center border border-dashed border-gray-300">
                            {t("noReviewers")}
                        </div>
                    ) : (
                        <div className="border border-gray-200 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                                        <th className="p-4 border-b border-gray-200">{t("tableReviewer")}</th>
                                        <th className="p-4 border-b border-gray-200">{t("tableRole")}</th>
                                        <th className="p-4 border-b border-gray-200">{t("tableDept")}</th>
                                        <th className="p-4 border-b border-gray-200">{t("tablePosition")}</th>
                                        <th className="p-4 border-b border-gray-200 w-24"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((a) => (
                                        <tr key={a.reviewerId} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 border-b border-gray-100 text-sm font-bold">
                                                {a.reviewerName}
                                            </td>
                                            <td className="p-4 border-b border-gray-100 text-xs font-bold text-gray-500">
                                                {t(`role${a.type.charAt(0) + a.type.slice(1).toLowerCase()}`)}
                                            </td>
                                            <td className="p-4 border-b border-gray-100 text-xs text-gray-600">
                                                {a.department}
                                            </td>
                                            <td className="p-4 border-b border-gray-100 text-xs text-gray-600">
                                                {a.position}
                                            </td>
                                            <td className="p-4 border-b border-gray-100 text-right">
                                                <button
                                                    onClick={() => handleRemoveReviewer(a.reviewerId)}
                                                    className="text-[10px] font-bold text-red-600 uppercase tracking-widest hover:text-red-800"
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

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSaveAssignments}
                            disabled={saving || loading}
                            className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {saving ? t("saving") : t("saveChanges")}
                        </button>
                    </div>
                </div>
            )}

            {selectedCycleId && (
                <div className="flex flex-col gap-6 mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-black">
                        {t("allAssignments") || "Barcha biriktirilganlar (Sikl bo'yicha)"}
                    </h3>

                    {globalAssignments.length === 0 ? (
                        <div className="text-sm font-bold uppercase text-gray-500 tracking-widest py-8 text-center border border-dashed border-gray-300">
                            {t("noAssignmentsGlobal") || "Hali hech kim biriktirilmagan."}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-500">{t("colTarget")}</th>
                                        <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-500">{t("colReviewer")}</th>
                                        <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-500">{t("colRole")}</th>
                                        <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-500">{t("colDepartment")}</th>
                                        <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-500">{t("colPosition")}</th>
                                        <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-500">{t("colStatus") || "Holati"}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {globalAssignments.map((a: any) => (
                                        <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4 text-sm font-bold text-black">
                                                {a.target?.firstName} {a.target?.lastName}
                                            </td>
                                            <td className="py-4 text-sm font-bold text-black">
                                                {a.reviewer?.firstName} {a.reviewer?.lastName}
                                            </td>
                                            <td className="py-4 text-sm font-medium text-gray-500">
                                                {a.type === "PEER" ? t("rolePeer") :
                                                 a.type === "MANAGER" ? t("roleManager") :
                                                 a.type === "SUBORDINATE" ? t("roleSubordinate") :
                                                 a.type === "SELF" ? t("roleSelf") : a.type}
                                            </td>
                                            <td className="py-4 text-sm font-medium text-gray-500">
                                                {a.reviewer?.department?.name || "-"}
                                            </td>
                                            <td className="py-4 text-sm font-medium text-gray-500">
                                                {a.reviewer?.position?.title || "-"}
                                            </td>
                                            <td className="py-4 text-sm font-medium">
                                                {a.isCompleted ? (
                                                    <span className="text-green-600 font-bold uppercase tracking-widest text-[10px] bg-green-50 px-2 py-1">{t("statusCompleted") || "Bajarildi"}</span>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-orange-600 font-bold uppercase tracking-widest text-[10px] bg-orange-50 px-2 py-1">{t("statusPending") || "Kutilmoqda"}</span>
                                                        {currentUser?.employee?.id === a.reviewerId && (
                                                            <button
                                                                onClick={() => {
                                                                    const locale = window.location.pathname.split("/")[1] || "uz";
                                                                    router.push(`/${locale}/evaluate/${a.id}`);
                                                                }}
                                                                className="text-xs font-bold uppercase tracking-widest bg-black text-white px-3 py-1 hover:bg-gray-800 transition-colors"
                                                            >
                                                                {t("evaluateButton") || "Baholash"}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm("Haqiqatan ham bu biriktirishni bekor qilmoqchimisiz?")) {
                                                                    try {
                                                                        await deleteAssignment(a.id);
                                                                        setGlobalAssignments(globalAssignments.filter((g: any) => g.id !== a.id));
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        alert("Xatolik yuz berdi");
                                                                    }
                                                                }
                                                            }}
                                                            className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 underline"
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
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        loadInitialData();
                    }}
                />
            )}

            {reportModalData && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-gray-200 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-wider text-black">
                                    {reportModalData.employee?.firstName} {reportModalData.employee?.lastName} — 360 Hisoboti
                                </h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                    {reportModalData.employee?.department || "-"} • {reportModalData.employee?.position || "-"}
                                </p>
                            </div>
                            <button
                                onClick={() => setReportModalData(null)}
                                className="text-gray-400 hover:text-black font-black text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                                        Baholar Soni
                                    </span>
                                    <span className="text-2xl font-black text-black">
                                        {reportModalData.totalRespondents} ta
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                                        Umumiy O'rtacha
                                    </span>
                                    <span className="text-2xl font-black text-emerald-600">
                                        {reportModalData.competencies?.length > 0
                                            ? (reportModalData.competencies.reduce((acc: any, curr: any) => acc + curr.averageScore, 0) / reportModalData.competencies.length).toFixed(2)
                                            : 0} / 5.0
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-black">
                                    Kompetensiyalar bo'yicha natijalar:
                                </h4>
                                <div className="space-y-3">
                                    {reportModalData.competencies?.map((comp: any) => (
                                        <div key={comp.competency} className="p-3 bg-gray-50 border border-gray-200 rounded-sm">
                                            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                                                <span className="text-black uppercase">{comp.competency}</span>
                                                <span className="text-emerald-700 font-black">{comp.averageScore} / 5.0</span>
                                            </div>
                                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-black h-full transition-all"
                                                    style={{ width: `${(comp.averageScore / 5) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {reportModalData.anonymousComments?.length > 0 && (
                                <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-black">
                                        Anonim Izohlar:
                                    </h4>
                                    <div className="space-y-2">
                                        {reportModalData.anonymousComments.map((comment: string, idx: number) => (
                                            <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200 text-xs italic text-gray-700 rounded-sm">
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
        </div>
    );
}
