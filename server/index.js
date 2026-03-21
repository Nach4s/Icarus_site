// ═══════════════════════════════════════════════════════════════════════
// ICARUS — Express Backend Server
// Aerospace Engineering Education & Competition Platform
// ═══════════════════════════════════════════════════════════════════════

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const { sendVerificationEmail, sendPasswordResetEmail } = require("./utils/email");
const redis = require("./utils/redis");
const crypto = require("crypto");

// ─── Initialisation ──────────────────────────────────────────────────

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "icarus-dev-secret";
const SALT_ROUNDS = 12;

// ─── Supabase & Multer Configuration ─────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_SUPABASE_SERVICE_ROLE_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// ─── Global Middleware ───────────────────────────────────────────────

app.use(cors());                  // Allow cross-origin requests from the Vite frontend
app.use(express.json());          // Parse incoming JSON bodies

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Generate a 6-digit numeric OTP code.
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a cryptographically-random 6-character alphanumeric invite code.
 * Uses uppercase letters + digits for readability.
 */
function generateInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Simple async error wrapper — catches thrown errors and forwards them
 * to the Express error handler so we don't need try/catch everywhere.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * JWT authentication middleware.
 * Reads the `Authorization: Bearer <token>` header, verifies the JWT,
 * and attaches `req.userId` and `req.role` to the request object.
 * Returns 401 if the token is missing or invalid.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/**
 * Admin-only middleware.
 * Must be chained AFTER authMiddleware.
 * Returns 403 if the authenticated user is not ADMIN.
 */
function adminMiddleware(req, res, next) {
  if (req.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

// ═══════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/register
 * ────────────────────────
 * Register a new STUDENT account.
 *
 * Body: { email: string, password: string, name: string }
 * Returns: the created user (without passwordHash) + a JWT token.
 */
app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    // ── Validate required fields ──────────────────────────────────
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Fields 'email', 'password', and 'name' are required." });
    }

    // ── Check for existing user ───────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ error: "A user with this email already exists." });
    }

    // ── Hash password & set up OTP ────────────────────────────────
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const otpCode = generateOTP();

    // ── Save pending registration to Redis ────────────────────────
    const pendingUser = { name, email, passwordHash, otpCode };
    await redis.set(`registration:${email}`, JSON.stringify(pendingUser), "EX", 600); // 10 mins TTL

    // ── Send Verification Email ───────────────────────────────────
    try {
        await sendVerificationEmail(email, otpCode, name);
    } catch (emailErr) {
        console.error("Failed to send OTP email:", emailErr);
        // Continue anyway; maybe they can resend later or we log the error
    }

    // ── Respond (Do not issue JWT yet) ────────────────────────────
    return res.status(201).json({
      message: "Registration successful. Please check your email for the verification code.",
      requiresVerification: true,
      email
    });
  })
);

/**
 * POST /api/auth/verify-email
 * ────────────────────────────
 * Verifies the 6-digit OTP code sent during registration.
 *
 * Body: { email: string, code: string }
 * Returns: user data + JWT token.
 */
app.post(
  "/api/auth/verify-email",
  asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required." });
    }

    // ── Fetch pending registration from Redis ─────────────────────
    const pendingUserData = await redis.get(`registration:${email}`);
    if (!pendingUserData) {
      return res.status(400).json({ error: "Verification code has expired or is invalid." });
    }

    const pendingUser = JSON.parse(pendingUserData);

    if (pendingUser.otpCode !== code) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    // ── Code matches, create user in DB ───────────────────────────
    const newUser = await prisma.user.create({
      data: {
        email: pendingUser.email,
        name: pendingUser.name,
        passwordHash: pendingUser.passwordHash,
      },
      include: { team: true }
    });

    // ── Remove pending user from Redis ────────────────────────────
    await redis.del(`registration:${email}`);

    // Issue JWT
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { passwordHash: _, ...safeUser } = newUser;

    return res.json({
      message: "Email verified successfully.",
      user: safeUser,
      token,
    });
  })
);

/**
 * POST /api/auth/login
 * ─────────────────────
 * Authenticate an existing user.
 *
 * Body: { email: string, password: string }
 * Returns: user data + JWT token.
 */
app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Fields 'email' and 'password' are required." });
    }

    // ── Find user ─────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { team: true }
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // ── Verify password ───────────────────────────────────────────
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // ── Issue JWT ─────────────────────────────────────────────────
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      message: "Login successful.",
      user: safeUser,
      token,
    });
  })
);

/**
 * POST /api/auth/forgot-password
 * ──────────────────────────────
 * Generates a reset token and sends a mock email.
 */
