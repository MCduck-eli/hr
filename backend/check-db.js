const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const assignments = await prisma.feedbackAssignment.findMany({
        include: { reviewer: { include: { user: true } }, target: true }
    });
    console.log("Assignments:");
    assignments.forEach(a => {
        console.log(`- ID: ${a.id}, Reviewer: ${a.reviewer?.firstName} (UserId: ${a.reviewer?.userId}), Target: ${a.target?.firstName}`);
    });
    
    const users = await prisma.user.findMany({
        include: { employee: true }
    });
    console.log("\nUsers:");
    users.forEach(u => {
        console.log(`- Email: ${u.email}, Role: ${u.role}, EmployeeID: ${u.employee?.id}`);
    });
}
check().finally(() => prisma.$disconnect());
