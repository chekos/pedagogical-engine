import { NavBar } from "@/components/ui/nav-bar";
import { Footer } from "@/components/ui/footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full page-transition">
        {children}
      </main>
      <Footer />
    </div>
  );
}
