-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentProvider" TEXT NOT NULL DEFAULT 'asaas';

-- CreateTable
CREATE TABLE "PaymentSettings" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "accountId" TEXT,
    "creditCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MercadoPagoAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "access" TEXT,
    "refresh" TEXT,
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MercadoPagoAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MercadoPagoOAuthAttempt" (
    "hash" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MercadoPagoOAuthAttempt_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "MercadoPagoPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "requestBody" TEXT,
    "method" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "providerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "detail" TEXT NOT NULL DEFAULT 'created',
    "reversed" BOOLEAN NOT NULL DEFAULT false,
    "qrCode" TEXT,
    "qrImage" TEXT,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MercadoPagoPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MercadoPagoWebhookEvent" (
    "key" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "MercadoPagoWebhookEvent_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "UpnodeCommissionEntry" (
    "key" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "cents" INTEGER NOT NULL,
    "salesCents" INTEGER NOT NULL DEFAULT 0,
    "refundCents" INTEGER NOT NULL DEFAULT 0,
    "statementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpnodeCommissionEntry_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "UpnodeWeeklyStatement" (
    "id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "salesCents" INTEGER NOT NULL,
    "refundCents" INTEGER NOT NULL,
    "feesCents" INTEGER NOT NULL,
    "adjustments" INTEGER NOT NULL,
    "openingCredit" INTEGER NOT NULL,
    "closingCredit" INTEGER NOT NULL,
    "dueCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'billing_disabled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpnodeWeeklyStatement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MercadoPagoAccount_userId_key" ON "MercadoPagoAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MercadoPagoPayment_providerId_key" ON "MercadoPagoPayment"("providerId");

-- CreateIndex
CREATE INDEX "MercadoPagoPayment_checkedAt_createdAt_idx" ON "MercadoPagoPayment"("checkedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MercadoPagoPayment_orderId_requestKey_key" ON "MercadoPagoPayment"("orderId", "requestKey");

-- CreateIndex
CREATE INDEX "MercadoPagoWebhookEvent_status_receivedAt_idx" ON "MercadoPagoWebhookEvent"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "UpnodeCommissionEntry_statementId_createdAt_idx" ON "UpnodeCommissionEntry"("statementId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UpnodeWeeklyStatement_start_key" ON "UpnodeWeeklyStatement"("start");

-- AddForeignKey
ALTER TABLE "PaymentSettings" ADD CONSTRAINT "PaymentSettings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MercadoPagoAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MercadoPagoPayment" ADD CONSTRAINT "MercadoPagoPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MercadoPagoPayment" ADD CONSTRAINT "MercadoPagoPayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MercadoPagoAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpnodeCommissionEntry" ADD CONSTRAINT "UpnodeCommissionEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpnodeCommissionEntry" ADD CONSTRAINT "UpnodeCommissionEntry_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "UpnodeWeeklyStatement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
