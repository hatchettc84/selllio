/**
 * Webinar Presentations Management Page
 *
 * Allows webinar presenters to upload training materials and generate presentations
 */

import { onAuthenticateUser } from '@/action/auth';
import { getWebinarById } from '@/action/webinar';
import { PresentationUpload } from '@/components/presentations/PresentationUpload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react';

type Props = {
  params: Promise<{
    webinarId: string;
  }>;
};

export default async function WebinarPresentationsPage({ params }: Props) {
  const { webinarId } = await params;

  // Authenticate user
  const checkUser = await onAuthenticateUser();
  if (!checkUser.user) {
    redirect('/sign-in');
  }

  // Get webinar data
  const webinar = await getWebinarById(webinarId);

  if (!webinar) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Webinar Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The webinar you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/webinars">
            <Button>Back to Webinars</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Verify user owns this webinar
  if (webinar.presenterId !== checkUser.user.id) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to manage presentations for this webinar.
          </p>
          <Link href="/webinars">
            <Button>Back to Webinars</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Back Navigation */}
      <Link href="/webinars">
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Webinars
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Presentation Generator</h1>
            <p className="text-muted-foreground">
              {webinar.title}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload training materials to automatically generate professional presentations
          for your webinar attendees. AI will parse your documents and create 8-12 slides
          in 30-60 seconds.
        </p>
      </div>

      {/* Feature Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <FileText className="w-8 h-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Upload Documents</h3>
          <p className="text-sm text-muted-foreground">
            PDF, DOCX, TXT, or MD files up to 10MB
          </p>
        </Card>

        <Card className="p-4">
          <Sparkles className="w-8 h-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">AI Processing</h3>
          <p className="text-sm text-muted-foreground">
            GPT-4o analyzes content and generates slides
          </p>
        </Card>

        <Card className="p-4">
          <FileText className="w-8 h-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Download & Share</h3>
          <p className="text-sm text-muted-foreground">
            Professional PowerPoint ready for your webinar
          </p>
        </Card>
      </div>

      {/* Upload Component */}
      <Card className="p-6">
        <PresentationUpload webinarId={webinar.id} />
      </Card>

      {/* Quick Tips */}
      <Card className="p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4">💡 Tips for Best Results</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="font-semibold text-primary">•</span>
            <div>
              <strong>Include key information:</strong> Products/services, pricing,
              benefits, features, and customer testimonials
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold text-primary">•</span>
            <div>
              <strong>Structure your content:</strong> Use clear headings and sections
              to help AI understand your content hierarchy
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold text-primary">•</span>
            <div>
              <strong>Be comprehensive:</strong> AI extracts sales information to
              automatically enhance your AI agent's knowledge
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold text-primary">•</span>
            <div>
              <strong>Multiple uploads:</strong> You can upload multiple documents
              to generate different presentations for different topics
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
