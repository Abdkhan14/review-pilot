"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  name: string;
  email: string;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function AccountMenu({ name, email }: Props) {
  const router = useRouter();

  function signOut() {
    authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-zinc-200 py-1.5 pl-1.5 pr-3.5 text-sm text-zinc-900 hover:bg-zinc-50">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold"
        >
          {initials(name)}
        </span>
        {name}
        <ChevronDown className="size-4 text-zinc-500" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs font-normal text-zinc-500">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
