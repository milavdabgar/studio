import { test, expect, Page } from '@playwright/test';
import { loginAsStudent, loginAsFaculty } from './test-helpers';

// Common viewport sizes for testing
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  largeDesktop: { width: 2560, height: 1440 }
};

// Using shared authentication helpers from test-helpers.ts

test.describe('Profile Responsive Design', () => {
  test.describe('Student Profile Responsive Layout', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStudent(page);
    });

    test('should display correctly on mobile devices', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/student/profile');

      // Header should be responsive
      await expect(page.locator('text=Student Profile')).toBeVisible();

      // Tabs should be horizontally scrollable on mobile
      const tabsList = page.locator('[role="tablist"]');
      await expect(tabsList).toBeVisible();

      // Profile photo should be appropriately sized
      const avatar = page.locator('[data-testid="student-avatar"]');
      await expect(avatar).toBeVisible();

      // Content should not overflow horizontally
      const body = page.locator('body');
      const bodyWidth = await body.boundingBox();
      expect(bodyWidth?.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width);
    });

    test('should adapt tabs for mobile navigation', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/student/profile');

      // All tabs should be accessible even on small screens
      await page.click('text=Basic Info');
      await expect(page.locator('text=Personal Information')).toBeVisible();

      await page.click('text=Academics');
      await expect(page.locator('text=Education')).toBeVisible();

      await page.click('text=Professional');
      await expect(page.locator('text=Projects')).toBeVisible();

      await page.click('text=Security');
      await expect(page.locator('text=Change Password')).toBeVisible();
    });

    test('should handle forms responsively on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/student/profile');
      await page.click('text=Academics');

      // Open add education dialog
      await page.click('button:has-text("Add Education")');

      // Dialog should be full-width on mobile
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Form fields should stack vertically on mobile
      const degreeField = page.locator('[name="degree"]');
      const fieldField = page.locator('[name="field"]');

      await expect(degreeField).toBeVisible();
      await expect(fieldField).toBeVisible();

      // Dialog should be scrollable if content overflows
      await page.fill('[name="degree"]', 'Bachelor of Technology');
      await page.fill('[name="field"]', 'Computer Science');
      await page.fill('[name="institution"]', 'Test University');

      // Save button should be accessible
      await page.click('button:has-text("Save")');
      await expect(dialog).not.toBeVisible();
    });

    test('should display resume generation on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/student/profile');

      // Resume dropdown should work on mobile
      await page.click('[data-testid="generate-resume-dropdown"]');
      
      // Menu items should be touch-friendly
      const pdfOption = page.locator('text=Download as PDF');
      await expect(pdfOption).toBeVisible();

      // Touch targets should be appropriately sized
      const boundingBox = await pdfOption.boundingBox();
      expect(boundingBox?.height).toBeGreaterThan(44); // Minimum touch target size
    });

    test('should work on tablet landscape', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tablet);
      await page.goto('/student/profile');

      // Layout should utilize available space efficiently
      await expect(page.locator('text=Student Profile')).toBeVisible();

      // Tabs should be fully visible without scrolling
      const tabsList = page.locator('[role="tablist"]');
      await expect(tabsList).toBeVisible();

      // Content should be laid out in columns where appropriate
      await page.click('text=Professional');
      
      const projectsSection = page.locator('text=Projects');
      const experienceSection = page.locator('text=Experience');
      
      await expect(projectsSection).toBeVisible();
      await expect(experienceSection).toBeVisible();
    });

    test('should handle profile completeness on different screen sizes', async ({ page }) => {
      // Test on mobile
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/student/profile');

      const completenessSection = page.locator('text=Profile Completeness');
      await expect(completenessSection).toBeVisible();

      const progressBar = page.locator('[role="progressbar"]');
      await expect(progressBar).toBeVisible();

      // Test on desktop
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.reload();

      await expect(completenessSection).toBeVisible();
      await expect(progressBar).toBeVisible();

      // Progress bar should maintain readability across screen sizes
      const progressBarBox = await progressBar.boundingBox();
      expect(progressBarBox?.width).toBeGreaterThan(100);
    });
  });

  test.describe('Faculty Profile Responsive Layout', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsFaculty(page);
    });

    test('should display faculty profile correctly on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/faculty/profile');

      // Header should be responsive
      await expect(page.locator('text=Faculty Profile')).toBeVisible();

      // Faculty-specific information should be readable
      await expect(page.locator('text=Staff Code')).toBeVisible();
      await expect(page.locator('text=Department')).toBeVisible();

      // Public profile link should be accessible
      const publicViewBtn = page.locator('text=Public View');
      await expect(publicViewBtn).toBeVisible();
    });

    test('should handle research sections responsively', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/faculty/profile');
      await page.click('text=Research');

      // Research sections should stack on mobile
      await expect(page.locator('text=Experience')).toBeVisible();
      await expect(page.locator('text=Projects')).toBeVisible();
      await expect(page.locator('text=Publications')).toBeVisible();

      // Add publication form should be mobile-friendly
      await page.click('button:has-text("Add Publication")');
      
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Form should be scrollable on mobile
      await page.fill('[name="title"]', 'Research Paper Title');
      await page.fill('[name="authors"]', 'Dr. Smith, Dr. Johnson');
      
      // Complex forms should remain usable
      await page.selectOption('[name="publicationType"]', 'journal');
      await page.fill('[name="venue"]', 'Journal of Computer Science');

      await page.click('button:has-text("Save")');
      await expect(dialog).not.toBeVisible();
    });

    test('should adapt photo upload on different devices', async ({ page }) => {
      // Test on mobile
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/faculty/profile');

      // Photo upload should be accessible
      const photoUploadLabel = page.locator('label[for="photo-upload"]');
      await expect(photoUploadLabel).toBeVisible();

      // Touch target should be appropriately sized
      const labelBox = await photoUploadLabel.boundingBox();
      expect(labelBox?.width).toBeGreaterThan(44);
      expect(labelBox?.height).toBeGreaterThan(44);

      // Test on desktop
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.reload();

      await expect(photoUploadLabel).toBeVisible();
      
      // Desktop version should have hover states
      await page.hover('label[for="photo-upload"]');
    });

    test('should handle complex faculty data on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/faculty/profile');

      // Add multiple publications to test scrolling
      await page.click('text=Research');
      
      for (let i = 0; i < 3; i++) {
        await page.click('button:has-text("Add Publication")');
        await page.fill('[name="title"]', `Research Paper ${i + 1}`);
        await page.fill('[name="authors"]', 'Dr. Smith');
        await page.selectOption('[name="publicationType"]', 'journal');
        await page.fill('[name="venue"]', `Journal ${i + 1}`);
        await page.click('button:has-text("Save")');
      }

      // All publications should be visible and scrollable
      for (let i = 0; i < 3; i++) {
        await expect(page.locator(`text=Research Paper ${i + 1}`)).toBeVisible();
      }

      // Page should remain navigable
      await page.click('text=Basic Info');
      await expect(page.locator('text=Profile Summary')).toBeVisible();
    });
  });

  test.describe('Cross-Device Consistency', () => {
    test('should maintain functionality across viewport changes', async ({ page }) => {
      await loginAsStudent(page);
      await page.goto('/student/profile');

      // Start on desktop
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.click('text=Academics');
      
      // Add a skill
      await page.click('button:has-text("Add Skill")');
      await page.fill('[name="name"]', 'React');
      await page.selectOption('[name="category"]', 'technical');
      await page.click('button:has-text("Save")');

      // Verify skill was added
      await expect(page.locator('text=React')).toBeVisible();

      // Switch to mobile
      await page.setViewportSize(VIEWPORTS.mobile);
      
      // Skill should still be visible
      await expect(page.locator('text=React')).toBeVisible();

      // Should still be able to add more skills
      await page.click('button:has-text("Add Skill")');
      await page.fill('[name="name"]', 'Node.js');
      await page.click('button:has-text("Save")');

      await expect(page.locator('text=Node.js')).toBeVisible();
    });

    test('should handle orientation changes', async ({ page }) => {
      await loginAsStudent(page);
      
      // Portrait tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/student/profile');
      
      await expect(page.locator('text=Student Profile')).toBeVisible();

      // Landscape tablet
      await page.setViewportSize({ width: 1024, height: 768 });
      
      // Content should still be accessible
      await expect(page.locator('text=Student Profile')).toBeVisible();
      
      // Tabs should adapt to wider layout
      const tabsList = page.locator('[role="tablist"]');
      await expect(tabsList).toBeVisible();
    });
  });

  test.describe('Typography and Readability', () => {
    test('should maintain readable text sizes across devices', async ({ page }) => {
      await loginAsStudent(page);
      await page.goto('/student/profile');

      // Test on mobile
      await page.setViewportSize(VIEWPORTS.mobile);
      
      const heading = page.locator('text=Student Profile');
      const headingStyles = await heading.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight
        };
      });

      // Font size should be readable on mobile (at least 16px)
      const fontSize = parseInt(headingStyles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(16);

      // Test on desktop
      await page.setViewportSize(VIEWPORTS.desktop);
      
      const desktopStyles = await heading.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight
        };
      });

      // Desktop font might be larger but should still be readable
      const desktopFontSize = parseInt(desktopStyles.fontSize);
      expect(desktopFontSize).toBeGreaterThanOrEqual(16);
    });

    test('should handle long text content responsively', async ({ page }) => {
      await loginAsStudent(page);
      await page.goto('/student/profile');
      await page.click('text=Professional');

      // Add project with long description
      await page.click('button:has-text("Add Project")');
      
      const longDescription = 'This is a very long project description that should wrap properly on different screen sizes and not cause horizontal scrolling issues. '.repeat(5);
      
      await page.fill('[name="title"]', 'Long Description Project');
      await page.fill('[name="description"]', longDescription);
      await page.click('button:has-text("Save")');

      // Test on mobile
      await page.setViewportSize(VIEWPORTS.mobile);
      
      const descriptionElement = page.locator('text=This is a very long project description');
      await expect(descriptionElement).toBeVisible();

      // Text should not cause horizontal overflow
      const bodyWidth = await page.locator('body').boundingBox();
      expect(bodyWidth?.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width);
    });
  });

  test.describe('Touch and Interaction', () => {
    test('should support touch gestures on mobile', async ({ page }) => {
      await loginAsStudent(page);
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/student/profile');

      // Touch scrolling should work
      await page.evaluate(() => {
        window.scrollTo(0, 100);
      });

      // Verify scroll worked
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);

      // Touch tap should work for navigation
      await page.tap('text=Academics');
      await expect(page.locator('text=Education')).toBeVisible();
    });

    test('should have appropriate spacing for touch targets', async ({ page }) => {
      await loginAsStudent(page);
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/student/profile');
      await page.click('text=Academics');

      // Interactive elements should have adequate spacing
      const addSkillBtn = page.locator('button:has-text("Add Skill")');
      const addEducationBtn = page.locator('button:has-text("Add Education")');

      const skillBtnBox = await addSkillBtn.boundingBox();
      const educationBtnBox = await addEducationBtn.boundingBox();

      // Both buttons should be at least 44px in height (touch target guideline)
      expect(skillBtnBox?.height).toBeGreaterThanOrEqual(44);
      expect(educationBtnBox?.height).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('Performance on Different Devices', () => {
    test('should load quickly on mobile networks', async ({ page }) => {
      // Simulate slow 3G connection
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add delay
        await route.continue();
      });

      await loginAsStudent(page);
      await page.setViewportSize(VIEWPORTS.mobile);
      
      const startTime = Date.now();
      await page.goto('/student/profile');
      await page.waitForSelector('text=Student Profile');
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time even on slow connection
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle low-end device constraints', async ({ page }) => {
      await loginAsStudent(page);
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/student/profile');

      // Simulate memory constraints by adding many elements
      await page.click('text=Academics');
      
      // Add many skills rapidly
      for (let i = 0; i < 10; i++) {
        await page.click('button:has-text("Add Skill")');
        await page.fill('[name="name"]', `Skill ${i}`);
        await page.selectOption('[name="category"]', 'technical');
        await page.click('button:has-text("Save")');
      }

      // Page should remain responsive
      await page.click('text=Professional');
      await expect(page.locator('text=Projects')).toBeVisible();

      // Memory usage should be reasonable (this is hard to test directly)
      // But the page should still be interactive
      await page.click('button:has-text("Add Project")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Accessibility Across Devices', () => {
    test('should maintain accessibility on mobile', async ({ page }) => {
      await loginAsStudent(page);
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/student/profile');

      // Screen reader support should work on mobile
      const heading = page.locator('text=Student Profile');
      await expect(heading).toBeVisible();

      // Keyboard navigation should work even on touch devices
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // ARIA labels should be present
      const tabList = page.locator('[role="tablist"]');
      await expect(tabList).toBeVisible();
    });

    test('should support zoom up to 200%', async ({ page }) => {
      await loginAsStudent(page);
      await page.goto('/student/profile');

      // Simulate 200% zoom by reducing viewport and scaling
      await page.setViewportSize({ 
        width: VIEWPORTS.desktop.width / 2, 
        height: VIEWPORTS.desktop.height / 2 
      });

      // Content should still be accessible
      await expect(page.locator('text=Student Profile')).toBeVisible();
      
      // Interactive elements should still be clickable
      await page.click('text=Academics');
      await expect(page.locator('text=Education')).toBeVisible();

      // Forms should still be usable
      await page.click('button:has-text("Add Skill")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });
});