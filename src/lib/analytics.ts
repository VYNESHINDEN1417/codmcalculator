const SUPABASE_URL = "https://bmeddjzihcvraqmhkxen.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Y5Vkz3pQPuihk6qXt2w2bA_BOPEJJpm";
const TRACKING_ENDPOINT = `${SUPABASE_URL}/functions/v1/track-codm-calculator`;

type AnalyticsEvent = "calculate" | "weapon_select" | "music_toggle" | "share";

function getId(storage: Storage, key: string): string {
  try {
    let value = storage.getItem(key);
    if (!value) {
      value = crypto.randomUUID();
      storage.setItem(key, value);
    }
    return value;
  } catch {
    return crypto.randomUUID();
  }
}

function getIdentity() {
  return {
    visitor_id: getId(localStorage, "codm_analytics_visitor"),
    session_id: getId(sessionStorage, "codm_analytics_session"),
  };
}

function send(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ ...getIdentity(), ...payload });
  void fetch(TRACKING_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt the calculator.
  });
}

export function trackCalculatorVisit() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    const refHost = referrer ? new URL(referrer).hostname.toLowerCase() : "";
    const searchEngines: Record<string, string> = {
      "google.com": "Google",
      "www.google.com": "Google",
      "bing.com": "Bing",
      "www.bing.com": "Bing",
      "search.yahoo.com": "Yahoo",
      "duckduckgo.com": "DuckDuckGo",
    };
    const searchEngine = Object.entries(searchEngines).find(([host]) =>
      refHost === host || refHost.endsWith(`.${host}`),
    )?.[1] ?? null;
    const socialHosts = ["facebook.com", "m.facebook.com", "l.facebook.com", "t.co", "x.com", "twitter.com", "reddit.com", "instagram.com", "messenger.com"];
    const trafficSource = searchEngine
      ? "search"
      : socialHosts.some((host) => refHost === host || refHost.endsWith(`.${host}`))
        ? "social"
        : refHost
          ? "referral"
          : "direct";
    const ua = navigator.userAgent;
    const deviceType = /ipad|tablet|kindle|silk/i.test(ua)
      ? "tablet"
      : /mobi|android|iphone|ipod/i.test(ua)
        ? "mobile"
        : "desktop";

    send({
      kind: "visit",
      page_path: window.location.pathname,
      referrer: referrer || null,
      traffic_source: trafficSource,
      search_engine: searchEngine,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      device_type: deviceType,
      user_agent: ua,
    });
  } catch {
    // Ignore browser privacy/storage restrictions.
  }
}

export function trackCalculatorEvent(eventName: AnalyticsEvent, options?: { weapon?: string }) {
  send({
    kind: "event",
    event_name: eventName,
    weapon: options?.weapon,
  });
}
