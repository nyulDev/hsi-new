import { PrismaClient } from '../src/generated/prisma/index.js';
const p = new PrismaClient();

try {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  console.log('=== Current Date:', currentDate.toISOString(), '===\n');

  // ── STEP 1: Cari investor CASH FLOW H S I ──────────────────────────
  const investor = await p.investor.findFirst({
    where: { nama: { contains: 'CASH FLOW' } },
    select: { id: true, kode: true, nama: true },
  });
  console.log('Investor CASH FLOW H S I:', investor);
  if (!investor) { console.error('Investor not found'); process.exit(1); }

  // ── STEP 2: Semua transaksi June 1-8 (investments page logic) ──────
  const startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0);
  const endDate   = new Date(currentYear, currentMonth, 8, 23, 59, 59);
  console.log('\nDate range (1-8):', startDate.toISOString(), '→', endDate.toISOString());

  const txIn18 = await p.mutasiRecord.findMany({
    where: {
      investorId: investor.id,
      admin2_status: 'APPROVE',
      tanggal: { gte: startDate, lte: endDate },
    },
    orderBy: [{ tanggal: 'asc' }, { id: 'asc' }],
    select: { id: true, tanggal: true, mutasi: true, nilai_mutasi: true, saldo_akhir: true, keterangan: true },
  });
  console.log('\nTransaksi APPROVE dalam June 1-8 untuk investor ini:', txIn18.length);
  txIn18.forEach(t => console.log(
    ' ', t.tanggal.toISOString().split('T')[0],
    t.mutasi, Number(t.nilai_mutasi).toLocaleString('id-ID'),
    '| saldo_akhir:', Number(t.saldo_akhir).toLocaleString('id-ID'),
    '|', t.keterangan
  ));

  const lastTx = txIn18[txIn18.length - 1];
  const saldoInvestments = lastTx ? Number(lastTx.saldo_akhir) : 0;
  console.log('\n→ Saldo yang dipakai investments page:', saldoInvestments.toLocaleString('id-ID'));

  // ── STEP 3: totalSaldo semua investor (investments page) ───────────
  const allInvestors = await p.investor.findMany({ select: { id: true, kode: true } });

  const allTx18 = await p.mutasiRecord.findMany({
    where: {
      admin2_status: 'APPROVE',
      tanggal: { gte: startDate, lte: endDate },
    },
    orderBy: [{ tanggal: 'asc' }, { id: 'asc' }],
    select: { investorId: true, saldo_akhir: true },
  });

  // Ambil saldo_akhir terakhir per investor (persis investments page)
  const byInvestor = new Map();
  for (const tx of allTx18) {
    byInvestor.set(tx.investorId, Number(tx.saldo_akhir));
  }

  // investments page: loop ALL investors (no kode filter)
  let totalSaldoPage = 0;
  for (const inv of allInvestors) {
    totalSaldoPage += byInvestor.get(inv.id) ?? 0;
  }
  console.log('\n→ totalSaldo (investments page, ALL investors):', totalSaldoPage.toLocaleString('id-ID'));

  // process-debet: loop hanya investor dengan kode
  let totalSaldoDebet = 0;
  for (const inv of allInvestors) {
    if (!inv.kode) continue;
    totalSaldoDebet += byInvestor.get(inv.id) ?? 0;
  }
  console.log('→ totalSaldo (process-debet, skip no-kode):', totalSaldoDebet.toLocaleString('id-ID'));

  // ── STEP 4: Modal bulan berjalan ────────────────────────────────────
  const startMonth = new Date(currentYear, currentMonth, 1);
  const endMonth   = new Date(currentYear, currentMonth + 1, 0);
  const modalAgg = await p.breakdown.aggregate({
    where: { tanggal: { gte: startMonth, lte: endMonth } },
    _sum: { nilai: true },
  });
  const modal = modalAgg._sum?.nilai ? Number(modalAgg._sum.nilai) : 0;
  console.log('\n→ Modal (breakdown bulan berjalan):', modal.toLocaleString('id-ID'));

  // ── STEP 5: Hitung persenM dan dana_terpakai ────────────────────────
  const persenM_page  = totalSaldoPage  > 0 ? Math.min(100, (modal / totalSaldoPage)  * 100) : 0;
  const persenM_debet = totalSaldoDebet > 0 ? Math.min(100, (modal / totalSaldoDebet) * 100) : 0;

  const dana_page  = saldoInvestments * (persenM_page  / 100);
  const dana_debet = saldoInvestments * (persenM_debet / 100);

  console.log('\n=== PERBANDINGAN ===');
  console.log('persenM investments page :', persenM_page.toFixed(6), '%');
  console.log('persenM process-debet    :', persenM_debet.toFixed(6), '%');
  console.log('dana_terpakai investments:', Math.round(dana_page).toLocaleString('id-ID'));
  console.log('dana_terpakai debet route:', Math.round(dana_debet).toLocaleString('id-ID'));

  // ── STEP 6: Periksa transaksi TERBARU per investor (bukan filter 1-8) ─
  console.log('\n=== Cek: Apakah ada investor tanpa kode yang punya saldo di 1-8? ===');
  const noKodeInvestors = allInvestors.filter(i => !i.kode);
  let noKodeSaldo = 0;
  for (const inv of noKodeInvestors) {
    const s = byInvestor.get(inv.id) ?? 0;
    if (s !== 0) {
      console.log('  Investor (no kode) id:', inv.id, 'saldo:', s.toLocaleString('id-ID'));
      noKodeSaldo += s;
    }
  }
  console.log('  Total saldo no-kode investors:', noKodeSaldo.toLocaleString('id-ID'));

  // ── STEP 7: Semua transaksi CASH FLOW H S I tanpa batasan tanggal ───
  const allTxCF = await p.mutasiRecord.findMany({
    where: { investorId: investor.id, admin2_status: 'APPROVE' },
    orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
    take: 10,
    select: { tanggal: true, mutasi: true, nilai_mutasi: true, saldo_akhir: true, keterangan: true },
  });
  console.log('\n=== 10 Transaksi APPROVE terbaru CASH FLOW H S I ===');
  allTxCF.forEach(t => console.log(
    ' ', t.tanggal.toISOString().split('T')[0],
    t.mutasi, Number(t.nilai_mutasi).toLocaleString('id-ID'),
    '| saldo_akhir:', Number(t.saldo_akhir).toLocaleString('id-ID'),
    '|', t.keterangan
  ));

} catch(e) {
  console.error('ERROR:', e);
} finally {
  await p.$disconnect();
}
