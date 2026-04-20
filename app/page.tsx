import { Navbar } from "@/features/core/components/Navbar";
import { Footer } from "@/features/core/components/Footer";
import { MobileNav } from "@/features/core/components/MobileNav";
import { GallerySection } from "@/features/gallery/components/GallerySection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen">
        <GallerySection />
        <Footer />
      </main>
      <MobileNav />
    </>
  );
}
