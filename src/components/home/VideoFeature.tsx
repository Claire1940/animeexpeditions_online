"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Play } from "lucide-react";

interface VideoFeatureProps {
  videoId: string;
  title: string;
}

/**
 * VideoFeature
 *
 * - 默认渲染封面缩略图 + 播放按钮（点击即加载并播放）。
 * - 使用 IntersectionObserver 监测进入视口后自动加载 iframe 并静音自动循环播放
 *   （autoplay=1&mute=1&loop=1）。
 * - 保留「Watch on YouTube」外链与点击播放按钮作为后备。
 */
export function VideoFeature({ videoId, title }: VideoFeatureProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activated, setActivated] = useState(false);

  const watchUrl = useMemo(
    () => `https://www.youtube.com/watch?v=${videoId}`,
    [videoId],
  );

  // 自动播放嵌入地址：静音 + 循环（loop 需配合 playlist 参数才能在单视频下生效）
  const embedUrl = useMemo(
    () =>
      `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0`,
    [videoId],
  );

  const thumbUrl = useMemo(
    () => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    [videoId],
  );

  // 进入视口后自动激活（仅触发一次）
  useEffect(() => {
    if (activated) return;
    const node = containerRef.current;
    if (!node) return;

    // 不支持 IntersectionObserver 时直接激活，保留点击后备即可
    if (typeof IntersectionObserver === "undefined") {
      setActivated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActivated(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.45 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activated]);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg bg-black"
        style={{ paddingBottom: "56.25%" }}
      >
        {activated ? (
          <iframe
            className="absolute top-0 left-0 h-full w-full"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setActivated(true)}
            aria-label={`Play ${title}`}
            className="group absolute top-0 left-0 h-full w-full"
          >
            {/* 封面缩略图 */}
            <img
              src={thumbUrl}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {/* 暗化遮罩 */}
            <span className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/45" />
            {/* 播放按钮 */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--nav-theme)/0.95)] shadow-lg shadow-[hsl(var(--nav-theme)/0.4)] transition-transform group-hover:scale-110 md:h-16 md:w-16">
                <Play className="h-6 w-6 translate-x-0.5 text-white md:h-7 md:w-7" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
        >
          Watch on YouTube
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
