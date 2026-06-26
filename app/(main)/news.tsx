import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TYPOGRAPHY } from '@/constants/typography';
import { AppCard } from '@/components/ui/AppCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    body: 'The Nigerian Revenue Service (NRS) has announced updated personal income tax brackets effective January 2024. The minimum tax-free threshold has been increased to ₦300,000 annually, with progressive rates ranging from 7% to 24%. Taxpayers are advised to update their records accordingly.',
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
    body: 'The NRS has extended the deadline for Q1 2024 tax filings by two weeks to April 30, 2024. This extension applies to all PAYE, VAT, and Withholding Tax filings. Taxpayers who require additional time should submit a formal application for an extension before the original deadline.',
    date: '2024-03-01',
    category: 'Deadline',
  },
  {
    id: '4',
    title: 'NRS Launches New e-Filing Portal',
    body: 'The Nigerian Revenue Service has launched an upgraded e-filing portal with enhanced features for faster processing of tax returns. The new portal includes automated PAYE calculations, real-time VAT updates, and improved WHT certificate generation. Taxpayers are encouraged to register and begin using the portal immediately.',
    date: '2024-01-20',
    category: 'fIRS Announcement',
  },
];

const getCategoryColor = (category: NewsItem['category'], isDark: boolean): string => {
  switch (category) {
    case 'PAYE Update': return '#FF6B6B';
    case 'VAT Change': return '#4CAF50';
    case 'Deadline': return '#FFB74D';
    case 'fIRS Announcement': return '#6C63FF';
    default: return '#9E9E9E';
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
};

const NewsCard: React.FC<{ item: NewsItem; colors: ReturnType<typeof useThemeColors> }> = ({ item, colors }) => {
  const categoryColor = getCategoryColor(item.category, colors.isDark);

  return (
    <AppCard variant="default">
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="tag-outline" size={12} color={categoryColor} />
          <Text style={[styles.categoryText, { color: categoryColor }]}>{item.category}</Text>
        </View>
        <Text style={[styles.dateText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
          {formatDate(item.date)}
        </Text>
      </View>
      <Text style={[styles.cardTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>{item.title}</Text>
      <Text style={[styles.cardBody, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>{item.body}</Text>
    </AppCard>
  );
};

export default function NewsScreen() {
  const colors = useThemeColors();
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async () => {
    try {
      // Store-only architecture: Use local news source
      setNews(MOCK_NEWS);
    } catch {
      // Fallback already handled by state initialization
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Tax News & Laws</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
          Stay informed with the latest Nigerian tax updates
        </Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {news.map((item) => (
            <NewsCard key={item.id} item={item} colors={colors} />
          ))}
          <AppCard variant="variant" style={styles.footerCard}>
            <View style={styles.footerInfo}>
              <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
              <Text style={[styles.footerInfoText, { color: colors.text, ...TYPOGRAPHY.body }]}>
                Always verify tax information with official NRS sources or consult a certified tax professional.
              </Text>
            </View>
          </AppCard>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'left',
  },
  headerSubtitle: {
    marginTop: 4,
  },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 13,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardBody: {
    lineHeight: 20,
  },
  footerCard: {
    marginTop: 16,
    marginBottom: 24,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerInfoText: {
    flex: 1,
    lineHeight: 18,
  },
});
