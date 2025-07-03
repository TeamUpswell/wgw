import OpenAI from "openai";
import * as FileSystem from "expo-file-system";

// Get API key from environment
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("⚠️ OpenAI API key not found in environment variables");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Complete Greg Bell "What's Going Well" quotes collection
const wgwQuotes = [
  { text: "For there is nothing good or bad but thinking that makes it so.", author: "Shakespeare, Hamlet", themes: ["perspective", "mindset"] },
  { text: "People are disturbed not by things, but by the view they take of them.", author: "Epictetus", themes: ["perspective", "mindset"] },
  { text: "We don't see things as they are. We see them as we are.", author: "Anaïs Nin", themes: ["perspective", "self-awareness"] },
  { text: "You don't know what you've got till it's gone.", author: "Joni Mitchell", themes: ["appreciation", "gratitude"] },
  { text: "Tell me what you pay attention to and I will show you who you are.", author: "José Ortega", themes: ["attention", "self-awareness"] },
  { text: "The aim of positive psychology is to catalyze a change in psychology from a preoccupation only with repairing the worst things in life to also building the best qualities in life.", author: "Dr. Martin Seligman", themes: ["growth", "positive-psychology"] },
  { text: "If you can't explain it simply, you don't understand it well enough.", author: "Albert Einstein", themes: ["clarity", "understanding"] },
  { text: "Your mind will answer most questions if you learn to relax and wait for the answer.", author: "Unknown", themes: ["patience", "mindfulness"] },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", themes: ["simplicity", "clarity"] },
  { text: "It is not the reality that shapes us, but the lens through which we view reality.", author: "Shawn Achor", themes: ["perspective", "mindset"] },
  { text: "I freed the statue from the stone.", author: "Michelangelo", themes: ["potential", "growth"] },
  { text: "Knowledge is having the right answer. Intelligence is having the right question.", author: "Unknown", themes: ["curiosity", "wisdom"] },
  { text: "It's the little details that are vital. Little things make big things happen.", author: "John Wooden", themes: ["attention", "appreciation"] },
  { text: "The fish is the last to know about water.", author: "Albert Einstein", themes: ["awareness", "perspective"] },
  { text: "What the human being is best at doing is interpreting all new information so that their prior conclusions remain intact.", author: "Warren Buffett", themes: ["bias", "awareness"] },
  { text: "If you realized how powerful your thoughts are, you would never think a negative thought.", author: "Peace Pilgrim", themes: ["mindset", "power"] },
  { text: "Be careful how you are talking to yourself, because you are listening.", author: "Lisa M. Hayes", themes: ["self-talk", "awareness"] },
  { text: "When virtues are pointed out first, flaws seem less insurmountable.", author: "Judith Martin", themes: ["appreciation", "perspective"] },
  { text: "Great minds discuss ideas. Average minds discuss events. Small minds discuss people.", author: "Eleanor Roosevelt", themes: ["focus", "growth"] },
  { text: "If you concentrate on what you don't have, you will never, ever have enough.", author: "Oprah Winfrey", themes: ["abundance", "gratitude"] },
  { text: "Do not spoil what you have by desiring what you have not; remember that what you have now was once among the things you hoped for.", author: "Epicurus", themes: ["gratitude", "contentment"] },
  { text: "What you appreciate, appreciates.", author: "Lynne Twist", themes: ["appreciation", "abundance"] },
  { text: "Doing the same thing over and over and expecting different results.", author: "Albert Einstein", themes: ["change", "growth"] },
  { text: "You must live as you think, otherwise you will end up thinking as you have lived.", author: "Paul Bourget", themes: ["alignment", "authenticity"] },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", themes: ["habits", "excellence"] },
  { text: "If you want to live a life you have never lived, you have to do things you have never done.", author: "Jen Sincero", themes: ["change", "growth"] },
  { text: "Awareness allows us to get outside of our mind and observe it in action.", author: "Dan Brulé", themes: ["awareness", "mindfulness"] },
  { text: "It is in our darkest moments that we must focus to see the light.", author: "Aristotle", themes: ["resilience", "hope"] },
  { text: "There's only one way to fail, and that is by giving up before you succeed.", author: "Oliver Lockhart", themes: ["persistence", "resilience"] },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin", themes: ["habits", "consistency"] },
  { text: "Concentrate all your thoughts upon the work at hand. The sun rays do not burn until brought into focus.", author: "Alexander Graham Bell", themes: ["focus", "attention"] },
  { text: "My desire to be well-informed is at odds with my desire to remain sane.", author: "Anonymous", themes: ["balance", "mindfulness"] },
  { text: "Where is the knowledge we have lost in information?", author: "T.S. Eliot", themes: ["wisdom", "clarity"] },
  { text: "All relationships are a reflection of your relationship with yourself.", author: "Deepak Chopra", themes: ["relationships", "self-awareness"] },
  { text: "To know others is knowledge. To know oneself is wisdom.", author: "Lao Tzu", themes: ["wisdom", "self-awareness"] },
  { text: "Appreciation is a wonderful thing. It makes what is excellent in others belong to us as well.", author: "Voltaire", themes: ["appreciation", "relationships"] },
  { text: "Appreciation can make a day, even change a life. Your willingness to put it into words is all that is necessary.", author: "Margaret Cousins", themes: ["appreciation", "expression"] },
  { text: "The first wealth is health.", author: "Ralph Waldo Emerson", themes: ["health", "priorities"] },
  { text: "Expectations are resentments under construction.", author: "Anne Lamott", themes: ["expectations", "acceptance"] },
  { text: "To win in the marketplace, you must first win in the workplace.", author: "Doug Conant", themes: ["career", "success"] },
  { text: "Where attention goes, energy flows.", author: "James Redfield", themes: ["attention", "energy"] },
  { text: "When one door closes, another opens, but we often look so long and so regretfully upon the closed door that we do not see the one which has opened for us.", author: "Helen Keller", themes: ["opportunity", "resilience"] },
  { text: "You never know how strong you are until being strong is the only choice you have.", author: "Bob Marley", themes: ["strength", "resilience"] },
  { text: "The last of human freedoms is to choose one's attitude in any given set of circumstances.", author: "Viktor Frankl", themes: ["freedom", "choice"] },
  { text: "Rough seas make better sailors.", author: "Unknown", themes: ["resilience", "growth"] },
  { text: "That which does not kill us makes us stronger.", author: "Nietzsche", themes: ["resilience", "strength"] },
  { text: "In the depth of winter, I finally learned that within me there lay an invincible summer.", author: "Albert Camus", themes: ["resilience", "inner-strength"] },
  { text: "Every adversity carries with it a seed of equivalent greater benefit.", author: "Napoleon Hill", themes: ["opportunity", "growth"] },
  { text: "Barn's burnt down—now I can see the moon.", author: "Masahide, Japanese poet", themes: ["perspective", "opportunity"] },
  { text: "Things that were hard to bear are sweet to remember.", author: "Seneca", themes: ["perspective", "growth"] },
  { text: "Have patience with all things, but first of all, with yourself.", author: "St. Francis de Sales", themes: ["patience", "self-compassion"] }
];

