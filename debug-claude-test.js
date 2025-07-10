// Temporary test file to debug Claude API connection
// Run this in your app to test the API connection

import { AIService } from './src/services/ai';

// Add this to your App.js or any component temporarily to test
export const ClaudeDebugTest = () => {
  const testConnection = async () => {
    console.log("🧪 Starting Claude API Debug Test...");
    
    // Test 1: Debug API key status
    console.log("\n=== API Key Debug ===");
    AIService.debugAPIKeyStatus();
    
    // Test 2: Test Claude API connection
    console.log("\n=== API Connection Test ===");
    const apiResult = await AIService.testClaudeAPI();
    console.log("API Test Result:", apiResult);
    
    // Test 3: Test a real response
    console.log("\n=== Real Response Test ===");
    try {
      const response = await AIService.generateResponse(
        "I'm grateful for my morning coffee today. It was warm and energizing.",
        "Personal Growth",
        { currentStreak: 1 }
      );
      console.log("Response Result:", response);
    } catch (error) {
      console.error("Response Test Error:", error);
    }
  };
  
  // Call this function when your app loads
  testConnection();
  
  return null; // This is just for testing
};

// Instructions:
// 1. Import this in your App.js: import { ClaudeDebugTest } from './debug-claude-test';
// 2. Add <ClaudeDebugTest /> somewhere in your render method
// 3. Check the console logs for the results
// 4. Remove this after testing