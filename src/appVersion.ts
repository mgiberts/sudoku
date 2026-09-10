import { version } from "../package.json";

export const appVersion = `v${import.meta.env.VITE_APP_VERSION || `${version}-dev`}`;
