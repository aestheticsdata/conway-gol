import type { AppPath } from "@navigation/NavigationAdapter";

export function normalizeBasePath(baseUrl: string): string {
  if (!baseUrl || baseUrl === "/") {
    return "";
  }

  const normalized = baseUrl.replace(/\/+$/, "");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function normalizeAppPath(path: string): AppPath {
  if (!path || path === "/") {
    return "/";
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  const trimmed = normalized.replace(/\/+$/, "");
  return (trimmed || "/") as AppPath;
}

export function stripBasePath(pathname: string, basePath: string): AppPath {
  const normalizedPathname = normalizeAppPath(pathname);

  if (!basePath) {
    return normalizedPathname;
  }

  if (normalizedPathname === basePath) {
    return "/";
  }

  if (normalizedPathname.startsWith(`${basePath}/`)) {
    return normalizeAppPath(normalizedPathname.slice(basePath.length));
  }

  return normalizedPathname;
}

export function toDocumentPath(appPath: AppPath, basePath: string): string {
  const normalizedPath = normalizeAppPath(appPath);
  if (!basePath) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return `${basePath}/`;
  }

  return `${basePath}${normalizedPath}`;
}
