import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { env } from "../../config/env";
import { generateQrDataUrl } from "../qr/qr.service";
import { logger } from "../../utils/logger";

const templatePath = path.resolve(process.cwd(), "src/templates/ticket.html");
const TICKET_WIDTH = 1080;
const TICKET_HEIGHT = 1920;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const loadTemplate = () => fs.readFileSync(templatePath, "utf8");

export const getTicketPngAbsolutePath = (uuid: string) =>
  path.resolve(env.ticketsStorageDir, `${uuid}.png`);

const getMimeTypeByExtension = (filePath: string) => {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") {
    return "image/png";
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }
  if (extension === ".webp") {
    return "image/webp";
  }
  return "application/octet-stream";
};

const resolveBackgroundUrl = () => {
  if (fs.existsSync(env.ticketBackgroundPath)) {
    const imageBuffer = fs.readFileSync(env.ticketBackgroundPath);
    const mimeType = getMimeTypeByExtension(env.ticketBackgroundPath);
    const base64 = imageBuffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
  }
  logger.warn("Ticket background image not found", {
    ticketBackgroundPath: env.ticketBackgroundPath,
  });
  return "";
};

const getSystemChromePath = () => {
  if (env.puppeteerExecutablePath && fs.existsSync(env.puppeteerExecutablePath)) {
    return env.puppeteerExecutablePath;
  }

  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const launchBrowser = async () => {
  try {
    return await puppeteer.launch({ headless: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("Could not find Chrome")) {
      throw error;
    }

    const chromePath = getSystemChromePath();
    if (!chromePath) {
      throw new Error(
        "Chrome for Puppeteer is missing. Run: npm run setup:browser (in backend)."
      );
    }

    return puppeteer.launch({
      headless: true,
      executablePath: chromePath,
    });
  }
};

export const generateTicketPng = async (params: {
  uuid: string;
  guestName: string;
  qrData: string;
}) => {
  fs.mkdirSync(env.ticketsStorageDir, { recursive: true });

  const qrDataUrl = await generateQrDataUrl(params.qrData);
  const template = loadTemplate();
  const html = template
    .replaceAll("{{GUEST_NAME}}", escapeHtml(params.guestName))
    .replaceAll("{{TICKET_UUID}}", escapeHtml(params.uuid))
    .replaceAll("{{EVENT_NAME}}", escapeHtml(env.eventName))
    .replaceAll("{{QR_DATA_URL}}", qrDataUrl)
    .replaceAll("{{BACKGROUND_URL}}", resolveBackgroundUrl());

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: TICKET_WIDTH,
      height: TICKET_HEIGHT,
      deviceScaleFactor: 2,
    });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const targetPath = getTicketPngAbsolutePath(params.uuid);
    await page.screenshot({
      path: targetPath,
      type: "png",
      clip: { x: 0, y: 0, width: TICKET_WIDTH, height: TICKET_HEIGHT },
    });

    return targetPath;
  } finally {
    await browser.close();
  }
};