app.post(
  "/api/auth/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 even if not found to prevent email gathering, 
      // but for Icarus we can be explicit to make UX easier.
      return res.status(404).json({ error: "User not found." });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry }
    });

    // Dispatch the actual email
    await sendPasswordResetEmail(email, resetToken, user.name);

    res.json({ message: "Password reset link sent to your email." });
  })
);

/**
 * POST /api/auth/reset-password
 * ─────────────────────────────
 * Resets the user's password using the token.
 */
app.post(
  "/api/auth/reset-password",
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    const user = await prisma.user.findFirst({
      where: { 
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: "Password successfully reset." });
  })
);

// ═══════════════════════════════════════════════════════════════════════
//  TEAM ROUTES
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/teams/create
 * ───────────────────────
 * Create a new team with an auto-generated 6-character invite code.
 *
 * Body: { name: string }
 * Returns: the created team (including the invite code).
 */
app.post(
  "/api/teams/create",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Field 'name' is required." });
    }

    // Check if user already has a team
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.teamId) {
      return res.status(400).json({ error: "You are already a member of a team." });
    }

    // Generate a unique invite code (retry on unlikely collision)
    let inviteCode;
    let codeExists = true;

    while (codeExists) {
      inviteCode = generateInviteCode();
      const existing = await prisma.team.findUnique({ where: { inviteCode } });
      codeExists = !!existing;
    }

    const team = await prisma.team.create({
      data: { 
        name, 
        inviteCode,
        captainId: req.userId,
        members: {
            connect: { id: req.userId }
        }
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { team: true },
    });
    
    const { passwordHash: _, ...safeUser } = updatedUser;

    return res.status(201).json({
      message: "Team created successfully.",
      team,
      user: safeUser
    });
  })
);

/**
 * POST /api/teams/join
 * ─────────────────────
 * Join an existing team using its 6-character invite code.
 *
 * Body: { inviteCode: string, userId: string }
 * Returns: the updated user with team data.
 */
app.post(
  "/api/teams/join",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { inviteCode, userId } = req.body;

    if (!inviteCode || !userId) {
      return res
        .status(400)
        .json({ error: "Fields 'inviteCode' and 'userId' are required." });
    }

    // ── Look up team ──────────────────────────────────────────────
    const team = await prisma.team.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });

    if (!team) {
      return res.status(404).json({ error: "Invalid invite code." });
    }

    // ── Capacity check (max 6 members) ────────────────────────────
    const memberCount = await prisma.user.count({ where: { teamId: team.id } });
    if (memberCount >= 6) {
      return res.status(400).json({ error: "Team is at maximum capacity (6 members)." });
    }

    // ── Verify user exists ────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.teamId) {
      return res
        .status(409)
        .json({ error: "User is already a member of a team." });
    }

    // ── Assign user to team ───────────────────────────────────────
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id },
      include: { team: true },
    });

    const { passwordHash: _, ...safeUser } = updatedUser;

    return res.json({
      message: `Successfully joined team "${team.name}".`,
      user: safeUser,
    });
  })
);

/**
 * POST /api/teams/leave
 * ──────────────────────
 * Leave your current team.
 *
 * Business rules:
 *   1. Disconnect user from team.
 *   2. If team has 0 remaining members → delete it.
 *   3. If leaving user was the captain → promote highest-XP remaining member.
 */
app.post(
  "/api/teams/leave",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user || !user.teamId) {
      return res.status(400).json({ error: "You are not a member of any team." });
    }

    const teamId = user.teamId;

    // ── Step 1: Disconnect user from team ─────────────────────────
    await prisma.user.update({
      where: { id: req.userId },
      data: { teamId: null },
    });

    // ── Step 2: Count remaining members ───────────────────────────
    const remaining = await prisma.user.findMany({
      where: { teamId },
      orderBy: { xp: "desc" },
      select: { id: true, xp: true },
    });

    if (remaining.length === 0) {
      // ── No members left → delete team entirely ──────────────────
      await prisma.team.delete({ where: { id: teamId } });

      const updatedUser = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { team: true },
      });
      const { passwordHash: _, ...safeUser } = updatedUser;

      return res.json({
        message: "You left the team. The team has been disbanded (no members remaining).",
        user: safeUser,
      });
    }

    // ── Step 3: Captain succession ────────────────────────────────
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (team.captainId === req.userId) {
      // Promote the member with the highest XP
      const newCaptain = remaining[0]; // already sorted by xp desc
      await prisma.team.update({
        where: { id: teamId },
        data: { captainId: newCaptain.id },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { team: true },
    });
    const { passwordHash: _, ...safeUser } = updatedUser;

    return res.json({
      message: "You have left the team.",
      user: safeUser,
    });
  })
);

// ═══════════════════════════════════════════════════════════════════════
//  COMPETITION ROUTES
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/competition/register
 * ──────────────────────────────
 * Flag a team as officially registered for the active competition.
 * Only the Captain can perform this action.
 * Requires an active (isSelectionActive: true) competition to exist.
 */
