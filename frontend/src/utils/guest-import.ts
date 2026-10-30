export type ImportGuest = {
  line: number;
  guestName: string;
  note: string | null;
  error: string | null;
};

export const guestNameKey = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru");

const nameHeaders = ["имя", "фио", "ф.и.о.", "guestname", "guest name", "name"];
const noteHeaders = ["доп. информация", "доп информация", "дополнительная информация", "примечание", "note"];
const isEmpty = (cell: unknown) => cell == null || (typeof cell === "string" && !cell.trim());

export const validateImportGuest = (guestName: string, note: string | null) =>
  !guestName.trim() ? "Не указано имя" : guestName.trim().length > 120
    ? "Имя длиннее 120 символов" : (note?.trim().length ?? 0) > 500
      ? "Примечание длиннее 500 символов" : null;

export const parseGuestRows = (rows: unknown[][]): ImportGuest[] => {
  const headerIndex = rows.findIndex((row) => row.some((cell) => !isEmpty(cell)));
  if (headerIndex < 0) throw new Error("Лист пуст. Добавьте столбец «Имя» и список гостей.");
  const headers = rows[headerIndex]!.map((cell) => typeof cell === "string" ? guestNameKey(cell) : "");
  const nameColumns = headers.flatMap((header, index) => nameHeaders.includes(header) ? [index] : []);
  const noteColumns = headers.flatMap((header, index) => noteHeaders.includes(header) ? [index] : []);
  if (nameColumns.length !== 1 || noteColumns.length > 1) {
    throw new Error("В первой строке нужен один столбец «Имя» (или «ФИО») и необязательный столбец «Доп. информация» (или «Примечание»).");
  }
  return rows.slice(headerIndex + 1).flatMap((row, index) => {
    const nameCell = row[nameColumns[0]!];
    const noteCell = noteColumns.length ? row[noteColumns[0]!] : null;
    if (isEmpty(nameCell) && isEmpty(noteCell)) return [];
    const guestName = typeof nameCell === "string" ? nameCell.trim().replace(/\s+/g, " ") : "";
    const note = typeof noteCell === "string" ? noteCell.trim() || null : null;
    const error = !isEmpty(nameCell) && typeof nameCell !== "string" ? "Имя должно быть текстом"
      : !isEmpty(noteCell) && typeof noteCell !== "string" ? "Примечание должно быть текстом"
        : validateImportGuest(guestName, note);
    return [{ line: headerIndex + index + 2, guestName, note, error }];
  });
};
