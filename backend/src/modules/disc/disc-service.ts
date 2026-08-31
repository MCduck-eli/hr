import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class DiscService {
    async createQuestion(payload: {
        text: string;
        order?: number;
        companyName?: string | null;
        options: {
            text: string;
            discType: "D" | "I" | "S" | "C";
            score?: number;
        }[];
    }, currentUser?: any) {
        let resolvedCompany = payload.companyName || null;
        if (!resolvedCompany && currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { companyName: true },
            });
            resolvedCompany = caller?.companyName || null;
        }

        return prisma.discQuestion.create({
            data: {
                text: payload.text,
                order: payload.order ?? 1,
                companyName: resolvedCompany,
                options: {
                    create: payload.options,
                },
            },
            include: { options: true },
        });
    }

    async updateQuestion(id: string, payload: {
        text?: string;
        order?: number;
        options?: {
            id?: string;
            text: string;
            discType: "D" | "I" | "S" | "C";
            score?: number;
        }[];
    }, currentUser?: any) {
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

        const question = await prisma.discQuestion.findFirst({
            where: {
                id,
                ...(companyFilter ? { companyName: companyFilter } : {}),
            },
        });
        if (!question) throw new AppError("Savol topilmadi", 404);

        if (payload.options && payload.options.length > 0) {
            await prisma.discOption.deleteMany({ where: { questionId: id } });
            return prisma.discQuestion.update({
                where: { id },
                data: {
                    ...(payload.text ? { text: payload.text } : {}),
                    ...(payload.order !== undefined ? { order: payload.order } : {}),
                    options: {
                        create: payload.options.map((o) => ({
                            text: o.text,
                            discType: o.discType,
                            score: o.score ?? 1,
                        })),
                    },
                },
                include: { options: true },
            });
        }

        return prisma.discQuestion.update({
            where: { id },
            data: {
                ...(payload.text ? { text: payload.text } : {}),
                ...(payload.order !== undefined ? { order: payload.order } : {}),
            },
            include: { options: true },
        });
    }

    async deleteQuestion(id: string, currentUser?: any) {
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

        const question = await prisma.discQuestion.findFirst({
            where: {
                id,
                ...(companyFilter ? { companyName: companyFilter } : {}),
            },
        });
        if (!question) throw new AppError("Savol topilmadi", 404);

        await prisma.discOption.deleteMany({ where: { questionId: id } });
        return prisma.discQuestion.delete({ where: { id } });
    }

    async getQuestions(currentUser?: any) {
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
            const companyCount = await prisma.discQuestion.count({
                where: { companyName: companyFilter },
            });

            if (companyCount === 0) {
                const seedQuestions = [
                    {
                        text: "Yangi loyiha yoki kutilmagan murakkab muammoga duch kelganingizda, birinchi navbatda nima qilasiz?",
                        order: 1,
                        options: [
                            { text: "Vaziyatni o'z qo'limga olaman, tezkor va qat'iy qarorlar qabul qilib harakatni boshlayman.", discType: "D" as const, score: 1 },
                            { text: "Jamoani yig'ib, barchani ilhomlantiraman va yangi g'oyalarni muhokama qilaman.", discType: "I" as const, score: 1 },
                            { text: "Vaziyatni bosiqlik bilan baholab, mavjud reja va jamoa a'zolariga yordam berishga kirishaman.", discType: "S" as const, score: 1 },
                            { text: "Barcha faktlar, ma'lumotlar va xatarlarni chuqur tahlil qilib, aniq reja tuzaman.", discType: "C" as const, score: 1 },
                        ],
                    },
                    {
                        text: "Jamoaviy yig'ilishlarda o'zingizni qanday tutasiz?",
                        order: 2,
                        options: [
                            { text: "Asosiy e'tiborni natijaga qarataman, ortiqcha gaplarsiz yakuniy qarorga kelishni talab qilaman.", discType: "D" as const, score: 1 },
                            { text: "Faol fikr bildiraman, muhitni erkin va do'stona saqlashga harakat qilaman.", discType: "I" as const, score: 1 },
                            { text: "Boshqalarni diqqat bilan tinglayman va umumiy kelishuvga (konsensusga) erishishni qo'llab-quvvatlayman.", discType: "S" as const, score: 1 },
                            { text: "Mantiqiy savollar beraman, hisob-kitoblar va qoidalar to'g'riligini tekshiraman.", discType: "C" as const, score: 1 },
                        ],
                    },
                    {
                        text: "Siz uchun ish faoliyatingizdagi eng muhim omil nima?",
                        order: 3,
                        options: [
                            { text: "Yuksak maqsadlarga erishish, g'alaba qozonish va mustaqil bo'lish.", discType: "D" as const, score: 1 },
                            { text: "E'tirof etilish, odamlar bilan aloqada bo'lish va ijodiy erkinlik.", discType: "I" as const, score: 1 },
                            { text: "Barqarorlik, jamoaviy ishonch va xavfsiz ish muhiti.", discType: "S" as const, score: 1 },
                            { text: "Yuqori sifat, aniqlik, mukammallik va xatolarga yo'l qo'ymaslik.", discType: "C" as const, score: 1 },
                        ],
                    },
                    {
                        text: "Kutilmagan o'zgarishlar yoki stressli vaziyatda qanday munosabat bildirasiz?",
                        order: 4,
                        options: [
                            { text: "Tezda moslashaman va vaziyatni boshqarishga kirishaman.", discType: "D" as const, score: 1 },
                            { text: "Ijobiy (optimizm) kayfiyatni saqlayman va boshqalarga dalda beraman.", discType: "I" as const, score: 1 },
                            { text: "Bir oz noqulaylik sezsam-da, tartib bilan jamoaga tayanch bo'lishga harakat qilaman.", discType: "S" as const, score: 1 },
                            { text: "Yangi sharoitlarni diqqat bilan o'rganaman va o'zgarishlar mantig'ini tushunishga intilaman.", discType: "C" as const, score: 1 },
                        ],
                    },
                    {
                        text: "Boshqalar sizni ko'proq qanday inson deb bilishadi?",
                        order: 5,
                        options: [
                            { text: "Qat'iyatli, to'g'riso'z va maqsadiga intiluvchan lider.", discType: "D" as const, score: 1 },
                            { text: "Xushchaqchaq, muloqotga ochiq va ilhom beruvchi.", discType: "I" as const, score: 1 },
                            { text: "Ishonchli, sadoqatli, samimiy va sabrli hamkasb.", discType: "S" as const, score: 1 },
                            { text: "Tartibli, mas'uliyatli, har bir detalga e'tiborli mutaxassis.", discType: "C" as const, score: 1 },
                        ],
                    },
                    {
                        text: "Biror muhim vazifani bajarishda sizning ustuvorligingiz qanday?",
                        order: 6,
                        options: [
                            { text: "Vazifani tez va belgilangan muddatdan oldin yakunlash.", discType: "D" as const, score: 1 },
                            { text: "Jarayon qiziqarli va odamlarni jalb qiladigan bo'lishi.", discType: "I" as const, score: 1 },
                            { text: "Jarayon silliq va bir maromda, asabiylashuvlarsiz o'tishi.", discType: "S" as const, score: 1 },
                            { text: "Hamma narsa 100% to'g'ri, standartlarga mos va mukammal bajarilishi.", discType: "C" as const, score: 1 },
                        ],
                    },
                    {
                        text: "Hamkasblar o'rtasida ziddiyat (konflikt) paydo bo'lsa, nima qilasiz?",
                        order: 7,
                        options: [
                            { text: "Muammoni ochiq yuzma-yuz muhokama qilib, zudlik bilan yechim topaman.", discType: "D" as const, score: 1 },
                            { text: "Hazil va iliq munosabat bilan vaziyatni yumshatishga harakat qilaman.", discType: "I" as const, score: 1 },
                            { text: "Ikkala tomonni tinglab, oradagi munosabatni saqlab qolishga ko'maklashaman.", discType: "S" as const, score: 1 },
                            { text: "Faktlar va qoidalarga asoslanib, kim qayerda haq yoki nohaqligini aniqlayman.", discType: "C" as const, score: 1 },
                        ],
                    },
                    {
                        text: "Sizga qanday ish muhiti ko'proq yoqadi?",
                        order: 8,
                        options: [
                            { text: "Tez sur'atlarda o'suvchi, raqobatbardosh va chaqiriqlarga boy.", discType: "D" as const, score: 1 },
                            { text: "Ijtimoiy, ochiq, ko'p muloqot va tadbirlarga boy.", discType: "I" as const, score: 1 },
                            { text: "Tinch, ahil, barqaror va o'zaro mehr-oqibatli.", discType: "S" as const, score: 1 },
                            { text: "Strukturaviy, aniq qoidalarga ega, tahliliy va sokin.", discType: "C" as const, score: 1 },
                        ],
                    },
                    {
                        text: "Qaror qabul qilishda asosan nimaga tayanasiz?",
                        order: 9,
                        options: [
                            { text: "Intuisiya, tezkor fikrlash va yakuniy samara.", discType: "D" as const, score: 1 },
                            { text: "Tuyg'ular, odamlarning munosabati va umumiy kayfiyat.", discType: "I" as const, score: 1 },
                            { text: "O'tmishdagi sinovdan o'tgan tajribalar va jamoa xavfsizligi.", discType: "S" as const, score: 1 },
                            { text: "Statistika, qonun-qoidalar, tahliliy jadvallar va dalillar.", discType: "C" as const, score: 1 },
                        ],
                    },
                    {
                        text: "Sizni eng ko'p bezovta qiladigan holat nima?",
                        order: 10,
                        options: [
                            { text: "Samarasizlik, sustkashlik va vaqtni behuda sarflash.", discType: "D" as const, score: 1 },
                            { text: "E'tibordan chetda qolish, monotonlik va qattiq cheklovlar.", discType: "I" as const, score: 1 },
                            { text: "To'satdan o'zgarishlar, noaniqlik va jamoadagi beqarorlik.", discType: "S" as const, score: 1 },
                            { text: "Xatolar, tartibsizlik, yuzakilik va mantiqsizlik.", discType: "C" as const, score: 1 },
                        ],
                    },
                ];

                for (const q of seedQuestions) {
                    await prisma.discQuestion.create({
                        data: {
                            text: q.text,
                            order: q.order,
                            companyName: companyFilter,
                            options: {
                                create: q.options,
                            },
                        },
                    }).catch(() => {});
                }
            }

            return prisma.discQuestion.findMany({
                where: { companyName: companyFilter },
                include: { options: true },
                orderBy: { order: "asc" },
            });
        }

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

    async getTeamDiscAnalytics(departmentId?: string, currentUser?: any) {
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

        const where: any = {
            user: {
                ...(companyFilter ? { companyName: companyFilter } : {}),
                role: { notIn: ["SUPER_ADMIN"] },
            },
        };
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
