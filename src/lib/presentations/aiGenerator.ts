/**
 * AI Slide Generator
 *
 * Uses OpenAI GPT-4o to generate structured presentation slides
 * from training materials and extract sales information.
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SlideData {
  type: 'title' | 'content' | 'bullet' | 'quote' | 'comparison' | 'cta';
  title: string;
  content: string;
  speakerNotes?: string;
  layout?: string;
}

export interface SalesInfo {
  products: Array<{
    name: string;
    description: string;
    features: string[];
  }>;
  pricing: Array<{
    tier: string;
    price: string;
    features: string[];
  }>;
  benefits: string[];
  objections: Array<{
    objection: string;
    response: string;
  }>;
  cta: {
    primary: string;
    urgency?: string;
  };
  competitors?: string[];
  testimonials?: string[];
}

export interface GenerationResult {
  slides: SlideData[];
  salesInfo: SalesInfo;
  metadata: {
    model: string;
    tokensUsed: number;
    costCents: number;
  };
}

/**
 * Generate presentation slides from document text
 */
export async function generateSlides(
  documentText: string,
  webinarTitle: string,
  options?: {
    slideCount?: number; // Target number of slides (8-15)
    tone?: 'professional' | 'casual' | 'energetic';
    focusAreas?: string[]; // e.g., ['pricing', 'features', 'benefits']
  }
): Promise<GenerationResult> {
  const slideCount = options?.slideCount || 10;
  const tone = options?.tone || 'professional';

  const prompt = buildSlideGenerationPrompt(documentText, webinarTitle, slideCount, tone);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(response);

    // Calculate cost (GPT-4o pricing: $2.50/1M input, $10/1M output)
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;
    const totalTokens = completion.usage?.total_tokens || 0;

    const costCents = Math.ceil(
      (inputTokens / 1000000) * 250 + (outputTokens / 1000000) * 1000
    );

    return {
      slides: result.slides || [],
      salesInfo: result.salesInfo || getEmptySalesInfo(),
      metadata: {
        model: 'gpt-4o',
        tokensUsed: totalTokens,
        costCents,
      },
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error(
      `Failed to generate slides: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract sales information from document (for AI agent prompt enhancement)
 */
export async function extractSalesInfo(documentText: string): Promise<SalesInfo> {
  const prompt = `Extract sales and product information from this training material.

Training Material:
${documentText}

Identify and extract:
1. Products/Services (name, description, key features)
2. Pricing information (tiers, prices, what's included)
3. Key benefits and value propositions
4. Common objections and how to handle them
5. Call-to-action statements
6. Competitor mentions
7. Customer testimonials or case studies

Return JSON in this exact format:
{
  "products": [{"name": "", "description": "", "features": []}],
  "pricing": [{"tier": "", "price": "", "features": []}],
  "benefits": [],
  "objections": [{"objection": "", "response": ""}],
  "cta": {"primary": "", "urgency": ""},
  "competitors": [],
  "testimonials": []
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a sales expert extracting key information from training materials. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      return getEmptySalesInfo();
    }

    const result = JSON.parse(response);
    return result as SalesInfo;
  } catch (error) {
    console.error('Sales info extraction error:', error);
    return getEmptySalesInfo();
  }
}

/**
 * Build the prompt for slide generation
 */
function buildSlideGenerationPrompt(
  documentText: string,
  webinarTitle: string,
  slideCount: number,
  tone: string
): string {
  return `Create a ${slideCount}-slide webinar presentation from this training material.

Webinar Title: ${webinarTitle}

Training Material:
${documentText.substring(0, 15000)} ${documentText.length > 15000 ? '...(truncated)' : ''}

Requirements:
1. Create ${slideCount} slides total
2. Tone: ${tone}
3. Format: Professional webinar presentation for B2B audience
4. Focus: Sales conversion and value communication

Slide Structure:
- Slide 1: Title slide with compelling tagline
- Slides 2-3: Problem/context setting
- Slides 4-${slideCount - 2}: Main content (features, benefits, solutions)
- Slide ${slideCount - 1}: Social proof or results
- Slide ${slideCount}: Strong call-to-action

Guidelines:
- Each content slide: 3-5 bullet points maximum
- Keep text concise (max 15 words per bullet)
- Include speaker notes for each slide
- Emphasize benefits over features
- Create urgency in final slides
- Extract and use real data from the material

Also extract sales information for AI agent training (products, pricing, benefits, objections, CTA).

Return JSON in this exact format:
{
  "slides": [
    {
      "type": "title" | "content" | "bullet" | "quote" | "comparison" | "cta",
      "title": "Slide title",
      "content": "Content (use \\\\n for bullet points)",
      "speakerNotes": "What presenter should say",
      "layout": "layout name"
    }
  ],
  "salesInfo": {
    "products": [{"name": "", "description": "", "features": []}],
    "pricing": [{"tier": "", "price": "", "features": []}],
    "benefits": [],
    "objections": [{"objection": "", "response": ""}],
    "cta": {"primary": "", "urgency": ""},
    "competitors": [],
    "testimonials": []
  }
}`;
}

/**
 * System prompt for AI
 */
const SYSTEM_PROMPT = `You are an expert presentation designer specializing in B2B webinar content.

Your expertise:
- Converting training materials into compelling slide decks
- Crafting sales-focused messaging
- Structuring content for maximum engagement
- Writing concise, impactful text
- Creating logical flow and storytelling

Guidelines:
1. Always focus on benefits and outcomes, not just features
2. Use specific numbers and data when available
3. Create slides that can be understood in 5 seconds
4. Balance information density with visual simplicity
5. Build momentum toward the call-to-action
6. Extract accurate information - never fabricate details
7. Return only valid, parseable JSON

Presentation best practices:
- One main idea per slide
- Consistent formatting
- Active voice
- Concrete examples
- Clear hierarchy
- Strong openings and closings`;

/**
 * Get empty sales info structure
 */
function getEmptySalesInfo(): SalesInfo {
  return {
    products: [],
    pricing: [],
    benefits: [],
    objections: [],
    cta: { primary: '' },
  };
}

/**
 * Validate generated slides
 */
export function validateSlides(slides: SlideData[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(slides) || slides.length === 0) {
    errors.push('No slides generated');
    return { valid: false, errors };
  }

  if (slides.length < 5) {
    errors.push('Too few slides (minimum 5)');
  }

  if (slides.length > 20) {
    errors.push('Too many slides (maximum 20)');
  }

  // Check first slide is title
  if (slides[0].type !== 'title') {
    errors.push('First slide must be a title slide');
  }

  // Check last slide is CTA
  if (slides[slides.length - 1].type !== 'cta') {
    errors.push('Last slide should be a call-to-action');
  }

  // Validate each slide
  slides.forEach((slide, index) => {
    if (!slide.title || slide.title.trim().length === 0) {
      errors.push(`Slide ${index + 1}: Missing title`);
    }

    if (!slide.content || slide.content.trim().length === 0) {
      errors.push(`Slide ${index + 1}: Missing content`);
    }

    if (slide.title.length > 100) {
      errors.push(`Slide ${index + 1}: Title too long (max 100 characters)`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format sales info for AI agent prompt
 */
export function formatSalesInfoForPrompt(salesInfo: SalesInfo): string {
  let prompt = '\n\n## Product & Sales Information\n\n';

  // Products
  if (salesInfo.products.length > 0) {
    prompt += '### Products/Services We Offer\n';
    salesInfo.products.forEach((product) => {
      prompt += `**${product.name}**\n`;
      prompt += `${product.description}\n`;
      if (product.features.length > 0) {
        prompt += 'Key features:\n';
        product.features.forEach((feature) => {
          prompt += `- ${feature}\n`;
        });
      }
      prompt += '\n';
    });
  }

  // Pricing
  if (salesInfo.pricing.length > 0) {
    prompt += '### Pricing & Plans\n';
    salesInfo.pricing.forEach((tier) => {
      prompt += `**${tier.tier}**: ${tier.price}\n`;
      if (tier.features.length > 0) {
        tier.features.forEach((feature) => {
          prompt += `- ${feature}\n`;
        });
      }
      prompt += '\n';
    });
  }

  // Benefits
  if (salesInfo.benefits.length > 0) {
    prompt += '### Key Benefits\n';
    salesInfo.benefits.forEach((benefit) => {
      prompt += `- ${benefit}\n`;
    });
    prompt += '\n';
  }

  // Objections
  if (salesInfo.objections.length > 0) {
    prompt += '### Common Objections & Responses\n';
    salesInfo.objections.forEach((obj) => {
      prompt += `**Objection**: "${obj.objection}"\n`;
      prompt += `**Response**: ${obj.response}\n\n`;
    });
  }

  // CTA
  if (salesInfo.cta.primary) {
    prompt += '### Call to Action\n';
    prompt += `Primary CTA: ${salesInfo.cta.primary}\n`;
    if (salesInfo.cta.urgency) {
      prompt += `Urgency: ${salesInfo.cta.urgency}\n`;
    }
    prompt += '\n';
  }

  // Competitors
  if (salesInfo.competitors && salesInfo.competitors.length > 0) {
    prompt += '### Competitive Positioning\n';
    prompt += `Competitors mentioned: ${salesInfo.competitors.join(', ')}\n\n`;
  }

  prompt += '## Sales Guidelines\n';
  prompt += '- Always reference specific product names and benefits\n';
  prompt += '- Guide prospects toward the appropriate pricing tier\n';
  prompt += '- Use objection responses to handle concerns\n';
  prompt += '- Create urgency when appropriate\n';
  prompt += '- Focus on value and outcomes, not just features\n';

  return prompt;
}
