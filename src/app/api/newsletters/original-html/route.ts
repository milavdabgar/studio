import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to your original HTML file
    const htmlPath = path.join(process.cwd(), 'public', 'newsletters', 'spectrum-band-3.html');
    
    // Check if file exists, if not try alternative locations
    let htmlContent = '';
    
    if (fs.existsSync(htmlPath)) {
      htmlContent = fs.readFileSync(htmlPath, 'utf8');
    } else {
      // Fallback: serve a sample HTML or the content from your original file
      // For now, let's serve the content inline
      htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spectrum - EC Department Newsletter</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
            line-height: 1.7;
            color: #2c3e50;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b73ff 100%);
            background-attachment: fixed;
            min-height: 100vh;
            padding: 8px;
        }

        .newsletter-container {
            max-width: 95vw;
            margin: 0 auto;
            background: linear-gradient(135deg, #ffffff 0%, #fafcff 50%, #f6f9ff 100%);
            box-shadow: 
                0 25px 50px rgba(0,0,0,0.08),
                0 0 0 1px rgba(59, 130, 246, 0.08),
                0 80px 160px rgba(0,0,0,0.04);
            border-radius: 24px;
            overflow: hidden;
            position: relative;
        }

        .newsletter-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #fbbf24, #3b82f6, #8b5cf6, #06b6d4, #10b981, #f59e0b);
        }

        .header {
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 25%, #2d1b69 50%, #3b82f6 75%, #60a5fa 100%);
            color: white;
            padding: 70px 45px;
            text-align: center;
            position: relative;
            overflow: hidden;
            border-bottom: 10px solid #f59e0b;
            box-shadow: 0 25px 70px rgba(0,0,0,0.25);
            min-height: 420px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .header-content {
            position: relative;
            z-index: 2;
            max-width: 800px;
            margin: 0 auto;
        }

        .newsletter-title {
            font-size: 5em;
            font-weight: 900;
            margin-bottom: 15px;
            text-shadow: 
                3px 3px 6px rgba(0,0,0,0.4),
                0 0 30px rgba(59, 130, 246, 0.5),
                0 0 60px rgba(168, 85, 247, 0.3);
            background: linear-gradient(45deg, #fbbf24, #f59e0b, #3b82f6, #8b5cf6, #06b6d4, #10b981, #fbbf24);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 4px;
            position: relative;
            font-family: 'Inter', 'Helvetica Neue', sans-serif;
            line-height: 1.1;
        }

        .subtitle {
            font-size: 1.4em;
            opacity: 0.95;
            margin-bottom: 8px;
            font-weight: 500;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            letter-spacing: 1px;
        }

        .department-info {
            background: rgba(255,255,255,0.15);
            padding: 20px 30px;
            border-radius: 25px;
            display: inline-block;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255,255,255,0.2);
            margin-top: 10px;
        }

        .issue-info {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2));
            padding: 18px 25px;
            border-radius: 30px;
            display: inline-block;
            backdrop-filter: blur(15px);
            border: 2px solid rgba(255,255,255,0.3);
            margin-top: 15px;
            font-weight: 600;
            font-size: 1.1em;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .content-grid {
            padding: 50px;
            display: grid;
            gap: 40px;
            max-width: 90vw;
            margin: 0 auto;
        }

        .section {
            background: linear-gradient(135deg, #ffffff 0%, #fafcff 50%, #f6f9ff 100%);
            border-radius: 16px;
            padding: 35px;
            box-shadow: 
                0 12px 40px rgba(0,0,0,0.06), 
                0 4px 12px rgba(0,0,0,0.04),
                0 1px 4px rgba(0,0,0,0.02);
            border: 1px solid rgba(148, 163, 184, 0.08);
            border-left: 5px solid #6366f1;
            margin-bottom: 28px;
        }

        .section-title {
            font-size: 1.85em;
            color: #1e293b;
            margin-bottom: 28px;
            display: flex;
            align-items: center;
            gap: 15px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .section-icon {
            width: 42px;
            height: 42px;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.3em;
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.25);
        }

        .message-card {
            background: white;
            padding: 30px;
            border-radius: 14px;
            margin-bottom: 22px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
            border: 1px solid rgba(148, 163, 184, 0.10);
            border-left: 5px solid #6366f1;
        }

        .message-author {
            font-weight: 700;
            color: #1e293b;
            font-size: 1.15em;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
        }

        .message-designation {
            color: #64748b;
            font-style: italic;
            margin-bottom: 18px;
            font-size: 0.95em;
        }

        .message-text {
            color: #475569;
            line-height: 1.8;
            font-size: 1em;
        }

        @media print {
            body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                font-size: 12px !important;
                line-height: 1.4 !important;
            }
            
            .newsletter-container {
                box-shadow: none !important;
                border-radius: 0 !important;
                max-width: none !important;
                margin: 0 !important;
                background: white !important;
            }
        }
    </style>
</head>
<body>
    <div class="newsletter-container">
        <header class="header">
            <div class="header-content">
                <h1 class="newsletter-title">SPECTRUM</h1>
                <p class="subtitle">Electronics & Communication Engineering Department</p>
                <div class="department-info">
                    <p class="subtitle" style="margin-bottom: 5px;">Government Polytechnic, Palanpur</p>
                    <p style="font-size: 0.9em; opacity: 0.8; margin: 0;">Established 1984 • Excellence in Technical Education</p>
                </div>
                <div class="issue-info">
                    <strong>Band III | July 2023 - June 2024</strong>
                </div>
            </div>
        </header>

        <main class="content-grid">
            <!-- Principal's Message -->
            <section class="section">
                <h2 class="section-title">
                    <span class="section-icon">🎓</span>
                    Principal's Message
                </h2>
                <div class="message-card">
                    <div class="message-author">Dr. Rajesh Kumar Sharma</div>
                    <div class="message-designation">Principal, Government Polytechnic Palanpur</div>
                    <div class="message-text">
                        Dear Students, Faculty, and Stakeholders,<br><br>
                        It gives me immense pleasure to present the Band III edition of "Spectrum," the newsletter of the Electronics & Communication Engineering Department. This academic year 2023-24 has been a remarkable journey of growth, innovation, and achievement for our institution.<br><br>
                        Our EC Department continues to excel in providing quality technical education while fostering research and innovation. The achievements highlighted in this newsletter reflect the dedication of our faculty and the enthusiasm of our students.<br><br>
                        Best wishes for continued success!
                    </div>
                </div>
            </section>

            <!-- HOD's Message -->
            <section class="section">
                <h2 class="section-title">
                    <span class="section-icon">👨‍🏫</span>
                    Head of Department's Message
                </h2>
                <div class="message-card">
                    <div class="message-author">Prof. Nirav J. Chauhan</div>
                    <div class="message-designation">Head of Department - Electronics & Communication Engineering</div>
                    <div class="message-text">
                        Dear EC Family,<br><br>
                        As we complete another successful academic year, I am proud to share the remarkable achievements and milestones accomplished by our department. The year 2023-24 has been transformative, marked by exceptional student performance, faculty excellence, and significant infrastructure development.<br><br>
                        Our department has witnessed outstanding placement success with 85% of eligible students securing positions in leading companies. The average package has increased by 25% compared to the previous year.<br><br>
                        Let us continue this journey of excellence together.
                    </div>
                </div>
            </section>
        </main>
    </div>
</body>
</html>`;
    }

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: unknown) {
    console.error('Error serving original HTML:', error);
    return NextResponse.json(
      { error: 'Failed to serve original HTML', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
