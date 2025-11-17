/**
 * PPTX Creator
 *
 * Creates PowerPoint presentations using PptxGenJS from AI-generated slide data
 */

import PptxGenJS from 'pptxgenjs';
import type { SlideData } from './aiGenerator';

export interface PresentationTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  fonts: {
    title: string;
    body: string;
  };
}

export interface PptxOptions {
  theme?: PresentationTheme;
  companyName?: string;
  logoPath?: string;
}

// Default Selllio theme
const DEFAULT_THEME: PresentationTheme = {
  name: 'Selllio Professional',
  colors: {
    primary: '6366F1', // Purple
    secondary: '8B5CF6', // Light purple
    text: '1E293B', // Dark slate
    background: 'FFFFFF', // White
    accent: '3B82F6', // Blue
  },
  fonts: {
    title: 'Arial',
    body: 'Arial',
  },
};

/**
 * Create PowerPoint presentation from slide data
 */
export async function createPPTX(
  slides: SlideData[],
  title: string,
  options?: PptxOptions
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  const theme = options?.theme || DEFAULT_THEME;

  // Set presentation metadata
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = options?.companyName || 'Selllio';
  pptx.subject = title;
  pptx.title = title;

  // Define master slide with branding
  defineMasterSlide(pptx, theme, options?.companyName);

  // Create each slide
  slides.forEach((slideData, index) => {
    createSlide(pptx, slideData, theme, index + 1);
  });

  // Generate and return buffer
  const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return buffer;
}

/**
 * Define master slide template with branding
 */
function defineMasterSlide(
  pptx: PptxGenJS,
  theme: PresentationTheme,
  companyName?: string
) {
  pptx.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: theme.colors.background },
    objects: [
      // Footer bar
      {
        rect: {
          x: 0,
          y: 5.2,
          w: '100%',
          h: 0.4,
          fill: { color: theme.colors.primary },
        },
      },
      // Company name in footer
      {
        text: {
          text: companyName || 'Powered by Selllio',
          options: {
            x: 0.5,
            y: 5.3,
            w: 4,
            h: 0.3,
            fontSize: 10,
            color: theme.colors.text,
            align: 'left',
          },
        },
      },
    ],
  });
}

/**
 * Create individual slide based on type
 */
function createSlide(
  pptx: PptxGenJS,
  slideData: SlideData,
  theme: PresentationTheme,
  slideNumber: number
) {
  const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });

  switch (slideData.type) {
    case 'title':
      createTitleSlide(slide, slideData, theme);
      break;

    case 'bullet':
      createBulletSlide(slide, slideData, theme, slideNumber);
      break;

    case 'content':
      createContentSlide(slide, slideData, theme, slideNumber);
      break;

    case 'quote':
      createQuoteSlide(slide, slideData, theme);
      break;

    case 'comparison':
      createComparisonSlide(slide, slideData, theme, slideNumber);
      break;

    case 'cta':
      createCTASlide(slide, slideData, theme);
      break;

    default:
      createBulletSlide(slide, slideData, theme, slideNumber);
  }

  // Add speaker notes if available
  if (slideData.speakerNotes) {
    slide.addNotes(slideData.speakerNotes);
  }
}

/**
 * Create title slide
 */
function createTitleSlide(
  slide: any,
  slideData: SlideData,
  theme: PresentationTheme
) {
  // Main title
  slide.addText(slideData.title, {
    x: 1,
    y: 2,
    w: 8,
    h: 1.5,
    fontSize: 48,
    bold: true,
    color: theme.colors.primary,
    align: 'center',
    fontFace: theme.fonts.title,
  });

  // Subtitle/content
  if (slideData.content) {
    slide.addText(slideData.content, {
      x: 1,
      y: 3.7,
      w: 8,
      h: 0.8,
      fontSize: 24,
      color: theme.colors.text,
      align: 'center',
      fontFace: theme.fonts.body,
    });
  }

  // Decorative accent
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.2,
    y: 3.4,
    w: 1.6,
    h: 0.08,
    fill: { color: theme.colors.accent },
  });
}

/**
 * Create bullet point slide
 */
function createBulletSlide(
  slide: any,
  slideData: SlideData,
  theme: PresentationTheme,
  slideNumber: number
) {
  // Slide number
  slide.addText(`${slideNumber}`, {
    x: 9.2,
    y: 0.3,
    w: 0.5,
    h: 0.3,
    fontSize: 14,
    color: theme.colors.primary,
    align: 'right',
  });

  // Title
  slide.addText(slideData.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: theme.colors.primary,
    fontFace: theme.fonts.title,
  });

  // Accent line under title
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.4,
    w: 2,
    h: 0.06,
    fill: { color: theme.colors.accent },
  });

  // Parse bullets from content
  const bullets = slideData.content
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => line.trim().replace(/^[•\-*]\s*/, ''));

  // Add bullet points
  slide.addText(bullets, {
    x: 1,
    y: 2,
    w: 8,
    h: 3,
    fontSize: 22,
    color: theme.colors.text,
    bullet: { type: 'number', code: '2022' }, // Unicode bullet
    fontFace: theme.fonts.body,
    lineSpacing: 32,
  });
}

/**
 * Create content slide (paragraphs)
 */
