(function () {
  "use strict";

  const app = globalThis.SideWorkFinder;

  try {
    if (!app?.data || !app?.diagnosis || !app?.ui) {
      throw new Error("必要なJavaScriptファイルを読み込めませんでした。");
    }

    app.ui.createQuizApp({
      data: app.data,
      diagnosis: app.diagnosis,
    });
    app.ui.initializeRevealAnimations();
  } catch (error) {
    if (app?.ui?.showInitializationError) {
      app.ui.showInitializationError(error);
    } else {
      console.error(error);
    }
  }
})();
