// src/app/(site)/page.tsx
import type { Metadata } from "next";
import { generatePageMetadata } from "@/core/lib/seo/generate-metadata";
import HomePage from '@/client/home/HomePage'


export const metadata: Metadata = generatePageMetadata({
  pathname: "/",
});

export default function Page() {
  return <HomePage />
}