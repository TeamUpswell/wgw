import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY, // Support both naming conventions
});

export { anthropic };