export class AIService {
  static async transcribeAudio(audioUri: string): Promise<string> {
    try {
      console.log("🎯 Starting transcription for:", audioUri);

      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error("Audio file not found");
      }

      console.log("📂 File info:", fileInfo);

      const formData = new FormData();
      formData.append("file", {
        uri: audioUri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any);

      formData.append("model", "whisper-1");
      formData.append("language", "en");
      formData.append("response_format", "json");

      console.log("📤 Sending transcription request to OpenAI...");

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        }
      );

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ OpenAI API Error:", response.status, errorText);

        if (
          response.status === 400 &&
          errorText.includes("Invalid file format")
        ) {
          console.log("🔄 File format issue, trying alternative approach...");
          return await this.transcribeAudioAlternative(audioUri);
        }

        throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Transcription completed:", result.text);
      return result.text;
    } catch (error) {
      console.error("❌ Transcription error:", error);

      try {
        console.log("🔄 Trying alternative transcription method...");
        return await this.transcribeAudioAlternative(audioUri);
      } catch (altError) {
        console.error("❌ Alternative transcription also failed:", altError);
        console.log("🔄 Using fallback mock transcription");
        return "I'm grateful for this moment and the opportunity to share what's going well in my life. [Note: Audio transcription failed, using fallback]";
      }
    }
  }

  static async transcribeAudioAlternative(audioUri: string): Promise<string> {
    try {
      console.log("🎯 Alternative transcription method for:", audioUri);

      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(`data:audio/m4a;base64,${base64Audio}`);
      const blob = await response.blob();

      const audioFile = new File([blob], "recording.m4a", {
        type: "audio/m4a",
      });

      console.log("📤 Sending alternative transcription request...");

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
      });

      console.log("✅ Alternative transcription completed:", transcription.text);
      return transcription.text;
    } catch (error) {
      console.error("❌ Alternative transcription error:", error);
      throw error;
    }
  }

  static async testTranscriptionAPI(): Promise<string> {
    try {
      console.log("🧪 Testing OpenAI Whisper API connection...");

      const testResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "Say 'Transcription API ready' if you can read this.",
          },
        ],
        max_tokens: 10,
      });

      const result = testResponse.choices[0]?.message?.content || "No response";
      console.log("✅ OpenAI API test result:", result);
      return result;
    } catch (error) {
      console.error("❌ API test failed:", error);
      return "API test failed";
    }
  }

  static async generateResponse(
    transcription: string,
    category: string,
    context?: {
      currentStreak?: number;
      previousEntries?: string[];
    }
  ): Promise<string> {
    try {
      console.log(
        "🤖 Generating Greg Bell-inspired response for:",
        transcription.slice(0, 50) + "..."
      );

      const systemPrompt = this.buildGregBellSystemPrompt(category, context);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here's what I'm grateful for: "${transcription}"`,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const response =
        completion.choices[0]?.message?.content ||
        "Thank you for sharing your gratitude.";
      console.log(
        "✅ Greg Bell-inspired response generated:",
        response.slice(0, 50) + "..."
      );
      return response;
    } catch (error) {
      console.error("❌ AI response error:", error);
      return this.generateGregBellMockResponse(transcription, category);
    }
  }

  private static buildGregBellSystemPrompt(
    category: string,
    context?: any
  ): string {
    const selectedQuote = this.getContextualQuote(category, context);
    
    const gregBellPrinciples = `
You are an AI coach inspired by Greg Bell's "What's Going Well" methodology. Embody these core principles:

1. FOCUS ON WHAT'S WORKING: Celebrate what's already good and build momentum from there.
2. SPECIFIC APPRECIATION: Encourage detailed, precise gratitude observations.
3. PRESENT MOMENT AWARENESS: Ground users in positive experiences happening now.
4. GROWTH MINDSET: Frame challenges as learning opportunities and stepping stones.
5. CONSISTENT PRACTICE: Reinforce daily gratitude habits and positive momentum.
6. CONNECTION TO VALUES: Help users align gratitude with personal meaning and purpose.
7. POSITIVE SPIRAL: Show how appreciation creates more to appreciate.

Inspirational Context: ${selectedQuote}

Response Style:
- Warm, encouraging, and authentically supportive
- Reflect back specific insights from the user's sharing
- Ask gentle follow-up questions that deepen reflection
- Connect individual moments to broader themes of growth and wellbeing
- Conversational tone (80-120 words)
- End with forward-looking encouragement or a gentle question
- Occasionally weave in relevant wisdom from the quote collection when it naturally fits

Remember: You're helping people train their attention on what's going well, building neural pathways for positivity and resilience.
`;

    const categoryGuidance = this.getCategoryGuidance(category);

    let basePrompt = `${gregBellPrinciples}\n${categoryGuidance}\nThe user is sharing gratitude in the "${category}" category.`;

    if (context?.currentStreak && context.currentStreak > 1) {
      basePrompt += `\n\nNote: This user is on a ${context.currentStreak}-day gratitude streak. Celebrate their consistency and reinforce the positive momentum they're building.`;
    }

    return basePrompt;
  }

  private static getCategoryGuidance(category: string): string {
    const categoryMap: Record<string, string> = {
      "Personal Growth": "Highlight self-awareness, positive changes, and continuous improvement. Celebrate growth mindset and learning journey.",
      "Relationships": "Emphasize connection, mutual appreciation, and positive interactions. Strengthen bonds through shared gratitude.",
      "Career": "Focus on meaningful contributions, professional development, and workplace satisfaction. Celebrate strengths and progress.",
      "Health & Wellness": "Connect physical, mental, and emotional health. Praise healthy choices and body appreciation.",
      "Family": "Celebrate family bonds, shared experiences, support systems, and unconditional love. Reinforce positive familial connections.",
      "Achievements": "Acknowledge accomplishments while connecting them to effort, growth, and future opportunities. Celebrate all milestone sizes.",
      "Simple Pleasures": "Encourage mindfulness, presence, and joy in everyday moments. Celebrate the power of noticing small beauties.",
      "Learning": "Highlight curiosity, discovery, and the joy of expanding horizons. Reinforce growth mindset and knowledge acquisition."
    };

    return categoryMap[category] || "Guide the user to deeply appreciate this aspect of their life, connecting gratitude to broader personal meaning and growth.";
  }

  // Enhanced quote selection based on context and themes
  private static getContextualQuote(category: string, context?: any): string {
    // Map categories to relevant themes
    const categoryThemes: Record<string, string[]> = {
      "Personal Growth": ["growth", "awareness", "habits", "change"],
      "Relationships": ["relationships", "appreciation", "connection"],
      "Career": ["career", "success", "focus", "excellence"],
      "Health & Wellness": ["health", "balance", "mindfulness"],
      "Family": ["relationships", "appreciation", "love"],
      "Achievements": ["success", "persistence", "excellence"],
      "Simple Pleasures": ["appreciation", "mindfulness", "perspective"],
      "Learning": ["growth", "curiosity", "wisdom"]
    };

    const relevantThemes = categoryThemes[category] || ["general"];
    
    // Filter quotes by relevant themes
    const relevantQuotes = wgwQuotes.filter(quote => 
      quote.themes?.some(theme => relevantThemes.includes(theme)) || 
      relevantThemes.includes("general")
    );

    // Select from relevant quotes or fall back to all quotes
    const quotesToChooseFrom = relevantQuotes.length > 0 ? relevantQuotes : wgwQuotes;
    const selectedQuote = quotesToChooseFrom[Math.floor(Math.random() * quotesToChooseFrom.length)];
    
    return `"${selectedQuote.text}" - ${selectedQuote.author}`;
  }

  private static generateGregBellMockResponse(
    transcription: string,
    category: string
  ): string {
    const responses = [
      `What you've shared shows beautiful awareness of what's working in your ${category.toLowerCase()}. This specific appreciation is exactly how positive momentum builds. As Lynne Twist reminds us, "What you appreciate, appreciates." Keep noticing these moments - they're creating a foundation for even more good to discover.`,

      `I love how you're focusing on what's going well here! That gratitude for your ${category.toLowerCase()} shows you're building on success rather than dwelling on challenges. This positive awareness creates more opportunities for growth and happiness. What other aspects of this experience brought you unexpected joy?`,

      `Your gratitude practice is helping you see the good that's already flowing in your life. This appreciation for ${category.toLowerCase()} demonstrates the power of present-moment awareness. These specific details you've shared show real depth of reflection. Keep building on this beautiful momentum!`,

      `What strikes me most is how specifically you've described what's working well. That level of detailed appreciation in your ${category.toLowerCase()} is exactly what transforms ordinary moments into sources of lasting joy. As José Ortega said, "Tell me what you pay attention to and I will show you who you are." You're training your attention beautifully.`,

      `${this.getRandomQuote()} Your gratitude for ${category.toLowerCase()} perfectly illustrates this wisdom. You're training your attention to see what's working, and that creates more of what you appreciate. Keep nurturing this beautiful practice - you're literally rewiring your brain for positivity!`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private static getRandomQuote(): string {
    const randomQuote = wgwQuotes[Math.floor(Math.random() * wgwQuotes.length)];
    return `As ${randomQuote.author} wisely said: "${randomQuote.text}"`;
  }

  // Enhanced thematic quote selection
  static getThematicQuote(
    theme: 'attention' | 'growth' | 'appreciation' | 'perspective' | 'resilience' | 'habits' | 'mindfulness' | 'general' = 'general'
  ): string {
    const relevantQuotes = wgwQuotes.filter(quote => 
      quote.themes?.includes(theme) || theme === 'general'
    );
    
    const quotesToChooseFrom = relevantQuotes.length > 0 ? relevantQuotes : wgwQuotes;
    const randomQuote = quotesToChooseFrom[Math.floor(Math.random() * quotesToChooseFrom.length)];
    
    return `"${randomQuote.text}" - ${randomQuote.author}`;
  }

  // Method to get quotes by multiple themes
  static getQuotesByThemes(themes: string[]): string {
    const relevantQuotes = wgwQuotes.filter(quote => 
      quote.themes?.some(theme => themes.includes(theme))
    );
    
    if (relevantQuotes.length === 0) {
      return this.getThematicQuote('general');
    }
    
    const randomQuote = relevantQuotes[Math.floor(Math.random() * relevantQuotes.length)];
    return `"${randomQuote.text}" - ${randomQuote.author}`;
  }

  // Method to get a daily inspirational quote
  static getDailyQuote(): string {
    // Use date as seed for consistent daily quote
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % wgwQuotes.length;
    
    const quote = wgwQuotes[quoteIndex];
    return `"${quote.text}" - ${quote.author}`;
  }
}