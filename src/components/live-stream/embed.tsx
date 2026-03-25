'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Youtube, Twitch, Radio, X, ExternalLink, 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LiveStreamEmbedProps {
  type: 'youtube' | 'twitch';
  streamId: string; // YouTube video ID or Twitch channel
  title?: string;
  isLive?: boolean;
  autoPlay?: boolean;
  className?: string;
  onClose?: () => void;
}

export function LiveStreamEmbed({
  type,
  streamId,
  title,
  isLive = false,
  autoPlay = false,
  className,
  onClose,
}: LiveStreamEmbedProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const getEmbedUrl = () => {
    if (type === 'youtube') {
      // YouTube live stream or video embed
      const params = new URLSearchParams({
        autoplay: isPlaying ? '1' : '0',
        mute: isMuted ? '1' : '0',
        modestbranding: '1',
        rel: '0',
      });
      return `https://www.youtube.com/embed/${streamId}?${params}`;
    }
    
    if (type === 'twitch') {
      // Twitch channel embed
      const params = new URLSearchParams({
        channel: streamId,
        parent: window.location.hostname,
        autoplay: isPlaying ? 'true' : 'false',
        muted: isMuted ? 'true' : 'false',
      });
      return `https://player.twitch.tv/?${params}`;
    }
    
    return '';
  };

  const getExternalUrl = () => {
    if (type === 'youtube') {
      return `https://www.youtube.com/watch?v=${streamId}`;
    }
    if (type === 'twitch') {
      return `https://twitch.tv/${streamId}`;
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-2xl overflow-hidden bg-slate-900",
        isExpanded ? "fixed inset-4 z-50" : "",
        className
      )}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          {type === 'youtube' ? (
            <Youtube className="w-5 h-5 text-red-500" />
          ) : (
            <Twitch className="w-5 h-5 text-purple-500" />
          )}
          
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
          
          {title && (
            <span className="text-white text-sm font-medium truncate max-w-[200px]">
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Controls */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            {isExpanded ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            asChild
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <a href={getExternalUrl()} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>

          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Embed iframe */}
      <iframe
        src={getEmbedUrl()}
        className="w-full aspect-video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      {/* Play overlay (when paused) */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
          onClick={() => setIsPlaying(true)}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// Mini stream widget for bracket page
export function MiniStreamWidget({
  type,
  streamId,
  isLive,
}: {
  type: 'youtube' | 'twitch';
  streamId: string;
  isLive?: boolean;
}) {
  const [showEmbed, setShowEmbed] = useState(false);

  if (!isLive) return null;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowEmbed(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-red-500/20 to-purple-500/20 border border-red-500/30 hover:border-red-500/50 transition-colors"
      >
        {type === 'youtube' ? (
          <Youtube className="w-4 h-4 text-red-400" />
        ) : (
          <Twitch className="w-4 h-4 text-purple-400" />
        )}
        <span className="text-sm font-medium text-white">Watch Live</span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
      </motion.button>

      <AnimatePresence>
        {showEmbed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-4 z-50"
          >
            <LiveStreamEmbed
              type={type}
              streamId={streamId}
              isLive={isLive}
              autoPlay
              onClose={() => setShowEmbed(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LiveStreamEmbed;
