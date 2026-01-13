import { marked, Token, Tokens } from 'marked';
import type { AnalysisResult } from '@/types/feedback';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { pipeline } from 'stream';
import { promisify } from 'util';
import https from 'https';

const streamPipeline = promisify(pipeline);

async function downloadImages(markdown: string): Promise<{ newMarkdown: string, tempDir: string }> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'latex-images-'));
    // Regex matches http(s) URLs OR data URIs
    // Data URIs can be very long, so we ensure we capture them.
    // We assume the URL/DataURI ends with the closing parenthesis of the markdown link.
    const imageRegex = /!\[([^\]]*)\]\(((?:https?:\/\/|data:image\/)[^)]+)\)/g;
    let match;
    const downloads: Promise<void>[] = [];
    const replacements: { originalFullMatch: string, originalUrl: string, newPath: string, isError?: boolean }[] = [];

    // Find all matches
    const matches: RegExpExecArray[] = [];
    while ((match = imageRegex.exec(markdown)) !== null) {
        matches.push(match);
    }

    // Process unique URLs
    const processedUrls = new Set<string>();

    for (const m of matches) {
        const fullMatch = m[0];
        const alt = m[1];
        const url = m[2];

        // We need to handle multiple occurrences of the same URL.
        if (processedUrls.has(url)) {
            const existingEntry = replacements.find(r => r.originalUrl === url);
            if (existingEntry) {
                replacements.push({
                    originalFullMatch: fullMatch,
                    originalUrl: url,
                    newPath: existingEntry.newPath,
                    isError: existingEntry.isError
                });
            }
            continue;
        }
        processedUrls.add(url);

        const hash = crypto.createHash('md5').update(url).digest('hex');
        // Determine extension
        let ext = '.png';
        if (url.startsWith('data:image/')) {
            const mime = url.substring(5, url.indexOf(';'));
            if (mime === 'image/jpeg') ext = '.jpg';
            // default png
        } else {
            ext = path.extname(new URL(url).pathname) || '.png';
        }

        const filename = `${hash}${ext}`;
        const localPath = path.join(tempDir, filename);

        const replacementEntry = {
            originalFullMatch: fullMatch,
            originalUrl: url,
            newPath: localPath,
            isError: false
        };
        replacements.push(replacementEntry);

        if (url.startsWith('data:')) {
            // Handle Data URI immediately (sync or async wrapper)
            downloads.push((async () => {
                try {
                    const base64Data = url.split(',')[1];
                    if (!base64Data) throw new Error('Invalid data URI');
                    await fs.promises.writeFile(localPath, Buffer.from(base64Data, 'base64'));
                } catch (err) {
                    console.error('Error writing data URI image:', err);
                    replacementEntry.isError = true;
                }
            })());
        } else {
            // Handle Remote URL
            downloads.push(new Promise<void>((resolve) => {
                const req = https.get(url, { rejectUnauthorized: false }, (res) => {
                    if (res.statusCode !== 200) {
                        console.error(`Failed to fetch ${url}: Status ${res.statusCode}`);
                        replacementEntry.isError = true;
                        res.resume();
                        resolve();
                        return;
                    }

                    const fileStream = fs.createWriteStream(localPath);
                    res.pipe(fileStream);

                    fileStream.on('finish', () => {
                        fileStream.close();
                        resolve();
                    });

                    fileStream.on('error', (err) => {
                        console.error(`Error writing file ${localPath}:`, err);
                        replacementEntry.isError = true;
                        resolve();
                    });
                });

                req.on('error', (err) => {
                    console.error(`Error downloading image ${url}:`, err);
                    replacementEntry.isError = true;
                    resolve();
                });
            }));
        }
    }

    await Promise.all(downloads);

    let newMarkdown = markdown;
    const finalReplacements = new Map<string, string>();

    for (const r of replacements) {
        if (r.isError) {
            finalReplacements.set(r.originalFullMatch, `**[Chart generation failed]**`);
        } else {
            const altText = r.originalFullMatch.match(/!\[([^\]]*)\]/)?.[1] || '';
            // We escape the path for LaTeX? No, just use local path. 
            // BUT: path on windows has backslashes. LaTeX hates backslashes in paths sometimes?
            // Actually this is running on Mac/Linux usually? User is on Mac.
            // Paths are /tmp/... safe.
            finalReplacements.set(r.originalFullMatch, `![${altText}](${r.newPath})`);
        }
    }

    const sortedOriginalMatches = Array.from(finalReplacements.keys()).sort((a, b) => b.length - a.length);

    for (const originalMatch of sortedOriginalMatches) {
        const replacementText = finalReplacements.get(originalMatch);
        const escapedOriginalMatch = originalMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        newMarkdown = newMarkdown.replace(new RegExp(escapedOriginalMatch, 'g'), replacementText!);
    }

    return { newMarkdown, tempDir };
}

