import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "./CopyLinkButton";
import { Panel } from "./Panel";

type Props = {
  id: string;
  slug: string;
  scanUrl: string;
  /** Raw SVG markup from encodeQrSvg, inlined so it stays crisp at any size. */
  svg: string;
};

export function QrBlock({ id, slug, scanUrl, svg }: Props) {
  const download = (format: "png" | "svg") => `/api/app/qr/${id}/download?format=${format}`;
  return (
    <Panel title="Your QR code">
      <div
        role="img"
        aria-label={`QR code for ${slug}`}
        className="rounded-lg border border-zinc-200 p-4 [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
        <span className="flex-1 truncate text-sm text-zinc-700">{scanUrl.replace(/^https?:\/\//, "")}</span>
        <CopyLinkButton url={scanUrl} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline">
          <a href={download("png")} download={`${slug}.png`}>Download PNG</a>
        </Button>
        <Button asChild variant="outline">
          <a href={download("svg")} download={`${slug}.svg`}>Download SVG</a>
        </Button>
      </div>
      <p className="text-sm text-zinc-500">
        The link never changes, so a printed sticker keeps working through plan changes.
      </p>
    </Panel>
  );
}
