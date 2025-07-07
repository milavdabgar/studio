/**
 * Mock for shiki syntax highlighting library
 */

const codeToHtml = jest.fn().mockImplementation((code, options) => {
  const language = options?.lang || 'text';
  const theme = options?.theme || 'github-dark';
  
  // Return a simple HTML structure that mimics shiki output
  return Promise.resolve(`
    <pre class="shiki ${theme}" tabindex="0">
      <code>
        <span class="line">
          <span class="token">${code}</span>
        </span>
      </code>
    </pre>
  `);
});

// Mock bundled types
const BundledLanguage = 'javascript';
const BundledTheme = 'github-dark';

module.exports = {
  codeToHtml,
  BundledLanguage,
  BundledTheme
};