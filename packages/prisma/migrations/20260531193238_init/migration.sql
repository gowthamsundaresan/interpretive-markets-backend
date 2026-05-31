-- CreateEnum
CREATE TYPE "ReExecStatus" AS ENUM ('pending', 'verified', 'disputed');

-- CreateTable
CREATE TABLE "Framework" (
    "id" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "metadata" BYTEA NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL,
    "registeredAtBlock" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Framework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Judge" (
    "imageDigest" TEXT NOT NULL,
    "signer" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" TIMESTAMP(3) NOT NULL,
    "registeredAtBlock" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Judge_pkey" PRIMARY KEY ("imageDigest")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" BIGINT NOT NULL,
    "question" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "judgeDigest" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "promptTemplateHash" TEXT NOT NULL,
    "dataSourceSpec" BYTEA NOT NULL,
    "resolutionTime" TIMESTAMP(3) NOT NULL,
    "creator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAtBlock" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verdict" (
    "marketId" BIGINT NOT NULL,
    "outcome" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "verdictHash" TEXT NOT NULL,
    "bundleRef" TEXT NOT NULL,
    "signer" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "postedAtBlock" BIGINT NOT NULL DEFAULT 0,
    "reExecStatus" "ReExecStatus" NOT NULL DEFAULT 'pending',
    "reExecCheckedAt" TIMESTAMP(3),
    "reExecHash" TEXT,
    "disputed" BOOLEAN NOT NULL DEFAULT false,
    "disputedAt" TIMESTAMP(3),
    "disputedAtBlock" BIGINT,

    CONSTRAINT "Verdict_pkey" PRIMARY KEY ("marketId")
);

-- CreateTable
CREATE TABLE "ReExecBundle" (
    "marketId" BIGINT NOT NULL,
    "ipfsCid" TEXT NOT NULL,
    "eigenDABlobKey" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "fetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReExecBundle_pkey" PRIMARY KEY ("marketId")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "EventLogs_FrameworkRegistered" (
    "address" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,

    CONSTRAINT "EventLogs_FrameworkRegistered_pkey" PRIMARY KEY ("transactionHash","transactionIndex")
);

-- CreateTable
CREATE TABLE "EventLogs_JudgeRegistered" (
    "address" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "imageDigest" TEXT NOT NULL,
    "signer" TEXT NOT NULL,

    CONSTRAINT "EventLogs_JudgeRegistered_pkey" PRIMARY KEY ("transactionHash","transactionIndex")
);

-- CreateTable
CREATE TABLE "EventLogs_JudgeEnabledSet" (
    "address" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "imageDigest" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "EventLogs_JudgeEnabledSet_pkey" PRIMARY KEY ("transactionHash","transactionIndex")
);

-- CreateTable
CREATE TABLE "EventLogs_MarketCreated" (
    "address" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "marketId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "judgeImageDigest" TEXT NOT NULL,
    "creator" TEXT NOT NULL,

    CONSTRAINT "EventLogs_MarketCreated_pkey" PRIMARY KEY ("transactionHash","transactionIndex")
);

-- CreateTable
CREATE TABLE "EventLogs_VerdictPosted" (
    "address" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "marketId" TEXT NOT NULL,
    "signer" TEXT NOT NULL,
    "bundleRef" TEXT NOT NULL,

    CONSTRAINT "EventLogs_VerdictPosted_pkey" PRIMARY KEY ("transactionHash","transactionIndex")
);

-- CreateTable
CREATE TABLE "EventLogs_VerdictDisputed" (
    "address" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "marketId" TEXT NOT NULL,
    "disputer" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,

    CONSTRAINT "EventLogs_VerdictDisputed_pkey" PRIMARY KEY ("transactionHash","transactionIndex")
);

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_judgeDigest_fkey" FOREIGN KEY ("judgeDigest") REFERENCES "Judge"("imageDigest") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verdict" ADD CONSTRAINT "Verdict_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReExecBundle" ADD CONSTRAINT "ReExecBundle_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Verdict"("marketId") ON DELETE RESTRICT ON UPDATE CASCADE;
