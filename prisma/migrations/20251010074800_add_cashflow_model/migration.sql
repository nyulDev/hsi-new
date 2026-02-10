-- CreateTable
CREATE TABLE "public"."cashflows" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "pt" TEXT NOT NULL,
    "mutasi" "public"."MutasiType" NOT NULL,
    "nilai" DECIMAL(15,2) NOT NULL,
    "saldo" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashflows_pkey" PRIMARY KEY ("id")
);
