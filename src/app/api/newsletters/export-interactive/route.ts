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

// Helper function to check if an image URL is local (relative path)
function isLocalImage(src: string): boolean {
  return !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:');
}

// Helper function to process image src, converting local images to base64
function processImageSrc(src: string): string {
  if (isLocalImage(src)) {
    const base64Src = getImageAsBase64(src);
    return base64Src || src; // fallback to original src if base64 conversion fails
  }
  return src; // return as-is for online images
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
            background: linear-gradient(to bottom right, #dbeafe, #e0e7ff, #f3e8ff);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            background: linear-gradient(to right, #1e3a8a, #581c87, #3730a3);
            color: white;
            padding: 4rem 2rem;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.2);
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .header h1 {
            font-size: 4rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        
        .header p {
            font-size: 1.25rem;
            opacity: 0.9;
            margin-bottom: 0.5rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border: 1px solid #e5e7eb;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .stat-info {
            flex: 1;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.25rem;
        }
        
        .stat-label {
            font-size: 0.875rem;
            color: #6b7280;
            font-medium: 500;
        }
        
        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: white;
        }
        
        .stat-icon.bg-blue { background: #3b82f6; }
        .stat-icon.bg-green { background: #10b981; }
        .stat-icon.bg-purple { background: #8b5cf6; }
        .stat-icon.bg-orange { background: #f59e0b; }
        
        .section {
            background: white;
            margin-bottom: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border: 1px solid #e5e7eb;
            overflow: hidden;
        }
        
        .section-header {
            background: white;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .section-description {
            font-size: 0.875rem;
            color: #6b7280;
            margin: 0;
        }
        
        .section-content {
            padding: 2rem;
        }
        
        .spotlight-grid {
            display: grid;
            gap: 1.5rem;
        }
        
        .spotlight-item {
            padding: 1.5rem;
            border-radius: 0.75rem;
            border: 1px solid;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .spotlight-item.faculty-contribution {
            background: linear-gradient(to right, #dbeafe, #bfdbfe);
            border-color: #3b82f6;
        }
        
        .spotlight-item.student-achievement {
            background: linear-gradient(to right, #dcfce7, #bbf7d0);
            border-color: #10b981;
        }
        
        .spotlight-item.placement {
            background: linear-gradient(to right, #f3e8ff, #e9d5ff);
            border-color: #8b5cf6;
        }
        
        .spotlight-item.higher-education {
            background: linear-gradient(to right, #fed7aa, #fdba74);
            border-color: #f59e0b;
        }
        
        .spotlight-item.star-performer {
            background: linear-gradient(to right, #fef3c7, #fde68a);
            border-color: #f59e0b;
        }
        
        .spotlight-icon {
            width: 48px;
            height: 48px;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
            font-size: 1.25rem;
        }
        
        .spotlight-icon.faculty-contribution { background: #3b82f6; }
        .spotlight-icon.student-achievement { background: #10b981; }
        .spotlight-icon.placement { background: #8b5cf6; }
        .spotlight-icon.higher-education { background: #f59e0b; }
        .spotlight-icon.star-performer { background: #f59e0b; }
        
        .spotlight-content {
            flex: 1;
        }
        
        .spotlight-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 0.75rem;
        }
        
        .spotlight-person {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.25rem;
        }
        
        .spotlight-designation {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
        }
        
        .spotlight-title {
            font-size: 1rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
        }
        
        .spotlight-description {
            color: #6b7280;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
            line-height: 1.5;
        }
        
        .spotlight-details {
            background: rgba(255, 255, 255, 0.5);
            padding: 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            color: #374151;
            margin-top: 0.5rem;
        }
        
        .spotlight-badges {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        
        .spotlight-badge {
            background: rgba(255, 255, 255, 0.8);
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid rgba(0, 0, 0, 0.1);
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
        
        .chronicles-grid {
            display: grid;
            gap: 2rem;
        }
        
        .chronicle-item {
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            padding: 1.5rem;
            background: white;
        }
        
        .chronicle-item.workshop {
            background: linear-gradient(to right, #f5f3ff, #ede9fe);
            border-color: #8b5cf6;
        }
        
        .chronicle-item.orientation {
            background: linear-gradient(to right, #ecfdf5, #d1fae5);
            border-color: #10b981;
        }
        
        .chronicle-item.training {
            background: linear-gradient(to right, #fff7ed, #fed7aa);
            border-color: #f97316;
        }
        
        .chronicle-item.awareness {
            background: linear-gradient(to right, #fdf2f8, #fce7f3);
            border-color: #ec4899;
        }
        
        .chronicle-item.community {
            background: linear-gradient(to right, #eff6ff, #dbeafe);
            border-color: #3b82f6;
        }
        
        .chronicle-item.visit {
            background: linear-gradient(to right, #fffbeb, #fef3c7);
            border-color: #f59e0b;
        }
        
        .chronicle-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
        
        .chronicle-content {
            flex: 1;
        }
        
        .chronicle-date-badge {
            padding: 0.375rem 0.75rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid;
            margin-bottom: 0.5rem;
            display: inline-block;
        }
        
        .chronicle-item.workshop .chronicle-date-badge {
            background: #f5f3ff;
            color: #7c3aed;
            border-color: #c4b5fd;
        }
        
        .chronicle-item.orientation .chronicle-date-badge {
            background: #ecfdf5;
            color: #059669;
            border-color: #a7f3d0;
        }
        
        .chronicle-item.training .chronicle-date-badge {
            background: #fff7ed;
            color: #ea580c;
            border-color: #fed7aa;
        }
        
        .chronicle-item.awareness .chronicle-date-badge {
            background: #fdf2f8;
            color: #be185d;
            border-color: #fce7f3;
        }
        
        .chronicle-item.community .chronicle-date-badge {
            background: #eff6ff;
            color: #2563eb;
            border-color: #bfdbfe;
        }
        
        .chronicle-item.visit .chronicle-date-badge {
            background: #fffbeb;
            color: #d97706;
            border-color: #fde68a;
        }
        
        .chronicle-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        
        .chronicle-description {
            color: #374151;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        
        .chronicle-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .chronicle-tag {
            background: rgba(156, 163, 175, 0.2);
            color: #374151;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .chronicle-gallery {
            margin-top: 1.5rem;
        }
        
        .chronicle-gallery-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 0.75rem;
        }
        
        .chronicle-images {
            display: grid;
            gap: 1rem;
        }
        
        .chronicle-images.single {
            grid-template-columns: 1fr;
            justify-items: center;
        }
        
        .chronicle-images.double {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .chronicle-images.triple {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
        
        .chronicle-images.multiple {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }
        
        .chronicle-image-container {
            position: relative;
            overflow: hidden;
            border-radius: 0.5rem;
            background: #f3f4f6;
        }
        
        .chronicle-images.single .chronicle-image-container {
            aspect-ratio: 16/9;
            max-width: 32rem;
        }
        
        .chronicle-images.double .chronicle-image-container {
            aspect-ratio: 4/3;
        }
        
        .chronicle-images.triple .chronicle-image-container,
        .chronicle-images.multiple .chronicle-image-container {
            aspect-ratio: 1/1;
        }
        
        .chronicle-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .chronicle-image:hover {
            transform: scale(1.05);
        }
        
        .chronicle-image-caption {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
            color: white;
            padding: 1rem 0.75rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 500;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .chronicle-image-container:hover .chronicle-image-caption {
            opacity: 1;
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
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border: 1px solid #e5e7eb;
            overflow: hidden;
        }
        
        .message-header {
            background: white;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .message-content {
            padding: 2rem;
        }
        
        .message-body {
            background: linear-gradient(to right, #f0fdf4, #dcfce7);
            padding: 1.5rem;
            border-radius: 0.75rem;
            border: 1px solid #16a34a;
        }
        
        .message-profile {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .message-icon {
            background: #16a34a;
            color: white;
            padding: 0.75rem;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .message-details {
            flex: 1;
        }
        
        .message-author {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.25rem;
        }
        
        .message-designation {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 1rem;
        }
        
        .message-text {
            color: #374151;
            line-height: 1.7;
            white-space: pre-line;
        }
        
        .vision-mission-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-top: 1rem;
        }
        
        .department-overview {
            background: white;
            border-radius: 0.75rem;
            border: 1px solid #e5e7eb;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .dept-overview-header {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 1.5rem 2rem;
        }
        
        .dept-overview-title {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
        }
        
        .dept-overview-subtitle {
            margin: 0.5rem 0 0 0;
            opacity: 0.9;
            font-size: 0.875rem;
        }
        
        .dept-overview-content {
            padding: 2rem;
        }
        
        .dept-overview-text {
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            padding: 2rem;
            border-radius: 0.75rem;
            border: 1px solid #e2e8f0;
            margin: 1.5rem 0;
        }
        
        .dept-overview-text p {
            white-space: pre-line;
            text-align: justify;
            line-height: 1.7;
            color: #374151;
            font-size: 1rem;
            margin: 0;
        }
        
        .programs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .program-card {
            color: white;
            padding: 1.5rem;
            border-radius: 0.75rem;
            text-align: center;
        }
        
        .program-card.ec {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .program-card.ict {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }
        
        .program-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
        }
        
        .program-title {
            margin: 0 0 0.75rem 0;
            font-size: 1.125rem;
            font-weight: 600;
        }
        
        .program-intake {
            margin: 0;
            font-size: 0.875rem;
            opacity: 0.9;
        }
        
        .program-description {
            margin: 0.5rem 0 0 0;
            font-size: 0.75rem;
            opacity: 0.8;
        }
        
        .key-strengths {
            margin-top: 2rem;
        }
        
        .key-strengths-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        
        .strengths-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;
        }
        
        .strength-card {
            padding: 1.25rem;
            border-radius: 0.5rem;
            border-left: 4px solid;
        }
        
        .strength-card.holistic {
            background: #f0f9ff;
            border-left-color: #0ea5e9;
        }
        
        .strength-card.partnerships {
            background: #f0fdf4;
            border-left-color: #22c55e;
        }
        
        .strength-card.leaders {
            background: #fefbff;
            border-left-color: #a855f7;
        }
        
        .strength-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
        }
        
        .strength-icon {
            font-size: 1.25rem;
        }
        
        .strength-title {
            font-weight: 600;
        }
        
        .strength-card.holistic .strength-title { color: #0369a1; }
        .strength-card.partnerships .strength-title { color: #15803d; }
        .strength-card.leaders .strength-title { color: #7c2d12; }
        
        .strength-description {
            margin: 0;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        
        .strength-card.holistic .strength-description { color: #075985; }
        .strength-card.partnerships .strength-description { color: #166534; }
        .strength-card.leaders .strength-description { color: #92400e; }
        
        .vision-mission-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
        }
        
        .vision-card, .mission-card {
            padding: 1.5rem;
            border-radius: 0.75rem;
            border: 1px solid;
        }
        
        .vision-card {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-color: #3b82f6;
        }
        
        .mission-card {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            border-color: #10b981;
        }
        
        .vision-title, .mission-title {
            font-size: 1.125rem;
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
        
        .vision-icon, .mission-icon {
            width: 48px;
            height: 48px;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            margin-right: 0.75rem;
        }
        
        .vision-icon {
            background: #3b82f6;
        }
        
        .mission-icon {
            background: #10b981;
        }
        
        .vision-text, .mission-text {
            color: #374151;
            line-height: 1.6;
            white-space: pre-line;
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
        
        .canvas-grid {
            display: grid;
            gap: 1.5rem;
        }
        
        .canvas-item {
            background: linear-gradient(to right, #f5f3ff, #ede9fe);
            padding: 1.5rem;
            border-radius: 0.75rem;
            border: 1px solid #8b5cf6;
        }
        
        .canvas-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
        
        .canvas-content {
            flex: 1;
        }
        
        .canvas-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        
        .canvas-author-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.75rem;
            font-size: 0.875rem;
            color: #6b7280;
        }
        
        .canvas-author-info .author-icon {
            color: #8b5cf6;
        }
        
        .canvas-badges {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        
        .canvas-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid;
        }
        
        .canvas-badge.faculty {
            background: #dbeafe;
            color: #2563eb;
            border-color: #93c5fd;
        }
        
        .canvas-badge.student {
            background: #dcfce7;
            color: #16a34a;
            border-color: #86efac;
        }
        
        .canvas-badge.type {
            background: rgba(255, 255, 255, 0.8);
            color: #6b7280;
            border-color: #d1d5db;
        }
        
        .canvas-text {
            color: #374151;
            line-height: 1.6;
            margin-top: 1rem;
        }
        
        .canvas-text.poem {
            white-space: pre-wrap;
            font-family: 'Georgia', serif;
            font-style: italic;
        }
        
        .canvas-images {
            margin-top: 1.5rem;
        }
        
        .canvas-gallery-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 0.75rem;
        }
        
        .canvas-image-grid {
            display: grid;
            gap: 1rem;
        }
        
        .canvas-image-grid.single {
            grid-template-columns: 1fr;
            justify-items: center;
        }
        
        .canvas-image-grid.double {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .canvas-image-grid.multiple {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }
        
        .canvas-image-container {
            position: relative;
            overflow: hidden;
            border-radius: 0.5rem;
            background: #f3f4f6;
            aspect-ratio: 4/3;
        }
        
        .canvas-image-grid.single .canvas-image-container {
            aspect-ratio: 16/9;
            max-width: 32rem;
        }
        
        .canvas-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .canvas-image-caption {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
            color: white;
            padding: 1rem 0.75rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 500;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .canvas-image-container:hover .canvas-image-caption {
            opacity: 1;
        }
        
        @media print {
            body {
                background: white;
                font-size: 12px;
                line-height: 1.4;
            }
            .container {
                padding: 0.5rem;
                max-width: 100%;
            }
            .header {
                padding: 2rem 1rem;
                margin-bottom: 1.5rem;
            }
            .header h1 {
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
            }
            .header p {
                font-size: 1rem;
                margin-bottom: 0.25rem;
            }
            .stats-grid {
                grid-template-columns: repeat(4, 1fr);
                gap: 0.75rem;
                margin-bottom: 1.5rem;
            }
            .stat-card {
                padding: 0.75rem;
            }
            .stat-value {
                font-size: 1.25rem;
                margin-bottom: 0.125rem;
            }
            .stat-label {
                font-size: 0.75rem;
            }
            .stat-icon {
                width: 32px;
                height: 32px;
                font-size: 1rem;
            }
            .section, .message-section {
                box-shadow: none;
                border: 1px solid #e5e7eb;
                page-break-inside: avoid;
                margin-bottom: 1rem;
            }
            .section-header {
                padding: 1rem 1.5rem;
            }
            .section-title {
                font-size: 1.25rem;
            }
            .section-description {
                font-size: 0.75rem;
            }
            .section-content {
                padding: 1rem 1.5rem;
            }
            .dept-overview-header {
                padding: 1rem 1.5rem;
            }
            .dept-overview-title {
                font-size: 1.125rem;
            }
            .dept-overview-subtitle {
                font-size: 0.75rem;
            }
            .dept-overview-content {
                padding: 1rem 1.5rem;
            }
            .dept-overview-text {
                padding: 1rem;
                margin: 1rem 0;
            }
            .dept-overview-text p {
                font-size: 0.875rem;
                line-height: 1.5;
            }
            .programs-grid {
                gap: 1rem;
                margin-top: 1rem;
            }
            .program-card {
                padding: 1rem;
            }
            .program-icon {
                font-size: 2rem;
                margin-bottom: 0.5rem;
            }
            .program-title {
                font-size: 1rem;
                margin-bottom: 0.5rem;
            }
            .program-intake, .program-description {
                font-size: 0.75rem;
            }
            .key-strengths {
                margin-top: 1rem;
            }
            .key-strengths-title {
                font-size: 1rem;
                margin-bottom: 1rem;
            }
            .strengths-grid {
                gap: 0.75rem;
            }
            .strength-card {
                padding: 0.75rem;
            }
            .strength-title {
                font-size: 0.875rem;
            }
            .strength-description {
                font-size: 0.75rem;
            }
            .vision-mission-grid {
                gap: 1rem;
                margin-top: 0.5rem;
            }
            .vision-card, .mission-card {
                padding: 1rem;
            }
            .vision-title, .mission-title {
                font-size: 1rem;
                margin-bottom: 0.75rem;
            }
            .vision-icon, .mission-icon {
                width: 32px;
                height: 32px;
                margin-right: 0.5rem;
            }
            .vision-text, .mission-text {
                font-size: 0.875rem;
                line-height: 1.5;
            }
            .message-header {
                padding: 1rem 1.5rem;
            }
            .message-content {
                padding: 1rem 1.5rem;
            }
            .message-body {
                padding: 1rem;
            }
            .message-author {
                font-size: 1rem;
            }
            .message-designation {
                font-size: 0.75rem;
                margin-bottom: 0.75rem;
            }
            .message-text {
                font-size: 0.875rem;
                line-height: 1.6;
            }
            .spotlight-grid, .chronicles-grid, .canvas-grid {
                gap: 1rem;
            }
            .spotlight-item, .chronicle-item, .canvas-item {
                padding: 1rem;
            }
            .spotlight-person, .chronicle-title, .canvas-title {
                font-size: 1rem;
            }
            .spotlight-title {
                font-size: 0.875rem;
            }
            .spotlight-description, .chronicle-description {
                font-size: 0.75rem;
            }
            .spotlight-designation {
                font-size: 0.75rem;
            }
            .spotlight-icon {
                width: 32px;
                height: 32px;
                font-size: 1rem;
            }
            .chronicle-date-badge {
                padding: 0.25rem 0.5rem;
                font-size: 0.65rem;
            }
            .canvas-author-info {
                font-size: 0.75rem;
            }
            .canvas-badges {
                gap: 0.25rem;
            }
            .canvas-badge {
                padding: 0.125rem 0.375rem;
                font-size: 0.65rem;
            }
            .canvas-text {
                font-size: 0.875rem;
                margin-top: 0.75rem;
            }
            .contact-grid {
                gap: 1rem;
            }
            .contact-item {
                padding: 0.75rem;
            }
            .chronicle-gallery, .canvas-images {
                margin-top: 1rem;
            }
            .chronicle-gallery-title, .canvas-gallery-title {
                font-size: 0.75rem;
                margin-bottom: 0.5rem;
            }
            .chronicle-images, .canvas-image-grid {
                gap: 0.5rem;
            }
            .spotlight-images {
                margin-top: 0.75rem;
            }
            .spotlight-images h4 {
                font-size: 0.75rem;
                margin-bottom: 0.5rem;
            }
            .spotlight-images img {
                max-width: 20rem;
            }
            .header-logos {
                gap: 1rem;
                margin-bottom: 1rem;
            }
            .header-logo {
                width: 60px;
                height: 60px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
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
        </div>
        
        <div class="stats-grid">
            ${data.stats.map((stat, index) => {
              const icons = ['📈', '📚', '👥', '🏆'];
              const colors = ['bg-blue', 'bg-green', 'bg-purple', 'bg-orange'];
              return `
                <div class="stat-card">
                    <div class="stat-card-content">
                        <div class="stat-info">
                            <div class="stat-value">${stat.value}${stat.label.includes('Rate') ? '%' : ''}</div>
                            <div class="stat-label">${stat.label}</div>
                        </div>
                        <div class="stat-icon ${colors[index % colors.length]}">
                            ${icons[index % icons.length]}
                        </div>
                    </div>
                </div>
              `;
            }).join('')}
        </div>
        
        <!-- Department Overview Section -->
        ${data.essence?.departmentOverview ? `
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">🏢 Department Overview</h2>
                <p class="section-description">Electronics & Communication Engineering - Government Polytechnic, Palanpur</p>
            </div>
            <div class="section-content">
                <div class="department-overview">
                    <div class="dept-overview-header">
                        <h3 class="dept-overview-title">Electronics & Communication Engineering</h3>
                        <p class="dept-overview-subtitle">Government Polytechnic, Palanpur</p>
                    </div>
                    <div class="dept-overview-content">
                        <div class="dept-overview-text">
                            <p>${data.essence.departmentOverview}</p>
                        </div>
                        
                        <div class="programs-grid">
                            <div class="program-card ec">
                                <span class="program-icon">📡</span>
                                <h4 class="program-title">Electronics & Communication</h4>
                                <p class="program-intake">38 Students Intake</p>
                                <p class="program-description">Advanced EC Engineering</p>
                            </div>
                            <div class="program-card ict">
                                <span class="program-icon">💻</span>
                                <h4 class="program-title">Information & Communication Technology</h4>
                                <p class="program-intake">78 Students Intake</p>
                                <p class="program-description">Modern ICT Solutions</p>
                            </div>
                        </div>
                        
                        <div class="key-strengths">
                            <h4 class="key-strengths-title">🌟 What Sets Us Apart</h4>
                            <div class="strengths-grid">
                                <div class="strength-card holistic">
                                    <div class="strength-header">
                                        <span class="strength-icon">🎓</span>
                                        <strong class="strength-title">Holistic Education</strong>
                                    </div>
                                    <p class="strength-description">Cutting-edge technology with practical industry applications</p>
                                </div>
                                <div class="strength-card partnerships">
                                    <div class="strength-header">
                                        <span class="strength-icon">🤝</span>
                                        <strong class="strength-title">Industry Partnerships</strong>
                                    </div>
                                    <p class="strength-description">Strategic collaborations for innovation projects</p>
                                </div>
                                <div class="strength-card leaders">
                                    <div class="strength-header">
                                        <span class="strength-icon">💡</span>
                                        <strong class="strength-title">Future Leaders</strong>
                                    </div>
                                    <p class="strength-description">Preparing entrepreneurs who drive technological advancement</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Vision & Mission Section -->
        ${data.essence?.vision && data.essence?.mission ? `
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">🎯 Vision & Mission</h2>
                <p class="section-description">Our Commitment to Excellence</p>
            </div>
            <div class="section-content">
                <div class="vision-mission-grid">
                    <div class="vision-card">
                        <div class="vision-title">
                            <div class="vision-icon">🔭</div>
                            <span>Vision</span>
                        </div>
                        <div class="vision-text">${data.essence.vision}</div>
                    </div>
                    <div class="mission-card">
                        <div class="mission-title">
                            <div class="mission-icon">🚀</div>
                            <span>Mission</span>
                        </div>
                        <div class="mission-text">${data.essence.mission}</div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${data.essence?.hodMessage ? `
        <div class="message-section">
            <div class="message-header">
                <h2 class="section-title">� Head of Department's Message</h2>
                <p class="section-description">Message from the HOD</p>
            </div>
            <div class="message-content">
                <div class="message-body">
                    <div class="message-profile">
                        <div class="message-icon">📚</div>
                        <div class="message-details">
                            <h3 class="message-author">${data.essence.hodMessage.name}</h3>
                            <p class="message-designation">${data.essence.hodMessage.designation}</p>
                            <div class="message-text">${data.essence.hodMessage.message}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">🏆 Spotlight</h2>
                <p class="section-description">Achievements, accomplishments, and success stories</p>
            </div>
            <div class="section-content">
                <div class="spotlight-grid">
                    ${data.spotlight.map((item) => {
                      const icons = {
                        'faculty-contribution': '🏅',
                        'student-achievement': '🏆',
                        'placement': '🏢',
                        'higher-education': '📚',
                        'star-performer': '⭐'
                      };
                      const icon = icons[item.category] || '🏅';
                      
                      return `
                        <div class="spotlight-item ${item.category}">
                            <div class="spotlight-icon ${item.category}">
                                ${icon}
                            </div>
                            <div class="spotlight-content">
                                <div class="spotlight-header">
                                    <div>
                                        ${item.person ? `
                                            <div class="spotlight-person">${item.person}</div>
                                            ${item.designation ? `<div class="spotlight-designation">${item.designation}</div>` : ''}
                                        ` : ''}
                                        <h3 class="spotlight-title">${item.title}</h3>
                                        <p class="spotlight-description">${item.description}</p>
                                        ${item.studentId ? `<div class="spotlight-designation">Student ID: ${item.studentId}</div>` : ''}
                                        ${item.details ? `
                                            <div class="spotlight-details">
                                                <strong>
                                                    ${item.category === 'placement' ? 'Company & Position:' : 
                                                      item.category === 'higher-education' ? 'Institution:' :
                                                      item.category === 'faculty-contribution' ? 'Role & Contribution:' :
                                                      item.category === 'student-achievement' ? 'Achievement Details:' :
                                                      item.category === 'star-performer' ? 'Performance:' : 'Details:'}
                                                </strong> ${item.details}
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="spotlight-badges">
                                        <span class="spotlight-badge">${item.category.replace('-', ' ')}</span>
                                        ${item.date ? `<span class="spotlight-badge">${item.date}</span>` : ''}
                                    </div>
                                </div>
                                ${item.achievements && item.achievements.length > 0 ? `
                                    <div style="margin-top: 1rem;">
                                        ${item.achievements.map(achievement => `
                                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem;">
                                                <span style="color: #8b5cf6;">⭐</span>
                                                <span style="color: #374151;">${achievement}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                                ${item.images && item.images.length > 0 ? `
                                    <div style="margin-top: 1rem;">
                                        <h4 style="font-size: 0.875rem; font-weight: 500; color: #6b7280; margin-bottom: 0.75rem;">Photo Gallery</h4>
                                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                            ${item.images.map((image, imgIndex) => `
                                                <div style="position: relative;">
                                                    <img 
                                                        src="${processImageSrc(image.src)}" 
                                                        alt="${image.alt}" 
                                                        style="width: 100%; max-width: 28rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;"
                                                        onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='"
                                                    />
                                                    ${image.caption ? `
                                                        <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem; font-style: italic;">${image.caption}</p>
                                                    ` : ''}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                      `;
                    }).join('')}
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">📅 Major Events & Activities</h2>
                <p class="section-description">Key departmental events, workshops, and student activities</p>
            </div>
            <div class="section-content">
                <div class="chronicles-grid">
                    ${data.chronicles.map((event, index) => {
                      const category = event.category || 'workshop';
                      const imageCount = event.images ? event.images.length : 0;
                      let imageGridClass = 'single';
                      if (imageCount === 2) imageGridClass = 'double';
                      else if (imageCount === 3) imageGridClass = 'triple';
                      else if (imageCount > 3) imageGridClass = 'multiple';
                      
                      return `
                        <div class="chronicle-item ${category}">
                            <div class="chronicle-header">
                                <div class="chronicle-content">
                                    <span class="chronicle-date-badge">${event.date}</span>
                                    <h3 class="chronicle-title">${event.title}</h3>
                                    <p class="chronicle-description">${event.description}</p>
                                    ${event.tags && event.tags.length > 0 ? `
                                        <div class="chronicle-tags">
                                            ${event.tags.map(tag => `<span class="chronicle-tag">${tag}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            ${event.images && event.images.length > 0 ? `
                                <div class="chronicle-gallery">
                                    <h4 class="chronicle-gallery-title">Event Gallery</h4>
                                    <div class="chronicle-images ${imageGridClass}">
                                        ${event.images.map((image, imgIndex) => `
                                            <div class="chronicle-image-container">
                                                <img 
                                                    src="${processImageSrc(image.src)}" 
                                                    alt="${image.alt}" 
                                                    class="chronicle-image"
                                                    onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='"
                                                />
                                                ${image.caption ? `
                                                    <div class="chronicle-image-caption">${image.caption}</div>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                      `;
                    }).join('')}
                </div>
            </div>
        </div>
        
        <!-- Canvas Section -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">⭐ Canvas</h2>
                <p class="section-description">Creative expressions and insights from faculty and students</p>
            </div>
            <div class="section-content">
                <div class="canvas-grid">
                    ${data.canvas && data.canvas.length > 0 ? data.canvas.map((item, index) => {
                      const imageCount = item.images ? item.images.length : 0;
                      let imageGridClass = 'single';
                      if (imageCount === 2) imageGridClass = 'double';
                      else if (imageCount > 2) imageGridClass = 'multiple';
                      
                      return `
                        <div class="canvas-item">
                            <div class="canvas-header">
                                <div class="canvas-content">
                                    <h3 class="canvas-title">${item.title}</h3>
                                    <div class="canvas-author-info">
                                        <span class="author-icon">👥</span>
                                        <span>${item.author}${item.designation ? ` - ${item.designation}` : ''}${item.studentId ? ` (${item.studentId})` : ''}${item.semester ? ` - ${item.semester}` : ''}</span>
                                        ${item.date ? `<span>📅 ${item.date}</span>` : ''}
                                    </div>
                                </div>
                                <div class="canvas-badges">
                                    <span class="canvas-badge ${item.authorType === 'faculty' ? 'faculty' : 'student'}">
                                        ${item.authorType === 'faculty' ? 'Faculty' : 'Student'}
                                    </span>
                                    <span class="canvas-badge type">${item.type?.replace('-', ' ') || 'Content'}</span>
                                </div>
                            </div>
                            
                            <div class="canvas-text ${item.type === 'poem' ? 'poem' : ''}">
                                ${item.content || ''}
                            </div>
                            
                            ${item.images && item.images.length > 0 ? `
                                <div class="canvas-images">
                                    <h4 class="canvas-gallery-title">Photo Gallery</h4>
                                    <div class="canvas-image-grid ${imageGridClass}">
                                        ${item.images.map((image, imgIndex) => `
                                            <div class="canvas-image-container">
                                                <img 
                                                    src="${processImageSrc(image.src)}" 
                                                    alt="${image.alt}" 
                                                    class="canvas-image"
                                                    onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='"
                                                />
                                                ${image.caption ? `
                                                    <div class="canvas-image-caption">${image.caption}</div>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                      `;
                    }).join('') : `
                        <div style="text-align: center; padding: 2rem; color: #6b7280;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">⭐</div>
                            <p>No canvas content available for this year.</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">📞 Reachout</h2>
                <p class="section-description">Get in touch with the Electronics & Communication Engineering Department</p>
            </div>
            <div class="section-content">
                <div class="contact-grid">
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem;">Department Contact</h3>
                        
                        <div class="contact-item" style="margin-bottom: 1rem;">
                            <span class="contact-icon">�</span>
                            <div>
                                <div style="font-weight: 500; color: #1f2937;">Email</div>
                                <div style="color: #6b7280;">${data.reachout?.email || 'gppec11@gmail.com'}</div>
                            </div>
                        </div>
                        
                        ${data.reachout?.newsletterEmail ? `
                        <div class="contact-item" style="margin-bottom: 1rem; background: #dbeafe; border: 1px solid #3b82f6;">
                            <span class="contact-icon" style="color: #8b5cf6;">📧</span>
                            <div>
                                <div style="font-weight: 500; color: #1f2937;">Newsletter Submissions</div>
                                <div style="color: #6b7280;">${data.reachout.newsletterEmail}</div>
                                <div style="font-size: 0.75rem; color: #8b5cf6; margin-top: 0.25rem;">For students & faculty to share newsletter content</div>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="contact-item" style="margin-bottom: 1rem;">
                            <span class="contact-icon" style="color: #10b981;">📞</span>
                            <div>
                                <div style="font-weight: 500; color: #1f2937;">Phone</div>
                                <div style="color: #6b7280;">${data.reachout?.phone || '02742-245219'}</div>
                            </div>
                        </div>
                        
                        <div class="contact-item" style="margin-bottom: 1rem;">
                            <span class="contact-icon" style="color: #ef4444;">�</span>
                            <div>
                                <div style="font-weight: 500; color: #1f2937;">Address</div>
                                <div style="color: #6b7280;">${data.reachout?.address || 'Opp. Malan Darwaja, Ambaji Road, Palanpur - 385001, Gujarat'}</div>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <span class="contact-icon" style="color: #8b5cf6;">🌐</span>
                            <div>
                                <div style="font-weight: 500; color: #1f2937;">Website</div>
                                <div style="color: #6b7280;">${data.reachout?.website || 'ec.gppalanpur.in'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem;">Editorial Team</h3>
                        
                        <div style="background: linear-gradient(to right, #dbeafe, #f3e8ff); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #3b82f6;">
                            <div style="display: flex; flex-direction: column; gap: 1rem;">
                                ${data.editorialTeam && data.editorialTeam.length > 0 ? 
                                  data.editorialTeam.map((member, index) => `
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="background: ${index === 0 ? '#3b82f6' : '#8b5cf6'}; color: white; padding: 0.5rem; border-radius: 0.5rem;">
                                            👥
                                        </div>
                                        <div>
                                            <div style="font-weight: 600; color: #1f2937;">${member.name}</div>
                                            <div style="font-size: 0.875rem; color: #6b7280;">${member.designation} & ${member.role}</div>
                                        </div>
                                    </div>
                                  `).join('') : `
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="background: #3b82f6; color: white; padding: 0.5rem; border-radius: 0.5rem;">
                                            👥
                                        </div>
                                        <div>
                                            <div style="font-weight: 600; color: #1f2937;">Ms. Mittal K. Pedhadiya</div>
                                            <div style="font-size: 0.875rem; color: #6b7280;">Assistant Professor & Newsletter Editor</div>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="background: #8b5cf6; color: white; padding: 0.5rem; border-radius: 0.5rem;">
                                            👥
                                        </div>
                                        <div>
                                            <div style="font-weight: 600; color: #1f2937;">Mr. Milav J. Dabgar</div>
                                            <div style="font-size: 0.875rem; color: #6b7280;">Assistant Professor & Newsletter Co-Editor</div>
                                        </div>
                                    </div>
                                `}
                            </div>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; margin-top: 1rem;">
                            <h4 style="font-weight: 600; color: #1f2937; margin-bottom: 0.75rem;">About the Department</h4>
                            <p style="color: #6b7280; font-size: 0.875rem; line-height: 1.6; margin-bottom: 1rem;">
                                The Electronics & Communication Engineering Department at Government Polytechnic, Palanpur 
                                has been a center of excellence in technical education since 1984. We are committed to 
                                preparing competent diploma-level engineers who can contribute to the industry and society.
                            </p>
                            <div style="padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                                <div style="font-size: 0.875rem; color: #6b7280;">
                                    <strong>Established:</strong> 1984<br />
                                    <strong>Academic Year:</strong> ${year}<br />
                                    <strong>Newsletter:</strong> Spectrum - Band III
                                </div>
                            </div>
                        </div>
                    </div>
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
