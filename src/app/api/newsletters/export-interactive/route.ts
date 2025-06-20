import { NextRequest, NextResponse } from 'next/server';
import { ContentConverterV2 } from '@/lib/content-converter-v2';
import { newsletterData, getNewsletterDataByYear, type NewsletterData } from '@/lib/newsletter-data';
import fs from 'fs';
import path from 'path';

// Import Puppeteer for direct React component to PDF conversion
let puppeteer: any;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.log('Puppeteer not available, PDF generation will be limited');
}

// Helper function to convert local images to base64 data URLs
function getImageAsBase64(imagePath: string): string {
  try {
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    console.log(`Attempting to load image from: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`Image file not found: ${fullPath}`);
      return '';
    }
    
    const imageBuffer = fs.readFileSync(fullPath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    console.log(`Successfully converted image to base64: ${imagePath}`);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Failed to load image: ${imagePath}`, error);
    return '';
  }
}

// Using centralized newsletter data

// Generate static HTML from React component data
function generateStaticHtml(data: NewsletterData, year: string = '2023-24'): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spectrum Newsletter - Band 3 (${year})</title>
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
        
        .canvas-grid {
            display: grid;
            gap: 1.5rem;
        }
        
        .canvas-item {
            background: #fefefe;
            padding: 1.5rem;
            border-radius: 0.5rem;
            border-left: 4px solid #f59e0b;
            margin-bottom: 1rem;
        }
        
        .canvas-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }
        
        .canvas-category {
            font-size: 0.875rem;
            color: #f59e0b;
            font-weight: 500;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
        }
        
        .canvas-content {
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 0.75rem;
        }
        
        .canvas-author {
            font-style: italic;
            color: #6b7280;
            text-align: right;
            font-size: 0.875rem;
        }
        
        .achievement-item {
            background: #fefefe;
            padding: 1.5rem;
            border-radius: 0.5rem;
            border-left: 4px solid #10b981;
            margin-bottom: 1rem;
        }
        
        .achievement-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }
        
        .achievement-category {
            font-size: 0.875rem;
            color: #10b981;
            font-weight: 500;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
        }
        
        .achievement-description {
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 0.75rem;
        }
        
        .achievement-person {
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.25rem;
        }
        
        .achievement-details {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
        }
        
        .achievement-date {
            font-size: 0.875rem;
            color: #9ca3af;
            font-style: italic;
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
                ${data.logos.map(logo => {
                  const base64Src = getImageAsBase64(logo.src);
                  return base64Src ? `<img src="${base64Src}" alt="${logo.alt}" class="header-logo" />` : '';
                }).join('')}
            </div>
            ` : ''}
            <h1>Spectrum Newsletter</h1>
            <p>Department of Electronics & Communication Engineering</p>
            <p>Government Polytechnic, Palanpur</p>
            <p>Band III • Academic Year ${year}</p>
        </div>
        
        <div class="stats-grid">
            ${data.stats.map(stat => `
                <div class="stat-card">
                    <div class="stat-value">${stat.value}${stat.label.includes('Package') ? '' : stat.label.includes('Rate') ? '%' : ''}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            `).join('')}
        </div>
        
        <!-- Department Overview Section -->
        <div class="section">
            <h2 class="section-title">� Essence - Department Overview</h2>
            <div class="content-card" style="padding: 1.5rem; background: #f9fafb; border-radius: 0.75rem; margin-bottom: 1.5rem;">
                <p style="margin-bottom: 1rem; line-height: 1.6;">The Electronics & Communication Engineering department at Government Polytechnic, Palanpur continues to excel in providing quality technical education and fostering innovation. With state-of-the-art laboratories and experienced faculty, we prepare students for the rapidly evolving technology landscape.</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1.5rem;">
                    <div>
                        <h4 style="font-weight: 600; color: #1f2937; margin-bottom: 1rem;">Key Highlights 2023-24</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                                <span style="color: #10b981; margin-right: 0.5rem;">•</span>
                                150+ students across all semesters
                            </li>
                            <li style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                                <span style="color: #10b981; margin-right: 0.5rem;">•</span>
                                100% placement rate for eligible students
                            </li>
                            <li style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                                <span style="color: #10b981; margin-right: 0.5rem;">•</span>
                                20+ research publications
                            </li>
                            <li style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                                <span style="color: #10b981; margin-right: 0.5rem;">•</span>
                                Modern lab infrastructure worth ₹35+ lakhs
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 style="font-weight: 600; color: #1f2937; margin-bottom: 1rem;">Focus Areas</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                                <span style="color: #3b82f6; margin-right: 0.5rem;">•</span>
                                5G Communication Systems
                            </li>
                            <li style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                                <span style="color: #3b82f6; margin-right: 0.5rem;">•</span>
                                IoT & Embedded Systems
                            </li>
                            <li style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                                <span style="color: #3b82f6; margin-right: 0.5rem;">•</span>
                                Digital Signal Processing
                            </li>
                            <li style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                                <span style="color: #3b82f6; margin-right: 0.5rem;">•</span>
                                VLSI Design & Testing
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Essence Section - Vision & Mission -->
        ${data.essence?.vision && data.essence?.mission ? `
        <div class="section">
            <h2 class="section-title">🌟 Essence - Vision & Mission</h2>
            <div class="vision-mission-grid">
                <div class="vision-card">
                    <h3 class="vision-title">🔭 Vision</h3>
                    <p>${data.essence.vision}</p>
                </div>
                <div class="mission-card">
                    <h3 class="mission-title">🎯 Mission</h3>
                    <p>${data.essence.mission}</p>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="section">
            <h2 class="section-title">✨ Spotlight - Achievements & Recognition</h2>
            <div class="achievements-grid">
                ${data.spotlight.map((achievement: any) => `
                    <div class="achievement-item">
                        <h3 class="achievement-title">${achievement.title}</h3>
                        <div class="achievement-category" style="text-transform: uppercase; font-weight: 500; margin-bottom: 0.5rem;">${achievement.category.replace('-', ' ')}</div>
                        <div class="achievement-description" style="margin-bottom: 1rem;">${achievement.description}</div>
                        ${achievement.person ? `<div class="achievement-person" style="font-weight: 500; color: #374151; margin-bottom: 0.25rem;"><strong>Person:</strong> ${achievement.person}</div>` : ''}
                        ${achievement.studentId ? `<div class="achievement-details" style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;"><strong>Student ID:</strong> ${achievement.studentId}</div>` : ''}
                        ${achievement.details ? `<div class="achievement-details" style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;"><strong>Details:</strong> ${achievement.details}</div>` : ''}
                        ${achievement.date ? `<div class="achievement-date" style="font-size: 0.875rem; color: #9ca3af; font-style: italic;"><strong>Date:</strong> ${achievement.date}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📖 Chronicles - Major Events & Activities</h2>
            <div class="events-list">
                ${data.chronicles.map(event => `
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
        
        ${data.canvas && data.canvas.length > 0 ? `
        <div class="section">
            <h2 class="section-title">🎨 Canvas - Creative Expressions</h2>
            <div class="canvas-grid">
                ${data.canvas.map((item: any) => `
                    <div class="canvas-item">
                        <h3 class="canvas-title">${item.title}</h3>
                        <div class="canvas-category">${item.category}</div>
                        <div class="canvas-content">${item.content}</div>
                        ${item.author ? `<div class="canvas-author">- ${item.author}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${data.reflections ? `
        <div class="section">
            <h2 class="section-title">💭 Reflections - Leadership Messages</h2>
            <div class="message-section">
                <h3 class="section-title">👨‍💼 Principal's Message</h3>
                <div class="message-author">${data.reflections.principal.name}</div>
                <div class="message-designation">${data.reflections.principal.designation}</div>
                <div class="message-text">${data.reflections.principal.message}</div>
            </div>
            
            <div class="message-section">
                <h3 class="section-title">👨‍🏫 Head of Department's Message</h3>
                <div class="message-author">${data.reflections.hod.name}</div>
                <div class="message-designation">${data.reflections.hod.designation}</div>
                <div class="message-text">${data.reflections.hod.message}</div>
            </div>
            
            <div class="message-section">
                <h3 class="section-title">✍️ Editor's Note</h3>
                <div class="message-author">${data.reflections.editorial.name}</div>
                <div class="message-designation">${data.reflections.editorial.designation}</div>
                <div class="message-text">${data.reflections.editorial.message}</div>
            </div>
        </div>
        ` : ''}
        
        ${data.reachout ? `
        <div class="section">
            <h2 class="section-title">🤝 Reachout - Connect With Us</h2>
            
            <!-- Contact Details -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 1rem;">Department Contact</h3>
                    <div class="contact-grid">
                        ${data.reachout.address ? `
                        <div class="contact-item">
                            <span class="contact-icon">📍</span>
                            <span>${data.reachout.address}</span>
                        </div>
                        ` : ''}
                        ${data.reachout.email ? `
                        <div class="contact-item">
                            <span class="contact-icon">📧</span>
                            <span>${data.reachout.email}</span>
                        </div>
                        ` : ''}
                        ${data.reachout.phone ? `
                        <div class="contact-item">
                            <span class="contact-icon">📞</span>
                            <span>${data.reachout.phone}</span>
                        </div>
                        ` : ''}
                        ${data.reachout.website ? `
                        <div class="contact-item">
                            <span class="contact-icon">🌐</span>
                            <span>${data.reachout.website}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Editorial Team -->
                <div>
                    <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 1rem;">Editorial Team</h3>
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                            <div style="background: rgba(255,255,255,0.2); padding: 0.5rem; border-radius: 0.5rem; margin-right: 0.75rem;">
                                <span style="font-size: 1.25rem;">👥</span>
                            </div>
                            <div>
                                <div style="font-weight: 600;">Ms. Mittal K. Pedhadiya</div>
                                <div style="font-size: 0.875rem; opacity: 0.9;">Assistant Professor & Newsletter Editor</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div style="background: rgba(255,255,255,0.2); padding: 0.5rem; border-radius: 0.5rem; margin-right: 0.75rem;">
                                <span style="font-size: 1.25rem;">👥</span>
                            </div>
                            <div>
                                <div style="font-weight: 600;">Mr. Milav J. Dabgar</div>
                                <div style="font-size: 0.875rem; opacity: 0.9;">Assistant Professor & Newsletter Co-Editor</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Department Info -->
                    <div style="background: #f9fafb; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb;">
                        <h4 style="font-weight: 600; color: #1f2937; margin-bottom: 0.75rem;">About the Department</h4>
                        <p style="color: #6b7280; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1rem;">
                            The Electronics & Communication Engineering Department at Government Polytechnic, Palanpur 
                            has been a center of excellence in technical education since 1984. We are committed to 
                            preparing competent diploma-level engineers who can contribute to the industry and society.
                        </p>
                        <div style="padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                            <div style="font-size: 0.875rem; color: #6b7280;">
                                <strong>Established:</strong> 1984<br />
                                <strong>Academic Year:</strong> 2023-24<br />
                                <strong>Newsletter:</strong> Spectrum - Band III
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : `
        <div class="section">
            <h2 class="section-title">🤝 Reachout - Connect With Us</h2>
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
        `}
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
    .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '') // Remove emojis
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { format, year = '2023-24' } = requestData;
    
    if (!format || !['pdf', 'docx', 'rtf', 'html'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: pdf, docx, rtf, html' },
        { status: 400 }
      );
    }

    console.log(`[Interactive Export] Processing ${format} export for year ${year}...`);

    // Get newsletter data for the specified year
    const yearData = getNewsletterDataByYear(year) || newsletterData;
    
    // Generate static HTML from component data
    const htmlContent = generateStaticHtml(yearData, year);
    
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
              'Content-Disposition': `attachment; filename="Spectrum-Interactive-Newsletter-${year}-${new Date().toISOString().split('T')[0]}.pdf"`,
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
            'Content-Disposition': `attachment; filename="Spectrum-Interactive-Newsletter-${year}-${new Date().toISOString().split('T')[0]}.html"`,
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
              'Content-Disposition': `attachment; filename="Spectrum-Interactive-Newsletter-${year}-${new Date().toISOString().split('T')[0]}.${format}"`,
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
