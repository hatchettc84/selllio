/**
 * Demo Page for Presentation Generation Feature
 *
 * Test the presentation generation without needing a real webinar
 */

import { onAuthenticateUser } from '@/action/auth';
import { getWebinarByPresenterId } from '@/action/webinar';
import { PresentationUpload } from '@/components/presentations/PresentationUpload';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { FileText, Sparkles, Download, Zap } from 'lucide-react';

export default async function PresentationDemoPage() {
  const checkUser = await onAuthenticateUser();

  if (!checkUser.user) {
    redirect('/sign-in');
  }

  // Get user's first webinar (or create a demo one)
  const webinars = await getWebinarByPresenterId(checkUser.user.id);
  const demoWebinar = webinars && webinars.length > 0 ? webinars[0] : null;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Presentation Generator</h1>
            <p className="text-muted-foreground">
              Upload training materials, get professional presentations in 30-60 seconds
            </p>
          </div>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <FileText className="w-8 h-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Upload Documents</h3>
          <p className="text-sm text-muted-foreground">
            PDF, DOCX, TXT, or MD files up to 10MB
          </p>
        </Card>

        <Card className="p-4">
          <Zap className="w-8 h-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">AI Processing</h3>
          <p className="text-sm text-muted-foreground">
            GPT-4o analyzes content and generates 8-12 slides
          </p>
        </Card>

        <Card className="p-4">
          <Download className="w-8 h-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Download PowerPoint</h3>
          <p className="text-sm text-muted-foreground">
            Professional presentations ready for your webinar
          </p>
        </Card>
      </div>

      {/* Upload Component */}
      {demoWebinar ? (
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <strong>Testing with webinar:</strong> {demoWebinar.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Presentations will be associated with this webinar
            </p>
          </div>

          <Card className="p-6">
            <PresentationUpload
              webinarId={demoWebinar.id}
              onUploadComplete={(presentation) => {
                console.log('Demo presentation created:', presentation);
              }}
            />
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No Webinars Found</h2>
            <p className="text-muted-foreground">
              You need to create at least one webinar before generating presentations.
            </p>
            <a
              href="/home"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Create Your First Webinar
            </a>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4">How to Test</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="font-semibold text-primary">1.</span>
            <div>
              <strong>Create a test document:</strong> Write some product/service information
              in Word or Google Docs (features, pricing, benefits) and save as PDF
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-primary">2.</span>
            <div>
              <strong>Upload the file:</strong> Drag & drop onto the upload area above
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-primary">3.</span>
            <div>
              <strong>Wait 30-60 seconds:</strong> AI will parse the document and generate slides
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-primary">4.</span>
            <div>
              <strong>Download PowerPoint:</strong> Click the download button and open in
              PowerPoint/Keynote/Google Slides
            </div>
          </li>
        </ol>

        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium mb-2">💡 Sample Content to Test With:</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Product features and benefits</p>
            <p>• Pricing tiers and plans</p>
            <p>• Customer testimonials</p>
            <p>• Case studies</p>
            <p>• Technical specifications</p>
          </div>
        </div>
      </Card>

      {/* Setup Check */}
      <Card className="p-6 mt-4">
        <h2 className="text-lg font-semibold mb-4">⚙️ Setup Checklist</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span>Database migrated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span>Dependencies installed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span>OpenAI API key (add to .env if not set)</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted rounded text-xs font-mono">
          OPENAI_API_KEY=sk-proj-your_key_here
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Get your API key at{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            platform.openai.com/api-keys
          </a>
        </p>
      </Card>
    </div>
  );
}
