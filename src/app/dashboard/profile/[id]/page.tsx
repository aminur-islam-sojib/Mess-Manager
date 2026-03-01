export default async function page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const param = await params;

  return <div>page : {param.id}</div>;
}
