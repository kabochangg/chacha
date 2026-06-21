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
    resultReasons: "#result-reasons",
    resultCautions: "#result-cautions",
    resultSteps: "#result-steps",
    resultLinks: "#result-links",
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

  function createQuizApp({ data, diagnosis, documentObject = document, windowObject = window }) {
    diagnosis.validateData(data);
    const elements = getRequiredElements(documentObject);
    const state = diagnosis.createQuizState(data.questions.length);
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

      elements.resultTitle.textContent = result.title;
      elements.resultBadge.textContent = result.badge;
      elements.resultSummary.textContent = result.summary;
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

      elements.quizForm.classList.add("hidden");
      elements.resultPanel.classList.remove("hidden");
      elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      focusHeading(elements.resultTitle);
    }

    elements.quizForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!state.currentAnswer) return;
      if (state.isLast) {
        renderResult();
      } else if (state.next()) {
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
      initializeRevealAnimations,
      showInitializationError,
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
