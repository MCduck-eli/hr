import prisma from "../../config/db";

export class AnalyticsService {
    private async resolveCallerCompany(currentUser?: any): Promise<string | null> {
        if (!currentUser?.id) return null;
        if (currentUser.role === "SUPER_ADMIN" && !currentUser.companyName) return null;
        if (currentUser.companyName) return currentUser.companyName;

        const caller = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { role: true, companyName: true },
        });

        if (caller && caller.role !== "SUPER_ADMIN") {
            return caller.companyName || null;
        }
        return currentUser.companyName || null;
    }

    async getExecutiveSummary(query: { timeframe?: string; departmentId?: string }, currentUser?: any) {
        const callerCompany = await this.resolveCallerCompany(currentUser);

        const whereEmployeeBase: any = {
            user: {
                ...(callerCompany ? { companyName: callerCompany } : {}),
                role: { notIn: ["SUPER_ADMIN", "DIRECTOR"] },
            },
            ...(query.departmentId ? { departmentId: query.departmentId } : {}),
        };

        const activeEmployees = await prisma.employee.findMany({
            where: {
                ...whereEmployeeBase,
                status: { not: "TERMINATED" },
            },
            include: {
                department: true,
                position: true,
                grade: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        companyName: true,
                    },
                },
                objectives: {
                    include: {
                        keyResults: {
                            include: {
                                checkIns: {
                                    orderBy: { createdAt: "desc" },
                                },
                            },
                        },
                    },
                },
                courseProgresses: {
                    include: {
                        course: true,
                    },
                },
                certificates: true,
                onboarding: {
                    include: {
                        tasks: true,
                        courses: true,
                    },
                },
                discAssessments: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                feedbackTargets: {
                    where: { isCompleted: true },
                    include: {
                        answers: true,
                    },
                },
                penalties: true,
            },
        });

        const allEmployees = await prisma.employee.findMany({
            where: whereEmployeeBase,
            include: {
                department: true,
                user: true,
                offboarding: true,
                lifecycleEvents: {
                    where: { eventType: "TERMINATED" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        const allObjectives = await prisma.objective.findMany({
            where: {
                ...(callerCompany ? { OR: [{ companyName: callerCompany }, { companyName: null }] } : {}),
            },
            include: {
                keyResults: {
                    include: {
                        checkIns: {
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
            },
        });

        const totalActive = activeEmployees.length;

        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const getEmployeeTerminationDate = (emp: any): Date | null => {
            if (emp.status !== "TERMINATED") return null;
            if (emp.offboarding?.lastWorkingDay) {
                return new Date(emp.offboarding.lastWorkingDay);
            }
            if (emp.lifecycleEvents && emp.lifecycleEvents.length > 0) {
                return new Date(emp.lifecycleEvents[0].createdAt);
            }
            if (emp.offboarding?.updatedAt) {
                return new Date(emp.offboarding.updatedAt);
            }
            return new Date(emp.updatedAt);
        };

        const newHiresYear = allEmployees.filter(
            (e) => e.status !== "TERMINATED" && new Date(e.hireDate || e.createdAt) >= startOfYear,
        ).length;

        const terminationsYear = allEmployees.filter((e) => {
            const termDate = getEmployeeTerminationDate(e);
            return termDate && termDate >= startOfYear;
        }).length;

        const avgTenureDays =
            totalActive > 0
                ? activeEmployees.reduce((acc, e) => {
                      const joined = new Date(e.hireDate || e.createdAt).getTime();
                      return acc + Math.max(0, now.getTime() - joined);
                  }, 0) /
                  totalActive /
                  (1000 * 60 * 60 * 24)
                : 0;

        const avgTenureMonths = Math.round((avgTenureDays / 30.4375) * 10) / 10;

        const averageHeadcountYear = Math.max(1, totalActive + terminationsYear / 2);
        const turnoverRate = Number(((terminationsYear / averageHeadcountYear) * 100).toFixed(1));
        const retentionRate = Number(Math.max(0, Math.min(100, 100 - turnoverRate)).toFixed(1));

        const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        const monthlyTurnoverTrend: any[] = [];

        for (let i = 5; i >= 0; i--) {
            const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const label = `${monthNames[mDate.getMonth()]} ${mDate.getFullYear()}`;

            const hires = allEmployees.filter((e) => {
                const d = new Date(e.hireDate || e.createdAt);
                return d >= mDate && d < nextMDate && e.status !== "TERMINATED";
            }).length;

            const exits = allEmployees.filter((e) => {
                const termDate = getEmployeeTerminationDate(e);
                return termDate && termDate >= mDate && termDate < nextMDate;
            }).length;

            const approximateMonthlyBase = Math.max(1, totalActive + exits / 2);
            const mRate = Number(((exits / approximateMonthlyBase) * 100).toFixed(1));

            monthlyTurnoverTrend.push({
                month: label,
                monthIndex: mDate.getMonth(),
                year: mDate.getFullYear(),
                hires,
                exits,
                turnoverRate: mRate,
                retentionRate: Number(Math.max(0, Math.min(100, 100 - mRate)).toFixed(1)),
            });
        }

        let enpsResponses: any[] = [];
        try {
            const rawResponses = await prisma.enpsResponse.findMany({
                where: {
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                    ...(query.departmentId ? { employee: { departmentId: query.departmentId } } : {}),
                },
                include: {
                    employee: {
                        select: {
                            firstName: true,
                            lastName: true,
                            department: { select: { name: true } },
                            position: { select: { title: true } },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            const latestMap = new Map<string, typeof rawResponses[0]>();
            for (const r of rawResponses) {
                if (!latestMap.has(r.employeeId)) {
                    latestMap.set(r.employeeId, r);
                }
            }
            enpsResponses = Array.from(latestMap.values());
        } catch (e) {
            enpsResponses = [];
        }

        const nineBox = this.calculateNineBoxGrid(activeEmployees, allObjectives);

        let eNpsScore = 0;
        let promotersCount = 0;
        let passivesCount = 0;
        let detractorsCount = 0;
        const totalResponses = enpsResponses.length;

        if (totalResponses > 0) {
            for (const r of enpsResponses) {
                const score = r.score || 0;
                if (score >= 9) {
                    promotersCount++;
                } else if (score >= 7) {
                    passivesCount++;
                } else {
                    detractorsCount++;
                }
            }
            eNpsScore = Math.round(((promotersCount - detractorsCount) / totalResponses) * 100);
        } else {
            promotersCount = nineBox.summary.highPerformersCount;
            passivesCount = Math.max(0, Math.round(totalActive * 0.3));
            detractorsCount = Math.max(0, totalActive - promotersCount - passivesCount);
            const total = Math.max(1, totalActive);
            eNpsScore = Math.round(((promotersCount - detractorsCount) / total) * 100);
        }

        const avgScore = totalResponses > 0
            ? Number((enpsResponses.reduce((sum, r) => sum + r.score, 0) / totalResponses).toFixed(1))
            : (totalActive > 0 ? 8.4 : 0);

        const promotersPct = Math.round((promotersCount / Math.max(1, totalResponses || totalActive)) * 100);
        const passivesPct = Math.round((passivesCount / Math.max(1, totalResponses || totalActive)) * 100);
        const detractorsPct = Math.max(0, 100 - promotersPct - passivesPct);

        const departments = await prisma.department.findMany({
            where: {
                ...(callerCompany
                    ? {
                          OR: [
                              { companyName: callerCompany },
                              {
                                  employees: {
                                      some: {
                                          user: { companyName: callerCompany },
                                      },
                                  },
                              },
                          ],
                      }
                    : {}),
                ...(query.departmentId ? { id: query.departmentId } : {}),
            },
            include: {
                employees: {
                    where: {
                        status: { not: "TERMINATED" },
                        user: {
                            ...(callerCompany ? { companyName: callerCompany } : {}),
                            role: { notIn: ["SUPER_ADMIN", "DIRECTOR"] },
                        },
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        const deptMap = new Map<string, any>();
        for (const dept of departments) {
            deptMap.set(dept.id, dept);
        }

        for (const emp of activeEmployees) {
            if (emp.department && !deptMap.has(emp.department.id)) {
                deptMap.set(emp.department.id, {
                    id: emp.department.id,
                    name: emp.department.name,
                    companyName: emp.department.companyName,
                    employees: activeEmployees.filter((e) => e.departmentId === emp.department.id),
                });
            }
        }

        const departmentList = Array.from(deptMap.values());

        const departmentAnalytics = departmentList.map((dept) => {
            const count = dept.employees.length;
            const deptEmployeeIds = new Set(dept.employees.map((e: any) => e.id));

            const deptNineBoxItems = nineBox.matrix
                .flatMap((cell) => cell.employees)
                .filter((empItem) => deptEmployeeIds.has(empItem.id));

            const deptObjScores: number[] = [];
            for (const o of allObjectives) {
                if (o.level === "DEPARTMENT" && o.departmentId === dept.id) {
                    if (o.keyResults && o.keyResults.length > 0) {
                        const krSum = o.keyResults.reduce((acc: number, kr: any) => {
                            const hasApproved = kr.checkIns?.some((ci: any) => ci.status === "APPROVED");
                            if (hasApproved) return acc + 100;
                            if (typeof kr.progress === "number" && kr.progress > 0) return acc + Math.min(100, kr.progress);
                            if (kr.targetValue > 0) return acc + Math.min(100, (kr.currentValue / kr.targetValue) * 100);
                            return acc;
                        }, 0);
                        deptObjScores.push(krSum / o.keyResults.length);
                    } else if (typeof o.progress === "number" && o.progress > 0) {
                        deptObjScores.push(Math.min(100, o.progress));
                    }
                }
            }

            let avgOkr = 0;
            if (deptNineBoxItems.length > 0 || deptObjScores.length > 0) {
                const empOkrSum = deptNineBoxItems.reduce((acc, cur) => acc + cur.okrScore, 0);
                const deptObjSum = deptObjScores.reduce((acc, cur) => acc + cur, 0);
                const totalItems = deptNineBoxItems.length + deptObjScores.length;
                avgOkr = totalItems > 0 ? Math.round((empOkrSum + deptObjSum) / totalItems) : 0;
            }

            const deptExits = allEmployees.filter((e) => {
                if (e.departmentId !== dept.id || e.status !== "TERMINATED") return false;
                return true;
            }).length;

            const deptTurnover = Number(((deptExits / Math.max(1, count + deptExits)) * 100).toFixed(1));
            const headcountPercentage = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;

            return {
                id: dept.id,
                name: dept.name,
                headcount: count,
                headcountPercentage,
                avgOkr,
                turnoverRate: deptTurnover,
            };
        });

        return {
            companyName: callerCompany || "Default Company",
            headcount: {
                totalActive,
                newHiresYear,
                terminationsYear,
                avgTenureMonths,
            },
            turnover: {
                turnoverRate,
                retentionRate,
                trend: monthlyTurnoverTrend,
            },
            enps: {
                score: eNpsScore,
                avgScore,
                promotersPct,
                passivesPct,
                detractorsPct,
                promotersCount,
                passivesCount,
                detractorsCount,
                totalResponses,
                recentResponses: enpsResponses.map((r) => ({
                    id: r.id,
                    score: r.score,
                    comment: r.comment,
                    createdAt: r.createdAt,
                    employeeName: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "Anonim",
                    department: r.employee?.department?.name || "-",
                    position: r.employee?.position?.title || "-",
                })),
            },
            departmentAnalytics,
            nineBoxSummary: nineBox.summary,
            nineBoxMatrix: nineBox.matrix,
        };
    }

    async getNineBoxGrid(query: { departmentId?: string }, currentUser?: any) {
        const callerCompany = await this.resolveCallerCompany(currentUser);

        const activeEmployees = await prisma.employee.findMany({
            where: {
                user: {
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                    role: { notIn: ["SUPER_ADMIN", "DIRECTOR"] },
                },
                ...(query.departmentId ? { departmentId: query.departmentId } : {}),
                status: { not: "TERMINATED" },
            },
            include: {
                department: true,
                position: true,
                grade: true,
                objectives: {
                    include: {
                        keyResults: {
                            include: {
                                checkIns: {
                                    orderBy: { createdAt: "desc" },
                                },
                            },
                        },
                    },
                },
                courseProgresses: {
                    include: {
                        course: true,
                    },
                },
                certificates: true,
                onboarding: {
                    include: {
                        tasks: true,
                        courses: true,
                    },
                },
                discAssessments: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                feedbackTargets: {
                    where: { isCompleted: true },
                    include: {
                        answers: true,
                    },
                },
                penalties: true,
                user: {
                    select: { id: true, email: true, role: true, companyName: true },
                },
            },
        });

        const allObjectives = await prisma.objective.findMany({
            where: {
                ...(callerCompany ? { OR: [{ companyName: callerCompany }, { companyName: null }] } : {}),
            },
            include: {
                keyResults: {
                    include: {
                        checkIns: {
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
            },
        });

        return this.calculateNineBoxGrid(activeEmployees, allObjectives);
    }

    private calculateNineBoxGrid(employees: any[], companyObjectives: any[] = []) {
        const boxDefinitions: Record<string, { id: string; row: number; col: number; title: string; category: string; color: string; desc: string }> = {
            "3_3": { id: "3_3", row: 3, col: 3, title: "Star (Yulduz)", category: "HIGH_HIGH", color: "emerald", desc: "Yuqori Natija & Yuqori Salohiyat" },
            "2_3": { id: "2_3", row: 2, col: 3, title: "High Performer", category: "MID_HIGH", color: "blue", desc: "Yuqori Natija & O'rtacha Salohiyat" },
            "1_3": { id: "1_3", row: 1, col: 3, title: "Solid Professional", category: "LOW_HIGH", color: "sky", desc: "Yuqori Natija & Barqaror Tajriba" },
            "3_2": { id: "3_2", row: 3, col: 2, title: "High Potential", category: "HIGH_MID", color: "teal", desc: "O'rtacha Natija & Yuqori Salohiyat" },
            "2_2": { id: "2_2", row: 2, col: 2, title: "Core Player", category: "MID_MID", color: "indigo", desc: "O'rtacha Natija & O'rtacha Salohiyat" },
            "1_2": { id: "1_2", row: 1, col: 2, title: "Effective Specialist", category: "LOW_MID", color: "slate", desc: "O'rtacha Natija & Pastroq Salohiyat" },
            "3_1": { id: "3_1", row: 3, col: 1, title: "Enigma (Iste'dod)", category: "HIGH_LOW", color: "purple", desc: "Past Natija & Yuqori Salohiyat" },
            "2_1": { id: "2_1", row: 2, col: 1, title: "Dilemma", category: "MID_LOW", color: "amber", desc: "Past Natija & O'rtacha Salohiyat" },
            "1_1": { id: "1_1", row: 1, col: 1, title: "Underperformer", category: "LOW_LOW", color: "rose", desc: "Past Natija & Past Salohiyat (Xavf)" },
        };

        const gridBuckets: Record<string, any[]> = {
            "3_3": [],
            "2_3": [],
            "1_3": [],
            "3_2": [],
            "2_2": [],
            "1_2": [],
            "3_1": [],
            "2_1": [],
            "1_1": [],
        };

        for (const emp of employees) {
            const empObjectivesMap = new Map<string, any>();

            if (emp.objectives && Array.isArray(emp.objectives)) {
                for (const o of emp.objectives) {
                    empObjectivesMap.set(o.id, o);
                }
            }

            for (const o of companyObjectives) {
                if (
                    o.employeeId === emp.id ||
                    o.employeeId === emp.userId ||
                    o.employeeId === emp.user?.id
                ) {
                    empObjectivesMap.set(o.id, o);
                } else if (
                    o.level === "DEPARTMENT" &&
                    emp.departmentId &&
                    o.departmentId === emp.departmentId
                ) {
                    if (!empObjectivesMap.has(o.id)) {
                        empObjectivesMap.set(o.id, o);
                    }
                }
            }

            const relevantObjectives = Array.from(empObjectivesMap.values());

            let okrAvg = 65;
            let hasDirectOkrs = false;

            if (relevantObjectives.length > 0) {
                let totalObjScore = 0;
                let scoredCount = 0;

                for (const o of relevantObjectives) {
                    if (o.level === "INDIVIDUAL") {
                        hasDirectOkrs = true;
                    }

                    if (o.keyResults && o.keyResults.length > 0) {
                        const krScores = o.keyResults.map((kr: any) => {
                            const hasApprovedCheckIn = kr.checkIns?.some(
                                (ci: any) => ci.status === "APPROVED",
                            );
                            if (hasApprovedCheckIn) return 100;

                            if (typeof kr.progress === "number" && kr.progress > 0) {
                                return Math.min(100, kr.progress);
                            }

                            if (kr.targetValue && kr.targetValue > 0) {
                                const ratio = (kr.currentValue / kr.targetValue) * 100;
                                return Math.min(100, Math.max(0, ratio));
                            }

                            return kr.currentValue > 0 ? 100 : 0;
                        });

                        const krAvg = krScores.reduce((a: number, b: number) => a + b, 0) / krScores.length;
                        totalObjScore += krAvg;
                        scoredCount++;
                    } else if (typeof o.progress === "number" && o.progress > 0) {
                        totalObjScore += Math.min(100, o.progress);
                        scoredCount++;
                    } else if (o.status === "APPROVED" || o.status === "COMPLETED") {
                        totalObjScore += 100;
                        scoredCount++;
                    }
                }

                if (scoredCount > 0) {
                    okrAvg = Math.round(totalObjScore / scoredCount);
                }
            }

            let feedbackAvg = 80;
            let hasFeedback = false;
            if (emp.feedbackTargets && emp.feedbackTargets.length > 0) {
                let totalAnswers = 0;
                let sumScore = 0;
                for (const fb of emp.feedbackTargets) {
                    if (fb.answers && fb.answers.length > 0) {
                        for (const ans of fb.answers) {
                            sumScore += ans.score;
                            totalAnswers++;
                        }
                    }
                }
                if (totalAnswers > 0) {
                    hasFeedback = true;
                    feedbackAvg = Math.round((sumScore / totalAnswers) * 20);
                }
            }

            const penaltyCount = emp.penalties?.length || 0;
            const disciplineScore = Math.max(40, 100 - penaltyCount * 20);

            let performanceScore: number;
            if (hasDirectOkrs || relevantObjectives.length > 0) {
                if (hasFeedback) {
                    performanceScore = Math.round(okrAvg * 0.65 + feedbackAvg * 0.25 + disciplineScore * 0.1);
                } else {
                    performanceScore = Math.round(okrAvg * 0.85 + disciplineScore * 0.15);
                }
            } else {
                performanceScore = hasFeedback ? Math.round(feedbackAvg * 0.8 + disciplineScore * 0.2) : okrAvg;
            }

            let performanceLevel = 2;
            if (performanceScore >= 75) {
                performanceLevel = 3;
            } else if (performanceScore < 50) {
                performanceLevel = 1;
            }

            let potentialScore = 40;

            let completedCourses = 0;
            let totalCourseProgress = 0;
            let courseCount = 0;
            if (emp.courseProgresses && emp.courseProgresses.length > 0) {
                courseCount = emp.courseProgresses.length;
                for (const cp of emp.courseProgresses) {
                    if (cp.isCompleted) {
                        completedCourses++;
                        totalCourseProgress += 100;
                    } else {
                        totalCourseProgress += cp.progressPercent || 0;
                    }
                }
            }

            const courseAvgProgress = courseCount > 0 ? totalCourseProgress / courseCount : 0;
            potentialScore += Math.min(35, completedCourses * 12 + Math.round(courseAvgProgress * 0.15));

            const certificatesCount = emp.certificates?.length || 0;
            if (certificatesCount > 0) {
                potentialScore += Math.min(15, certificatesCount * 8);
            }

            if (emp.onboarding) {
                const obTasks = emp.onboarding.tasks || [];
                const completedTasks = obTasks.filter((t: any) => t.status === "COMPLETED").length;
                if (obTasks.length > 0) {
                    potentialScore += Math.round((completedTasks / obTasks.length) * 10);
                }

                const obCourses = emp.onboarding.courses || [];
                const completedObCourses = obCourses.filter((c: any) => c.isCompleted).length;
                if (obCourses.length > 0) {
                    potentialScore += Math.round((completedObCourses / obCourses.length) * 10);
                }
            }

            if (emp.grade?.level) {
                potentialScore += Math.min(20, emp.grade.level * 4);
            } else {
                potentialScore += 10;
            }

            const primaryDisc = emp.discAssessments?.[0]?.primaryType;
            if (primaryDisc === "D" || primaryDisc === "I") {
                potentialScore += 12;
            } else if (primaryDisc === "C" || primaryDisc === "S") {
                potentialScore += 8;
            } else {
                potentialScore += 5;
            }

            if (performanceScore >= 85) {
                potentialScore += 10;
            } else if (performanceScore >= 70) {
                potentialScore += 5;
            }

            potentialScore = Math.min(100, Math.max(15, potentialScore));

            let potentialLevel = 2;
            if (potentialScore >= 75) {
                potentialLevel = 3;
            } else if (potentialScore < 48) {
                potentialLevel = 1;
            }

            const key = `${potentialLevel}_${performanceLevel}`;
            const boxDef = boxDefinitions[key] || boxDefinitions["2_2"];

            const mappedItem = {
                id: emp.id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                department: emp.department?.name || "Boshqarma",
                position: emp.position?.title || "Mutaxassis",
                grade: emp.grade?.name || "Standard",
                okrScore: okrAvg,
                performanceScore,
                potentialScore,
                performanceLevel,
                potentialLevel,
                completedCourses,
                discType: primaryDisc || "-",
                boxKey: key,
                boxTitle: boxDef.title,
            };

            if (gridBuckets[key]) {
                gridBuckets[key].push(mappedItem);
            } else {
                gridBuckets["2_2"].push(mappedItem);
            }
        }

        const totalEmployees = Math.max(1, employees.length);

        const matrix = Object.keys(boxDefinitions).map((key) => {
            const def = boxDefinitions[key];
            const items = gridBuckets[key] || [];
            return {
                key,
                row: def.row,
                col: def.col,
                title: def.title,
                category: def.category,
                color: def.color,
                description: def.desc,
                count: items.length,
                percentage: Math.round((items.length / totalEmployees) * 100),
                employees: items,
            };
        });

        const highPerformers = matrix.filter((b) => b.col === 3).reduce((acc, b) => acc + b.count, 0);
        const highPotentials = matrix.filter((b) => b.row === 3).reduce((acc, b) => acc + b.count, 0);
        const risks = matrix.filter((b) => b.key === "1_1" || b.key === "2_1").reduce((acc, b) => acc + b.count, 0);

        return {
            total: employees.length,
            summary: {
                starsCount: gridBuckets["3_3"]?.length || 0,
                highPerformersCount: highPerformers,
                highPotentialCount: highPotentials,
                riskCount: risks,
                highPerformersPct: Math.round((highPerformers / totalEmployees) * 100),
                highPotentialPct: Math.round((highPotentials / totalEmployees) * 100),
                riskPct: Math.round((risks / totalEmployees) * 100),
            },
            matrix,
        };
    }
}

export const analyticsService = new AnalyticsService();
