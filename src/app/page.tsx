import { PaperExplorer } from "@/components/paper-explorer";
import { SessionGate } from "@/components/session-gate";
import { SiteHeader } from "@/components/site-header";
import { CtaSection, NewsSection, SiteFooter } from "@/components/static-sections";

export default function HomePage() {
  return (
    <SessionGate>
      <SiteHeader />
      <main><PaperExplorer /><NewsSection /><CtaSection /></main>
      <SiteFooter />
    </SessionGate>
  );
}
