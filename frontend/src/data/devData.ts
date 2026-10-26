/**
 * DEVELOPMENT DATA — placeholder content for previewing the UI only.
 * Not official JYC information. Replaced by backend responses via src/services/api.ts.
 */
export type Hub = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string; // lucide icon key, see components/HubIcon.tsx
  councilGroup: string; // matches council.ts group name
  imageUrl?: string | null;
  registrationFormUrl?: string | null;
};

export type JycEvent = {
  id: string;
  title: string;
  hubId: string;
  hub?: { id: string; name: string };
  category: string;
  date: string; // ISO date
  startTime: string;
  endTime: string;
  venue: string;
  status: "upcoming" | "past";
  summary: string;
  description: string;
  highlights: string[];
  imageUrl?: string | null;
  registrationFormUrl?: string | null;
};

export type Announcement = { id: string; title: string; body?: string | null; date: string };

export const DEV_HUBS: Hub[] = [
  {
    id: "cultural",
    name: "Cultural Hub",
    tagline: "Dance, drama, music & stage",
    description: "Celebrate traditions, festivals, dance, music and stagecraft together.",
    icon: "drama",
    councilGroup: "Cultural Hub",
  },
  {
    id: "visual-art",
    name: "Visual Art Hub",
    tagline: "Make ideas visible",
    description: "Sketching, painting, design and visual storytelling.",
    icon: "palette",
    councilGroup: "Visual Art Hub",
  },
  {
    id: "ai-coding",
    name: "AI & Coding Hub",
    tagline: "Build, explore, solve",
    description: "Build with code, explore AI and solve real problems together.",
    icon: "code",
    councilGroup: "AI & Coding Hub",
  },
  {
    id: "literary",
    name: "Literary Hub",
    tagline: "Read, write, debate",
    description: "Debate, extempore, MUN, TEDx and creative writing.",
    icon: "book",
    councilGroup: "Literary Hub",
  },
  {
    id: "sports",
    name: "Sports Hub",
    tagline: "Play, compete, grow",
    description: "Stay active, play as a team and push your limits.",
    icon: "trophy",
    councilGroup: "Sports Hub",
  },
  {
    id: "business",
    name: "Business Hub",
    tagline: "Ideas into ventures",
    description: "Turn ideas into ventures and learn how businesses work.",
    icon: "briefcase",
    councilGroup: "Business Hub",
  },
  {
    id: "tinkering",
    name: "Tinkering Hub",
    tagline: "Prototype & experiment",
    description: "Prototype, experiment and build hands-on projects.",
    icon: "wrench",
    councilGroup: "Tinkering Hub",
  },
  {
    id: "media",
    name: "Media Hub",
    tagline: "Stories through lenses",
    description: "Photography, video and content creation for campus life.",
    icon: "camera",
    councilGroup: "Media Hub",
  },
  {
    id: "social-work",
    name: "Social Work Hub",
    tagline: "Create positive change",
    description: "Community service and outreach that makes a difference.",
    icon: "heart",
    councilGroup: "Social Work Hub",
  },
  {
    id: "alumni",
    name: "Alumni Hub",
    tagline: "Stay connected",
    description: "Connect students and alumni for guidance and networking.",
    icon: "globe",
    councilGroup: "Alumni Hub",
  },
];

export const DEV_EVENTS: JycEvent[] = [
  {
    id: "sample-tech-event",
    title: "Sample Tech Event",
    hubId: "ai-coding",
    category: "Technology",
    date: "2026-11-14",
    startTime: "10:00 AM",
    endTime: "4:00 PM",
    venue: "Venue TBA",
    status: "upcoming",
    summary: "Placeholder event for previewing the layout.",
    description:
      "This is sample text used to preview the event detail layout. Real event descriptions will come from JYC.",
    highlights: ["Sample highlight one", "Sample highlight two", "Sample highlight three"],
  },
  {
    id: "sample-sports-event",
    title: "Sample Sports Meet",
    hubId: "sports",
    category: "Sports",
    date: "2026-11-21",
    startTime: "8:00 AM",
    endTime: "5:00 PM",
    venue: "Venue TBA",
    status: "upcoming",
    summary: "Placeholder event for previewing the layout.",
    description: "Sample description for layout preview only.",
    highlights: ["Sample highlight one", "Sample highlight two"],
  },
  {
    id: "sample-cultural-event",
    title: "Sample Cultural Evening",
    hubId: "cultural",
    category: "Cultural",
    date: "2026-12-02",
    startTime: "5:00 PM",
    endTime: "9:00 PM",
    venue: "Venue TBA",
    status: "upcoming",
    summary: "Placeholder event for previewing the layout.",
    description: "Sample description for layout preview only.",
    highlights: ["Sample highlight one", "Sample highlight two"],
  },
  {
    id: "sample-literary-event",
    title: "Sample Debate",
    hubId: "literary",
    category: "Literary",
    date: "2026-09-10",
    startTime: "11:00 AM",
    endTime: "2:00 PM",
    venue: "Venue TBA",
    status: "past",
    summary: "Placeholder past event.",
    description: "Sample description for layout preview only.",
    highlights: ["Sample highlight"],
  },
  {
    id: "sample-art-event",
    title: "Sample Art Showcase",
    hubId: "visual-art",
    category: "Art",
    date: "2026-08-28",
    startTime: "10:00 AM",
    endTime: "3:00 PM",
    venue: "Venue TBA",
    status: "past",
    summary: "Placeholder past event.",
    description: "Sample description for layout preview only.",
    highlights: ["Sample highlight"],
  },
];

export const DEV_ANNOUNCEMENTS: Announcement[] = [
  { id: "a1", title: "Sample announcement — real notices will come from JYC", date: "2026-10-18" },
  { id: "a2", title: "Sample announcement two", date: "2026-10-12" },
];