export async function generateNativeLatex(analysisResult: AnalysisResult): Promise<string> {
    const { markdownReport: originalMarkdown, originalFileName, semester_scores } = analysisResult;

    // Construct Subtitle Logic
    let subtitle = "";
    if (semester_scores && semester_scores.length > 0) {
        const base = semester_scores[0];
        const year = base.Year;
        const term = base.Term; // "Odd" or "Even"
        // Logic: Odd -> Winter, Even -> Summer
        const isOdd = term && (term.toLowerCase() === 'odd' || term.toLowerCase() === 'winter');
        const examName = isOdd ? `Winter ${year}` : `Summer ${year}`;

        let academicYear = "";
        const y = parseInt(year);
        if (!isNaN(y)) {
            if (isOdd) academicYear = `${y}-${(y + 1).toString().slice(-2)}`;
            else academicYear = `${y - 1}-${y.toString().slice(-2)}`;
        } else {
            academicYear = year;
        }

        subtitle = `Academic Year ${academicYear}, Term - ${term}, GTU Exam - ${examName}`;
    }

    // Pre-process: Download images
    const { newMarkdown, tempDir } = await downloadImages(originalMarkdown);

    // 1. Preamble
    const preamble = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[a4paper, margin=0.5in]{geometry}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{xltabular}
\\usepackage{ragged2e}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage{fancyhdr}
\\usepackage{enumitem}
\\usepackage{float}
\\usepackage{enumitem}
\\usepackage{float}
\\usepackage[export]{adjustbox}
\\usepackage{makecell}
\\usepackage{tcolorbox}
\\renewcommand\\theadfont{\\bfseries}

% Colors
\\definecolor{primary}{RGB}{0, 51, 102}
\\definecolor{secondary}{RGB}{0, 102, 204}

% Custom Column Types
\\newcolumntype{L}{>{\\RaggedRight\\arraybackslash}X}
\\newcolumntype{C}{>{\\Centering\\arraybackslash}X}
\\newcolumntype{R}{>{\\RaggedLeft\\arraybackslash}X}

% Typography
\\usepackage{lmodern}
\\titleformat{\\section}{\\color{primary}\\Large\\bfseries}{\\thesection}{1em}{}
\\titleformat{\\subsection}{\\color{secondary}\\large\\bfseries}{\\thesubsection}{1em}{}

% Header/Footer
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{\\small Feedback Analysis Report}
\\lhead{\\small ${escapeLatex(subtitle.split(',')[0])}}
\\cfoot{\\thepage}

\\title{\\textbf{\\Huge Feedback Analysis Report}\\\\ \\vspace{0.5em} \\Large ${escapeLatex(subtitle)}}
\\author{Dept of ECE, GP Palanpur}
\\date{}

\\begin{document}

\\maketitle
\\tableofcontents
\\newpage

`;


    // 2. Body Generation    // 2. Parse Markdown
    const tokens = marked.lexer(newMarkdown);
    const body = parseTokens(tokens);

    // 3. Footer
    const footer = `
\\end{document}
`;

    return preamble + body + footer;
}

function parseTokens(tokens: Token[]): string {
    let latex = '';
    let pendingCaption = '';

    for (const token of tokens) {
        switch (token.type) {
            case 'heading': {
                const h = token as Tokens.Heading;
                const text = parseInline(h.text);
                // Shift headings: H1 is Title (ignored here), H2->Section, H3->Subsection
                if (h.depth === 1) {
                    // Ignore H1 as it's the document title
                }
                else if (h.depth === 2) latex += `\\section{${text}}\n`;
                else if (h.depth === 3) latex += `\\subsection{${text}}\n`;
                else if (h.depth === 4) latex += `\\subsubsection{${text}}\n`;
                else latex += `\\paragraph{${text}}\n`;
                break;
            }
            case 'paragraph': {
                const p = token as Tokens.Paragraph;
                // Check if paragraph is actually a caption marker
                const captionMatch = p.text.match(/^\s*<caption>(.*?)<\/caption>\s*$/);

                // Check if paragraph is a Image (Standalone Figure)
                const imageMatch = p.text.match(/^\s*!\[(.*?)\]\((.*?)\)\s*$/);

                if (captionMatch) {
                    pendingCaption = captionMatch[1];
                } else if (imageMatch) {
                    const alt = imageMatch[1];
                    const url = imageMatch[2];
                    latex += `\\begin{figure}[H]\n\\centering\n\\includegraphics[width=0.85\\linewidth]{${url}}\n\\caption{${parseInline(alt)}}\n\\end{figure}\n\n`;
                } else {
                    latex += `${parseInline(p.text)}\n\n`;
                }
                break;
            }
            case 'list': {
                const l = token as Tokens.List;
                const env = l.ordered ? 'enumerate' : 'itemize';
                latex += `\\begin{${env}}\n`;
                for (const item of l.items) {
                    latex += `  \\item ${parseTokens([item] as Token[]).trim()}\n`;
                }
                latex += `\\end{${env}}\n\n`;
                break;
            }
            case 'list_item': {
                const li = token as Tokens.ListItem;
                if (li.tokens && li.tokens.length > 0) {
                    latex += parseTokens(li.tokens);
                } else {
                    latex += parseInline(li.text);
                }
                break;
            }
            case 'table': {
                const t = token as Tokens.Table;
                latex += generateLatexTable(t, pendingCaption);
                pendingCaption = ''; // Reset after consuming
                break;
            }
            case 'blockquote': {
                const b = token as Tokens.Blockquote;
                // Check for GFM Alert syntax in the first token
                let isNote = false;
                let alertTitle = '';

                if (b.tokens.length > 0 && b.tokens[0].type === 'paragraph') {
                    const FirstPara = b.tokens[0] as Tokens.Paragraph;
                    const text = FirstPara.text;
                    const match = text.match(/^\[!NOTE\]\s*(.*)$/);
                    if (match) {
                        isNote = true;
                        alertTitle = match[1] || 'Note';
                        // Remove the marker from the first token's text for rendering
                        // We must clone or modify carefully. 
                        // Actually, let's just parse tokens, but skip the "[!NOTE] Title" part of the first paragraph?
                        // Simpler: Just render normally, but wrap in tcolorbox.
                        // But we want to remove "[!NOTE] Remarks" from the body text if it's the title.
                        // Let's rely on string replacement in the rendered output of the first paragraph? 
                        // Or better, modify the token text temporarily.
                        FirstPara.text = FirstPara.text.replace(/^\[!NOTE\]\s*.*(\n|$)/, '').trim();
                    }
                }

                if (isNote) {
                    // Use tcolorbox for Notes/Remarks
                    // height=6cm to ensure space for comments
                    latex += `\\begin{tcolorbox}[title=${parseInline(alertTitle)}, colback=white, colframe=black, height=2.5cm]\n`;
                    latex += parseTokens(b.tokens);
                    latex += `\\end{tcolorbox}\n\n`;
                } else {
                    latex += `\\begin{quote}\n${parseTokens(b.tokens)}\n\\end{quote}\n\n`;
                }
                break;
            }
            case 'space':
                latex += '\n';
                break;
            case 'hr':
                latex += '\\hrulefill\n\n';
                break;
            case 'text':
                const tx = token as Tokens.Text;
                if (tx.tokens) {
                    latex += parseTokens(tx.tokens);
                } else {
                    latex += parseInline(tx.text);
                }
                break;
            case 'html': {
                const h = token as Tokens.HTML;
                const captionMatch = h.text.match(/^\s*<caption>(.*?)<\/caption>\s*$/);
                if (captionMatch) {
                    pendingCaption = captionMatch[1];
                }

                // Handle Page Break
                if (h.text.includes('<!-- NEWPAGE -->')) {
                    latex += '\\newpage\n';
                }

                // Handle Signatures
                if (h.text.includes('<!-- SIGNATURES -->')) {
                    latex += `
\\vspace{1cm}
\\noindent
\\begin{tabular}{@{}p{0.4\\linewidth} p{0.2\\linewidth} p{0.4\\linewidth}@{}}
    \\hrulefill & & \\hrulefill \\\\
    \\centering (Faculty Signature) & & \\centering (HOD Signature) \\\\
\\end{tabular}
\\vspace{0.5cm}
`;
                }
                break;
            }
            default:
                if ('text' in token) {
                    const t = token as { text: string };
                    latex += escapeLatex(t.text) + '\n';
                }
                break;
        }
    }

    return latex;
}

// Helper to parse inline formats (bold, italic, code)
// Since marked.lexer gives block tokens, inline text often contains **bold** etc.
// marked provides inlineLexer, but simpler regex replacement might be sufficient for "publishing quality" 
// if we don't want to re-run the full lexer for every string. 
// However, strictly, header text is NOT parsed by marked.lexer into inline tokens automatically in the 'text' property?
// Actually yes, it is just a string. 
// Let's implement a robust inline parser or simple replacements.
function parseInline(text: string): string {
    if (!text) return '';

    // Clean text
    let out = text;

    // Escape LaTeX special characters first
    // We must be careful not to escape syntax chars if we do replacements later?
    // Strategy: Escape EVERYTHING first, but then we can't process Markdown syntax.
    // Strategy: Process Markdown syntax, extracting content, escaping content, wrapping in LaTeX.

    // Basic Regex Replacements (Order matters)
    // 1. Code: `code`
    out = out.replace(/`([^`]+)`/g, (match, code) => `\\texttt{${escapeLatex(code)}}`);

    // 2. Bold: **bold** or __bold__
    out = out.replace(/(\*\*|__)(.*?)\1/g, (match, sep, content) => `\\textbf{${parseInline(content)}}`);

    // 3. Italic: *italic* or _italic_
    out = out.replace(/(\*|_)(.*?)\1/g, (match, sep, content) => `\\textit{${parseInline(content)}}`);

    // 4. Images: ![alt](url) -> \includegraphics
    // We assume images are block-level for this report generally, but we use adjustbox 'valign=c' just in case.
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
        if (url === 'NO_IMAGE_AVAILABLE') {
            return `\\begin{center}\\textbf{[Chart generation failed: Connection error]}\\end{center}`;
        }
        return `\\begin{center}\\includegraphics[width=0.85\\linewidth]{${url}}\\end{center}`;
    });

    // 5. Links: [text](url) -> \href{url}{text}
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, txt, url) => `\\href{${url}}{${parseInline(txt)}}`);

    // We need to escape special characters in the "text" parts, but ignoring the LaTeX commands we just inserted?
    // This regex approach is flawed because if I escape first, I break syntax tokens.
    // If I escape last, I escape the \textbf{...} I just added.

    // Better Approach: Use marked.parseInline() to get HTML, then HTML->LaTeX? No.
    // Best Approach: Simple character escaping for remaining text is okay IF we assume the LLM output is mostly clean.
    // But strictly, we should iterate character by character or use a proper tokenizer for inline too.
    // Given "Native LaTeX" requirement, let's just do a reasonably safe escape-then-regex, using unique placeholders?

    // Let's try to escape specific chars that are NOT part of markdown syntax first? No.
    // Let's rely on a simpler single-pass escape function that respects generic text.
    // Or, since we only need simple bold/italic/code/link:

    // We will assume "text" passed here needs escaping EXCEPT for the markdown markup.
    // Actually, marked has an `inlineLexer`. Let's use it if possible? 
    // `marked.lexer` parses blocks. `marked.parseInline` returns string/html.
    // `new marked.Lexer().inline(text)`?
    // Let's stick to a safe regex replacement that escapes "text content" only.

    // Actually, let's keep it simple: 
    // 1. Handle code blocks (protect them).
    // 2. Handle bold/italic.
    // 3. Escape the rest.

    // Simplified safe escape helper
    const simpleEscape = (str: string) => str
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/([&%$#_{}])/g, '\\$1')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}');

    // We have to be careful. The input string contains `**bold**`.
    // If we escape first, we get `**bold**` (starts remain).
    // But if text is `foo & bar`, we get `foo \& bar`.
    // This seems safe to do FIRST, provided we don't accidentally escape the markdown chars `*`, `_`, `[`, `]`, `(`, `)`, `` ` ``.
    // Luckily `*`, `_`, `[`, `]`, `(`, `)` are NOT LaTeX special chars (except `_` and `[` sometimes).
    // `_` IS a special char. So `_italic_` becomes `\_italic\_`.

    // Correct Algorithm:
    // Split string by Markdown tokens (bold/italic/code/link), process them, escape the 'text' parts.

    // For this MVP, let's try a split/map approach on the most common inline patterns.
    // Supports: **bold**, *italic*, `code`.

    const tokens = [];
    let buffer = text;

    // Tokenizer pattern: Code OR Bold OR Italic OR Link OR Text
    const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(!?\[[^\]]*\]\([^)]+\))/g;

    let match;
    let lastIndex = 0;
    let result = "";

    while ((match = pattern.exec(text)) !== null) {
        // Text before match
        const before = text.slice(lastIndex, match.index);
        result += simpleEscape(before);

        const m = match[0];
        if (m.startsWith('`')) {
            // Code
            const content = m.slice(1, -1);
            result += `\\texttt{${simpleEscape(content)}}`;
        } else if (m.startsWith('**')) {
            // Bold
            const content = m.slice(2, -2);
            result += `\\textbf{${parseInline(content)}}`; // Recurse
        } else if (m.startsWith('*')) {
            // Italic
            const content = m.slice(1, -1);
            result += `\\textit{${parseInline(content)}}`; // Recurse
        } else if (m.startsWith('![')) {
            // Image ![alt](url)
            const imgMatch = m.match(/^!\[(.*?)\]\((.*?)\)$/);
            if (imgMatch) {
                // const alt = imgMatch[1];
                const url = imgMatch[2];
                // Safe include with max width
                result += `\\includegraphics[max width=\\linewidth,height=0.3\\textheight,keepaspectratio]{${url}}`;
            }
        } else if (m.startsWith('[')) {
            // Link [text](url)
            const linkMatch = m.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch) {
                const txt = linkMatch[1];
                const url = linkMatch[2];
                result += `\\href{${url}}{${parseInline(txt)}}`;
            }
        } else {
            result += simpleEscape(m);
        }
        lastIndex = pattern.lastIndex;
    }

    // Remaining text
    result += simpleEscape(text.slice(lastIndex));
    return result;
}

