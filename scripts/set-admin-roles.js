const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function setAdminRoles() {
  try {
    // Update admin1 role to ADMIN1
    const admin1User = await prisma.user.findFirst({
      where: { email: "admin1@example.com" },
    });

    if (admin1User) {
      await prisma.user.update({
        where: { id: admin1User.id },
        data: { role: "ADMIN1" },
      });
      console.log("Updated admin1 role to ADMIN1");
    } else {
      console.log("admin1 user not found");
    }

    // Update admin2 role to ADMIN2
    const admin2User = await prisma.user.findFirst({
      where: { email: "admin2@example.com" },
    });

    if (admin2User) {
      await prisma.user.update({
        where: { id: admin2User.id },
        data: { role: "ADMIN2" },
      });
      console.log("Updated admin2 role to ADMIN2");
    } else {
      console.log("admin2 user not found");
    }
  } catch (error) {
    console.error("Error setting admin roles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRoles();
