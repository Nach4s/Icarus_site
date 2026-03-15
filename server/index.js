// ═══════════════════════════════════════════════════════════════════════
// ICARUS — Express Backend Server
// Aerospace Engineering Education & Competition Platform
// ═══════════════════════════════════════════════════════════════════════

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

// ─── Initialisation ──────────────────────────────────────────────────

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "icarus-dev-secret";
const SALT_ROUNDS = 12;

// ─── Global Middleware ───────────────────────────────────────────────

app.use(cors());                  // Allow cross-origin requests from the Vite frontend
app.use(express.json());          // Parse incoming JSON bodies

// ─── Helpers ─────────────────────────────────────────────────────────

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

    // ── Hash password & persist ───────────────────────────────────
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    // ── Issue JWT ─────────────────────────────────────────────────
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ── Respond (never expose passwordHash) ───────────────────────
    const { passwordHash: _, ...safeUser } = user;

    return res.status(201).json({
      message: "Registration successful.",
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
    const user = await prisma.user.findUnique({ where: { email } });
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

    // Generate a unique invite code (retry on unlikely collision)
    let inviteCode;
    let codeExists = true;

    while (codeExists) {
      inviteCode = generateInviteCode();
      const existing = await prisma.team.findUnique({ where: { inviteCode } });
      codeExists = !!existing;
    }

    const team = await prisma.team.create({
      data: { name, inviteCode },
    });

    return res.status(201).json({
      message: "Team created successfully.",
      team,
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
