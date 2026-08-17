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
    async createCourse(payload: {
        title: string;
        description?: string;
        coverUrl?: string;
        videoUrl?: string;
        isRequired?: boolean;
        categoryId?: string;
    }) {
        const course = await prisma.academyCourse.create({
            data: payload,
        });

        const allEmployees = await prisma.employee.findMany({
            select: { id: true },
        });

        if (allEmployees.length > 0) {
            const progressData = allEmployees.map((emp) => ({
                employeeId: emp.id,
                courseId: course.id,
                isCompleted: false,
            }));

            await prisma.courseProgress.createMany({
                data: progressData,
                skipDuplicates: true,
            });
        }

        return course;
    }
    async deleteCourse(courseId: string) {
        const course = await prisma.academyCourse.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new AppError("Course not found", 404);
        }

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

    async getAllCourses(userId: string, categoryId?: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        const where: any = {};
        if (categoryId) {
            where.categoryId = categoryId;
        }

        const courses = await prisma.academyCourse.findMany({
            where,
            include: {
                category: true,
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
        },
    ) {
        const course = await prisma.academyCourse.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new AppError("Course not found", 404);
        }

        return prisma.academyCourse.update({
            where: { id: courseId },
            data: payload,
        });
    }

    async assignAcademy(payload: { employeeId: string }) {
        const courses = await prisma.academyCourse.findMany();

        if (courses.length > 0) {
            await prisma.courseProgress.createMany({
                data: courses.map((course) => ({
                    employeeId: payload.employeeId,
                    courseId: course.id,
                    isCompleted: false,
                })),
                skipDuplicates: true,
            });
        }

        return prisma.courseProgress.findMany({
            where: { employeeId: payload.employeeId },
            include: { course: true },
        });
    }

    async getAssignedEmployees() {
        const progresses = await prisma.courseProgress.findMany({
            select: { employeeId: true },
            distinct: ["employeeId"],
        });
        return progresses.map((p) => p.employeeId);
    }
}

export const academyService = new AcademyService();
