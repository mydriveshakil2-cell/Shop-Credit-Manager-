import jsPDF from 'jspdf';
import { Customer, Shop, Transaction, MonthSummary } from '../types';
import { APP_PUBLIC_URL, formatAED } from './uaeValidation';

/**
 * Directly shares a generated jsPDF document using device's default Web Share API
 * (Opens native WhatsApp, AirDrop, Messages, Drive, Gmail, or system share sheet).
 */
export async function sharePdfFile(
  doc: jsPDF,
  filename: string,
  title: string,
  text: string
): Promise<boolean> {
  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

  // Check if Web Share API with files is supported
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title,
        text,
      });
      return true;
    } catch (err: any) {
      // User cancelled share dialog
      if (err.name === 'AbortError') return true;
    }
  }

  // Fallback: If device doesn't support file sharing via Web Share (e.g. desktop chrome),
  // open the PDF in new tab and download
  try {
    const fileUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(fileUrl), 5000);
    return true;
  } catch {
    doc.save(filename);
    return true;
  }
}

/**
 * Generates & directly shares individual customer month-wise statement
 */
export async function shareCustomerPdfStatement(
  shop: Shop,
  customer: Customer,
  statement: MonthSummary
): Promise<void> {
  const currency = shop?.currency || 'AED';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth ? doc.internal.pageSize.getWidth() : doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.getHeight ? doc.internal.pageSize.getHeight() : doc.internal.pageSize.height;
  const margin = 14;

  // Header Banner (Rich Emerald: #0C4A42)
  doc.setFillColor(12, 74, 66);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent line
  doc.setFillColor(52, 211, 153);
  doc.rect(0, 41, pageWidth, 1.5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('SHOP CREDIT MASTER', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text('UAE Smart Khata & Customer Credit Management System', margin, 24);

  // Statement Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('MONTHLY STATEMENT', pageWidth - margin, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(209, 250, 229);
  doc.text(`Period: ${statement.monthName}`, pageWidth - margin, 25, { align: 'right' });
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, 31, { align: 'right' });

  // Shop & Customer Info Cards
  const infoCardY = 48;
  const colWidth = (pageWidth - margin * 2 - 8) / 2;

  // Shop Info Box
  doc.setFillColor(244, 248, 246);
  doc.setDrawColor(220, 235, 228);
  doc.roundedRect(margin, infoCardY, colWidth, 38, 2, 2, 'FD');

  doc.setTextColor(12, 74, 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SHOP DETAILS', margin + 4, infoCardY + 7);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(shop.shopName, margin + 4, infoCardY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Shop ID: ${shop.shopId}`, margin + 4, infoCardY + 18);
  doc.text(`Owner: ${shop.ownerName}`, margin + 4, infoCardY + 23);
  doc.text(`Mobile: ${shop.phone}`, margin + 4, infoCardY + 28);
  const truncatedAddr = shop.address.length > 40 ? shop.address.slice(0, 38) + '...' : shop.address;
  doc.text(`Address: ${truncatedAddr}`, margin + 4, infoCardY + 33);

  // Customer Info Box
  const custX = margin + colWidth + 8;
  doc.setFillColor(244, 248, 246);
  doc.setDrawColor(220, 235, 228);
  doc.roundedRect(custX, infoCardY, colWidth, 38, 2, 2, 'FD');

  doc.setTextColor(12, 74, 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CUSTOMER / BUYER DETAILS', custX + 4, infoCardY + 7);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(customer.name, custX + 4, infoCardY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Customer ID: ${customer.customerId}`, custX + 4, infoCardY + 18);
  doc.text(`Emirates ID: ${customer.emiratesIdNumber}`, custX + 4, infoCardY + 23);
  doc.text(`Mobile: ${customer.phone}`, custX + 4, infoCardY + 28);
  doc.text(`Credit Limit: ${currency} ${customer.creditLimit.toLocaleString()}`, custX + 4, infoCardY + 33);

  // Summary Metrics Tiles
  const metricY = 92;
  const tileWidth = (pageWidth - margin * 2 - 9) / 4;

  const metrics = [
    { label: 'Opening Balance', value: statement.openingBalance, color: [248, 250, 252], textColor: [71, 85, 105], note: 'Carried forward' },
    { label: 'Total Credit (+)', value: statement.creditAmount, color: [254, 242, 242], textColor: [220, 38, 38], note: 'Current month' },
    { label: 'Total Received (-)', value: statement.paidAmount, color: [240, 253, 244], textColor: [22, 101, 52], note: 'Settled amount' },
    { label: 'Net Due Balance', value: statement.closingBalance, color: [236, 253, 245], textColor: [12, 74, 66], note: 'Current total due' },
  ];

  metrics.forEach((m, idx) => {
    const x = margin + idx * (tileWidth + 3);
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, metricY, tileWidth, 23, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 3, metricY + 5.5);

    doc.setFontSize(10);
    doc.setTextColor(m.textColor[0], m.textColor[1], m.textColor[2]);
    doc.text(`${currency} ${m.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, x + 3, metricY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(m.note, x + 3, metricY + 19);
  });

  // Transactions Table
  let tableY = 122;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(12, 74, 66);
  doc.text('STATEMENT TRANSACTIONS', margin, tableY);

  tableY += 4;
  doc.setFillColor(12, 74, 66);
  doc.rect(margin, tableY, pageWidth - margin * 2, 7, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE', margin + 3, tableY + 5);
  doc.text('TYPE', margin + 28, tableY + 5);
  doc.text('DESCRIPTION / NOTE', margin + 55, tableY + 5);
  doc.text('CREDIT (+)', margin + 115, tableY + 5, { align: 'right' });
  doc.text('RECEIVED (-)', margin + 145, tableY + 5, { align: 'right' });
  doc.text('RUNNING DUE', pageWidth - margin - 3, tableY + 5, { align: 'right' });

  tableY += 7;
  let runningDue = statement.openingBalance;

  // Opening Balance Row
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, tableY, pageWidth - margin * 2, 6, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('01/' + (statement.monthYear ? statement.monthYear.slice(5) : '01') + '/' + (statement.monthYear ? statement.monthYear.slice(0, 4) : '2026'), margin + 3, tableY + 4.2);
  doc.text('B/F', margin + 28, tableY + 4.2);
  doc.text('Opening Balance Carried Forward', margin + 55, tableY + 4.2);
  doc.text('-', margin + 115, tableY + 4.2, { align: 'right' });
  doc.text('-', margin + 145, tableY + 4.2, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(
    `${currency} ${runningDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - margin - 3,
    tableY + 4.2,
    { align: 'right' }
  );

  tableY += 6;

  if (statement.transactions.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, tableY, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No additional credit or payment records in this period.', margin + 3, tableY + 4.8);
    tableY += 7;
  } else {
    statement.transactions.forEach((tx, i) => {
      if (tx.type === 'CREDIT') {
        runningDue += tx.amount;
      } else {
        runningDue -= tx.amount;
      }

      const isEven = i % 2 === 0;
      doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 252, isEven ? 255 : 250);
      doc.rect(margin, tableY, pageWidth - margin * 2, 6.5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(tx.date, margin + 3, tableY + 4.5);

      if (tx.type === 'CREDIT') {
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
        doc.text('Credit Due', margin + 28, tableY + 4.5);
      } else {
        doc.setTextColor(21, 128, 61);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Recv', margin + 28, tableY + 4.5);
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const noteTxt = (tx.note || (tx.type === 'CREDIT' ? 'Store Credit' : 'Payment received')).slice(0, 36);
      doc.text(noteTxt, margin + 55, tableY + 4.5);

      if (tx.type === 'CREDIT') {
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
        doc.text(tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }), margin + 115, tableY + 4.5, { align: 'right' });
        doc.setTextColor(148, 163, 184);
        doc.text('-', margin + 145, tableY + 4.5, { align: 'right' });
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text('-', margin + 115, tableY + 4.5, { align: 'right' });
        doc.setTextColor(21, 128, 61);
        doc.setFont('helvetica', 'bold');
        doc.text(tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }), margin + 145, tableY + 4.5, { align: 'right' });
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(
        runningDue.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        pageWidth - margin - 3,
        tableY + 4.5,
        { align: 'right' }
      );

      tableY += 6.5;

      if (tableY > pageHeight - 35) {
        doc.addPage();
        tableY = 20;
      }
    });
  }

  tableY += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, tableY, pageWidth - margin, tableY);
  tableY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(12, 74, 66);
  doc.text('Total Month Net Closing Due:', margin + 60, tableY);
  doc.setFontSize(10);
  doc.text(
    `${currency} ${statement.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - margin - 3,
    tableY,
    { align: 'right' }
  );

  // Mandatory Footer
  const footerY = pageHeight - 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(12, 74, 66);
  doc.text('Thanks for using Shop Credit Master app', pageWidth / 2, footerY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`App link: ${APP_PUBLIC_URL}`, pageWidth / 2, footerY + 4.5, { align: 'center' });

  // Direct Share via Device Default Share Sheet
  const safeCustomerName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Statement_${shop.shopId}_${safeCustomerName}_${statement.monthYear}.pdf`;
  await sharePdfFile(
    doc,
    filename,
    `Monthly Statement - ${customer.name}`,
    `Shop Credit Master Statement for ${customer.name} (${statement.monthName})`
  );
}

/**
 * Generates & directly shares FULL SHOP comprehensive master report with month & date filtering
 */
export async function shareShopFullReportPdf(
  shop: Shop,
  customers: Customer[],
  transactions: Transaction[],
  filterInfo: {
    monthYear?: string;
    monthName?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<void> {
  const currency = shop?.currency || 'AED';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth ? doc.internal.pageSize.getWidth() : doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.getHeight ? doc.internal.pageSize.getHeight() : doc.internal.pageSize.height;
  const margin = 14;

  // Header Banner
  doc.setFillColor(12, 74, 66);
  doc.rect(0, 0, pageWidth, 42, 'F');
  doc.setFillColor(52, 211, 153);
  doc.rect(0, 41, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SHOP CREDIT MASTER', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text(`Comprehensive Shop Financial Report • ${shop.shopName} (${shop.shopId})`, margin, 24);

  // Period label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('SHOP MASTER REPORT', pageWidth - margin, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);

  let periodStr = 'All Time / Complete History';
  if (filterInfo.startDate && filterInfo.endDate) {
    periodStr = `${filterInfo.startDate} to ${filterInfo.endDate}`;
  } else if (filterInfo.monthName) {
    periodStr = filterInfo.monthName;
  }
  doc.text(`Period: ${periodStr}`, pageWidth - margin, 25, { align: 'right' });
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, 31, { align: 'right' });

  // Filter transactions
  let filteredTxs = [...transactions];
  if (filterInfo.startDate && filterInfo.endDate) {
    filteredTxs = filteredTxs.filter((t) => t.date >= filterInfo.startDate! && t.date <= filterInfo.endDate!);
  } else if (filterInfo.monthYear && filterInfo.monthYear !== 'all') {
    filteredTxs = filteredTxs.filter((t) => (t.monthYear || t.date.slice(0, 7)) === filterInfo.monthYear);
  }

  const totalCredits = filteredTxs.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const totalPaid = filteredTxs.filter((t) => t.type === 'PAYMENT').reduce((s, t) => s + t.amount, 0);
  const netDue = totalCredits - totalPaid;

  // Shop Details Card
  let curY = 48;
  doc.setFillColor(244, 248, 246);
  doc.setDrawColor(220, 235, 228);
  doc.roundedRect(margin, curY, pageWidth - margin * 2, 26, 2, 2, 'FD');

  doc.setTextColor(12, 74, 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SHOP CREDENTIALS & LOCATION', margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Owner: ${shop.ownerName} | Mobile: ${shop.phone} | Fixed Currency: ${currency}`, margin + 4, curY + 12);
  const truncAddr = shop.address.length > 75 ? shop.address.slice(0, 72) + '...' : shop.address;
  doc.text(`Address: ${truncAddr}`, margin + 4, curY + 17);
  doc.text(`Registered Customers: ${customers.length} | Filtered Transactions: ${filteredTxs.length}`, margin + 4, curY + 22);

  curY += 30;

  // 4 Financial Summary Tiles
  const tileWidth = (pageWidth - margin * 2 - 9) / 4;
  const metrics = [
    { label: 'REGISTERED CUSTOMERS', val: `${customers.length} Buyers`, color: [248, 250, 252], textColor: [71, 85, 105] },
    { label: 'PERIOD CREDIT ISSUED', val: `${currency} ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: [254, 242, 242], textColor: [220, 38, 38] },
    { label: 'PERIOD RECEIVED', val: `${currency} ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: [240, 253, 244], textColor: [22, 101, 52] },
    { label: 'NET PERIOD DUE', val: `${currency} ${netDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: [236, 253, 245], textColor: [12, 74, 66] },
  ];

  metrics.forEach((m, idx) => {
    const x = margin + idx * (tileWidth + 3);
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, curY, tileWidth, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 3, curY + 6);

    doc.setFontSize(9.5);
    doc.setTextColor(m.textColor[0], m.textColor[1], m.textColor[2]);
    doc.text(m.val, x + 3, curY + 14);
  });

  curY += 26;

  // Customer Balances Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(12, 74, 66);
  doc.text('CUSTOMER ACCOUNT SUMMARY', margin, curY);
  curY += 4;

  doc.setFillColor(12, 74, 66);
  doc.rect(margin, curY, pageWidth - margin * 2, 6.5, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('CUSTOMER NAME', margin + 3, curY + 4.5);
  doc.text('ID & MOBILE', margin + 55, curY + 4.5);
  doc.text('CREDIT LIMIT', margin + 105, curY + 4.5, { align: 'right' });
  doc.text('CREDIT (+)', margin + 135, curY + 4.5, { align: 'right' });
  doc.text('PAID (-)', margin + 160, curY + 4.5, { align: 'right' });
  doc.text('NET DUE', pageWidth - margin - 3, curY + 4.5, { align: 'right' });
  curY += 6.5;

  if (customers.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, curY, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No customers enrolled yet.', margin + 3, curY + 4.5);
    curY += 6.5;
  } else {
    customers.forEach((c, idx) => {
      const cTxs = filteredTxs.filter((t) => t.customerId === c.customerId);
      const cCredit = cTxs.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
      const cPaid = cTxs.filter((t) => t.type === 'PAYMENT').reduce((s, t) => s + t.amount, 0);
      const cNet = cCredit - cPaid;

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 252, isEven ? 255 : 250);
      doc.rect(margin, curY, pageWidth - margin * 2, 6, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(c.name.slice(0, 30), margin + 3, curY + 4.2);
      doc.setTextColor(100, 116, 139);
      doc.text(`${c.customerId} • ${c.phone}`, margin + 55, curY + 4.2);

      doc.text(c.creditLimit.toLocaleString(), margin + 105, curY + 4.2, { align: 'right' });
      doc.setTextColor(185, 28, 28);
      doc.text(cCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }), margin + 135, curY + 4.2, { align: 'right' });
      doc.setTextColor(21, 128, 61);
      doc.text(cPaid.toLocaleString(undefined, { minimumFractionDigits: 2 }), margin + 160, curY + 4.2, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(cNet.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - margin - 3, curY + 4.2, { align: 'right' });
      curY += 6;

      if (curY > pageHeight - 35) {
        doc.addPage();
        curY = 20;
      }
    });
  }

  curY += 8;
  if (curY > pageHeight - 45) {
    doc.addPage();
    curY = 20;
  }

  // Transactions Itemized Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(12, 74, 66);
  doc.text(`FILTERED TRANSACTIONS LEDGER (${filteredTxs.length})`, margin, curY);
  curY += 4;

  doc.setFillColor(12, 74, 66);
  doc.rect(margin, curY, pageWidth - margin * 2, 6.5, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('DATE', margin + 3, curY + 4.5);
  doc.text('CUSTOMER', margin + 28, curY + 4.5);
  doc.text('TYPE', margin + 68, curY + 4.5);
  doc.text('NOTE', margin + 95, curY + 4.5);
  doc.text('AMOUNT', pageWidth - margin - 3, curY + 4.5, { align: 'right' });
  curY += 6.5;

  if (filteredTxs.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, curY, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No transactions in this period.', margin + 3, curY + 4.5);
  } else {
    filteredTxs.slice(0, 35).forEach((tx, i) => {
      const cust = customers.find((c) => c.customerId === tx.customerId);
      const isEven = i % 2 === 0;
      doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 252, isEven ? 255 : 250);
      doc.rect(margin, curY, pageWidth - margin * 2, 5.8, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(51, 65, 85);
      doc.text(tx.date, margin + 3, curY + 4);
      doc.text((cust?.name || tx.customerId).slice(0, 24), margin + 28, curY + 4);

      if (tx.type === 'CREDIT') {
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
        doc.text('Credit Due', margin + 68, curY + 4);
      } else {
        doc.setTextColor(21, 128, 61);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Recv', margin + 68, curY + 4);
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text((tx.note || '-').slice(0, 32), margin + 95, curY + 4);

      doc.setFont('helvetica', 'bold');
      if (tx.type === 'CREDIT') {
        doc.setTextColor(185, 28, 28);
        doc.text(`+${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, curY + 4, { align: 'right' });
      } else {
        doc.setTextColor(21, 128, 61);
        doc.text(`-${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, curY + 4, { align: 'right' });
      }
      curY += 5.8;

      if (curY > pageHeight - 35) {
        doc.addPage();
        curY = 20;
      }
    });
  }

  // Mandatory Footer
  const footerY = pageHeight - 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(12, 74, 66);
  doc.text('Thanks for using Shop Credit Master app', pageWidth / 2, footerY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`App link: ${APP_PUBLIC_URL}`, pageWidth / 2, footerY + 4.5, { align: 'center' });

  // Direct Share via Device Default Share Sheet
  const safeShopName = shop.shopName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ShopReport_${shop.shopId}_${safeShopName}.pdf`;
  await sharePdfFile(
    doc,
    filename,
    `Shop Full Report - ${shop.shopName}`,
    `Comprehensive financial & khata report for ${shop.shopName} (${shop.shopId})`
  );
}
