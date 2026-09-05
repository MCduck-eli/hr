"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import EmployeeForm from "@/src/components/hr/employees/employee-form";
import EmployeeDetailsTable from "@/src/components/hr/employees/employee-details-table";
import {
    createUser,
    deleteUser,
    fetchAllUsers,
    updateUser,
} from "@/src/services/user-service";

export default function HREmployeesPage() {
    const t = useTranslations("HREmployees");
    const router = useRouter();
    const searchParams = useSearchParams();

    const candidateId = searchParams.get("candidateId");
    const emailParam = searchParams.get("email");
    const firstNameParam = searchParams.get("firstName");
    const lastNameParam = searchParams.get("lastName");
    const phoneParam = searchParams.get("phone");
    const departmentIdParam = searchParams.get("departmentId");

    const [candidateData, setCandidateData] = useState<any>(() => {
        if (emailParam || candidateId) {
            return {
                candidateId: candidateId || undefined,
                email: emailParam || "",
                firstName: firstNameParam || "",
                lastName: lastNameParam || "",
                phone: phoneParam || "",
                departmentId: departmentIdParam || "",
            };
        }
        return null;
    });

    const [users, setUsers] = useState<any[]>([]);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const loadUsers = async () => {
        try {
            const data = await fetchAllUsers();
            let currentUserId = "";
            let currentUserRole = "";
            try {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    const parsed = JSON.parse(userStr);
                    currentUserId = parsed.id;
                    currentUserRole = parsed.role;
                }
            } catch (e) {}

            const filteredUsers = (data || []).filter(
                (user: any) =>
                    user.role !== "SUPER_ADMIN" &&
                    user.role !== "DIRECTOR" &&
                    user.id !== currentUserId,
            );
            setUsers(filteredUsers);
        } catch (err: any) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleSubmit = async (formData: any) => {
        setLoading(true);
        setError("");

        try {
            const payload = { ...formData };
            if (editingUser && !payload.password) {
                delete payload.password;
            }

            if (editingUser) {
                await updateUser(editingUser.id, payload);
            } else {
                await createUser(payload);
                if (candidateData) {
                    setCandidateData(null);
                    router.replace(window.location.pathname);
                }
            }

            setEditingUser(null);
            loadUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Error");
            }

            loadUsers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancel = () => {
        setEditingUser(null);
        setCandidateData(null);
    };

    return (
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => router.back()} 
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-4"
                >
                    &larr; {t("goBack") || "Orqaga"}
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-black">
                    {t("title")}
                </h1>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold uppercase rounded-sm border border-red-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <EmployeeForm
                    initialData={editingUser || candidateData}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                />
                <EmployeeDetailsTable
                    users={users}
                    onEdit={(user) => {
                        setEditingUser(user);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}
