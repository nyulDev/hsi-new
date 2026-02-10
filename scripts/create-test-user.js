const { PrismaClient } = require("../src/generated/prisma");
const bcrypt = require("bcrypt-ts");

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash("Salahsatu93@", 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        name: "Super Admin",
        kode: "24031993",
        password: hashedPassword,
        role: "SUPER_ADMIN",
      },
    });

    console.log("Test user created successfully:");
    console.log("Kode: 24031993");
    console.log("Password: Salahsatu93@");
    console.log("User ID:", user.id);
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
