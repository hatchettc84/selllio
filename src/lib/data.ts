import HomeIcon from '@/icons/HomeIcon'
import LeadIcon from '@/icons/LeadIcon'
import SettingsIcon from '@/icons/SettingsIcon'
import { CallStatusEnum } from '@prisma/client'
import { Sparkle, Webcam, MessageSquare } from 'lucide-react'

export const sidebarData = [
  {
    id: 1,
    title: 'Home',
    icon: HomeIcon,
    link: '/home',
  },
  {
    id: 2,
    title: 'Webinars',
    icon: Webcam,
    link: '/webinars',
  },
  {
    id: 3,
    title: 'Leads',
    icon: LeadIcon,
    link: '/lead',
  },
  {
    id: 4,
    title: 'Ai Agents',
    icon: Sparkle,
    link: '/ai-agents',
  },
  {
    id: 5,
    title: 'AI Chat',
    icon: MessageSquare,
    link: '/ai-chat',
  },
  {
    id: 6,
    title: 'Settings',
    icon: SettingsIcon,
    link: '/settings',
  },
]

export const potentialCustomer = [
  {
    id: '1',
    name: 'John Doe',
    email: 'Johndoe@gmail.com',
    clerkId: '1',
    profileImage: '/vercel.svg',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tags: ['New', 'Hot Lead'],
    callStatus: CallStatusEnum.COMPLETED,
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'Johndoe@gmail.com',
    clerkId: '2',
    profileImage: '/vercel.svg',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tags: ['New', 'Hot Lead'],
    callStatus: CallStatusEnum.COMPLETED,
  },
  {
    id: '3',
    name: 'John Doe',
    email: 'Johndoe@gmail.com',
    clerkId: '3',
    profileImage: '/vercel.svg',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tags: ['New', 'Hot Lead'],
    callStatus: CallStatusEnum.COMPLETED,
  },
]

export const onBoardingSteps = [
  {
    id: 1,
    title: 'Connect Stripe',
    complete: false,
    link: '/settings',
    description: 'Connect your Stripe account to start accepting payments',
  },
  {
    id: 2,
    title: 'Create AI Agent',
    complete: false,
    link: '/ai-agents',
    description: 'Set up an AI agent to automate your webinar interactions',
  },
  {
    id: 3,
    title: 'Create a webinar',
    complete: false,
    link: '/webinars',
    description: 'Set up your first webinar to start collecting leads',
  },
]

export const aiAgentPrompt = `# AI Sales Assistant - Default Prompt

## Your Role
You are a friendly and helpful AI sales assistant. Your goal is to engage with webinar attendees, answer their questions, understand their needs, and help guide them toward relevant products or services.

## Communication Style
- Be warm, professional, and conversational
- Listen actively and respond thoughtfully
- Keep responses concise and clear
- Show genuine interest in helping the prospect
- Use natural language without jargon unless appropriate

## Conversation Guidelines
1. **Introduction**: Greet warmly and introduce yourself
2. **Discovery**: Ask about their needs and challenges
3. **Value Delivery**: Explain how the product/service can help them
4. **Objection Handling**: Address concerns respectfully and honestly
5. **Next Steps**: Guide them toward the appropriate action (purchase, booking, etc.)

## Best Practices
- Keep responses under 30 words when possible
- Ask one question at a time
- Reference previous conversation points
- Be honest if you don't know something
- Always be respectful and professional

## Note
This is a default prompt. Customize this prompt in your AI Agents page to match your specific business needs, product offerings, and sales approach.`

export const subscriptionPriceId = `price_1RKTQaIld5Bk5htqA7t1HWy4`

export const pipelineTags = ['New', 'Hot Lead']
