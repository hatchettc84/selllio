import { prismaClient } from "@/lib/prismaClient";
import { onAuthenticateUser } from "@/action/auth";
import { redirect } from "next/navigation";
import { VapiChat } from "@/components/vapi/VapiChat";

export default async function AIChatPage() {
  const user = await onAuthenticateUser();

  if (!user.user) {
    redirect("/sign-in");
  }

  // Get the first AI agent for this user
  const aiAgent = await prismaClient.aiAgents.findFirst({
    where: {
      userId: user.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!aiAgent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-4">No AI Agent Found</h2>
          <p className="text-muted-foreground mb-6">
            You need to create an AI agent first before you can start chatting.
          </p>
          <a
            href="/ai-agents"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Create AI Agent
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-100px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Agent Chat</h1>
        <p className="text-muted-foreground">
          Test your AI agent with text-based conversations
        </p>
      </div>

      <div className="h-[calc(100%-80px)]">
        <VapiChat
          assistantId={aiAgent.id}
          assistantName={aiAgent.name}
        />
      </div>
    </div>
  );
}
