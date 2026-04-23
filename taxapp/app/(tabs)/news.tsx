import React from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface NewsItem {
  id: string;
  title: string;
  body: string;
  date: string;
  category: 'PAYE Update' | 'VAT Change' | 'Deadline' | 'fIRS Announcement';
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'New PAYE Thresholds for 2024',
    body: 'The Federal Inland Revenue Service (fIRS) has announced updated personal income tax brackets effective January 2024. The minimum tax-free threshold has been increased to ₦300,000 annually, with progressive rates ranging from 7% to 24%. Taxpayers are advised to update their records accordingly.',
    date: '2024-03-15',
    category: 'PAYE Update',
  },
  {
    id: '2',
    title: 'VAT Rate Increased to 7.5%',
    body: 'Following the VAT (Amendment) Act 2022, the standard VAT rate in Nigeria has increased from 5% to 7.5%. This change applies to all taxable supplies of goods and services unless specifically exempted or zero-rated. Businesses must ensure their invoicing systems are updated.',
    date: '2024-02-28',
    category: 'VAT Change',
  },
  {
    id: '3',
    title: 'Q1 2024 Tax Filing Deadline Extended',
    body: 'The fIRS has extended the deadline for Q1 2024 tax filings by two weeks to April 30, 2024. This extension applies to all PAYE, VAT, and Withholding Tax filings. Taxpayers who require additional time should submit a formal application for an extension before the original deadline.',
    date: '2024-03-01',
    category: 'Deadline',
  },
  {
    id: '4',
    title: 'fIRS Launches New e-Filing Portal',
    body: 'The Federal Inland Revenue Service has launched an upgraded e-filing portal with enhanced features for faster processing of tax returns. The new portal includes automated PAYE calculations, real-time VAT updates, and improved WHT certificate generation. Taxpayers are encouraged to register and begin using the portal immediately.',
    date: '2024-01-20',
    category: 'fIRS Announcement',
  },
];

const getCategoryColor = (category: NewsItem['category'], isDark: boolean): string => {
  switch (category) {
    case 'PAYE Update':
      return '#FF6B6B';
    case 'VAT Change':
      return '#4CAF50';
    case 'Deadline':
      return '#FFB74D';
    case 'fIRS Announcement':
      return '#6C63FF';
    default:
      return '#9E9E9E';
  }
};

const getCategoryBgColor = (category: NewsItem['category'], isDark: boolean): string => {
  switch (category) {
    case 'PAYE Update':
      return isDark ? '#3D2020' : '#FFF5F5';
    case 'VAT Change':
      return isDark ? '#1D3D20' : '#F0FFF4';
    case 'Deadline':
      return isDark ? '#3D3515' : '#FFF8E1';
    case 'fIRS Announcement':
      return isDark ? '#2D2A4A' : '#F0F0FF';
    default:
      return isDark ? '#2D2A4A' : '#F5F5F5';
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
};

const NewsCard: React.FC<{ item: NewsItem; colors: ReturnType<typeof useThemeColors> }> = ({ item, colors }) => {
  const categoryColor = getCategoryColor(item.category, colors.isDark);
  const categoryBg = getCategoryBgColor(item.category, colors.isDark);

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryBg }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>{item.category}</Text>
        </View>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(item.date)}</Text>
      </View>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{item.body}</Text>
    </View>
  );
};

export default function NewsScreen() {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={styles.headerTitle}>Tax News & Updates</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Stay informed with the latest Nigerian tax updates
        </Text>
      </View>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MOCK_NEWS.map((item) => (
          <NewsCard key={item.id} item={item} colors={colors} />
        ))}
        <View style={[styles.footerInfo, { backgroundColor: colors.infoCardBg }]}>
          <Text style={styles.footerInfoEmoji}>ℹ️</Text>
          <Text style={[styles.footerInfoText, { color: colors.text }]}>
            Always verify tax information with official fIRS sources or consult a tax professional.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  footerInfoEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  footerInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});