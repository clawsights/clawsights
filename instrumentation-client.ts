import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://6760ca18a5942921fec63f02cfb34be7@o4510892600459264.ingest.us.sentry.io/4510892602490880",

  integrations: [
    Sentry.replayIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],

  tracesSampleRate: 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
