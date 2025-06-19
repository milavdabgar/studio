import { NextRequest, NextResponse } from 'next/server';
import { ContentConverterV2 } from '@/lib/content-converter-v2';

// Import Puppeteer for direct React component to PDF conversion
let puppeteer: any;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.log('Puppeteer not available, PDF generation will be limited');
}

// Interactive Newsletter Component Data
const interactiveNewsletterData = {
  stats: [
    { label: 'Placement Rate', value: 85, color: 'bg-blue-500' },
    { label: 'Research Papers', value: 20, color: 'bg-green-500' },
    { label: 'Students', value: 150, color: 'bg-purple-500' },
    { label: 'Avg Package (L)', value: 4.8, color: 'bg-orange-500' },
  ],
  achievements: [
    {
      category: 'Faculty Excellence',
      items: [
        'Prof. Nirav J. Chauhan - Best Paper Award at NCET-2024',
        'Dr. Meera R. Patel - Outstanding Faculty Researcher Award',
        'Prof. Kiran B. Shah - Patent grant for Energy Harvesting System',
        'Ms. Mittal K. Pedhadiya - Ph.D. completion in Digital Signal Processing'
      ]
    },
    {
      category: 'Student Success',
      items: [
        'Ravi Kumar Patel - 1st Rank in GTU BE-EC (CGPA: 9.85)',
        'Team TechInnovators - 1st Prize in Smart India Hackathon 2024',
        'Rohit Desai - 2nd Prize in IEEE National Student Competition',
        'Best Innovation Award at Gujarat Technical Festival 2024'
      ]
    },
    {
      category: 'Infrastructure',
      items: [
        'New IoT & Embedded Systems Lab (₹15 lakhs)',
        '5G Communication Systems Lab Upgrade (₹18 lakhs)',
        'State-of-the-art Testing Equipment Installation',
        'Digital Signal Processing Lab Enhancement'
      ]
    }
  ],
  placements: [
    { company: 'Infosys', package: '6.5 LPA', students: 12 },
    { company: 'TCS', package: '4.2 LPA', students: 18 },
    { company: 'Wipro', package: '5.8 LPA', students: 8 },
    { company: 'Tech Mahindra', package: '5.2 LPA', students: 6 },
    { company: 'L&T Infotech', package: '7.2 LPA', students: 4 },
    { company: 'Accenture', package: '6.8 LPA', students: 7 }
  ],
  events: [
    {
      title: 'National Conference on Emerging Technologies (NCET-2024)',
      date: 'March 15-16, 2024',
      description: 'Two-day conference featuring latest research in Electronics & Communication'
    },
    {
      title: 'Industry-Academia Meet 2024',
      date: 'January 20, 2024',
      description: 'Interactive session with industry experts from leading tech companies'
    },
    {
      title: 'Technical Symposium - TechFest 2024',
      date: 'February 8-9, 2024',
      description: 'Student-organized technical event with competitions and workshops'
    }
  ]
};

