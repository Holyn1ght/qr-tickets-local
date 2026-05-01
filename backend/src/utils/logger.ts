const now = () => new Date().toISOString();

const stringifyMeta = (meta?: Record<string, unknown>) => {
  if (!meta || Object.keys(meta).length === 0) {
    return "";
  }
  return ` ${JSON.stringify(meta)}`;
};

const write = (level: "INFO" | "WARN" | "ERROR", message: string, meta?: Record<string, unknown>) => {
  const line = `[${now()}] [${level}] ${message}${stringifyMeta(meta)}`;
  if (level === "ERROR") {
    console.error(line);
    return;
  }
  if (level === "WARN") {
    console.warn(line);
    return;
  }
  console.log(line);
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write("INFO", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("WARN", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("ERROR", message, meta),
};
