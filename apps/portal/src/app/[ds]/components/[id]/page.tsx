import Link from "next/link";
import { notFound } from "next/navigation";
import { contractToMarkdown } from "@elos/core/markdown";
import { getDraft } from "@/lib/store.ts";
import { renderMarkdown } from "@/components/markdown.tsx";
import { ComponentEditor } from "./editor.tsx";

export default async function ComponentPage({ params }: { params: Promise<{ ds: string; id: string }> }) {
  const { ds, id } = await params;
  const { catalog } = await getDraft(ds);
  const contract = catalog.contracts.find((c) => c.id === id);
  if (!contract) notFound();
  return (
    <>
      <p className="muted" style={{ fontSize: 13 }}>
        <Link href={`/${ds}/components`}>Components</Link> / {contract.category}
      </p>
      <ComponentEditor ds={ds} contract={contract} catalog={catalog} markdown={contractToMarkdown(contract)} usageHtml={renderMarkdown(contractToMarkdown(contract))} />
    </>
  );
}
