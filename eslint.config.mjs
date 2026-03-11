import nextConfig from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextConfig,
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Data URLs from canvas rendering; next/image is not applicable
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