// Generate static HTML from React component data
function generateStaticHtml(data: typeof interactiveNewsletterData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spectrum Newsletter - Band 3 (2023-24)</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f9fafb;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 2rem;
            border-radius: 1rem;
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.25rem;
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        
        .stat-card {
            background: white;
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            text-align: center;
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: 800;
            color: #1f2937;
        }
        
        .stat-label {
            font-size: 1rem;
            color: #6b7280;
            margin-top: 0.5rem;
        }
        
        .section {
            background: white;
            margin-bottom: 2rem;
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .section-title {
            font-size: 1.875rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.5rem;
        }
        
        .achievements-grid {
            display: grid;
            gap: 2rem;
        }
        
        .achievement-category {
            margin-bottom: 2rem;
        }
        
        .category-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .achievement-list {
            list-style: none;
        }
        
        .achievement-list li {
            padding: 0.75rem 1rem;
            margin-bottom: 0.5rem;
            background: #f3f4f6;
            border-radius: 0.5rem;
            border-left: 4px solid #3b82f6;
        }
        
        .placements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        .placement-card {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 0.5rem;
            border: 1px solid #e2e8f0;
        }
        
        .placement-company {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
        }
        
        .placement-package {
            font-size: 1rem;
            color: #059669;
            font-weight: 500;
        }
        
        .placement-students {
            font-size: 0.875rem;
            color: #64748b;
        }
        
        .events-list {
            display: grid;
            gap: 1.5rem;
        }
        
        .event-card {
            background: #fefefe;
            padding: 1.5rem;
            border-radius: 0.5rem;
            border-left: 4px solid #8b5cf6;
        }
        
        .event-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }
        
        .event-date {
            font-size: 0.875rem;
            color: #7c3aed;
            font-weight: 500;
            margin-bottom: 0.5rem;
        }
        
        .event-description {
            color: #64748b;
            line-height: 1.6;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 0.5rem;
        }
        
        .contact-icon {
            width: 20px;
            height: 20px;
            color: #3b82f6;
        }
        
        @media print {
            body {
                background: white;
            }
            .container {
                padding: 1rem;
            }
            .section {
                box-shadow: none;
                border: 1px solid #e5e7eb;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Spectrum Newsletter</h1>
            <p>Department of Electronics & Communication Engineering</p>
            <p>Band 3 • Academic Year 2023-24</p>
        </div>
        
        <div class="stats-grid">
            ${data.stats.map(stat => `
                <div class="stat-card">
                    <div class="stat-value">${stat.value}${stat.label.includes('Package') ? '' : stat.label.includes('Rate') ? '%' : ''}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2 class="section-title">🏆 Achievements & Recognition</h2>
            <div class="achievements-grid">
                ${data.achievements.map(achievement => `
                    <div class="achievement-category">
                        <h3 class="category-title">${achievement.category}</h3>
                        <ul class="achievement-list">
                            ${achievement.items.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">💼 Placements 2023-24</h2>
            <div class="placements-grid">
                ${data.placements.map(placement => `
                    <div class="placement-card">
                        <div class="placement-company">${placement.company}</div>
                        <div class="placement-package">Package: ${placement.package}</div>
                        <div class="placement-students">${placement.students} students placed</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📅 Key Events</h2>
            <div class="events-list">
                ${data.events.map(event => `
                    <div class="event-card">
                        <div class="event-title">${event.title}</div>
                        <div class="event-date">${event.date}</div>
                        <div class="event-description">${event.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📞 Contact Information</h2>
            <div class="contact-grid">
                <div class="contact-item">
                    <span class="contact-icon">📍</span>
                    <span>Government Polytechnic, Palanpur, Gujarat 385001</span>
                </div>
                <div class="contact-item">
                    <span class="contact-icon">📧</span>
                    <span>ec.dept@gppalanpur.edu.in</span>
                </div>
                <div class="contact-item">
                    <span class="contact-icon">📞</span>
                    <span>+91 2742 251234</span>
                </div>
                <div class="contact-item">
                    <span class="contact-icon">🌐</span>
                    <span>www.gppalanpur.edu.in</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate PDF from HTML using Puppeteer
async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  if (!puppeteer) {
    throw new Error('Puppeteer is not available for PDF generation');
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ]
    });

    const page = await browser.newPage();
    
    // Set content and wait for any dynamic content to load
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Generate PDF with optimal settings for newsletter
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Convert HTML to simple Markdown for DOCX/RTF export
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<ul[^>]*>|<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>|<\/ol>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div[^>]*class="[^"]*stat-value[^"]*"[^>]*>(.*?)<\/div>/gi, '**$1**')
    .replace(/<div[^>]*class="[^"]*stat-label[^"]*"[^>]*>(.*?)<\/div>/gi, '*$1*')
    .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
    .replace(/[\u{1F600}-\u{1F6FF}][\u{1F300}-\u{1F5FF}][\u{1F680}-\u{1F6FF}][\u{1F1E0}-\u{1F1FF}]/gu, '') // Remove emojis
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { format } = requestData;
    
    if (!format || !['pdf', 'docx', 'rtf', 'html'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: pdf, docx, rtf, html' },
        { status: 400 }
      );
    }

    // Generate static HTML from component data
    const htmlContent = generateStaticHtml(interactiveNewsletterData);
    
    // Handle different export formats
    switch (format) {
      case 'pdf': {
        const pdfBuffer = await generatePdfFromHtml(htmlContent);
        
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Spectrum-Interactive-Newsletter-${new Date().toISOString().split('T')[0]}.pdf"`,
          },
        });
      }
      
      case 'html': {
        return new NextResponse(htmlContent, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="Spectrum-Interactive-Newsletter-${new Date().toISOString().split('T')[0]}.html"`,
          },
        });
      }
      
      case 'docx':
      case 'rtf': {
        // Convert HTML to Markdown for better document conversion
        const markdownContent = htmlToMarkdown(htmlContent);
        
        // Use the existing content converter
        const converter = new ContentConverterV2();
        const convertedContent = await converter.convert(
          markdownContent,
          format as 'docx' | 'rtf'
        );
        
        const mimeType = format === 'docx' 
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/rtf';
          
        return new NextResponse(convertedContent, {
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="Spectrum-Interactive-Newsletter-${new Date().toISOString().split('T')[0]}.${format}"`,
          },
        });
      }
      
      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export newsletter: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
