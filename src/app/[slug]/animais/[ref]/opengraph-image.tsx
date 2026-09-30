import { ImageResponse } from "next/og";
import { readableTextColor } from "@/lib/color";
import { AGE_LABEL, SEX_LABEL } from "@/modules/animals/labels";
import { getPublicAnimalByRef } from "@/modules/animals/public";

export const alt = "Animal para adoção";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

type P = { slug: string; ref: string };

export default async function OgImage({ params }: { params: Promise<P> | P }) {
  const { slug, ref } = await params;
  const data = await getPublicAnimalByRef(slug, ref);
  if (!data) {
    return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", background: "#1F6B4F" }} />, size);
  }
  const { org, animal } = data;
  const cover = animal.photos.find((p) => p.id === animal.coverPhotoId) ?? animal.photos[0];
  const fg = readableTextColor(org.primaryColor);
  const details = [animal.sex !== "unknown" ? SEX_LABEL[animal.sex] : null, animal.ageGroup ? AGE_LABEL[animal.ageGroup] : null]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: org.primaryColor, color: fg }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" width={630} height={630} style={{ width: 630, height: 630, objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", width: 630, height: 630, background: org.secondaryColor }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 56, width: 570 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: animal.status === "reserved" ? "#FFF1D1" : org.secondaryColor,
                color: animal.status === "reserved" ? "#8A5A00" : readableTextColor(org.secondaryColor),
                padding: "8px 20px",
                borderRadius: 999,
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {animal.status === "reserved" ? "Em processo de adoção" : "Para adoção"}
            </div>
            <div style={{ fontSize: animal.name.length > 12 ? 72 : 96, fontWeight: 800, marginTop: 28, lineHeight: 1 }}>
              {animal.name}
            </div>
            {details && <div style={{ fontSize: 34, marginTop: 16, opacity: 0.85 }}>{details}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {org.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt="" width={88} height={88} style={{ borderRadius: 999, background: "#fff", padding: 6 }} />
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 34, fontWeight: 700 }}>{org.name}</div>
              {org.city && <div style={{ fontSize: 24, opacity: 0.8 }}>{org.city}</div>}
              <div style={{ fontSize: 20, marginTop: 8, opacity: 0.7 }}>Catálogo feito com AdoteHub</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
