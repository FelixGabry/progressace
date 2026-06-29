import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string | null;
  onClick?: () => void;
};

const sizes = {
  sm: { height: 28, width: 140 },
  md: { height: 36, width: 180 },
  lg: { height: 44, width: 220 },
};

export function Logo({ className, size = "md", href = "/", onClick }: LogoProps) {
  const { height, width } = sizes[size];

  const image = (
    <Image
      src="/logo.png"
      alt="Progress Ace"
      width={width}
      height={height}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ maxHeight: height }}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center" onClick={onClick}>
        {image}
      </Link>
    );
  }

  return image;
}
