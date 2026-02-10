-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "kode" TEXT,
    "nama" TEXT,
    "nilai" DECIMAL(15,2) NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "jatuh_tempo" TIMESTAMP(3) NOT NULL,
    "suku_bunga" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "bunga_diterima" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
