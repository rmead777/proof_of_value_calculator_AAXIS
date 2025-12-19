import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';
import { generateAiReportMarkdown } from './report/generateAiReport.js';
import { generatePdfFromMarkdown } from './report/pdf.js';
import { buildReportHtmlDocument, markdownToSafeHtml } from './report/renderHtml.js';
import { sendReportEmail } from './email/sendReportEmail.js';
import { generateDocxFromMarkdown } from './report/docx.js';
import { assembleReport, areBlocksAvailable, type AssembleReportInput } from './report/assembleReport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env first, then let .env.local win (and override any pre-set env vars).
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, '.env.local'), override: true });

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const REPORT_VOUCHER_CODE = process.env.REPORT_VOUCHER_CODE || 'Skynet2026';

function isValidVoucher(voucher: unknown) {
  return typeof voucher === 'string' && voucher.length > 0 && voucher === REPORT_VOUCHER_CODE;
}

const ReportRequestSchema = z.object({
  model: z.string().min(1),
  data: z.unknown(),
  voucher: z.string().min(1).optional(),
});

const ReportPdfRequestSchema = z
  .object({
    title: z.string().min(1).optional(),
    markdown: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    data: z.unknown().optional(),
    voucher: z.string().min(1).optional(),
  })
  .refine((v) => !!v.markdown || (!!v.model && v.data !== undefined), {
    message: 'Provide either `markdown` or (`model` and `data`) to generate a PDF.',
    path: ['markdown'],
  });

const ReportDocxRequestSchema = z
  .object({
    title: z.string().min(1).optional(),
    markdown: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    data: z.unknown().optional(),
    voucher: z.string().min(1).optional(),
  })
  .refine((v) => !!v.markdown || (!!v.model && v.data !== undefined), {
    message: 'Provide either `markdown` or (`model` and `data`) to generate a DOCX.',
    path: ['markdown'],
  });

const ReportEmailRequestSchema = z
  .object({
    email: z.string().email(),
    subject: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    markdown: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    data: z.unknown().optional(),
    voucher: z.string().min(1).optional(),
  })
  .refine((v) => {
    // Email-only path: allow (model+data) without voucher; do not return report.
    if (v.markdown) return true;
    return !!v.model && v.data !== undefined;
  }, {
    message: 'Provide either `markdown` or (`model` and `data`) to email a report.',
    path: ['markdown'],
  });

const rate = new Map<string, { count: number; resetAt: number }>();

// Schema for assembled (pre-generated blocks) report
const AssembledReportRequestSchema = z.object({
  industry: z.string().min(1),
  companySize: z.string().optional(),
  annualRevenue: z.number().positive(),
  riskTolerance: z.enum(['Conservative', 'Moderate', 'Aggressive']),
  selectedSolutions: z.array(z.string()).min(1),
  totalSavings: z.number(),
  savingsRangeLow: z.number(),
  savingsRangeHigh: z.number(),
  opexReductionPct: z.number(),
  voucher: z.string().min(1).optional(),
});

function getClientIp(req: express.Request) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0]!.trim();
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).split(',')[0]!.trim();
  return req.socket.remoteAddress || 'unknown';
}

