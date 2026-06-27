"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const data = require("./data");
const diagnosis = require("./diagnosis");
const ui = require("./ui");

test("診断データのtype指定がすべて有効", () => {
  assert.equal(diagnosis.validateData(data), true);
});

for (const type of Object.values(data.TYPES)) {
  test(`${type}だけを回答すると、そのタイプになる`, () => {
    const answers = new Array(data.questions.length).fill(type);
    assert.equal(diagnosis.getResultType(answers, data.TYPES, data.tieBreakOrder), type);
  });
}

test("同点時は定義された優先順で判定する", () => {
  const answers = [
    data.TYPES.BLOG,
    data.TYPES.SNS,
    data.TYPES.SKILL,
    data.TYPES.CONTENT,
  ];
  assert.equal(
    diagnosis.getResultType(answers, data.TYPES, data.tieBreakOrder),
    data.tieBreakOrder[0],
  );
});

test("未回答では次へ進めず、戻ると回答を保持する", () => {
  const state = diagnosis.createQuizState(3);
  assert.equal(state.next(), false);

  state.answer(data.TYPES.BLOG);
  assert.equal(state.next(), true);
  state.answer(data.TYPES.SNS);
  assert.equal(state.previous(), true);
  assert.equal(state.currentAnswer, data.TYPES.BLOG);
});

test("再診断で回答と現在位置を初期化する", () => {
  const state = diagnosis.createQuizState(2);
  state.answer(data.TYPES.BLOG);
  state.next();
  state.answer(data.TYPES.SNS);
  state.reset();

  assert.equal(state.currentIndex, 0);
  assert.deepEqual(state.answers, [null, null]);
});

test("任意の質問数で最後まで進める", () => {
  const state = diagnosis.createQuizState(4);
  for (let index = 0; index < 4; index += 1) {
    state.answer(data.TYPES.CONTENT);
    if (index < 3) assert.equal(state.next(), true);
  }
  assert.equal(state.currentIndex, 3);
  assert.equal(state.isLast, true);
  assert.equal(state.next(), false);
});

test("未知のtypeをデータ検証で検出する", () => {
  const invalidData = {
    ...data,
    questions: [
      {
        title: "テスト",
        choices: [{ label: "不正な選択肢", type: "unknown" }],
      },
    ],
  };
  assert.throws(() => diagnosis.validateData(invalidData), /未知のtype/);
});

test("有効かつHTTPSの広告だけを最大3件表示対象にする", () => {
  const offers = [
    { id: "one", enabled: true, url: "https://example.com/1" },
    { id: "two", enabled: false, url: "https://example.com/2" },
    { id: "three", enabled: true, url: "" },
    { id: "four", enabled: true, url: "https://example.com/4" },
    { id: "five", enabled: true, url: "https://example.com/5" },
    { id: "six", enabled: true, url: "https://example.com/6" },
  ];

  assert.deepEqual(
    ui.getActiveAffiliateOffers(offers).map((offer) => offer.id),
    ["one", "four", "five"],
  );
});

test("有効な広告にはHTTPS URLが必要", () => {
  const invalidData = {
    ...data,
    results: {
      ...data.results,
      [data.TYPES.BLOG]: {
        ...data.results[data.TYPES.BLOG],
        affiliateOffers: [
          {
            id: "invalid-offer",
            name: "不正な広告",
            enabled: true,
            url: "http://example.com",
          },
        ],
      },
    },
  };

  assert.throws(() => diagnosis.validateData(invalidData), /HTTPS/);
});


test("all result types have active initial affiliate offers", () => {
  for (const result of Object.values(data.results)) {
    const activeOffers = ui.getActiveAffiliateOffers(result.affiliateOffers);
    assert.ok(activeOffers.length > 0);
    assert.ok(activeOffers.length <= 3);
    for (const offer of activeOffers) {
      assert.match(offer.url, /^https:\/\//);
      assert.equal(offer.enabled, true);
    }
  }
});
