import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PLACEMENT_QUESTIONS, placementResult } from "../shared/placement.js";
import { normalizeSnapshot, mergeSnapshots, recordActivity, currentStreak, availableRestDay } from "../shared/progress.js";
import { moduleSeals, nextLesson } from "../shared/learningPath.js";
import { MODULES, getLesson } from "../shared/curriculum.js";
import { CULTURE_CAPSULES, THEMATIC_PATHS, thematicContent } from "../shared/discovery.js";

test("placement gates later stages on kana and recommends only a stage", () => {
  const answers = Object.fromEntries(PLACEMENT_QUESTIONS.map(q => [q.id, null]));
  assert.equal(PLACEMENT_QUESTIONS.length, 15);
  assert.equal(placementResult(answers).moduleId, "start");
  const pass = areas => PLACEMENT_QUESTIONS.filter(q => areas.includes(q.area)).forEach(q => { answers[q.id] = q.answer; });
  pass(["particles", "reading"]);
  assert.equal(placementResult(answers).moduleId, "start");
  answers["h-a"] = 0;
  assert.equal(placementResult(answers).moduleId, "hiragana");
  pass(["hiragana"]);
  assert.equal(placementResult(answers).moduleId, "katakana");
  pass(["katakana"]);
  assert.equal(placementResult(answers).moduleId, "kanji");
  answers["p-object"] = null; answers["r-where"] = null; answers["r-negative"] = null;
  pass(["kanji", "vocabulary"]);
  assert.equal(placementResult(answers).moduleId, "sentences");
  pass(["reading"]);
  assert.equal(placementResult(answers).moduleId, "particles");
  pass(["particles"]);
  assert.equal(placementResult(answers).moduleId, "everyday");
  assert.equal(placementResult(answers).complete, true);
  assert.equal(placementResult({}).complete, false);
});

test("diagnosis, manual entry and resetting suggestions preserve actual achievements", () => {
  const p = normalizeSnapshot({ xp: { total: 80 }, lessons: { welcome: { completedAt: 10 } }, placement: { version: 1, answers: {"h-a":0, fake:1, "h-ne":99}, acceptedModule:"kanji", updatedAt:100 } });
  assert.deepEqual(p.placement.answers, {"h-a":0,"h-ne":null});
  assert.equal(nextLesson(p).moduleId, "kanji");
  assert.equal(moduleSeals(p).filter(m => m.earned).length, 0);
  assert.equal(p.xp.total, 80);
  assert.equal(Object.keys(p.lessons).length, 1);
  const newer = normalizeSnapshot({ placement: { updatedAt:200, acceptedModule:"start" } });
  const merged = mergeSnapshots(p, newer);
  assert.equal(nextLesson(merged).id, "how-it-works");
  assert.equal(merged.xp.total, 80);
  for (const lesson of MODULES[0].lessons) merged.lessons[lesson.id] = {completedAt:1};
  assert.equal(moduleSeals(merged)[0].earned,true);
});

test("a weekly rest preserves study-day count without fabricating XP or activity", () => {
  const p = normalizeSnapshot();
  recordActivity(p, 8, new Date(2026,8,7,12).getTime()); // Monday
  assert.equal(availableRestDay(p,new Date(2026,8,9,12)), "2026-09-08");
  assert.equal(currentStreak(p,new Date(2026,8,9,12)),1);
  recordActivity(p,8,new Date(2026,8,9,12).getTime());
  assert.equal(p.streak.count,2);
  assert.equal(p.xp.total,16);
  assert.equal(p.activity["2026-09-08"],undefined);
  assert.equal(p.restDays["2026-09-08"],1);
  assert.equal(availableRestDay(p,new Date(2026,8,11,12)),"");
  recordActivity(p,8,new Date(2026,8,11,12).getTime());
  assert.equal(p.streak.count,1);
  recordActivity(p,8,new Date(2026,8,12,12).getTime());
  recordActivity(p,8,new Date(2026,8,13,12).getTime());
  recordActivity(p,8,new Date(2026,8,15,12).getTime());
  assert.equal(p.restDays["2026-09-14"],1);
  assert.equal(p.streak.count,4);
});

test("all thematic paths and culture capsules reference real, explained content", () => {
  for (const capsule of CULTURE_CAPSULES) {
    assert.ok(getLesson(capsule.lessonId));
    assert.ok(capsule.expression?.note);
    assert.ok(capsule.expression?.context);
  }
  for (const path of THEMATIC_PATHS) {
    const content = thematicContent(path.id);
    assert.ok(path.lessonIds.every(getLesson));
    assert.ok([...content.words,...content.sentences,...content.expressions].every(Boolean));
  }
  assert.equal(thematicContent("missing"),null);
});

test("the authoring command creates a draft without publishing or overwriting it", async t => {
  const directory = await mkdtemp(path.join(tmpdir(),"maru-editorial-"));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const script = fileURLToPath(new URL("../scripts/new-lesson.js",import.meta.url));
  const args = [script,"--id","travel-new","--module","everyday","--title","Uma nova ideia"];
  execFileSync(process.execPath,args,{cwd:directory});
  const output = await readFile(path.join(directory,"docs/drafts/travel-new.js"),"utf8");
  assert.match(output,/"status": "draft"/);
  assert.match(output,/"title": "Uma nova ideia"/);
  assert.throws(()=>execFileSync(process.execPath,args,{cwd:directory,stdio:"pipe"}));
  assert.equal(await readFile(path.join(directory,"docs/drafts/travel-new.js"),"utf8"),output);
  assert.throws(()=>execFileSync(process.execPath,[script,"--id","../escape","--module","everyday","--title","X"],{cwd:directory,stdio:"pipe"}));
});
