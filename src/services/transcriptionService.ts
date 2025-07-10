// src/services/transcriptionService.ts

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
    throw error;
  }
};
