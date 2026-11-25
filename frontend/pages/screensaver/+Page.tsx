import { useEffect } from "react";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-react/usePageContext";
import { ScreensaverGallery } from "./components/ScreensaverGallery";
import { editorStore } from "./store";
import { links } from "../../src/config/links";

export default function ScreensaverPage() {
  const pageContext = usePageContext();
  const tag = pageContext.urlParsed.search.tag;

  useEffect(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/screensaver-xteink\/([^/]+)\/?$/);

    if (match) {
      const segment = match[1];
      if (segment !== "editor") {
        navigate(links.xteink_screensavers+segment);
      } else {
        navigate(links.xteink_screensaver_editor);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 [overflow-anchor:none]!">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Editor XTEINK</h1>
          <p className="text-muted-foreground">
            Corte, ajuste e exporte BMP ou PNG para XTEINK X3, X4, Classic ou X4 Pro.
          </p>
        </header>

        <ScreensaverGallery
          onOpenScreensaver={(item) => navigate(links.xteink_screensaver_screensaver_post+item.id)}
          onUpload={async (file) => {
            const reader = new FileReader();
            await new Promise<void>((resolve, reject) => {
              reader.onload = () => {
                editorStore.loadImage(reader.result as string, { source: { kind: "new" } });
                resolve();
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            });
            navigate(links.xteink_screensaver_editor);
          }}
          initialFilters={tag ? { tags: tag } : undefined}
          onClearFilters={() => navigate(links.xteink_screensavers)}
        />
      </div>
    </div>
  );
}