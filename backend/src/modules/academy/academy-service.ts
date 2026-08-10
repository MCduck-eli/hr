import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class AcademyService {
    async createCourse(payload: {
        title: string;
        description?: string;
        coverUrl?: string;
        isRequired?: boolean;
    }) {
        return prisma.academyCourse.create({
            data: payload,
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

    async getAllCourses(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        const courses = await prisma.academyCourse.findMany({
            include: {
                _count: { select: { lessons: true, quizzes: true } },
                progress: {
                    where: { employeeId: employee.id },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return courses.map((course) => ({
            ...course,
            isCompleted: course.progress[0]?.isCompleted || false,
            quizScore: course.progress[0]?.quizScore || null,
        }));
    }

    async getCourseDetails(courseId: string) {
        const course = await prisma.academyCourse.findUnique({
            where: { id: courseId },
            include: {
                lessons: { orderBy: { order: "asc" } },
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

        return prisma.courseProgress.upsert({
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
    }
}

export const academyService = new AcademyService();
