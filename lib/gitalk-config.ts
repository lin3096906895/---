"use client";

export type GitalkConfig = {
  clientID: string;
  clientSecret: string;
  repo: string;
  owner: string;
  admin: string[];
};

let configPromise: Promise<GitalkConfig> | null = null;

export function loadGitalkConfig(): Promise<GitalkConfig> {
  if (!configPromise) {
    configPromise = fetch("/api/gitalk-config", { cache: "no-store" }).then(
      async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Gitalk configuration is unavailable");
        }

        if (!data.clientID || !data.clientSecret || !data.repo || !data.owner) {
          throw new Error("Gitalk configuration is incomplete");
        }

        return {
          clientID: data.clientID,
          clientSecret: data.clientSecret,
          repo: data.repo,
          owner: data.owner,
          admin: Array.isArray(data.admin) ? data.admin : [],
        };
      },
    );
  }

  return configPromise;
}
