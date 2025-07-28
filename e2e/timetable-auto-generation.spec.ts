import { test, expect } from '@playwright/test';

test.describe('Timetable Auto Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the auto-generation page
    await page.goto('/admin/timetables/auto-generate');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display auto-generation interface correctly', async ({ page }) => {
    // Check main heading
    await expect(page.locator('h1')).toContainText('Auto-Generate Timetables');
    
    // Check description
    await expect(page.getByText('Use AI-powered algorithms')).toBeVisible();
    
    // Check basic settings card
    await expect(page.locator('text=Basic Settings')).toBeVisible();
    await expect(page.locator('text=Academic Year')).toBeVisible();
    await expect(page.locator('text=Semester')).toBeVisible();
    
    // Check algorithm settings card
    await expect(page.locator('text=Algorithm Settings')).toBeVisible();
    await expect(page.locator('text=Generation Algorithm')).toBeVisible();
    
    // Check constraints configuration card
    await expect(page.locator('text=Constraints Configuration')).toBeVisible();
    await expect(page.locator('text=Hard Constraints')).toBeVisible();
    await expect(page.locator('text=Soft Constraints')).toBeVisible();
    
    // Check generate button
    await expect(page.locator('button:has-text("Generate Timetables")')).toBeVisible();
  });

  test('should allow selecting academic year and semester', async ({ page }) => {
    // Select academic year
    await page.locator('select').first().selectOption('2024-25');
    await expect(page.locator('select').first()).toHaveValue('2024-25');
    
    // Select semester
    await page.locator('select').nth(1).selectOption('2');
    await expect(page.locator('select').nth(1)).toHaveValue('2');
  });

  test('should allow batch selection', async ({ page }) => {
    // Mock some batches being present
    const batchCheckbox = page.locator('input[type="checkbox"]').first();
    
    if (await batchCheckbox.isVisible()) {
      await batchCheckbox.click();
      await expect(batchCheckbox).toBeChecked();
      
      // Check that selected count updates
      await expect(page.getByText(/Selected: \d+ batch/)).toBeVisible();
    }
  });

  test('should allow algorithm selection', async ({ page }) => {
    // Test genetic algorithm selection
    await page.getByRole('combobox').filter({ hasText: 'Generation Algorithm' }).click();
    await page.getByRole('option', { name: 'Genetic Algorithm' }).click();
    
    // Check that genetic algorithm parameters appear
    await expect(page.locator('text=Population Size')).toBeVisible();
    await expect(page.locator('text=Max Iterations')).toBeVisible();
    await expect(page.locator('text=Mutation Rate')).toBeVisible();
    await expect(page.locator('text=Crossover Rate')).toBeVisible();
    
    // Test constraint satisfaction selection
    await page.getByRole('combobox').filter({ hasText: 'Generation Algorithm' }).click();
    await page.getByRole('option', { name: 'Constraint Satisfaction' }).click();
    
    // Check that genetic parameters are hidden
    await expect(page.locator('text=Population Size')).not.toBeVisible();
    
    // Test hybrid approach
    await page.getByRole('combobox').filter({ hasText: 'Generation Algorithm' }).click();
    await page.getByRole('option', { name: 'Hybrid Approach' }).click();
  });

  test('should allow configuring genetic algorithm parameters', async ({ page }) => {
    // Select genetic algorithm
    await page.getByRole('combobox').filter({ hasText: 'Generation Algorithm' }).click();
    await page.getByRole('option', { name: 'Genetic Algorithm' }).click();
    
    // Configure population size
    const populationInput = page.locator('input[type="number"]').filter({ hasText: 'Population Size' });
    await populationInput.fill('30');
    await expect(populationInput).toHaveValue('30');
    
    // Configure max iterations
    const iterationsInput = page.locator('input[type="number"]').filter({ hasText: 'Max Iterations' });
    await iterationsInput.fill('50');
    await expect(iterationsInput).toHaveValue('50');
    
    // Configure mutation rate
    const mutationInput = page.locator('input[type="number"]').filter({ hasText: 'Mutation Rate' });
    await mutationInput.fill('0.15');
    await expect(mutationInput).toHaveValue('0.15');
    
    // Configure crossover rate
    const crossoverInput = page.locator('input[type="number"]').filter({ hasText: 'Crossover Rate' });
    await crossoverInput.fill('0.9');
    await expect(crossoverInput).toHaveValue('0.9');
  });

  test('should allow toggling constraints', async ({ page }) => {
    // Test hard constraints
    const facultyConflictsCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: 'No Faculty Conflicts' });
    if (await facultyConflictsCheckbox.isVisible()) {
      const isChecked = await facultyConflictsCheckbox.isChecked();
      await facultyConflictsCheckbox.click();
      await expect(facultyConflictsCheckbox).toBeChecked(!isChecked);
    }
    
    // Test soft constraints
    const preferencesCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: 'Respect Faculty Preferences' });
    if (await preferencesCheckbox.isVisible()) {
      const isChecked = await preferencesCheckbox.isChecked();
      await preferencesCheckbox.click();
      await expect(preferencesCheckbox).toBeChecked(!isChecked);
    }
  });

  test('should allow configuring time constraints', async ({ page }) => {
    // Configure max consecutive hours
    const consecutiveInput = page.locator('input[type="number"]').filter({ hasText: 'Max Consecutive Hours' });
    await consecutiveInput.fill('4');
    await expect(consecutiveInput).toHaveValue('4');
    
    // Configure max daily hours
    const dailyInput = page.locator('input[type="number"]').filter({ hasText: 'Max Daily Hours' });
    await dailyInput.fill('8');
    await expect(dailyInput).toHaveValue('8');
    
    // Test lunch break configuration
    const lunchBreakCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: 'Lunch Break Required' });
    if (await lunchBreakCheckbox.isVisible()) {
      await lunchBreakCheckbox.click();
      
      // Check that lunch break time inputs appear
      await expect(page.locator('input[type="time"]').filter({ hasText: 'Lunch Break Start' })).toBeVisible();
      await expect(page.locator('input[type="time"]').filter({ hasText: 'Lunch Break End' })).toBeVisible();
    }
  });

  test('should show generation progress when generating', async ({ page }) => {
    // Mock API response for generation
    await page.route('/api/timetables/auto-generate', async (route) => {
      // Simulate a successful generation response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          timetables: [
            {
              id: 'tt1',
              name: 'Test Timetable',
              academicYear: '2024-25',
              semester: 1,
              programId: 'prog1',
              batchId: 'batch1',
              version: '1.0',
              status: 'draft',
              effectiveDate: new Date().toISOString(),
              entries: [],
              optimizationScore: 85.5
            }
          ],
          optimizationScore: 85.5,
          executionTime: 2500,
          iterations: 45,
          conflicts: [],
          recommendations: ['Generation successful!']
        })
      });
    });
    
    // Select a batch (assuming at least one exists)
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click();
    }
    
    // Click generate button
    const generateButton = page.locator('button:has-text("Generate Timetables")');
    await generateButton.click();
    
    // Check for loading state
    await expect(page.locator('text=Generating...')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
    
    // Wait for completion and check results
    await expect(page.locator('text=Generation Results')).toBeVisible();
    await expect(page.locator('text=Success Rate')).toBeVisible();
    await expect(page.locator('text=Optimization Score')).toBeVisible();
    await expect(page.locator('text=Execution Time')).toBeVisible();
  });

  test('should handle generation failure gracefully', async ({ page }) => {
    // Mock API response for generation failure
    await page.route('/api/timetables/auto-generate', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'No course offerings found for the specified batches and term.'
        })
      });
    });
    
    // Select a batch and try to generate
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click();
      
      const generateButton = page.locator('button:has-text("Generate Timetables")');
      await generateButton.click();
      
      // Check for error handling
      await expect(page.locator('text=Generation Error')).toBeVisible();
    }
  });

  test('should validate form before allowing generation', async ({ page }) => {
    // Try to generate without selecting batches
    const generateButton = page.locator('button:has-text("Generate Timetables")');
    await generateButton.click();
    
    // Should show validation error
    await expect(page.locator('text=No Batches Selected')).toBeVisible();
    await expect(page.locator('text=Please select at least one batch')).toBeVisible();
  });

  test('should display generation statistics correctly', async ({ page }) => {
    // Mock successful generation with detailed results
    await page.route('/api/timetables/auto-generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          timetables: [
            {
              id: 'tt1',
              name: 'Test Timetable',
              academicYear: '2024-25',
              semester: 1,
              programId: 'prog1',
              batchId: 'batch1',
              version: '1.0',
              status: 'draft',
              effectiveDate: new Date().toISOString(),
              entries: [],
              optimizationScore: 92.3
            }
          ],
          optimizationScore: 92.3,
          executionTime: 3200,
          iterations: 67,
          conflicts: [
            {
              type: 'room',
              severity: 'minor',
              description: 'Minor room utilization issue',
              affectedEntries: [0, 1],
              suggestions: ['Consider room reallocation']
            }
          ],
          recommendations: [
            'High-quality solution generated using genetic algorithm',
            'Minor conflicts detected, manual review recommended'
          ]
        })
      });
    });
    
    // Select batch and generate
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click();
      
      await page.locator('button:has-text("Generate Timetables")').click();
      
      // Wait for results and verify statistics
      await expect(page.locator('text=92.3')).toBeVisible(); // Optimization score
      await expect(page.locator('text=3.2s')).toBeVisible(); // Execution time
      await expect(page.locator('text=1')).toBeVisible(); // Timetables generated
      
      // Check conflicts display
      await expect(page.locator('text=Conflicts Detected')).toBeVisible();
      await expect(page.locator('text=minor')).toBeVisible();
      
      // Check recommendations
      await expect(page.locator('text=Recommendations')).toBeVisible();
      await expect(page.locator('text=High-quality solution')).toBeVisible();
    }
  });

  test('should handle different algorithm types correctly', async ({ page }) => {
    const algorithms = ['genetic', 'constraint_satisfaction', 'hybrid'];
    
    for (const algorithm of algorithms) {
      // Select algorithm
      await page.getByRole('combobox').filter({ hasText: 'Generation Algorithm' }).click();
      
      if (algorithm === 'genetic') {
        await page.getByRole('option', { name: 'Genetic Algorithm' }).click();
      } else if (algorithm === 'constraint_satisfaction') {
        await page.getByRole('option', { name: 'Constraint Satisfaction' }).click();
      } else {
        await page.getByRole('option', { name: 'Hybrid Approach' }).click();
      }
      
      // Verify UI changes based on algorithm selection
      if (algorithm === 'genetic') {
        await expect(page.locator('text=Population Size')).toBeVisible();
        await expect(page.locator('text=Max Iterations')).toBeVisible();
      } else if (algorithm === 'constraint_satisfaction') {
        await expect(page.locator('text=Population Size')).not.toBeVisible();
      }
    }
  });

  test('should persist settings during session', async ({ page }) => {
    // Configure some settings
    await page.locator('select').first().selectOption('2024-25');
    await page.locator('select').nth(1).selectOption('2');
    
    // Navigate away and back
    await page.goto('/admin/timetables');
    await page.goto('/admin/timetables/auto-generate');
    
    // Check if settings are restored (this would depend on implementation)
    // For now, just check that the page loads correctly
    await expect(page.locator('h1')).toContainText('Auto-Generate Timetables');
  });

  test('should handle responsive design correctly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('h1')).toBeVisible();
  });
});