import type { Announcement, Hub, JycEvent } from "@/data/devData";
import type { CouncilMember } from "@/data/council";

const API_URL = (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type StudentProfile = {
  id: string;
  fullName: string;
  email: string;
  rollNumber: string;
  department: string;
  role: "STUDENT" | "COORDINATOR" | "ADMIN";
  emailVerifiedAt: string;
};
export type GalleryImage = {
  id: string;
  hubId: string | null;
  url: string;
  alt: string;
  caption?: string | null;
  category?: string | null;
  createdAt: string;
};
export type FacultyCoordinator = {
  id: string;
  name: string;
  designation: string;
  photoUrl: string | null;
  updatedAt: string;
};
export type AdminEvent = JycEvent & { published: boolean };
export type AdminAnnouncement = {
  id: string;
  title: string;
  body: string | null;
  date: string;
  published: boolean;
};
export type AdminOverview = {
  students: number;
  events: number;
  hubs: number;
  announcements: number;
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(typeof init?.body === "string" ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      "Can't reach JYC Connect. Check your connection and try again.",
      0,
      "NETWORK_ERROR",
    );
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      body?.message ?? "Request failed. Please try again.",
      response.status,
      body?.code,
    );
  return body as T;
}

export const api = {
  getHubs: (): Promise<Hub[]> => http("/api/hubs"),
  getHub: (id: string): Promise<Hub> => http(`/api/hubs/${encodeURIComponent(id)}`),
  getEvents: (status?: "upcoming" | "past"): Promise<JycEvent[]> =>
    http(`/api/events${status ? `?status=${status}` : ""}`),
  getEvent: (id: string): Promise<JycEvent> => http(`/api/events/${encodeURIComponent(id)}`),
  getCouncil: (): Promise<CouncilMember[]> => http("/api/council"),
  getFacultyCoordinator: (): Promise<FacultyCoordinator> => http("/api/faculty-coordinator"),
  getAnnouncements: (): Promise<Announcement[]> => http("/api/announcements"),
  getGallery: (hubId?: string): Promise<GalleryImage[]> =>
    http(`/api/gallery${hubId ? `?hubId=${encodeURIComponent(hubId)}` : ""}`),
  getAdminOverview: (): Promise<AdminOverview> => http("/api/admin/overview"),
  getAdminEvents: (): Promise<AdminEvent[]> => http("/api/admin/events"),
  getAdminAnnouncements: (): Promise<AdminAnnouncement[]> => http("/api/admin/announcements"),
  getAdminGallery: (): Promise<GalleryImage[]> => http("/api/admin/gallery"),
  createHub: (body: Omit<Hub, "imageUrl"> & { imageUrl?: string | null }): Promise<Hub> =>
    http("/api/admin/hubs", { method: "POST", body: JSON.stringify(body) }),
  updateHub: (id: string, body: Partial<Omit<Hub, "id">>): Promise<Hub> =>
    http(`/api/admin/hubs/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteHub: (id: string): Promise<{ success: true }> =>
    http(`/api/admin/hubs/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createEvent: (
    body: Omit<JycEvent, "id" | "status" | "imageUrl"> & {
      published: boolean;
      imageUrl?: string | null;
    },
  ): Promise<AdminEvent> =>
    http("/api/admin/events", { method: "POST", body: JSON.stringify(body) }),
  updateEvent: (
    id: string,
    body: Partial<Omit<JycEvent, "id" | "status"> & { published: boolean }>,
  ): Promise<AdminEvent> =>
    http(`/api/admin/events/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteEvent: (id: string): Promise<{ success: true }> =>
    http(`/api/admin/events/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createAnnouncement: (body: {
    title: string;
    body: string;
    date: string;
    published: boolean;
  }): Promise<AdminAnnouncement> =>
    http("/api/admin/announcements", { method: "POST", body: JSON.stringify(body) }),
  updateAnnouncement: (
    id: string,
    body: Partial<Pick<AdminAnnouncement, "title" | "body" | "date" | "published">>,
  ): Promise<AdminAnnouncement> =>
    http(`/api/admin/announcements/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAnnouncement: (id: string): Promise<{ success: true }> =>
    http(`/api/admin/announcements/${encodeURIComponent(id)}`, { method: "DELETE" }),
  deleteGalleryImage: (id: string): Promise<{ success: true }> =>
    http(`/api/admin/gallery/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getSiteAsset: (slot: string): Promise<{ url: string; alt?: string | null }> =>
    http(`/api/assets/${encodeURIComponent(slot)}`),
  deleteSiteAsset: (slot: string): Promise<{ success: true }> =>
    http(`/api/admin/assets/${encodeURIComponent(slot)}`, { method: "DELETE" }),
  getProfile: async (): Promise<StudentProfile> =>
    (await http<{ user: StudentProfile }>("/api/auth/me")).user,
  getDashboard: (): Promise<{
    user: StudentProfile;
    announcements: Announcement[];
  }> => http("/api/dashboard"),
  login: (body: { identifier: string; password: string }): Promise<{ user: StudentProfile }> =>
    http("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  requestOtp: (body: {
    fullName: string;
    email: string;
    rollNumber: string;
    department: string;
  }): Promise<{ expiresIn: number; resendAfter: number }> =>
    http("/api/auth/register/request-otp", { method: "POST", body: JSON.stringify(body) }),
  verifyOtp: (body: { email: string; otp: string }): Promise<{ verificationToken: string }> =>
    http("/api/auth/register/verify-otp", { method: "POST", body: JSON.stringify(body) }),
  completeRegistration: (body: {
    verificationToken: string;
    fullName: string;
    email: string;
    rollNumber: string;
    department: string;
    password: string;
  }): Promise<{ user: StudentProfile }> =>
    http("/api/auth/register/complete", { method: "POST", body: JSON.stringify(body) }),
  sendContact: (body: {
    name: string;
    email: string;
    message: string;
  }): Promise<{ success: true }> =>
    http("/api/contact", { method: "POST", body: JSON.stringify(body) }),
  uploadGalleryImage: (
    file: File,
    alt: string,
    caption?: string,
    category?: string,
    hubId?: string,
  ): Promise<GalleryImage> => {
    const params = new URLSearchParams({ alt });
    if (caption) params.set("caption", caption);
    if (category) params.set("category", category);
    if (hubId) params.set("hubId", hubId);
    return http(`/api/admin/images?${params}`, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
  },
  uploadMedia: (kind: "hub" | "event" | "council", id: string, file: File, alt?: string) =>
    http(
      `/api/admin/media/${kind}/${encodeURIComponent(id)}${alt ? `?alt=${encodeURIComponent(alt)}` : ""}`,
      { method: "POST", headers: { "Content-Type": file.type }, body: file },
    ),
  deleteCouncilMemberPhoto: (enrollment: string): Promise<{ success: true }> =>
    http(`/api/admin/media/council/${encodeURIComponent(enrollment)}`, { method: "DELETE" }),
  uploadSiteAsset: (
    slot: "hero" | "login" | "register" | "about" | "campus",
    file: File,
    alt?: string,
  ) =>
    http(`/api/admin/assets/${slot}${alt ? `?alt=${encodeURIComponent(alt)}` : ""}`, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    }),
  updateFacultyCoordinator: (
    body: Pick<FacultyCoordinator, "name" | "designation">,
  ): Promise<FacultyCoordinator> =>
    http("/api/admin/faculty-coordinator", { method: "PATCH", body: JSON.stringify(body) }),
  uploadFacultyCoordinatorPhoto: (file: File): Promise<FacultyCoordinator> =>
    http("/api/admin/faculty-coordinator/photo", {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    }),
  logout: (): Promise<{ success: true }> => http("/api/auth/logout", { method: "POST" }),
};