function allowRate(req: express.Request, limit = 5, windowMs = 60_000) {
  const ip = getClientIp(req);
  const now = Date.now();
  const cur = rate.get(ip);
  if (!cur || now > cur.resetAt) {
    rate.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (cur.count >= limit) return false;
  cur.count += 1;
  return true;
}

// Assembled report endpoint (uses pre-generated blocks, no AI call)
app.post('/api/report/assembled', async (req, res) => {
  try {
    const input = AssembledReportRequestSchema.parse(req.body);
    
    // Check if blocks are available
    if (!areBlocksAvailable()) {
      res.status(503).json({ error: 'Report blocks not available. Please run prompt_suite.py first.' });
      return;
    }
    
    // Voucher required for direct report access
    if (!isValidVoucher(input.voucher)) {
      res.status(403).json({ error: 'Voucher code required.' });
      return;
    }
    
    const assembleInput: AssembleReportInput = {
      industry: input.industry,
      companySize: input.companySize,
      annualRevenue: input.annualRevenue,
      riskTolerance: input.riskTolerance,
      selectedSolutions: input.selectedSolutions,
      totalSavings: input.totalSavings,
      savingsRangeLow: input.savingsRangeLow,
      savingsRangeHigh: input.savingsRangeHigh,
      opexReductionPct: input.opexReductionPct,
    };
    
    const markdown = assembleReport(assembleInput);
    res.json({ markdown });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

// Assembled report PDF endpoint
app.post('/api/report/assembled/pdf', async (req, res) => {
  try {
    const body = req.body as { title?: string; voucher?: string } & z.infer<typeof AssembledReportRequestSchema>;
    const input = AssembledReportRequestSchema.parse(body);
    
    if (!areBlocksAvailable()) {
      res.status(503).json({ error: 'Report blocks not available.' });
      return;
    }
    
    if (!isValidVoucher(input.voucher)) {
      res.status(403).json({ error: 'Voucher code required.' });
      return;
    }
    
    const markdown = assembleReport({
      industry: input.industry,
      companySize: input.companySize,
      annualRevenue: input.annualRevenue,
      riskTolerance: input.riskTolerance,
      selectedSolutions: input.selectedSolutions,
      totalSavings: input.totalSavings,
      savingsRangeLow: input.savingsRangeLow,
      savingsRangeHigh: input.savingsRangeHigh,
      opexReductionPct: input.opexReductionPct,
    });
    
    const pdf = await generatePdfFromMarkdown({ 
      title: body.title || 'ROI Detailed Report', 
      markdown 
    });
    
    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="roi-detailed-report.pdf"');
    res.send(Buffer.from(pdf));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

// Assembled report DOCX endpoint
app.post('/api/report/assembled/docx', async (req, res) => {
  try {
    const body = req.body as { title?: string; voucher?: string } & z.infer<typeof AssembledReportRequestSchema>;
    const input = AssembledReportRequestSchema.parse(body);
    
    if (!areBlocksAvailable()) {
      res.status(503).json({ error: 'Report blocks not available.' });
      return;
    }
    
    if (!isValidVoucher(input.voucher)) {
      res.status(403).json({ error: 'Voucher code required.' });
      return;
    }
    
    const markdown = assembleReport({
      industry: input.industry,
      companySize: input.companySize,
      annualRevenue: input.annualRevenue,
      riskTolerance: input.riskTolerance,
      selectedSolutions: input.selectedSolutions,
      totalSavings: input.totalSavings,
      savingsRangeLow: input.savingsRangeLow,
      savingsRangeHigh: input.savingsRangeHigh,
      opexReductionPct: input.opexReductionPct,
    });
    
    const docx = await generateDocxFromMarkdown({ 
      title: body.title || 'ROI Detailed Report', 
      markdown 
    });
    
    res.status(200);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="roi-detailed-report.docx"');
    res.send(Buffer.from(docx));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

// Assembled report email endpoint (email-only path, no voucher needed)
app.post('/api/report/assembled/email', async (req, res) => {
  try {
    if (!allowRate(req)) {
      res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
      return;
    }
    
    const body = req.body as { email: string; subject?: string; title?: string } & z.infer<typeof AssembledReportRequestSchema>;
    const email = z.string().email().parse(body.email);
    const input = AssembledReportRequestSchema.omit({ voucher: true }).parse(body);
    
    if (!areBlocksAvailable()) {
      res.status(503).json({ error: 'Report blocks not available.' });
      return;
    }
    
    const markdown = assembleReport({
      industry: input.industry,
      companySize: input.companySize,
      annualRevenue: input.annualRevenue,
      riskTolerance: input.riskTolerance,
      selectedSolutions: input.selectedSolutions,
      totalSavings: input.totalSavings,
      savingsRangeLow: input.savingsRangeLow,
      savingsRangeHigh: input.savingsRangeHigh,
      opexReductionPct: input.opexReductionPct,
    });
    
    const reportTitle = body.title || 'ROI Detailed Report';
    const pdf = await generatePdfFromMarkdown({ title: reportTitle, markdown });
    const htmlBody = markdownToSafeHtml(markdown);
    const htmlDoc = buildReportHtmlDocument(reportTitle, htmlBody);
    
    await sendReportEmail({
      to: email,
      subject: body.subject || 'Your ROI Detailed Report',
      html: htmlDoc,
      text: markdown,
      pdf,
      filename: 'roi-detailed-report.pdf',
    });
    
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

app.post('/api/report', async (req, res) => {
  try {
    const { model, data, voucher } = ReportRequestSchema.parse(req.body);
    if (!isValidVoucher(voucher)) {
      res.status(403).json({ error: 'Voucher code required.' });
      return;
    }
    const markdown = await generateAiReportMarkdown({ model, data });
    res.json({ markdown });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

app.post('/api/report/pdf', async (req, res) => {
  try {
    const { title, markdown, model, data, voucher } = ReportPdfRequestSchema.parse(req.body);

    if (!isValidVoucher(voucher)) {
      res.status(403).json({ error: 'Voucher code required.' });
      return;
    }

    const md = markdown ?? (await generateAiReportMarkdown({ model: model as string, data }));
    const pdf = await generatePdfFromMarkdown({ title: title || 'ROI Detailed Report', markdown: md });

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="roi-detailed-report.pdf"');
    res.send(Buffer.from(pdf));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

app.post('/api/report/docx', async (req, res) => {
  try {
    const { title, markdown, model, data, voucher } = ReportDocxRequestSchema.parse(req.body);

    if (!isValidVoucher(voucher)) {
      res.status(403).json({ error: 'Voucher code required.' });
      return;
    }

    const md = markdown ?? (await generateAiReportMarkdown({ model: model as string, data }));
    const docx = await generateDocxFromMarkdown({ title: title || 'ROI Detailed Report', markdown: md });

    res.status(200);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="roi-detailed-report.docx"');
    res.send(Buffer.from(docx));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

app.post('/api/report/email', async (req, res) => {
  try {
    if (!allowRate(req)) {
      res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
      return;
    }

    const { email, subject, title, markdown, model, data, voucher } = ReportEmailRequestSchema.parse(req.body);

    const reportTitle = title || 'ROI Detailed Report';

    let md: string;
    if (markdown) {
      if (!isValidVoucher(voucher)) {
        res.status(403).json({ error: 'Voucher code required to email an in-app report.' });
        return;
      }
      md = markdown;
    } else {
      md = await generateAiReportMarkdown({ model: model as string, data });
    }

    const pdf = await generatePdfFromMarkdown({ title: reportTitle, markdown: md });
    const htmlBody = markdownToSafeHtml(md);
    const htmlDoc = buildReportHtmlDocument(reportTitle, htmlBody);

    await sendReportEmail({
      to: email,
      subject: subject || 'Your ROI Detailed Report',
      html: htmlDoc,
      text: md,
      pdf,
      filename: 'roi-detailed-report.pdf',
    });

    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

async function start() {
  const isProd = process.env.NODE_ENV === 'production';
  // In dev we run this as a separate API server behind Vite's proxy.
  const port = Number(process.env.PORT || (isProd ? 5173 : 5174));

  if (isProd) {
    const distDir = path.join(rootDir, 'dist');
    app.use(express.static(distDir));
    // Catch-all route for SPA - serve index.html for any unmatched routes
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res
        .status(200)
        .type('text/plain')
        .send('Proof of Value API server running. Use the Vite dev server URL for the UI.');
    });
  }

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port} (mode: ${process.env.NODE_ENV || 'development'})`);
  });
}

void start();
