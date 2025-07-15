import { LaTeXResult } from './latex';

export class MockLaTeXService {
  async compileLaTeX(
    texContent: string, 
    filename: string = 'document',
    options: any = {}
  ): Promise<LaTeXResult> {
    
    // Simulate compilation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create a simple mock PDF (minimal valid PDF structure)
    const mockPDF = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length 68
>>
stream
BT
/F1 12 Tf
100 700 Td
(Mock LaTeX PDF - Local Development) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
435
%%EOF`);
    
    // Write mock PDF to temp file
    const fs = require('fs').promises;
    const path = require('path');
    
    const tmpDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tmpDir, { recursive: true });
    
    const pdfPath = path.join(tmpDir, `${filename}.pdf`);
    await fs.writeFile(pdfPath, mockPDF);
    
    return {
      success: true,
      pdfPath: pdfPath,
      logs: `Mock LaTeX compilation successful for ${filename}.tex with engine ${options.engine || 'xelatex'}`
    };
  }
  
  static templates = {
    report: (title: string, content: string) => `Mock LaTeX Report: ${title}`,
    invoice: (invoiceData: any) => `Mock LaTeX Invoice: ${invoiceData.number}`,
    resume: (resumeData: any) => `Mock LaTeX Resume: ${resumeData.name}`
  };
}