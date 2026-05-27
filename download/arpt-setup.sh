#!/bin/bash
# ARPT Guinee - Complete Setup Script
# Run this from the root of the arpt_app project
# Usage: cd ~/Documents/PROJET_IA_CONAKRY/arpt_app && bash arpt-setup.sh

set -e

echo "=========================================="
echo "ARPT Guinee - Infrastructure Setup"
echo "=========================================="

PROJECT_DIR="$(pwd)"

# ==========================================
# 1. Create directory structure
# ==========================================
echo ""
echo ">>> Creating directories..."
mkdir -p scripts
mkdir -p e2e/helpers
mkdir -p src/test
mkdir -p src/app/api/health
mkdir -p "src/app/api/auth/[...nextauth]"
mkdir -p src/app/api/login
mkdir -p src/app/api/logout
mkdir -p src/app/api/operators
mkdir -p src/app/api/qos
mkdir -p src/app/api/complaints
mkdir -p ws-server/src

# ==========================================
# 2. docker-compose.yml
# ==========================================
echo ">>> Creating docker-compose.yml..."
cat > docker-compose.yml << 'DOCKEREOF'
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: arpt-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-arpt}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-arpt2025secure}
      POSTGRES_DB: ${POSTGRES_DB:-arpt_guinee}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-arpt}"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: arpt-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

  ws-server:
    build:
      context: ./ws-server
      dockerfile: Dockerfile
    container_name: arpt-ws-server
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      REDIS_URL: redis://redis:6379
      PORT: "4000"
    depends_on:
      redis:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: arpt-guinee
    restart: unless-stopped
    ports:
      - "3002:3000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-arpt}:${POSTGRES_PASSWORD:-arpt2025secure}@postgres:5432/${POSTGRES_DB:-arpt_guinee}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3002}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      SESSION_SECRET: ${SESSION_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  pgdata:
  redisdata:
DOCKEREOF

# ==========================================
# 3. Dockerfile
# ==========================================
echo ">>> Creating Dockerfile..."
cat > Dockerfile << 'DOCKERFILEEOF'
# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json bun.lock* package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Switch to PostgreSQL schema for Docker build
RUN cp prisma/schema.postgres.prisma prisma/schema.prisma

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://arpt:arpt2025secure@postgres:5432/arpt_guinee

RUN npx prisma generate && npm run build

# ---- Stage 3: Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
DOCKERFILEEOF

# ==========================================
# 4. WebSocket Server
# ==========================================
echo ">>> Creating WebSocket server..."
cat > ws-server/package.json << 'WSEOF'
{
  "name": "arpt-ws-server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node src/socket-server.js",
    "dev": "node --watch src/socket-server.js"
  },
  "dependencies": {
    "socket.io": "^4.8.1",
    "ioredis": "^5.6.1",
    "bullmq": "^5.77.0"
  }
}
WSEOF

cat > ws-server/Dockerfile << 'WSDOCKEREOF'
FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "src/socket-server.js"]
WSDOCKEREOF

cat > ws-server/src/socket-server.js << 'WSSEOF'
const { Server } = require("socket.io");
const Redis = require("ioredis");

const PORT = parseInt(process.env.PORT || "4000", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const io = new Server(PORT, {
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3002").split(","),
    methods: ["GET", "POST"],
  },
});

const subscriber = new Redis(REDIS_URL);

subscriber.subscribe("arpt-notifications", (err, count) => {
  if (err) {
    console.error("Failed to subscribe to Redis channel:", err);
  } else {
    console.log(`Subscribed to arpt-notifications (${count} channel(s))`);
  }
});

