export const tokens = {
  background: "bg-zinc-50",
  text: "text-zinc-900",
  border: "border-zinc-200",
  maxWidth: "max-w-md",
  pageY: "py-10",
} as const;

export const layoutClass = {
  body: `min-h-dvh ${tokens.background} ${tokens.text}`,
  column: `mx-auto min-h-dvh w-full ${tokens.maxWidth} border-x ${tokens.border} px-4 ${tokens.pageY}`,
} as const;
