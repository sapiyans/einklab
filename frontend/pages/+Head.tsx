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
    </>
  );
}
