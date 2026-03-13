import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

let initialized = false;

export function initMixpanel() {
  if (!MIXPANEL_TOKEN || initialized) return;
  mixpanel.init(MIXPANEL_TOKEN, {
    track_pageview: false,
    persistence: "localStorage",
  });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!MIXPANEL_TOKEN || !initialized) return;
  mixpanel.track(event, properties);
}
