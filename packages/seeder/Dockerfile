FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/prisma/package.json ./packages/prisma/package.json
COPY packages/seeder/package.json ./packages/seeder/package.json
RUN npm install
COPY packages/shared ./packages/shared
COPY packages/prisma ./packages/prisma
COPY packages/seeder ./packages/seeder
RUN npm run prisma:generate -w @interpretive/prisma && npm run build -w @interpretive/seeder

FROM node:22-alpine
WORKDIR /repo
COPY --from=build /repo /repo
WORKDIR /repo/packages/seeder
CMD ["node", "dist/index.js"]
