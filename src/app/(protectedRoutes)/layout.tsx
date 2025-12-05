import { onAuthenticateUser } from "@/action/auth";
import { getAllProductsFromStripe } from "@/action/stripe";
import Header from "@/components/ReusableComponent/LayoutComponents/Header";
import Sidebar from "@/components/ReusableComponent/LayoutComponents/Sidebar";
import { UserWithAiAgent } from "@/lib/type";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type React from "react";

type Props = {
  children: React.ReactNode;
};

export const dynamic = 'force-dynamic';

const Layout = async ({ children }: Props) => {
  // First check Clerk authentication
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Try to get database user, but don't fail if DB is down
  let user: UserWithAiAgent | null = null;
  try {
    const userExist = await onAuthenticateUser();
    user = userExist.user as UserWithAiAgent;
  } catch (error) {
    console.log("Database error in layout, using Clerk user data");
    // Create a minimal user object from Clerk data
    // Note: This is a fallback - should have all required User fields
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

  const stripeProducts = await getAllProductsFromStripe();


  return (
    <div className="flex w-full min-h-screen">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content area with scrollable content */}
      <div className="flex flex-col w-full h-screen overflow-auto px-4 scrollbar-hide container mx-auto">
        {/* Fixed header */}
        <Header
          assistants={user?.aiAgents || []}
          user={user}
          stripeProducts={stripeProducts.products || []}
        />
        {/* Scrollable content area with increased bottom padding */}
        <div className="flex-1 py-10 ">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
