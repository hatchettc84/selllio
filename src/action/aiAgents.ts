"use server";

import { aiAgentPrompt } from "@/lib/data";
import { prismaClient } from "@/lib/prismaClient";
import { vapiServer } from "@/lib/vapi/vapiServer";

export const createAssistant = async (name: string, userId: string) => {
  try {
    console.log('[createAssistant] Starting creation for user:', userId, 'name:', name)

    // Validate inputs
    if (!name || !userId) {
      return {
        success: false,
        status: 400,
        message: "Name and userId are required",
      }
    }

    // Create VAPI assistant
    const createAssistant = await vapiServer.assistants.create({
      name: name,
      firstMessage: `Hi there, this is ${name} from customer support. How can I help you today?`,
      model: {
        model: "gpt-4o",
        provider: "openai",
        messages: [
          {
            role: "system",
            content: aiAgentPrompt,
          },
        ],
        temperature: 0.5,
      },
      serverMessages: [],
    });

    console.log('[createAssistant] VAPI assistant created:', createAssistant.assistantId);

    // Save to database
    const aiAgent = await prismaClient.aiAgents.create({
      data: {
        id: createAssistant.assistantId,
        model: "gpt-4o",
        provider: "openai",
        prompt: aiAgentPrompt,
        name: name,
        firstMessage: `Hi there, this is ${name} from customer support. How can I help you today?`,
        userId: userId
      },
    });

    console.log('[createAssistant] Database record created:', aiAgent.id)

    return {
      success: true,
      status: 200,
      data: aiAgent,
    };
  } catch (error: any) {
    // Detailed error logging
    console.error('[createAssistant] Error occurred:')
    console.error('  Error type:', error.constructor.name)
    console.error('  Error message:', error.message)
    console.error('  Full error:', error)

    // Determine error type and return specific message
    let errorMessage = "Failed to create agent"

    if (error.message?.includes('VAPI API error')) {
      errorMessage = `VAPI API error: ${error.message}`
    } else if (error.message?.includes('Missing VAPI credentials')) {
      errorMessage = "Server configuration error: VAPI credentials not configured"
    } else if (error.code === 'P2002') { // Prisma unique constraint
      errorMessage = "An agent with this ID already exists"
    } else if (error.code?.startsWith('P')) { // Other Prisma errors
      errorMessage = `Database error: ${error.message}`
    }

    return {
      success: false,
      status: 500,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }
  }
};

//update assistant
export const updateAssistant = async (
  assistantId: string,
  firstMessage: string,
  systemPrompt: string
) => {
  try {
    const updateAssistant = await vapiServer.assistants.update(assistantId, {
      firstMessage: firstMessage,
      model: {
        model: "gpt-4o",
        provider: "openai",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
      },
      serverMessages: [],
    });
    console.log("Assistant updated:", updateAssistant);

    const updateAiAgent = await prismaClient.aiAgents.update({
      where: {
        id: assistantId,
      },
      data: {
        firstMessage: firstMessage,
        prompt: systemPrompt,
      },
    });

    return {
      success: true,
      status: 200,
      data: updateAiAgent,
    };
  } catch (error) {
    console.error("Error updating agent:", error);
    return {
      success: false,
      status: 500,
      error: error,
      message: "Failed to update agent",
    };
  }
};

// Ensure default AI agent exists for user
export const ensureDefaultAgent = async (userId: string) => {
  try {
    // Check if user already has agents
    const existingAgents = await prismaClient.aiAgents.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // If user has agents, return the first one (oldest/default)
    if (existingAgents.length > 0) {
      return {
        success: true,
        status: 200,
        data: existingAgents[0],
        isNew: false,
      };
    }

    // Create default agent
    console.log('[ensureDefaultAgent] Creating default agent for user:', userId);

    const defaultName = "Default AI Assistant";
    const defaultFirstMessage = "Hi there! I'm your AI assistant. How can I help you today?";

    // Create VAPI assistant with auto-approve server messages
    const createAssistant = await vapiServer.assistants.create({
      name: defaultName,
      firstMessage: defaultFirstMessage,
      model: {
        model: "gpt-4o",
        provider: "openai",
        messages: [
          {
            role: "system",
            content: aiAgentPrompt,
          },
        ],
        temperature: 0.5,
      },
      serverMessages: [],
    });

    console.log('[ensureDefaultAgent] VAPI assistant created:', createAssistant.assistantId);

    // Save to database
    const aiAgent = await prismaClient.aiAgents.create({
      data: {
        id: createAssistant.assistantId,
        model: "gpt-4o",
        provider: "openai",
        prompt: aiAgentPrompt,
        name: defaultName,
        firstMessage: defaultFirstMessage,
        userId: userId,
      },
    });

    console.log('[ensureDefaultAgent] Default agent created:', aiAgent.id);

    return {
      success: true,
      status: 200,
      data: aiAgent,
      isNew: true,
    };
  } catch (error: any) {
    console.error('[ensureDefaultAgent] Error occurred:');
    console.error('  Error type:', error.constructor.name);
    console.error('  Error message:', error.message);
    console.error('  Full error:', error);

    let errorMessage = "Failed to create default agent";

    if (error.message?.includes('VAPI API error')) {
      errorMessage = `VAPI API error: ${error.message}`;
    } else if (error.message?.includes('Missing VAPI credentials')) {
      errorMessage = "Server configuration error: VAPI credentials not configured";
    } else if (error.code === 'P2002') {
      errorMessage = "An agent with this ID already exists";
    } else if (error.code?.startsWith('P')) {
      errorMessage = `Database error: ${error.message}`;
    }

    return {
      success: false,
      status: 500,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
  }
};
