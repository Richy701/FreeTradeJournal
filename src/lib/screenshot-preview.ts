/** Local-only presentation mode. Authentication and demo save guards stay intact. */
export function isScreenshotPreview(isDemo: boolean): boolean {
  return import.meta.env.DEV && isDemo &&
    sessionStorage.getItem('ftj-screenshot-preview') === 'alex-morgan'
}
