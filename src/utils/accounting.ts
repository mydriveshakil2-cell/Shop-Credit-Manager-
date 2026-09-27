import { Transaction, MonthSummary } from '../types';

/**
 * Calculates month-wise statements with carry-forward opening balance.
 * A customer's closing balance from the previous month MUST automatically
 * carry forward as the OPENING BALANCE for the next month.
 */
export function calculateCustomerAccounting(
  transactions: Transaction[],
  selectedMonthYear?: string // e.g. "2026-09"
): {
  allMonths: MonthSummary[];
  currentStatement: MonthSummary;
  totalLifetimeCredit: number;
  totalLifetimePaid: number;
  totalNetDue: number;
} {
  // Sort transactions chronologically
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  // Identify all unique months in the transaction dataset plus current calendar month
  const today = new Date();
  const currentCalMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const monthsSet = new Set<string>();
  monthsSet.add(currentCalMonth);
  sorted.forEach((t) => {
    if (t.monthYear) monthsSet.add(t.monthYear);
    else if (t.date) monthsSet.add(t.date.slice(0, 7));
  });

  const sortedMonths = Array.from(monthsSet).sort();

  let accumulatedBalance = 0;
  const allMonths: MonthSummary[] = [];

  for (const my of sortedMonths) {
    const openingBalance = accumulatedBalance;
    const monthTxs = sorted.filter((t) => (t.monthYear || t.date.slice(0, 7)) === my);

    const creditAmount = monthTxs
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const paidAmount = monthTxs
      .filter((t) => t.type === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);

    const closingBalance = openingBalance + creditAmount - paidAmount;
    accumulatedBalance = closingBalance; // carries forward to next month

    const [year, month] = my.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    allMonths.push({
      monthYear: my,
      monthName,
      openingBalance,
      creditAmount,
      paidAmount,
      closingBalance,
      transactions: monthTxs,
    });
  }

  // Find the selected month statement or the latest
  const targetMY = selectedMonthYear || currentCalMonth;
  let currentStatement = allMonths.find((m) => m.monthYear === targetMY);

  if (!currentStatement) {
    if (allMonths.length > 0) {
      currentStatement = allMonths[allMonths.length - 1];
    } else {
      currentStatement = {
        monthYear: currentCalMonth,
        monthName: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        openingBalance: 0,
        creditAmount: 0,
        paidAmount: 0,
        closingBalance: 0,
        transactions: [],
      };
    }
  }

  const totalLifetimeCredit = sorted
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLifetimePaid = sorted
    .filter((t) => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalNetDue = totalLifetimeCredit - totalLifetimePaid;

  return {
    allMonths,
    currentStatement,
    totalLifetimeCredit,
    totalLifetimePaid,
    totalNetDue,
  };
}
