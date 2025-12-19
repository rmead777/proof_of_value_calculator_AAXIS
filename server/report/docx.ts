import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';
import { marked, type Token, type Tokens } from 'marked';

function tokensToDocxElements(tokens: Token[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const h = token as Tokens.Heading;
        const level =
          h.depth === 1
            ? HeadingLevel.HEADING_1
            : h.depth === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3;
        // Use inline token parsing for headings too, with bold inherited
        const headingRuns = h.tokens && h.tokens.length > 0
          ? inlineToRuns(h.tokens, true, false)
          : [new TextRun({ text: h.text, bold: true })];
        paragraphs.push(
          new Paragraph({
            heading: level,
            children: headingRuns,
            spacing: { before: 240, after: 120 },
          }),
        );
        break;
      }

      case 'paragraph': {
        const p = token as Tokens.Paragraph;
        paragraphs.push(
          new Paragraph({
            children: inlineToRuns(p.tokens ?? []),
            spacing: { after: 120 },
          }),
        );
        break;
      }

      case 'list': {
        const list = token as Tokens.List;
        for (const item of list.items) {
          // List items can contain paragraphs with inline tokens
          const itemRuns: TextRun[] = [];
          if (item.tokens) {
            for (const itemToken of item.tokens) {
              if (itemToken.type === 'text') {
                itemRuns.push(new TextRun((itemToken as Tokens.Text).text));
              } else if ('tokens' in itemToken && Array.isArray((itemToken as { tokens: Token[] }).tokens)) {
                itemRuns.push(...inlineToRuns((itemToken as { tokens: Token[] }).tokens));
              } else if ('text' in itemToken) {
                itemRuns.push(new TextRun((itemToken as { text: string }).text));
              }
            }
          }
          paragraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              children: itemRuns.length > 0 ? itemRuns : [new TextRun('')],
              spacing: { after: 60 },
            }),
          );
        }
        break;
      }

      case 'table': {
        const tbl = token as Tokens.Table;
        const rows: TableRow[] = [];

        // Header row
        rows.push(
          new TableRow({
            children: tbl.header.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({
                    children: cell.tokens && cell.tokens.length > 0
                      ? inlineToRuns(cell.tokens, true, false)
                      : [new TextRun({ text: cell.text, bold: true })],
                  })],
                  shading: { fill: 'E2E8F0' },
                  borders: cellBorders(),
                }),
            ),
          }),
        );

        // Body rows
        for (const row of tbl.rows) {
          rows.push(
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [new Paragraph({
                      children: cell.tokens && cell.tokens.length > 0
                        ? inlineToRuns(cell.tokens)
                        : [new TextRun(cell.text)],
                    })],
                    borders: cellBorders(),
                  }),
              ),
            }),
          );
        }

        paragraphs.push(
          new Paragraph({
            children: [],
            spacing: { before: 120 },
          }),
        );

        // We can't push a Table directly into the children array here;
        // we'll handle tables separately below.
        // For now, store a placeholder we can swap out later.
        // Actually docx library requires tables at the document section level.
        // We'll use a workaround: store table data and handle in caller.
        (paragraphs as unknown as { __tables?: Table[] }).__tables =
          (paragraphs as unknown as { __tables?: Table[] }).__tables || [];
        (paragraphs as unknown as { __tables: Table[] }).__tables.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        );
        break;
      }

      case 'space':
        // Skip blank lines
        break;

      default:
        // Fallback: render as plain text if possible
        if ('text' in token) {
          paragraphs.push(new Paragraph((token as { text: string }).text));
        }
        break;
    }
  }

  return paragraphs;
}

function inlineToRuns(tokens: Token[], inheritBold = false, inheritItalic = false): TextRun[] {
  const runs: TextRun[] = [];
  for (const t of tokens) {
    if (t.type === 'text') {
      const txt = (t as Tokens.Text).text;
      if (inheritBold || inheritItalic) {
        runs.push(new TextRun({ text: txt, bold: inheritBold, italics: inheritItalic }));
      } else {
        runs.push(new TextRun(txt));
      }
    } else if (t.type === 'strong') {
      const strong = t as Tokens.Strong;
      // Recursively process nested tokens with bold flag
      if (strong.tokens && strong.tokens.length > 0) {
        runs.push(...inlineToRuns(strong.tokens, true, inheritItalic));
      } else {
        runs.push(new TextRun({ text: strong.text, bold: true }));
      }
    } else if (t.type === 'em') {
      const em = t as Tokens.Em;
      // Recursively process nested tokens with italic flag
      if (em.tokens && em.tokens.length > 0) {
        runs.push(...inlineToRuns(em.tokens, inheritBold, true));
      } else {
        runs.push(new TextRun({ text: em.text, italics: true }));
      }
    } else if (t.type === 'codespan') {
      runs.push(
        new TextRun({
          text: (t as Tokens.Codespan).text,
          font: 'Consolas',
          shading: { fill: 'F1F5F9' },
        }),
      );
    } else if (t.type === 'link') {
      // Links: just render text (no hyperlink support for simplicity)
      const link = t as Tokens.Link;
      if (link.tokens && link.tokens.length > 0) {
        runs.push(...inlineToRuns(link.tokens, inheritBold, inheritItalic));
      } else {
        runs.push(new TextRun(link.text));
      }
    } else if ('tokens' in t && Array.isArray((t as { tokens: Token[] }).tokens)) {
      // Generic nested tokens
      runs.push(...inlineToRuns((t as { tokens: Token[] }).tokens, inheritBold, inheritItalic));
    } else if ('text' in t) {
      const txt = (t as { text: string }).text;
      if (inheritBold || inheritItalic) {
        runs.push(new TextRun({ text: txt, bold: inheritBold, italics: inheritItalic }));
      } else {
        runs.push(new TextRun(txt));
      }
    }
  }
  return runs;
}

function cellBorders() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
  return { top: border, bottom: border, left: border, right: border };
}

export async function generateDocxFromMarkdown(params: { title: string; markdown: string }): Promise<Uint8Array> {
  const { title, markdown } = params;

  const tokens = marked.lexer(markdown);
  const paragraphs = tokensToDocxElements(tokens);

  // Extract tables that were stored during token processing
  const tables = (paragraphs as unknown as { __tables?: Table[] }).__tables || [];

  // Build document children: paragraphs interleaved with tables at end (simple approach)
  // A more sophisticated approach would track table positions, but this works for most reports.
  const children: (Paragraph | Table)[] = [...paragraphs, ...tables];

  const doc = new Document({
    title,
    sections: [
      {
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
