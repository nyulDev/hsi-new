import { PrismaClient } from '../src/generated/prisma/index.js';
const p = new PrismaClient();

try {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (5 = June)

  console.log('=== Current Date:', currentDate.toISOString(), '===');
  console.log('currentYear:', currentYear, '| currentMonth (0-idx):', currentMonth, '\n');

  // ── Simulate investments page getData("6") exactly ─────────────────
  const monthNum = 6; // June

  // Step 1: Find targetYear using latestTransactionInMonth
  const latestTransactionInMonth = await p.mutasiRecord.findFirst({
    where: {
      admin2_status: 'APPROVE',
      tanggal: {
        gte: new Date(currentYear - 2, monthNum - 1, 1),
        lte: new Date(currentYear, monthNum, 0, 23, 59, 59),
      },
    },
    orderBy: { tanggal: 'desc' },
    select: { tanggal: true },
  });

  const latestBreakdownInMonth = await p.breakdown.findFirst({
    where: {
      tanggal: {
        gte: new Date(currentYear - 2, monthNum - 1, 1),
        lte: new Date(currentYear, monthNum, 0, 23, 59, 59),
      },
    },
    orderBy: { tanggal: 'desc' },
    select: { tanggal: true },
  });

  console.log('latestTransactionInMonth:', latestTransactionInMonth?.tanggal?.toISOString());
  console.log('latestBreakdownInMonth:', latestBreakdownInMonth?.tanggal?.toISOString());

  let targetYear = currentYear;
  if (latestTransactionInMonth && latestBreakdownInMonth) {
    targetYear = latestTransactionInMonth.tanggal > latestBreakdownInMonth.tanggal
      ? latestTransactionInMonth.tanggal.getFullYear()
      : latestBreakdownInMonth.tanggal.getFullYear();
  } else if (latestTransactionInMonth) {
    targetYear = latestTransactionInMonth.tanggal.getFullYear();
  } else if (latestBreakdownInMonth) {
    targetYear = latestBreakdownInMonth.tanggal.getFullYear();
  }

  console.log('targetYear:', targetYear);

  const startDate = new Date(targetYear, monthNum - 1, 1, 0, 0, 0);
  const endDate   = new Date(targetYear, monthNum - 1, 8, 23, 59, 59);
  console.log('\nstartDate:', startDate.toISOString());
  console.log('endDate:  ', endDate.toISOString());

  // Step 2: Get all transactions in 1-8 of target month
  const allTransactions = await p.mutasiRecord.findMany({
    where: {
      admin2_status: 'APPROVE',
      tanggal: { gte: startDate, lte: endDate },
    },
    orderBy: [{ tanggal: 'asc' }, { id: 'asc' }],
    select: { investorId: true, saldo_akhir: true, tanggal: true },
  });

  console.log('\nTotal transactions in 1-8 range:', allTransactions.length);

  const transactionsByInvestor = new Map();
  for (const tx of allTransactions) {
    transactionsByInvestor.set(tx.investorId, Number(tx.saldo_akhir));
  }

  // Step 3: Get ALL investors
  const investors = await p.investor.findMany({
    select: { id: true, kode: true, nama: true },
  });

  // Step 4: Compute totalSaldo (ALL investors, no kode filter)
  let totalSaldo = 0;
  const saldoMap = new Map();
  for (const inv of investors) {
    const lastTx = transactionsByInvestor.get(inv.id);
    const saldo = lastTx ?? 0;
    saldoMap.set(inv.id, saldo);
    totalSaldo += saldo;
  }
  console.log('totalSaldo:', totalSaldo.toLocaleString('id-ID'));

  // Step 5: Modal - investments page uses current month for "all"/"current" case
  // For specific month="6", it uses targetYear's June breakdowns
  const allBreakdowns = await p.breakdown.findMany({ select: { tanggal: true, nilai: true } });
  const filteredBreakdowns = allBreakdowns.filter(d => {
    const date = new Date(d.tanggal);
    return date.getMonth() + 1 === monthNum && date.getFullYear() === targetYear;
  });
  const modalValue = filteredBreakdowns.reduce((sum, b) => sum + Number(b.nilai), 0);
  console.log('modal:', modalValue.toLocaleString('id-ID'));

  // Step 6: persenM
  const persenM = totalSaldo > 0 ? Math.min(100, (modalValue / totalSaldo) * 100) : 0;
  console.log('persenM:', persenM.toFixed(6), '%');

  // Step 7: Calculate dana_terpakai for CASH FLOW H S I
  const cfInvestor = investors.find(i => i.nama?.includes('CASH FLOW'));
  console.log('\nCASH FLOW H S I id:', cfInvestor?.id);

  const cfSaldo = saldoMap.get(cfInvestor?.id) ?? 0;
  const cfDanaTerpakai = cfSaldo * (persenM / 100);

  console.log('CF saldo (investments page):', cfSaldo.toLocaleString('id-ID'));
  console.log('CF dana_terpakai (investments page):', Math.round(cfDanaTerpakai).toLocaleString('id-ID'));

  // Show transactions for CF in 1-8
  console.log('\nCF transactions in 1-8:');
  allTransactions
    .filter(t => t.investorId === cfInvestor?.id)
    .forEach(t => console.log(' ', t.tanggal.toISOString(), Number(t.saldo_akhir).toLocaleString('id-ID')));

  // ── Now check: investments page shows 57.433.775 — where does it come from? ──
  // What saldo would produce 57.433.775 with this persenM?
  const impliedSaldo = 57433775 / (persenM / 100);
  console.log('\n=== Reverse Engineering 57.433.775 ===');
  console.log('Saldo yang dibutuhkan untuk menghasilkan 57.433.775:', Math.round(impliedSaldo).toLocaleString('id-ID'));

  // Check all approved transactions for CF (without date filter) to find a saldo matching impliedSaldo
  const cfAllTx = await p.mutasiRecord.findMany({
    where: { investorId: cfInvestor?.id, admin2_status: 'APPROVE' },
    orderBy: [{ tanggal: 'asc' }, { id: 'asc' }],
    select: { tanggal: true, mutasi: true, nilai_mutasi: true, saldo_akhir: true, keterangan: true },
  });
  console.log('\nSemua transaksi APPROVE CF (asc):');
  cfAllTx.forEach(t => console.log(
    ' ', t.tanggal.toISOString().split('T')[0],
    t.mutasi.padEnd(6),
    Number(t.nilai_mutasi).toLocaleString('id-ID').padStart(20),
    '| saldo:', Number(t.saldo_akhir).toLocaleString('id-ID').padStart(20),
    '|', t.keterangan
  ));

} catch(e) {
  console.error('ERROR:', e);
} finally {
  await p.$disconnect();
}
