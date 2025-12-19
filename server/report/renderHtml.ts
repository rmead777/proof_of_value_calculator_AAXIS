import { marked } from 'marked';

export function markdownToSafeHtml(md: string) {
  // Prevent raw HTML coming from the model from being interpreted.
  const escaped = md.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return marked.parse(escaped, { gfm: true, breaks: true }) as string;
}

export function buildReportHtmlDocument(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 32px; }
      h1, h2, h3 { margin: 18px 0 8px; }
      p { margin: 8px 0; line-height: 1.45; }
      ul, ol { margin: 8px 0 8px 22px; }
      table { border-collapse: collapse; width: 100%; margin: 12px 0; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
      th { background: #f1f5f9; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background: #f1f5f9; padding: 1px 4px; border-radius: 4px; }
      @page { margin: 16mm; }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;
}
