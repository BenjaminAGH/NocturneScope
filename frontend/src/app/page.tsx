import { Hero } from "@/components/landing/Hero";
import { Downloads } from "@/components/landing/Downloads";
import { Features } from "@/components/landing/Features";
import { VideoSection } from "@/components/landing/VideoSection";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <VideoSection />
      <Downloads />
    </>
  );
}
