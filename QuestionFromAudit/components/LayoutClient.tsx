"use client";

import { ReactNode } from "react";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import Providers from "@/components/Providers";
import config from "@/config";

const ClientLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Providers>
      <NextTopLoader color={config.colors.main} showSpinner={false} />
      {children}
      <Toaster toastOptions={{ duration: 3000, ariaProps: { role: "alert", "aria-live": "assertive" } }} />
    </Providers>
  );
};

export default ClientLayout;
