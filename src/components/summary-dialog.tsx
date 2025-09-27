"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, ExternalLink, Loader2 } from "lucide-react";

interface SummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

export function SummaryDialog({ open, onOpenChange, url, title }: SummaryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Function to scrape page and generate summary
  const generateSummary = useCallback(async () => {
    if (!open || summary || isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      // First, scrape the page content
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const scrapeResult = await scrapeResponse.json();

      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || 'Failed to scrape page');
      }

      // Then, generate summary using the markdown content
      const summaryResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: scrapeResult.data.markdown,
          title: scrapeResult.data.title,
          url: scrapeResult.data.url,
        }),
      });

      const summaryResult = await summaryResponse.json();

      if (!summaryResult.success) {
        throw new Error(summaryResult.error || 'Failed to generate summary');
      }

      setSummary(summaryResult.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  }, [open, summary, isLoading, url]);

  // Generate summary when dialog opens
  React.useEffect(() => {
    if (open) {
      generateSummary();
    } else {
      // Reset when dialog closes
      setSummary("");
      setError("");
    }
  }, [open, generateSummary]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="truncate">AI Summary</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Page Info */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
              {title}
            </h3>
            <button
              onClick={openInNewTab}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate"
            >
              <span className="truncate">{url}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </button>
          </div>

          {/* Summary Content */}
          <div className="min-h-[200px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analyzing page content...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  {error}
                </p>
                <Button
                  onClick={generateSummary}
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            ) : summary ? (
              <div className="prose dark:prose-invert max-w-none">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}