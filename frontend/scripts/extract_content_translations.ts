import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { manifest } from "./content_manifest";

type LangKey = "en" | "nl" | "fr" | "de" | "es" | "pt";

const languages: LangKey[] = ["en", "nl", "fr", "de", "es", "pt"];

const scriptPath = typeof __filename !== "undefined"
  ? __filename
  : fileURLToPath(import.meta.url);

console.log(`cwd: ${process.cwd()}`);
console.log(`node: ${process.version}`);
console.log(`script: ${scriptPath}`);

type TranslationsMap = Record<string, any>;

function getByPath(obj: Record<string, any> | undefined, pathKey: string): string | undefined {
  if (!obj) {
    return undefined;
  }
  return pathKey.split(".").reduce<any>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return acc[key];
    }
    return undefined;
  }, obj);
}

async function loadTranslations(): Promise<TranslationsMap> {
  try {
    const mod = await import("../src/i18n/translations");
    return mod.translations as TranslationsMap;
  } catch (error) {
    console.error("Failed to import translations:", error);
    throw error;
  }
}

async function main() {
  const translations = await loadTranslations();

  if (!translations || typeof translations !== "object") {
    throw new Error("Translations module did not export a valid object.");
  }

  const availableLangs = Object.keys(translations);
  console.log(`Loaded translations for: ${availableLangs.join(", ")}`);
  console.log(`translations keys: ${availableLangs.join(", ")}`);
  console.log(`translations.en keys length: ${Object.keys(translations.en || {}).length}`);

  if (availableLangs.length === 0) {
    throw new Error("No translations loaded.");
  }

  const outputDir = path.join(process.cwd(), "export");
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Output dir ready: ${outputDir}`);
  if (!fs.existsSync(outputDir)) {
    throw new Error(`Output directory does not exist: ${outputDir}`);
  }

  const written: Array<{ path: string; size: number }> = [];

  languages.forEach((lang) => {
    const langTranslations = translations[lang];
    if (!langTranslations || Object.keys(langTranslations).length === 0) {
      console.warn(`Warning: missing translations for language: ${lang}`);
      return;
    }

    const categories = manifest.categories.map((entry) => {
      const name =
        getByPath(langTranslations, entry.nameKey) ??
        getByPath(translations.en, entry.nameKey);
      const description =
        getByPath(langTranslations, entry.descKey) ??
        getByPath(translations.en, entry.descKey) ??
        "";

      if (name === undefined) {
        console.warn(`[${lang}] Missing category name for ${entry.key}, using fallback.`);
      }
      if (getByPath(langTranslations, entry.descKey) === undefined) {
        console.warn(`[${lang}] Missing category description for ${entry.key}, using fallback.`);
      }

      return {
        key: entry.key,
        name: name ?? entry.key,
        description,
      };
    });

    const posts = manifest.posts.map((entry) => {
      const title =
        getByPath(langTranslations, entry.titleKey) ??
        getByPath(translations.en, entry.titleKey);
      const excerpt =
        getByPath(langTranslations, entry.excerptKey) ??
        getByPath(translations.en, entry.excerptKey) ??
        "";
      const body =
        getByPath(langTranslations, entry.bodyKey) ??
        getByPath(translations.en, entry.bodyKey) ??
        excerpt;

      if (title === undefined) {
        console.warn(`[${lang}] Missing post title for ${entry.slug}, using fallback.`);
      }
      if (getByPath(langTranslations, entry.excerptKey) === undefined) {
        console.warn(`[${lang}] Missing post excerpt for ${entry.slug}, using fallback.`);
      }
      if (getByPath(langTranslations, entry.bodyKey) === undefined) {
        console.warn(`[${lang}] Missing post body for ${entry.slug}, using fallback.`);
      }

      return {
        slug: entry.slug,
        category_keys: entry.categoryKeys || [],
        title: title ?? entry.slug,
        excerpt,
        body,
      };
    });

    const payload = {
      language: lang,
      categories,
      posts,
    };

    const outPath = path.join(outputDir, `content_${lang}.json`);
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");

    if (!fs.existsSync(outPath)) {
      throw new Error(`Failed to write file: ${outPath}`);
    }

    const size = fs.statSync(outPath).size;
    if (size <= 200) {
      throw new Error(`File too small (possible empty export): ${outPath} (${size} bytes)`);
    }
    console.log(
      `Wrote ${outPath} (${size} bytes) with ${categories.length} categories and ${posts.length} posts`
    );
    written.push({ path: outPath, size });
  });

  const sizesSummary = written.map((item) => `${item.path} (${item.size} bytes)`);
  console.log(`Export summary: ${written.length} files written.`);
  if (sizesSummary.length > 0) {
    console.log(`Files: ${sizesSummary.join(", ")}`);
  }
}

main().catch((error) => {
  console.error("Export failed:", error);
  process.exit(1);
});
