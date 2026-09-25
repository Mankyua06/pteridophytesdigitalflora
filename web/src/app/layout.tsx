
import { getUi } from "@/lib/site-text-server";
import { getLocale, getSiteText } from "@/lib/site-text-server";
import { LanguageProvider, LanguageSwitch } from "@/components/language-provider";
import Link from "next/link";
import "./globals.css";
import { themeStyle } from "@/lib/site-theme";
export async function generateMetadata() {
 const ui = await getUi();
 return {
  title: {
    default: ui("fern_digital_flora"),
    template: `%s | ${ui("site_brand_name")}`,
  },
  description: ui("korean_scope_description"),
};
}
export default async function Layout({ children }: { children: React.ReactNode }) {
  const ui = await getUi();
  const [locale, siteText] = await Promise.all([getLocale(), getSiteText()]);
  return (
    <html lang={locale} style={themeStyle(siteText.theme)}>
      <body>
        <LanguageProvider locale={locale} source={siteText}>
        <a className="skip" href="#main">{ui("skip_to_content")}</a>
        <header>
          <Link className="brand" href="/">
            <span>
              {ui("site_brand_short")}
              <br />
              <small>DIGITAL FLORA</small>
            </span>
          </Link>
          <nav aria-label={ui("main_navigation")}>
            <Link href="/taxa">{ui("taxa")}</Link>
            <Link href="/morphology">{ui("morphology")}</Link>
            <Link href="/gallery">{ui("photo_gallery_12")}</Link>
            <Link href="/statistics">{ui("statistics")}</Link>
            <Link href="/contributors">{ui("contributors")}</Link>
          </nav>
          <LanguageSwitch />
        </header>
        {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_LOCAL_PREVIEW === "true" &&
          <aside className="preview-banner">{ui("local_test_photographs_are_arbitrarily_linked_and_do_not_documen")}</aside>}
        <main id="main">{children}</main>
        <footer>
          <span>{ui("site_brand_name")}</span>
          <span>{ui("korean_scope_description")}</span>
        </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
