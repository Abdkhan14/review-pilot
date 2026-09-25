"use client";
import { useRouter } from "next/navigation";
import { useDeleteBusiness } from "@/hooks/useDeleteBusiness";

type Props = { id: string };

export default function DeleteBusinessButton({ id }: Props) {
  const router = useRouter();
  const { deleteBusiness, loading, error } = useDeleteBusiness();

  async function handleDelete() {
    const confirmed = window.confirm("Delete this business? This cannot be undone.");
    if (!confirmed) return;
    const ok = await deleteBusiness(id);
    if (ok) router.push("/admin");
  }

  return (
    <div>
      {error && (
        <p className="mb-2 text-sm text-red-600">{error}</p>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? "Deleting…" : "Delete business"}
      </button>
    </div>
  );
}
