import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency } from '../constants/tax';

export interface PayrollEmployee {
  name: string;
  tin: string;
  grossAnnual: number;
  taxableIncome: number;
  taxDue: number;
}

export const generateRemittanceSchedulePDF = async (
  employerName: string,
  month: string,
  year: string,
  employees: PayrollEmployee[]
) => {
  const totalRemittance = employees.reduce((acc, emp) => acc + emp.taxDue, 0);

  const html = `
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 4px solid #0f172a; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 10px; }
          .title { font-size: 20px; font-weight: bold; color: #334155; text-transform: uppercase; }
          .meta-info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
          .meta-item { text-align: left; }
          .label { color: #64748b; font-weight: 500; }
          .value { color: #0f172a; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f8fafc; color: #475569; text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-size: 13px; }
          td { padding: 12px; border: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; }
          .total-row { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
          .total-label { text-align: right; padding-right: 12px; font-size: 16px; }
          .total-value { font-size: 18px; color: #2563eb; font-weight: 800; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🇳🇬 TAXAPP PAYROLL</div>
          <div class="title">PAYE Remittance Schedule</div>
        </div>

        <div class="meta-info">
          <div class="meta-item">
            <span class="label">Employer: </span> <span class="value">${employerName}</span>
          </div>
          <div class="meta-item">
            <span class="label">Period: </span> <span class="value">${month} ${year}</span>
          </div>
          <div class="meta-item">
            <span class="label">Date Generated: </span> <span class="value">${new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>TIN</th>
              <th>Gross Annual</th>
              <th>Taxable Income</th>
              <th>Tax Due</th>
            </tr>
          </thead>
          <tbody>
            ${employees.map(emp => `
              <tr>
                <td>${emp.name}</td>
                <td>${emp.tin}</td>
                <td>${formatCurrency(emp.grossAnnual)}</td>
                <td>${formatCurrency(emp.taxableIncome)}</td>
                <td>${formatCurrency(emp.taxDue)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4" class="total-label">Grand Total Remittance:</td>
              <td class="total-value">${formatCurrency(totalRemittance)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          This is a computer-generated document. The tax calculations are based on the 2026 PITA brackets.<br/>
          Generated via TaxApp Nigeria Payroll Management System.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  } catch (err: any) {
    throw new Error('PDF Generation failed: ' + err.message);
  }
};
