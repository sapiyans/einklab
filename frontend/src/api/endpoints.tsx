const endpoints = {
  // Screensavers XTEINK
  xteinkScreensavers: "screensaver/list",
  xteinkScreensaver: () => "/screensaver/",
  xteinkScreensaverView: (id: string) => `/screensaver/${id}/count/views`,
  xteinkScreensaverDownload: (id: string) => `/screensaver/${id}/count/downloads`,
};

export default endpoints;
