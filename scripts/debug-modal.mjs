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

  // investments page: filter by month === 6 AND year === targetYear
  const filteredBreakdowns = allBreakdowns.filter(d => {
    const date = new Date(d.tanggal);
    return date.getMonth() + 1 === monthNum && date.getFullYear() === 2026;
  });
  const modalPage = filteredBreakdowns.reduce((sum, b) => sum + Number(b.nilai), 0);
  console.log('=== Modal cara investments page (filter month+year) ===');
  console.log('Count:', filteredBreakdowns.length);
  filteredBreakdowns.forEach(b => console.log(
    ' ', new Date(b.tanggal).toISOString().split('T')[0],
    Number(b.nilai).toLocaleString('id-ID'),
    '|', b.keterangan
  ));
  console.log('Total Modal (investments page):', modalPage.toLocaleString('id-ID'));

  // ── Modal cara process-debet: prisma aggregate gte/lte ─────────────
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth   = new Date(currentYear, currentMonth + 1, 0);
  console.log('\n=== Modal cara process-debet (aggregate gte/lte) ===');
  console.log('startOfMonth:', startOfMonth.toISOString());
  console.log('endOfMonth:  ', endOfMonth.toISOString());

  const modalAgg = await p.breakdown.aggregate({
    where: { tanggal: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { nilai: true },
  });
  const modalDebet = modalAgg._sum?.nilai ? Number(modalAgg._sum.nilai) : 0;
  console.log('Total Modal (process-debet):', modalDebet.toLocaleString('id-ID'));

  // ── Show ALL breakdowns to understand difference ───────────────────
  console.log('\n=== SEMUA Breakdowns ===');
  allBreakdowns.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  allBreakdowns.forEach(b => console.log(
    ' ', new Date(b.tanggal).toISOString().split('T')[0],
    '(local:', new Date(b.tanggal).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}), ')',
    Number(b.nilai).toLocaleString('id-ID').padStart(25),
    '|', b.keterangan
  ));

  console.log('\nTotal breakdowns:', allBreakdowns.length);
  console.log('Total modal semua:', allBreakdowns.reduce((s, b) => s + Number(b.nilai), 0).toLocaleString('id-ID'));

} catch(e) {
  console.error('ERROR:', e);
} finally {
  await p.$disconnect();
}
