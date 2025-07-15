import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { MockLaTeXService } from './latex-mock';

const execAsync = promisify(exec);

export interface LaTeXOptions {
  engine?: 'pdflatex' | 'xelatex' | 'lualatex';
  outputDir?: string;
  cleanup?: boolean;
}

export interface LaTeXResult {
  success: boolean;
  pdfPath?: string;
  error?: string;
  logs?: string;
}

export class LaTeXService {
  private tmpDir: string;

  constructor(tmpDir?: string) {
    // Auto-detect environment and set appropriate tmp directory
    if (tmpDir) {
      this.tmpDir = tmpDir;
    } else if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV) {
      this.tmpDir = '/app/tmp';
    } else {
      // Local development - use OS temp directory
      this.tmpDir = path.join(process.cwd(), 'tmp');
    }
  }

  async compileLaTeX(
    texContent: string, 
    filename: string = 'document',
    options: LaTeXOptions = {}
  ): Promise<LaTeXResult> {
    const { 
      engine = 'xelatex', 
      outputDir = this.tmpDir,
      cleanup = true 
    } = options;

    const texFile = path.join(outputDir, `${filename}.tex`);
    const pdfFile = path.join(outputDir, `${filename}.pdf`);

    try {
      // Check if LaTeX engine is available
      try {
        await execAsync(`which ${engine}`, { timeout: 5000 });
      } catch (error) {
        // If in development and LaTeX not available, use mock service
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚠️  LaTeX not installed locally, using mock service for development`);
          const mockService = new MockLaTeXService();
          return await mockService.compileLaTeX(texContent, filename, options);
        }
        
        return {
          success: false,
          error: `LaTeX engine '${engine}' is not installed or not in PATH. Please install LaTeX (e.g., MacTeX, TeX Live, or MiKTeX) to use this feature locally.`
        };
      }

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Write LaTeX content to file
      await fs.writeFile(texFile, texContent, 'utf8');

      // Compile with selected engine
      const command = `${engine} -output-directory="${outputDir}" -interaction=nonstopmode "${texFile}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: outputDir,
        timeout: 30000 // 30 second timeout
      });

      // Check if PDF was generated
      try {
        await fs.access(pdfFile);
        
        if (cleanup) {
          // Clean up auxiliary files but keep PDF
          const auxFiles = ['.aux', '.log', '.fls', '.fdb_latexmk'];
          for (const ext of auxFiles) {
            try {
              await fs.unlink(path.join(outputDir, `${filename}${ext}`));
            } catch (e) {
              // Ignore if file doesn't exist
            }
          }
          await fs.unlink(texFile);
        }

        return {
          success: true,
          pdfPath: pdfFile,
          logs: stdout
        };
      } catch (e) {
        return {
          success: false,
          error: `PDF compilation failed: ${stderr}`,
          logs: stdout
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Predefined templates for common documents
  static templates = {
    report: (title: string, content: string) => `
\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{xcolor}
\\usepackage{geometry}
\\usepackage{fancyhdr}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{booktabs}

\\geometry{margin=1in}
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{\\thepage}
\\lhead{${title}}

\\title{${title}}
\\date{\\today}

\\begin{document}
\\maketitle
\\tableofcontents
\\newpage

${content}

\\end{document}`,

    invoice: (invoiceData: {
      number: string;
      date: string;
      clientName: string;
      items: Array<{description: string, quantity: number, rate: number}>;
    }) => {
      const itemsLatex = invoiceData.items.map(item => 
        `${item.description} & ${item.quantity} & \\$${item.rate.toFixed(2)} & \\$${(item.quantity * item.rate).toFixed(2)} \\\\`
      ).join('\n');
      
      const total = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

      return `
\\documentclass{article}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{xcolor}
\\usepackage{geometry}
\\geometry{margin=1in}

\\begin{document}

\\begin{center}
{\\Large \\textbf{INVOICE}}
\\end{center}

\\vspace{1cm}

\\begin{tabular}{ll}
\\textbf{Invoice Number:} & ${invoiceData.number} \\\\
\\textbf{Date:} & ${invoiceData.date} \\\\
\\textbf{Client:} & ${invoiceData.clientName} \\\\
\\end{tabular}

\\vspace{2cm}

\\begin{tabular}{p{6cm}|c|c|c}
\\textbf{Description} & \\textbf{Qty} & \\textbf{Rate} & \\textbf{Amount} \\\\
\\hline
${itemsLatex}
\\hline
\\multicolumn{3}{r|}{\\textbf{Total:}} & \\textbf{\\$${total.toFixed(2)}} \\\\
\\end{tabular}

\\end{document}`;
    },

    resume: (resumeData: {
      name: string;
      email: string;
      phone: string;
      sections: Array<{title: string, content: string}>;
    }) => `
\\documentclass[11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\usepackage{xcolor}
\\usepackage{titlesec}

\\geometry{margin=0.75in}
\\definecolor{primary}{RGB}{0, 100, 200}

\\titleformat{\\section}{\\color{primary}\\Large\\bfseries}{}{0em}{}[\\titlerule]

\\begin{document}

\\begin{center}
{\\Huge \\textbf{${resumeData.name}}}\\\\
\\vspace{0.5cm}
${resumeData.email} $\\cdot$ ${resumeData.phone}
\\end{center}

\\vspace{1cm}

${resumeData.sections.map(section => `
\\section{${section.title}}
${section.content}
`).join('\n')}

\\end{document}`
  };
}