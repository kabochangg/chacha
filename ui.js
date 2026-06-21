(function (globalScope) {
  "use strict";

  const REQUIRED_ELEMENTS = {
    quizForm: "#quiz-form",
    questionTitle: "#question-title",
    choiceGrid: "#choice-grid",
    questionCount: "#question-count",
    questionTotal: "#question-total",
    progress: "#quiz-progress",
    progressBar: "#progress-bar",
    prevButton: "#prev-button",
    nextButton: "#next-button",
    resultPanel: "#result-panel",
    resultTitle: "#result-title",
    resultBadge: "#result-badge",
    resultSummary: "#result-summary",
    affiliateSection: "#affiliate-section",
    affiliateOffers: "#affiliate-offers",
    resultReasons: "#result-reasons",
    resultCautions: "#result-cautions",
    resultSteps: "#result-steps",
    resultLinks: "#result-links",
    adsenseSection: "#adsense-section",
    adsenseResultSlot: "#adsense-result-slot",
    shareButton: "#share-button",
    restartButton: "#restart-button",
    errorMessage: "#app-error",
  };

  function getRequiredElements(documentObject) {
    return Object.fromEntries(
      Object.entries(REQUIRED_ELEMENTS).map(([name, selector]) => {
        const element = documentObject.querySelector(selector);
        if (!element) {
          throw new Error(`画面の初期化に必要な要素「${selector}」が見つかりません。`);
        }
        return [name, element];
      }),
    );
  }

  function replaceChildrenWithTextItems(element, items) {
    element.replaceChildren(
      ...items.map((item) => {
        const node = document.createElement("li");
        node.textContent = item;
        return node;
      }),
    );
  }

  function getActiveAffiliateOffers(offers) {
    return (offers || [])
      .filter((offer) => offer.enabled === true && /^https:\/\//.test(offer.url || ""))
      .slice(0, 3);
  }

  function createQuizApp({ data, diagnosis, documentObject = document, windowObject = window }) {
    diagnosis.validateData(data);
    const elements = getRequiredElements(documentObject);
    const state = diagnosis.createQuizState(data.questions.length);
    let currentResultType = null;
    elements.questionTotal.textContent = `${data.questions.length}問`;

    function updateButtons() {
      elements.prevButton.disabled = state.isFirst;
      elements.nextButton.disabled = !state.currentAnswer;
      elements.nextButton.textContent = state.isLast ? "結果を見る" : "次へ";
    }

    function focusHeading(element) {
      element.focus({ preventScroll: true });
    }

    function renderQuestion({ moveFocus = false } = {}) {
      const index = state.currentIndex;
      const question = data.questions[index];
      const progressValue = ((index + 1) / data.questions.length) * 100;

      elements.questionTitle.textContent = question.title;
      elements.questionCount.textContent = `${index + 1} / ${data.questions.length}`;
      elements.progressBar.style.width = `${progressValue}%`;
      elements.progress.setAttribute("aria-valuenow", String(index + 1));
      elements.progress.setAttribute("aria-valuemax", String(data.questions.length));
      elements.progress.setAttribute("aria-valuetext", `${data.questions.length}問中${index + 1}問目`);

      const choices = question.choices.map((choice, choiceIndex) => {
        const id = `q${index}-choice${choiceIndex}`;
        const label = documentObject.createElement("label");
        const input = documentObject.createElement("input");
        const text = documentObject.createElement("span");

        label.className = "choice";
        label.htmlFor = id;
        input.type = "radio";
        input.id = id;
        input.name = `answer-${index}`;
        input.value = choice.type;
        input.checked = state.currentAnswer === choice.type;
        input.addEventListener("change", () => {
          state.answer(choice.type);
          updateButtons();
        });
        text.textContent = choice.label;
        label.append(input, text);
        return label;
      });

      elements.choiceGrid.replaceChildren(...choices);
      updateButtons();
      if (moveFocus) focusHeading(elements.questionTitle);
    }

    function renderResult() {
      const type = diagnosis.getResultType(state.answers, data.TYPES, data.tieBreakOrder);
      const result = data.results[type];
      currentResultType = type;

      elements.resultTitle.textContent = result.title;
      elements.resultBadge.textContent = result.badge;
      elements.resultSummary.textContent = result.summary;
      renderAffiliateOffers(result.affiliateOffers || [], type);
      replaceChildrenWithTextItems(elements.resultReasons, result.reasons);
      replaceChildrenWithTextItems(elements.resultCautions, result.cautions);
      replaceChildrenWithTextItems(elements.resultSteps, result.steps);

      const links = result.links.map((link) => {
        const anchor = documentObject.createElement("a");
        anchor.href = link.url;
        anchor.textContent = link.label;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        return anchor;
      });
      elements.resultLinks.replaceChildren(...links);
      renderAdsenseSlot();

      elements.quizForm.classList.add("hidden");
      elements.resultPanel.classList.remove("hidden");
      elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      focusHeading(elements.resultTitle);
      trackEvent("diagnosis_complete", { resultType: type });
    }

    function trackEvent(eventName, details = {}) {
      const payload = JSON.stringify({
        eventName,
        path: windowObject.location.pathname,
        ...details,
      });

      if (windowObject.navigator?.sendBeacon) {
        windowObject.navigator.sendBeacon(
          "/api/event",
          new Blob([payload], { type: "application/json" }),
        );
        return;
      }

      windowObject.fetch?.("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }

    function renderAffiliateOffers(offers, resultType) {
      const activeOffers = getActiveAffiliateOffers(offers);

      if (activeOffers.length === 0) {
        elements.affiliateOffers.replaceChildren();
        elements.affiliateSection.classList.add("hidden");
        return;
      }

      const cards = activeOffers.slice(0, 3).map((offer) => {
        const article = documentObject.createElement("article");
        article.className = "affiliate-card";

        const label = documentObject.createElement("span");
        label.className = "pr-label";
        label.textContent = "PR";

        const title = documentObject.createElement("h4");
        title.textContent = offer.name;

        const description = documentObject.createElement("p");
        description.textContent = offer.description;

        const anchor = documentObject.createElement("a");
        anchor.className = "button primary affiliate-cta";
        anchor.href = offer.url;
        anchor.textContent = offer.cta || "公式サイトを見る";
        anchor.target = "_blank";
        anchor.rel = "sponsored noopener noreferrer";
        anchor.dataset.offerId = offer.id;
        anchor.dataset.network = offer.network || "unknown";
        anchor.addEventListener("click", () => {
          trackEvent("affiliate_click", {
            resultType,
            offerId: offer.id,
            network: offer.network || "unknown",
          });
        });

        article.append(label, title, description, anchor);
        return article;
      });

      elements.affiliateOffers.replaceChildren(...cards);
      elements.affiliateSection.classList.remove("hidden");
    }

    function renderAdsenseSlot() {
      const config = windowObject.SideWorkFinderConfig || {};
      if (!config.adsensePublisherId || !config.adsenseResultSlotId) {
        elements.adsenseResultSlot.replaceChildren();
        elements.adsenseSection.classList.add("hidden");
        return;
      }

      const ad = documentObject.createElement("ins");
      ad.className = "adsbygoogle";
      ad.style.display = "block";
      ad.dataset.adClient = config.adsensePublisherId;
      ad.dataset.adSlot = config.adsenseResultSlotId;
      ad.dataset.adFormat = "auto";
      ad.dataset.fullWidthResponsive = "true";
      elements.adsenseResultSlot.replaceChildren(ad);
      elements.adsenseSection.classList.remove("hidden");

      try {
        (windowObject.adsbygoogle = windowObject.adsbygoogle || []).push({});
      } catch (error) {
        console.warn("AdSense広告枠を初期化できませんでした。", error);
      }
    }

    elements.quizForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!state.currentAnswer) return;
      if (state.isLast) {
        renderResult();
      } else if (state.next()) {
        if (state.currentIndex === 1) trackEvent("diagnosis_start");
        renderQuestion({ moveFocus: true });
      }
    });

    elements.prevButton.addEventListener("click", () => {
      if (state.previous()) renderQuestion({ moveFocus: true });
    });

    elements.shareButton.addEventListener("click", () => {
      const text = `私は「${elements.resultTitle.textContent}」でした。3分でわかる副業タイプ診断`;
      const shareUrl = new URL("https://twitter.com/intent/tweet");
      shareUrl.searchParams.set("text", text);
      shareUrl.searchParams.set("url", windowObject.location.href.split("#")[0]);
      trackEvent("result_share", { resultType: currentResultType });
      windowObject.open(shareUrl, "_blank", "noopener,noreferrer");
    });

    elements.restartButton.addEventListener("click", () => {
      state.reset();
      elements.resultPanel.classList.add("hidden");
      elements.quizForm.classList.remove("hidden");
      renderQuestion();
      elements.quizForm.scrollIntoView({ behavior: "smooth", block: "start" });
      focusHeading(elements.questionTitle);
    });

    renderQuestion();
    return { state, renderQuestion, renderResult };
  }

  function showInitializationError(error, documentObject = document) {
    console.error(error);
    const errorMessage = documentObject.querySelector("#app-error");
    if (errorMessage) {
      errorMessage.textContent = `診断を開始できませんでした。設定を確認してください。（${error.message}）`;
      errorMessage.hidden = false;
    }
  }

  function initializeRevealAnimations(documentObject = document, windowObject = window) {
    const targets = documentObject.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in windowObject)) {
      targets.forEach((element) => element.classList.add("visible"));
      return;
    }

    const observer = new windowObject.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );
    targets.forEach((element) => observer.observe(element));
  }

  globalScope.SideWorkFinder = {
    ...globalScope.SideWorkFinder,
    ui: {
      createQuizApp,
      getActiveAffiliateOffers,
      initializeRevealAnimations,
      showInitializationError,
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      createQuizApp,
      getActiveAffiliateOffers,
      initializeRevealAnimations,
      showInitializationError,
    };
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
