export type ApplicationStatus = "new" | "in_review" | "approved" | "rejected" | "withdrawn";

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "Nova",
  in_review: "Em análise",
  approved: "Aprovada",
  rejected: "Recusada",
  withdrawn: "Desistência",
};

export const APPLICATION_STATUS_BADGE: Record<ApplicationStatus, string> = {
  new: "tag-coral",
  in_review: "tag-mel",
  approved: "tag-verde",
  rejected: "tag-erro",
  withdrawn: "tag-cinza",
};

export interface ApplicationAnswers {
  person: Record<string, string>;
  profile: Record<string, unknown>;
  extra: Record<string, { label: string; answer: string }>;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  answers: ApplicationAnswers;
  consentMatching: boolean;
  consentVersion: string;
  internalNotes: string | null;
  createdAt: string;
  statusChangedAt: string;
  person: { name: string; email: string; phone: string | null; city: string | null; state: string | null };
  animal: { id: string; name: string; code: string; externalId: string };
}