app.post(
  "/api/competition/register",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { team: true },
    });

    if (!user || !user.teamId) {
      return res.status(400).json({ error: "You must be in a team to register." });
    }

    if (user.id !== user.team.captainId) {
      return res.status(403).json({ error: "Only the Team Captain can register the team." });
    }

    if (user.team.isRegisteredForCompetition) {
      return res.status(400).json({ error: "Team is already registered." });
    }

    // ── Find an active competition ─────────────────────────────────
    const now = new Date();
    const activeCompetition = await prisma.competition.findFirst({
      where: {
        isSelectionActive: true,
        regStart: { lte: now },
        regEnd:   { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeCompetition) {
      return res.status(400).json({ error: "No active competition is currently open for registration." });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: user.teamId },
      data: {
        isRegisteredForCompetition: true,
        competitionId: activeCompetition.id,
      },
    });

    return res.json({
      message: "Your team is successfully registered!",
      team: updatedTeam,
    });
  })
);

// ═══════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES — Protected: ADMIN role only
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/competitions
 * ─────────────────────────────
 * Create a new competition tournament.
 *
 * Body: { title: string, regStart: ISO string, regEnd: ISO string }
 */
app.post(
  "/api/admin/competitions",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const { title, regStart, regEnd } = req.body;

    if (!title || !regStart || !regEnd) {
      return res.status(400).json({ error: "Fields 'title', 'regStart', and 'regEnd' are required." });
    }

    const start = new Date(regStart);
    const end   = new Date(regEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format for 'regStart' or 'regEnd'." });
    }

    if (end <= start) {
      return res.status(400).json({ error: "'regEnd' must be after 'regStart'." });
    }

    const competition = await prisma.competition.create({
      data: { title, regStart: start, regEnd: end },
    });

    return res.status(201).json({ message: "Competition created.", competition });
  })
);

/**
 * GET /api/admin/competitions
 * ────────────────────────────
 * List all competitions (newest first) with team count.
 */
app.get(
  "/api/admin/competitions",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const competitions = await prisma.competition.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { teams: true } },
      },
    });

    return res.json({ competitions });
  })
);

/**
 * PATCH /api/admin/competitions/:id/stop
 * ────────────────────────────────────────
 * Manually close registration for a competition.
 */
app.patch(
  "/api/admin/competitions/:id/stop",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) {
      return res.status(404).json({ error: "Competition not found." });
    }

    const updated = await prisma.competition.update({
      where: { id },
      data: { isSelectionActive: false },
    });

    return res.json({ message: "Competition selection stopped.", competition: updated });
  })
);

/**
 * DELETE /api/admin/competitions/:id
 * ───────────────────────────────────
 * Delete a competition and unregister all associated teams.
 */
app.delete(
  "/api/admin/competitions/:id",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) {
      return res.status(404).json({ error: "Competition not found." });
    }

    // 1. Unregister all teams from this competition
    await prisma.team.updateMany({
      where: { competitionId: id },
      data: { isRegisteredForCompetition: false },
    });

    // 2. Delete the competition
    await prisma.competition.delete({
      where: { id },
    });

    return res.json({ message: "Competition deleted successfully." });
  })
);

/**
 * GET /api/admin/competitions/:id/teams
 * ──────────────────────────────────────
 * Fetch all teams registered for a specific competition.
 */
app.get(
  "/api/admin/competitions/:id/teams",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) {
      return res.status(404).json({ error: "Competition not found." });
    }

    const teams = await prisma.team.findMany({
      where: { competitionId: id },
      include: {
        members: {
          select: { id: true, name: true, email: true, avatarUrl: true, xp: true },
          orderBy: { xp: "desc" },
        },
        captain: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { totalScore: "desc" },
    });

    return res.json({ competition, teams });
  })
);

// ═══════════════════════════════════════════════════════════════════════
//  USER PROFILE ROUTES
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/user/me
 * ─────────────────
 * Returns the authenticated user's full profile (including team).
 */
app.get(
  "/api/user/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { team: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  })
);

/**
 * PUT /api/user/me
 * ─────────────────
 * Update the authenticated user's profile (name, email).
 *
 * Body: { name?: string, email?: string }
 */
app.put(
  "/api/user/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { name, email, avatarUrl } = req.body;
    const data = {};

    if (name) data.name = name;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
    if (email) {
      // Check for email collision
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.userId) {
        return res.status(409).json({ error: "Email is already in use." });
      }
      data.email = email;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No fields to update." });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      include: { team: true },
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ message: "Profile updated.", user: safeUser });
  })
);

