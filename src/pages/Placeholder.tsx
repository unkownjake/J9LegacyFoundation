import { Link } from "react-router-dom";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-primary-darker mb-4">{title}</h1>
      <p className="text-muted-foreground mb-8">This page is coming soon.</p>
      <Link to="/" className="text-primary font-semibold hover:underline">
        ← Back home
      </Link>
    </div>
  );
}
