"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const data = require("./data");
const diagnosis = require("./diagnosis");

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
