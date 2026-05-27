#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════
# ARPT Guinée — Comprehensive Docker Fix Script
# Fixes: Queue name colons, redis version conflict, missing modules
# ══════════════════════════════════════════════════════════════════════════

set -e

echo "🔧 ARPT Guinée — Docker Fix Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Reset files modified by previous broken sed commands ────────
echo ""
echo "📦 Step 1: Resetting files to git clean state..."
git checkout -- ws-server/src/workers.ts
git checkout -- ws-server/src/queue.ts
git checkout -- ws-server/src/socket-server.ts
git checkout -- src/lib/queue.ts
git checkout -- src/lib/notification-service.ts
git checkout -- ws-server/package.json
git checkout -- package.json
git checkout -- Dockerfile
git checkout -- ws-server/Dockerfile
echo "✅ All files reset to git clean state"

# ── Step 2: Fix queue names (arpt: → arpt-) ───────────────────────────
echo ""
echo "📦 Step 2: Fixing queue names (removing colons)..."

# ws-server/src/workers.ts
sed -i "s/'arpt:email'/'arpt-email'/g" ws-server/src/workers.ts
sed -i "s/'arpt:sms'/'arpt-sms'/g" ws-server/src/workers.ts
sed -i "s/'arpt:notification'/'arpt-notification'/g" ws-server/src/workers.ts
sed -i "s/'arpt:export'/'arpt-export'/g" ws-server/src/workers.ts
sed -i "s/'arpt:schedule-execution'/'arpt-schedule-execution'/g" ws-server/src/workers.ts

# ws-server/src/queue.ts
sed -i "s/'arpt:email'/'arpt-email'/g" ws-server/src/queue.ts
sed -i "s/'arpt:sms'/'arpt-sms'/g" ws-server/src/queue.ts
sed -i "s/'arpt:notification'/'arpt-notification'/g" ws-server/src/queue.ts
sed -i "s/'arpt:export'/'arpt-export'/g" ws-server/src/queue.ts
sed -i "s/'arpt:schedule-execution'/'arpt-schedule-execution'/g" ws-server/src/queue.ts

# src/lib/queue.ts
sed -i "s/'arpt:email'/'arpt-email'/g" src/lib/queue.ts
sed -i "s/'arpt:sms'/'arpt-sms'/g" src/lib/queue.ts
sed -i "s/'arpt:notification'/'arpt-notification'/g" src/lib/queue.ts
sed -i "s/'arpt:export'/'arpt-export'/g" src/lib/queue.ts
sed -i "s/'arpt:schedule-execution'/'arpt-schedule-execution'/g" src/lib/queue.ts

echo "✅ Queue names fixed (arpt: → arpt-) in 3 files"

# ── Step 3: Fix ws-server socket-server.ts — use ioredis instead of redis
echo ""
echo "📦 Step 3: Fixing ws-server socket-server.ts (ioredis instead of redis)..."

# Replace the redis require block in socket-server.ts
# The block is from "const redisModule = eval('require')('redis')" to the end of the if block
# We use a Python one-liner for multi-line sed replacement
python3 -c "
import re
with open('ws-server/src/socket-server.ts', 'r') as f:
    content = f.read()

old_block = '''  if (process.env.REDIS_URL) {
    try {
      const redisModule = eval('require')('redis') // NOSONAR: intentional dynamic require
      if (!redisModule) {
        log.warn('WebSocket', 'Redis package not installed. Run: npm install redis')
      } else {
        const pubClient = redisModule.createClient({ url: process.env.REDIS_URL })
        const subClient = pubClient.duplicate()

        await Promise.all([pubClient.connect(), subClient.connect()])

        io.adapter(createAdapter(pubClient, subClient))
        log.info('WebSocket', 'Redis adapter connected for multi-instance scaling')
      }
    } catch (err) {
      log.warn('WebSocket', 'Redis adapter failed, falling back to single-instance mode', err)
    }
  }'''

