import React, { ReactNode } from 'react';
import { ScrollView, View, Dimensions, StyleSheet } from 'react-native';

interface HorizontalCardScrollerProps {
  children: ReactNode;
  /** Card width in pixels. Defaults to 70% of screen width (peek effect). */
  cardWidth?: number;
  /** Space between cards in pixels. Default 12. */
  gap?: number;
  /** Right padding so the last card peeks from the right edge. Default 16. */
  rightPadding?: number;
}

/**
 * Reusable horizontal scroller for a small set of cards (3-8 items).
 * Renders a horizontal ScrollView with peeking cards. Use when the list
 * is small enough that virtualization isn't needed.
 *
 * Cards align flush-left with their parent (the parent controls left padding).
 * Subsequent cards peek on the right to signal scrollability.
 */
export default function HorizontalCardScroller({
  children,
  cardWidth,
  gap = 12,
  rightPadding = 16,
}: HorizontalCardScrollerProps) {
  const screenW = Dimensions.get('window').width;
  const width = cardWidth ?? Math.round(screenW * 0.7);

  const items = React.Children.toArray(children);
  const lastIndex = items.length - 1;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="normal"
      contentContainerStyle={styles.contentContainer}
      style={{ paddingRight: rightPadding }}
    >
      {items.map((child, i) => (
        <View
          key={i}
          style={[styles.cardWrapper, { width, marginRight: i === lastIndex ? 0 : gap }]}
        >
          {child}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'stretch',
  },
  cardWrapper: {
    // width is set inline per instance
  },
});