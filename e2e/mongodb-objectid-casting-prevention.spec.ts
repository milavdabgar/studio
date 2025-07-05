import { test, expect } from '@playwright/test';

/**
 * Critical MongoDB ObjectId Casting Tests
 * These tests specifically target issues where string-based custom IDs
 * are incorrectly used in $or queries with MongoDB ObjectId fields,
 * causing CastError: Cast to ObjectId failed errors.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

test.describe('MongoDB ObjectId Casting Error Prevention', () => {
  // Test realistic eventIds that previously caused ObjectId casting errors
  const problemEventIds = [
    'event_techfest_2024_gpp',
    'event_annual_project_fair_2024',
    'tech_expo_winter_2024_ce',
    'innovation_fest_2025_me',
    'startup_showcase_2024_ict'
  ];

  test('should handle project statistics with various eventId formats without ObjectId errors', async ({ page }) => {
    for (const eventId of problemEventIds) {
      console.log(`Testing eventId: ${eventId}`);
      
      const response = await page.request.get(`${API_BASE}/projects/statistics?eventId=${eventId}`);
      
      // The critical test: should NEVER return 500 due to ObjectId casting
      if (response.status() === 500) {
        const errorData = await response.json();
        console.error(`500 error for eventId ${eventId}:`, errorData);
        
        // Check if it's the specific ObjectId casting error we're preventing
        if (errorData.error && errorData.error.includes('Cast to ObjectId failed')) {
          throw new Error(`ObjectId casting error still present for eventId: ${eventId}. Error: ${errorData.error}`);
        }
        
        // If it's some other 500 error, fail with specific details
        throw new Error(`Unexpected 500 error for eventId ${eventId}: ${errorData.error || 'Unknown error'}`);
      }
      
      // Should return either 200 (success) or 404 (event not found), never 500
      expect([200, 404]).toContain(response.status());
      
      const responseData = await response.json();
      
      if (response.status() === 200) {
        // Verify successful response structure
        const statsData = responseData.data || responseData;
        expect(statsData).toHaveProperty('total');
        expect(statsData).toHaveProperty('evaluated');
        expect(statsData).toHaveProperty('pending');
        expect(typeof statsData.total).toBe('number');
        expect(typeof statsData.evaluated).toBe('number');
        expect(typeof statsData.pending).toBe('number');
      } else if (response.status() === 404) {
        // Verify proper 404 message
        expect(responseData.message).toBe('Event not found.');
      }
    }
  });

  test('should handle project details with various projectId formats without ObjectId errors', async ({ page }) => {
    const problemProjectIds = [
      'proj_smartwaste_gpp',
      'proj_waterpurifier_gpp', 
      'project_ai_chatbot_2024',
      'iot_weather_station_ce_2024',
      'blockchain_voting_system_ict'
    ];

    for (const projectId of problemProjectIds) {
      console.log(`Testing projectId: ${projectId}`);
      
      const response = await page.request.get(`${API_BASE}/projects/${projectId}/details`);
      
      // Should never return 500 due to ObjectId casting
      if (response.status() === 500) {
        const errorData = await response.json();
        console.error(`500 error for projectId ${projectId}:`, errorData);
        
        if (errorData.error && errorData.error.includes('Cast to ObjectId failed')) {
          throw new Error(`ObjectId casting error still present for projectId: ${projectId}. Error: ${errorData.error}`);
        }
      }
      
      // Should return 200, 404, or other valid HTTP status, never 500 due to ObjectId issues
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('should handle jury assignments with eventId without ObjectId errors', async ({ page }) => {
    for (const eventId of problemEventIds) {
      console.log(`Testing jury assignments for eventId: ${eventId}`);
      
      const response = await page.request.get(`${API_BASE}/projects/jury-assignments?eventId=${eventId}&evaluationType=department`);
      
      if (response.status() === 500) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('Cast to ObjectId failed')) {
          throw new Error(`ObjectId casting error in jury assignments for eventId: ${eventId}. Error: ${errorData.error}`);
        }
      }
      
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('should handle project event winners without ObjectId errors', async ({ page }) => {
    for (const eventId of problemEventIds) {
      console.log(`Testing winners for eventId: ${eventId}`);
      
      const response = await page.request.get(`${API_BASE}/projects/event/${eventId}/winners`);
      
      if (response.status() === 500) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('Cast to ObjectId failed')) {
          throw new Error(`ObjectId casting error in winners endpoint for eventId: ${eventId}. Error: ${errorData.error}`);
        }
      }
      
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('should handle certificates generation without ObjectId errors', async ({ page }) => {
    for (const eventId of problemEventIds) {
      console.log(`Testing certificates for eventId: ${eventId}`);
      
      const response = await page.request.get(`${API_BASE}/projects/event/${eventId}/certificates?type=participation`);
      
      if (response.status() === 500) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('Cast to ObjectId failed')) {
          throw new Error(`ObjectId casting error in certificates endpoint for eventId: ${eventId}. Error: ${errorData.error}`);
        }
      }
      
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('should handle project evaluation endpoints without ObjectId errors', async ({ page }) => {
    const problemProjectIds = [
      'proj_smartwaste_gpp',
      'proj_waterpurifier_gpp',
      'test_project_12345'
    ];

    for (const projectId of problemProjectIds) {
      console.log(`Testing evaluations for projectId: ${projectId}`);
      
      // Test department evaluation
      const deptEvalResponse = await page.request.get(`${API_BASE}/projects/${projectId}/department-evaluation`);
      if (deptEvalResponse.status() === 500) {
        const errorData = await deptEvalResponse.json();
        if (errorData.error && errorData.error.includes('Cast to ObjectId failed')) {
          throw new Error(`ObjectId casting error in dept evaluation for projectId: ${projectId}. Error: ${errorData.error}`);
        }
      }
      expect(deptEvalResponse.status()).toBeLessThan(500);
      
      // Test central evaluation
      const centralEvalResponse = await page.request.get(`${API_BASE}/projects/${projectId}/central-evaluation`);
      if (centralEvalResponse.status() === 500) {
        const errorData = await centralEvalResponse.json();
        if (errorData.error && errorData.error.includes('Cast to ObjectId failed')) {
          throw new Error(`ObjectId casting error in central evaluation for projectId: ${projectId}. Error: ${errorData.error}`);
        }
      }
      expect(centralEvalResponse.status()).toBeLessThan(500);
    }
  });

  test('should log any remaining ObjectId casting patterns in responses', async ({ page }) => {
    // This test helps identify if there are still any $or patterns causing issues
    const endpoints = [
      '/projects/statistics?eventId=event_test_2024',
      '/projects/proj_test_123/details',
      '/projects/jury-assignments?eventId=event_test_2024',
      '/project-events/event_test_2024/schedule'
    ];

    const objectIdErrors: Array<{ endpoint: string; error: string }> = [];

    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(`${API_BASE}${endpoint}`);
        if (response.status() === 500) {
          const errorData = await response.json();
          if (errorData.error && errorData.error.includes('Cast to ObjectId failed')) {
            objectIdErrors.push({
              endpoint,
              error: errorData.error
            });
          }
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed with:`, (error as Error).message);
      }
    }

    if (objectIdErrors.length > 0) {
      console.error('Found ObjectId casting errors:', objectIdErrors);
      throw new Error(`Still found ${objectIdErrors.length} ObjectId casting errors in endpoints: ${objectIdErrors.map(e => e.endpoint).join(', ')}`);
    }
  });
});
