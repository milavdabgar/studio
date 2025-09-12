import { NextRequest, NextResponse } from 'next/server';
import { LaTeXService } from '@/lib/latex';
import fs from 'fs/promises';

export async function GET() {
  const latexService = new LaTeXService();
  
  // Test document with various LaTeX features
  const testDocument = `
\\documentclass[12pt]{article}
\\usepackage{xcolor}
\\usepackage{amsmath}
\\usepackage{geometry}
\\usepackage{fontspec}
\\geometry{margin=1in}

\\title{LaTeX Integration Test}
\\author{Studio App}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Typography Test}
This document tests various LaTeX capabilities in the Studio application.

\\subsection{Unicode Support}
XeLaTeX supports Unicode characters: αβγδε, 你好世界, العربية, 🚀

\\subsection{Mathematics}
LaTeX excels at mathematical typesetting:
\\[
E = mc^2
\\]

\\[
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
\\]

\\subsection{Colors}
\\textcolor{blue}{Blue text}, \\textcolor{red}{red text}, and \\textcolor{green}{green text}.

\\section{Lists}
\\begin{itemize}
\\item Feature reports
\\item Newsletter generation  
\\item Resume creation
\\item Invoice templates
\\end{itemize}

\\section{Tables}
\\begin{tabular}{|l|c|r|}
\\hline
Feature & Status & Priority \\\\
\\hline
LaTeX Support & ✓ Working & High \\\\
PDF Generation & ✓ Working & High \\\\
Template System & ✓ Working & Medium \\\\
\\hline
\\end{tabular}

\\end{document}`;

  try {
    const result = await latexService.compileLaTeX(testDocument, 'latex-test');
    
    if (result.success && result.pdfPath) {
      // Read the PDF file
      const pdfBuffer = await fs.readFile(result.pdfPath);
      
      // Clean up the file
      await fs.unlink(result.pdfPath);
      
      return new NextResponse(pdfBuffer as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="latex-test.pdf"',
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        logs: result.logs
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const latexService = new LaTeXService();
  
  try {
    const body = await request.json();
    const { texContent, filename = 'custom-document', engine = 'xelatex' } = body;
    
    if (!texContent) {
      return NextResponse.json({
        success: false,
        error: 'texContent is required'
      }, { status: 400 });
    }
    
    const result = await latexService.compileLaTeX(texContent, filename, { engine });
    
    if (result.success && result.pdfPath) {
      const pdfBuffer = await fs.readFile(result.pdfPath);
      await fs.unlink(result.pdfPath);
      
      return new NextResponse(pdfBuffer as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}.pdf"`,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        logs: result.logs
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}