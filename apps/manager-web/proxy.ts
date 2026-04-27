import createMiddleware from "next-intl/middleware";
import {locales, defaultLocale} from "./src/i18n";

const proxy = createMiddleware({
  locales,
  defaultLocale
});

export default proxy;

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};