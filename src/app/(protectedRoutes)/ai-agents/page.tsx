import React from "react";
import AiAgentSidebar from "./_components/AiAgentSidebar";
import ModelSection from "./_components/ModalSection";
import { onAuthenticateUser } from "@/action/auth";
import { redirect } from "next/navigation";
import { UserWithAiAgent } from "@/lib/type";
import { currentUser } from "@clerk/nextjs/server";
import { ensureDefaultAgent } from "@/action/aiAgents";

const page = async () => {
  // Check Clerk authentication first
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Try to get database user
  let user: UserWithAiAgent;
  let isFallbackUser = false;
  
  try {
    const checkUser = await onAuthenticateUser();
    if (!checkUser.user) {
      redirect("/sign-in");
    }
    user = checkUser.user as UserWithAiAgent;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";
    console.log("Database error in ai-agents, using fallback:", errorMessage);
    // Create fallback user from Clerk data when database is unavailable
    isFallbackUser = true;
    user = {
      id: clerkUser.id,
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      profileImage: clerkUser.imageUrl || "",
      aiAgents: [],
      role: "USER" as const,
      subscription: false,
      stripeConnectId: null,
      stripeCustomerId: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      accountId: null,
    } as UserWithAiAgent;
  }

  // Ensure default agent exists (only if we have a real database user)
  if (!isFallbackUser) {
    try {
      const defaultAgentResult = await ensureDefaultAgent(user.id);
      if (defaultAgentResult.success && defaultAgentResult.data) {
        // Refresh user data to include the new agent
        const updatedUser = await onAuthenticateUser();
        if (updatedUser.user) {
          user = updatedUser.user as UserWithAiAgent;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error ensuring default agent:", errorMessage);
      // Continue even if default agent creation fails - user can still use the page
    }
  }

  console.log("User data:", user);
  return (
    <div className="w-full flex h-[80vh] text-primary border border-border rounded-se-xl">
      {/* Left Sidebar */}
      <AiAgentSidebar
        aiAgents={user?.aiAgents || []}
        userId={user?.id}
        defaultAgentId={user?.aiAgents?.[0]?.id}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <ModelSection />
      </div>
    </div>
  );
};

export default page;
