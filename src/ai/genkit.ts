
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Use plugins array for genkit configuration
const plugins: ReturnType<typeof googleAI>[] = [];
let defaultModel: string | undefined = undefined;

// Check for GOOGLE_API_KEY.
// This check is crucial for both build-time and runtime.
// The key *must* be present for Google AI features to function correctly.
if (process.env.GOOGLE_API_KEY) {
  plugins.push(googleAI()); // Initialize and add the plugin only if the key exists
  defaultModel = 'googleai/gemini-2.0-flash'; // Set the default model that relies on this plugin
} else {
  const stars = '*'.repeat(70);
  const warningMessage =
    `\n${stars}\n` +
    `* WARNING: GOOGLE_API_KEY environment variable is NOT SET.             *\n` +
    `* The Genkit Google AI plugin (@genkit-ai/googleai) is NOT initialized.  *\n` +
    `* AI-dependent features (e.g., feedback analysis) will NOT function.   *\n` +
    `* Ensure GOOGLE_API_KEY is set in your environment for these features. *\n` +
    `${stars}\n`;

  // This warning will appear during 'next build' and on server startup if the key is missing.
  console.warn(warningMessage);

  // Note: If other parts of the application (e.g., specific flows or prompts)
  // strictly expect a 'googleai/...' model or the googleAI plugin to be active,
  // runtime errors will occur there. This change prioritizes build completion.
}

export const ai = genkit({
  plugins: plugins,
  model: defaultModel, // This will be undefined if the Google AI plugin is not loaded
  // You might consider adding logSinks and traceSinks for better observability,
  // or setting enableTracing based on environment.
  // enableTracing: process.env.NODE_ENV === 'development',
});
