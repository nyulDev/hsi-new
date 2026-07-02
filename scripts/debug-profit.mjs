import { PrismaClient } from '../src/generated/prisma/index.js';
const p = new PrismaClient();

try {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // ── Saldo: June 1-8 APPROVE (investments page logic) ───────────────
  const startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0);
  const endDate   = new Date(currentYear, currentMonth, 8, 23, 59, 59);

  const allTransactions = await p.mutasiRecord.findMany({
    where: { admin2_status: 'APPROVE', tanggal: { gte: startDate, lte: endDate } },
    orderBy: [{ tanggal: 'asc' }, { id: 'asc' }],
    select: { investorId: true, saldo_akhir: true },
  });

  const byInvestor = new Map();
  for (const tx of allTransactions) {
    byInvestor.set(tx.investorId, Number(tx.saldo_akhir));
  }

  const allInvestors = await p.investor.findMany({
    select: { id: true, kode: true, nama: true },
  });

  let totalSaldo = 0;
  const saldoMap = new Map();
  for (const inv of allInvestors) {
    const saldo = byInvestor.get(inv.id) ?? 0;
    saldoMap.set(inv.id, saldo);
    totalSaldo += saldo;
  }

  // ── Modal: JS filter month+year ─────────────────────────────────────
  const allBreakdowns = await p.breakdown.findMany({ select: { tanggal: true, nilai: true } });
  const filteredBreakdowns = allBreakdowns.filter(b => {
    const d = new Date(b.tanggal);
    return d.getMonth() + 1 === currentMonth + 1 && d.getFullYear() === currentYear;
  });
  const modal = filteredBreakdowns.reduce((sum, b) => sum + Number(b.nilai), 0);

  const persenM = totalSaldo > 0 ? Math.min(100, (modal / totalSaldo) * 100) : 0;
  const bagiHasil = 0.05 * modal * 0.95;

  console.log('=== Verifikasi Profit Sharing ===');
  console.log('totalSaldo:', totalSaldo.toLocaleString('id-ID'));
  console.log('modal:', modal.toLocaleString('id-ID'));
  console.log('persenM:', persenM.toFixed(6), '%');
  console.log('bagiHasil:', bagiHasil.toLocaleString('id-ID'));

  // ── CASH FLOW H S I ─────────────────────────────────────────────────
  const cf = allInvestors.find(i => i.nama?.includes('CASH FLOW'));
  const cfSaldo = saldoMap.get(cf?.id) ?? 0;
  const cfPersen = totalSaldo > 0 ? (cfSaldo / totalSaldo) * 100 : 0;
  const cfBagiHasil = (cfPersen / 100) * bagiHasil;

  console.log('\nCASH FLOW H S I:');
  console.log('  saldo      :', cfSaldo.toLocaleString('id-ID'));
  console.log('  persen     :', cfPersen.toFixed(6), '%');
  console.log('  bagi_hasil :', Math.round(cfBagiHasil).toLocaleString('id-ID'));

  // ── Dana Terpakai + (sama formula dengan Dana Terpakai -) ────────────
  const cfDanaTerpakai = cfSaldo * (persenM / 100);
  console.log('\n  dana_terpakai+:', Math.round(cfDanaTerpakai).toLocaleString('id-ID'));
  console.log('  dana_terpakai- (investments page):', '57.433.775');

  // ── Top 5 investors by bagi_hasil ───────────────────────────────────
  console.log('\n=== Top 5 Profit Sharing ===');
  const results = allInvestors
    .filter(i => i.kode)
    .map(i => {
      const s = saldoMap.get(i.id) ?? 0;
      const p = totalSaldo > 0 ? (s / totalSaldo) * 100 : 0;
      const bh = (p / 100) * bagiHasil;
      return { nama: i.nama, saldo: s, persen: p, bagi_hasil: bh };
    })
    .sort((a, b) => b.bagi_hasil - a.bagi_hasil)
    .slice(0, 5);

  results.forEach(r => console.log(
    ' ', (r.nama || '').padEnd(25),
    'saldo:', r.saldo.toLocaleString('id-ID').padStart(20),
    '| bagi_hasil:', Math.round(r.bagi_hasil).toLocaleString('id-ID').padStart(15)
  ));

} catch(e) {
  console.error('ERROR:', e);
} finally {
  await p.$disconnect();
}
