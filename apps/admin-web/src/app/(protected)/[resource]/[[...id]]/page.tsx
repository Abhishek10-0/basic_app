import { ResourcePage } from "../../../../components/ResourcePage";
export default async function Page({
  params,
}: {
  params: Promise<{ resource: string; id?: string[] }>;
}) {
  const { resource, id } = await params;
  return (
    <ResourcePage key={resource + id?.[0]} resource={resource} id={id?.[0]} />
  );
}
