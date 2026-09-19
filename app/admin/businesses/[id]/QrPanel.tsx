import { tokens } from "@/app/tokens";

type Props = {
  id: string;
  slug: string;
  /** Raw SVG markup from encodeQrSvg — inlined for crisp display at any size. */
  svg: string;
};

export default function QrPanel({ id, slug, svg }: Props) {
  return (
    <section className={`mt-8 border ${tokens.border} p-4`}>
      {/* Inline SVG fills the full column width for a large, scannable preview */}
      <div
        className="w-full"
        role="img"
        aria-label={`QR code for ${slug}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="mt-4 flex gap-3">
        <a
          href={`/api/admin/businesses/${id}/qr?format=png`}
          className={`border ${tokens.border} px-3 py-1 text-sm`}
          download={`${slug}.png`}
        >
          Download PNG
        </a>
        <a
          href={`/api/admin/businesses/${id}/qr?format=svg`}
          className={`border ${tokens.border} px-3 py-1 text-sm`}
          download={`${slug}.svg`}
        >
          Download SVG
        </a>
      </div>
    </section>
  );
}
