"use client";

import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ListyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string, history: ChatMessage[]) => Promise<string>;
}

export function ListyPanel({ isOpen, onClose, onSendMessage }: ListyPanelProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    // Add user message to history
    const newHistory = [...chatHistory, { role: "user" as const, content: userMessage }];
    setChatHistory(newHistory);

    try {
      const reply = await onSendMessage(userMessage, chatHistory);
      setChatHistory(prev => [...prev, { role: "assistant" as const, content: reply }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setChatHistory(prev => [
        ...prev,
        {
          role: "assistant" as const,
          content: "I'm having trouble right now. Try asking about our categories or how to list your business!"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={onClose} />
      
      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full z-50 bg-white shadow-xl transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } w-full md:w-96`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Listy</h2>
            <p className="text-sm text-gray-600">Ask about listings, categories, or how to list your business.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close Listy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: "calc(100vh - 160px)" }}>
          {chatHistory.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="mb-2">👋 Hi! I'm Listy, your listing helper.</p>
              <p className="text-sm">Ask me anything about our business directory!</p>
            </div>
          )}
          
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 text-gray-900"
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Listy is typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}