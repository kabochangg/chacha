(function (globalScope) {
  "use strict";

  const config = globalScope.SideWorkFinderConfig || {};
  const siteUrl = String(config.siteUrl || "").replace(/\/$/, "");
  const canonicalUrl = siteUrl
    ? `${siteUrl}${globalScope.location.pathname}`
    : globalScope.location.href.split(/[?#]/)[0];
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = canonicalUrl;
  let openGraphUrl = document.querySelector('meta[property="og:url"]');
  if (!openGraphUrl) {
    openGraphUrl = document.createElement("meta");
    openGraphUrl.setAttribute("property", "og:url");
    document.head.append(openGraphUrl);
  }
  openGraphUrl.content = canonicalUrl;

  if (config.adsensePublisherId) {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
      config.adsensePublisherId,
    )}`;
    document.head.append(script);
  }

  if (config.cloudflareAnalyticsToken) {
    const beacon = document.createElement("script");
    beacon.defer = true;
    beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
    beacon.dataset.cfBeacon = JSON.stringify({ token: config.cloudflareAnalyticsToken });
    document.head.append(beacon);
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
