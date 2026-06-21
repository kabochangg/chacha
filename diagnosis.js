(function (globalScope) {
  "use strict";

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function validateData({ TYPES, questions, results, tieBreakOrder }) {
    const typeValues = Object.values(TYPES);
    const knownTypes = new Set(typeValues);

    assert(typeValues.length > 0, "診断タイプが登録されていません。");
    assert(new Set(typeValues).size === typeValues.length, "診断タイプの識別子が重複しています。");
    assert(Array.isArray(questions) && questions.length > 0, "質問を1件以上登録してください。");
    assert(Array.isArray(tieBreakOrder), "同点時の判定順が正しくありません。");
    assert(
      tieBreakOrder.length === typeValues.length &&
        tieBreakOrder.every((type) => knownTypes.has(type)) &&
        new Set(tieBreakOrder).size === typeValues.length,
      "同点時の判定順には、すべての診断タイプを1回ずつ指定してください。",
    );

    typeValues.forEach((type) => {
      assert(results[type], `診断タイプ「${type}」の結果がありません。`);
      const offers = results[type].affiliateOffers || [];
      assert(Array.isArray(offers), `診断タイプ「${type}」の広告設定が正しくありません。`);
      offers.forEach((offer, offerIndex) => {
        assert(offer.id?.trim(), `診断タイプ「${type}」の${offerIndex + 1}件目に広告IDがありません。`);
        assert(offer.name?.trim(), `広告「${offer.id}」にサービス名がありません。`);
        if (offer.enabled) {
          assert(
            /^https:\/\//.test(offer.url || ""),
            `有効な広告「${offer.id}」にはHTTPSのURLを設定してください。`,
          );
        }
      });
    });

    questions.forEach((question, questionIndex) => {
      assert(question.title?.trim(), `${questionIndex + 1}問目の質問文がありません。`);
      assert(
        Array.isArray(question.choices) && question.choices.length > 0,
        `${questionIndex + 1}問目に選択肢がありません。`,
      );

      question.choices.forEach((choice, choiceIndex) => {
        assert(
          choice.label?.trim(),
          `${questionIndex + 1}問目の${choiceIndex + 1}番目に選択肢の文章がありません。`,
        );
        assert(
          knownTypes.has(choice.type),
          `${questionIndex + 1}問目の「${choice.label}」に未知のtype「${choice.type}」が指定されています。`,
        );
      });
    });

    return true;
  }

  function calculateScores(answers, types) {
    const typeValues = Object.values(types);
    const knownTypes = new Set(typeValues);
    const scores = Object.fromEntries(typeValues.map((type) => [type, 0]));

    answers.forEach((type) => {
      if (type === null) return;
      assert(knownTypes.has(type), `未知の回答タイプ「${type}」です。`);
      scores[type] += 1;
    });

    return scores;
  }

  function getResultType(answers, types, tieBreakOrder) {
    const scores = calculateScores(answers, types);

    return tieBreakOrder.reduce(
      (bestType, type) => (scores[type] > scores[bestType] ? type : bestType),
      tieBreakOrder[0],
    );
  }

  function createQuizState(questionCount) {
    assert(Number.isInteger(questionCount) && questionCount > 0, "質問数は1以上の整数にしてください。");

    let currentIndex = 0;
    const answers = new Array(questionCount).fill(null);

    return {
      get currentIndex() {
        return currentIndex;
      },
      get answers() {
        return [...answers];
      },
      get currentAnswer() {
        return answers[currentIndex];
      },
      get isFirst() {
        return currentIndex === 0;
      },
      get isLast() {
        return currentIndex === questionCount - 1;
      },
      answer(type) {
        answers[currentIndex] = type;
      },
      next() {
        if (!answers[currentIndex] || currentIndex >= questionCount - 1) return false;
        currentIndex += 1;
        return true;
      },
      previous() {
        if (currentIndex === 0) return false;
        currentIndex -= 1;
        return true;
      },
      reset() {
        answers.fill(null);
        currentIndex = 0;
      },
    };
  }

  const diagnosis = {
    validateData,
    calculateScores,
    getResultType,
    createQuizState,
  };

  globalScope.SideWorkFinder = {
    ...globalScope.SideWorkFinder,
    diagnosis,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = diagnosis;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