new_block = '''  if (process.env.REDIS_URL) {
    try {
      // Use ioredis (already installed) instead of the redis package
      // This avoids the version conflict: bullmq@5.x requires redis@>=5.0 as peerOptional
      // but @socket.io/redis-adapter@8.x expects redis@^4.0 — ioredis works with both.
      const IORedis = eval('require')('ioredis') // NOSONAR: intentional dynamic require
      if (!IORedis) {
        log.warn('WebSocket', 'ioredis package not installed. Run: npm install ioredis')
      } else {
        const pubClient = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false })
        const subClient = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false })

        io.adapter(createAdapter(pubClient, subClient))
        log.info('WebSocket', 'Redis adapter connected for multi-instance scaling (ioredis)')
      }
    } catch (err) {
      log.warn('WebSocket', 'Redis adapter failed, falling back to single-instance mode', err)
    }
  }'''

content = content.replace(old_block, new_block)

with open('ws-server/src/socket-server.ts', 'w') as f:
    f.write(content)
print('socket-server.ts patched')
"

echo "✅ ws-server socket-server.ts uses ioredis (no redis package needed)"

# ── Step 4: Fix frontend notification-service.ts — use ioredis instead of redis
echo ""
echo "📦 Step 4: Fixing frontend notification-service.ts (ioredis instead of redis)..."

python3 -c "
with open('src/lib/notification-service.ts', 'r') as f:
    content = f.read()

old_block = '''    try {
      // Dynamic import of redis (optional dependency — may not be installed)
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const redis = eval('require')('redis') // NOSONAR: intentional dynamic require
      if (!redis) {
        logger.warn('Notification', 'Redis package not installed. Run: npm install redis')
        return
      }

      const { Emitter } = eval('require')('@socket.io/redis-emitter') // NOSONAR: intentional dynamic require
      if (!Emitter) {
        logger.warn('Notification', '@socket.io/redis-emitter not installed. Run: npm install @socket.io/redis-emitter')
        return
      }

      const pubClient = redis.createClient({ url: process.env.REDIS_URL })
      await pubClient.connect()

      this.wsEmitter = new Emitter(pubClient)'''

new_block = '''    try {
      // Use ioredis (already installed) instead of the redis package
      // This avoids the version conflict between bullmq@5.x (needs redis@>=5) 
      // and @socket.io/redis-adapter@8.x (needs redis@^4) — ioredis works with both.
      const IORedis = eval('require')('ioredis') // NOSONAR: intentional dynamic require
      if (!IORedis) {
        logger.warn('Notification', 'ioredis package not installed. Run: npm install ioredis')
        return
      }

      const { Emitter } = eval('require')('@socket.io/redis-emitter') // NOSONAR: intentional dynamic require
      if (!Emitter) {
        logger.warn('Notification', '@socket.io/redis-emitter not installed. Run: npm install @socket.io/redis-emitter')
        return
      }

      const pubClient = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false })

      this.wsEmitter = new Emitter(pubClient)'''

content = content.replace(old_block, new_block)

with open('src/lib/notification-service.ts', 'w') as f:
    f.write(content)
print('notification-service.ts patched')
"

echo "✅ Frontend notification-service.ts uses ioredis"

# ── Step 5: Add @socket.io/redis-emitter to frontend package.json ─────
echo ""
echo "📦 Step 5: Adding @socket.io/redis-emitter to frontend package.json..."

# Check if already present (avoid duplicates)
if grep -q '"@socket.io/redis-emitter"' package.json; then
    echo "  Already present, skipping"
else
    # Insert after "ioredis" line
    sed -i 's/"ioredis": "\^5.10.1",/"@socket.io\/redis-emitter": "\^5.1.0",\n    "ioredis": "\^5.10.1",/' package.json
    echo "  Added @socket.io/redis-emitter@^5.1.0"
fi

# Make sure NO "redis" package is in frontend package.json (avoid conflicts)
# (We don't need it — ioredis handles everything)
if grep -q '"redis":' package.json; then
    echo "  Removing conflicting 'redis' entry from package.json..."
    sed -i '/"redis":/d' package.json
fi

echo "✅ Frontend package.json updated"

