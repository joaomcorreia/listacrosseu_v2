"use client";

import { useState } from "react";
import { ListyButton } from "./ListyButton";
import { ListyPanel } from "./ListyPanel";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ListyWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSendMessage = async (message: string, history: ChatMessage[]): Promise<string> => {
    try {
      const response = await fetch("/api/listy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.reply || "Sorry, I couldn't understand that. Could you rephrase?";
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      throw error;
    }
  };

  return (
    <>
      <ListyButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
      <ListyPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSendMessage={handleSendMessage}
      />
    </>
  );
}