import { AIService } from './ai';

export const getAIResponse = async (transcription: string, category: string): Promise<string> => {
  try {
    console.log('🎯 getAIResponse called with:', { transcription: transcription.slice(0, 50) + '...', category });
    
    // Use your existing AIService.generateResponse method
    const response = await AIService.generateResponse(transcription, category, {
      currentStreak: 0, // You can pass actual streak data here if available
    });
    
    console.log('✅ getAIResponse returning:', response.slice(0, 100) + '...');
    return response;
  } catch (error) {
    console.error('❌ Error getting AI response:', error);
    const fallback = "Thank you for sharing what's going well! Keep building on this positive momentum.";
    console.log('🔄 Using fallback response:', fallback);
    return fallback;
  }
};

// Re-export the AIService for other uses
export { AIService };