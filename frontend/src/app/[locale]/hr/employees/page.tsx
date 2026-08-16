"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import EmployeeForm from "@/src/components/hr/employees/employee-form";
import EmployeeList from "@/src/components/hr/employees/employee-list";
import {
    createUser,
    deleteUser,
    fetchAllUsers,
    updateUser,
} from "@/src/services/user-service";

export default function HREmployeesPage() {
    const t = useTranslations("HREmployees");

    const [users, setUsers] = useState<any[]>([]);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const loadUsers = async () => {
        try {
            const data = await fetchAllUsers();
            const filteredUsers = data.filter(
                (user: any) =>
                    user.role !== "SUPER_ADMIN" && user.role !== "HR_ADMIN",
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
            await deleteUser(id);
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
    };

    return (
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2 text-black">
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
                    initialData={editingUser}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                />
                <EmployeeList
                    users={users}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}
