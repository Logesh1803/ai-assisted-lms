"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { videoAnalysisApi } from "@/lib/api";
import { getFriendlyError } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Upload,
  Loader2,
  Sparkles,
  CheckCircle2,
  X,
  ListChecks,
  FileVideo,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const ACCEPTED = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/avi", "video/x-matroska"];
const MAX_MB = 500;

export default function AIVideoPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ summary: string; key_points: string[] } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Unsupported file type. Please upload mp4, webm, mov, avi or mkv.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_MB}MB.`);
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Unsupported file type.");
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    try {
      const data = await videoAnalysisApi.analyze(selectedFile) as any;
      setResult(data);
    } catch (err: any) {
      toast.error(getFriendlyError(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Video Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Upload any video and get an AI-generated summary with key learning points
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          {!selectedFile ? (
            <div
              className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <FileVideo className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="font-semibold text-lg mb-1">Drop a video here</p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse — MP4, WebM, MOV, AVI, MKV up to {MAX_MB}MB
              </p>
              <Button variant="outline" type="button">
                <Upload className="h-4 w-4" />
                Choose Video
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
              <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatBytes(selectedFile.size)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {analyzing ? "Analyzing..." : "Analyze"}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleClear} disabled={analyzing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>

      {/* Analyzing state */}
      {analyzing && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="font-semibold text-lg">Analyzing your video...</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Gemini AI is processing the video content. This may take a minute depending on the video length.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !analyzing && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Analysis complete for <span className="font-medium text-foreground">{selectedFile?.name}</span></span>
          </div>

          {/* Key Points */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                Key Learning Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.key_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Badge variant="secondary" className="mt-0.5 shrink-0 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {i + 1}
                    </Badge>
                    <span className="text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Video Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={handleClear} className="w-full">
            Analyze Another Video
          </Button>
        </div>
      )}
    </div>
  );
}
