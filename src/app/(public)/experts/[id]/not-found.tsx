import Link from "next/link";

export default function ExpertNotFound() {
  return (
    <div className="bb-container py-20">
      <h1 className="font-display text-3xl">Expert not found</h1>
      <Link href="/experts" className="text-primary underline mt-3 inline-block">
        Back to directory
      </Link>
    </div>
  );
}
