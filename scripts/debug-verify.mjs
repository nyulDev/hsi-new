import { PrismaClient } from '../src/generated/prisma/index.js';
const p = new PrismaClient();

try {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (5 = June)

  console.log('=== Verifikasi Final ===');
  console.log('Date:', currentDate.toISOString());

  // Saldo: June 1-8 APPROVE (sama persis investments page)
  const startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0);
  const endDate   = new Date(currentYear, currentMonth, 8, 23, 59, 59);

  const allTransactions = await p.mutasiRecord.findMany({
    where: {
      admin2_status: 'APPROVE',
      tanggal: { gte: startDate, lte: endDate },
    },
    orderBy: [{ tanggal: 'asc' }, { id: 'asc' }],
    select: { investorId: true, saldo_akhir: true },
  });

  const byInvestor = new Map();
  for (const tx of allTransactions) {
    byInvestor.set(tx.investorId, Number(tx.saldo_akhir));
  }

  const allInvestors = await p.investor.findMany({ select: { id: true, kode: true, nama: true } });

  let totalSaldo = 0;
  const saldoMap = new Map();
  for (const inv of allInvestors) {
    const saldo = byInvestor.get(inv.id) ?? 0;
    saldoMap.set(inv.id, saldo);
    totalSaldo += saldo;
  }

  // Modal: filter JS month+year (FIXED)
  const allBreakdowns = await p.breakdown.findMany({ select: { tanggal: true, nilai: true } });
  const filteredBreakdowns = allBreakdowns.filter(b => {
    const d = new Date(b.tanggal);
    return d.getMonth() + 1 === currentMonth + 1 && d.getFullYear() === currentYear;
  });
  const modal = filteredBreakdowns.reduce((sum, b) => sum + Number(b.nilai), 0);

  const persenM = totalSaldo > 0 ? Math.min(100, (modal / totalSaldo) * 100) : 0;

  console.log('totalSaldo:', totalSaldo.toLocaleString('id-ID'));
  console.log('modal (JS filter):', modal.toLocaleString('id-ID'));
  console.log('persenM:', persenM.toFixed(6), '%');

  // CASH FLOW H S I
  const cf = allInvestors.find(i => i.nama?.includes('CASH FLOW'));
  const cfSaldo = saldoMap.get(cf?.id) ?? 0;
  const cfDanaTerpakai = cfSaldo * (persenM / 100);

  console.log('\nCASH FLOW H S I:');
  console.log('  saldo:', cfSaldo.toLocaleString('id-ID'));
  console.log('  dana_terpakai (FIXED route):', Math.round(cfDanaTerpakai).toLocaleString('id-ID'));
  console.log('  dana_terpakai (investments page shows):', '57.433.775');
  console.log('  MATCH?', Math.round(cfDanaTerpakai) === 57433775 ? '✅ YA' : '❌ TIDAK - selisih: ' + Math.abs(Math.round(cfDanaTerpakai) - 57433775).toLocaleString('id-ID'));

} catch(e) {
  console.error('ERROR:', e);
} finally {
  await p.$disconnect();
}
