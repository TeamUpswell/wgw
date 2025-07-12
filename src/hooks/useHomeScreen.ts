import { useState, useEffect, useRef, useMemo } from "react";
import { ScrollView, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../config/supabase";
import { openai } from "../config/openai";
import { anthropic } from "../config/anthropic";
import { NotificationModal } from "../components/NotificationModal";
import { AIService } from "../services/ai";
import { getAIResponse } from "../services/aiService";
import { addPendingAction } from "../store/slices/offlineSlice";
import { addEntry } from "../store/slices/entriesSlice";
import { store } from "../store";
import { useDispatch } from "react-redux";

import { resizeImage, DEFAULT_IMAGE_OPTIONS } from "../utils/imageUtils";

// Utility to upload image to Supabase Storage and return public URL
export const uploadImageToSupabase = async (
  uri: string,
  userId: string
): Promise<string> => {
  console.log('📤 Starting image upload process...');
  
  // Resize image before upload
  const resizedImage = await resizeImage(uri, DEFAULT_IMAGE_OPTIONS);
  console.log('✅ Image resized from', uri, 'to', resizedImage.uri);
  
  const response = await fetch(resizedImage.uri);
  const blob = await response.blob();
  const fileExt = resizedImage.uri.split(".").pop() || 'jpg';
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  
  console.log('📁 Uploading to Supabase:', fileName, 'Size:', blob.size, 'bytes');
  
  const { data, error } = await supabase.storage
    .from("entry-images")
    .upload(fileName, blob, {
      contentType: blob.type,
      upsert: false,
    });
  if (error) throw error;
  
  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("entry-images")
    .getPublicUrl(data.path);
  
  console.log('✅ Image uploaded successfully:', publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
};

// Analyze entry with both image and text using OpenAI Vision API
export const analyzeEntryWithImageAndText = async (
  text: string,
  imageUrl: string | null,
  category: string
): Promise<string> => {
  try {
    if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found. Please check your .env file.');
    }
    
    // Check if Anthropic is available for superior wellness coaching
    const hasAnthropicKey = !!(process.env.CLAUDE_API_KEY || process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY);
    let prompt = `You are a supportive wellness coach helping someone with their daily gratitude practice. They just shared what's going well in their "${category}" area of life.`;
    
    if (text) {
      prompt += `\n\nTheir written reflection: "${text}"`;
    }
    
    if (imageUrl) {
      prompt += `\n\nThey also shared a photo to capture this moment visually. Please analyze both their written words and the image content.`;
    }
    
    if (imageUrl && text) {
      prompt += `\n\nPlease provide:\n1. A warm acknowledgment of both their written reflection AND what you observe in their photo\n2. Connect the image content to their written words - how do they complement each other?\n3. A specific insight about what this moment reveals about their wellbeing journey\n4. An encouraging suggestion for building on this positive experience\n5. Keep it conversational, insightful, and under 180 words\n\nFocus heavily on their written reflection while using the image to add depth and context to your response.`;
    } else if (imageUrl) {
      prompt += `\n\nPlease provide:\n1. A warm, encouraging response about what you see in their photo\n2. Specific observations about the positive elements, emotions, or experiences captured\n3. Connect what you see to their wellbeing and gratitude practice\n4. A gentle suggestion for how they might build on this positive moment\n5. Keep it conversational, supportive, and under 150 words`;
    } else {
      prompt += `\n\nPlease provide:\n1. A warm, encouraging response acknowledging what they shared\n2. A specific insight or observation about their reflection\n3. A gentle suggestion for how they might build on this positive momentum\n4. Keep it conversational, supportive, and under 150 words`;
    }

    let messages;
    if (imageUrl) {
      messages = [
        {
          role: "system" as const,
          content: [
            {
              type: "text" as const,
              text: "You are a supportive wellness coach specializing in gratitude and positive psychology. Your responses are warm, insightful, and encouraging.",
            },
          ],
        },
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: prompt },
            { type: "image_url" as const, image_url: { url: imageUrl } },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: "system" as const,
          content:
            "You are a supportive wellness coach specializing in gratitude and positive psychology. Your responses are warm, insightful, and encouraging.",
        },
        {
          role: "user" as const,
          content: prompt,
        },
      ];
    }

    let aiResponse;
    
    if (imageUrl) {
      console.log('🖼️ Processing image analysis...');
      console.log('Image URL:', imageUrl?.substring(0, 100) + '...');
      console.log('Text length:', text?.length || 0);
      console.log('Category:', category);
      
      // Validate image URL
      if (!imageUrl || !imageUrl.startsWith('http')) {
        console.error('❌ Invalid image URL:', imageUrl);
        throw new Error('Invalid image URL provided');
      }
      
      // Two-step approach: GPT-4o for image analysis → Claude for wellness coaching
      
      // Step 1: Use GPT-4o to analyze the image
      const imageAnalysisPrompt = `Analyze this image in the context of someone's "${category}" gratitude practice. Describe:
1. What you see in the image (objects, people, setting, mood)
2. The emotions or feelings the image conveys
3. How this relates to wellbeing, gratitude, or positive experiences
4. Any meaningful details that show what's going well for this person
Keep it factual and observational, focusing on positive elements. This will be used by a wellness coach to provide feedback.`;

      const imageAnalysisMessages = [
        {
          role: "system" as const,
          content: "You are an expert at analyzing images for emotional and wellbeing content. Provide detailed, positive observations.",
        },
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: imageAnalysisPrompt },
            { type: "image_url" as const, image_url: { url: imageUrl } },
          ],
        },
      ];

      console.log('🤖 Calling GPT-4o for image analysis...');
      const imageAnalysisResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: imageAnalysisMessages,
        max_tokens: 200,
        temperature: 0.3, // Lower temperature for more consistent analysis
      });
      console.log('✅ GPT-4o analysis complete');

      const imageAnalysis = imageAnalysisResponse.choices[0]?.message?.content;
      
      if (!imageAnalysis) {
        console.error('❌ No image analysis received from GPT-4o');
        throw new Error('Failed to analyze image content');
      }
      
      console.log('🖼️ Image analysis:', imageAnalysis.substring(0, 200) + '...');
      
      // Step 2: Use Claude for wellness coaching response (if available)
      if (hasAnthropicKey) {
        console.log('🤖 Calling Claude for wellness coaching...');
        // Clean and validate inputs for Claude
        const cleanText = (text || '').trim().replace(/["\\]/g, '');
        const cleanImageAnalysis = (imageAnalysis || '').trim().replace(/["\\]/g, '');
        const cleanCategory = (category || 'Personal Growth').trim();
        
        // Combine text and image analysis for Greg Bell-style coaching
        const combinedReflection = `${cleanText} [Image context: ${cleanImageAnalysis}]`;
        
        console.log('🎯 Using Greg Bell methodology for combined text+image coaching...');
        
        // Use AIService for Greg Bell-inspired response
        aiResponse = await AIService.generateResponse(combinedReflection, cleanCategory, {
          currentStreak: 0 // Could pass actual streak here if available
        });
        
        if (!aiResponse) {
          console.error('❌ No response content from Claude');
          throw new Error('Claude returned empty response');
        }
      } else {
        // Fallback: Use OpenAI for coaching response too
        const coachingPrompt = `You are a supportive wellness coach helping someone with their daily gratitude practice in their "${category}" area of life.

Their written reflection: "${text}"

Image analysis: "${imageAnalysis}"

Based on both their written words and what's shown in the image, provide a warm, encouraging wellness coaching response. Focus on:
1. Acknowledging both their reflection and the visual moment
2. Connecting their words to what's shown in the image
3. Insights about their growth or positive mindset
4. An encouraging suggestion for building on this experience
5. Keep it conversational, warm, and under 180 words

Be a supportive wellness coach who sees the deeper meaning in both their words and visual capture.`;

        const coachingResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a supportive wellness coach specializing in gratitude and positive psychology. Your responses are warm, insightful, and encouraging."
            },
            {
              role: "user", 
              content: coachingPrompt
            }
          ],
          max_tokens: 250,
          temperature: 0.7,
        });
        
        aiResponse = coachingResponse.choices[0]?.message?.content;
      }
      
    } else {
      // Text-only analysis - use Greg Bell trained service
      if (hasAnthropicKey) {
        console.log('🎯 Using Greg Bell methodology for text-only coaching...');
        
        // Use AIService for Greg Bell-inspired response
        aiResponse = await AIService.generateResponse(text, category, {
          currentStreak: 0 // Could pass actual streak here if available
        });
      } else {
        // Use OpenAI for text-only analysis
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a supportive wellness coach specializing in gratitude and positive psychology. Your responses are warm, insightful, and encouraging."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 250,
          temperature: 0.7,
        });
        
        aiResponse = response.choices[0]?.message?.content;
      }
    }
    
    if (!aiResponse) {
      throw new Error("No response generated");
    }
    return aiResponse;
  } catch (error) {
    console.error("❌ AI feedback error:", error);
    console.error("❌ Error type:", typeof error);
    console.error("❌ Error message:", (error as any)?.message);
    console.error("❌ Error status:", (error as any)?.status);
    console.error("❌ Error response:", (error as any)?.response?.data);
    
    // Check if it's an authentication error
    if ((error as any)?.message?.includes('authentication') || (error as any)?.message?.includes('API key') || (error as any)?.message?.includes('auth')) {
      console.error('🔑 Authentication error detected. Please check your API keys.');
      throw new Error('Authentication failed. Please check your API configuration.');
    }
    
    // Check if it's a 400 error (bad request)
    if ((error as any)?.status === 400 || (error as any)?.message?.includes('400')) {
      console.error('❌ 400 Bad Request error. This usually means invalid parameters.');
      console.error('🔍 Request details:');
      console.error('- Text length:', text?.length || 0);
      console.error('- Image URL provided:', !!imageUrl);
      console.error('- Category:', category);
    }
    
    return `Thank you for sharing what's going well in ${category}! Your reflection shows real awareness and gratitude. Keep building on these positive moments - they're the foundation of a fulfilling life. What you've shared today is worth celebrating! 🌟`;
  }
};