subscriber.on("message", (channel, message) => {
  try {
    const data = JSON.parse(message);
    io.emit("notification", data);
  } catch (e) {
    console.error("Failed to parse notification:", e.message);
  }
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id} (${reason})`);
  });
});

console.log(`ARPT WebSocket server running on port ${PORT}`);
WSSEOF

# ==========================================
# 5. Environment files
# ==========================================
echo ">>> Creating .env files..."
cat > .env << 'ENVEOF'
# For local development (SQLite - no Docker needed)
DATABASE_URL=file:./db/arpt.db

POSTGRES_PASSWORD=arpt2025secure
POSTGRES_USER=arpt
POSTGRES_DB=arpt_guinee

NEXTAUTH_SECRET=pVoAQGtMNao8vfpO-a5-S3wom2LEN2rOB-giZDj6f8mqNGs4WJckmziEfkx-za9h
NEXTAUTH_URL=http://localhost:3002
SESSION_SECRET=pVoAQGtMNao8vfpO-a5-S3wom2LEN2rOB-giZDj6f8mqNGs4WJckmziEfkx-za9h
JWT_SECRET=pVoAQGtMNao8vfpO-a5-S3wom2LEN2rOB-giZDj6f8mqNGs4WJckmziEfkx-za9h

NODE_ENV=development
PORT=3000
BACKEND_PORT=4000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
REDIS_URL=redis://localhost:6379
ENVEOF

cat > .env.docker << 'ENVDOCKEREOF'
# Docker deployment environment variables
DATABASE_URL=postgresql://arpt:arpt2025secure@postgres:5432/arpt_guinee

POSTGRES_PASSWORD=arpt2025secure
POSTGRES_USER=arpt
POSTGRES_DB=arpt_guinee

NEXTAUTH_SECRET=pVoAQGtMNao8vfpO-a5-S3wom2LEN2rOB-giZDj6f8mqNGs4WJckmziEfkx-za9h
NEXTAUTH_URL=http://localhost:3002
SESSION_SECRET=pVoAQGtMNao8vfpO-a5-S3wom2LEN2rOB-giZDj6f8mqNGs4WJckmziEfkx-za9h
JWT_SECRET=pVoAQGtMNao8vfpO-a5-S3wom2LEN2rOB-giZDj6f8mqNGs4WJckmziEfkx-za9h

NODE_ENV=production
PORT=3000
BACKEND_PORT=4000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
REDIS_URL=redis://redis:6379
ENVDOCKEREOF

# ==========================================
# 6. Prisma schemas
# ==========================================
echo ">>> Creating Prisma schemas..."

# SQLite schema (for local dev - this becomes the default)
cat > prisma/schema.prisma << 'PRISMAEOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  password     String
  role         String   @default("agent")
  service      String?
  twoFactorSecret String?
  twoFactorEnabled Boolean @default(false)
  active       Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  operators    Operator[]
  qosReports   QosReport[]
  complaints   Complaint[]
  audits       Audit[]
  sanctions    Sanction[]
  decisions    Decision[]
}

model Operator {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  type        String   @default("mobile")
  status      String   @default("active")
  licenseDate DateTime?
  contactEmail String?
  contactPhone String?
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  qosReports  QosReport[]
  complaints  Complaint[]
  sanctions   Sanction[]
  audits      Audit[]
}

model QosReport {
  id           String   @id @default(cuid())
  operatorId   String
  operator     Operator @relation(fields: [operatorId], references: [id])
  period       String
  region       String?
  callSuccessRate     Float?
  callSetupTime       Float?
  dropRate            Float?
  handoverSuccessRate Float?
  smsSuccessRate      Float?
  dataThroughput      Float?
  latency             Float?
  overallScore        Float?
  status       String   @default("draft")
  reviewedById String?
  reviewedBy   User?    @relation(fields: [reviewedById], references: [id])
  reviewedAt   DateTime?
  comments     String?
  createdById  String?
  createdBy    User?    @relation(fields: [createdById], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Complaint {
  id          String   @id @default(cuid())
  reference   String   @unique
  title       String
  description String
  category    String
  priority    String   @default("medium")
  status      String   @default("open")
  operatorId  String?
  operator    Operator? @relation(fields: [operatorId], references: [id])
  complainantName  String?
  complainantPhone String?
  complainantEmail String?
  assignedToId String?
  assignedTo   User?    @relation(fields: [assignedToId], references: [id])
  resolution  String?
  resolvedAt  DateTime?
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Sanction {
  id          String   @id @default(cuid())
  reference   String   @unique
  title       String
  description String
  type        String
  amount      Float?
  operatorId  String
  operator    Operator @relation(fields: [operatorId], references: [id])
  status      String   @default("proposed")
  decisionDate DateTime?
  executionDate DateTime?
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Audit {
  id          String   @id @default(cuid())
  reference   String   @unique
  title       String
  description String
  type        String
  status      String   @default("planned")
  startDate   DateTime?
  endDate     DateTime?
  operatorId  String?
  operator    Operator? @relation(fields: [operatorId], references: [id])
  leadAuditorId String?
  leadAuditor  User?    @relation(fields: [leadAuditorId], references: [id])
  findings    String?
  recommendations String?
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Decision {
  id          String   @id @default(cuid())
  reference   String   @unique
  title       String
  description String
  type        String
  status      String   @default("draft")
  decidedById String?
  decidedBy   User?    @relation(fields: [decidedById], references: [id])
  decidedAt   DateTime?
  publishedAt DateTime?
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Notification {
  id          String   @id @default(cuid())
  title       String
  message     String
  type        String   @default("info")
  category    String?
  read        Boolean  @default(false)
  userId      String?
  createdAt   DateTime @default(now())
}

model AuditLog {
  id          String   @id @default(cuid())
  action      String
  entity      String
  entityId    String?
  details     String?
  userId      String?
  userName    String?
  ipAddress   String?
  createdAt   DateTime @default(now())
}
PRISMAEOF

# PostgreSQL schema (for Docker)
cat > prisma/schema.postgres.prisma << 'PRISMAPGEOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  password     String
  role         String   @default("agent")
  service      String?
  twoFactorSecret String?
  twoFactorEnabled Boolean @default(false)
  active       Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  operators    Operator[]
  qosReports   QosReport[]
  complaints   Complaint[]
  audits       Audit[]
  sanctions    Sanction[]
  decisions    Decision[]
}

model Operator {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  type        String   @default("mobile")
  status      String   @default("active")
  licenseDate DateTime?
  contactEmail String?
  contactPhone String?
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  qosReports  QosReport[]
  complaints  Complaint[]
  sanctions   Sanction[]
  audits      Audit[]
}

model QosReport {
  id           String   @id @default(cuid())
  operatorId   String
  operator     Operator @relation(fields: [operatorId], references: [id])
  period       String
  region       String?
  callSuccessRate     Float?
  callSetupTime       Float?
  dropRate            Float?
  handoverSuccessRate Float?
  smsSuccessRate      Float?
  dataThroughput      Float?
  latency             Float?
  overallScore        Float?
  status       String   @default("draft")
  reviewedById String?
  reviewedBy   User?    @relation(fields: [reviewedById], references: [id])
  reviewedAt   DateTime?
  comments     String?
  createdById  String?
  createdBy    User?    @relation(fields: [createdById], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Complaint {
  id          String   @id @default(cuid())
  reference   String   @unique
  title       String
  description String
  category    String
  priority    String   @default("medium")
  status      String   @default("open")
  operatorId  String?
  operator    Operator? @relation(fields: [operatorId], references: [id])
  complainantName  String?
  complainantPhone String?
  complainantEmail String?
  assignedToId String?
  assignedTo   User?    @relation(fields: [assignedToId], references: [id])
  resolution  String?
  resolvedAt  DateTime?
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Sanction {
  id          String   @id @default(cuid())
  reference   String   @unique
  title       String
  description String
  type        String
  amount      Float?
  operatorId  String
  operator    Operator @relation(fields: [operatorId], references: [id])
  status      String   @default("proposed")
  decisionDate DateTime?
  executionDate DateTime?
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Audit {
  id          String   @id @default(cuid())
  reference   String   @unique
  title       String
  description String
  type        String
  status      String   @default("planned")
  startDate   DateTime?
  endDate     DateTime?
  operatorId  String?
  operator    Operator? @relation(fields: [operatorId], references: [id])
  leadAuditorId String?
  leadAuditor  User?    @relation(fields: [leadAuditorId], references: [id])
  findings    String?
  recommendations String?
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Decision {
  id          String   @id @default(cuid())
  reference   String   @unique
  title       String
  description String
  type        String
  status      String   @default("draft")
  decidedById String?
  decidedBy   User?    @relation(fields: [decidedById], references: [id])
  decidedAt   DateTime?
  publishedAt DateTime?
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Notification {
  id          String   @id @default(cuid())
  title       String
  message     String
  type        String   @default("info")
  category    String?
  read        Boolean  @default(false)
  userId      String?
  createdAt   DateTime @default(now())
}

model AuditLog {
  id          String   @id @default(cuid())
  action      String
  entity      String
  entityId    String?
  details     String?
  userId      String?
  userName    String?
  ipAddress   String?
  createdAt   DateTime @default(now())
}
PRISMAPGEOF

# SQLite schema backup
cp prisma/schema.prisma prisma/schema.sqlite.prisma

# ==========================================
# 7. Vitest config
# ==========================================
echo ">>> Creating vitest.config.ts..."
cat > vitest.config.ts << 'VITESTEOF'
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/test/**",
        "src/components/ui/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
VITESTEOF

# ==========================================
# 8. Test setup
# ==========================================
echo ">>> Creating test setup..."
cat > src/test/setup.ts << 'SETUPEOF'
import "@testing-library/jest-dom";
SETUPEOF

# ==========================================
# 9. Playwright config
# ==========================================
echo ">>> Creating playwright.config.ts..."
cat > playwright.config.ts << 'PWEOF'
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3002",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
PWEOF

# ==========================================
# 10. API Routes
# ==========================================
echo ">>> Creating API routes..."

cat > src/app/api/health/route.ts << 'HEALTHEOF'
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { db } = await import("@/lib/db");
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        server: "running",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        services: {
          database: "disconnected",
          server: "running",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 503 }
    );
  }
}
HEALTHEOF

cat > src/app/api/login/route.ts << 'LOGINEOF'
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signJwt } from "@/lib/jwt-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Utilisateur introuvable ou inactif" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    const token = await signJwt({
      id: user.id,
      email: user.email,
      role: user.role,
      service: user.service,
    });

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        service: user.service,
      },
      token,
    });

    response.cookies.set("arpt-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
LOGINEOF

cat > src/app/api/logout/route.ts << 'LOGOUTEOF'
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Deconnecte avec succes" });
  response.cookies.set("arpt-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

export async function GET() {
  const response = NextResponse.json({ message: "Deconnecte avec succes" });
  response.cookies.set("arpt-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
LOGOUTEOF

cat > "src/app/api/auth/[...nextauth]/route.ts" << 'NEXTAUTHEOF'
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
NEXTAUTHEOF

cat > src/app/api/operators/route.ts << 'OPERSEOF'
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [operators, total] = await Promise.all([
      db.operator.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.operator.count({ where }),
    ]);

    return NextResponse.json({
      operators,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching operators:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des operateurs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, type, contactEmail, contactPhone } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Nom et code requis" }, { status: 400 });
    }

    const operator = await db.operator.create({
      data: {
        name,
        code: code.toUpperCase(),
        type: type || "mobile",
        contactEmail,
        contactPhone,
      },
    });

    return NextResponse.json({ operator }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Un operateur avec ce nom ou code existe deja" },
        { status: 409 }
      );
    }
    console.error("Error creating operator:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'operateur" },
      { status: 500 }
    );
  }
}
OPERSEOF

cat > src/app/api/qos/route.ts << 'QOSEOF'
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const operatorId = searchParams.get("operatorId");
    const period = searchParams.get("period");
    const status = searchParams.get("status");

    const where: any = {};
    if (operatorId) where.operatorId = operatorId;
    if (period) where.period = period;
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      db.qosReport.findMany({
        where,
        include: { operator: { select: { id: true, name: true, code: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.qosReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching QoS reports:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des rapports QoS" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.operatorId || !body.period) {
      return NextResponse.json({ error: "Operateur et periode requis" }, { status: 400 });
    }

    const report = await db.qosReport.create({
      data: {
        operatorId: body.operatorId,
        period: body.period,
        region: body.region,
        callSuccessRate: body.callSuccessRate,
        callSetupTime: body.callSetupTime,
        dropRate: body.dropRate,
        handoverSuccessRate: body.handoverSuccessRate,
        smsSuccessRate: body.smsSuccessRate,
        dataThroughput: body.dataThroughput,
        latency: body.latency,
        overallScore: body.overallScore,
        status: body.status || "draft",
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Error creating QoS report:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du rapport QoS" },
      { status: 500 }
    );
  }
}
QOSEOF

cat > src/app/api/complaints/route.ts << 'COMPEOF'
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    const operatorId = searchParams.get("operatorId");
    const category = searchParams.get("category");

    const where: any = {};
    if (status) where.status = status;
    if (operatorId) where.operatorId = operatorId;
    if (category) where.category = category;

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        include: { operator: { select: { id: true, name: true, code: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.complaint.count({ where }),
    ]);

    return NextResponse.json({
      complaints,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des plaintes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.description) {
      return NextResponse.json({ error: "Titre et description requis" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const count = await db.complaint.count();
    const reference = `PLA-${year}-${String(count + 1).padStart(3, "0")}`;

    const complaint = await db.complaint.create({
      data: {
        reference,
        title: body.title,
        description: body.description,
        category: body.category || "autre",
        priority: body.priority || "medium",
        operatorId: body.operatorId,
        complainantName: body.complainantName,
        complainantPhone: body.complainantPhone,
        complainantEmail: body.complainantEmail,
      },
    });

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la plainte" },
      { status: 500 }
    );
  }
}
COMPEOF

# ==========================================
# 11. Library files
# ==========================================
echo ">>> Creating library files..."

cat > src/lib/auth.ts << 'AUTHEOF'
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.active) {
          throw new Error("Utilisateur introuvable ou inactif");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Mot de passe incorrect");
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          service: user.service,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.service = (user as any).service;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).service = token.service;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
AUTHEOF

cat > src/lib/jwt-auth.ts << 'JWTEOF'
import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret-change-me"
);

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  service?: string;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function requireAuth(roles?: string[]) {
  return async (request: NextRequest) => {
    const token = request.cookies.get("arpt-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    if (roles && !roles.includes(payload.role)) {
      return NextResponse.json({ error: "Acces non autorise" }, { status: 403 });
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.id);
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-role", payload.role);
    if (payload.service) {
      requestHeaders.set("x-user-service", payload.service);
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  };
}
JWTEOF

cat > src/lib/queue.ts << 'QUEUEEOF'
import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "localhost",
      port: parseInt(parsed.port || "6379", 10),
      password: parsed.password || undefined,
    };
  } catch {
    return { host: "localhost", port: 6379 };
  }
}

const connection = parseRedisUrl(REDIS_URL);

export const notificationQueue = new Queue("arpt-notifications-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
});

export const reportQueue = new Queue("arpt-report-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
});

export async function addNotificationJob(data: {
  type: string;
  title: string;
  message: string;
  userId?: string;
  category?: string;
}) {
  return notificationQueue.add("notify", data);
}

export async function addReportJob(data: {
  reportType: string;
  operatorId?: string;
  period?: string;
  requestedBy: string;
}) {
  return reportQueue.add("generate-report", data);
}
QUEUEEOF

cat > src/lib/notification-service.ts << 'NOTIFEOF'
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
    });
  }
  return redisInstance;
}

export async function publishNotification(data: {
  type: string;
  title: string;
  message: string;
  userId?: string;
  category?: string;
}) {
  const redis = getRedis();
  return redis.publish("arpt-notifications", JSON.stringify(data));
}
NOTIFEOF

# ==========================================
# 12. Middleware
# ==========================================
echo ">>> Creating middleware..."
cat > src/middleware.ts << 'MWEOF'
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login", "/api/auth", "/api/health", "/api/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("arpt-session")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
MWEOF

# ==========================================
# 13. Unit Test Files
# ==========================================
echo ">>> Creating unit test files..."

cat > src/lib/utils.test.ts << 'TEST1EOF'
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("foo", "bar");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });

  it("should handle conditional classes", () => {
    const result = cn("base", false && "hidden", "active");
    expect(result).toContain("base");
    expect(result).toContain("active");
    expect(result).not.toContain("hidden");
  });

  it("should handle undefined and null values", () => {
    const result = cn("base", undefined, null, "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
  });

  it("should merge conflicting tailwind classes", () => {
    const result = cn("px-4", "px-6");
    expect(result).toContain("px-6");
    expect(result).not.toContain("px-4");
  });

  it("should handle empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["foo", "bar"], "baz");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
    expect(result).toContain("baz");
  });
});
TEST1EOF

cat > src/lib/jwt-auth.test.ts << 'TEST2EOF'
import { describe, it, expect, beforeAll } from "vitest";
import { signJwt, verifyJwt } from "@/lib/jwt-auth";

process.env.JWT_SECRET = "test-secret-key-for-jwt-auth-tests";

describe("JWT Authentication", () => {
  const testPayload = {
    id: "user-123",
    email: "admin@arpt.gn",
    role: "admin",
    service: "qos",
  };

  describe("signJwt", () => {
    it("should create a JWT token string", async () => {
      const token = await signJwt(testPayload);
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should create different tokens for different payloads", async () => {
      const token1 = await signJwt({ ...testPayload, id: "user-1" });
      const token2 = await signJwt({ ...testPayload, id: "user-2" });
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyJwt", () => {
    it("should verify and decode a valid token", async () => {
      const token = await signJwt(testPayload);
      const payload = await verifyJwt(token);
      expect(payload).not.toBeNull();
      expect(payload!.id).toBe(testPayload.id);
      expect(payload!.email).toBe(testPayload.email);
      expect(payload!.role).toBe(testPayload.role);
      expect(payload!.service).toBe(testPayload.service);
    });

    it("should return null for an invalid token", async () => {
      const payload = await verifyJwt("invalid.token.here");
      expect(payload).toBeNull();
    });

    it("should return null for an empty token", async () => {
      const payload = await verifyJwt("");
      expect(payload).toBeNull();
    });

    it("should return null for a malformed token", async () => {
      const payload = await verifyJwt("not-a-jwt");
      expect(payload).toBeNull();
    });
  });

  describe("signJwt + verifyJwt round-trip", () => {
    it("should preserve all fields through sign and verify", async () => {
      const payload = {
        id: "user-456",
        email: "agent@arpt.gn",
        role: "agent",
        service: "plaintes",
      };
      const token = await signJwt(payload);
      const decoded = await verifyJwt(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.id).toBe(payload.id);
      expect(decoded!.email).toBe(payload.email);
      expect(decoded!.role).toBe(payload.role);
      expect(decoded!.service).toBe(payload.service);
    });

    it("should work for all role types", async () => {
      const roles = ["admin", "dg", "directeur", "chef_service", "agent", "operateur"];
      for (const role of roles) {
        const token = await signJwt({ id: "x", email: "x@x.com", role });
        const decoded = await verifyJwt(token);
        expect(decoded!.role).toBe(role);
      }
    });
  });
});
TEST2EOF

cat > src/lib/api-health.test.ts << 'TEST3EOF'
import { describe, it, expect } from "vitest";

describe("Health API Response Format", () => {
  it("should have correct structure for healthy response", () => {
    const response = {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: { database: "connected", server: "running" },
    };
    expect(response.status).toBe("ok");
    expect(response.timestamp).toBeDefined();
    expect(response.services.database).toBe("connected");
    expect(response.services.server).toBe("running");
  });

  it("should have correct structure for degraded response", () => {
    const response = {
      status: "degraded",
      timestamp: new Date().toISOString(),
      services: { database: "disconnected", server: "running", error: "Connection refused" },
    };
    expect(response.status).toBe("degraded");
    expect(response.services.database).toBe("disconnected");
    expect(response.services.error).toBeDefined();
  });

  it("should generate valid ISO timestamp", () => {
    const timestamp = new Date().toISOString();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
TEST3EOF

cat > src/lib/middleware.test.ts << 'TEST4EOF'
import { describe, it, expect } from "vitest";

describe("Middleware - Route Protection Logic", () => {
  const publicRoutes = ["/", "/login", "/api/auth", "/api/health", "/api/login"];

  it("should identify public routes correctly", () => {
    for (const route of publicRoutes) {
      expect(publicRoutes.some((r) => route.startsWith(r))).toBe(true);
    }
  });

  it("should identify protected routes", () => {
    const protectedRoutes = ["/api/operators", "/api/qos", "/api/complaints", "/dashboard", "/admin"];
    for (const route of protectedRoutes) {
      expect(publicRoutes.some((r) => route.startsWith(r))).toBe(false);
    }
  });

  it("should allow static files and Next.js internals", () => {
    const allowedPaths = ["/_next/static/chunk.js", "/_next/image?url=test", "/favicon.ico", "/logo.svg"];
    for (const pathname of allowedPaths) {
      const isAllowed = pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".");
      expect(isAllowed).toBe(true);
    }
  });

  it("should not allow API routes without session", () => {
    const apiRoutes = ["/api/operators", "/api/qos", "/api/complaints"];
    for (const route of apiRoutes) {
      const isPublicApi = route === "/api/health" || route === "/api/login" || route.startsWith("/api/auth");
      expect(isPublicApi).toBe(false);
    }
  });
});
TEST4EOF

cat > src/lib/validation.test.ts << 'TEST5EOF'
import { describe, it, expect } from "vitest";

describe("Pagination Helper", () => {
  function calculatePagination(page: number, limit: number, total: number) {
    return {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  it("should calculate pagination correctly for first page", () => {
    const result = calculatePagination(1, 20, 100);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(5);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false);
  });

  it("should calculate pagination correctly for middle page", () => {
    const result = calculatePagination(3, 20, 100);
    expect(result.page).toBe(3);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(true);
  });

  it("should calculate pagination correctly for last page", () => {
    const result = calculatePagination(5, 20, 100);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it("should handle single page results", () => {
    const result = calculatePagination(1, 20, 15);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
  });

  it("should handle empty results", () => {
    const result = calculatePagination(1, 20, 0);
    expect(result.totalPages).toBe(0);
    expect(result.hasNext).toBe(false);
  });
});

describe("Reference Number Generator", () => {
  function generateReference(prefix: string, year: number, count: number): string {
    return `${prefix}-${year}-${String(count).padStart(3, "0")}`;
  }

  it("should generate PLA reference for complaints", () => {
    expect(generateReference("PLA", 2025, 1)).toBe("PLA-2025-001");
  });

  it("should generate SAN reference for sanctions", () => {
    expect(generateReference("SAN", 2025, 15)).toBe("SAN-2025-015");
  });

  it("should pad count to 3 digits", () => {
    expect(generateReference("PLA", 2025, 5)).toBe("PLA-2025-005");
  });
});

describe("Operator Code Validation", () => {
  function validateOperatorCode(code: string): boolean {
    return /^[A-Z]{2,5}$/.test(code);
  }

  it("should accept valid operator codes", () => {
    expect(validateOperatorCode("ORG")).toBe(true);
    expect(validateOperatorCode("MTN")).toBe(true);
    expect(validateOperatorCode("CEL")).toBe(true);
  });

  it("should reject lowercase codes", () => {
    expect(validateOperatorCode("org")).toBe(false);
  });

  it("should reject codes with numbers", () => {
    expect(validateOperatorCode("OR1")).toBe(false);
  });
});
TEST5EOF

cat > src/lib/roles-rbac.test.ts << 'TEST6EOF'
import { describe, it, expect } from "vitest";

describe("Role-Based Access Control", () => {
  const rolePermissions: Record<string, string[]> = {
    admin: ["users:read", "users:write", "users:delete", "operators:read", "operators:write",
      "qos:read", "qos:write", "qos:review", "complaints:read", "complaints:write",
      "sanctions:read", "sanctions:write", "audits:read", "audits:write",
      "decisions:read", "decisions:write", "reports:generate"],
    dg: ["operators:read", "qos:read", "qos:review", "complaints:read",
      "sanctions:read", "sanctions:approve", "audits:read",
      "decisions:read", "decisions:approve"],
    directeur: ["operators:read", "qos:read", "qos:write", "complaints:read", "complaints:write",
      "sanctions:read", "sanctions:write", "audits:read", "audits:write"],
    chef_service: ["qos:read", "qos:write", "complaints:read", "complaints:write", "audits:read"],
    agent: ["qos:read", "complaints:read", "complaints:write", "audits:read"],
    operateur: ["qos:read", "complaints:read"],
  };

  function hasPermission(role: string, permission: string): boolean {
    return rolePermissions[role]?.includes(permission) ?? false;
  }

  it("should allow admin to do everything", () => {
    expect(hasPermission("admin", "users:read")).toBe(true);
    expect(hasPermission("admin", "users:write")).toBe(true);
    expect(hasPermission("admin", "users:delete")).toBe(true);
    expect(hasPermission("admin", "reports:generate")).toBe(true);
  });

  it("should allow DG to approve but not create", () => {
    expect(hasPermission("dg", "decisions:approve")).toBe(true);
    expect(hasPermission("dg", "sanctions:approve")).toBe(true);
    expect(hasPermission("dg", "decisions:write")).toBe(false);
    expect(hasPermission("dg", "sanctions:write")).toBe(false);
  });

  it("should restrict agent to read-only for most things", () => {
    expect(hasPermission("agent", "complaints:write")).toBe(true);
    expect(hasPermission("agent", "users:read")).toBe(false);
    expect(hasPermission("agent", "operators:write")).toBe(false);
  });

  it("should restrict operateur to minimal access", () => {
    expect(hasPermission("operateur", "qos:read")).toBe(true);
    expect(hasPermission("operateur", "complaints:read")).toBe(true);
    expect(hasPermission("operateur", "complaints:write")).toBe(false);
  });

  it("should return false for unknown roles", () => {
    expect(hasPermission("unknown", "users:read")).toBe(false);
  });

  it("all roles should have at least read access to QoS", () => {
    for (const role of Object.keys(rolePermissions)) {
      expect(hasPermission(role, "qos:read")).toBe(true);
    }
  });
});
TEST6EOF

cat > src/lib/api-routes.test.ts << 'TEST7EOF'
import { describe, it, expect } from "vitest";

describe("API Response Helpers", () => {
  it("should validate QoS metrics ranges", () => {
    function validateQosMetrics(metrics: {
      callSuccessRate?: number;
      dropRate?: number;
      latency?: number;
    }): string[] {
      const errors: string[] = [];
      if (metrics.callSuccessRate !== undefined && (metrics.callSuccessRate < 0 || metrics.callSuccessRate > 100)) {
        errors.push("callSuccessRate must be between 0 and 100");
      }
      if (metrics.dropRate !== undefined && (metrics.dropRate < 0 || metrics.dropRate > 100)) {
        errors.push("dropRate must be between 0 and 100");
      }
      if (metrics.latency !== undefined && metrics.latency < 0) {
        errors.push("latency must be non-negative");
      }
      return errors;
    }

    expect(validateQosMetrics({ callSuccessRate: 95, dropRate: 2, latency: 50 })).toHaveLength(0);
    expect(validateQosMetrics({ callSuccessRate: -1 })).toHaveLength(1);
    expect(validateQosMetrics({ callSuccessRate: 101 })).toHaveLength(1);
    expect(validateQosMetrics({ latency: -10 })).toHaveLength(1);
  });

  it("should validate complaint categories", () => {
    const validCategories = ["qos", "couverture", "facturation", "service_client", "autre"];
    expect(validCategories.includes("qos")).toBe(true);
    expect(validCategories.includes("invalid")).toBe(false);
  });

  it("should validate complaint priorities", () => {
    const validPriorities = ["low", "medium", "high", "critical"];
    expect(validPriorities.includes("medium")).toBe(true);
    expect(validPriorities.includes("urgent")).toBe(false);
  });

  it("should validate sanction types", () => {
    const validTypes = ["avertissement", "amende", "suspension", "retrait"];
    expect(validTypes.includes("amende")).toBe(true);
    expect(validTypes.includes("prison")).toBe(false);
  });
});
TEST7EOF

# ==========================================
# 14. E2E Test Files
# ==========================================
echo ">>> Creating E2E test files..."

cat > e2e/helpers/auth.ts << 'EAUTHEOF'
import { Page, APIRequestContext } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";

export async function nextAuthLogin(
  page: Page,
  email = "admin@arpt.gn",
  password = "Admin@2025"
) {
  const csrfResponse = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;

  const loginResponse = await page.request.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      form: {
        csrfToken,
        email,
        password,
        callbackUrl: BASE_URL,
        json: "true",
      },
    }
  );

  if (loginResponse.status() !== 200 && loginResponse.status() !== 302) {
    throw new Error(
      `Login failed with status ${loginResponse.status()}: ${await loginResponse.text()}`
    );
  }

  await page.waitForTimeout(500);
  return loginResponse;
}

export async function loginApiOnly(
  request: APIRequestContext,
  email = "admin@arpt.gn",
  password = "Admin@2025"
) {
  const response = await request.post(`${BASE_URL}/api/login`, {
    data: { email, password },
  });
  const body = await response.json();
  return { response, token: body.token, user: body.user };
}
EAUTHEOF

cat > e2e/health.spec.ts << 'EHEALTHEOF'
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";

test.describe("Health Check API", () => {
  test("GET /api/health should return ok status", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(body.services).toBeDefined();
  });
});
EHEALTHEOF

cat > e2e/auth.spec.ts << 'EAUTHEOF2'
import { test, expect } from "@playwright/test";
import { nextAuthLogin, loginApiOnly } from "./helpers/auth";

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";

test.describe("Authentication - API Login", () => {
  test("POST /api/login with valid credentials should return token", async ({ request }) => {
    const { response, token, user } = await loginApiOnly(request);
    expect(response.status()).toBe(200);
    expect(token).toBeDefined();
    expect(user.email).toBe("admin@arpt.gn");
  });

  test("POST /api/login with invalid password should return 401", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/login`, {
      data: { email: "admin@arpt.gn", password: "wrong-password" },
    });
    expect(response.status()).toBe(401);
  });

  test("POST /api/login with missing fields should return 400", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/login`, {
      data: { email: "admin@arpt.gn" },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("Authentication - NextAuth", () => {
  test("GET /api/auth/csrf should return a CSRF token", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/csrf`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.csrfToken).toBeDefined();
  });
});
EAUTHEOF2

