import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';
import { StandardInput } from '../../components/ui/StandardInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../../constants/tax';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export default function VatInvoiceGenerator() {
  const colors = useThemeColors();
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', description: '', quantity: '1', unitPrice: '' }]);
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: '1', unitPrice: '' }]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice.replace(/,/g, '')) || 0;
      subtotal += qty * price;
    });

    const vat = subtotal * 0.075;
    const total = subtotal + vat;

    return { subtotal, vat, total };
  };

  const handleExportPDF = async () => {
    if (!clientName) {
      Alert.alert('Missing Client', 'Please enter the client name for the invoice');
      return;
    }

    setLoading(true);
    const { subtotal, vat, total } = calculateTotals();

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0F172A; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #0F172A; }
            .invoice-title { font-size: 20px; color: #666; }
            .client-info { margin-bottom: 30px; }
            .client-label { font-size: 12px; color: #999; text-transform: uppercase; }
            .client-name { font-size: 18px; font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #F8FAFC; text-align: left; padding: 12px; border-bottom: 2px solid #E2E8F0; font-size: 14px; }
            td { padding: 12px; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
            .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
            .total-row { display: flex; justify-content: flex-end; gap: 20px; font-size: 14px; }
            .total-label { color: #666; }
            .total-value { font-weight: 600; }
            .grand-total { font-size: 18px; font-weight: bold; color: #0F172A; border-top: 2px solid #E2E8F0; padding-top: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">NRS TAX APP</div>
            <div class="invoice-title">TAX INVOICE</div>
          </div>
          <div class="client-info">
            <div class="client-label">Bill To:</div>
            <div class="client-name">${clientName}</div>
            <div style="font-size: 12px; color: #666;">Date: ${new Date().toLocaleDateString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unitPrice.replace(/,/g, '')) || 0;
                return `
                  <tr>
                    <td>${item.description || 'No description'}</td>
                    <td>${qty}</td>
                    <td>${formatCurrency(price)}</td>
                    <td>${formatCurrency(qty * price)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="total-row">
              <span class="total-label">Subtotal:</span>
              <span class="total-value">${formatCurrency(subtotal)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">VAT (7.5%):</span>
              <span class="total-value">${formatCurrency(vat)}</span>
            </div>
            <div class="total-row grand-total">
              <span class="total-label">Total Amount:</span>
              <span class="total-value">${formatCurrency(total)}</span>
            </div>
          </div>
          <div class="footer">
            This is a digitally generated VAT invoice. Please ensure all details are correct.
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (uri) {
        await Sharing.shareAsync(uri);
      }
    } catch (err: any) {
      Alert.alert('Export Failed', 'Could not generate invoice PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <AppCard title="Client Details" variant="default">
          <StandardInput
            label="Client Name / Business"
            icon="account-outline"
            value={clientName}
            onChangeText={setClientName}
            placeholder="e.g. ABC Logistics Ltd"
          />
        </AppCard>

        <AppCard title="Invoice Items" variant="default">
          {items.map((item, index) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 2, marginRight: 8 }}>
                <StandardInput
                  label="Description"
                  value={item.description}
                  onChangeText={(v) => updateItem(item.id, 'description', v)}
                  placeholder="e.g. Consulting Services"
                />
              </View>
              <View style={{ flex: 0.5, marginRight: 8 }}>
                <StandardInput
                  label="Qty"
                  value={item.quantity}
                  onChangeText={(v) => updateItem(item.id, 'quantity', v)}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <StandardInput
                  label="Price"
                  value={item.unitPrice}
                  onChangeText={(v) => updateItem(item.id, 'unitPrice', v)}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => removeItem(item.id)}
              >
                <MaterialCommunityIcons name="delete" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addItem}>
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={[styles.addBtnText, { color: '#fff' }]}>Add Item</Text>
          </TouchableOpacity>
        </AppCard>

        <AppCard title="Total Calculation" variant="default" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(calculateTotals().subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>VAT (7.5%)</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(calculateTotals().vat)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.outline }]}>
            <Text style={[styles.summaryLabelHighlight, { color: colors.text, fontWeight: 'bold' }]}>Total Invoice Value</Text>
            <Text style={[styles.summaryValueHighlight, { color: colors.primary }]}>{formatCurrency(calculateTotals().total)}</Text>
          </View>
        </AppCard>

        <TouchableOpacity
          style={[styles.exportBtn, { backgroundColor: colors.primary }]}
          onPress={handleExportPDF}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={[styles.exportBtnText, { color: '#fff' }]}>Generate & Export Invoice</Text>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#fff" />
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 60 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16, gap: 8 },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  addBtnText: { fontWeight: '600', fontSize: 14 },
  summaryCard: { marginTop: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  summaryLabelHighlight: { fontSize: 16 },
  summaryValueHighlight: { fontSize: 18, fontWeight: 'bold' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginTop: 24,
    gap: 12,
  },
  exportBtnText: { fontSize: 16, fontWeight: 'bold' },
});
