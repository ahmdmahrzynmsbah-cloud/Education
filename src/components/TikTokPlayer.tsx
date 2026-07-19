import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function TikTokPlayer({ videoUrl }: { videoUrl: string }) {
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const resolveUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to parse locally first to avoid unnecessary fetch if it's already a full url
        if (videoUrl.includes('/video/')) {
          const match = videoUrl.match(/\/video\/(\d+)/);
          if (match && match[1]) {
            if (active) {
              setEmbedUrl(`https://www.tiktok.com/embed/v2/${match[1]}`);
              setLoading(false);
            }
            return;
          }
        }

        // If not full url, ask the server to resolve the redirect
        const res = await fetch(`/api/resolve-tiktok?url=${encodeURIComponent(videoUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.videoId && active) {
            setEmbedUrl(`https://www.tiktok.com/embed/v2/${data.videoId}`);
          } else if (active) {
            setError('Could not resolve video');
          }
        } else if (active) {
          setError('Could not resolve video');
        }
      } catch (err) {
        console.error("TikTok resolution error:", err);
        if (active) setError('Error connecting to video');
      } finally {
        if (active) setLoading(false);
      }
    };

    resolveUrl();
    return () => {
      active = false;
    };
  }, [videoUrl]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0D0D12] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#00B4D8] dark:text-[#D4AF37] mb-2" />
        <span className="text-sm font-bold">جاري تحميل مقطع تيك توك...</span>
      </div>
    );
  }

  if (error || !embedUrl) {
    // Fallback to iframe with original URL if resolution fails completely
    const match = videoUrl.match(/\/video\/(\d+)/);
    const fallbackUrl = match && match[1]
      ? `https://www.tiktok.com/embed/v2/${match[1]}` 
      : videoUrl;

    return (
      <iframe
        src={fallbackUrl}
        className="w-full h-full object-cover border-0"
        title="TikTok Video Fallback"
        allowFullScreen
        referrerPolicy="no-referrer"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      />
    );
  }

  return (
    <iframe
      src={embedUrl}
      className="w-full h-full object-cover border-0"
      title="TikTok Video"
      allowFullScreen
      referrerPolicy="no-referrer"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    />
  );
}
