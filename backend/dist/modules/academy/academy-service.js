"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.academyService = exports.AcademyService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
class AcademyService {
    async createCategory(payload) {
        return db_1.default.academyCategory.create({ data: payload });
    }
    async getAllCategories() {
        return db_1.default.academyCategory.findMany({
            include: { _count: { select: { courses: true } } },
        });
    }
    async createCourse(payload, currentUser) {
        let companyName = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller?.companyName) {
                companyName = caller.companyName;
            }
        }
        const course = await db_1.default.academyCourse.create({
            data: {
                title: payload.title,
                description: payload.description,
                coverUrl: payload.coverUrl,
                videoUrl: payload.videoUrl,
                isRequired: payload.isRequired || false,
                categoryId: payload.categoryId || null,
                targetDepartmentId: payload.targetDepartmentId || null,
                targetEmployeeId: payload.targetEmployeeId || null,
                targetStatusConfigId: payload.targetStatusConfigId || null,
                companyName,
            },
            include: {
                category: true,
                targetDepartment: true,
                targetEmployee: true,
                targetStatusConfig: true,
            },
        });
        return course;
    }
    async deleteCourse(courseId) {
        const course = await db_1.default.academyCourse.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new appError_1.AppError("Course not found", 404);
        }
        await db_1.default.courseProgress.deleteMany({ where: { courseId } }).catch(() => { });
        await db_1.default.courseCertificate.deleteMany({ where: { courseId } }).catch(() => { });
        await db_1.default.academyQuiz.deleteMany({ where: { courseId } }).catch(() => { });
        await db_1.default.academyResource.deleteMany({ where: { courseId } }).catch(() => { });
        await db_1.default.academyLesson.deleteMany({ where: { courseId } }).catch(() => { });
        return db_1.default.academyCourse.delete({
            where: { id: courseId },
        });
    }
    async addLesson(courseId, payload) {
        return db_1.default.academyLesson.create({
            data: {
                courseId,
                ...payload,
            },
        });
    }
    async addResource(courseId, payload) {
        return db_1.default.academyResource.create({
            data: {
                courseId,
                ...payload,
            },
        });
    }
    async addQuiz(courseId, payload) {
        return db_1.default.academyQuiz.create({
            data: {
                courseId,
                ...payload,
            },
        });
    }
    async getAllCourses(userId, role, categoryId) {
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true, companyName: true },
        });
        let employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee && user && (user.role === "SUPER_ADMIN" || user.role === "HR_ADMIN" || user.role === "DIRECTOR")) {
            employee = await db_1.default.employee.findFirst({
                where: { userId },
            });
            if (!employee) {
                employee = await db_1.default.employee.create({
                    data: {
                        userId,
                        firstName: "Admin",
                        lastName: "User",
                        status: "NEW",
                    },
                });
            }
        }
        const where = {};
        if (user && user.role !== "SUPER_ADMIN" && user.companyName) {
            where.companyName = user.companyName;
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (employee && role !== "HR_ADMIN" && role !== "SUPER_ADMIN" && role !== "DIRECTOR") {
            const orConditions = [
                { targetEmployeeId: employee.id },
                {
                    AND: [
                        { targetEmployeeId: null },
                        { targetDepartmentId: null },
                        { targetStatusConfigId: null },
                    ],
                },
            ];
            if (employee.departmentId) {
                orConditions.push({
                    targetDepartmentId: employee.departmentId,
                    targetStatusConfigId: null,
                });
            }
            if (employee.statusConfigId) {
                orConditions.push({
                    targetStatusConfigId: employee.statusConfigId,
                    targetDepartmentId: null,
                });
                if (employee.departmentId) {
                    orConditions.push({
                        targetDepartmentId: employee.departmentId,
                        targetStatusConfigId: employee.statusConfigId,
                    });
                }
            }
            where.OR = orConditions;
        }
        const courses = await db_1.default.academyCourse.findMany({
            where,
            include: {
                category: true,
                targetDepartment: true,
                targetEmployee: true,
                targetStatusConfig: true,
                _count: {
                    select: { lessons: true, quizzes: true, resources: true },
                },
                progress: employee
                    ? {
                        where: { employeeId: employee.id },
                    }
                    : false,
            },
            orderBy: { createdAt: "desc" },
        });
        return courses.map((course) => {
            const userProgress = course.progress?.[0];
            const pVal = userProgress?.progressPercent || 0;
            const done = userProgress?.isCompleted || pVal >= 95;
            return {
                ...course,
                isCompleted: done,
                progress: pVal,
                progressPercent: pVal,
                quizScore: userProgress?.quizScore || null,
            };
        });
    }
    async updateCourseProgress(userId, courseId, progressPercent) {
        let employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            employee = await db_1.default.employee.findUnique({
                where: { id: userId },
            });
        }
        if (!employee) {
            const user = await db_1.default.user.findUnique({ where: { id: userId } });
            if (user) {
                employee = await db_1.default.employee.create({
                    data: {
                        userId: user.id,
                        firstName: user.email.split("@")[0] || "User",
                        lastName: "Employee",
                        status: "NEW",
                    },
                });
            }
        }
        if (!employee) {
            throw new appError_1.AppError("Employee profile not found", 404);
        }
        const isCompleted = progressPercent >= 95;
        return db_1.default.courseProgress.upsert({
            where: {
                courseId_employeeId: {
                    courseId,
                    employeeId: employee.id,
                },
            },
            update: {
                progressPercent,
                isCompleted: isCompleted ? true : undefined,
                completedAt: isCompleted ? new Date() : undefined,
            },
            create: {
                courseId,
                employeeId: employee.id,
                progressPercent,
                isCompleted,
                completedAt: isCompleted ? new Date() : undefined,
            },
        });
    }
    async getCourseDetails(courseId) {
        const course = await db_1.default.academyCourse.findUnique({
            where: { id: courseId },
            include: {
                category: true,
                lessons: { orderBy: { order: "asc" } },
                resources: true,
                quizzes: {
                    select: { id: true, question: true, options: true },
                },
            },
        });
        if (!course) {
            throw new appError_1.AppError("Course not found", 404);
        }
        return course;
    }
    async submitQuiz(userId, courseId, answers) {
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new appError_1.AppError("Employee profile not found", 404);
        }
        const quizzes = await db_1.default.academyQuiz.findMany({
            where: { courseId },
        });
        if (quizzes.length === 0) {
            throw new appError_1.AppError("No quizzes found for this course", 400);
        }
        let correctAnswers = 0;
        quizzes.forEach((quiz) => {
            const userAnswer = answers.find((a) => a.quizId === quiz.id);
            if (userAnswer && userAnswer.selectedOption === quiz.answer) {
                correctAnswers++;
            }
        });
        const scorePercentage = Math.round((correctAnswers / quizzes.length) * 100);
        const isCompleted = scorePercentage >= 70;
        const progress = await db_1.default.courseProgress.upsert({
            where: {
                courseId_employeeId: {
                    courseId,
                    employeeId: employee.id,
                },
            },
            update: {
                isCompleted,
                quizScore: scorePercentage,
                completedAt: isCompleted ? new Date() : null,
            },
            create: {
                courseId,
                employeeId: employee.id,
                isCompleted,
                quizScore: scorePercentage,
                completedAt: isCompleted ? new Date() : null,
            },
        });
        if (isCompleted) {
            const certNum = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            await db_1.default.courseCertificate.upsert({
                where: {
                    courseId_employeeId: {
                        courseId,
                        employeeId: employee.id,
                    },
                },
                update: {},
                create: {
                    courseId,
                    employeeId: employee.id,
                    certificateNumber: certNum,
                },
            });
        }
        return progress;
    }
    async createEvent(payload) {
        return db_1.default.trainingEvent.create({
            data: {
                ...payload,
                eventDate: new Date(payload.eventDate),
            },
        });
    }
    async getEvents(userId) {
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new appError_1.AppError("Employee profile not found", 404);
        }
        const events = await db_1.default.trainingEvent.findMany({
            include: {
                _count: { select: { registrations: true } },
                registrations: {
                    where: { employeeId: employee.id },
                },
            },
            orderBy: { eventDate: "asc" },
        });
        return events.map((event) => ({
            ...event,
            isRegistered: event.registrations.length > 0,
            isFull: event._count.registrations >= event.capacity,
        }));
    }
    async registerEvent(userId, eventId) {
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new appError_1.AppError("Employee profile not found", 404);
        }
        const event = await db_1.default.trainingEvent.findUnique({
            where: { id: eventId },
            include: { _count: { select: { registrations: true } } },
        });
        if (!event) {
            throw new appError_1.AppError("Event not found", 404);
        }
        if (event._count.registrations >= event.capacity) {
            throw new appError_1.AppError("Event capacity is full", 400);
        }
        return db_1.default.eventRegistration.create({
            data: {
                eventId,
                employeeId: employee.id,
            },
        });
    }
    async getMyCertificates(userId) {
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new appError_1.AppError("Employee profile not found", 404);
        }
        return db_1.default.courseCertificate.findMany({
            where: { employeeId: employee.id },
            include: { course: true },
        });
    }
    async updateCourse(courseId, payload, currentUser) {
        const course = await db_1.default.academyCourse.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new appError_1.AppError("Course not found", 404);
        }
        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (course.companyName && course.companyName !== currentUser.companyName) {
                throw new appError_1.AppError("Unauthorized - Course belongs to another company", 403);
            }
        }
        return db_1.default.academyCourse.update({
            where: { id: courseId },
            data: payload,
            include: {
                category: true,
                targetDepartment: true,
                targetEmployee: true,
                targetStatusConfig: true,
            },
        });
    }
}
exports.AcademyService = AcademyService;
exports.academyService = new AcademyService();
