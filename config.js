(function (globalScope) {
  "use strict";

  globalScope.SideWorkFinderConfig = Object.freeze({
    // 独自ドメイン取得後に末尾の / を付けずに設定してください。
    siteUrl: "",

    // AdSense承認前でも、申請時に発行されたca-pub-から始まるIDを設定します。
    adsensePublisherId: "",
    adsenseResultSlotId: "",

    // Cloudflare Turnstileの公開サイトキーです。
    turnstileSiteKey: "",

    // Cloudflare Web Analyticsのトークンです。
    cloudflareAnalyticsToken: "",

    operatorName: "副業タイプ診断 編集部",
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
