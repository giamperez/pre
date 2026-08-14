import { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX, Maximize2, X, Film, Check } from 'lucide-react';
import { API_URL } from '../config';

function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-f]{6})$/i.test(hex) ? `${hex}${alpha}` : hex;
}

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  videoUrl: string;
  colorPrimary?: string;
  onSelectService?: () => void;
  isSelected?: boolean;
}

export function parseVideoUrl(url?: string | null) {
  if (!url || !url.trim()) return null;
  let cleanUrl = url.trim();

  // Fix relative URLs by prefixing backend API_URL/public
  if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('data:')) {
    cleanUrl = `${API_URL}/public${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  }

  // 1. Google Drive
  const driveFileMatch = cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const driveIdMatch = cleanUrl.match(/drive\.google\.com\/(?:open\?id=|uc\?id=|uc\?export=download&id=)([a-zA-Z0-9_-]+)/);
  const driveId = (driveFileMatch && driveFileMatch[1]) || (driveIdMatch && driveIdMatch[1]);

  if (driveId) {
    return {
      type: 'iframe' as const,
      url: `https://drive.google.com/uc?export=download&id=${driveId}`,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      isDrive: true,
    };
  }

  // 2. YouTube
  const youtubeMatch = cleanUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch && youtubeMatch[1]) {
    const ytId = youtubeMatch[1];
    return {
      type: 'iframe' as const,
      url: `https://www.youtube.com/watch?v=${ytId}`,
      embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=1`,
      isYoutube: true,
    };
  }

  // 3. Vimeo
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      type: 'iframe' as const,
      url: cleanUrl,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1`,
    };
  }

  return {
    type: 'direct' as const,
    url: cleanUrl,
  };
}

export function VideoDemoModal({
  isOpen,
  onClose,
  serviceName,
  videoUrl,
  colorPrimary = '#0ea5e9',
  onSelectService,
  isSelected = false,
}: VideoDemoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const videoInfo = parseVideoUrl(videoUrl);

  useEffect(() => {
    if (isOpen && videoRef.current && videoInfo?.type === 'direct') {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isOpen, videoInfo?.type]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const isVertical = aspectRatio !== null && aspectRatio < 0.9;
  const isSquare = aspectRatio !== null && aspectRatio >= 0.9 && aspectRatio <= 1.2;

  const modalWidthClass = isVertical
    ? 'max-w-[340px] sm:max-w-[380px]'
    : isSquare
    ? 'max-w-md'
    : 'max-w-xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`relative w-full ${modalWidthClass} bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 text-white flex flex-col transform transition-all duration-300 scale-100 my-auto`}
        style={{ boxShadow: `0 20px 50px -10px ${colorPrimary}40` }}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 bg-slate-900/90 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
              style={{ backgroundColor: colorPrimary }}
            >
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colorPrimary }}>
                {videoInfo?.isDrive ? 'Google Drive Demo' : videoInfo?.isYoutube ? 'YouTube Demo' : 'Demo 30s'}
              </div>
              <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                {serviceName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Container */}
        <div
          className={`relative bg-black flex items-center justify-center group overflow-hidden ${
            isVertical ? 'max-h-[65vh] aspect-[9/16]' : isSquare ? 'aspect-square' : 'aspect-video'
          }`}
        >
          {videoInfo?.type === 'iframe' && videoInfo.embedUrl ? (
            <iframe
              src={videoInfo.embedUrl}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={`Demo - ${serviceName}`}
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={videoInfo?.url || videoUrl}
                loop
                muted={isMuted}
                playsInline
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
              />

              {!isPlaying && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity"
                >
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-xl transform scale-100 hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 fill-current ml-1" />
                  </div>
                </button>
              )}

              {/* Controls Bar Overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-3 flex items-center justify-between text-xs text-white opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-lg transition-colors font-semibold text-[11px] backdrop-blur-xs text-white"
                    style={isMuted
                      ? { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.3)' }
                      : { backgroundColor: withAlpha(colorPrimary, '33'), borderColor: withAlpha(colorPrimary, '80') }}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" /> Activar audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> Silenciar
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleFullscreen}
                  className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-slate-300 hover:text-white transition-colors border border-white/20"
                  title="Pantalla completa"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Animated Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full transition-all duration-100"
                  style={{ width: `${progress}%`, backgroundColor: colorPrimary }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-white/10 flex items-center justify-between gap-3">
          <p className="text-[11px] sm:text-xs text-slate-400">
            ¿Te convence esta solución?
          </p>

          {onSelectService && (
            <button
              type="button"
              onClick={() => {
                onSelectService();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 hover:brightness-110"
              style={isSelected
                ? { backgroundColor: withAlpha(colorPrimary, '1a'), color: colorPrimary, border: `1px solid ${withAlpha(colorPrimary, '55')}` }
                : { backgroundColor: colorPrimary, color: '#fff' }}
            >
              {isSelected ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Seleccionado
                </>
              ) : (
                'Elegir paquete'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
