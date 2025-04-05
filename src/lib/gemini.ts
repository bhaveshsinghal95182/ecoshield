import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();
const somevar = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";
if (!somevar) {
  console.log("GEMINI_API_KEY is not set in the environment variables.");
  console.log(somevar)
}

const genAI = new GoogleGenerativeAI(somevar);

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  imageData?: string;
};

type SessionData = {
  messages: ChatMessage[];
  lastActive: number;
};

const getSessionData = (): SessionData => {
  if (typeof window === "undefined")
    return { messages: [], lastActive: Date.now() };

  const stored = localStorage.getItem("gemini-session");
  if (!stored) {
    return { messages: [], lastActive: Date.now() };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { messages: [], lastActive: Date.now() };
  }
};

export const updateSessionData = (newMessage: ChatMessage) => {
  if (typeof window === "undefined") return;

  const currentSession = getSessionData();
  const updatedSession: SessionData = {
    messages: [...currentSession.messages, newMessage],
    lastActive: Date.now(),
  };

  if (updatedSession.messages.length > 10) {
    updatedSession.messages = updatedSession.messages.slice(-10);
  }

  localStorage.setItem("gemini-session", JSON.stringify(updatedSession));
};

export const isValidBase64Image = (imageData: string): boolean => {
  try {
    if (!imageData.startsWith("data:image/")) {
      return false;
    }

    const base64 = imageData.split(",")[1];
    if (!base64) {
      return false;
    }

    const sizeInBytes = (base64.length * 3) / 4;
    return sizeInBytes < 4 * 1024 * 1024;
  } catch {
    return false;
  }
};

export const analyzeImage = async (imageData: string): Promise<string> => {
  try {
    if (!isValidBase64Image(imageData)) {
      throw new Error("Invalid image data");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = "Analyze this image and provide a detailed breakdown of its components in terms of environmental impact and recyclability. Include: 1. Material composition 2. Environmental impact 3. Recycling recommendations 4. Sustainable alternatives";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData.split(",")[1],
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const responseText = response.text();

    updateSessionData({
      role: "user",
      content: "Uploaded an image for analysis",
      imageData: imageData,
      timestamp: Date.now(),
    });

    updateSessionData({
      role: "assistant",
      content: responseText,
      timestamp: Date.now(),
    });

    return responseText;
  } catch (error) {
    console.error("Error analyzing image:", error);
    return error instanceof Error
      ? `Error: ${error.message}. Please try again.`
      : "Error analyzing image. Please try again.";
  }
};

export const analyzePrompt = async (prompt: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent([
      `Analyze this product description in terms of environmental impact: ${prompt}`,
    ]);

    const response = await result.response;
    const responseText = response.text();

    updateSessionData({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    });

    updateSessionData({
      role: "assistant",
      content: responseText,
      timestamp: Date.now(),
    });

    return responseText;
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    return error instanceof Error
      ? `Error: ${error.message}. Please try again.`
      : "Error analyzing text. Please try again.";
  }
};

export const getSessionHistory = (): ChatMessage[] => {
  return getSessionData().messages;
};

export const clearSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("gemini-session");
  }
};