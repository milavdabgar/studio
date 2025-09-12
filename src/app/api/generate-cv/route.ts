import { NextRequest, NextResponse } from 'next/server';
import { LaTeXService } from '@/lib/latex';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const latexService = new LaTeXService();
  
  try {
    const { type = 'detailed' } = await request.json();
    
    let texContent = '';
    
    if (type === 'detailed') {
      // Read the detailed CV template
      const templatePath = path.join(process.cwd(), 'data/reference/cv_detailed.tex');
      try {
        texContent = await fs.readFile(templatePath, 'utf8');
        
        // Remove the profile picture reference since we don't have the image
        texContent = texContent.replace(
          /\\begin{minipage}\[t\]\{0\.25\\textwidth\}[\s\S]*?\\end{minipage}/,
          ''
        );
        
        // Adjust the header to use full width
        texContent = texContent.replace(
          /\\begin{minipage}\[t\]\{0\.7\\textwidth\}/,
          '\\begin{minipage}[t]{0.9\\textwidth}'
        );
        
        // Remove fontawesome5 package if it causes issues
        texContent = texContent.replace('\\usepackage{fontawesome5}', '');
        
        // Replace fontawesome icons with simple text
        texContent = texContent.replace(/\\faIcon\{[^}]+\}\\,/g, '');
        
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'CV template file not found'
        }, { status: 404 });
      }
    } else {
      // Simple CV template
      texContent = `
\\documentclass[11pt,a4paper]{article}
\\usepackage{fontspec}
\\usepackage[top=0.6in, bottom=0.6in, left=0.6in, right=0.6in]{geometry}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\setmainfont{Liberation Serif}
\\definecolor{primary}{RGB}{0, 79, 144}

\\hypersetup{colorlinks=true, linkcolor=primary, urlcolor=primary}
\\pagestyle{empty}

\\titleformat{\\section}{\\color{primary}\\Large\\bfseries}{}{0em}{}[{\\color{primary}\\titlerule[1pt]}]

\\begin{document}

\\begin{center}
{\\Huge\\bfseries\\color{primary} Milav Jayeshkumar Dabgar}

\\vspace{6pt}
{\\Large Engineering Educator \\& R\\&D Professional}

\\vspace{8pt}
\\href{mailto:milav.dabgar@gmail.com}{milav.dabgar@gmail.com} $\\bullet$ +91 8128576285
\\end{center}

\\section{Professional Summary}
Engineering educator and R\\&D professional with 9+ years of comprehensive experience spanning electronics hardware development, embedded systems, AI/ML, and full-stack software engineering. Currently pursuing BS in Data Science and Applications from IIT Madras.

\\section{Education}
\\textbf{Bachelor of Science in Data Science and Applications} (2021 -- Present)\\\\
Indian Institute of Technology Madras | CGPA: 7.07/10

\\textbf{Master of Engineering, Communication Systems} (2013 -- 2015)\\\\
L.D College of Engineering, Gujarat Technological University | CGPA: 8.04/10

\\section{Technical Skills}
\\textbf{Programming:} Java, Python, JavaScript, C/C++, R, SQL\\\\
\\textbf{Web Development:} Next.js, React.js, Vue.js, Node.js, Express.js\\\\
\\textbf{Machine Learning:} TensorFlow, PyTorch, Scikit-learn, Pandas, NumPy\\\\
\\textbf{Infrastructure:} Linux, Docker, CI/CD, Git, GitHub Actions

\\end{document}`;
    }
    
    const result = await latexService.compileLaTeX(texContent, 'cv_milav_detailed', { 
      engine: 'xelatex' 
    });
    
    if (result.success && result.pdfPath) {
      const pdfBuffer = await fs.readFile(result.pdfPath);
      await fs.unlink(result.pdfPath);
      
      return new NextResponse(pdfBuffer as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="cv_milav_${type}.pdf"`,
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