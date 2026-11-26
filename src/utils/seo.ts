export function updatePageSeo(params: {
  title: string;
  description: string;
  ogImage?: string;
  canonicalPath?: string;
}) {
  if (typeof document === 'undefined') return;
  document.title = params.title;

  const setMeta = (selector: string, attrName: string, attrVal: string, content: string) => {
    let el = document.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('meta[name="description"]', 'name', 'description', params.description);
  setMeta('meta[property="og:title"]', 'property', 'og:title', params.title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', params.description);
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', params.title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', params.description);

  if (params.ogImage) {
    setMeta('meta[property="og:image"]', 'property', 'og:image', params.ogImage);
  }

  const canonicalUrl =
    window.location.origin + (params.canonicalPath || window.location.pathname);
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);
}
