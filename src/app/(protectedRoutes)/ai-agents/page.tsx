import React from "react";
import AiAgentSidebar from "./_components/AiAgentSidebar";
import ModelSection from "./_components/ModalSection";
import { onAuthenticateUser } from "@/action/auth";
import { redirect } from "next/navigation";
import { UserWithAiAgent } from "@/lib/type";
import { currentUser } from "@clerk/nextjs/server";

const page = async () => {
  // Check Clerk authentication first
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Try to get database user with fallback
  let user: UserWithAiAgent;
  try {
    const checkUser = await onAuthenticateUser();
    if (!checkUser.user) {
      redirect("/sign-in");
    }
    user = checkUser.user as UserWithAiAgent;
  } catch (error) {
    console.log("Database error in ai-agents, using fallback");
    // Create fallback user from Clerk data
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
  console.log("User data:", user);
  return (
    <div className="w-full flex h-[80vh] text-primary border border-border rounded-se-xl">
      {/* Left Sidebar */}
      <AiAgentSidebar
        aiAgents={user?.aiAgents || []}
        userId={user?.id}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <ModelSection />
      </div>
    </div>
  );
};

export default page;
