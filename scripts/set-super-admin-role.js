const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function setSuperAdminRole() {
  try {
    // Update super admin role to SUPER_ADMIN
    const superAdminUser = await prisma.user.findFirst({
      where: { kode: "24031993" },
    });

    if (superAdminUser) {
      await prisma.user.update({
        where: { id: superAdminUser.id },
        data: { role: "SUPER_ADMIN" },
      });
      console.log("Updated super admin role to SUPER_ADMIN");
    } else {
      console.log(
        "Super admin user not found. Please create a user with kode '24031993' first.",
      );
    }
  } catch (error) {
    console.error("Error setting super admin role:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setSuperAdminRole();
