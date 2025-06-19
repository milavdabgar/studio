// Test Gallery shortcode parsing
const testContent = `
{{< gallery >}}
  <img src="gallery/01.jpg" class="grid-w33" />
  <img src="gallery/02.jpg" class="grid-w33" />
  <img src="gallery/03.jpg" class="grid-w33" />
{{< /gallery >}}
`;

// Simulate the paired shortcode regex
const pairedShortcodeRegex = /\{\{<\s*(\w+(?:-\w+)*)\s*([^>]*?)\s*>\}\}([\s\S]*?)\{\{<\s*\/\1\s*>\}\}/g;

let match;
while ((match = pairedShortcodeRegex.exec(testContent)) !== null) {
  console.log('Full match:', match[0]);
  console.log('Shortcode name:', match[1]);
  console.log('Parameters:', match[2]);
  console.log('Inner content:', match[3]);
  console.log('Inner content length:', match[3].length);
  console.log('Inner content trimmed:', match[3].trim());
  console.log('Inner content trimmed length:', match[3].trim().length);
  console.log('---');
}
