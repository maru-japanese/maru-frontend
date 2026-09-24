import assert from "node:assert/strict";
import test from "node:test";
import { furiganaHTML, furiganaSegments } from "../shared/furigana.js";

test("furigana wraps only kanji runs, even with repeated or self-echoing anchors", () => {
  assert.equal(furiganaHTML("水を飲みます。", "みずをのみます。"), "<ruby>水<rt>みず</rt></ruby>を<ruby>飲<rt>の</rt></ruby>みます。");
  assert.equal(furiganaHTML("電車で行きます。", "でんしゃでいきます。"), "<ruby>電車<rt>でんしゃ</rt></ruby>で<ruby>行<rt>い</rt></ruby>きます。");
  assert.equal(furiganaHTML("先生の先生です。", "せんせいのせんせいです。"), "<ruby>先生<rt>せんせい</rt></ruby>の<ruby>先生<rt>せんせい</rt></ruby>です。");
  assert.equal(furiganaHTML("山川さんは山に行きます。", "やまかわさんはやまにいきます。"), "<ruby>山川<rt>やまかわ</rt></ruby>さんは<ruby>山<rt>やま</rt></ruby>に<ruby>行<rt>い</rt></ruby>きます。");
});

test("furigana leaves pure-kana text untouched and escapes unsafe characters", () => {
  assert.equal(furiganaHTML("ねこ", "ねこ"), "ねこ");
  assert.equal(furiganaHTML("ねこ", ""), "ねこ");
  assert.equal(furiganaHTML("<水>", "<みず>", s => s.replace(/[<>]/g, c => ({ "<": "&lt;", ">": "&gt;" }[c]))), "&lt;<ruby>水<rt>みず</rt></ruby>&gt;");
});

test("furigana falls back to plain text when the reading cannot be aligned", () => {
  assert.equal(furiganaSegments("水を飲みます。", "totally unrelated"), null);
  assert.equal(furiganaHTML("水を飲みます。", "totally unrelated"), "水を飲みます。");
});
