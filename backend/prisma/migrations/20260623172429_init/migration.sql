-- CreateTable
CREATE TABLE "Anetar" (
    "id" SERIAL NOT NULL,
    "emer" TEXT NOT NULL,
    "mbiemer" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "numriID" TEXT NOT NULL,
    "penalitete" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anetar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vend" (
    "id" SERIAL NOT NULL,
    "kodi" TEXT NOT NULL,
    "salla" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'i_lire',

    CONSTRAINT "Vend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rezervim" (
    "id" SERIAL NOT NULL,
    "anetarId" INTEGER NOT NULL,
    "vendId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "oraFillimit" TIMESTAMP(3) NOT NULL,
    "oraMbarimit" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aktiv',
    "kodiQR" TEXT,
    "checkIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rezervim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Anetar_email_key" ON "Anetar"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Anetar_numriID_key" ON "Anetar"("numriID");

-- CreateIndex
CREATE UNIQUE INDEX "Vend_kodi_key" ON "Vend"("kodi");

-- AddForeignKey
ALTER TABLE "Rezervim" ADD CONSTRAINT "Rezervim_anetarId_fkey" FOREIGN KEY ("anetarId") REFERENCES "Anetar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezervim" ADD CONSTRAINT "Rezervim_vendId_fkey" FOREIGN KEY ("vendId") REFERENCES "Vend"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