function createContentSlide(
  slide: any,
  slideData: SlideData,
  theme: PresentationTheme,
  slideNumber: number
) {
  // Slide number
  slide.addText(`${slideNumber}`, {
    x: 9.2,
    y: 0.3,
    w: 0.5,
    h: 0.3,
    fontSize: 14,
    color: theme.colors.primary,
    align: 'right',
  });

  // Title
  slide.addText(slideData.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.7,
    fontSize: 32,
    bold: true,
    color: theme.colors.primary,
    fontFace: theme.fonts.title,
  });

  // Content
  slide.addText(slideData.content, {
    x: 1,
    y: 1.8,
    w: 8,
    h: 3.2,
    fontSize: 20,
    color: theme.colors.text,
    fontFace: theme.fonts.body,
    valign: 'top',
  });
}

/**
 * Create quote slide
 */
function createQuoteSlide(
  slide: any,
  slideData: SlideData,
  theme: PresentationTheme
) {
  // Large quote mark
  slide.addText('"', {
    x: 1,
    y: 1.5,
    w: 1,
    h: 1,
    fontSize: 120,
    color: theme.colors.primary,
    opacity: 0.3,
  });

  // Quote text
  slide.addText(slideData.content, {
    x: 1.5,
    y: 2,
    w: 7,
    h: 2,
    fontSize: 28,
    italic: true,
    color: theme.colors.text,
    align: 'center',
    valign: 'middle',
    fontFace: theme.fonts.body,
  });

  // Attribution (from title)
  slide.addText(`— ${slideData.title}`, {
    x: 2,
    y: 4.2,
    w: 6,
    h: 0.5,
    fontSize: 18,
    color: theme.colors.secondary,
    align: 'center',
    fontFace: theme.fonts.body,
  });
}

/**
 * Create comparison slide (two columns)
 */
function createComparisonSlide(
  slide: any,
  slideData: SlideData,
  theme: PresentationTheme,
  slideNumber: number
) {
  // Slide number
  slide.addText(`${slideNumber}`, {
    x: 9.2,
    y: 0.3,
    w: 0.5,
    h: 0.3,
    fontSize: 14,
    color: theme.colors.primary,
    align: 'right',
  });

  // Title
  slide.addText(slideData.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.7,
    fontSize: 32,
    bold: true,
    color: theme.colors.primary,
    fontFace: theme.fonts.title,
  });

  // Split content into two columns
  const sections = slideData.content.split('|').map((s) => s.trim());
  const leftContent = sections[0] || '';
  const rightContent = sections[1] || sections[0] || '';

  // Left column
  slide.addText(leftContent, {
    x: 0.8,
    y: 1.8,
    w: 4,
    h: 3,
    fontSize: 18,
    color: theme.colors.text,
    fontFace: theme.fonts.body,
    valign: 'top',
  });

  // Divider line
  slide.addShape(pptx.ShapeType.line, {
    x: 5,
    y: 1.8,
    w: 0,
    h: 3,
    line: { color: theme.colors.accent, width: 2 },
  });

  // Right column
  slide.addText(rightContent, {
    x: 5.5,
    y: 1.8,
    w: 4,
    h: 3,
    fontSize: 18,
    color: theme.colors.text,
    fontFace: theme.fonts.body,
    valign: 'top',
  });
}

/**
 * Create call-to-action slide
 */
function createCTASlide(slide: any, slideData: SlideData, theme: PresentationTheme) {
  // Bold title
  slide.addText(slideData.title, {
    x: 1,
    y: 1.8,
    w: 8,
    h: 1,
    fontSize: 44,
    bold: true,
    color: theme.colors.primary,
    align: 'center',
    fontFace: theme.fonts.title,
  });

  // CTA message
  slide.addText(slideData.content, {
    x: 1.5,
    y: 3,
    w: 7,
    h: 1.2,
    fontSize: 26,
    color: theme.colors.text,
    align: 'center',
    fontFace: theme.fonts.body,
  });

  // CTA button effect
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.5,
    y: 4.3,
    w: 3,
    h: 0.6,
    fill: { color: theme.colors.primary },
    line: { color: theme.colors.primary, width: 0 },
  });

  slide.addText('Take Action Now', {
    x: 3.5,
    y: 4.35,
    w: 3,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });
}

/**
 * Predefined themes
 */
export const THEMES: Record<string, PresentationTheme> = {
  selllio: DEFAULT_THEME,

  modern: {
    name: 'Modern Dark',
    colors: {
      primary: '3B82F6',
      secondary: '60A5FA',
      text: 'F8FAFC',
      background: '0F172A',
      accent: '8B5CF6',
    },
    fonts: {
      title: 'Arial',
      body: 'Arial',
    },
  },

  professional: {
    name: 'Professional Blue',
    colors: {
      primary: '1E40AF',
      secondary: '3B82F6',
      text: '1E293B',
      background: 'FFFFFF',
      accent: '06B6D4',
    },
    fonts: {
      title: 'Arial',
      body: 'Arial',
    },
  },

  energetic: {
    name: 'Energetic Orange',
    colors: {
      primary: 'EA580C',
      secondary: 'FB923C',
      text: '1C1917',
      background: 'FFFBEB',
      accent: 'F59E0B',
    },
    fonts: {
      title: 'Arial',
      body: 'Arial',
    },
  },
};

/**
 * Get theme by name
 */
export function getTheme(themeName: string): PresentationTheme {
  return THEMES[themeName.toLowerCase()] || DEFAULT_THEME;
}
