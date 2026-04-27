"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { 
  Youtube, 
  Eye, 
  ThumbsUp, 
  MessageCircle,
  Users,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Play,
  Calendar
} from 'lucide-react';

// YouTube Data API configuration (provided by user)
const YOUTUBE_API_KEY = 'AIzaSyBxWI0-NO2YLtLGkYs4G8Z8KeChVM7j8rY';
const CHANNEL_ID = 'UCD8wYgEhN8xIgx2jP3XPvwg';

interface VideoStats {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

interface ChannelStats {
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

export function AnalyticsTab() {
  const [videos, setVideos] = useState<VideoStats[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchYouTubeData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch channel statistics
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
      );
      
      if (!channelResponse.ok) {
        throw new Error('Failed to fetch channel data');
      }
      
      const channelData = await channelResponse.json();
      
      if (channelData.items && channelData.items.length > 0) {
        const stats = channelData.items[0].statistics;
        setChannelStats({
          subscriberCount: stats.subscriberCount,
          viewCount: stats.viewCount,
          videoCount: stats.videoCount,
        });
      }

      // Fetch latest videos
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=6&order=date&type=video&key=${YOUTUBE_API_KEY}`
      );
      
      if (!videosResponse.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const videosData = await videosResponse.json();
      
      if (videosData.items && videosData.items.length > 0) {
        // Get video IDs for statistics
        const videoIds = videosData.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(',');
        
        const statsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch video statistics');
        }
        
        const statsData = await statsResponse.json();
        
        const videosWithStats: VideoStats[] = videosData.items.map((item: { id: { videoId: string }, snippet: { title: string, thumbnails: { medium: { url: string } }, publishedAt: string } }, index: number) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          publishedAt: item.snippet.publishedAt,
          viewCount: statsData.items[index]?.statistics?.viewCount || '0',
          likeCount: statsData.items[index]?.statistics?.likeCount || '0',
          commentCount: statsData.items[index]?.statistics?.commentCount || '0',
        }));
        
        setVideos(videosWithStats);
      }
    } catch (err) {
      console.error('YouTube API error:', err);
      setError('Failed to load YouTube data. Please check the API key and channel ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYouTubeData();
  }, []);

  const formatNumber = (num: string) => {
    const n = parseInt(num, 10);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return num;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-220px)] items-center justify-center rounded-xl border border-border bg-card">
        <div className="text-center">
          <Spinner className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-4 text-muted-foreground">Loading YouTube analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-220px)] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
        <Youtube className="mb-4 h-16 w-16 text-destructive/50" />
        <h2 className="mb-2 text-xl font-semibold text-foreground">Unable to Load Analytics</h2>
        <p className="mb-6 max-w-md text-muted-foreground">{error}</p>
        <Button onClick={fetchYouTubeData} className="bg-primary text-primary-foreground">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Channel Overview */}
      {channelStats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                <Users className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscribers</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(channelStats.subscriberCount)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <Eye className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(channelStats.viewCount)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <Play className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Videos</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(channelStats.videoCount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Videos */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Latest Videos</h2>
          </div>
          <Button variant="outline" size="sm" onClick={fetchYouTubeData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="divide-y divide-border">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-secondary/30"
            >
              {/* Thumbnail */}
              <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-secondary">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <h3 className="mb-1 line-clamp-2 text-sm font-medium text-foreground">
                  {video.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(video.publishedAt)}
                </div>
              </div>

              {/* Stats */}
              <div className="flex shrink-0 items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <Eye className="h-4 w-4 text-chart-1" />
                    {formatNumber(video.viewCount)}
                  </div>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <ThumbsUp className="h-4 w-4 text-chart-2" />
                    {formatNumber(video.likeCount)}
                  </div>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <MessageCircle className="h-4 w-4 text-chart-3" />
                    {formatNumber(video.commentCount)}
                  </div>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-muted-foreground hover:text-foreground"
                >
                  <a
                    href={`https://youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Youtube className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No videos found</p>
          </div>
        )}
      </div>
    </div>
  );
}
