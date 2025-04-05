"use client";

import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  Send,
  Image as ImageIcon,
  Sun,
  Moon,
  Trash2,
  Search,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  analyzeImage,
  analyzePrompt,
  ChatMessage,
  getSessionHistory,
  clearSession,
} from "@/lib/gemini";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

type SearchResult = {
  title: string;
  link: string;
  snippet: string;
};

export default function Home() {
  const [capturing, setCapturing] = useState(true);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(getSessionHistory());
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const webcamRef = useRef<Webcam>(null);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);

          try {
            const backendurl = process.env.NEXT_PUBLIC_BACKEND_URL;
            // Use the Express API instead of direct DuckDuckGo tool
            const response = await fetch(`${backendurl}/search`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: `scrap dealers near ${coords.lat},${coords.lng}`,
              }),
            });

            if (!response.ok) {
              throw new Error("Network response was not ok");
            }

            const data = await response.json();

            let parsedResults;

            try {
              parsedResults = JSON.parse(data.results);
            } catch (error) {
              console.error("Invalid JSON:", error);
              parsedResults = []; // fallback to empty list
            }

            setSearchResults(parsedResults);
          } catch (error) {
            console.error("Error searching for scrap dealers:", error);
            setSearchResults([]);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const captureImage = React.useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setLoading(true);
        try {
          const result = await analyzeImage(imageSrc);
          setAnalysis(result);
          setMessages((prev) => [
            ...prev,
            {
              role: "user",
              content: "Captured image for analysis",
              timestamp: Date.now(),
              imageData: imageSrc,
            },
            {
              role: "assistant",
              content: result,
              timestamp: Date.now(),
            },
          ]);
        } catch (error) {
          console.error("Error analyzing image:", error);
          setAnalysis("Error analyzing image. Please try again.");
        }
        setLoading(false);
      }
    }
  }, [webcamRef]);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    try {
      const result = await analyzePrompt(textInput);
      setAnalysis(result);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: textInput,
          timestamp: Date.now(),
        },
        {
          role: "assistant",
          content: result,
          timestamp: Date.now(),
        },
      ]);
      setTextInput("");
    } catch (error) {
      console.error("Error analyzing text:", error);
      setAnalysis("Error analyzing text. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">EcoShield</h1>
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="p-4 shadow-lg bg-card">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                {capturing ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={captureImage}
                  disabled={loading || !capturing}
                  className="flex-1 border"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture & Analyze
                </Button>
                <Button
                  onClick={() => setCapturing(!capturing)}
                  variant="outline"
                >
                  {capturing ? "Stop Camera" : "Start Camera"}
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex gap-2">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Describe a product's specifications..."
                  className="min-h-[100px]"
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={loading || !textInput.trim()}
                  className="self-start"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {location && searchResults && (
              <Card className="border border-gray-200 dark:border-gray-800 shadow-md">
                <div className="bg-black text-white dark:bg-white dark:text-black p-4 flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">
                    Nearby Scrap Dealers
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {searchResults.map(
                    (
                      result: {
                        title: string;
                        link: string;
                        snippet: string;
                      },
                      index: number
                    ) => (
                      <div
                        key={index}
                        className="p-4 hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between group"
                        >
                          <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:underline">
                            {result.title}
                          </span>
                          <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    )
                  )}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {analysis && (
              <Card className="p-4">
                <h2 className="text-xl font-semibold mb-4">Current Analysis</h2>
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              </Card>
            )}

            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Analysis History</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setMessages([]);
                    clearSession();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="h-[600px] pr-4">
                {messages.map((message, index) => {
                  return (
                    <div
                      key={index}
                      className={`mb-4 p-4 rounded-lg ${
                        message.role === "assistant"
                          ? "bg-primary/10"
                          : "bg-secondary/50"
                      }`}
                    >
                      <div className="text-sm text-muted-foreground mb-1">
                        {message.role === "assistant"
                          ? "AI Analysis"
                          : "Your Input"}
                      </div>
                      {message.imageData && (
                        <img
                          src={message.imageData}
                          alt="Captured"
                          className="mb-2 rounded-lg max-h-40 object-cover"
                        />
                      )}
                      <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
