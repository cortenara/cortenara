"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { 
  Cloud, 
  FolderOpen, 
  Image, 
  Video, 
  FileText, 
  Download,
  Upload,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

// Note: Google Drive API integration requires OAuth2 for full functionality
// For production, implement proper OAuth flow or use a backend service
const GOOGLE_DRIVE_FOLDER_ID = '1pA4QZhYHQaZOTwkDYFfCYrzdXH38MVV_';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

export function MediaTab() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Simulated files for demo (since Drive API requires OAuth)
  const demoFiles: DriveFile[] = [
    { id: '1', name: 'intro_animation.mp4', mimeType: 'video/mp4', size: '45.2 MB', modifiedTime: '2024-01-15' },
    { id: '2', name: 'thumbnail_template.psd', mimeType: 'image/vnd.adobe.photoshop', size: '12.8 MB', modifiedTime: '2024-01-14' },
    { id: '3', name: 'background_music.mp3', mimeType: 'audio/mpeg', size: '8.3 MB', modifiedTime: '2024-01-13' },
    { id: '4', name: 'b-roll_clips', mimeType: 'application/vnd.google-apps.folder', modifiedTime: '2024-01-12' },
    { id: '5', name: 'logo_white.png', mimeType: 'image/png', size: '256 KB', modifiedTime: '2024-01-11' },
    { id: '6', name: 'episode_notes.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: '1.2 MB', modifiedTime: '2024-01-10' },
  ];

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    
    // Simulate API connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo purposes, show simulated files
    setFiles(demoFiles);
    setIsConnected(true);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFiles(demoFiles);
    setLoading(false);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <FolderOpen className="h-5 w-5 text-warning" />;
    if (mimeType.includes('video')) return <Video className="h-5 w-5 text-chart-1" />;
    if (mimeType.includes('image')) return <Image className="h-5 w-5 text-chart-2" />;
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const formatFileSize = (size?: string) => {
    return size || '-';
  };

  if (!isConnected) {
    return (
      <div className="flex h-[calc(100vh-220px)] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Cloud className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">Connect Google Drive</h2>
        <p className="mb-6 max-w-md text-muted-foreground">
          Connect your Google Drive to access and manage your media assets directly from this workspace.
        </p>
        <div className="mb-4 rounded-lg bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
          Folder ID: <code className="text-foreground">{GOOGLE_DRIVE_FOLDER_ID}</code>
        </div>
        <Button
          onClick={handleConnect}
          disabled={loading}
          className="bg-primary text-primary-foreground"
        >
          {loading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Connecting...
            </>
          ) : (
            <>
              <Cloud className="mr-2 h-4 w-4" />
              Connect Google Drive
            </>
          )}
        </Button>

        <div className="mt-8 rounded-lg border border-border bg-secondary/30 p-4 text-left">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
            <div>
              <h3 className="text-sm font-medium text-foreground">Integration Note</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Full Google Drive integration requires OAuth2 authentication. For production use, 
                set up a backend service with proper authentication flow. This demo shows simulated files.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <Cloud className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Media Assets</h2>
          <span className="text-xs text-muted-foreground">{files.length} items</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      )}

      {/* Files List */}
      {!loading && files.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.mimeType)}
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} · Modified {file.modifiedTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && files.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">No files found in this folder</p>
        </div>
      )}
    </div>
  );
}
