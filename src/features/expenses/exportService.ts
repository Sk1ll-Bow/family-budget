import { db } from '../../core/db';
import { format, startOfDay, endOfDay } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as xlsx from 'xlsx';

export type ExportFormat = 'excel' | 'pdf';

export async function exportExpenses(
  familyId: string, 
  startDate?: string, 
  endDate?: string, 
  formatType: ExportFormat = 'excel'
) {
  let query = db.expenses.where('familyId').equals(familyId);
  let expenses = await query.toArray();

  if (startDate && endDate) {
    // Ensure we cover the full range of the selected days (startOfDay to endOfDay)
    const start = startOfDay(new Date(startDate)).toISOString();
    const end = endOfDay(new Date(endDate)).toISOString();
    expenses = expenses.filter(e => e.spentAt >= start && e.spentAt <= end);
  }

  // Sort descending by date
  expenses.sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime());

  // Fetch relations
  const categories = await db.categories.where('familyId').equals(familyId).toArray();
  const stores = await db.stores.where('familyId').equals(familyId).toArray();
  const accounts = await db.accounts.where('familyId').equals(familyId).toArray();

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const storeMap = new Map(stores.map(s => [s.id, s.name]));
  const accountMap = new Map(accounts.map(a => [a.id, a.name]));

  const data = expenses.map(e => ({
    date: format(new Date(e.spentAt), 'yyyy-MM-dd HH:mm'),
    description: e.description || 'No description',
    category: categoryMap.get(e.categoryId || '') || 'Uncategorized',
    store: storeMap.get(e.storeId || '') || '-',
    account: accountMap.get(e.accountId || '') || 'Unknown',
    amount: Number(e.amount).toFixed(2),
  }));

  if (formatType === 'excel') {
    generateEXCEL(data);
  } else {
    await generatePDF(data, startDate, endDate);
  }
}

function generateEXCEL(data: any[]) {
  const worksheet = xlsx.utils.json_to_sheet(data.map(row => ({
    'Date': row.date,
    'Description': row.description,
    'Category': row.category,
    'Store': row.store,
    'Account': row.account,
    'Amount': Number(row.amount)
  })));

  // Auto-size columns to fit content
  const wscols = [
    {wch: 18}, // date
    {wch: 30}, // desc
    {wch: 15}, // category
    {wch: 15}, // store
    {wch: 12}, // account
    {wch: 10}  // amount
  ];
  worksheet['!cols'] = wscols;

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Expenses");
  
  xlsx.writeFile(workbook, `export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function generatePDF(data: any[], startDate?: string, endDate?: string) {
  const doc = new jsPDF();
  
  try {
    const fontBytes = await fetch('/Roboto-Regular.ttf').then(res => res.arrayBuffer());
    const fontBase64 = arrayBufferToBase64(fontBytes);
    doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
  } catch (error) {
    console.warn('Could not load custom Cyrillic font for PDF. Falling back to default.', error);
  }
  
  doc.setFontSize(16);
  doc.text('Expense Export', 14, 15);
  
  doc.setFontSize(10);
  if (startDate && endDate) {
    doc.text(`Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`, 14, 22);
  } else {
    doc.text('Period: All Time', 14, 22);
  }

  const tableData = data.map(row => [
    row.date,
    row.description,
    row.category,
    row.store,
    row.account,
    row.amount + ' \u20AC'
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['Date', 'Description', 'Category', 'Store', 'Account', 'Amount']],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 8, font: 'Roboto' },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`export_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
}
