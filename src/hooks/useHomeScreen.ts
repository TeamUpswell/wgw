import { useState, useEffect, useRef, useMemo } from "react";
import { ScrollView, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../config/supabase";
import { openai } from "../config/openai";
import { NotificationModal } from "../components/NotificationModal";
import { AIService } from "../services/ai";
import { getAIResponse } from "../services/aiService";

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
    let prompt = `You are a supportive wellness coach helping someone with their daily gratitude practice. They just shared what's going well in their "${category}" area of life.`;
    if (text) {
      prompt += `\n\nTheir reflection: "${text}"`;
    }
    if (imageUrl) {
      prompt += `\n\nThey also shared this image.`;
    }
    prompt += `\n\nPlease provide:\n1. A warm, encouraging response acknowledging what they shared\n2. A specific insight or observation about their reflection and/or image\n3. A gentle suggestion for how they might build on this positive momentum\n4. Keep it conversational, supportive, and under 150 words`;

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

    const response = await openai.chat.completions.create({
      model: imageUrl ? "gpt-4o" : "gpt-4",
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });
    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("No response generated");
    }
    return aiResponse;
  } catch (error) {
    console.error("❌ AI feedback error:", error);
    return `Thank you for sharing what's going well in ${category}! Your reflection shows real awareness and gratitude. Keep building on these positive moments - they're the foundation of a fulfilling life. What you've shared today is worth celebrating! 🌟`;
  }
};

export const useHomeScreen = (user: any, isDarkMode: boolean) => {
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
    transcription?: string; // ← Add this
    aiResponse: string;
    category?: string;
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
    const todayStr = today.toISOString().split("T")[0];

    console.log("📅 Computing todaysEntries:", {
      entriesCount: entries.length,
      todayStr,
    });

    const filtered = entries.filter((entry) => {
      const entryDateStr = new Date(entry.created_at)
        .toISOString()
        .split("T")[0];
      return entryDateStr === todayStr;
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
      setProcessingStage("transcribing");
      setIsProcessing(true);

      // Transcribe audio
      const finalTranscription =
        transcription || (await transcribeAudio(audioUri));
      console.log("📝 Transcription:", finalTranscription);

      setProcessingStage("analyzing");

      // Get AI response
      const aiResponse = await getAIResponse(finalTranscription, category);
      console.log("🤖 AI Response:", aiResponse);

      setProcessingStage("saving");

      // Store notification data BEFORE creating entry
      setNotificationData({
        transcription: finalTranscription,
        aiResponse: aiResponse,
      });

      // Create the entry with the transcription
      const newEntry = await createEntry(
        user.id,
        finalTranscription, // ← Make sure this is passed
        aiResponse,
        category,
        audioUri
      );

      if (newEntry) {
        console.log("✅ Entry created:", newEntry);

        // Update streak
        await updateStreak(user.id);
        const updatedStreak = await fetchStreak(user.id);
        setStreak(updatedStreak);

        // Refresh entries immediately
        await refreshEntries();

        // Show notification modal
        setShowNotification(true);

        // Check for milestone
        checkMilestone(updatedStreak);
      }

      setProcessingStage(null);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing recording:", error);
      setProcessingStage(null);
      setIsProcessing(false);
    }
  };

  // AI feedback generation
  const generateAIFeedback = async (
    transcription: string,
    category: string
  ): Promise<string> => {
    try {
      console.log("🤖 Generating personalized feedback...");

      const prompt = `You are a supportive wellness coach helping someone with their daily gratitude practice. They just shared what's going well in their "${category}" area of life.

Their reflection: "${transcription}"

Please provide:
1. A warm, encouraging response acknowledging what they shared
2. A specific insight or observation about their reflection
3. A gentle suggestion for how they might build on this positive momentum
4. Keep it conversational, supportive, and under 150 words

Focus on being genuinely encouraging while helping them deepen their gratitude practice.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a supportive wellness coach specializing in gratitude and positive psychology. Your responses are warm, insightful, and encouraging.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error("No response generated");
      }

      return aiResponse;
    } catch (error) {
      console.error("❌ AI feedback error:", error);

      // Fallback response
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
    try {
      const { data, error } = await supabase
        .from("daily_entries")
        .insert([
          {
            user_id: userId,
            transcription,
            ai_response: aiResponse,
            category,
            audio_url: audioUri,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error creating entry:", error);
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
    setShowNotification(false);
  };

  // Replace the existing useEffect that sets showSettings to false with this more comprehensive one:
  useEffect(() => {
    console.log("🔄 Component mounted - forcing all modals closed");
    setShowSettings(false);
    setShowHistory(false);
    setShowDrawer(false);
    setShowCelebration(false);
    setShowNotification(false);
  }, []); // Empty dependency array - runs once on mount

  // Also update the user effect to be more explicit:
  useEffect(() => {
    if (user?.id) {
      // Reset modal states when user loads
      setShowSettings(false);
      setShowHistory(false);
      setShowDrawer(false);
      setShowCelebration(false);
      setShowNotification(false);

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

// Exported transcription function for use in modal and elsewhere
export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
    console.log("🎤 Preparing audio for transcription...");

    // Create form data for the audio file
    const formData = new FormData();
    formData.append("file", {
      uri: audioUri,
      type: "audio/m4a",
      name: "recording.m4a",
    } as any);
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    // Call OpenAI Whisper API
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Transcription failed: ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const result = await response.json();
    return result.text || "Could not transcribe audio.";
  } catch (error) {
    console.error("❌ Transcription error:", error);
    throw new Error(
      "Failed to transcribe audio. Please check your connection and try again."
    );
  }
};
