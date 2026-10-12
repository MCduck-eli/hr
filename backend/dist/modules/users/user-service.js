"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
const password_1 = require("../../utils/password");
const employee_status_service_1 = require("../employee-status/employee-status-service");
class UserService {
    async getAllUsers(currentUser) {
        await employee_status_service_1.employeeStatusService.checkAndTransitionEmployeeStatuses();
        const completedOffboardings = await db_1.default.employee.findMany({
            where: {
                status: { not: "TERMINATED" },
                offboarding: { status: "COMPLETED" },
            },
            include: { user: true },
        });
        for (const emp of completedOffboardings) {
            await db_1.default.employee.update({
                where: { id: emp.id },
                data: {
                    status: "TERMINATED",
                    statusConfigId: null,
                    statusExpiresAt: null,
                },
            }).catch(() => { });
            if (emp.userId && emp.user && !emp.user.email.includes("-archived-")) {
                await db_1.default.user.update({
                    where: { id: emp.userId },
                    data: {
                        email: `${emp.user.email}-archived-${Date.now()}`,
                    },
                }).catch(() => { });
            }
        }
        let companyNameFilter = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyNameFilter = caller.companyName || null;
            }
        }
        const whereClause = {
            OR: [
                { employee: null },
                {
                    employee: {
                        status: { not: "TERMINATED" },
                        OR: [
                            { offboarding: null },
                            { offboarding: { status: { not: "COMPLETED" } } },
                        ],
                    },
                },
            ],
        };
        if (companyNameFilter) {
            whereClause.companyName = companyNameFilter;
            whereClause.role = { not: "SUPER_ADMIN" };
        }
        const users = await db_1.default.user.findMany({
            where: whereClause,
            select: {
                id: true,
                email: true,
                role: true,
                customRoleId: true,
                customRole: true,
                companyName: true,
                phone: true,
                avatar: true,
                permissions: true,
                createdAt: true,
                employee: {
                    include: {
                        department: true,
                        position: true,
                        grade: true,
                        offboarding: true,
                        statusConfig: {
                            include: { nextStatus: true },
                        },
                        feedbackReviewers: {
                            where: { isCompleted: false },
                            select: { id: true },
                        },
                    },
                },
            },
        });
        const currentCycle = await db_1.default.okrCycle.findFirst({
            where: { isCurrent: true },
        });
        if (!currentCycle) {
            return users;
        }
        const objectives = await db_1.default.objective.findMany({
            where: {
                cycleId: currentCycle.id,
            },
            select: {
                id: true,
                level: true,
                departmentId: true,
                employeeId: true,
                progress: true,
            },
        });
        const okrProgressByEmployee = users.reduce((acc, u) => {
            if (!u.employee)
                return acc;
            const empId = u.employee.id;
            const deptId = u.employee.departmentId;
            const relevantOkrs = objectives.filter((o) => {
                if (o.level === "COMPANY")
                    return true;
                if (o.level === "DEPARTMENT" && deptId && o.departmentId === deptId)
                    return true;
                if (o.level === "INDIVIDUAL" && o.employeeId === empId)
                    return true;
                return false;
            });
            if (relevantOkrs.length > 0) {
                const total = relevantOkrs.reduce((sum, okr) => sum + okr.progress, 0);
                acc[empId] = Math.round(total / relevantOkrs.length);
            }
            else {
                acc[empId] = 0;
            }
            return acc;
        }, {});
        return users.map(user => {
            if (user.employee) {
                return {
                    ...user,
                    employee: {
                        ...user.employee,
                        okrProgress: okrProgressByEmployee[user.employee.id] || 0
                    }
                };
            }
            return user;
        });
    }
    async getUserById(id) {
        const user = await db_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                customRoleId: true,
                customRole: true,
                companyName: true,
                phone: true,
                avatar: true,
                permissions: true,
                createdAt: true,
                employee: {
                    include: {
                        department: true,
                        position: true,
                    },
                },
            },
        });
        if (!user) {
            throw new appError_1.AppError("User not found", 404);
        }
        return user;
    }
    async createUser(payload, currentUser) {
        const { email, password, role, customRoleId, firstName, lastName, companyName, phone, avatar, image, departmentId, positionId, leaveBalance, assignedCourseIds, permissions, } = payload;
        const resolvedAvatar = avatar || image || null;
        let finalCompanyName = companyName || null;
        let callerRole = "";
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                if (caller.role !== "SUPER_ADMIN") {
                    finalCompanyName = caller.companyName || null;
                }
            }
        }
        const existingUser = await db_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new appError_1.AppError("Ushbu email bilan foydalanuvchi allaqachon mavjud", 400);
        }
        const hashedPassword = await (0, password_1.hashPassword)(password);
        let resolvedRole = "EMPLOYEE";
        let resolvedCustomRoleId = customRoleId || null;
        if (customRoleId) {
            const customRole = await db_1.default.companyRole.findUnique({
                where: { id: customRoleId },
            });
            if (customRole) {
                resolvedCustomRoleId = customRole.id;
                resolvedRole = customRole.baseRole;
            }
        }
        else if (role) {
            const validSystemRoles = ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN", "DEPARTMENT_HEAD", "ACCOUNTANT", "EMPLOYEE", "RECRUITER", "CANDIDATE"];
            if (validSystemRoles.includes(role)) {
                resolvedRole = role;
                resolvedCustomRoleId = null;
            }
            else if (role === "MANAGER") {
                resolvedRole = "DEPARTMENT_HEAD";
                resolvedCustomRoleId = null;
            }
            else {
                const customRole = await db_1.default.companyRole.findFirst({
                    where: {
                        companyName: finalCompanyName,
                        OR: [
                            { id: role },
                            { code: role },
                            { name: { equals: role, mode: "insensitive" } },
                        ],
                    },
                });
                if (customRole) {
                    resolvedCustomRoleId = customRole.id;
                    resolvedRole = customRole.baseRole;
                }
                else {
                    resolvedRole = "EMPLOYEE";
                }
            }
        }
        let statusConfigId = payload.statusConfigId;
        let statusConfig = null;
        if (statusConfigId) {
            statusConfig = await db_1.default.employeeStatusConfig.findUnique({
                where: { id: statusConfigId },
            });
        }
        if (!statusConfig && payload.status) {
            statusConfig = await db_1.default.employeeStatusConfig.findFirst({
                where: {
                    ...(finalCompanyName ? { companyName: finalCompanyName } : {}),
                    OR: [
                        { code: payload.status },
                        { id: payload.status },
                        { name: payload.status },
                    ],
                },
            });
            if (statusConfig) {
                statusConfigId = statusConfig.id;
            }
        }
        if (!statusConfig) {
            statusConfig = await db_1.default.employeeStatusConfig.findFirst({
                where: {
                    ...(finalCompanyName ? { companyName: finalCompanyName } : {}),
                    code: "NEW",
                },
            });
            if (statusConfig) {
                statusConfigId = statusConfig.id;
            }
        }
        const statusExpiresAt = statusConfig?.durationDays
            ? new Date(Date.now() +
                statusConfig.durationDays * 24 * 60 * 60 * 1000)
            : null;
        let enumStatus = "ACTIVE";
        if (statusConfig?.code === "NEW" || payload.status === "NEW") {
            enumStatus = "NEW";
        }
        else if (statusConfig?.code === "INACTIVE" ||
            payload.status === "INACTIVE") {
            enumStatus = "INACTIVE";
        }
        let resolvedPositionId = null;
        if (positionId && typeof positionId === "string" && positionId.trim()) {
            const trimmedPos = positionId.trim();
            const existingPos = await db_1.default.position.findFirst({
                where: {
                    companyName: finalCompanyName,
                    OR: [
                        { id: trimmedPos },
                        { title: { equals: trimmedPos, mode: "insensitive" } },
                    ],
                },
            });
            if (existingPos) {
                resolvedPositionId = existingPos.id;
            }
            else {
                const newPos = await db_1.default.position.create({
                    data: {
                        title: trimmedPos,
                        companyName: finalCompanyName,
                    },
                }).catch(() => null);
                if (newPos) {
                    resolvedPositionId = newPos.id;
                }
            }
        }
        let resolvedDepartmentId = departmentId || null;
        if (resolvedDepartmentId && finalCompanyName && callerRole !== "SUPER_ADMIN") {
            const dept = await db_1.default.department.findUnique({
                where: { id: resolvedDepartmentId },
                select: { companyName: true },
            });
            if (dept && dept.companyName && dept.companyName !== finalCompanyName) {
                resolvedDepartmentId = null;
            }
        }
        let initialPermissions = [];
        if (permissions) {
            if (Array.isArray(permissions)) {
                initialPermissions = permissions.map(String);
            }
            else if (typeof permissions === "string") {
                try {
                    const parsed = JSON.parse(permissions);
                    initialPermissions = Array.isArray(parsed) ? parsed.map(String) : [permissions];
                }
                catch {
                    initialPermissions = permissions ? [permissions] : [];
                }
            }
        }
        const newUser = await db_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                role: resolvedRole,
                customRoleId: resolvedCustomRoleId,
                companyName: finalCompanyName,
                phone: phone || null,
                avatar: resolvedAvatar,
                permissions: initialPermissions,
                employee: {
                    create: {
                        firstName: firstName || "",
                        lastName: lastName || "",
                        phone: phone || null,
                        avatar: resolvedAvatar,
                        status: enumStatus,
                        statusConfigId: statusConfigId || undefined,
                        statusStartedAt: new Date(),
                        statusExpiresAt,
                        ...(resolvedDepartmentId && { departmentId: resolvedDepartmentId }),
                        ...(resolvedPositionId && { positionId: resolvedPositionId }),
                        ...(leaveBalance !== undefined && leaveBalance !== null && leaveBalance !== "" && { leaveBalance: Number(leaveBalance) }),
                        ...(payload.salary !== undefined && { salary: Number(payload.salary) }),
                        ...(payload.salaryType !== undefined && { salaryType: payload.salaryType }),
                        ...(payload.hourlyRate !== undefined && { hourlyRate: Number(payload.hourlyRate) }),
                        ...(payload.taxPercent !== undefined && { taxPercent: Number(payload.taxPercent) }),
                        ...(assignedCourseIds &&
                            assignedCourseIds.length > 0 && {
                            courseProgresses: {
                                create: assignedCourseIds.map((id) => ({
                                    courseId: id,
                                })),
                            },
                        }),
                    },
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
                customRoleId: true,
                customRole: true,
                companyName: true,
                phone: true,
                avatar: true,
                permissions: true,
                createdAt: true,
                employee: true,
            },
        });
        if (payload.candidateId) {
            await db_1.default.candidate.update({
                where: { id: payload.candidateId },
                data: { stage: "HIRED" },
            }).catch(() => { });
        }
        else {
            await db_1.default.candidate.updateMany({
                where: { email },
                data: { stage: "HIRED" },
            }).catch(() => { });
        }
        return newUser;
    }
    async updateUser(id, payload, currentUser) {
        const userExists = await db_1.default.user.findUnique({
            where: { id },
            include: { employee: true },
        });
        if (!userExists) {
            throw new appError_1.AppError("User not found", 404);
        }
        let callerRole = "";
        let callerCompany = "";
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || "";
            }
        }
        if (callerRole !== "SUPER_ADMIN" && callerCompany && userExists.companyName && userExists.companyName !== callerCompany) {
            throw new appError_1.AppError("Boshqa kompaniya foydalanuvchisini o'zgartirish huquqi yo'q", 403);
        }
        const finalCompanyName = callerRole === "SUPER_ADMIN" ? (payload.companyName !== undefined ? payload.companyName : userExists.companyName) : userExists.companyName;
        const { email, role, firstName, lastName, companyName, phone, avatar, image, departmentId, positionId, password, leaveBalance, assignedCourseIds, permissions, } = payload;
        const isDirectorOrAdmin = callerRole === "DIRECTOR" || callerRole === "SUPER_ADMIN";
        let resolvedPermissions = undefined;
        if (permissions !== undefined) {
            if (!isDirectorOrAdmin) {
                throw new appError_1.AppError("Faqat direktor xodim ruxsatlarini o'zgartira oladi", 403);
            }
            if (Array.isArray(permissions)) {
                resolvedPermissions = permissions.map(String);
            }
            else if (typeof permissions === "string") {
                try {
                    const parsed = JSON.parse(permissions);
                    resolvedPermissions = Array.isArray(parsed) ? parsed.map(String) : [permissions];
                }
                catch {
                    resolvedPermissions = permissions ? [permissions] : [];
                }
            }
            else {
                resolvedPermissions = [];
            }
        }
        const resolvedAvatar = avatar !== undefined ? avatar : (image !== undefined ? image : undefined);
        let hashedPassword;
        if (password) {
            hashedPassword = await (0, password_1.hashPassword)(password);
        }
        if (assignedCourseIds && userExists.employee) {
            await db_1.default.courseProgress.deleteMany({
                where: { employeeId: userExists.employee.id },
            });
            await db_1.default.courseProgress.createMany({
                data: assignedCourseIds.map((cId) => ({
                    employeeId: userExists.employee.id,
                    courseId: cId,
                })),
            });
        }
        let statusConfigId = payload.statusConfigId;
        let statusExpiresAt = undefined;
        let statusStartedAt = undefined;
        let enumStatus = payload.status;
        if (payload.statusConfigId !== undefined || payload.status !== undefined) {
            let statusConfig = null;
            if (statusConfigId) {
                statusConfig = await db_1.default.employeeStatusConfig.findUnique({
                    where: { id: statusConfigId },
                });
            }
            if (!statusConfig && payload.status) {
                statusConfig = await db_1.default.employeeStatusConfig.findFirst({
                    where: {
                        ...(finalCompanyName ? { companyName: finalCompanyName } : {}),
                        OR: [
                            { code: payload.status },
                            { id: payload.status },
                            { name: payload.status },
                        ],
                    },
                });
                if (statusConfig) {
                    statusConfigId = statusConfig.id;
                }
            }
            if (statusConfig) {
                statusStartedAt = new Date();
                statusExpiresAt = statusConfig.durationDays
                    ? new Date(Date.now() +
                        statusConfig.durationDays * 24 * 60 * 60 * 1000)
                    : null;
                if (statusConfig.code === "NEW") {
                    enumStatus = "NEW";
                }
                else if (statusConfig.code === "INACTIVE") {
                    enumStatus = "INACTIVE";
                }
                else {
                    enumStatus = "ACTIVE";
                }
            }
        }
        let resolvedPositionId = undefined;
        if (positionId !== undefined) {
            if (!positionId || positionId === "") {
                resolvedPositionId = null;
            }
            else {
                const trimmedPos = String(positionId).trim();
                const existingPos = await db_1.default.position.findFirst({
                    where: {
                        companyName: finalCompanyName,
                        OR: [
                            { id: trimmedPos },
                            { title: { equals: trimmedPos, mode: "insensitive" } },
                        ],
                    },
                });
                if (existingPos) {
                    resolvedPositionId = existingPos.id;
                }
                else {
                    const newPos = await db_1.default.position.create({
                        data: {
                            title: trimmedPos,
                            companyName: finalCompanyName,
                        },
                    }).catch(() => null);
                    resolvedPositionId = newPos ? newPos.id : null;
                }
            }
        }
        let resolvedDepartmentId = undefined;
        if (departmentId !== undefined) {
            if (!departmentId || departmentId === "") {
                resolvedDepartmentId = null;
            }
            else {
                resolvedDepartmentId = departmentId;
                if (finalCompanyName && callerRole !== "SUPER_ADMIN") {
                    const dept = await db_1.default.department.findUnique({
                        where: { id: departmentId },
                        select: { companyName: true },
                    });
                    if (dept && dept.companyName && dept.companyName !== finalCompanyName) {
                        resolvedDepartmentId = null;
                    }
                }
            }
        }
        let resolvedRole = undefined;
        let resolvedCustomRoleId = undefined;
        if (payload.customRoleId !== undefined) {
            if (!payload.customRoleId || payload.customRoleId === "") {
                resolvedCustomRoleId = null;
            }
            else {
                const customRole = await db_1.default.companyRole.findUnique({
                    where: { id: payload.customRoleId },
                });
                if (customRole) {
                    resolvedCustomRoleId = customRole.id;
                    resolvedRole = customRole.baseRole;
                }
            }
        }
        if (role !== undefined && resolvedRole === undefined) {
            const validSystemRoles = ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN", "DEPARTMENT_HEAD", "ACCOUNTANT", "EMPLOYEE", "RECRUITER", "CANDIDATE"];
            if (validSystemRoles.includes(role)) {
                resolvedRole = role;
                if (payload.customRoleId === undefined) {
                    resolvedCustomRoleId = null;
                }
            }
            else if (role === "MANAGER") {
                resolvedRole = "DEPARTMENT_HEAD";
                if (payload.customRoleId === undefined) {
                    resolvedCustomRoleId = null;
                }
            }
            else {
                const customRole = await db_1.default.companyRole.findFirst({
                    where: {
                        companyName: finalCompanyName,
                        OR: [
                            { id: role },
                            { code: role },
                            { name: { equals: role, mode: "insensitive" } },
                        ],
                    },
                });
                if (customRole) {
                    resolvedCustomRoleId = customRole.id;
                    resolvedRole = customRole.baseRole;
                }
                else {
                    resolvedRole = "EMPLOYEE";
                    resolvedCustomRoleId = null;
                }
            }
        }
        return db_1.default.user.update({
            where: { id },
            data: {
                ...(email && { email }),
                ...(resolvedRole && { role: resolvedRole }),
                ...(resolvedCustomRoleId !== undefined && { customRoleId: resolvedCustomRoleId }),
                ...(callerRole === "SUPER_ADMIN" && companyName !== undefined && { companyName }),
                ...(phone !== undefined && { phone }),
                ...(resolvedAvatar !== undefined && { avatar: resolvedAvatar }),
                ...(hashedPassword && { password: hashedPassword }),
                ...(resolvedPermissions !== undefined && { permissions: resolvedPermissions }),
                employee: {
                    update: {
                        ...(firstName !== undefined && { firstName }),
                        ...(lastName !== undefined && { lastName }),
                        ...(phone !== undefined && { phone }),
                        ...(resolvedAvatar !== undefined && { avatar: resolvedAvatar }),
                        ...(resolvedDepartmentId !== undefined && {
                            departmentId: resolvedDepartmentId,
                        }),
                        ...(resolvedPositionId !== undefined && {
                            positionId: resolvedPositionId,
                        }),
                        ...(leaveBalance !== undefined && leaveBalance !== null && leaveBalance !== "" && { leaveBalance: Number(leaveBalance) }),
                        ...(enumStatus !== undefined && { status: enumStatus }),
                        ...(statusConfigId !== undefined && {
                            statusConfigId,
                        }),
                        ...(statusStartedAt !== undefined && {
                            statusStartedAt,
                        }),
                        ...(statusExpiresAt !== undefined && {
                            statusExpiresAt,
                        }),
                        ...(payload.salary !== undefined && { salary: Number(payload.salary) }),
                        ...(payload.salaryType !== undefined && { salaryType: payload.salaryType }),
                        ...(payload.hourlyRate !== undefined && { hourlyRate: Number(payload.hourlyRate) }),
                        ...(payload.taxPercent !== undefined && { taxPercent: Number(payload.taxPercent) }),
                    },
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
                customRoleId: true,
                customRole: true,
                companyName: true,
                phone: true,
                avatar: true,
                permissions: true,
                employee: true,
            },
        });
    }
    async deleteUser(id, currentUser) {
        const userExists = await db_1.default.user.findUnique({
            where: { id },
            include: { employee: true },
        });
        if (!userExists) {
            throw new appError_1.AppError("User not found", 404);
        }
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN" && caller.companyName && userExists.companyName && userExists.companyName !== caller.companyName) {
                throw new appError_1.AppError("Boshqa kompaniya foydalanuvchisini o'chirish huquqi yo'q", 403);
            }
        }
        if (userExists.role === "DIRECTOR") {
            const companyName = userExists.companyName;
            const remainingDirectors = await db_1.default.user.count({
                where: {
                    role: "DIRECTOR",
                    id: { not: id },
                },
            });
            if (remainingDirectors === 0) {
                const companyTables = [
                    "Attendance",
                    "WorkSchedule",
                    "LeaveRequest",
                    "Payroll",
                    "PerformanceReview",
                    "DeviceLog",
                    "CandidateFeedback",
                    "CandidateMatch",
                    "Candidate",
                    "JobVacancy",
                    "EmployeeOnboardingTask",
                    "EmployeeOnboardingCourse",
                    "EmployeeOnboarding",
                    "OnboardingTask",
                    "OnboardingCourse",
                    "OnboardingTemplate",
                    "PolicySignature",
                    "CompanyPolicy",
                    "CourseProgress",
                    "CourseCertificate",
                    "EventRegistration",
                    "TrainingEvent",
                    "AcademyQuiz",
                    "AcademyResource",
                    "AcademyLesson",
                    "AcademyCourse",
                    "AcademyCategory",
                    "OrgStructureHistory",
                    "EmployeeLifecycleEvent",
                    "OffboardingTaskItem",
                    "OffboardingRequest",
                    "EmployeeLifecycleChecklist",
                    "LifecycleTemplateTask",
                    "LifecycleTemplate",
                    "OkrCheckIn",
                    "KeyResult",
                    "Objective",
                    "OkrCycle",
                    "DiscUserResponse",
                    "DiscAssessment",
                    "FeedbackAnswer",
                    "FeedbackAssignment",
                    "FeedbackQuestion",
                    "FeedbackCycle",
                    "PromotionRequest",
                    "CareerHistory",
                    "JobGrade",
                    "GeofenceZone",
                    "Position",
                    "Department",
                ];
                const truncateSql = `TRUNCATE TABLE ${companyTables.map((t) => `"${t}"`).join(", ")} CASCADE;`;
                await db_1.default.$executeRawUnsafe(truncateSql).catch(async () => {
                    for (const t of companyTables) {
                        await db_1.default.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE;`).catch(() => { });
                    }
                });
                await db_1.default.notification.deleteMany({
                    where: { user: { role: { not: "SUPER_ADMIN" } } },
                }).catch(() => { });
                await db_1.default.userDeviceToken.deleteMany({
                    where: { user: { role: { not: "SUPER_ADMIN" } } },
                }).catch(() => { });
                await db_1.default.employee.deleteMany({
                    where: { user: { role: { not: "SUPER_ADMIN" } } },
                }).catch(() => { });
                await db_1.default.user.deleteMany({
                    where: { role: { not: "SUPER_ADMIN" } },
                }).catch(() => { });
                return { success: true, id };
            }
            const companyUsers = await db_1.default.user.findMany({
                where: companyName ? { companyName } : { id },
                include: { employee: true },
            });
            const companyUserIds = companyUsers.map((u) => u.id);
            const companyEmpIds = companyUsers
                .map((u) => u.employee?.id)
                .filter(Boolean);
            if (companyEmpIds.length > 0) {
                await db_1.default.attendance.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.workSchedule.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.leaveRequest.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.payroll.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.performanceReview.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.employeeOnboarding.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.policySignature.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.courseProgress.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.eventRegistration.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.objective.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.feedbackAssignment.deleteMany({
                    where: {
                        OR: [
                            { targetId: { in: companyEmpIds } },
                            { reviewerId: { in: companyEmpIds } }
                        ]
                    }
                }).catch(() => { });
                await db_1.default.discAssessment.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => { });
                await db_1.default.employee.deleteMany({ where: { id: { in: companyEmpIds } } }).catch(() => { });
            }
            if (companyUserIds.length > 0) {
                await db_1.default.notification.deleteMany({ where: { userId: { in: companyUserIds } } }).catch(() => { });
                await db_1.default.userDeviceToken.deleteMany({ where: { userId: { in: companyUserIds } } }).catch(() => { });
                await db_1.default.user.deleteMany({ where: { id: { in: companyUserIds } } }).catch(() => { });
            }
            return { success: true, id };
        }
        const emp = userExists.employee;
        if (emp) {
            await db_1.default.employee.updateMany({
                where: { managerId: emp.id },
                data: { managerId: null },
            }).catch(() => { });
            await db_1.default.employeeOnboarding.updateMany({
                where: { mentorId: emp.id },
                data: { mentorId: null },
            }).catch(() => { });
            await db_1.default.attendance.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.workSchedule.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.leaveRequest.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.payroll.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.performanceReview.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.feedbackAssignment.deleteMany({
                where: { OR: [{ reviewerId: emp.id }, { targetId: emp.id }] },
            }).catch(() => { });
            await db_1.default.okrCheckIn.deleteMany({ where: { objective: { employeeId: emp.id } } }).catch(() => { });
            await db_1.default.keyResult.deleteMany({ where: { objective: { employeeId: emp.id } } }).catch(() => { });
            await db_1.default.objective.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.discUserResponse.deleteMany({ where: { assessment: { employeeId: emp.id } } }).catch(() => { });
            await db_1.default.discAssessment.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.employeeOnboardingTask.deleteMany({ where: { employeeOnboarding: { employeeId: emp.id } } }).catch(() => { });
            await db_1.default.employeeOnboardingCourse.deleteMany({ where: { employeeOnboarding: { employeeId: emp.id } } }).catch(() => { });
            await db_1.default.employeeOnboarding.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.policySignature.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.courseProgress.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.courseCertificate.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.eventRegistration.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.employeeLifecycleChecklist.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.offboardingRequest.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.employeeLifecycleEvent.deleteMany({ where: { employeeId: emp.id } }).catch(() => { });
            await db_1.default.orgStructureHistory.deleteMany({
                where: { OR: [{ employeeId: emp.id }, { changedById: emp.id }] },
            }).catch(() => { });
            await db_1.default.employee.delete({ where: { id: emp.id } }).catch(() => { });
        }
        await db_1.default.notification.deleteMany({ where: { userId: id } }).catch(() => { });
        await db_1.default.userDeviceToken.deleteMany({ where: { userId: id } }).catch(() => { });
        return db_1.default.user.delete({
            where: { id },
        }).catch(() => ({ id }));
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
