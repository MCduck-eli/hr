"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function EmployeeAssigner() {
    const t = useTranslations("EmployeeAssigner");

    const [activeTab, setActiveTab] = useState<"onboarding" | "academy">(
        "onboarding",
    );

    const [employees, setEmployees] = useState<any[]>([]);
    const [assignedEmployees, setAssignedEmployees] = useState<string[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [activeTab]);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const headers = { Authorization: `Bearer ${token}` };

            const res = await fetch(`${API_URL}/users`, { headers });
            let allUsers = [];
            if (res.ok) {
                const empData = await res.json();
                allUsers = empData.data || empData || [];
            }

            const filteredUsers = allUsers.filter(
                (u: any) =>
                    u.role !== "SUPER_ADMIN" &&
                    u.role !== "HR_ADMIN" &&
                    u.employee?.id,
            );
            setEmployees(filteredUsers);

            if (activeTab === "onboarding") {
                const monitoringRes = await fetch(
                    `${API_URL}/onboarding/monitoring`,
                    { headers },
                );
                if (monitoringRes.ok) {
                    const monitoringData = await monitoringRes.json();
                    const list = monitoringData.data || monitoringData || [];
                    const assignedIds = list.map(
                        (item: any) => item.employeeId,
                    );
                    setAssignedEmployees(assignedIds);
                    setSelectedEmployees(assignedIds);
                }
            } else {
                const academyRes = await fetch(
                    `${API_URL}/academy/assigned-employees`,
                    { headers },
                );
                if (academyRes.ok) {
                    const academyData = await academyRes.json();
                    const assignedIds = academyData.data || academyData || [];
                    setAssignedEmployees(assignedIds);
                    setSelectedEmployees(assignedIds);
                } else {
                    setAssignedEmployees([]);
                    setSelectedEmployees([]);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEmployeeToggle = (employeeId: string) => {
        if (assignedEmployees.includes(employeeId)) return;

        setSelectedEmployees((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId],
        );
    };

    const handleSelectAllEmployees = () => {
        const unassignedIds = employees
            .filter((emp) => !assignedEmployees.includes(emp.employee.id))
            .map((emp) => emp.employee.id);

        const allSelected = unassignedIds.every((id) =>
            selectedEmployees.includes(id),
        );

        if (allSelected) {
            setSelectedEmployees([...assignedEmployees]);
        } else {
            const allIds = employees.map((emp) => emp.employee.id);
            setSelectedEmployees(allIds);
        }
    };

    const handleAssign = async () => {
        const newSelected = selectedEmployees.filter(
            (id) => !assignedEmployees.includes(id),
        );

        if (newSelected.length === 0) {
            alert(t("selectError"));
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;

            const endpoint =
                activeTab === "onboarding"
                    ? `${API_URL}/onboarding/assign`
                    : `${API_URL}/academy/assign`;

            await Promise.all(
                newSelected.map((empId) =>
                    fetch(endpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            employeeId: empId,
                        }),
                    }).then((res) => {
                        if (!res.ok) throw new Error(t("errorMsg"));
                        return res.json();
                    }),
                ),
            );

            alert(
                activeTab === "onboarding"
                    ? t("successOnboarding")
                    : t("successAcademy"),
            );
            fetchInitialData();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 p-6 flex flex-col gap-6">
            <h2 className="text-xl font-bold uppercase">{t("title")}</h2>

            <div className="flex gap-4 border-b">
                <button
                    className={`pb-2 font-bold uppercase text-sm ${activeTab === "onboarding" ? "border-b-2 border-black" : "text-gray-400"}`}
                    onClick={() => {
                        setActiveTab("onboarding");
                        setSelectedEmployees([]);
                    }}
                >
                    {t("onboardingTab")}
                </button>
                <button
                    className={`pb-2 font-bold uppercase text-sm ${activeTab === "academy" ? "border-b-2 border-black" : "text-gray-400"}`}
                    onClick={() => {
                        setActiveTab("academy");
                        setSelectedEmployees([]);
                    }}
                >
                    {t("academyTab")}
                </button>
            </div>

            <div className="flex flex-col gap-4 max-w-xl">
                <div className="border bg-white p-4">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <span className="font-bold text-sm uppercase">
                            {t("selectEmployees")}
                        </span>
                        <button
                            onClick={handleSelectAllEmployees}
                            className="text-xs font-bold text-blue-600 uppercase hover:underline"
                        >
                            {t("selectAll")}
                        </button>
                    </div>
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2">
                        {employees.map((emp) => {
                            const empId = emp.employee?.id;
                            const firstName = emp.employee?.firstName || "";
                            const lastName = emp.employee?.lastName || "";
                            const displayName =
                                `${firstName} ${lastName}`.trim() || emp.email;

                            const isAlreadyAssigned =
                                assignedEmployees.includes(empId);
                            const isChecked = selectedEmployees.includes(empId);

                            return (
                                <label
                                    key={empId}
                                    className={`flex items-center justify-between gap-3 text-sm p-2 border rounded transition-colors ${
                                        isAlreadyAssigned
                                            ? "bg-gray-100 cursor-not-allowed border-gray-200 opacity-80"
                                            : "cursor-pointer hover:bg-gray-50 border-transparent hover:border-gray-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            className={`w-4 h-4 ${isAlreadyAssigned ? "cursor-not-allowed accent-black" : "cursor-pointer"}`}
                                            checked={isChecked}
                                            disabled={isAlreadyAssigned}
                                            onChange={() =>
                                                handleEmployeeToggle(empId)
                                            }
                                        />
                                        <span className="font-medium text-gray-800">
                                            {displayName}
                                            {isAlreadyAssigned && (
                                                <span className="ml-2 text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-bold">
                                                    {t("assigned")}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold uppercase tracking-wider">
                                        {emp.role}
                                    </span>
                                </label>
                            );
                        })}
                        {employees.length === 0 && (
                            <span className="text-xs text-gray-500">
                                {t("noEmployees")}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleAssign}
                    disabled={loading}
                    className="bg-black text-white p-3 font-bold uppercase text-sm disabled:opacity-50 mt-2 hover:bg-gray-800 transition-colors"
                >
                    {loading ? t("loading") : t("assignBtn")}
                </button>
            </div>
        </div>
    );
}
