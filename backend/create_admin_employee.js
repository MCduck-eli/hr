const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const userId = '5ba37545-bd99-4aa5-838c-7fcf18fc9ab6';
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return console.log('User not found');
    
    let emp = await prisma.employee.findUnique({ where: { userId } });
    if (!emp) {
        emp = await prisma.employee.create({
            data: {
                userId,
                firstName: 'Super',
                lastName: 'Admin',
            }
        });
        console.log('Employee created:', emp);
    } else {
        console.log('Employee already exists:', emp);
    }
}
main().finally(() => prisma.$disconnect());
