// Student assessment interface — TODO: Implement in Session 2
export default function AssessPage({ params }: { params: { code: string } }) {
  return <div>Assessment: {params.code}</div>;
}
