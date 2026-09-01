import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class AcademyService {
    async createCategory(payload: { name: string; description?: string }) {
        return prisma.academyCategory.create({ data: payload });
    }

    async getAllCategories() {
        return prisma.academyCategory.findMany({
            include: { _count: { select: { courses: true } } },
        });
    }
    async createCourse(
        payload: {
            title: string;
            description?: string;
            coverUrl?: string;
            videoUrl?: string;
            isRequired?: boolean;
            categoryId?: string;
            targetDepartmentId?: string | null;
            targetEmployeeId?: string | null;
            targetStatusConfigId?: string | null;
        },
        currentUser?: any,
    ) {
        let companyName: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller?.companyName) {
                companyName = caller.companyName;
            }
        }

        const course = await prisma.academyCourse.create({
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
    async deleteCourse(courseId: string) {
        const course = await prisma.academyCourse.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new AppError("Course not found", 404);
        }

        await prisma.courseProgress.deleteMany({ where: { courseId } }).catch(() => {});
        await prisma.courseCertificate.deleteMany({ where: { courseId } }).catch(() => {});
        await prisma.academyQuiz.deleteMany({ where: { courseId } }).catch(() => {});
        await prisma.academyResource.deleteMany({ where: { courseId } }).catch(() => {});
        await prisma.academyLesson.deleteMany({ where: { courseId } }).catch(() => {});

        return prisma.academyCourse.delete({
            where: { id: courseId },
        });
    }

    async addLesson(
        courseId: string,
        payload: {
            title: string;
            videoUrl: string;
            content?: string;
            order?: number;
        },
    ) {
        return prisma.academyLesson.create({
            data: {
                courseId,
                ...payload,
            },
        });
    }

    async addResource(
        courseId: string,
        payload: { title: string; fileUrl: string; fileType: string },
    ) {
        return prisma.academyResource.create({
            data: {
                courseId,
                ...payload,
            },
        });
    }

    async addQuiz(
        courseId: string,
        payload: { question: string; options: string[]; answer: number },
    ) {
        return prisma.academyQuiz.create({
            data: {
                courseId,
                ...payload,
            },
        });
    }

    async getAllCourses(userId: string, role: string, categoryId?: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, companyName: true },
        });

        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        const where: any = {};
        if (user && user.role !== "SUPER_ADMIN" && user.companyName) {
            where.companyName = user.companyName;
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (employee && role !== "HR_ADMIN" && role !== "SUPER_ADMIN" && role !== "DIRECTOR") {
            const orConditions: any[] = [
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

        const courses = await prisma.academyCourse.findMany({
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

        return courses.map((course: any) => ({
            ...course,
            isCompleted: course.progress?.[0]?.isCompleted || false,
            quizScore: course.progress?.[0]?.quizScore || null,
        }));
    }

    async getCourseDetails(courseId: string) {
        const course = await prisma.academyCourse.findUnique({
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
            throw new AppError("Course not found", 404);
        }

        return course;
    }

    async submitQuiz(
        userId: string,
        courseId: string,
        answers: { quizId: string; selectedOption: number }[],
    ) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        const quizzes = await prisma.academyQuiz.findMany({
            where: { courseId },
        });

        if (quizzes.length === 0) {
            throw new AppError("No quizzes found for this course", 400);
        }

        let correctAnswers = 0;
        quizzes.forEach((quiz) => {
            const userAnswer = answers.find((a) => a.quizId === quiz.id);
            if (userAnswer && userAnswer.selectedOption === quiz.answer) {
                correctAnswers++;
            }
        });

        const scorePercentage = Math.round(
            (correctAnswers / quizzes.length) * 100,
        );
        const isCompleted = scorePercentage >= 70;

        const progress = await prisma.courseProgress.upsert({
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
            await prisma.courseCertificate.upsert({
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

    async createEvent(payload: {
        title: string;
        description?: string;
        eventType: any;
        locationOrUrl: string;
        eventDate: string;
        capacity: number;
    }) {
        return prisma.trainingEvent.create({
            data: {
                ...payload,
                eventDate: new Date(payload.eventDate),
            },
        });
    }

    async getEvents(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        const events = await prisma.trainingEvent.findMany({
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

    async registerEvent(userId: string, eventId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        const event = await prisma.trainingEvent.findUnique({
            where: { id: eventId },
            include: { _count: { select: { registrations: true } } },
        });

        if (!event) {
            throw new AppError("Event not found", 404);
        }

        if (event._count.registrations >= event.capacity) {
            throw new AppError("Event capacity is full", 400);
        }

        return prisma.eventRegistration.create({
            data: {
                eventId,
                employeeId: employee.id,
            },
        });
    }

    async getMyCertificates(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        return prisma.courseCertificate.findMany({
            where: { employeeId: employee.id },
            include: { course: true },
        });
    }

    async updateCourse(
        courseId: string,
        payload: {
            title?: string;
            description?: string;
            coverUrl?: string;
            videoUrl?: string;
            isRequired?: boolean;
            categoryId?: string;
            targetDepartmentId?: string | null;
            targetEmployeeId?: string | null;
            targetStatusConfigId?: string | null;
        },
        currentUser?: any,
    ) {
        const course = await prisma.academyCourse.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new AppError("Course not found", 404);
        }

        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (course.companyName && course.companyName !== currentUser.companyName) {
                throw new AppError("Unauthorized - Course belongs to another company", 403);
            }
        }

        return prisma.academyCourse.update({
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

export const academyService = new AcademyService();
