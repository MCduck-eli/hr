import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class DiscService {
    async createQuestion(payload: {
        text: string;
        order?: number;
        options: {
            text: string;
            discType: "D" | "I" | "S" | "C";
            score?: number;
        }[];
    }) {
        return prisma.discQuestion.create({
            data: {
                text: payload.text,
                order: payload.order ?? 1,
                options: {
                    create: payload.options,
                },
            },
            include: { options: true },
        });
    }

    async getQuestions() {
        return prisma.discQuestion.findMany({
            include: { options: true },
            orderBy: { order: "asc" },
        });
    }

    async submitAssessment(
        userId: string,
        answers: { questionId: string; optionId: string }[],
    ) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        const optionIds = answers.map((a) => a.optionId);
        const selectedOptions = await prisma.discOption.findMany({
            where: { id: { in: optionIds } },
        });

        const optionMap = new Map(selectedOptions.map((opt) => [opt.id, opt]));

        let dRaw = 0;
        let iRaw = 0;
        let sRaw = 0;
        let cRaw = 0;

        const responseData: {
            questionId: string;
            optionId: string;
            discType: "D" | "I" | "S" | "C";
        }[] = [];

        answers.forEach((ans) => {
            const opt = optionMap.get(ans.optionId);
            if (opt) {
                if (opt.discType === "D") dRaw += opt.score;
                if (opt.discType === "I") iRaw += opt.score;
                if (opt.discType === "S") sRaw += opt.score;
                if (opt.discType === "C") cRaw += opt.score;

                responseData.push({
                    questionId: ans.questionId,
                    optionId: ans.optionId,
                    discType: opt.discType,
                });
            }
        });

        const totalScore = dRaw + iRaw + sRaw + cRaw || 1;
        const dScore = Math.round((dRaw / totalScore) * 100);
        const iScore = Math.round((iRaw / totalScore) * 100);
        const sScore = Math.round((sRaw / totalScore) * 100);
        const cScore = Math.round((cRaw / totalScore) * 100);

        const scores = [
            { type: "D" as const, score: dScore },
            { type: "I" as const, score: iScore },
            { type: "S" as const, score: sScore },
            { type: "C" as const, score: cScore },
        ].sort((a, b) => b.score - a.score);

        const primaryType = scores[0].type;
        const secondaryType = scores[1].score > 15 ? scores[1].type : null;

        return prisma.discAssessment.create({
            data: {
                employeeId: employee.id,
                dScore,
                iScore,
                sScore,
                cScore,
                primaryType,
                secondaryType,
                responses: {
                    create: responseData,
                },
            },
            include: {
                employee: { select: { firstName: true, lastName: true } },
            },
        });
    }

    async getMyDiscProfile(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) throw new AppError("Employee profile not found", 404);

        const latestAssessment = await prisma.discAssessment.findFirst({
            where: { employeeId: employee.id },
            orderBy: { createdAt: "desc" },
        });

        if (!latestAssessment) {
            return { hasTakenTest: false, assessment: null, description: null };
        }

        const descriptions = this.getDiscTypeDescription(
            latestAssessment.primaryType,
            latestAssessment.secondaryType,
        );

        return {
            hasTakenTest: true,
            assessment: latestAssessment,
            description: descriptions,
        };
    }

    async getTeamDiscAnalytics(departmentId?: string) {
        const where: any = {};
        if (departmentId) where.departmentId = departmentId;

        const employees = await prisma.employee.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                department: { select: { name: true } },
                position: { select: { title: true } },
                discAssessments: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        let countD = 0;
        let countI = 0;
        let countS = 0;
        let countC = 0;
        let totalAssessed = 0;

        const members: any[] = [];

        employees.forEach((emp) => {
            const latest = emp.discAssessments[0];
            if (latest) {
                totalAssessed++;
                if (latest.primaryType === "D") countD++;
                if (latest.primaryType === "I") countI++;
                if (latest.primaryType === "S") countS++;
                if (latest.primaryType === "C") countC++;

                members.push({
                    employeeId: emp.id,
                    fullName: `${emp.firstName} ${emp.lastName}`,
                    department: emp.department?.name,
                    position: emp.position?.title,
                    primaryType: latest.primaryType,
                    secondaryType: latest.secondaryType,
                    scores: {
                        D: latest.dScore,
                        I: latest.iScore,
                        S: latest.sScore,
                        C: latest.cScore,
                    },
                });
            }
        });

        const total = totalAssessed || 1;

        return {
            totalEmployees: employees.length,
            totalAssessed,
            distribution: {
                D: Math.round((countD / total) * 100),
                I: Math.round((countI / total) * 100),
                S: Math.round((countS / total) * 100),
                C: Math.round((countC / total) * 100),
            },
            members,
        };
    }

    private getDiscTypeDescription(primary: string, secondary?: string | null) {
        const baseDescriptions: Record<string, any> = {
            D: {
                title: "Dominance (Yetakchi / Qaror qabul qiluvchi)",
                traits: "Natijaga yo'naltirilgan, qat'iyatli, tez qaror qabul qiladigan va qiyinchiliklardan qo'rqmaydigan.",
                communication:
                    "Aniq, qisqa va natijaga qaratilgan muloqotni afzal ko'radi.",
                strengths:
                    "Muammolarni tez hal qilish, xatarlarni o'z zimmasiga olish va liderlik.",
            },
            I: {
                title: "Influence (Ta'sirchan / Muloqotmand)",
                traits: "Ochiq ko'ngil, ilhomlantiruvchi, xushchaqchaq va jamoani birlashtiruvchi.",
                communication:
                    "Esterial va ijtimoiy muloqot, do'stona muhitni xush ko'radi.",
                strengths:
                    "Taqdimot qilish, munosabatlar o'rnatish va motivatsiya berish.",
            },
            S: {
                title: "Steadiness (Barqaror / Sadoqatli)",
                traits: "Bosiq, sabrli, jamoada hamkorlikni va barqarorlikni birinchi o'ringa qo'yadigan.",
                communication:
                    "Yumshoq, tinglashga tayyor va tushunishga intiluvchi muloqot.",
                strengths:
                    "Izchillik, ishonchlilik va kuchli jamoaviy qo'llab-quvvatlash.",
            },
            C: {
                title: "Conscientiousness (Aniq / Tahlilchi)",
                traits: "Sifat, aniqlik, mantiq va qoidalarga qat'iy rioya qiladigan.",
                communication:
                    "Faktlar va raqamlarga asoslangan jiddiy muloqot.",
                strengths: "Tahlil qilish, sifat nazorati va tartib-intizom.",
            },
        };

        return {
            primary: baseDescriptions[primary] || null,
            secondaryType: secondary || null,
        };
    }
}

export const discService = new DiscService();
