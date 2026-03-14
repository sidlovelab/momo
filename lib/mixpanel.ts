import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

let initialized = false;

function ensureInit() {
  if (!MIXPANEL_TOKEN || initialized) return false;
  mixpanel.init(MIXPANEL_TOKEN, {
    track_pageview: false,
    persistence: "localStorage",
  });
  initialized = true;
  return true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!MIXPANEL_TOKEN) return;
  ensureInit();
  mixpanel.track(event, properties);
}
