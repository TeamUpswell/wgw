// Quick test to verify Claude account status
// Add this temporarily to your App.js to run the test

import { AIService } from './src/services/ai';

export const TestClaudeAccount = () => {
  const runAccountTest = async () => {
    console.log("🔍 STARTING CLAUDE ACCOUNT VERIFICATION...\n");
    
    // Run comprehensive account verification
    await AIService.verifyAccountStatus();
    
    console.log("\n📋 WHAT TO CHECK IN ANTHROPIC CONSOLE:");
    console.log("1. Go to: https://console.anthropic.com/");
    console.log("2. Check 'API Keys' section - does your key end with the same 8 characters shown above?");
    console.log("3. Check 'Billing' section - is the $79.37 balance shown there?");
    console.log("4. Check 'Usage' section - any recent activity or limits?");
    console.log("5. Check 'Organization' settings - is this a personal or org account?");
    
    console.log("\n🚨 POSSIBLE SOLUTIONS:");
    console.log("A. If key endings don't match: You're using wrong API key");
    console.log("B. If balance not in same account: API key from different account");
    console.log("C. If key is correct but blocked: Contact Anthropic support");
    console.log("D. If recent key regeneration: Old key may be cached");
  };
  
  // Run test when component mounts
  React.useEffect(() => {
    runAccountTest();
  }, []);
  
  return null; // This is just for testing
};

// INSTRUCTIONS:
// 1. Import this in your App.js: import { TestClaudeAccount } from './test-claude-account';
// 2. Add <TestClaudeAccount /> to your render method  
// 3. Check console logs for detailed account verification
// 4. Compare results with your Anthropic console
// 5. Remove this file after testing