export const useHomeScreen = (user: any, isDarkMode: boolean) => {
  const dispatch = useDispatch();
  
  // ✅ Local state management (no Redux)
  const [entries, setEntries] = useState<any[]>([]);
  const [streak, setStreak] = useState({
    current_streak: 0,
    longest_streak: 0,
  });
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [streakLoading, setStreakLoading] = useState(false);

  // ✅ Other local state
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false); // ✅ Explicitly false
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    transcription?: string;
    aiResponse: string;
    category?: string;
    favorite?: boolean;
    id?: string;
  } | null>(null);

  // Add processing stage state
  const [processingStage, setProcessingStage] = useState<
    "transcribing" | "analyzing" | "generating" | "complete" | "saving" | null
  >("transcribing");

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Computed values with safe array handling
  const todaysEntries = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const today = new Date();
    // Get start and end of today in local time
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log("📅 Computing todaysEntries:", {
      entriesCount: entries.length,
      todayStart: startOfToday.toLocaleString(),
      todayEnd: endOfToday.toLocaleString(),
      currentTime: today.toLocaleString(),
    });

    const filtered = entries.filter((entry) => {
      if (!entry.created_at) return false;
      
      const entryDate = new Date(entry.created_at);
      // Check if the entry date falls within today's boundaries
      const isToday = entryDate >= startOfToday && entryDate < endOfToday;
      
      if (isToday) {
        console.log("📅 Found today's entry:", {
          id: entry.id,
          created_at: entry.created_at,
          localTime: entryDate.toLocaleString(),
        });
      }
      
      return isToday;
    });

    console.log("📅 Filtered todaysEntries count:", filtered.length);
    return filtered;
  }, [entries]);

  // ✅ Load entries function
  const loadUserEntries = async () => {
    if (!user?.id) {
      console.log("❌ No user ID for loading entries");
      return;
    }

    try {
      setEntriesLoading(true);
      console.log("📥 Loading entries for user:", user.id);

      // REPLACE THIS:
      // const userEntries = await SupabaseService.getUserEntries(user.id);
      // WITH:
      const { data: userEntries, error } = await supabase
        .from("daily_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("📥 Loaded entries:", userEntries?.length || 0);

      if (userEntries && userEntries.length > 0) {
        console.log("📥 First entry:", userEntries[0]);
        console.log(
          "📥 Entry dates:",
          userEntries.slice(0, 3).map((e) => ({
            id: e.id,
            created_at: e.created_at,
            date: new Date(e.created_at).toLocaleDateString(),
          }))
        );
      }

      setEntries(userEntries || []);
    } catch (error) {
      console.error("Failed to load entries:", error);
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  };

  // ✅ Load streak function
  const loadUserStreak = async () => {
    if (!user?.id) {
      console.log("❌ No user ID for loading streak");
      return;
    }

    try {
      setStreakLoading(true);
      // REPLACE THIS:
      // const userStreak = await SupabaseService.getUserStreak(user.id);
      // WITH:
      const { data: userStreak, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setStreak(userStreak || { current_streak: 0, longest_streak: 0 });
    } catch (error) {
      console.error("Failed to load streak:", error);
      setStreak({ current_streak: 0, longest_streak: 0 });
    } finally {
      setStreakLoading(false);
    }
  };

  // Load user categories
  const loadUserCategories = async () => {
    try {
      // REPLACE THIS:
      // const userCategories = await SupabaseService.getUserCategories(user.id);
      // WITH:
      const { data: userCategories, error } = await supabase
        .from("user_categories")
        .select("categories") // ✅ Use the correct column name (plural, array)
        .eq("user_id", user.id);

      if (error) throw error;

      // userCategories is an array of rows, each with a 'categories' array
      // If you only expect one row per user, use .[0]?.categories
      setCategories(userCategories?.[0]?.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      // Use defaults
      setCategories([
        "Health & Fitness",
        "Career & Work",
        "Family & Friends",
        "Personal Growth",
        "Hobbies & Interests",
        "Financial Goals",
        "Community & Service",
      ]);
    }
  };

  // Set initial category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      const todaysCategory = getTodaysCategory(categories);
      setSelectedCategory(todaysCategory);
    }
  }, [categories, selectedCategory]);

  // Replace both useEffects with this:
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      const recommendedCategory = getRecommendedCategory(categories);
      setSelectedCategory(recommendedCategory);
    }
    // Only run when categories change, NOT when selectedCategory changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // Category selection handler
  const handleCategorySelect = (category: string) => {
    console.log("📂 Category selected:", category);

    // Only haptic feedback - no auto-scrolling
    if (category === selectedCategory) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.selectionAsync();
      setSelectedCategory(category);
    }
  };

  // Scroll end handler
  const handleScrollEnd = () => {
    // Handle scroll end logic if needed
  };

  // Weekly entry checker
  const hasWeeklyEntry = (category: string) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return entries.some((entry) => {
      try {
        const entryDate = new Date(entry.created_at);
        return entry.category === category && entryDate >= oneWeekAgo;
      } catch (error) {
        console.warn("Invalid date in entry:", entry.created_at);
        return false;
      }
    });
  };

  // Enhanced function to get recommended category (not done this week)
  const getRecommendedCategory = (categories: string[]) => {
    if (!categories || categories.length === 0) return "";

    // First, try to find a category that hasn't been used this week
    const categoriesNotUsedThisWeek = categories.filter(
      (category) => !hasWeeklyEntry(category)
    );

    if (categoriesNotUsedThisWeek.length > 0) {
      console.log(
        "🎯 Categories not used this week:",
        categoriesNotUsedThisWeek
      );
      // Return the first category not used this week
      return categoriesNotUsedThisWeek[0];
    }

    // Fallback: Use the day-based rotation if all categories were used
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const fallbackCategory = categories[dayOfWeek % categories.length];

    console.log(
      "🎯 All categories used this week, using day-based fallback:",
      fallbackCategory
    );
    return fallbackCategory;
  };

  // Update getTodaysCategory to use the same logic
  const getTodaysCategory = (categories: string[]) => {
    return getRecommendedCategory(categories);
  };

  // Process audio entry
  const processAudioEntry = async (entryId: string, audioUri: string) => {
    console.log("🔊 === REAL AUDIO PROCESSING START ===");

    try {
      // Step 1: Transcription stage
      setProcessingStage("transcribing");
      console.log("🎤 Starting transcription...");
      const transcription = await transcribeAudio(audioUri);
      console.log("✅ Transcription complete");

      // Step 2: Analysis stage
      setProcessingStage("analyzing");
      await new Promise((resolve) => setTimeout(resolve, 800)); // Brief pause for UX

      // Step 3: Generation stage
      setProcessingStage("generating");
      console.log("🤖 Generating AI feedback...");
      const aiResponse = await generateAIFeedback(
        transcription,
        selectedCategory
      );
      console.log("✅ AI feedback generated");

      // Step 4: Complete stage
      setProcessingStage("complete");
      const { error } = await supabase
        .from("daily_entries")
        .update({
          transcription,
          ai_response: aiResponse,
        })
        .eq("id", entryId);

      if (error) throw error;

      // Brief pause to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("✅ Audio processing completed successfully");

      // Show notification with results
      setNotificationData({
        transcription,
        aiResponse,
        category: selectedCategory,
      });
      setShowNotification(true);

      // Refresh the entries
      loadUserEntries();
    } catch (error) {
      console.error("❌ Audio processing error:", error);

      // Show error notification
      setNotificationData({
        transcription: "❌ Transcription failed. Please try again.",
        aiResponse: `Thank you for sharing what's going well in ${selectedCategory}! Your reflection has been saved.`,
        category: selectedCategory,
      });
      setShowNotification(true);

      throw error;
    }
  };

  const handleRecordingComplete = async (
    audioUri: string,
    transcription: string,
    category: string
  ) => {
    try {
      console.log("🎯 handleRecordingComplete called with:", { transcription: transcription.substring(0, 50), category });
      setProcessingStage("analyzing");
      setIsProcessing(true);

      // Use the transcription provided (already done in RecorderSection)
      const finalTranscription = transcription;
      console.log("📝 Using provided transcription:", finalTranscription);

      // Get AI response
      const aiResponse = await getAIResponse(finalTranscription, category);
      console.log("🤖 AI Response:", aiResponse);

      setProcessingStage("saving");

      // Create the entry first to get the ID
      const newEntry = await createEntry(
        user.id,
        finalTranscription,
        aiResponse,
        category,
        audioUri
      );

      if (newEntry) {
        // Store notification data AFTER creating entry (so we have the ID)
        console.log("🔔 Setting notification data:", { finalTranscription, aiResponse, entryId: newEntry.id });
        setNotificationData({
          transcription: finalTranscription,
          aiResponse: aiResponse,
          category: category,
          favorite: false, // Default to false
          id: newEntry.id,
        });
        console.log("✅ Entry created:", newEntry);

        // Update streak
        await updateStreak(user.id);
        const updatedStreak = await fetchStreak(user.id);
        setStreak(updatedStreak);

        // Refresh entries immediately
        await refreshEntries();

        // Show notification modal
        console.log("🔔 Setting showNotification to true - Modal should appear now!");
        setShowNotification(true);
        
        // Additional debug to confirm notification data is set
        console.log("🔔 Final notification setup:", {
          transcription: finalTranscription.substring(0, 50) + "...",
          hasAiResponse: !!aiResponse,
          entryId: newEntry.id
        });
        
        // Debug: Check notification state immediately
        setTimeout(() => {
          console.log("🔔 Notification state check (after timeout):", {
            showNotification: true, // This is what we set it to
            hasNotificationData: !!notificationData
          });
        }, 100);

        // Check for milestone
        checkMilestone(updatedStreak);
        
        // Reset processing state before returning
        setProcessingStage(null);
        setIsProcessing(false);
        
        // Return the new entry so HomeScreen can use it
        return newEntry;
      }

      setProcessingStage(null);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing recording:", error);
      setProcessingStage(null);
      setIsProcessing(false);
      throw error; // Re-throw so caller knows it failed
    }
  };

  // AI feedback generation
  const generateAIFeedback = async (
    transcription: string,
    category: string
  ): Promise<string> => {
    try {
      console.log("🤖 Generating Greg Bell-inspired feedback...");

      // Use your trained AIService with Greg Bell methodology
      const response = await AIService.generateResponse(transcription, category, {
        currentStreak: streak?.current_streak || 0
      });

      return response;
    } catch (error) {
      console.error("❌ AI feedback error:", error);

      // Fallback response using Greg Bell style
      return `Thank you for sharing what's going well in ${category}! Your reflection shows real awareness and gratitude. Keep building on these positive moments - they're the foundation of a fulfilling life. What you've shared today is worth celebrating! 🌟`;
    }
  };

  // Create entry function
  const createEntry = async (
    userId: string,
    transcription: string,
    aiResponse: string,
    category: string,
    audioUri?: string
  ) => {
    const state = store.getState();
    const isOnline = state.offline.isOnline;
    
    // If offline, queue the action for later
    if (!isOnline) {
      console.log('📱 Offline mode: Queueing entry creation');
      
      // Create a temporary entry for immediate UI feedback
      const tempEntry = {
        id: `temp_${Date.now()}`,
        user_id: userId,
        transcription,
        ai_response: aiResponse,
        category,
        audio_url: audioUri,
        created_at: new Date().toISOString(),
        is_synced: false, // Mark as not synced
      };
      
      // Add to offline queue
      dispatch(addPendingAction({
        type: 'CREATE_ENTRY',
        payload: {
          audioUri,
          transcription,
          category,
          userId,
          localId: tempEntry.id,
        },
      }));
      
      // Add to local state immediately
      dispatch(addEntry(tempEntry));
      
      // Show offline notification
      Alert.alert(
        "Saved Offline",
        "Your entry has been saved and will sync when you're back online.",
        [{ text: "OK" }]
      );
      
      return tempEntry;
    }
    
    // Online mode - proceed as normal
    try {
      let audioUrl = null;
      
      // Upload audio file if provided
      if (audioUri) {
        const { uploadAudioToSupabase } = await import('../utils/audioUpload');
        audioUrl = await uploadAudioToSupabase(audioUri, userId);
        
        if (!audioUrl) {
          console.warn('⚠️ Audio upload failed, continuing without audio URL');
        }
      }
      
      const { data, error } = await supabase
        .from("daily_entries")
        .insert([
          {
            user_id: userId,
            transcription,
            ai_response: aiResponse,
            category,
            audio_url: audioUrl, // Use uploaded URL instead of local URI
            created_at: new Date().toISOString(), // Ensure consistent timestamp
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      console.log("✅ Entry created with timestamp:", data.created_at);
      return data;
    } catch (error) {
      console.error("❌ Error creating entry:", error);
      
      // If online but failed, also queue for retry
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        console.log('📱 Network error: Queueing for retry');
        
        const tempEntry = {
          id: `temp_${Date.now()}`,
          user_id: userId,
          transcription,
          ai_response: aiResponse,
          category,
          audio_url: audioUri,
          created_at: new Date().toISOString(),
          is_synced: false,
        };
        
        dispatch(addPendingAction({
          type: 'CREATE_ENTRY',
          payload: {
            audioUri,
            transcription,
            category,
            userId,
            localId: tempEntry.id,
          },
        }));
        
        dispatch(addEntry(tempEntry));
        
        Alert.alert(
          "Saved for Later",
          "We couldn't save your entry right now, but it will sync automatically.",
          [{ text: "OK" }]
        );
        
        return tempEntry;
      }
      
      throw error;
    }
  };

  // Update streak function
  const updateStreak = async (userId: string) => {
    try {
      // REPLACE THIS:
      // await SupabaseService.updateUserStreak(userId);
      // WITH:
      // (You may want to call your updateUserStreak logic directly here, or use your slice's thunk if available)
      // For now, just reload the streak:
      await loadUserStreak();
    } catch (error) {
      console.error("❌ Error updating streak:", error);
    }
  };

  // Fetch streak function
  const fetchStreak = async (userId: string) => {
    try {
      // REPLACE THIS:
      // const streak = await SupabaseService.getUserStreak(userId);
      // WITH:
      const { data: streak, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      return streak || { current_streak: 0, longest_streak: 0 };
    } catch (error) {
      console.error("❌ Error fetching streak:", error);
      return { current_streak: 0, longest_streak: 0 };
    }
  };

  // Refresh entries function
  const refreshEntries = async () => {
    await loadUserEntries();
  };

  // Check milestone function
  const checkMilestone = (updatedStreak: any) => {
    // Check for milestone achievements
    const milestones = [7, 30, 100, 365];
    if (milestones.includes(updatedStreak.current_streak)) {
      setShowCelebration(true);
    }
  };

  // Replace this function
  const recalculateStreak = async () => {
    console.log("🔄 Manually recalculating streak...");
    await loadUserStreak();
  };

  // Add this function before the return statement
  const resetModalStates = () => {
    setShowSettings(false);
    setShowHistory(false);
    setShowDrawer(false);
    setShowCelebration(false);
    // Don't reset showNotification here - let it be controlled by recording completion flow
  };

  // Replace the existing useEffect that sets showSettings to false with this more comprehensive one:
  useEffect(() => {
    console.log("🔄 Component mounted - forcing all modals closed (except notification)");
    setShowSettings(false);
    setShowHistory(false);
    setShowDrawer(false);
    setShowCelebration(false);
    // Don't reset showNotification here - let it be controlled by recording completion flow
  }, []); // Empty dependency array - runs once on mount

  // Also update the user effect to be more explicit:
  useEffect(() => {
    if (user?.id) {
      // Reset modal states when user loads (except notification which should be controlled by recording flow)
      setShowSettings(false);
      setShowHistory(false);
      setShowDrawer(false);
      setShowCelebration(false);
      // Don't reset showNotification here - let it be controlled by recording completion flow

      // Load user data immediately (no timeout needed)
      loadUserEntries();
      loadUserStreak();
      loadUserCategories();
    }
  }, [user]);

  // Memoize the return object
  return useMemo(
    () => ({
      // State
      categories,
      setCategories,
      selectedCategory,
      isProcessing,
      setIsProcessing,
      showSettings,
      setShowSettings,
      showCelebration,
      setShowCelebration,
      showHistory,
      setShowHistory,
      showDrawer,
      setShowDrawer,
      entries,
      streak,
      todaysEntries,
      showNotification,
      setShowNotification,
      notificationData,
      setNotificationData,
      processingStage,
      setProcessingStage,

      // Functions
      handleRecordingComplete,
      handleCategorySelect,
      handleScrollEnd,
      hasWeeklyEntry,
      getTodaysCategory,
      scrollViewRef,
      resetModalStates, // ✅ Add this
      refreshEntries: loadUserEntries, // Make sure this is included
    }),
    [
      categories,
      selectedCategory,
      isProcessing,
      entriesLoading,
      streakLoading,
      showSettings,
      showCelebration,
      showHistory,
      showDrawer,
      entries,
      streak,
      todaysEntries,
      showNotification,
      notificationData,
      hasWeeklyEntry,
      processingStage,
    ]
  );
};
