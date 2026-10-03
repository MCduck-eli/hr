"use client";

import { useState, useEffect, useRef } from "react";
import {
    OrgEmployeeNode,
    OrgTreeResponse,
    fetchOrgTree,
    updateEmployeeHierarchy,
} from "@/src/services/org-chart-service";
import Skeleton from "@/src/components/ui/Skeleton";
import { getQueryData, setQueryData, isQueryStale, invalidateQuery } from "@/src/utils/query-cache";

interface OrgChartTreeProps {
    initialDepartmentId?: string;
}

export default function OrgChartTree({ initialDepartmentId }: OrgChartTreeProps) {
    const [selectedDepartment, setSelectedDepartment] = useState(initialDepartmentId || "");
    const [searchQuery, setSearchQuery] = useState("");

    const cacheKey = `orgchart:${selectedDepartment}:${searchQuery}`;
    const [data, setData] = useState<OrgTreeResponse | null>(() => getQueryData<OrgTreeResponse>(`orgchart:${initialDepartmentId || ""}:`));
    const [loading, setLoading] = useState(() => !getQueryData(`orgchart:${initialDepartmentId || ""}:`));
    const [error, setError] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<"tree" | "departments">("tree");
    const [showMatrixLines, setShowMatrixLines] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [selectedEmployee, setSelectedEmployee] = useState<OrgEmployeeNode | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editManagerId, setEditManagerId] = useState("");
    const [editMatrixManagerIds, setEditMatrixManagerIds] = useState<string[]>([]);
    const [editDeptId, setEditDeptId] = useState("");
    const [editReason, setEditReason] = useState("");
    const [saving, setSaving] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        const cached = getQueryData<OrgTreeResponse>(cacheKey);
        const isStale = isQueryStale(cacheKey);

        if (cached) {
            setData(cached);
        } else {
            setLoading(true);
        }
        setError(null);

        if (cached && !isStale) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetchOrgTree({
                departmentId: selectedDepartment || undefined,
                search: searchQuery || undefined,
            });
            setData(res);
            setQueryData(cacheKey, res);
        } catch (err: any) {
            setError(err.message || "Tashkiliy tuzilmani yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedDepartment]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData();
    };

    const toggleCollapse = (nodeId: string) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    const expandAll = () => {
        setCollapsedIds(new Set());
    };

    const collapseAll = () => {
        if (!data) return;
        const allParentIds = new Set<string>();
        data.flatEmployees.forEach((emp) => {
            if (emp.subordinates && emp.subordinates.length > 0) {
                allParentIds.add(emp.id);
            }
        });
        setCollapsedIds(allParentIds);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest(".node-card")) {
            return;
        }
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetView = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleOpenEdit = (emp: OrgEmployeeNode) => {
        setSelectedEmployee(emp);
        setEditManagerId(emp.managerId || "");
        setEditMatrixManagerIds(emp.matrixManagers?.map((mm) => mm.manager?.id).filter(Boolean) as string[] || []);
        setEditDeptId(emp.department?.id || "");
        setEditReason("");
        setIsEditModalOpen(true);
    };

    const toggleMatrixManagerSelection = (managerId: string) => {
        setEditMatrixManagerIds((prev) => {
            if (prev.includes(managerId)) {
                return prev.filter((id) => id !== managerId);
            } else {
                return [...prev, managerId];
            }
        });
    };

    const handleSaveHierarchy = async () => {
        if (!selectedEmployee) return;
        setSaving(true);
        try {
            await updateEmployeeHierarchy(selectedEmployee.id, {
                managerId: editManagerId || null,
                matrixManagerIds: editMatrixManagerIds,
                departmentId: editDeptId || undefined,
                reason: editReason || undefined,
            });
            setIsEditModalOpen(false);
            invalidateQuery("orgchart");
            invalidateQuery("director");
            loadData();
        } catch (err: any) {
            alert(err.message || "Xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    const renderTreeNode = (node: OrgEmployeeNode, isSecondaryBranch: boolean = false) => {
        const hasDirectChildren = node.children && node.children.length > 0;
        const hasSecondaryChildren = showMatrixLines && node.secondaryChildren && node.secondaryChildren.length > 0;
        const hasAnyChildren = hasDirectChildren || hasSecondaryChildren;
        const isCollapsed = collapsedIds.has(node.id);
        const matrixCount = node.matrixManagers?.length || 0;

        const isMatch = searchQuery && (
            `${node.firstName} ${node.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (node.position?.title && node.position.title.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return (
            <div key={`${node.id}-${isSecondaryBranch ? "sec" : "prim"}`} className="flex flex-col items-center">
                <div
                    onClick={() => setSelectedEmployee(node)}
                    className={`node-card relative bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-64 flex flex-col gap-2.5 transition-all cursor-pointer hover:shadow-md ${
                        isSecondaryBranch
                            ? "border-purple-300 border-dashed bg-purple-50/20"
                            : isMatch
                            ? "border-[#9327FF] ring-2 ring-purple-400/30 bg-purple-50/40"
                            : "hover:border-purple-300"
                    }`}
                >
                    {isSecondaryBranch && (
                        <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-[#9327FF] text-white text-[8px] font-bold uppercase tracking-wider rounded-md">
                            Matritsali Bo'g'in
                        </span>
                    )}

                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSecondaryBranch ? "bg-purple-100 text-[#9327FF]" : "bg-indigo-900 text-white"
                            }`}>
                                {node.firstName.charAt(0)}{node.lastName.charAt(0)}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                    {node.firstName} {node.lastName}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500 truncate">
                                    {node.position?.title || "Lavozim belgilanmagan"}
                                </span>
                            </div>
                        </div>
                        {node.grade && (
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[9px] font-mono font-bold text-slate-700 shrink-0">
                                {node.grade.title || node.grade.code}
                            </span>
                        )}
                    </div>

                    {matrixCount > 0 && !isSecondaryBranch && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-100 rounded-lg text-[9px] text-purple-900 font-semibold">
                            <span>🔀</span>
                            <span className="truncate">
                                Matritsa: {node.matrixManagers!.map((mm) => mm.manager?.firstName).filter(Boolean).join(", ")}
                            </span>
                        </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md uppercase tracking-wider truncate max-w-[130px]">
                            {node.department?.name || "Bo'limsiz"}
                        </span>
                        <div className="flex items-center gap-1">
                            {hasAnyChildren && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCollapse(node.id);
                                    }}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-[10px] rounded-md transition-colors"
                                    title={isCollapsed ? "Daraxtni yoyish" : "Daraxtni yig'ish"}
                                >
                                    {isCollapsed
                                        ? `+${(node.children?.length || 0) + (showMatrixLines ? (node.secondaryChildren?.length || 0) : 0)}`
                                        : `−${(node.children?.length || 0) + (showMatrixLines ? (node.secondaryChildren?.length || 0) : 0)}`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {hasAnyChildren && !isCollapsed && (
                    <div className="flex flex-col items-center">
                        <div className="w-0.5 h-6 bg-slate-300" />
                        <div className="flex items-start justify-center gap-6 relative pt-6 border-t-2 border-slate-300">
                            {hasDirectChildren &&
                                node.children!.map((child) => (
                                    <div key={child.id} className="relative flex flex-col items-center">
                                        <div className="w-0.5 h-6 bg-slate-300 absolute -top-6" />
                                        {renderTreeNode(child, false)}
                                    </div>
                                ))}

                            {hasSecondaryChildren &&
                                node.secondaryChildren!.map((secChild) => (
                                    <div key={`sec-${secChild.id}`} className="relative flex flex-col items-center">
                                        <div className="w-0.5 h-6 border-l-2 border-dashed border-purple-400 absolute -top-6" />
                                        {renderTreeNode(secChild, true)}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col gap-6 w-full animate-pulse">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="w-64 h-8 rounded-xl" />
                        <Skeleton className="w-96 h-4 rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-48 h-10 rounded-xl" />
                        <Skeleton className="w-36 h-10 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 shadow-xs">
                            <Skeleton className="w-24 h-3.5 rounded-md" />
                            <Skeleton className="w-16 h-8 rounded-lg" />
                            <Skeleton className="w-32 h-3 rounded-md" />
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center justify-center p-12 gap-8 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[300px]">
                    <Skeleton className="w-64 h-24 rounded-2xl" />
                    <div className="flex items-center justify-center gap-12 w-full">
                        <Skeleton className="w-56 h-24 rounded-2xl" />
                        <Skeleton className="w-56 h-24 rounded-2xl" />
                        <Skeleton className="w-56 h-24 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                    {error}
                </span>
                <button
                    onClick={loadData}
                    className="self-start px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase rounded-xl transition-colors"
                >
                    Qayta urinish
                </button>
            </div>
        );
    }

    if (!data) return null;

    const departmentGroups = data.departments.map((dept) => {
        const deptEmployees = data.flatEmployees.filter((e) => e.department?.id === dept.id);
        const head = deptEmployees.find((e) => !e.managerId || e.manager?.department?.name !== dept.name) || deptEmployees[0];
        const staff = deptEmployees.filter((e) => e.id !== head?.id);
        return {
            ...dept,
            employees: deptEmployees,
            head,
            staff,
        };
    });

    const unassignedEmployees = data.flatEmployees.filter((e) => !e.department);
    const matrixCountTotal = data.flatEmployees.filter((e) => e.matrixManagers && e.matrixManagers.length > 0).length;

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🏛️</span>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                            <span>Tashkiliy Tuzilma (Org Chart)</span>
                            <span className="px-3 py-1 text-[10px] font-bold uppercase bg-blue-50 border border-blue-100 text-blue-700 rounded-lg">
                                🏢 {data.companyName}
                            </span>
                        </h2>
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                        Kompaniya boshqaruv ierarxiyasi, matritsali boshqaruv (Matrix Management) va bo'ysunuv zanjiri
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="flex items-center gap-1.5">
                        <input
                            type="text"
                            placeholder="Xodim yoki lavozim izlash..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#9327FF] w-48 sm:w-60"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#9327FF] hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-all"
                        >
                            Qidiruv
                        </button>
                    </form>

                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-[#9327FF]"
                    >
                        <option value="">Barcha Bo'limlar</option>
                        {data.departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode("tree")}
                            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                                viewMode === "tree"
                                    ? "bg-indigo-900 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            🌳 Ierarxik Daraxt
                        </button>
                        <button
                            onClick={() => setViewMode("departments")}
                            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                                viewMode === "departments"
                                    ? "bg-indigo-900 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            🏢 Bo'limlar
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Jami Faol Xodimlar
                    </span>
                    <span className="text-3xl font-black font-mono text-slate-900">
                        {data.totalEmployees}
                    </span>
                    <span className="text-[10px] text-slate-400 border-t border-gray-50 pt-2 font-medium">
                        Kompaniya xodimlari soni
                    </span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Bo'limlar Soni
                    </span>
                    <span className="text-3xl font-black font-mono text-blue-600">
                        {data.departmentsCount}
                    </span>
                    <span className="text-[10px] text-slate-400 border-t border-gray-50 pt-2 font-medium">
                        Tashkiliy departamentlar
                    </span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Matritsali Boshqaruv
                    </span>
                    <span className="text-3xl font-black font-mono text-purple-600">
                        {matrixCountTotal}
                    </span>
                    <span className="text-[10px] text-slate-400 border-t border-gray-50 pt-2 font-medium">
                        Ikkilamchi rahbarli xodimlar
                    </span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        To'g'ridan-to'g'ri Bo'ysunuv
                    </span>
                    <span className="text-3xl font-black font-mono text-emerald-600">
                        {data.flatEmployees.filter((e) => e.managerId).length}
                    </span>
                    <span className="text-[10px] text-slate-400 border-t border-gray-50 pt-2 font-medium">
                        Asosiy rahbariga biriktirilgan
                    </span>
                </div>
            </div>

            {viewMode === "tree" ? (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 overflow-hidden min-h-[600px] flex flex-col relative">
                    <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm p-1.5">
                        <button
                            onClick={() => setShowMatrixLines((s) => !s)}
                            className={`px-3 h-8 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 ${
                                showMatrixLines ? "bg-[#9327FF] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/50"
                            }`}
                            title="Matritsali (qo'shimcha) bo'g'inlarni ko'rsatish/yashirish"
                        >
                            <span>🔀</span>
                            <span>Matritsa Chiziqlari</span>
                        </button>
                        <div className="w-[1px] h-5 bg-gray-200 mx-0.5" />
                        <button
                            onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
                            className="w-8 h-8 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-md border border-gray-200/50 flex items-center justify-center text-sm transition-colors"
                            title="Kattalashtirish"
                        >
                            +
                        </button>
                        <span className="text-xs font-mono font-bold px-2 text-gray-700 bg-gray-50 rounded-md border border-gray-200/50 h-8 flex items-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
                            className="w-8 h-8 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-md border border-gray-200/50 flex items-center justify-center text-sm transition-colors"
                            title="Kichiklashtirish"
                        >
                            −
                        </button>
                        <button
                            onClick={resetView}
                            className="px-2.5 h-8 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-md border border-gray-200/50 transition-colors"
                            title="Asliga qaytarish"
                        >
                            Reset
                        </button>
                        <div className="w-[1px] h-5 bg-gray-200 mx-0.5" />
                        <button
                            onClick={expandAll}
                            className="px-2.5 h-8 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-md border border-gray-200/50 transition-colors"
                        >
                            Barchasini Yoyish
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-2.5 h-8 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-md border border-gray-200/50 transition-colors"
                        >
                            Yig'ish
                        </button>
                    </div>

                    <div
                        ref={containerRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className={`w-full flex-1 flex items-start justify-center overflow-auto p-12 cursor-grab select-none ${
                            isDragging ? "cursor-grabbing" : ""
                        }`}
                    >
                        <div
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                transformOrigin: "top center",
                                transition: isDragging ? "none" : "transform 0.15s ease-out",
                            }}
                            className="flex flex-col items-center gap-12"
                        >
                            {data.tree.length === 0 ? (
                                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-md shadow-sm">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                        Tashkiliy tuzilma ma'lumotlari topilmadi
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-start justify-center gap-12">
                                    {data.tree.map((rootNode) => renderTreeNode(rootNode, false))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departmentGroups.map((dept) => (
                        <div
                            key={dept.id}
                            className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        {dept.name}
                                    </h3>
                                    <span className="text-xs font-medium text-slate-500">
                                        {dept.employees.length} nafar xodim
                                    </span>
                                </div>
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-mono font-bold rounded-lg">
                                    🏢 Bo'lim
                                </span>
                            </div>

                            {dept.head && (
                                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex flex-col gap-1">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-purple-700">
                                        Bo'lim Boshlig'i / Rahbari
                                    </span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-900">
                                            {dept.head.firstName} {dept.head.lastName}
                                        </span>
                                        <button
                                            onClick={() => setSelectedEmployee(dept.head)}
                                            className="text-[10px] font-bold text-[#9327FF] hover:underline"
                                        >
                                            Ko'rish ➔
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-slate-600">
                                        {dept.head.position?.title || "Rahbar"}
                                    </span>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Bo'lim Xodimlari ({dept.staff.length})
                                </span>
                                {dept.staff.length === 0 ? (
                                    <span className="text-xs text-slate-400 italic">
                                        Boshqa xodimlar mavjud emas
                                    </span>
                                ) : (
                                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                                        {dept.staff.map((emp) => (
                                            <div
                                                key={emp.id}
                                                onClick={() => setSelectedEmployee(emp)}
                                                className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900">
                                                        {emp.firstName} {emp.lastName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {emp.position?.title || "Mutaxassis"}
                                                    </span>
                                                </div>
                                                {emp.grade && (
                                                    <span className="text-[9px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                                        {emp.grade.title || emp.grade.code}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {unassignedEmployees.length > 0 && (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-5 flex flex-col gap-4 shadow-sm">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-700">
                                    Bo'limga biriktirilmaganlar
                                </h3>
                                <span className="text-xs font-medium text-slate-500">
                                    {unassignedEmployees.length} nafar xodim
                                </span>
                            </div>
                            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                                {unassignedEmployees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        onClick={() => setSelectedEmployee(emp)}
                                        className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer"
                                    >
                                        <span className="text-xs font-bold text-slate-900">
                                            {emp.firstName} {emp.lastName}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {emp.position?.title || "-"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedEmployee && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#9327FF] text-white flex items-center justify-center font-bold text-base shadow-sm">
                                    {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-base font-bold tracking-tight text-slate-900">
                                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                                    </h3>
                                    <span className="text-xs font-semibold text-[#9327FF]">
                                        {selectedEmployee.position?.title || "Lavozim belgilanmagan"}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="text-slate-400 hover:text-slate-900 font-bold text-lg p-1 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Bo'lim</span>
                                <span className="font-bold text-slate-900 mt-0.5">
                                    {selectedEmployee.department?.name || "Biriktirilmagan"}
                                </span>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Grade Darajasi</span>
                                <span className="font-bold text-slate-900 mt-0.5">
                                    {selectedEmployee.grade?.title || selectedEmployee.grade?.code || "Standart"} (Lvl {selectedEmployee.grade?.level || 1})
                                </span>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Asosiy Rahbari</span>
                                <span className="font-bold text-slate-900 mt-0.5">
                                    {selectedEmployee.manager
                                        ? `${selectedEmployee.manager.firstName} ${selectedEmployee.manager.lastName}`
                                        : "Mavjud emas (Boshqaruvchi)"}
                                </span>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                                <span className="font-bold text-slate-900 mt-0.5 truncate">
                                    {selectedEmployee.user?.email || "-"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 flex items-center justify-between">
                                <span>🔀 Matritsali / Qo'shimcha Rahbarlar ({selectedEmployee.matrixManagers?.length || 0})</span>
                            </span>
                            {selectedEmployee.matrixManagers && selectedEmployee.matrixManagers.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {selectedEmployee.matrixManagers.map((mm) => (
                                        <div
                                            key={mm.id}
                                            className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 flex flex-col"
                                        >
                                            <span className="font-bold text-slate-900 text-xs">
                                                {mm.manager?.firstName} {mm.manager?.lastName}
                                            </span>
                                            <span className="text-[10px] text-[#9327FF] font-medium">
                                                {mm.manager?.position?.title || mm.manager?.department?.name || "Qo'shimcha rahbar"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400 italic">
                                    Qo'shimcha rahbarlar biriktirilmagan
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                To'g'ridan-to'g'ri Bo'ysunuvchilar ({selectedEmployee.subordinates?.length || 0})
                            </span>
                            {selectedEmployee.subordinates && selectedEmployee.subordinates.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                                    {selectedEmployee.subordinates.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col"
                                        >
                                            <span className="font-bold text-slate-900 text-xs">
                                                {sub.firstName} {sub.lastName}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {sub.position?.title || "-"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400 italic">
                                    Bo'ysunuvchi xodimlar mavjud emas
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => handleOpenEdit(selectedEmployee)}
                                className="px-4 py-2.5 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <span>✏️</span>
                                <span>Ierarxiyani O'zgartirish</span>
                            </button>
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && selectedEmployee && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold tracking-tight text-slate-900">
                                Ierarxiyani Boshqarish ({selectedEmployee.firstName} {selectedEmployee.lastName})
                            </h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-slate-400 hover:text-slate-900 font-bold text-lg p-1 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold uppercase text-slate-600">
                                    Bo'lim
                                </label>
                                <select
                                    value={editDeptId}
                                    onChange={(e) => setEditDeptId(e.target.value)}
                                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#9327FF]"
                                >
                                    <option value="">Bo'limsiz</option>
                                    {data.departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold uppercase text-slate-600">
                                    Asosiy Rahbari (Primary Manager)
                                </label>
                                <select
                                    value={editManagerId}
                                    onChange={(e) => setEditManagerId(e.target.value)}
                                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#9327FF]"
                                >
                                    <option value="">Rahbarsiz (Boshqaruvchi)</option>
                                    {data.flatEmployees
                                        .filter((e) => e.id !== selectedEmployee.id)
                                        .map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.firstName} {m.lastName} ({m.position?.title || "Lavozimsiz"})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase text-purple-900 flex items-center justify-between">
                                    <span>🔀 Qo'shimcha / Matritsali Rahbarlar (Secondary Managers)</span>
                                    <span className="font-mono text-[10px] text-slate-500">
                                        {editMatrixManagerIds.length} ta tanlandi
                                    </span>
                                </label>
                                <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-2.5 max-h-36 overflow-y-auto flex flex-col gap-1.5">
                                    {data.flatEmployees
                                        .filter((e) => e.id !== selectedEmployee.id && e.id !== editManagerId)
                                        .map((m) => {
                                            const isSelected = editMatrixManagerIds.includes(m.id);
                                            return (
                                                <div
                                                    key={m.id}
                                                    onClick={() => toggleMatrixManagerSelection(m.id)}
                                                    className={`p-2 border flex items-center justify-between cursor-pointer text-xs rounded-lg transition-colors ${
                                                        isSelected
                                                            ? "bg-purple-100 border-purple-400 font-bold text-purple-950"
                                                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {}}
                                                            className="accent-[#9327FF]"
                                                        />
                                                        <span>{m.firstName} {m.lastName}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-500">
                                                        {m.position?.title || m.department?.name || "-"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold uppercase text-slate-600">
                                    O'zgartirish Sababi (Ixtiyoriy)
                                </label>
                                <textarea
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    placeholder="Masalan: Bo'lim restrukturizatsiyasi, loyiha rahbari biriktirilishi..."
                                    rows={2}
                                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#9327FF]"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                onClick={handleSaveHierarchy}
                                disabled={saving}
                                className="px-5 py-2.5 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                            >
                                {saving ? "Saqlanmoqda..." : "Saqlash"}
                            </button>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                            >
                                Bekor qilish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
