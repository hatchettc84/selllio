'use client';

/**
 * Presentation Upload Component
 *
 * Drag-and-drop file upload UI for training materials
 * Generates presentations automatically using AI
 */

import { useState, useRef, useCallback } from 'react';
import { FileText, Upload, Loader2, CheckCircle, XCircle, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AIPresenterConfig from '@/components/ai-presenter/AIPresenterConfig';

interface Presentation {
  id: string;
  title: string;
  processingStatus: string;
  slideCount: number;
  aiCostCents: number;
  sourceFileSize: number;
  sourceFileType: string;
  createdAt: string;
  errorMessage?: string;
  aiPresenterEnabled?: boolean;
}

interface PresentationUploadProps {
  webinarId: string;
  onUploadComplete?: (presentation: Presentation) => void;
}

export function PresentationUpload({ webinarId, onUploadComplete }: PresentationUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing presentations on mount
  useState(() => {
    fetchPresentations();
  });

  async function fetchPresentations() {
    try {
      const response = await fetch(`/api/presentations/generate?webinarId=${webinarId}`);
      const data = await response.json();

      if (data.presentations) {
        setPresentations(data.presentations);
      }
    } catch (error) {
      console.error('Failed to fetch presentations:', error);
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [webinarId]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  async function handleFileUpload(file: File) {
    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast.error('Unsupported file type', {
        description: `Please upload PDF, DOCX, TXT, or MD files`,
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Maximum file size is 10MB',
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('webinarId', webinarId);
      formData.append('theme', 'selllio');

      const response = await fetch('/api/presentations/generate', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      toast.success('Presentation generated!', {
        description: `Created ${data.slideCount} slides`,
      });

      // Refresh presentations list
      await fetchPresentations();

      if (onUploadComplete) {
        onUploadComplete(data);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Generation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }

  async function handleDownload(presentationId: string, title: string) {
    try {
      const response = await fetch(`/api/presentations/${presentationId}/download`);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = title.replace(/[^a-z0-9]/gi, '_') + '.pptx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  }

  async function handleDelete(presentationId: string) {
    if (!confirm('Are you sure you want to delete this presentation?')) {
      return;
    }

    try {
      // For MVP: Just remove from UI (Phase 2: Add delete API)
      setPresentations(prev => prev.filter(p => p.id !== presentationId));
      toast.success('Presentation deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-background'}
          ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-primary/50'}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Generating presentation...</p>
              <p className="text-sm text-muted-foreground">
                This usually takes 30-60 seconds
              </p>
              <div className="max-w-xs mx-auto">
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & Drop Training Materials Here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse files
              </p>
              <p className="text-xs text-muted-foreground">
                Supported: PDF, DOCX, TXT, MD • Max 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Presentations List */}
      {presentations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Presentations</h3>

          <div className="space-y-3">
            {presentations.map((presentation) => (
              <div
                key={presentation.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex items-start gap-4 flex-1">
                  {getStatusIcon(presentation.processingStatus)}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{presentation.title}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>{formatFileSize(presentation.sourceFileSize)}</span>
                      {presentation.slideCount > 0 && (
                        <span>{presentation.slideCount} slides</span>
                      )}
                      <span className="uppercase">{presentation.sourceFileType}</span>
                    </div>

                    {presentation.errorMessage && (
                      <p className="text-sm text-red-500 mt-1">
                        {presentation.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {presentation.processingStatus === 'completed' && (
                    <>
                      <AIPresenterConfig
                        presentationId={presentation.id}
                        isEnabled={presentation.aiPresenterEnabled}
                        onSuccess={() => fetchPresentations()}
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(presentation.id, presentation.title)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(presentation.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm font-medium mb-2">What happens after upload:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>✓ AI analyzes your training material</li>
          <li>✓ Generates professional slides (typically 8-12)</li>
          <li>✓ Creates downloadable PowerPoint presentation</li>
          <li>✓ Enhances your AI agent with product knowledge</li>
        </ul>
      </div>
    </div>
  );
}
