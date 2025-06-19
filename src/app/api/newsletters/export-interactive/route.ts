import { NextRequest, NextResponse } from 'next/server';
import { ContentConverterV2 } from '@/lib/content-converter-v2';

// Import Puppeteer for direct React component to PDF conversion
let puppeteer: any;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.log('Puppeteer not available, PDF generation will be limited');
}

// Interactive Newsletter Component Data - Updated with Real Content
const interactiveNewsletterData = {
  stats: [
    { label: 'Placement Rate', value: 100, color: 'bg-blue-500' },
    { label: 'Research Papers', value: 20, color: 'bg-green-500' },
    { label: 'Students Placed', value: 4, color: 'bg-purple-500' },
    { label: 'Highest Package (L)', value: 4.5, color: 'bg-orange-500' },
  ],
  achievements: [
    {
      category: 'Faculty Excellence',
      items: [
        'Prof. Nirav J. Chauhan - Leading NCET-2024 conference organization and research excellence',
        'Ms. Mittal K. Pedhadiya - Editorial excellence and academic coordination',
        'Mr. Milav J. Dabgar - Technical innovation and newsletter coordination',
        'Faculty Research Team - Multiple publications in reputed journals'
      ]
    },
    {
      category: 'Student Success',
      items: [
        'Sahil S. Vaghela - Placed at Micron Technology as Process Technician (₹4.5L)',
        'Bharat S. Pawar - Placed at Micron Technology as Manufacturing Associate (₹3.7L)',
        'Maitri R. Patel - Placed at TDSC Becharaji as Trainee Engineer (₹3.0L)',
        'Stutiben A. Raval - Placed at TDSC Becharaji as Trainee Engineer (₹3.0L)',
        'Srujal Y. Chaudhary - Pursuing B.E. at VEGC, Chandkheda for higher studies'
      ]
    },
    {
      category: 'Research & Innovation',
      items: [
        'SSIP initiatives with ₹50,000 prize-winning rover project',
        'Multiple patents filed in electronics and communication domain',
        'Industry collaborations for practical learning',
        'Student innovation projects receiving state-level recognition'
      ]
    }
  ],
  placements: [
    { company: 'Micron Technology', package: '₹4.5L', students: 2, position: 'Process Technician / Manufacturing Associate' },
    { company: 'TDSC Becharaji', package: '₹3.0L', students: 2, position: 'Trainee Engineer' }
  ],
  events: [
    {
      title: 'National Conference on Emerging Technologies (NCET-2024)',
      date: 'December 15-16, 2023',
      description: 'Two-day national conference focusing on cutting-edge technologies in electronics and communication with keynote speeches, technical papers, and workshops on IoT, 5G, and AI applications.',
      images: [
        {
          src: '/newsletters/imgs/WhatsApp Image 2024-05-03 at 17.40.56.jpeg',
          alt: 'NCET-2024 Inauguration',
          caption: 'Conference Inauguration'
        },
        {
          src: '/newsletters/imgs/WhatsApp Image 2024-05-03 at 17.40.59.jpeg',
          alt: 'NCET-2024 Technical Session',
          caption: 'Technical Session'
        },
        {
          src: '/newsletters/imgs/WhatsApp Image 2024-05-03 at 17.41.00.jpeg',
          alt: 'NCET-2024 Award Ceremony',
          caption: 'Award Ceremony'
        }
      ]
    },
    {
      title: 'Orientation Program 2024',
      date: 'June 3, 2024',
      description: 'Comprehensive orientation program for newly admitted students, introducing them to department facilities, curriculum, and career opportunities in electronics and communication engineering.',
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0035-1024x766.jpg',
          alt: 'Orientation Welcome',
          caption: 'Welcome Session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0037-1024x766.jpg',
          alt: 'Orientation Session',
          caption: 'Department Overview'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0038-1024x766.jpg',
          alt: 'Student Interaction',
          caption: 'Student Interaction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0040-1024x766.jpg',
          alt: 'Faculty Address',
          caption: 'Faculty Address'
        }
      ]
    },
    {
      title: 'RTL Design Workshop',
      date: 'June 11, 2024',
      description: 'Intensive hands-on workshop on Register Transfer Level (RTL) design using industry-standard tools and methodologies. Students learned VLSI design flow, HDL programming, and digital circuit synthesis.',
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0048-1024x459.jpg',
          alt: 'RTL Workshop Session',
          caption: 'Workshop Session 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0055-1024x459.jpg',
          alt: 'RTL Workshop Session',
          caption: 'Workshop Session 2'
        }
      ]
    }
  ],
  messages: {
    principal: {
      name: 'Dr. Rajesh Kumar Sharma',
      designation: 'Principal, Government Polytechnic Palanpur',
      message: `Dear Students, Faculty, and Stakeholders,

It gives me immense pleasure to introduce this edition of "Spectrum," the newsletter of our Electronics & Communication Engineering Department. Our institution, established in 1984, has been a beacon of technical education in North Gujarat, consistently producing skilled professionals who contribute significantly to the industry and society.

The academic year 2023-24 has been remarkable for our EC department, with students excelling in competitions, faculty contributing to research, and our SSIP cell fostering innovation. Our focus remains on providing quality education that blends theoretical knowledge with practical skills, preparing our students for the dynamic world of technology.

I congratulate the entire EC department team for their dedication and encourage our students to continue their pursuit of excellence.`
    },
    hod: {
      name: 'Prof. Nirav J. Chauhan',
      designation: 'Head of Department - Electronics & Communication Engineering',
      message: `Dear EC Family,

The Electronics & Communication Engineering department continues to evolve with emerging technologies and industry demands. This year has been particularly significant as we've strengthened our curriculum with advanced topics in IoT, VLSI, and communication systems.

Our students have shown exceptional performance in various competitions, including the G3Q quiz where our team secured top positions. The department's research initiatives have gained momentum with faculty publications and student innovation projects receiving recognition.

As we look ahead, our commitment remains steadfast - to nurture competent engineers who can contribute meaningfully to the technological advancement of our nation. I extend my heartfelt appreciation to our dedicated faculty and motivated students for making this journey rewarding.`
    },
    editorial: {
      name: 'Editorial Team',
      designation: 'Ms. Mittal K. Pedhadiya & Mr. Milav J. Dabgar',
      message: `Welcome to the third edition of Spectrum, chronicling the remarkable journey of our Electronics & Communication Engineering department during 2023-24.

This edition captures the essence of our department's growth - from academic achievements and research publications to student innovations and industry collaborations. We've witnessed our students excel in competitions, our faculty contribute to cutting-edge research, and our department strengthen its position in technical education.

Special recognition goes to our SSIP initiatives that have resulted in multiple patents and the prestigious ₹50,000 prize-winning rover project. These achievements reflect our commitment to innovation and practical learning.

We hope this newsletter serves as a source of inspiration and information for our extended EC family.`
    }
  },
  vision: "To prepare competent diploma level electronics and communication engineers, catering the needs of industries and society as an excellent employee, innovator, and entrepreneur with moral values.",
  mission: [
    "Provide quality education in the field of EC engineering",
    "Develop state of art laboratories and classrooms", 
    "Strengthen industrial liaison services",
    "Execute activities to inculcate innovation and entrepreneurship"
  ],
  logos: [
    {
      src: '/newsletters/imgs/gpp-logo.png',
      alt: 'Government Polytechnic Palanpur Logo'
    },
    {
      src: '/newsletters/imgs/ec-logo.png', 
      alt: 'EC Department Logo'
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
        
        .message-section {
            background: white;
            margin-bottom: 2rem;
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border-left: 4px solid #3b82f6;
        }
        
        .message-author {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }
        
        .message-designation {
            font-size: 1rem;
            color: #6b7280;
            margin-bottom: 1rem;
            font-style: italic;
        }
        
        .message-text {
            color: #4b5563;
            line-height: 1.7;
            white-space: pre-line;
        }
        
        .vision-mission-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-top: 1rem;
        }
        
        .vision-card, .mission-card {
            background: #f8fafc;
            padding: 2rem;
            border-radius: 0.75rem;
            border: 1px solid #e2e8f0;
        }
        
        .vision-card {
            border-left: 4px solid #3b82f6;
        }
        
        .mission-card {
            border-left: 4px solid #10b981;
        }
        
        .vision-title, .mission-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .vision-title {
            color: #1e40af;
        }
        
        .mission-title {
            color: #065f46;
        }
        
        .mission-list {
            list-style: none;
            padding: 0;
        }
        
        .mission-list li {
            padding: 0.75rem 0;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .mission-list li:last-child {
            border-bottom: none;
        }
        
        .header-logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .header-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            background: white;
            padding: 0.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .event-images {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .event-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 0.5rem;
            box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
        }
        
        .event-image-caption {
            text-align: center;
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 0.25rem;
        }
        
        @media print {
            body {
                background: white;
            }
            .container {
                padding: 1rem;
            }
            .section, .message-section {
                box-shadow: none;
                border: 1px solid #e5e7eb;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${data.logos ? `
            <div class="header-logos">
                ${data.logos.map(logo => `
                    <img src="${logo.src}" alt="${logo.alt}" class="header-logo" />
                `).join('')}
            </div>
            ` : ''}
            <h1>Spectrum Newsletter</h1>
            <p>Department of Electronics & Communication Engineering</p>
            <p>Government Polytechnic, Palanpur</p>
            <p>Band III • Academic Year 2023-24</p>
        </div>
        
        <div class="stats-grid">
            ${data.stats.map(stat => `
                <div class="stat-card">
                    <div class="stat-value">${stat.value}${stat.label.includes('Package') ? '' : stat.label.includes('Rate') ? '%' : ''}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            `).join('')}
        </div>
        
        ${data.messages ? `
        <div class="message-section">
            <h2 class="section-title">� Principal's Message</h2>
            <div class="message-author">${data.messages.principal.name}</div>
            <div class="message-designation">${data.messages.principal.designation}</div>
            <div class="message-text">${data.messages.principal.message}</div>
        </div>
        
        <div class="message-section">
            <h2 class="section-title">👨‍🏫 Head of Department's Message</h2>
            <div class="message-author">${data.messages.hod.name}</div>
            <div class="message-designation">${data.messages.hod.designation}</div>
            <div class="message-text">${data.messages.hod.message}</div>
        </div>
        
        <div class="message-section">
            <h2 class="section-title">✍️ Editor's Note</h2>
            <div class="message-author">${data.messages.editorial.name}</div>
            <div class="message-designation">${data.messages.editorial.designation}</div>
            <div class="message-text">${data.messages.editorial.message}</div>
        </div>
        ` : ''}
        
        ${data.vision && data.mission ? `
        <div class="section">
            <h2 class="section-title">🎯 Vision & Mission</h2>
            <div class="vision-mission-grid">
                <div class="vision-card">
                    <h3 class="vision-title">🔭 Vision</h3>
                    <p>${data.vision}</p>
                </div>
                <div class="mission-card">
                    <h3 class="mission-title">🎯 Mission</h3>
                    <ul class="mission-list">
                        ${data.mission.map(item => `
                            <li>
                                <span style="color: #10b981; font-size: 1.2rem;">✓</span>
                                <span>${item}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="section">
            <h2 class="section-title">�🏆 Achievements & Recognition</h2>
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
            <h2 class="section-title">💼 Placements & Higher Studies 2023-24</h2>
            <div class="placements-grid">
                ${data.placements.map(placement => `
                    <div class="placement-card">
                        <div class="placement-company">${placement.company}</div>
                        <div class="placement-package">Package: ${placement.package}</div>
                        <div class="placement-students">${placement.students} students placed</div>
                        ${placement.position ? `<div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">${placement.position}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📅 Key Events & Activities</h2>
            <div class="events-list">
                ${data.events.map(event => `
                    <div class="event-card">
                        <div class="event-title">${event.title}</div>
                        <div class="event-date">${event.date}</div>
                        <div class="event-description">${event.description}</div>
                        ${event.images ? `
                        <div class="event-images">
                            ${event.images.map(image => `
                                <div>
                                    <img src="${image.src}" alt="${image.alt}" class="event-image" />
                                    <div class="event-image-caption">${image.caption}</div>
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
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

// Generate PDF from HTML using Puppeteer with better error handling
async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  if (!puppeteer) {
    throw new Error('Puppeteer is not available for PDF generation');
  }

  let browser;
  try {
    // Try with full configuration first
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
        ],
        timeout: 60000
      });
    } catch (launchError) {
      console.log('Full launch config failed, trying minimal config:', launchError);
      // Fallback to minimal configuration
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 30000
      });
    }

    const page = await browser.newPage();
    
    // Set viewport and other page settings
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
    });
    
    // Set content with longer timeout and better error handling
    await page.setContent(htmlContent, { 
      waitUntil: ['load', 'domcontentloaded'],
      timeout: 60000 
    });

    // Wait for fonts (with fallback)
    try {
      await page.evaluateHandle('document.fonts.ready');
    } catch (fontsError) {
      console.log('Fonts ready check failed, continuing:', fontsError);
    }

    // Wait a bit more for any CSS animations or dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));

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
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      timeout: 60000,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
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

    console.log(`[Interactive Export] Processing ${format} export...`);

    // Generate static HTML from component data
    const htmlContent = generateStaticHtml(interactiveNewsletterData);
    
    // Handle different export formats
    switch (format) {
      case 'pdf': {
        try {
          console.log('[Interactive Export] Generating PDF...');
          const pdfBuffer = await generatePdfFromHtml(htmlContent);
          console.log('[Interactive Export] PDF generation successful');
          
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="Spectrum-Interactive-Newsletter-${new Date().toISOString().split('T')[0]}.pdf"`,
            },
          });
        } catch (pdfError) {
          console.error('[Interactive Export] PDF generation failed:', pdfError);
          return NextResponse.json(
            { 
              error: 'PDF generation failed. This might be due to Puppeteer configuration issues in the development environment.',
              details: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error',
              suggestion: 'Try exporting as HTML or DOCX format instead.'
            },
            { status: 500 }
          );
        }
      }
      
      case 'html': {
        console.log('[Interactive Export] Generating HTML...');
        return new NextResponse(htmlContent, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="Spectrum-Interactive-Newsletter-${new Date().toISOString().split('T')[0]}.html"`,
          },
        });
      }
      
      case 'docx':
      case 'rtf': {
        try {
          console.log(`[Interactive Export] Generating ${format.toUpperCase()}...`);
          
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
            
          console.log(`[Interactive Export] ${format.toUpperCase()} generation successful`);
          
          return new NextResponse(convertedContent, {
            headers: {
              'Content-Type': mimeType,
              'Content-Disposition': `attachment; filename="Spectrum-Interactive-Newsletter-${new Date().toISOString().split('T')[0]}.${format}"`,
            },
          });
        } catch (conversionError) {
          console.error(`[Interactive Export] ${format.toUpperCase()} generation failed:`, conversionError);
          return NextResponse.json(
            { 
              error: `${format.toUpperCase()} generation failed`,
              details: conversionError instanceof Error ? conversionError.message : 'Unknown conversion error',
              suggestion: 'Try exporting as HTML format instead.'
            },
            { status: 500 }
          );
        }
      }
      
      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Interactive Export] General error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export newsletter',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try again or contact support if the issue persists.'
      },
      { status: 500 }
    );
  }
}
