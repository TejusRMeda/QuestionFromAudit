"use client";

import { ReactNode } from "react";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import config from "@/config";

const ClientLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <NextTopLoader color={config.colors.main} showSpinner={false} />
      {children}
      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
};

export default ClientLayout;