function escapeLatex(text: string): string {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/([&%$#_{}])/g, '\\$1')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}');
}


function generateLatexTable(table: Tokens.Table, caption?: string): string {
    // Global Approach: Smart Column Sizing
    // 1. Analyze data to determine max width of text in each column
    // 2. If Header >> Data, wrap header using \makecell to save horizontal space
    // 3. If Data >> Threshold, use X column (L) to wrap data

    const numCols = table.header.length;
    const colMaxLens = new Array(numCols).fill(0);

    // Scan body for max lengths
    for (const row of table.rows) {
        row.forEach((cell: Tokens.TableCell, i: number) => {
            // Simple estimation: generic text length
            // If inline tokens exist, it might be slightly off but good enough heuristic
            const len = cell.text.length;
            if (len > colMaxLens[i]) colMaxLens[i] = len;
        });
    }

    const colTypes: string[] = [];
    const processedHeaders: string[] = [];

    table.header.forEach((cell: Tokens.TableCell, i: number) => {
        const headerText = cell.text;
        const dataLen = colMaxLens[i];

        // Decision 1: Column Type
        // If data is very long (> 30 chars), likely needs wrapping -> Use 'L' (X column)
        // Unless it's the ONLY column? No, standard logic fine.
        let colType = 'l'; // Default

        // Smart Alignment base
        const align = table.align[i] || 'left';

        if (dataLen > 35) {
            colType = align === 'right' ? 'R' : (align === 'center' ? 'C' : 'L');
        } else {
            colType = align === 'right' ? 'r' : (align === 'center' ? 'c' : 'l');
        }

        colTypes.push(colType);

        // Decision 2: Header Wrapping
        // Aggressively wrap if header suggests it is wider than data
        if (headerText.length > dataLen && headerText.includes(' ')) {
            // Split by words, parse each word to escape special chars, then join with LaTeX line break
            const parts = headerText.split(/\s+/);
            const wrapped = parts.map(p => parseInline(p)).join(' \\\\ ');

            // Use \thead[align]{...} which uses \theadfont (bold)
            const cellAlign = colType.toLowerCase() === 'r' ? 'r' : (colType.toLowerCase() === 'c' ? 'c' : 'l');
            processedHeaders.push(`\\thead[${cellAlign}]{${wrapped}}`);
        } else {
            processedHeaders.push(`\\textbf{${parseInline(headerText)}}`); // Standard bold header
        }
    });

    const colSpec = colTypes.join(' ');

    // For wide tables, adjust font size and padding dynamically
    let preTable = '';
    let postTable = '';

    if (numCols > 16) {
        // Very wide tables (Correlation Matrix): smallest font, tightest padding
        preTable = `{\\footnotesize \\setlength{\\tabcolsep}{2pt}\n`;
        postTable = `}\n`;
    } else if (numCols > 14) {
        // Moderately wide tables (Semester Analysis): small font, reduced padding
        preTable = `{\\small \\setlength{\\tabcolsep}{3pt}\n`;
        postTable = `}\n`;
    }
    // <= 14 uses standard font (Faculty Analysis Parameter-wise)

    let latex = `
${preTable}\\begin{xltabular}{\\linewidth}{${colSpec}}
`;

    if (caption) {
        latex += `\\caption{${parseInline(caption)}} \\\\\n`;
    }

    latex += `\\toprule\n`;

    // Header
    latex += processedHeaders.join(' & ') + ' \\\\\n';
    latex += '\\midrule\n';
    latex += '\\endhead\n';

    // Body
    for (const row of table.rows) {
        latex += row.map((cell: Tokens.TableCell) => parseInline(cell.text)).join(' & ') + ' \\\\\n';
    }

    latex += `\\bottomrule
\\end{xltabular}
${postTable}`;
    return latex;
}
