const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Calculates and awards XP to a user based on their base XP and current streak.
 * The streak multiplier adds 5% (0.05) per day, capped at a maximum of x2.0 (20 days).
 *
 * This function also applies the XP to the user's team total score if they belong to one,
 * wrapping both updates in a robust Prisma transaction.
 *
 * @param {string} userId - The UUID of the user receiving the XP.
 * @param {number} baseXP - The base amount of XP being awarded (e.g., from completing a lesson).
 * @returns {Promise<Object>} An object containing the final XP awarded and the updated user record.
 */
async function awardXP(userId, baseXP) {
  // 1. Fetch user to retrieve current streak and team membership
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, teamId: true }
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found.`);
  }

  // 2. Calculate the multiplier
  // Formula: 1 + Math.min(streak * 0.05, 1.0) -> cap at +100% (x2.0 total)
  const multiplier = 1 + Math.min(user.currentStreak * 0.05, 1.0);
  
  // Calculate final XP
  const finalXP = Math.round(baseXP * multiplier);

  // 3. Prepare the atomic transition operations
  const operations = [];

  // Update user's personal XP account
  operations.push(
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: finalXP } }
    })
  );

  // If the user belongs to a team, mirror the XP addition to the team's total score
  if (user.teamId) {
    operations.push(
      prisma.team.update({
        where: { id: user.teamId },
        data: { totalScore: { increment: finalXP } }
      })
    );
  }

  // 4. Fire transaction
  // Using $transaction ensures consistency across user and team collections
  const results = await prisma.$transaction(operations);

  return {
    baseXP,
    multiplier,
    awardedXP: finalXP,
    user: results[0], // The updated user model from the first operation
    team: user.teamId ? results[1] : null // The updated team model if applicable
  };
}

module.exports = {
  awardXP
};
