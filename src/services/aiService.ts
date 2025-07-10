import { AIService } from './ai';

export const getAIResponse = async (transcription: string, category: string): Promise<string> => {
  try {
    // Use your existing AIService.generateResponse method
    const response = await AIService.generateResponse(transcription, category, {
      currentStreak: 0, // You can pass actual streak data here if available
    });
    
    return response;
  } catch (error) {
    console.error('❌ Error getting AI response:', error);
    // Return a fallback response
    return "Thank you for sharing what's going well! Keep building on this positive momentum.";
  }
};

// Re-export the AIService for other uses
export { AIService };