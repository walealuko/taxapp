import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency } from '../constants/tax';

interface TaxResult {
  taxType: string;
  [key: string]: any;
}

interface ExportOptions {
  title: string;
  results: TaxResult[];
  includeDetails?: boolean;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const generateHTMLTable = (results: TaxResult[]): string => {
  if (results.length === 0) return '<p>No calculations to display.</p>';

  return `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Tax Type</th>
          <th>Key Details</th>
          <th>Tax Amount</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(r => {
          const date = r.createdAt ? new Date(r.createdAt) : new Date();
          let details = '';
          let taxAmount = '';

          switch (r.taxType) {
            case 'paye':
              details = `Income: ${formatCurrency(r.annualIncome || r.grossIncome)}`;
              if (r.expenses > 0) details += `<br/>Expenses: ${formatCurrency(r.expenses)}`;
              taxAmount = formatCurrency(r.annualTax);
              break;
            case 'vat':
              details = `Revenue: ${formatCurrency(r.revenue)} (${(r.vatRate * 100).toFixed(1)}%)`;
              taxAmount = formatCurrency(r.vatAmount);
              break;
            case 'wht':
              details = `${capitalize(r.category)} @ ${(r.whtRate * 100).toFixed(0)}%`;
              taxAmount = formatCurrency(r.withholdingTax);
              break;
            case 'cgt':
              details = `Gain: ${formatCurrency(r.chargeableGain)}`;
              taxAmount = formatCurrency(r.capitalGainsTax);
              break;
            default:
              details = 'N/A';
              taxAmount = 'N/A';
          }

          return `
            <tr>
              <td>${formatDate(date)}</td>
              <td>${capitalize(r.taxType)}</td>
              <td>${details}</td>
              <td><strong>${taxAmount}</strong></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
};

const generatePDFHTML = (options: ExportOptions): string => {
  const totalTax = options.results.reduce((sum, r) => {
    switch (r.taxType) {
      case 'paye': return sum + Number(r.annualTax || 0);
      case 'vat': return sum + Number(r.vatAmount || 0);
      case 'wht': return sum + Number(r.withholdingTax || 0);
      case 'cgt': return sum + Number(r.capitalGainsTax || 0);
      default: return sum;
    }
  }, 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${options.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #2D3436; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6C63FF; padding-bottom: 20px; }
        .header h1 { color: #6C63FF; font-size: 24px; margin-bottom: 8px; }
        .header p { color: #9E9E9E; font-size: 14px; }
        .summary { background: #F8F9FE; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
        .summary h2 { font-size: 16px; margin-bottom: 12px; color: #6C63FF; }
        .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E8E8E8; }
        .summary-item:last-child { border-bottom: none; font-weight: bold; font-size: 18px; color: #4CAF50; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #6C63FF; color: white; padding: 12px 8px; text-align: left; font-size: 13px; }
        td { padding: 12px 8px; border-bottom: 1px solid #E8E8E8; font-size: 13px; }
        tr:nth-child(even) { background: #F8F9FE; }
        .footer { margin-top: 30px; text-align: center; color: #9E9E9E; font-size: 12px; }
        .footer p { margin-top: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${options.title}</h1>
        <p>Generated on ${formatDate(new Date())}</p>
      </div>
      ${generateHTMLTable(options.results)}
      <div class="footer">
        <p>TaxApp Nigeria - Calculate Nigerian taxes with confidence</p>
        <p>This document is for informational purposes only and should not be considered tax advice.</p>
      </div>
    </body>
    </html>
  `;
};

const generateCSV = (results: TaxResult[]): string => {
  const headers = ['Date', 'Tax Type', 'Tax Amount', 'Details'];
  const rows = results.map(r => {
    const date = r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '';
    let details = '';
    let taxAmount = '';

    switch (r.taxType) {
      case 'paye':
        details = `Annual Income: ${r.annualIncome || r.grossIncome}, Expenses: ${r.expenses || 0}`;
        taxAmount = r.annualTax?.toString() || '0';
        break;
      case 'vat':
        details = `Revenue: ${r.revenue}, Rate: ${(r.vatRate * 100).toFixed(1)}%`;
        taxAmount = r.vatAmount?.toString() || '0';
        break;
      case 'wht':
        details = `Category: ${r.category}, Gross: ${r.grossAmount}`;
        taxAmount = r.withholdingTax?.toString() || '0';
        break;
      case 'cgt':
        details = `Proceeds: ${r.disposalProceeds}, Cost Base: ${r.costBase}`;
        taxAmount = r.capitalGainsTax?.toString() || '0';
        break;
      default:
        details = '';
        taxAmount = '0';
    }

    return [date, r.taxType?.toUpperCase(), taxAmount, details.replace(/,/g, ';')];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const exportToPDF = async (options: ExportOptions): Promise<void> => {
  try {
    const html = generatePDFHTML(options);
    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: options.title,
        UTI: 'com.adobe.pdf',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};

export const exportToCSV = async (options: ExportOptions): Promise<void> => {
  try {
    const csv = generateCSV(options);
    const uri = `${options.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`, {
        mimeType: 'text/csv',
        dialogTitle: options.title,
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('CSV export error:', error);
    throw error;
  }
};

export const canExport = async (): Promise<boolean> => {
  return await Sharing.isAvailableAsync();
};
