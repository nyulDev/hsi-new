import { PrismaClient } from '../src/generated/prisma/index.js';
const p = new PrismaClient();

try {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (5 = June)
  const monthNum = 6; // June

  // ── Modal cara investments page: filter breakdowns by month+year ────
  const allBreakdowns = await p.breakdown.findMany({
    select: { tanggal: true, nilai: true, keterangan: true },
  });

  const filteredBreakdowns = allBreakdowns.filter(d => {
    const date = new Date(d.tanggal);
    return date.getMonth() + 1 === monthNum && date.getFullYear() === 2026;
  });
  const modalPage = filteredBreakdowns.reduce((sum, b) => sum + Number(b.nilai), 0);
  console.log('=== SUMMARY ===');
  console.log('Modal cara investments page (filter month+year):', modalPage.toLocaleString('id-ID'));
  console.log('Jumlah breakdown yang terfilter:', filteredBreakdowns.length);

  // ── Modal cara process-debet: prisma aggregate gte/lte ─────────────
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth   = new Date(currentYear, currentMonth + 1, 0);
  console.log('\nstartOfMonth (process-debet):', startOfMonth.toISOString());
  console.log('endOfMonth (process-debet):  ', endOfMonth.toISOString());

  const modalAgg = await p.breakdown.aggregate({
    where: { tanggal: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { nilai: true },
  });
  const modalDebet = modalAgg._sum?.nilai ? Number(modalAgg._sum.nilai) : 0;
  console.log('Modal cara process-debet (aggregate):', modalDebet.toLocaleString('id-ID'));

  // ── Find breakdowns that are IN investments page but NOT in process-debet ──
  const inPageNotDebet = filteredBreakdowns.filter(b => {
    const d = new Date(b.tanggal);
    return d < startOfMonth || d > endOfMonth;
  });
  console.log('\nBreakdowns yang ada di investments page tapi TIDAK di process-debet:', inPageNotDebet.length);
  inPageNotDebet.forEach(b => console.log(
    ' ', new Date(b.tanggal).toISOString(), Number(b.nilai).toLocaleString('id-ID'), '|', b.keterangan
  ));

  // ── Find breakdowns in process-debet but NOT in investments page ───
  const debetBreakdowns = allBreakdowns.filter(b => {
    const d = new Date(b.tanggal);
    return d >= startOfMonth && d <= endOfMonth;
  });
  const inDebetNotPage = debetBreakdowns.filter(b => {
    const d = new Date(b.tanggal);
    return !(d.getMonth() + 1 === monthNum && d.getFullYear() === 2026);
  });
  console.log('\nBreakdowns yang ada di process-debet tapi TIDAK di investments page:', inDebetNotPage.length);
  inDebetNotPage.forEach(b => console.log(
    ' ', new Date(b.tanggal).toISOString(), Number(b.nilai).toLocaleString('id-ID'), '|', b.keterangan
  ));

  console.log('\nSelisih modal:', (modalPage - modalDebet).toLocaleString('id-ID'));

  // ── Show earliest breakdown dates in investments page filter ──
  const sorted = [...filteredBreakdowns].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  console.log('\nBreakdown paling awal (investments page filter):', sorted[0]?.tanggal?.toISOString(), Number(sorted[0]?.nilai || 0).toLocaleString('id-ID'));
  console.log('Breakdown paling akhir (investments page filter):', sorted[sorted.length-1]?.tanggal?.toISOString(), Number(sorted[sorted.length-1]?.nilai || 0).toLocaleString('id-ID'));

} catch(e) {
  console.error('ERROR:', e);
} finally {
  await p.$disconnect();
}
