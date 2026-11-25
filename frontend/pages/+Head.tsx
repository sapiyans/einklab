import logoUrl from "@/../public/images/sapiensin.svg";

export function Head() {
  return (
    <>
      <link rel="icon" href={logoUrl} />
      <link rel="apple-touch-icon" href={logoUrl} />

      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#000000" />

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var t = localStorage.getItem("einklab-theme");
                var root = document.documentElement;
                root.classList.remove("light", "dark", "sapo");
                if (t === "light") {
                  root.style.colorScheme = "light";
                } else if (t === "dark") {
                  root.classList.add("dark");
                  root.style.colorScheme = "dark";
                } else {
                  root.classList.add("sapo");
                  root.style.colorScheme = "dark";
                }
              } catch (e) {}
            })();
          `,
        }}
      />
    </>
  );
}
