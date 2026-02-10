import * as cron from "node-cron";

export function setupAutoRollover() {
  // Run on the 7th of each month at 10 PM
  cron.schedule("0 22 7 * *", async () => {
    try {
      console.log("Running auto rollover check...");

      const response = await fetch(
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/api/deposits/auto-rollover`,
        {
          method: "POST",
        }
      );

      const result = await response.json();
      console.log("Auto rollover result:", result);
    } catch (error) {
      console.error("Error running auto rollover:", error);
    }
  });
}
