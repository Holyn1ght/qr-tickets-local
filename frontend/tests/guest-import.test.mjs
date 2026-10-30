import assert from "node:assert/strict";
import test from "node:test";
import { guestNameKey, parseGuestRows } from "../src/utils/guest-import.ts";

test("reads Excel columns, skips blank rows and preserves worksheet row numbers", () => {
  const rows = parseGuestRows([
    ["Имя", "Доп. информация"], [" Иванов  Иван Иванович ", null],
    [], ["Анна Петрова", "ВК"], ["Эрик"],
  ]);
  assert.deepEqual(rows.map(({ line, guestName, error }) => ({ line, guestName, error })), [
    { line: 2, guestName: "Иванов Иван Иванович", error: null },
    { line: 4, guestName: "Анна Петрова", error: null },
    { line: 5, guestName: "Эрик", error: null },
  ]);
});

test("maps reordered columns and preserves names and notes as supplied", () => {
  assert.deepEqual(parseGuestRows([[], ["Примечание", "ФИО"], ["(нет телеги) @example", "Кулагина-Ярцева Василиса"]]), [
    { line: 3, guestName: "Кулагина-Ярцева Василиса", note: "(нет телеги) @example", error: null },
  ]);
});

test("validates empty names and API field limits before import", () => {
  const rows = parseGuestRows([["Имя", "Доп. информация"], [null, "ВК"],
    ["а".repeat(121)], ["Иван", "б".repeat(501)], [123], ["Анна", new Date()]]);
  assert.ok(rows.every((row) => row.error));
  assert.equal(parseGuestRows([["Имя"]]).length, 0);
  assert.equal(parseGuestRows([["Имя"], ["а".repeat(120)]])[0].error, null);
});

test("rejects missing or ambiguous headers instead of importing them as guests", () => {
  assert.throws(() => parseGuestRows([]), /Лист пуст/);
  assert.throws(() => parseGuestRows([["Иванов Иван"]]), /столбец/);
  assert.throws(() => parseGuestRows([["Имя", "ФИО"]]), /столбец/);
});

test("duplicate keys ignore case and whitespace, preserve different names", () => {
  assert.equal(guestNameKey("  ИВАНОВ  Иван "), guestNameKey("иванов Иван"));
  assert.notEqual(guestNameKey("Анна Иванова"), guestNameKey("Анна Петрова"));
});
