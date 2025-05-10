import { test, expect } from '@playwright/test';
import type { APIResponse } from '@playwright/test';

const API_BASE_URL = 'http://localhost:9003/api';

// Define a generic type for API response items
interface ApiItem {
  id: string;
  name?: string;
  [key: string]: any; // Allow for additional properties
}

// Helper function to check POST responses
const expectSuccessfulPostOrValidationError = (response: APIResponse) => {
  expect([201, 400]).toContain(response.status());
};

test.describe('API Endpoints E2E Tests', () => {
  // ---- ASSESSMENTS ----
  test('GET /assessments - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/assessments`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /assessments/[id] - Should return 200 OK for an existing assessment', async ({ request }) => {
    const responseList = await request.get(`${API_BASE_URL}/assessments`);
    const bodyList = await responseList.json();
    
    // Check if we have any assessments
    if (!bodyList || !Array.isArray(bodyList) || bodyList.length === 0) {
      console.log('No assessments found, skipping test');
      test.skip();
      return;
    }
    
    const firstAssessmentId = bodyList[0].id;
    
    const response = await request.get(`${API_BASE_URL}/assessments/${firstAssessmentId}`);
    expect(response.status()).toBe(200);
  });

  // ---- BATCHES ----
  test('GET /batches - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/batches`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /batches/[id] - Should return 200 OK for an existing batch', async ({ request }) => {
    const responseList = await request.get(`${API_BASE_URL}/batches`);
    const bodyList = await responseList.json();
    
    // Check if we have any batches
    if (!bodyList || !Array.isArray(bodyList) || bodyList.length === 0) {
      console.log('No batches found, skipping test');
      test.skip();
      return;
    }
    
    const firstBatchId = bodyList[0].id;
    
    const response = await request.get(`${API_BASE_URL}/batches/${firstBatchId}`);
    expect(response.status()).toBe(200);
  });

  // ---- BUILDINGS ----
  test('GET /buildings - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/buildings`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /buildings/[id] - Should return 200 OK for an existing building', async ({ request }) => {
    const responseList = await request.get(`${API_BASE_URL}/buildings`);
    const bodyList = await responseList.json();
    
    // Check if we have any buildings
    if (!bodyList || !Array.isArray(bodyList) || bodyList.length === 0) {
      console.log('No buildings found, skipping test');
      test.skip();
      return;
    }
    
    const firstBuildingId = bodyList[0].id;
    
    const response = await request.get(`${API_BASE_URL}/buildings/${firstBuildingId}`);
    expect(response.status()).toBe(200);
  });
});
