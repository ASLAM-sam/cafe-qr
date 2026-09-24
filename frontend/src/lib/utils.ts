import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Generate an optimized Cloudinary delivery URL with format auto-detection,
 * quality compression, and optional resizing.
 *
 * Transforms a raw Cloudinary URL like:
 *   https://res.cloudinary.com/<cloud>/image/upload/<public_id>
 * Into:
 *   https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto:good,w_300,h_300,c_fill/<public_id>
 *
 * Returns the original URL unchanged if it's not a Cloudinary URL.
 */
export function cloudinaryUrl(
  url: string,
  width?: number,
  height?: number,
  quality?: number
): string {
  if (!url) return url;

  // Only transform Cloudinary URLs
  if (!url.includes("res.cloudinary.com")) return url;

  const uploadMarker = "/upload/";
  const uploadIdx = url.indexOf(uploadMarker);
  if (uploadIdx === -1) return url;

  const beforeUpload = url.substring(0, uploadIdx + uploadMarker.length);
  const afterUpload = url.substring(uploadIdx + uploadMarker.length);

  // Strip existing transformation segments (anything before the last /)
  // e.g., if URL is .../upload/v1234567/folder/file.jpg, preserve v1234567/folder/file.jpg
  const transforms: string[] = ["f_auto", `q_auto${quality ? `:${quality > 60 ? 'good' : 'eco'}` : ':good'}`];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push("c_fill");

  return `${beforeUpload}${transforms.join(",")}/${afterUpload}`;
}
