"use client";

import { useState, Suspense, lazy } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Coins,
  Copy,
  Crown,
  Gift,
  Shuffle,
  Sparkles,
  Swords,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { VideoFeature } from "@/components/home/VideoFeature";
import { LatestGuidesAccordion } from "@/components/home/LatestGuidesAccordion";
import { NativeBannerAd, AdBanner } from "@/components/ads";
import { getPreferredMobileBannerSelection } from "@/components/ads/mobileAdConfigs";
import { scrollToSection } from "@/lib/scrollToSection";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { ContentItemWithType } from "@/lib/getLatestArticles";
import type { ModuleLinkMap } from "@/lib/buildModuleLinkMap";

// Lazy load heavy components
const HeroStats = lazy(() => import("@/components/home/HeroStats"));
const FAQSection = lazy(() => import("@/components/home/FAQSection"));
const CTASection = lazy(() => import("@/components/home/CTASection"));

// Loading placeholder
const LoadingPlaceholder = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`}
  />
);

interface HomePageClientProps {
  latestArticles: ContentItemWithType[];
  moduleLinkMap: ModuleLinkMap;
  locale: string;
}

// Tools Grid 卡片 → 模块 section 锚点映射（与 8 个模块一一对应）
const TOOLS_SECTION_IDS = [
  "codes",
  "beginner-guide",
  "unit-tier-list",
  "units-and-summon",
  "traits-and-rerolls",
  "evolution-guide",
  "story-expeditions-and-raids",
  "gems-yen-time-chamber-farming",
];

// 模块级标题区（eyebrow + 标题 + 副标题 + intro），独立 section 复用
function ModuleHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  intro,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle?: string;
  intro?: string;
}) {
  return (
    <div className="mb-8 text-center scroll-reveal md:mb-12">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.1)] px-3 py-1.5 md:mb-4">
        <Icon className="h-4 w-4 text-[hsl(var(--nav-theme-light))]" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {eyebrow}
        </span>
      </div>
      <h2 className="mb-3 text-3xl font-bold md:mb-4 md:text-5xl">{title}</h2>
      {subtitle && (
        <p className="mx-auto max-w-3xl text-base text-muted-foreground md:text-lg">
          {subtitle}
        </p>
      )}
      {intro && (
        <p className="mx-auto mt-3 max-w-3xl text-sm text-muted-foreground md:mt-4 md:text-base">
          {intro}
        </p>
      )}
    </div>
  );
}

// 稀有度徽章颜色（语义色编码数据，非主题色硬编码）
function rarityBadgeClass(rarity: string): string {
  const r = rarity.toLowerCase();
  if (r.includes("secret")) return "bg-amber-500/10 border-amber-500/30 text-amber-300";
  if (r.includes("exclusive")) return "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300";
  if (r.includes("mythic")) return "bg-rose-500/10 border-rose-500/30 text-rose-300";
  if (r.includes("legendary")) return "bg-orange-500/10 border-orange-500/30 text-orange-300";
  if (r.includes("epic")) return "bg-violet-500/10 border-violet-500/30 text-violet-300";
  if (r.includes("rare")) return "bg-sky-500/10 border-sky-500/30 text-sky-300";
  return "bg-[hsl(var(--nav-theme)/0.1)] border-[hsl(var(--nav-theme)/0.3)]";
}

// Tier 徽章颜色（语义色编码等级）
function tierBadgeClass(tier: string): string {
  switch (tier) {
    case "S":
      return "bg-amber-500/15 border-amber-500/40 text-amber-300";
    case "A":
      return "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
    case "Specialist":
      return "bg-sky-500/15 border-sky-500/40 text-sky-300";
    case "Endgame":
      return "bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300";
    default:
      return "bg-[hsl(var(--nav-theme)/0.1)] border-[hsl(var(--nav-theme)/0.3)]";
  }
}

export default function HomePageClient({
  latestArticles,
  moduleLinkMap,
  locale,
}: HomePageClientProps) {
  const t = useMessages() as any;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.animeexpeditions.online";

  const [faqExpanded, setFaqExpanded] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const mobileBannerAd = getPreferredMobileBannerSelection();

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Anime Expeditions Wiki",
        description:
          "Complete Anime Expeditions Wiki covering codes, tier lists, units, traits, evolutions, raids, Time Chamber tips, and update guides for the Roblox anime tower defense game.",
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Anime Expeditions - Roblox Anime Tower Defense",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Anime Expeditions Wiki",
        alternateName: "Anime Expeditions",
        url: siteUrl,
        description:
          "Complete Anime Expeditions Wiki resource hub for codes, tier lists, units, traits, evolutions, raids, and Time Chamber guides",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Anime Expeditions Wiki - Roblox Anime Tower Defense",
        },
        sameAs: [
          "https://www.roblox.com/games/84515722934860/Anime-Expeditions",
          "https://discord.com/invite/animeexpeditions",
          "https://x.com/ExpeditionsRBLX",
          "https://www.youtube.com/@AnimeExpeditionsOfficial",
        ],
      },
      {
        "@type": "VideoGame",
        name: "Anime Expeditions",
        gamePlatform: ["Roblox"],
        applicationCategory: "Game",
        genre: ["Tower Defense", "Anime", "Strategy", "Co-op"],
        numberOfPlayers: {
          minValue: 1,
          maxValue: 4,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://www.roblox.com/games/84515722934860/Anime-Expeditions",
        },
      },
      {
        "@type": "VideoObject",
        name: "Anime Expeditions Official Trailer",
        description:
          "Official Anime Expeditions trailer showcasing the anime tower defense Roblox game — summoning, units, Expeditions, raids and boss battles.",
        uploadDate: "2026-07-08",
        thumbnailUrl: `${siteUrl}/images/hero.webp`,
        embedUrl: "https://www.youtube.com/embed/ysDUclBoJHk",
        url: "https://www.youtube.com/watch?v=ysDUclBoJHk",
      },
    ],
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      setCopiedCode(null);
    }
  };

  return (
    <div className="home-shell min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 广告位 1: 顶部固定横幅 */}
      <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-24 pb-14 md:pt-32 md:pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 text-center scroll-reveal">
            {/* Badge */}
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.1)] px-3 py-1.5 md:mb-6 md:px-4 md:py-2"
            >
              <Sparkles className="h-4 w-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs font-medium md:text-sm">
                {t.hero.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="mb-4 text-4xl font-bold leading-[1.05] sm:text-5xl md:mb-6 md:text-7xl">
              {t.hero.title}
            </h1>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:mb-10 md:max-w-3xl md:text-2xl">
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row md:mb-12 md:gap-4">
              <button
                onClick={() => scrollToSection("codes")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--nav-theme))] px-6 py-3.5 font-semibold text-base text-white transition-colors hover:bg-[hsl(var(--nav-theme)/0.9)] md:px-8 md:py-4 md:text-lg"
              >
                <Gift className="h-5 w-5" />
                {t.hero.getFreeCodesCTA}
              </button>
              <a
                href="https://www.roblox.com/games/84515722934860/Anime-Expeditions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3.5 font-semibold text-base transition-colors hover:bg-white/10 md:px-8 md:py-4 md:text-lg"
              >
                {t.hero.playOnRobloxCTA}
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* Video Section - 紧跟 Hero，官方预告片（IntersectionObserver 自动播放） */}
      <section className="px-4 py-10 md:py-12">
        <div className="container mx-auto max-w-5xl scroll-reveal">
          <div className="relative overflow-hidden rounded-2xl">
            <VideoFeature
              videoId="ysDUclBoJHk"
              title="Anime Expeditions Official Trailer"
            />
          </div>
        </div>
      </section>

      {/* Tools Grid - 8 Navigation Cards（前半屏：Hero → 视频 → 模块导航） */}
      <section className="bg-white/[0.02] px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-8 text-center scroll-reveal md:mb-12">
            <h2 className="mb-3 text-3xl font-bold md:mb-4 md:text-5xl">
              {t.tools.title}{" "}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-base text-muted-foreground md:text-lg">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {t.tools.cards.map((card: any, index: number) => {
              const sectionId = TOOLS_SECTION_IDS[index];
              return (
                <button
                  key={index}
                  onClick={() => scrollToSection(sectionId)}
                  className="group scroll-reveal cursor-pointer rounded-xl border border-border bg-card p-4 text-left transition-all duration-300 hover:border-[hsl(var(--nav-theme)/0.5)] hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)] md:p-6"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.1)] transition-colors group-hover:bg-[hsl(var(--nav-theme)/0.2)] md:mb-4 md:h-12 md:w-12"
                  >
                    <DynamicIcon
                      name={card.icon}
                      className="h-5 w-5 text-[hsl(var(--nav-theme-light))] md:h-6 md:w-6"
                    />
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold leading-snug md:text-base">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 广告位 2: 首屏内容之后 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ""} />

      {/* 广告位 3: 移动端方形 / 桌面端横幅 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Module 1: Codes */}
      <section id="codes" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Gift}
            eyebrow={t.modules.animeExpeditionsCodes.eyebrow}
            title={t.modules.animeExpeditionsCodes.title}
            subtitle={t.modules.animeExpeditionsCodes.subtitle}
            intro={t.modules.animeExpeditionsCodes.intro}
          />
          <div className="grid grid-cols-1 gap-4 scroll-reveal md:grid-cols-3">
            {t.modules.animeExpeditionsCodes.codes.map((c: any, index: number) => (
              <div
                key={index}
                className="flex flex-col rounded-xl border border-border bg-white/5 p-5 transition-colors hover:border-[hsl(var(--nav-theme)/0.5)] md:p-6"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                    {c.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.expires}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => copyCode(c.code)}
                  className="group mb-4 flex items-center justify-between gap-2 rounded-lg border border-dashed border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.08)] px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--nav-theme)/0.15)]"
                  aria-label={`Copy code ${c.code}`}
                >
                  <span className="font-mono text-lg font-bold tracking-wide text-[hsl(var(--nav-theme-light))]">
                    {c.code}
                  </span>
                  {copiedCode === c.code ? (
                    <Check className="h-5 w-5 text-emerald-300" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-[hsl(var(--nav-theme-light))]" />
                  )}
                </button>

                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rewards
                  </p>
                  <ul className="space-y-1">
                    {c.rewards.map((r: string, ri: number) => (
                      <li key={ri} className="flex items-start gap-2 text-sm">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Requires:</span>{" "}
                  {c.requirement}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 广告位 4: 第一模块之后 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-468x60"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60}
        className="hidden md:flex"
      />

      {/* Module 2: Beginner Guide */}
      <section
        id="beginner-guide"
        className="scroll-mt-24 bg-white/[0.02] px-4 py-14 md:py-20"
      >
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={BookOpen}
            eyebrow={t.modules.animeExpeditionsBeginnerGuide.eyebrow}
            title={t.modules.animeExpeditionsBeginnerGuide.title}
            subtitle={t.modules.animeExpeditionsBeginnerGuide.subtitle}
            intro={t.modules.animeExpeditionsBeginnerGuide.intro}
          />
          <div className="mb-8 space-y-3 scroll-reveal md:space-y-4 md:mb-10">
            {t.modules.animeExpeditionsBeginnerGuide.steps.map(
              (step: any, index: number) => (
                <div
                  key={index}
                  className="flex gap-3 rounded-xl border border-border bg-white/5 p-4 transition-colors hover:border-[hsl(var(--nav-theme)/0.5)] md:gap-4 md:p-6"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.2)] md:h-12 md:w-12">
                    <span className="text-base font-bold text-[hsl(var(--nav-theme-light))] md:text-xl">
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="mb-1.5 text-lg font-bold md:mb-2 md:text-xl">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground md:text-base">
                      {step.description}
                    </p>
                    {step.tip && (
                      <p className="mt-2 flex items-start gap-2 rounded-lg bg-[hsl(var(--nav-theme)/0.06)] px-3 py-2 text-sm text-muted-foreground">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                        <span>
                          <span className="font-semibold text-foreground">Tip:</span>{" "}
                          {step.tip}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Module 3: Unit Tier List */}
      <section id="unit-tier-list" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Crown}
            eyebrow={t.modules.animeExpeditionsTierList.eyebrow}
            title={t.modules.animeExpeditionsTierList.title}
            subtitle={t.modules.animeExpeditionsTierList.subtitle}
            intro={t.modules.animeExpeditionsTierList.intro}
          />
          <div className="space-y-4 scroll-reveal">
            {t.modules.animeExpeditionsTierList.tiers.map(
              (tier: any, ti: number) => (
                <div
                  key={ti}
                  className="overflow-hidden rounded-xl border border-border bg-white/5"
                >
                  <div className="flex flex-wrap items-center gap-3 border-b border-border bg-[hsl(var(--nav-theme)/0.05)] px-4 py-3 md:px-6">
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold ${tierBadgeClass(tier.tier)}`}
                    >
                      {tier.tier}
                    </span>
                    <h3 className="font-bold">{tier.label}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tier.units.map((u: any, ui: number) => (
                      <div
                        key={ui}
                        className="rounded-lg border border-border bg-white/5 p-4 transition-colors hover:border-[hsl(var(--nav-theme)/0.5)]"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-semibold leading-snug">{u.name}</h4>
                          {u.rarity && (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${rarityBadgeClass(u.rarity)}`}
                            >
                              {u.rarity}
                            </span>
                          )}
                        </div>
                        {u.role && (
                          <p className="mb-1.5 text-xs font-medium text-[hsl(var(--nav-theme-light))]">
                            {u.role}
                          </p>
                        )}
                        {u.reason && (
                          <p className="text-sm text-muted-foreground">{u.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Module 4: Units and Summon Guide */}
      <section
        id="units-and-summon"
        className="scroll-mt-24 bg-white/[0.02] px-4 py-14 md:py-20"
      >
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Users}
            eyebrow={t.modules.animeExpeditionsUnitsAndSummon.eyebrow}
            title={t.modules.animeExpeditionsUnitsAndSummon.title}
            subtitle={t.modules.animeExpeditionsUnitsAndSummon.subtitle}
            intro={t.modules.animeExpeditionsUnitsAndSummon.intro}
          />
          <div className="grid grid-cols-1 gap-4 scroll-reveal md:grid-cols-2 lg:grid-cols-3">
            {t.modules.animeExpeditionsUnitsAndSummon.groups.map(
              (g: any, index: number) => {
                if (g.type === "rarity-group") {
                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-border bg-white/5 p-5 transition-colors hover:border-[hsl(var(--nav-theme)/0.5)]"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${rarityBadgeClass(g.name)}`}
                        >
                          {g.name}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {g.units.map((u: any, ui: number) => (
                          <li key={ui} className="text-sm">
                            <span className="font-medium">{u.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {u.role}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                // banner / system 卡片
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.06)] p-5 transition-colors hover:border-[hsl(var(--nav-theme)/0.5)]"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {g.type === "system" ? (
                        <Shuffle className="h-4 w-4 text-[hsl(var(--nav-theme-light))]" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-[hsl(var(--nav-theme-light))]" />
                      )}
                      <h3 className="font-bold">{g.name}</h3>
                    </div>
                    <p className="mb-2 text-xs font-medium text-[hsl(var(--nav-theme-light))]">
                      {g.meta}
                    </p>
                    <p className="text-sm text-muted-foreground">{g.detail}</p>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* Module 5: Traits and Rerolls */}
      <section
        id="traits-and-rerolls"
        className="scroll-mt-24 px-4 py-14 md:py-20"
      >
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Shuffle}
            eyebrow={t.modules.animeExpeditionsTraits.eyebrow}
            title={t.modules.animeExpeditionsTraits.title}
            subtitle={t.modules.animeExpeditionsTraits.subtitle}
            intro={t.modules.animeExpeditionsTraits.intro}
          />
          {/* 桌面端表格 */}
          <div className="hidden scroll-reveal overflow-hidden rounded-xl border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[hsl(var(--nav-theme)/0.08)] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Trait</th>
                  <th className="px-4 py-3 font-semibold">Roll Rate</th>
                  <th className="px-4 py-3 font-semibold">Bonuses</th>
                  <th className="px-4 py-3 font-semibold">Best For</th>
                  <th className="px-4 py-3 font-semibold">Reroll Advice</th>
                </tr>
              </thead>
              <tbody>
                {t.modules.animeExpeditionsTraits.traits.map(
                  (tr: any, index: number) => (
                    <tr
                      key={index}
                      className="border-t border-border align-top"
                    >
                      <td className="px-4 py-3 font-bold text-[hsl(var(--nav-theme-light))]">
                        {tr.trait}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {tr.rollRate}
                      </td>
                      <td className="px-4 py-3">{tr.bonuses}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {tr.bestFor}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {tr.advice}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          {/* 移动端卡片堆叠 */}
          <div className="space-y-3 scroll-reveal md:hidden">
            {t.modules.animeExpeditionsTraits.traits.map((tr: any, index: number) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-white/5 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-bold text-[hsl(var(--nav-theme-light))]">
                    {tr.trait}
                  </h3>
                  <span className="rounded-full border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.1)] px-2 py-0.5 text-xs">
                    {tr.rollRate}
                  </span>
                </div>
                <p className="mb-2 text-sm">{tr.bonuses}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Best for:</span>{" "}
                  {tr.bestFor}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Advice:</span>{" "}
                  {tr.advice}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 6: Evolution Guide */}
      <section
        id="evolution-guide"
        className="scroll-mt-24 bg-white/[0.02] px-4 py-14 md:py-20"
      >
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Zap}
            eyebrow={t.modules.animeExpeditionsEvolution.eyebrow}
            title={t.modules.animeExpeditionsEvolution.title}
            subtitle={t.modules.animeExpeditionsEvolution.subtitle}
            intro={t.modules.animeExpeditionsEvolution.intro}
          />
          <div className="space-y-4 scroll-reveal">
            {t.modules.animeExpeditionsEvolution.stages.map(
              (s: any, index: number) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-white/5 p-5 transition-colors hover:border-[hsl(var(--nav-theme)/0.5)] sm:flex-row sm:gap-5 md:p-6"
                >
                  <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:justify-center">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.2)]">
                      <span className="text-xl font-bold text-[hsl(var(--nav-theme-light))]">
                        {s.stage}
                      </span>
                    </div>
                    <Zap className="hidden h-5 w-5 text-[hsl(var(--nav-theme-light))] sm:block" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{s.unit}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.1)] px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--nav-theme-light))]">
                        <ArrowRight className="h-3 w-3" />
                        {s.evolvedForm}
                      </span>
                    </div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      {s.role}
                    </p>
                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-[hsl(var(--nav-theme)/0.06)] px-3 py-2">
                        <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Requirements
                        </p>
                        <p className="text-muted-foreground">{s.requirements}</p>
                      </div>
                      <div className="rounded-lg bg-[hsl(var(--nav-theme)/0.06)] px-3 py-2">
                        <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Result
                        </p>
                        <p className="text-muted-foreground">{s.result}</p>
                      </div>
                    </div>
                    <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                      <span>{s.priority}</span>
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Module 7: Story, Expeditions and Raids */}
      <section
        id="story-expeditions-and-raids"
        className="scroll-mt-24 px-4 py-14 md:py-20"
      >
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Swords}
            eyebrow={t.modules.animeExpeditionsStoryRaids.eyebrow}
            title={t.modules.animeExpeditionsStoryRaids.title}
            subtitle={t.modules.animeExpeditionsStoryRaids.subtitle}
            intro={t.modules.animeExpeditionsStoryRaids.intro}
          />
          <div className="space-y-3 scroll-reveal">
            {t.modules.animeExpeditionsStoryRaids.modes.map(
              (mode: any, index: number) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-border bg-white/5"
                >
                  <button
                    onClick={() =>
                      setFaqExpanded(faqExpanded === index ? null : index)
                    }
                    className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="flex items-center gap-3">
                      <Swords className="h-5 w-5 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                      <span className="font-semibold">{mode.mode}</span>
                      <span className="hidden rounded-full border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.1)] px-2.5 py-0.5 text-xs text-muted-foreground sm:inline">
                        {mode.unlock}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 transition-transform ${faqExpanded === index ? "rotate-180" : ""}`}
                    />
                  </button>
                  {faqExpanded === index && (
                    <div className="space-y-3 border-t border-border px-5 py-4 text-sm">
                      <p className="text-xs text-muted-foreground sm:hidden">
                        <span className="font-medium text-foreground">Unlock:</span>{" "}
                        {mode.unlock}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Objective:</span>{" "}
                        <span className="text-muted-foreground">{mode.objective}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Rewards:</span>{" "}
                        <span className="text-muted-foreground">{mode.rewards}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Team Plan:</span>{" "}
                        <span className="text-muted-foreground">{mode.teamPlan}</span>
                      </p>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Module 8: Gems, Yen and Time Chamber Farming */}
      <section
        id="gems-yen-time-chamber-farming"
        className="scroll-mt-24 bg-white/[0.02] px-4 py-14 md:py-20"
      >
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Coins}
            eyebrow={t.modules.animeExpeditionsFarming.eyebrow}
            title={t.modules.animeExpeditionsFarming.title}
            subtitle={t.modules.animeExpeditionsFarming.subtitle}
            intro={t.modules.animeExpeditionsFarming.intro}
          />
          <div className="space-y-4 scroll-reveal">
            {t.modules.animeExpeditionsFarming.resources.map(
              (r: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-white/5 p-5 transition-colors hover:border-[hsl(var(--nav-theme)/0.5)] md:p-6"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.1)]">
                      <Coins className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
                    </div>
                    <div>
                      <h3 className="font-bold leading-tight">{r.resource}</h3>
                      <p className="text-xs text-muted-foreground">{r.usedFor}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Best Sources
                      </p>
                      <p className="text-muted-foreground">{r.bestSources}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Active Farm
                      </p>
                      <p className="text-muted-foreground">{r.activeFarm}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Spending Rule
                      </p>
                      <p className="text-muted-foreground">{r.spendingRule}</p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* 广告位 6: 移动端横幅 320×50 */}
      {mobileBannerAd && (
        <AdBanner
          type={mobileBannerAd.type}
          adKey={mobileBannerAd.adKey}
          className="md:hidden"
        />
      )}

      {/* Latest Updates Section（保留模板模块；位于 Tools Grid 之后） */}
      <LatestGuidesAccordion
        articles={latestArticles}
        locale={locale}
        max={12}
      />

      {/* FAQ Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQSection
          title={t.faq.title}
          titleHighlight={t.faq.titleHighlight}
          subtitle={t.faq.subtitle}
          questions={t.faq.questions}
        />
      </Suspense>

      {/* CTA Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner 3 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Footer */}
      <footer className="border-t border-border bg-white/[0.02]">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div>
              <h3 className="mb-4 text-xl font-bold text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.footer.description}
              </p>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="mb-4 font-semibold">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://discord.com/invite/animeexpeditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.discord}
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/ExpeditionsRBLX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.twitter}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/@AnimeExpeditionsOfficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.youtube}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.roblox.com/games/84515722934860/Anime-Expeditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.roblox}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - Internal Routes Only */}
            <div>
              <h4 className="mb-4 font-semibold">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/copyright"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.copyrightNotice}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                {t.footer.copyright}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
