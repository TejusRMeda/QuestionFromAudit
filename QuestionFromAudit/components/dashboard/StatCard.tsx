import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number;
  href?: string;
  dotColor?: string;
}

export default function StatCard({ label, value, href, dotColor }: StatCardProps) {
  const content = (
    <Card className={href ? "hover:shadow-sm transition-shadow cursor-pointer" : ""}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
          </div>
          {dotColor && (
            <div className={`w-2.5 h-2.5 rounded-full mt-1 ${dotColor}`} />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
