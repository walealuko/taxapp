import * as Sentry from '@sentry/react-native';
import { ExceptionsInitiator } from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let sentryInitialized = false;

export function initSentry() {
  if (sentryInitialized || !SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: __DEV__ === false,
    environment: process.env.EXPO_PUBLIC_ENV || 'development',
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    // Error sampling
    sampleRate: 1.0,
    // Auto-instrument React Native
    integrations: [
      new Sentry.ReactNativeTracing({
        // Capture navigation as spans
        navigation: { enabled: true },
        // Capture HTTP requests
        fetch: { enabled: true },
        // Capture XMLHttpRequests
        xhr: { enabled: true },
      }),
    ],
    // Before capture hooks
    beforeSend: (event) => {
      // Remove any PII or sensitive data
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
    // Maximum breadcrumbs to capture
    maxBreadcrumbs: 50,
  });

  sentryInitialized = true;
}

// Helper to capture errors manually
export function captureError(error: Error, context?: Record<string, any>) {
  if (sentryInitialized) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach((key) => {
          scope.setExtra(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  }
}

// Helper to capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (sentryInitialized) {
    Sentry.captureMessage(message, level);
  }
}

// Wrapper for async operations with error tracking
export async function withErrorTracking<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (sentryInitialized && error instanceof Error) {
      captureError(error, { operationName });
    }
    throw error;
  }
}

export { Sentry };