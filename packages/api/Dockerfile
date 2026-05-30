FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/prisma/package.json ./packages/prisma/package.json
COPY packages/api/package.json ./packages/api/package.json
RUN npm install
COPY packages/shared ./packages/shared
COPY packages/prisma ./packages/prisma
COPY packages/api ./packages/api
RUN npm run prisma:generate -w @interpretive/prisma && npm run build -w @interpretive/api

FROM node:22-alpine
WORKDIR /repo
COPY --from=build /repo /repo
EXPOSE 3000
WORKDIR /repo/packages/api
CMD ["node", "dist/index.js"]
