import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class GradingService {
    async createGrade(payload: {
        code: string;
        title: string;
        level: number;
        minSalary: number;
        maxSalary: number;
        requirements?: string | null;
        responsibilities?: string | null;
        companyName?: string | null;
    }, currentUser?: any) {
        let resolvedCompany = payload.companyName || null;
        if (!resolvedCompany && currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { companyName: true },
            });
            resolvedCompany = caller?.companyName || null;
        }

        const existing = await prisma.jobGrade.findFirst({
            where: {
                code: payload.code,
                ...(resolvedCompany ? { companyName: resolvedCompany } : {}),
            },
        });
        if (existing) {
            throw new AppError("Ushbu kodli greyd allaqachon mavjud", 400);
        }

        return prisma.jobGrade.create({
            data: {
                code: payload.code,
                title: payload.title,
                level: payload.level,
                minSalary: payload.minSalary,
                maxSalary: payload.maxSalary,
                requirements: payload.requirements || null,
                responsibilities: payload.responsibilities || null,
                companyName: resolvedCompany,
            },
        });
    }

    async getGrades(currentUser?: any) {
        let companyFilter: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }

        if (companyFilter) {
            const count = await prisma.jobGrade.count({
                where: { companyName: companyFilter },
            });

            if (count === 0) {
                const defaultGrades = [
                    { code: "G-1", title: "Junior Mutaxassis", level: 1, minSalary: 5000000, maxSalary: 8000000, requirements: "Dasturlash / mutaxassislik asoslari, 0-1 yil tajriba", responsibilities: "Kichik vazifalarni bajarish, jamoa bilan ishlash", companyName: companyFilter },
                    { code: "G-2", title: "Middle Mutaxassis", level: 2, minSalary: 8000000, maxSalary: 15000000, requirements: "O'rta darajadagi bilim, 2-3 yil tajriba", responsibilities: "Mustaqil modullarni ishlab chiqish, kod sifatini nazorat qilish", companyName: companyFilter },
                    { code: "G-3", title: "Senior Mutaxassis", level: 3, minSalary: 15000000, maxSalary: 25000000, requirements: "Chuqur bilim, 4+ yil tajriba, arxitektura ko'nikmalari", responsibilities: "Arxitektura qarorlari, juniorlarni o'qitish (mentoring)", companyName: companyFilter },
                    { code: "G-4", title: "Team Lead / Yetakchi", level: 4, minSalary: 22000000, maxSalary: 32000000, requirements: "Yetakchilik, loyiha boshqaruvi, 5+ yil tajriba", responsibilities: "Jamoani boshqarish, sprintlarni rejalashtirish, OKR nazorati", companyName: companyFilter },
                    { code: "G-5", title: "Principal / Bosh Mutaxassis", level: 5, minSalary: 30000000, maxSalary: 45000000, requirements: "Keng ko'lamli tizimlar arxitekturasi, strategik rejalashtirish", responsibilities: "Kompaniya texnologik strategiyasi, muhim texnik yo'nalishlar", companyName: companyFilter },
                ];

                for (const dg of defaultGrades) {
                    await prisma.jobGrade.create({ data: dg }).catch(() => {});
                }
            }

            return prisma.jobGrade.findMany({
                where: { companyName: companyFilter },
                orderBy: { level: "asc" },
                include: {
                    employees: {
                        where: {
                            user: {
                                companyName: companyFilter,
                                role: { notIn: ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"] },
                            },
                        },
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            position: true,
                            salary: true,
                            department: { select: { name: true } },
                        },
                    },
                },
            });
        }

        return prisma.jobGrade.findMany({
            orderBy: { level: "asc" },
            include: {
                employees: {
                    where: {
                        user: {
                            role: { notIn: ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"] },
                        },
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: true,
                        salary: true,
                        department: { select: { name: true } },
                    },
                },
            },
        });
    }

    async updateGrade(
        gradeId: string,
        payload: {
            code?: string;
            title?: string;
            level?: number;
            minSalary?: number;
            maxSalary?: number;
            requirements?: string | null;
            responsibilities?: string | null;
        },
        currentUser?: any,
    ) {
        const grade = await prisma.jobGrade.findUnique({
            where: { id: gradeId },
        });
        if (!grade) {
            throw new AppError("Greyd topilmadi", 404);
        }

        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (
                caller &&
                caller.role !== "SUPER_ADMIN" &&
                grade.companyName &&
                grade.companyName !== caller.companyName
            ) {
                throw new AppError("Ushbu greydni tahrirlashga ruxsat yo'q", 403);
            }
        }

        return prisma.jobGrade.update({
            where: { id: gradeId },
            data: {
                ...(payload.code ? { code: payload.code } : {}),
                ...(payload.title ? { title: payload.title } : {}),
                ...(payload.level !== undefined ? { level: payload.level } : {}),
                ...(payload.minSalary !== undefined ? { minSalary: payload.minSalary } : {}),
                ...(payload.maxSalary !== undefined ? { maxSalary: payload.maxSalary } : {}),
                ...(payload.requirements !== undefined ? { requirements: payload.requirements } : {}),
                ...(payload.responsibilities !== undefined ? { responsibilities: payload.responsibilities } : {}),
            },
        });
    }

    async deleteGrade(gradeId: string, currentUser?: any) {
        const grade = await prisma.jobGrade.findUnique({
            where: { id: gradeId },
            include: { _count: { select: { employees: true } } },
        });
        if (!grade) {
            throw new AppError("Greyd topilmadi", 404);
        }

        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (
                caller &&
                caller.role !== "SUPER_ADMIN" &&
                grade.companyName &&
                grade.companyName !== caller.companyName
            ) {
                throw new AppError("Ushbu greydni o'chirishga ruxsat yo'q", 403);
            }
        }

        if (grade._count.employees > 0) {
            throw new AppError("Ushbu greydga xodimlar biriktirilgan, uni o'chirib bo'lmaydi", 400);
        }

        await prisma.promotionRequest.deleteMany({
            where: { OR: [{ targetGradeId: gradeId }, { currentGradeId: gradeId }] },
        }).catch(() => {});

        return prisma.jobGrade.delete({
            where: { id: gradeId },
        });
    }

    async assignGradeToEmployee(employeeId: string, gradeId: string) {
        const grade = await prisma.jobGrade.findUnique({
            where: { id: gradeId },
        });
        if (!grade) throw new AppError("Job Grade not found", 404);

        const oldEmployee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { grade: true },
        });

        const updated = await prisma.employee.update({
            where: { id: employeeId },
            data: { gradeId },
            include: { grade: true, department: true },
        });

        if (oldEmployee?.grade?.title !== grade.title) {
            await prisma.careerHistory.create({
                data: {
                    employeeId,
                    oldGradeTitle: oldEmployee?.grade?.title || "Boshlang'ich",
                    newGradeTitle: grade.title,
                    newSalary: oldEmployee?.salary || grade.minSalary,
                    reason: "Greyd biriktirildi",
                },
            }).catch(() => {});
        }

        return updated;
    }

    async getEmployeesWithGrades(currentUser?: any) {
        let companyFilter: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }

        return prisma.employee.findMany({
            where: {
                user: {
                    ...(companyFilter ? { companyName: companyFilter } : {}),
                    role: { notIn: ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"] },
                },
            },
            include: {
                grade: true,
                department: { select: { id: true, name: true } },
                user: { select: { email: true, role: true, companyName: true } },
            },
            orderBy: [{ grade: { level: "desc" } }, { firstName: "asc" }],
        });
    }

    async getPromotionRequests(currentUser?: any) {
        let companyFilter: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }

        return prisma.promotionRequest.findMany({
            where: {
                ...(companyFilter
                    ? {
                          OR: [
                              { companyName: companyFilter },
                              { employee: { user: { companyName: companyFilter } } },
                          ],
                      }
                    : {}),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        salary: true,
                        department: { select: { name: true } },
                        position: true,
                    },
                },
                currentGrade: true,
                targetGrade: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async createPromotionRequest(payload: {
        employeeId: string;
        targetGradeId: string;
        proposedSalary: number;
        reason: string;
    }, currentUser?: any) {
        const employee = await prisma.employee.findUnique({
            where: { id: payload.employeeId },
            include: { grade: true, user: true },
        });

        if (!employee) throw new AppError("Xodim topilmadi", 404);

        const targetGrade = await prisma.jobGrade.findUnique({
            where: { id: payload.targetGradeId },
        });
        if (!targetGrade) throw new AppError("Tanlangan greyd topilmadi", 404);

        if (
            payload.proposedSalary < targetGrade.minSalary ||
            payload.proposedSalary > targetGrade.maxSalary
        ) {
            throw new AppError(
                `Taklif etilgan maosh greyd oralig'ida bo'lishi kerak (${targetGrade.minSalary.toLocaleString()} - ${targetGrade.maxSalary.toLocaleString()})`,
                400,
            );
        }

        const objectives = await prisma.objective.findMany({
            where: { employeeId: payload.employeeId },
        });
        const okrScore =
            objectives.length > 0
                ? Number(
                      (
                          objectives.reduce((acc, o) => acc + o.progress, 0) /
                          objectives.length
                      ).toFixed(2),
                  )
                : null;

        const assignments = await prisma.feedbackAssignment.findMany({
            where: { targetId: payload.employeeId, isCompleted: true },
            include: { answers: true },
        });

        let totalFeedbackScore = 0;
        let totalAnswers = 0;

        assignments.forEach((asg) => {
            asg.answers.forEach((ans) => {
                totalFeedbackScore += ans.score;
                totalAnswers += 1;
            });
        });

        const feedback360Score =
            totalAnswers > 0
                ? Number((totalFeedbackScore / totalAnswers).toFixed(2))
                : null;

        let companyName = employee.user?.companyName || null;
        if (!companyName && currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { companyName: true },
            });
            companyName = caller?.companyName || null;
        }

        return prisma.promotionRequest.create({
            data: {
                employeeId: payload.employeeId,
                currentGradeId: employee.gradeId,
                targetGradeId: payload.targetGradeId,
                proposedSalary: payload.proposedSalary,
                reason: payload.reason,
                okrScore,
                feedback360Score,
                companyName,
            },
            include: {
                employee: { select: { firstName: true, lastName: true } },
                targetGrade: true,
                currentGrade: true,
            },
        });
    }

    async processPromotionApproval(
        requestId: string,
        approverRole: "DEPARTMENT_HEAD" | "HR_ADMIN" | "DIRECTOR" | "SUPER_ADMIN",
        action: "APPROVE" | "REJECT",
    ) {
        const request = await prisma.promotionRequest.findUnique({
            where: { id: requestId },
            include: { employee: true, targetGrade: true, currentGrade: true },
        });

        if (!request) throw new AppError("Ko'tarilish so'rovi topilmadi", 404);
        if (
            request.status === "REJECTED" ||
            request.status === "APPROVED_BY_HR"
        ) {
            throw new AppError("So'rov allaqachon yakunlangan", 400);
        }

        if (action === "REJECT") {
            return prisma.promotionRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" },
            });
        }

        let updatedStatus: any = request.status;
        let managerApproval = request.managerApproval;
        let hrApproval = request.hrApproval;

        if (approverRole === "DEPARTMENT_HEAD") {
            managerApproval = true;
            updatedStatus = "APPROVED_BY_MANAGER";
        }

        if (approverRole === "HR_ADMIN" || approverRole === "DIRECTOR" || approverRole === "SUPER_ADMIN") {
            hrApproval = true;
            updatedStatus = "APPROVED_BY_HR";
        }

        const updatedRequest = await prisma.promotionRequest.update({
            where: { id: requestId },
            data: {
                status: updatedStatus,
                managerApproval,
                hrApproval,
            },
        });

        if (hrApproval) {
            await prisma.employee.update({
                where: { id: request.employeeId },
                data: {
                    gradeId: request.targetGradeId,
                    salary: request.proposedSalary,
                },
            });

            await prisma.careerHistory.create({
                data: {
                    employeeId: request.employeeId,
                    oldGradeTitle: request.currentGrade?.title || "Boshlang'ich",
                    newGradeTitle: request.targetGrade.title,
                    oldSalary: request.employee?.salary || request.currentGrade?.minSalary || 0,
                    newSalary: request.proposedSalary,
                    reason: `Ko'tarilish: ${request.reason}`,
                },
            });
        }

        return updatedRequest;
    }

    async getCareerHistory(employeeId: string) {
        return prisma.careerHistory.findMany({
            where: { employeeId },
            orderBy: { changedAt: "desc" },
        });
    }
}

export const gradingService = new GradingService();
