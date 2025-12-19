import { chromium } from 'playwright';
import { buildReportHtmlDocument, markdownToSafeHtml } from './renderHtml.js';

export async function generatePdfFromMarkdown(params: { title: string; markdown: string }) {
  const { title, markdown } = params;
  const htmlBody = markdownToSafeHtml(markdown);
  const fullHtml = buildReportHtmlDocument(title, htmlBody);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle' });

    // Best quality: vector text, embedded fonts, print background.
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '16mm', right: '16mm', bottom: '16mm', left: '16mm' },
    });

    return pdf;
  } finally {
    await browser.close();
  }
}