# ── Step 6: Verify ws-server/package.json has NO redis package ─────────
echo ""
echo "📦 Step 6: Verifying ws-server/package.json..."

if grep -q '"redis":' ws-server/package.json; then
    echo "  Removing conflicting 'redis' entry from ws-server/package.json..."
    sed -i '/"redis":/d' ws-server/package.json
fi

echo "✅ ws-server/package.json clean (no redis package, only ioredis)"

# ── Step 7: Fix frontend Dockerfile ────────────────────────────────────
echo ""
echo "📦 Step 7: Fixing frontend Dockerfile..."

python3 -c "
with open('Dockerfile', 'r') as f:
    content = f.read()

# Fix 1: Add --legacy-peer-deps to npm ci
content = content.replace(
    'RUN npm ci --prefer-offline || npm install',
    'RUN npm ci --prefer-offline --legacy-peer-deps || npm install --legacy-peer-deps'
)

# Fix 2: Add COPY for ALL node_modules after the prisma-specific copies
old_docker = '''# Copy Prisma engine from node_modules (needed for prisma db push at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy bcryptjs (needed by seed-wrapper.js)
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs'''

new_docker = '''# Copy Prisma engine from node_modules (needed for prisma db push at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy ALL remaining node_modules for prisma db push deep transitive deps
# (prisma CLI needs c12 -> effect, and many other transitive dependencies)
# This is needed because \"prisma db push\" runs at container startup
COPY --from=builder /app/node_modules ./node_modules

# Copy bcryptjs (needed by seed-wrapper.js)
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs'''

content = content.replace(old_docker, new_docker)

with open('Dockerfile', 'w') as f:
    f.write(content)
print('Dockerfile patched')
"

echo "✅ Frontend Dockerfile fixed (all node_modules + --legacy-peer-deps)"

# ── Step 8: Fix ws-server Dockerfile ──────────────────────────────────
echo ""
echo "📦 Step 8: Fixing ws-server Dockerfile..."

python3 -c "
with open('ws-server/Dockerfile', 'r') as f:
    content = f.read()

# Fix 1: Add --legacy-peer-deps to deps stage
content = content.replace(
    'RUN npm ci --prefer-offline || npm install',
    'RUN npm ci --prefer-offline --legacy-peer-deps || npm install --legacy-peer-deps'
)

# Fix 2: Add --legacy-peer-deps to runner stage
content = content.replace(
    'RUN npm install --omit=dev --prefer-offline',
    'RUN npm install --omit=dev --prefer-offline --legacy-peer-deps'
)

with open('ws-server/Dockerfile', 'w') as f:
    f.write(content)
print('ws-server/Dockerfile patched')
"

echo "✅ ws-server Dockerfile fixed (--legacy-peer-deps added)"

# ── Step 9: Verification ──────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verification des modifications..."
echo ""

echo "── Queue names (should NOT contain colons):"
echo "  workers.ts:"
grep "arpt" ws-server/src/workers.ts | head -5
echo "  queue.ts (ws-server):"
grep "arpt" ws-server/src/queue.ts | head -5
echo "  queue.ts (frontend):"
grep "arpt" src/lib/queue.ts | head -5

echo ""
echo "── ws-server socket-server.ts (should use ioredis, NOT redis):"
grep -n "eval('require')" ws-server/src/socket-server.ts

echo ""
echo "── notification-service.ts (should use ioredis, NOT redis):"
grep -n "eval('require')" src/lib/notification-service.ts

echo ""
echo "── Frontend package.json redis entries (should only have @socket.io/redis-emitter):"
grep -n "redis" package.json

echo ""
echo "── ws-server/package.json redis entries (should only have ioredis):"
grep -n "redis" ws-server/package.json

echo ""
echo "── Frontend Dockerfile node_modules copy:"
grep -n "node_modules" Dockerfile

echo ""
echo "── ws-server Dockerfile npm install:"
grep -n "npm" ws-server/Dockerfile

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All modifications applied!"
echo ""
echo "🚀 Next steps:"
echo "   docker compose build --no-cache"
echo "   docker compose up -d"
echo "   docker compose logs -f ws frontend"
echo ""
