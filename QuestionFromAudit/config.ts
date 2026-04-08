import { ConfigProps } from "./types/config";

const config = {
  appName: "Questionaire Audit",
  appDescription: "Audit your questionaire in seconds.",
  domainName: "questionaireaudit.com",
  colors: {
    theme: "light",
    main: "#4A90A4",
  },
  auth: {
    loginUrl: "/signin",
    callbackUrl: "/dashboard",
  },
} as ConfigProps;

export default config;