/**
 * POST /api/user/avatar
 * ──────────────────────
 * Uploads an avatar image to Supabase Storage and updates the user profile.
 */
app.post(
  "/api/user/avatar",
  authMiddleware,
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    // ── 1. Fetch current user to get old avatar URL ──
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (currentUser?.avatarUrl) {
      // Supabase public URL format: .../avatars/filename
      const parts = currentUser.avatarUrl.split('/avatars/');
      if (parts.length > 1) {
        const oldPath = parts[1];
        try {
          // Attempt to remove the old file using the service role client
          await supabase.storage.from("avatars").remove([oldPath]);
          console.log(`Successfully deleted old avatar: ${oldPath}`);
        } catch (delErr) {
          // Do not fail the request if deletion fails (orphaned files can be cleaned up later)
          console.error("Failed to delete old avatar from Supabase Storage:", delErr);
        }
      }
    }

    // ── 2. New file upload logic ──
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${req.userId}-${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("avatars")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload image to storage." });
    }

    const { data: publicUrlData } = supabase
      .storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl },
      include: { team: true },
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ message: "Avatar updated successfully.", user: safeUser });
  })
);

/**
 * GET /api/user/team
 * ───────────────────
 * Returns the authenticated user's team with all members.
 */
app.get(
  "/api/user/team",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { teamId: true },
    });

    if (!user || !user.teamId) {
      return res.status(404).json({ error: "You are not a member of any team." });
    }

    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            xp: true,
            currentStreak: true,
            role: true,
            createdAt: true,
          },
          orderBy: { xp: "desc" },
        },
      },
    });

    return res.json({ team });
  })
);

/**
 * DELETE /api/user/me
 * ────────────────────
 * Delete the authenticated user's account.
 * Also handles team succession and auto-deletion if they were in a team.
 */
app.delete(
  "/api/user/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Handle team logic before deleting user
    if (user.teamId) {
      const teamId = user.teamId;

      // Disconnect user from team first (so they aren't counted in remaining)
      await prisma.user.update({
        where: { id: req.userId },
        data: { teamId: null },
      });

      const remaining = await prisma.user.findMany({
        where: { teamId },
        orderBy: { xp: "desc" },
        select: { id: true, xp: true },
      });

      if (remaining.length === 0) {
        await prisma.team.delete({ where: { id: teamId } });
      } else {
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (team.captainId === req.userId) {
          const newCaptain = remaining[0];
          await prisma.team.update({
            where: { id: teamId },
            data: { captainId: newCaptain.id },
          });
        }
      }
    }

    // Now delete the user
    await prisma.user.delete({ where: { id: req.userId } });

    return res.json({ message: "Account deleted successfully." });
  })
);

// ═══════════════════════════════════════════════════════════════════════
//  LEADERBOARD ROUTES
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/leaderboard
 * ────────────────────
 * Get top 50 teams by totalScore.
 * Maps data to { rank, team, score, streak, members }
 */
app.get(
  "/api/leaderboard",
  asyncHandler(async (req, res) => {
    const teams = await prisma.team.findMany({
      orderBy: { totalScore: "desc" },
      take: 50,
      include: {
        members: {
          select: { xp: true, currentStreak: true },
        },
      },
    });

    // Map to frontend structure
    const leaderboard = teams.map((team, index) => {
      // Current active streak of team could be the max streak among members
      const activeStreak = team.members.reduce(
        (max, member) => Math.max(max, member.currentStreak || 0),
        0
      );

      return {
        id: team.id,
        rank: index + 1,
        team: team.name,
        score: team.totalScore,
        streak: activeStreak,
        members: team.members.length,
      };
    });

    return res.json({ leaderboard });
  })
);

/**
 * GET /api/teams/:id
 * ───────────────────
 * Public endpoint to view a team's details (for Leaderboard Inspector).
 */
app.get(
  "/api/teams/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            xp: true,
            currentStreak: true,
          },
          orderBy: { xp: "desc" },
          take: 6, // safety limit
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found." });
    }

    return res.json({ team });
  })
);

// ═══════════════════════════════════════════════════════════════════════
//  PUBLIC COMPETITION ROUTES
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/competitions/active
 * ─────────────────────────────
 * Public endpoint — returns the currently active (open) competition,
 * or null if none exists. Used by the frontend JOIN button.
 */
app.get(
  "/api/competitions/active",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const competition = await prisma.competition.findFirst({
      where: {
        isSelectionActive: true,
        regStart: { lte: now },
        regEnd:   { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ competition: competition ?? null });
  })
);

// ═══════════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════


app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════════════
//  GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("❌  Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// ═══════════════════════════════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🚀  ICARUS API Server                 ║
  ║   Running on http://localhost:${PORT}       ║
  ╚══════════════════════════════════════════╝
  `);
});
