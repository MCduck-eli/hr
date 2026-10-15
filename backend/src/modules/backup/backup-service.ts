import { createClient } from "@supabase/supabase-js";
import prisma from "../../config/db";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const cleanOldBackups = async (retentionCount: number = 7) => {
    try {
        const { data: files, error } = await supabase.storage
            .from("hr-backups")
            .list("", { sortBy: { column: "created_at", order: "desc" } });

        if (error) {
            throw new Error(error.message);
        }

        if (files && files.length > retentionCount) {
            const sortedFiles = [...files].sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
            const oldFiles = sortedFiles.slice(retentionCount);
            const fileNamesToRemove = oldFiles.map((f) => f.name).filter(Boolean);
            if (fileNamesToRemove.length > 0) {
                await supabase.storage.from("hr-backups").remove(fileNamesToRemove);
            }
        }
    } catch (cleanupError) {
        console.error("Eski zaxiralarni tozalashda xatolik:", cleanupError);
    }
};

export const generateAndUploadBackup = async (name?: string) => {
    const [
        users,
        employees,
        departments,
        positions,
        trials,
        attendances,
        leaveRequests,
        payrolls,
        companyPolicies,
        companyRoles,
    ] = await Promise.all([
        prisma.user.findMany(),
        prisma.employee.findMany(),
        prisma.department.findMany(),
        prisma.position.findMany(),
        prisma.trialRequest.findMany(),
        prisma.attendance.findMany(),
        prisma.leaveRequest.findMany(),
        prisma.payroll.findMany(),
        prisma.companyPolicy.findMany(),
        prisma.companyRole.findMany(),
    ]);

    const backupData = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        users,
        companies: users.filter((u: any) => u.companyName || u.role === "DIRECTOR"),
        employees,
        departments,
        positions,
        trials,
        attendances,
        leaveRequests,
        payrolls,
        companyPolicies,
        companyRoles,
    };

    const fileBuffer = Buffer.from(JSON.stringify(backupData));
    const fileName = name || `backup_${Date.now()}.json`;

    const { data, error } = await supabase.storage
        .from("hr-backups")
        .upload(fileName, fileBuffer, { contentType: "application/json" });

    if (error) {
        throw new Error(error.message);
    }

    await cleanOldBackups(7);

    return {
        fileName,
        size: fileBuffer.length,
        data,
    };
};

export const createDatabaseBackup = generateAndUploadBackup;

export const listDatabaseBackups = async () => {
    const { data, error } = await supabase.storage
        .from("hr-backups")
        .list("", { sortBy: { column: "created_at", order: "desc" } });

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
};

export const getBackupDownloadUrl = async (fileName: string) => {
    const { data, error } = await supabase.storage
        .from("hr-backups")
        .createSignedUrl(fileName, 3600);

    if (error) {
        throw new Error(error.message);
    }

    return data.signedUrl;
};

export const backupService = {
    generateAndUploadBackup,
    createBackup: generateAndUploadBackup,
    cleanOldBackups,
    listBackups: listDatabaseBackups,
    getDownloadUrl: getBackupDownloadUrl,
};
