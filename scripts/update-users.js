const { PrismaClient } = require("../src/generated/prisma");
const bcrypt = require("bcrypt-ts");

const prisma = new PrismaClient();

async function updateUsers() {
  try {
    // Update role of existing user to SUPER_ADMIN and set emailVerified
    const updatedUser = await prisma.user.update({
      where: {
        email: "nyulmac93@gmail.com",
      },
      data: {
        role: "SUPER_ADMIN",
        emailVerified: new Date(),
      },
    });

    console.log("User role updated successfully:");
    console.log("Email: nyulmac93@gmail.com");
    console.log("New Role: SUPER_ADMIN");
    console.log("Email Verified: true");

    // Create new user (skip if already exists)
    try {
      const hashedPassword = await bcrypt.hash("09876zzz", 10);
      const newUser = await prisma.user.create({
        data: {
          name: "Zulevil",
          email: "zulevil93@gmail.com",
          password: hashedPassword,
          role: "USER",
        },
      });

      console.log("New user created successfully:");
      console.log("Email: zulevil93@gmail.com");
      console.log("Password: 09876zzz");
      console.log("Role: USER");
      console.log("User ID:", newUser.id);
    } catch (error) {
      if (error.code === "P2002") {
        console.log(
          "User zulevil93@gmail.com already exists, skipping creation."
        );
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Error updating/creating users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsers();
