export type MemberRole = "member" | "admin" | "owner";

export const ROLE_RANK: Record<MemberRole, number> = { member: 0, admin: 1, owner: 2 };

export const ROLE_LABEL: Record<MemberRole, string> = {
  owner: "Responsável",
  admin: "Administrador(a)",
  member: "Voluntário(a)",
};

export interface ExtraQuestion {
  id: string;
  label: string;
  required: boolean;
}

export interface Organization {
  id: string;
  type: "ong" | "individual";
  name: string;
  slug: string;
  logoPath: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  city: string | null;
  state: string | null;
  contactEmail: string | null;
  whatsapp: string | null;
  instagram: string | null;
  maxPhotosPerAnimal: number;
  adoptionExtraQuestions: ExtraQuestion[];
  showOnHome: boolean;
  archivedAt: string | null;
}

export interface OrgMember {
  userId: string;
  email: string;
  role: MemberRole;
  createdAt: string;
}

export interface OrgInvite {
  id: string;
  email: string;
  role: MemberRole;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface Membership {
  organizationId: string;
  role: MemberRole;
  name: string;
  slug: string;
}

export interface HomeOrg {
  slug: string;
  name: string;
  logoUrl: string | null;
  city: string | null;
  availableAnimals: number;
}