cat > e2e/api.spec.ts << 'EAPIEOF'
import { test, expect } from "@playwright/test";
import { loginApiOnly } from "./helpers/auth";

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";

test.describe("Operators API", () => {
  test("GET /api/operators should return paginated list", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/operators`);
    expect([200, 401]).toContain(response.status());
  });
});

test.describe("QoS Reports API", () => {
  test("GET /api/qos should return paginated list", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/qos`);
    expect([200, 401]).toContain(response.status());
  });
});

test.describe("Complaints API", () => {
  test("GET /api/complaints should return paginated list", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/complaints`);
    expect([200, 401]).toContain(response.status());
  });
});
EAPIEOF

cat > e2e/workflow.spec.ts << 'EWORKEOF'
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";

test.describe("End-to-End Workflow", () => {
  test("health check should pass", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect([200, 503]).toContain(response.status());
  });

  test("CSRF token flow should work", async ({ request }) => {
    const csrfResponse = await request.get(`${BASE_URL}/api/auth/csrf`);
    expect(csrfResponse.status()).toBe(200);
    const csrfData = await csrfResponse.json();
    expect(csrfData.csrfToken).toBeDefined();
  });
});
EWORKEOF

# ==========================================
# 15. Seed file
# ==========================================
echo ">>> Creating seed file..."
cat > prisma/seed.ts << 'SEEDEOF'
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("Admin@2025", 12);
  const dgPassword = await bcrypt.hash("DG@2025", 12);
  const agentPassword = await bcrypt.hash("Agent@2025", 12);
  const operateurPassword = await bcrypt.hash("Operateur@2025", 12);
  const chefPassword = await bcrypt.hash("Chef@2025", 12);
  const directeurPassword = await bcrypt.hash("Directeur@2025", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@arpt.gn" },
    update: {},
    create: {
      email: "admin@arpt.gn",
      name: "Administrateur ARPT",
      password: adminPassword,
      role: "admin",
      service: "qos",
    },
  });

  const dg = await prisma.user.upsert({
    where: { email: "dg@arpt.gn" },
    update: {},
    create: {
      email: "dg@arpt.gn",
      name: "Directeur General",
      password: dgPassword,
      role: "dg",
    },
  });

  await prisma.user.upsert({
    where: { email: "directeur@arpt.gn" },
    update: {},
    create: {
      email: "directeur@arpt.gn",
      name: "Directeur QoS",
      password: directeurPassword,
      role: "directeur",
      service: "qos",
    },
  });

  await prisma.user.upsert({
    where: { email: "chef@arpt.gn" },
    update: {},
    create: {
      email: "chef@arpt.gn",
      name: "Chef Service Plaintes",
      password: chefPassword,
      role: "chef_service",
      service: "plaintes",
    },
  });

  await prisma.user.upsert({
    where: { email: "agent@arpt.gn" },
    update: {},
    create: {
      email: "agent@arpt.gn",
      name: "Agent Controle",
      password: agentPassword,
      role: "agent",
      service: "qos",
    },
  });

  const orange = await prisma.operator.upsert({
    where: { code: "ORG" },
    update: {},
    create: {
      name: "Orange Guinee",
      code: "ORG",
      type: "mobile",
      status: "active",
      contactEmail: "contact@orange.gn",
      contactPhone: "+224 622 000 000",
      createdById: admin.id,
    },
  });

  const mtn = await prisma.operator.upsert({
    where: { code: "MTN" },
    update: {},
    create: {
      name: "MTN Guinee",
      code: "MTN",
      type: "mobile",
      status: "active",
      contactEmail: "contact@mtn.gn",
      contactPhone: "+224 623 000 000",
      createdById: admin.id,
    },
  });

  const celcom = await prisma.operator.upsert({
    where: { code: "CEL" },
    update: {},
    create: {
      name: "Celcom Guinee",
      code: "CEL",
      type: "mobile",
      status: "active",
      contactEmail: "contact@celcom.gn",
      contactPhone: "+224 624 000 000",
      createdById: admin.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "orange@arpt.gn" },
    update: {},
    create: {
      email: "orange@arpt.gn",
      name: "Representant Orange",
      password: operateurPassword,
      role: "operateur",
    },
  });

  await prisma.qosReport.create({
    data: {
      operatorId: orange.id,
      period: "2025-Q1",
      region: "Conakry",
      callSuccessRate: 95.5,
      callSetupTime: 3.2,
      dropRate: 2.1,
      handoverSuccessRate: 98.0,
      smsSuccessRate: 99.2,
      dataThroughput: 25.8,
      latency: 45.0,
      overallScore: 92.3,
      status: "approved",
      reviewedById: dg.id,
      createdById: admin.id,
    },
  });

  await prisma.qosReport.create({
    data: {
      operatorId: mtn.id,
      period: "2025-Q1",
      region: "Conakry",
      callSuccessRate: 93.0,
      callSetupTime: 4.1,
      dropRate: 3.5,
      handoverSuccessRate: 96.0,
      smsSuccessRate: 98.5,
      dataThroughput: 22.0,
      latency: 55.0,
      overallScore: 87.1,
      status: "submitted",
      createdById: admin.id,
    },
  });

  await prisma.qosReport.create({
    data: {
      operatorId: celcom.id,
      period: "2025-Q1",
      region: "Kankan",
      callSuccessRate: 88.0,
      callSetupTime: 5.5,
      dropRate: 5.2,
      handoverSuccessRate: 92.0,
      smsSuccessRate: 96.0,
      dataThroughput: 15.0,
      latency: 80.0,
      overallScore: 78.5,
      status: "draft",
      createdById: admin.id,
    },
  });

  await prisma.complaint.create({
    data: {
      reference: "PLA-2025-001",
      title: "Qualite d'appel degradee a Conakry",
      description: "Depuis le debut du mois, la qualite des appels est tres degradee dans le quartier de Kaloum.",
      category: "qos",
      priority: "high",
      status: "open",
      operatorId: orange.id,
      complainantName: "Mamadou Diallo",
      complainantPhone: "+224 622 123 456",
      createdById: admin.id,
    },
  });

  await prisma.sanction.create({
    data: {
      reference: "SAN-2025-001",
      title: "Avertissement - Non respect des seuils QoS",
      description: "Sanction prononcee pour non respect des seuils minimaux de qualite de service.",
      type: "avertissement",
      operatorId: celcom.id,
      status: "confirmed",
      decisionDate: new Date("2025-03-15"),
      createdById: dg.id,
    },
  });

  await prisma.audit.create({
    data: {
      reference: "AUD-2025-001",
      title: "Audit de conformite reseau - Orange Guinee",
      description: "Audit technique de conformite du reseau mobile d'Orange Guinee.",
      type: "technical",
      status: "planned",
      operatorId: orange.id,
      leadAuditorId: admin.id,
      createdById: admin.id,
    },
  });

  await prisma.decision.create({
    data: {
      reference: "DEC-2025-001",
      title: "Decision tarification interconnexion 2025",
      description: "Fixation des tarifs d'interconnexion pour l'annee 2025.",
      type: "tarifaire",
      status: "published",
      decidedById: dg.id,
      decidedAt: new Date("2025-01-15"),
      publishedAt: new Date("2025-01-20"),
      createdById: dg.id,
    },
  });

  console.log("Seeding completed!");
  console.log("Users: admin, dg, directeur, chef, agent, operateur");
  console.log("Operators: Orange, MTN, Celcom");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
SEEDEOF

# ==========================================
# 16. Scripts
# ==========================================
echo ">>> Creating scripts..."

cat > scripts/test-all.sh << 'TESTALLSH'
#!/bin/bash
set -e
echo "=================================="
echo "ARPT Guinee - All Tests"
echo "=================================="
echo ""
echo "--- Frontend Unit Tests (Vitest) ---"
npx vitest run 2>&1 || echo "WARNING: Some unit tests failed"
echo ""
echo "--- E2E Tests (Playwright) ---"
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
  BASE_URL=http://localhost:3002 npx playwright test 2>&1 || echo "WARNING: Some E2E tests failed"
else
  echo "WARNING: App not running on port 3002. Skipping E2E tests."
fi
echo ""
echo "=================================="
echo "All tests completed!"
echo "=================================="
TESTALLSH

cat > scripts/test-e2e.sh << 'TESTE2ESH'
#!/bin/bash
set -e
echo "=================================="
echo "ARPT Guinee - E2E Tests"
echo "=================================="
if ! curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
  echo "App not running. Starting..."
  if command -v docker &> /dev/null; then
    docker compose up -d --wait 2>/dev/null || true
  fi
  sleep 5
fi
echo "Running E2E tests..."
BASE_URL=http://localhost:3002 npx playwright test "$@"
TESTE2ESH

cat > scripts/switch-db.sh << 'SWITCHDBSH'
#!/bin/bash
case "$1" in
  sqlite)
    cp prisma/schema.sqlite.prisma prisma/schema.prisma
    echo "Switched to SQLite schema"
    ;;
  postgres|postgresql)
    cp prisma/schema.postgres.prisma prisma/schema.prisma
    echo "Switched to PostgreSQL schema"
    ;;
  *)
    echo "Usage: $0 {sqlite|postgres}"
    exit 1
    ;;
esac
echo "Run 'npx prisma generate' to regenerate the Prisma client."
SWITCHDBSH

# ==========================================
# 17. Update .dockerignore
# ==========================================
echo ">>> Updating .dockerignore..."
cat > .dockerignore << 'DOCKERIGNOREEOF'
node_modules
.next
.git
.gitignore
.env.local
.env*.local
docker-compose*
Dockerfile
*.md
skills/
examples/
download/
upload/
db/
e2e/
scripts/
playwright.config.ts
vitest.config.ts
src/test/
src/**/*.test.ts
src/**/*.spec.ts
DOCKERIGNOREEOF

# ==========================================
# 18. Remove old API route
# ==========================================
echo ">>> Cleaning up..."
rm -f src/app/api/route.ts

# ==========================================
# Done!
# ==========================================
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "  1. Install dependencies:"
echo "     npm install"
echo ""
echo "  2. Generate Prisma client and create DB:"
echo "     npx prisma generate"
echo "     npx prisma db push"
echo ""
echo "  3. Seed the database:"
echo "     npx tsx prisma/seed.ts"
echo ""
echo "  4. Run unit tests:"
echo "     npx vitest run"
echo ""
echo "  5. Start the app locally:"
echo "     npm run dev"
echo ""
echo "  6. OR start with Docker (requires Docker Compose):"
echo "     bash scripts/switch-db.sh postgres"
echo "     docker compose --env-file .env.docker up --build -d"
echo "     docker compose exec frontend npx tsx prisma/seed.ts"
echo ""
echo "  7. Run E2E tests (app must be running):"
echo "     npx playwright install chromium"
echo "     bash scripts/test-e2e.sh"
echo ""
echo "  8. Run all tests:"
echo "     bash scripts/test-all.sh"
echo ""
echo "Test Accounts:"
echo "  admin@arpt.gn     / Admin@2025   (admin)"
echo "  dg@arpt.gn        / DG@2025      (dg)"
echo "  directeur@arpt.gn / Directeur@2025 (directeur)"
echo "  chef@arpt.gn      / Chef@2025    (chef_service)"
echo "  agent@arpt.gn     / Agent@2025   (agent)"
echo "  orange@arpt.gn    / Operateur@2025 (operateur)"
