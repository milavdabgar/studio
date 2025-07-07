/**
 * Mock for katex library
 */

const renderToString = jest.fn().mockImplementation((math, options) => {
  const displayMode = options?.displayMode || false;
  const tag = displayMode ? 'div' : 'span';
  
  return `<${tag} class="katex">${math}</${tag}>`;
});

module.exports = {
  renderToString
};