import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ListyRequest {
  message: string;
  history: ChatMessage[];
}

// Fallback responses for when no AI backend is configured
const getFallbackResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Business listing questions
  if (lowerMessage.includes("list") && (lowerMessage.includes("business") || lowerMessage.includes("company"))) {
    return "Great! You can list your business by visiting our [List Your Business](/en/list-your-business) page. It's free to get started and helps customers find you across Europe.";
  }
  
  // Category questions
  if (lowerMessage.includes("categor") || lowerMessage.includes("type") || lowerMessage.includes("kind")) {
    return "We have many business categories! Check out our [Categories](/en/categories) page to browse all available options, from restaurants and retail to services and tech companies.";
  }
  
  // Search questions
  if (lowerMessage.includes("search") || lowerMessage.includes("find")) {
    return "You can search for businesses using our [Search](/en/search) feature. Try searching by business name, category, or location to find what you're looking for.";
  }
  
  // Country/location questions
  if (lowerMessage.includes("countr") || lowerMessage.includes("location") || lowerMessage.includes("where")) {
    return "We cover businesses across Europe! You can browse by country or search in specific cities. Check our [Countries](/en/countries) page to see all available locations.";
  }
  
  // Cost/pricing questions
  if (lowerMessage.includes("cost") || lowerMessage.includes("price") || lowerMessage.includes("free") || lowerMessage.includes("pay")) {
    return "Basic business listings are completely free! Premium features will be available soon. Visit [List Your Business](/en/list-your-business) to get started at no cost.";
  }
  
  // Help/support questions
  if (lowerMessage.includes("help") || lowerMessage.includes("support") || lowerMessage.includes("contact")) {
    return "I'm here to help! Ask me about:\\n• Listing your business\\n• Finding business categories\\n• Searching our directory\\n• Available countries and locations\\n\\nWhat would you like to know?";
  }
  
  // Greeting responses
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! 👋 I'm Listy, your helpful guide to ListAcrossEU. I can help you with listing your business, finding categories, or navigating our directory. What can I help you with today?";
  }
  
  // Default response
  return `I'd love to help! Here are some things I can assist with:

• **List your business**: Visit [List Your Business](/en/list-your-business)
• **Browse categories**: Check our [Categories](/en/categories) 
• **Search directory**: Use our [Search](/en/search) feature
• **Explore locations**: See [Countries](/en/countries)

What would you like to know more about?`;
};

// Forward to AI backend if configured
const forwardToAI = async (request: ListyRequest): Promise<string> => {
  const apiUrl = process.env.LISTY_API_URL;
  const apiKey = process.env.LISTY_API_KEY;
  
  if (!apiUrl) {
    throw new Error("LISTY_API_URL not configured");
  }
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: request.message,
      history: request.history,
      context: "ListAcrossEU business directory assistant"
    }),
  });
  
  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.reply || data.message || data.response || "I'm having trouble responding right now.";
};

export async function POST(request: NextRequest) {
  try {
    const body: ListyRequest = await request.json();
    
    // Validate request
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(body.history)) {
      body.history = [];
    }
    
    let reply: string;
    
    // Try AI backend first if configured
    if (process.env.LISTY_API_URL) {
      try {
        reply = await forwardToAI(body);
      } catch (error) {
        console.warn("AI backend failed, using fallback:", error);
        reply = getFallbackResponse(body.message);
      }
    } else {
      // Use fallback mode
      reply = getFallbackResponse(body.message);
    }
    
    return NextResponse.json({ reply });
    
  } catch (error) {
    console.error("Listy API error:", error);
    return NextResponse.json(
      { 
        reply: "I'm having some technical difficulties. Please try again in a moment, or visit our [List Your Business](/en/list-your-business) page directly!" 
      },
      { status: 500 }
    );
  }
}