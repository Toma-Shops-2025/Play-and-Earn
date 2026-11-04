export type PortalId = "y8" | "crazy";

export type PortalConfig = {
  id: PortalId;
  title: string;
  subtitle: string;
  url: string;
  gradient: string;
  emoji: string;
};

export const PORTALS: PortalConfig[] = [
  {
    id: "y8",
    title: "Y8 Games",
    subtitle: "Classic arcade hits",
    url: "https://www.y8.com",
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    emoji: "🕹️",
  },
  {
    id: "crazy",
    title: "Crazy Games",
    subtitle: "Action & strategy",
    url: "https://www.crazygames.com",
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
    emoji: "⚡",
  },
];

export function getPortal(id: string): PortalConfig | undefined {
  return PORTALS.find((portal) => portal.id === id);
}
