import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const createLeadDeclaration: FunctionDeclaration = {
  name: "create_lead",
  description: "Create a new lead in the CRM system.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Full name of the lead" },
      email: { type: Type.STRING, description: "Email address of the lead" },
      company: { type: Type.STRING, description: "Company name" },
      value: { type: Type.NUMBER, description: "Estimated deal value" },
      status: { type: Type.STRING, description: "Lead status (new, contacted, qualified)" }
    },
    required: ["name", "company"]
  }
};

const createInvoiceDeclaration: FunctionDeclaration = {
  name: "create_invoice",
  description: "Create a new invoice in the accounting system.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      customer_name: { type: Type.STRING, description: "Name of the customer" },
      amount: { type: Type.NUMBER, description: "Invoice amount" },
      due_date: { type: Type.STRING, description: "Due date (YYYY-MM-DD)" },
      status: { type: Type.STRING, description: "Invoice status (draft, sent)" }
    },
    required: ["customer_name", "amount", "due_date"]
  }
};

export async function processAICommand(prompt: string, token: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an Eazbook AI assistant for an ERP system. You can help users create leads, invoices, and other entities. If a user asks to create something, use the appropriate tool.",
        tools: [{ functionDeclarations: [createLeadDeclaration, createInvoiceDeclaration] }]
      }
    });

    const functionCalls = response.functionCalls;
    if (functionCalls) {
      const call = functionCalls[0];
      const res = await fetch("/api/ai/execute-action", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ action: call.name, params: call.args })
      });
      
      if (res.ok) {
        const data = await res.json();
        return { 
          text: `Successfully executed: ${call.name}. Data: ${JSON.stringify(data.data)}`,
          actionExecuted: true,
          data: data.data
        };
      } else {
        return { text: "Failed to execute the action on the server.", actionExecuted: false };
      }
    }

    return { text: response.text || "I'm not sure how to help with that.", actionExecuted: false };
  } catch (error: any) {
    console.error("AI Service Error:", error);
    return { text: "An error occurred while processing your request.", actionExecuted: false };
  }
}
