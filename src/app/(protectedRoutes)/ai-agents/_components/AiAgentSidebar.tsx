"use client";

import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreateAssistantModal from "./CreateAssistantModal";
import { useAiAgentStore } from "@/store/useAiAgentStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AiAgents } from "@prisma/client";

type Props = {
  aiAgents: AiAgents[] | [];
  userId: string;
  defaultAgentId?: string;
};

const AiAgentSidebar = ({ aiAgents, userId, defaultAgentId }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { assistant, setAssistant } = useAiAgentStore();

  // Auto-select default agent on mount if none selected
  useEffect(() => {
    if (!assistant && aiAgents.length > 0) {
      // Use defaultAgentId if provided, otherwise use first agent
      const agentToSelect = defaultAgentId
        ? aiAgents.find((a) => a.id === defaultAgentId) || aiAgents[0]
        : aiAgents[0];
      
      if (agentToSelect) {
        setAssistant(agentToSelect);
      }
    }
  }, [assistant, aiAgents, defaultAgentId, setAssistant]);

  return (
    <div className="w-[300px] border-r border-border flex flex-col">
      <div className="p-4">
        <Button
          className="w-full flex items-center gap-2 mb-4 hover:cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus /> Create Assistant
        </Button>
        <div className="relative">
          <Input
            placeholder="Search Assistants"
            className="bg-neutral-900 border-neutral-700 pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
        </div>
      </div>
      <ScrollArea className="mt-4 overflow-auto">
        {aiAgents.length > 0 ? (
          aiAgents.map((aiAssistant) => (
            <button
              type="button"
              className={`w-full text-left p-4 ${
                aiAssistant.id === assistant?.id ? "bg-primary/10" : ""
              } hover:bg-primary/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50`}
              key={aiAssistant.id}
              onClick={() => {
                setAssistant(aiAssistant);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setAssistant(aiAssistant);
                }
              }}
            >
              <div className="font-medium">{aiAssistant.name}</div>
            </button>
          ))
        ) : (
          <div className="p-4 text-neutral-400 text-sm text-center">
            No agents available. Create one to get started.
          </div>
        )}
      </ScrollArea>

      <CreateAssistantModal
        isOpen={isModalOpen}
        userId={userId}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default AiAgentSidebar;
