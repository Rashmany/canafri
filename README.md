# CanaFri

Canton Network content and freelance platform.
Built on Canton · Create · Work · Earn

## Stack
- Next.js 15, TypeScript, Tailwind CSS
- Fastify, Prisma, PostgreSQL, Redis
- Turborepo monorepo

## Prerequisites
- Node.js v20+
- Docker Desktop
- npm v9+
- Git

## Local Setup

Clone the repo:
git clone https://github.com/YOUR_USERNAME/canafri.git
cd canafri

Install dependencies:
npm install

Copy env files:
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

Start database:
docker compose up -d

Run migrations:
cd apps/api
npx prisma migrate dev
cd ../..

Start dev server:
npm run dev

## Ports
Frontend — http://localhost:3000
Backend  — http://localhost:3001

## Branch Strategy
main     — production
staging  — pre-production
dev      — team integration
feature/ — individual work

## Dev Workflow
1. Pull latest dev branch
2. Create feature branch from dev
3. Build your feature
4. Push and open PR to dev
5. Get review then merge