import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "signature" | "capsule" | "editorial" | "travel" | "mono";
type Tone = "light" | "dark";
type Size = "sm" | "md" | "lg";

type BrandLogoProps = {
  href?: string;
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  className?: string;
  showTagline?: boolean;
};

const sizeMap: Record<Size, { mark: string; title: string; caption: string }> = {
  sm: {
    mark: "h-8 w-8",
    title: "text-lg",
    caption: "text-[10px]",
  },
  md: {
    mark: "h-10 w-10",
    title: "text-xl",
    caption: "text-[11px]",
  },
  lg: {
    mark: "h-12 w-12",
    title: "text-2xl",
    caption: "text-xs",
  },
};

const variantStyles: Record<Variant, { wrapper: string; title: string; caption: string }> = {
  signature: {
    wrapper: "gap-3",
    title: "font-black tracking-[-0.05em]",
    caption: "font-medium tracking-[0.12em] uppercase",
  },
  capsule: {
    wrapper: "gap-3 rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-md",
    title: "font-extrabold tracking-[-0.04em]",
    caption: "font-semibold tracking-[0.14em] uppercase",
  },
  editorial: {
    wrapper: "gap-4",
    title: "font-semibold tracking-[0.18em] uppercase",
    caption: "font-medium tracking-[0.2em] uppercase",
  },
  travel: {
    wrapper: "gap-3",
    title: "font-black tracking-[-0.04em]",
    caption: "font-semibold tracking-[0.08em]",
  },
  mono: {
    wrapper: "gap-3 rounded-2xl border border-black/10 bg-black/[0.03] px-3 py-2",
    title: "font-black tracking-[-0.05em]",
    caption: "font-semibold tracking-[0.16em] uppercase",
  },
};

const taglineByVariant: Record<Variant, string> = {
  signature: "Guide-led travel picks",
  capsule: "Region and theme picks",
  editorial: "Local guides and tours",
  travel: "Guides, routes, and travel themes",
  mono: "Guide and trip matching",
};

export function BrandLogo({
  href,
  variant = "signature",
  tone = "dark",
  size = "md",
  className,
  showTagline = true,
}: BrandLogoProps) {
  const content = (
    <div className={cn("inline-flex items-center", variantStyles[variant].wrapper, className)}>
      <div className={cn("relative shrink-0 overflow-hidden", sizeMap[size].mark)}>
        <Image src="/logo.png" alt="GuideMatch" fill priority sizes="48px" className="object-contain" />
      </div>
      <div className="flex min-w-0 flex-col">
        <p
          className={cn(
            sizeMap[size].title,
            variantStyles[variant].title,
            tone === "light" ? "text-white" : "text-slate-950",
          )}
        >
          <span>Guide</span>
          <span className={tone === "light" ? "text-blue-400" : "text-blue-600"}>Match</span>
        </p>
        {showTagline ? (
          <p
            className={cn(
              sizeMap[size].caption,
              variantStyles[variant].caption,
              tone === "light" ? "text-white/70" : "text-slate-500",
            )}
          >
            {taglineByVariant[variant]}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}
