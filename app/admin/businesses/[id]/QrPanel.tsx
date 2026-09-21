import { tokens } from "@/app/tokens";
import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  slug: string;
  /** Raw SVG markup from encodeQrSvg — inlined for crisp display at any size. */
  svg: string;
};

export default function QrPanel({ id, slug, svg }: Props) {
  return (
    <section className={`mt-8 mb-8 rounded-lg border ${tokens.border} bg-white p-4 shadow-sm`}>
      {/* Inline SVG fills the full column width for a large, scannable preview */}
      <div
        className="w-full"
        role="img"
        aria-label={`QR code for ${slug}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="mt-4 flex gap-3">
        <Button
          asChild
          variant="outline"
        >
          <a
            href={`/api/admin/businesses/${id}/qr?format=png`}
            download={`${slug}.png`}
          >
            Download PNG
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
        >
          <a
            href={`/api/admin/businesses/${id}/qr?format=svg`}
            download={`${slug}.svg`}
          >
            Download SVG
          </a>
        </Button>
      </div>
    </section>
  );
}
