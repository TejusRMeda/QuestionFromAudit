import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default async function LayoutPrivate({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.auth.loginUrl);
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <DashboardSidebar
        userEmail={user.email!}
        userName={user.user_metadata?.name}
        userAvatar={user.user_metadata?.avatar_url}
      />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
