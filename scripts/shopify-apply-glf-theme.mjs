/**
 * Apply Green Lane branding to the live Shopify theme (Orbilimited / Dawn fork).
 * Uses SHOPIFY_STORE + SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (or SHOPIFY_ADMIN_TOKEN).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeDir = path.join(__dirname, "..", "shopify-theme");

const shopRaw = process.env.SHOPIFY_STORE?.replace(/^https?:\/\//, "").replace(/\/$/, "");
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
let staticToken = process.env.SHOPIFY_ADMIN_TOKEN;
if (staticToken?.startsWith("shpss_")) staticToken = null;

if (!shopRaw || (!staticToken && !(clientId && clientSecret))) {
  console.error("Set SHOPIFY_STORE and client credentials or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const shopHost = shopRaw.includes(".") ? shopRaw : `${shopRaw}.myshopify.com`;
let cachedToken = staticToken || null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;
  if (staticToken) return staticToken;
  const res = await fetch(`https://${shopHost}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const { access_token, expires_in } = await res.json();
  cachedToken = access_token;
  tokenExpiresAt = Date.now() + (expires_in || 86399) * 1000;
  return cachedToken;
}

async function rest(method, apiPath, body) {
  const res = await fetch(`https://${shopHost}/admin/api/2025-01${apiPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": await getAccessToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${apiPath} ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

async function putAsset(themeId, key, value) {
  return rest("PUT", `/themes/${themeId}/assets.json`, {
    asset: { key, value },
  });
}

function patchSettings(raw) {
  const data = JSON.parse(raw);
  const c = data.current;
  c.logo = "";
  c.favicon = c.favicon || "";
  c.logo_width = 280;
  c.type_header_font = "fraunces_n5";
  c.type_body_font = "assistant_n4";
  c.page_width = 1200;
  c.buttons_radius = 6;
  c.card_corner_radius = 8;
  c.media_radius = 12;
  c.collection_card_corner_radius = 8;
  c.brand_headline = "Green Lane Furniture";
  c.brand_description =
    "<p><strong>GREEN LANE FURNITURE LTD</strong> · Company no. 15612430</p>" +
    "<p>510-512 Green Lane, Birmingham B9 5QH</p>" +
    "<p><a href=\"mailto:contact@greenlanefurniture.co.uk\">contact@greenlanefurniture.co.uk</a> · " +
    "<a href=\"tel:+447414892530\">+44 7414 892530</a></p>" +
    "<p>Monday–Saturday, 9:00am–6:00pm (UK time)</p>";
  c.checkout_logo_image = "";
  c.cart_type = "drawer";

  const schemes = c.color_schemes || {};
  if (schemes["scheme-1"]?.settings) {
    Object.assign(schemes["scheme-1"].settings, {
      background: "#f7f5f0",
      text: "#1a2e1a",
      button: "#2d5a27",
      button_label: "#f7f5f0",
      secondary_button_label: "#1a2e1a",
    });
  }
  if (schemes["scheme-2"]?.settings) {
    Object.assign(schemes["scheme-2"].settings, {
      background: "#ffffff",
      text: "#1a2e1a",
      button: "#2d5a27",
      button_label: "#ffffff",
    });
  }
  if (schemes["scheme-3"]?.settings) {
    Object.assign(schemes["scheme-3"].settings, {
      background: "#1a2e1a",
      text: "#f7f5f0",
      button: "#e8c547",
      button_label: "#1a2e1a",
    });
  }
  if (schemes["scheme-4"]?.settings) {
    Object.assign(schemes["scheme-4"].settings, {
      background: "#e8c547",
      text: "#5c4a08",
      button: "#2d5a27",
      button_label: "#ffffff",
    });
  }
  if (schemes["scheme-5"]?.settings) {
    Object.assign(schemes["scheme-5"].settings, {
      background: "#ebe6dc",
      text: "#1a2e1a",
      button: "#2d5a27",
      button_label: "#f7f5f0",
    });
  }
  return JSON.stringify(data, null, 2);
}

function patchIndex(raw) {
  const data = JSON.parse(raw);
  if (data.sections?.image_banner) {
    data.sections.image_banner.disabled = true;
  }
  data.sections.glf_home_hero_main = {
    type: "glf-home-hero",
    settings: {
      eyebrow: "Birmingham showroom",
      heading: "Furniture for every home",
      subheading:
        "Quality sofas, beds and home furniture from our Birmingham showroom on Green Lane.",
      button_primary_label: "Browse the shop",
      button_primary_link: "shopify://collections/all",
      button_secondary_label: "Visit or call us",
      button_secondary_link: "/pages/contact",
      image: "",
      image_url:
        "https://images.unsplash.com/photo-1618221195710-dd6b41fa6046?auto=format&fit=crop&w=1400&q=85",
      image_alt: "Living room with Green Lane Furniture sofa",
      full_bleed_background: true,
      background_overlay: 55,
    },
  };
  const order = data.order ?? [];
  data.order = order.filter((id) => id !== "glf_home_hero_main");
  data.order = ["glf_home_hero_main", ...data.order.filter((id) => id !== "image_banner")];

  const banner = data.sections?.image_banner;
  if (banner?.blocks?.heading?.settings) {
    banner.blocks.heading.settings.heading = "Furniture for every home";
  }
  if (banner?.blocks?.text_UHtDRR?.settings) {
    banner.blocks.text_UHtDRR.settings.text =
      "Quality sofas, beds and home furniture from our Birmingham showroom on Green Lane.";
  }
  if (banner?.blocks?.button?.settings) {
    banner.blocks.button.settings.button_label_1 = "Browse the shop";
    banner.blocks.button.settings.button_link_1 = "shopify://collections/all";
    banner.blocks.button.settings.button_label_2 = "Visit or call us";
    banner.blocks.button.settings.button_link_2 = "/pages/contact";
    banner.blocks.button.settings.button_style_secondary_2 = true;
  }
  if (banner?.settings) {
    banner.settings.image_overlay_opacity = 0;
    banner.settings.desktop_content_position = "middle-left";
    banner.settings.desktop_content_alignment = "left";
    banner.settings.color_scheme = "scheme-5";
    banner.settings.image_height = "large";
  }
  const rich = data.sections?.rich_text_wAx9QJ;
  if (rich?.blocks?.heading_pLBbh9?.settings) {
    rich.blocks.heading_pLBbh9.settings.heading = "Shop by room";
  }
  const iwt = data.sections?.image_with_text_3fyf3d;
  if (iwt?.blocks?.heading_FrXtcc?.settings) {
    iwt.blocks.heading_FrXtcc.settings.heading = "We're here to help";
  }
  if (iwt?.blocks?.text_TA87rf?.settings) {
    iwt.blocks.text_TA87rf.settings.text =
      "<p>Green Lane Furniture hand-picks sofas, beds, dining and storage for UK homes — comfort, quality and fair prices.</p>" +
      "<p>Not sure about sizes or delivery? Call <strong>+44 7414 892530</strong> or email " +
      "<strong>contact@greenlanefurniture.co.uk</strong>. We aim to reply within one working day.</p>";
  }
  const grid = data.sections?.four_grid_cards_prgzNH;
  if (grid?.settings) {
    data.sections.four_grid_cards_prgzNH.disabled = false;
    Object.assign(grid.settings, {
      title_1: "Free UK delivery",
      desc_1: "Free delivery across mainland UK · tracked furniture carriers · typical 3–10 working days",
      title_2: "Showroom & support",
      desc_2: "510-512 Green Lane, Birmingham — Monday–Saturday 9am–6pm",
      title_3: "14-day returns",
      desc_3: "Unused stock furniture can usually be returned within 14 days of delivery.",
      title_4: "Contact us",
      desc_4: "contact@greenlanefurniture.co.uk · +44 7414 892530",
    });
  }
  const faq = data.sections?.custom_liquid_tea8Tf;
  if (faq?.settings?.custom_liquid) {
    faq.settings.custom_liquid = faq.settings.custom_liquid
      .replaceAll("ORBILIMITED", "Green Lane Furniture")
      .replaceAll("support@orbilimited.co.uk", "contact@greenlanefurniture.co.uk")
      .replaceAll("+44 7508 261422", "+44 7414 892530")
      .replaceAll("orbi-faq", "glf-faq");
  }
  if (data.sections?.featured_collection?.settings) {
    data.sections.featured_collection.settings.collection = "all";
    data.sections.featured_collection.settings.title = "Featured pieces";
  }
  return JSON.stringify(data, null, 2);
}

function patchThemeLiquid(raw) {
  let out = raw;
  out = out.replace(
    /assign page_title = "ORBILIMITED[^"]*"/,
    'assign page_title = "Green Lane Furniture | Sofas, Beds & Home Furniture UK"',
  );
  out = out.replace(
    /assign page_description = "Shop sofas[^"]*"/,
    'assign page_description = "Shop sofas, beds and home furniture from Green Lane Furniture in Birmingham. Free UK delivery, showroom support and quality for every home."',
  );
  if (!out.includes("glf-brand.css")) {
    out = out.replace(
      "{{ 'base.css' | asset_url | stylesheet_tag }}",
      "{{ 'base.css' | asset_url | stylesheet_tag }}\n    {{ 'glf-brand.css' | asset_url | stylesheet_tag }}",
    );
  }
  return out;
}

async function main() {
  const themes = (await rest("GET", "/themes.json")).themes;
  const main = themes.find((t) => t.role === "main");
  if (!main) throw new Error("No main theme");
  console.log("Main theme:", main.name, main.id);

  const pick = (name, fallback) => {
    const live = path.join(themeDir, `_live_${name.replace(/\//g, "_")}`);
    const local = path.join(themeDir, name.replace(/\//g, "_").replace(/^([^_])/, "_$1"));
    return fs.existsSync(live) ? live : local;
  };

  const settingsPath = pick("config/settings_data.json", "_config_settings_data.json");
  const indexPath = pick("templates/index.json", "_templates_index.json");
  const layoutPath = pick("layout/theme.liquid", "_layout_theme.liquid");
  const headerGroupPath = pick("sections/header-group.json", "_live_sections_header-group.json");
  const heroSectionPath = path.join(themeDir, "sections", "glf-home-hero.liquid");
  const cssPath = path.join(themeDir, "glf-brand.css");

  function patchHeaderGroup(raw) {
    const data = JSON.parse(raw);
    const bar = data.sections?.["announcement-bar"];
    if (bar?.blocks?.["announcement-bar-0"]?.settings) {
      bar.blocks["announcement-bar-0"].settings.text =
        "Free delivery across mainland UK · tracked furniture carriers · typical 3–10 working days";
      bar.blocks["announcement-bar-0"].settings.link = "shopify://collections/all";
    }
    if (bar?.settings) bar.settings.color_scheme = "scheme-4";
    const hdr = data.sections?.header?.settings;
    if (hdr) {
      hdr.sticky_header_type = "always";
      hdr.menu_type_desktop = "dropdown";
      hdr.color_scheme = "scheme-1";
      hdr.logo_position = "middle-left";
    }
    return JSON.stringify(data, null, 2);
  }

  function scrubOrbi(s) {
    return s
      .replaceAll(/ORBILIMITED/gi, "Green Lane Furniture")
      .replaceAll(/Orbilimited/g, "Green Lane Furniture")
      .replaceAll(/support@orbilimited\.co\.uk/gi, "contact@greenlanefurniture.co.uk")
      .replaceAll(/orbilimited\.co\.uk/gi, "greenlanefurniture.co.uk")
      .replaceAll("+44 7508 261422", "+44 7414 892530")
      .replaceAll("shopify://shop_images/orbi-hero.jpg", "")
      .replaceAll("shopify://shop_images/orbi-support.jpg", "")
      .replaceAll("shopify://shop_images/orbi-logo.png", "")
      .replaceAll("shopify://shop_images/orbi-favicon.png", "");
  }

  const uploads = [
    ["sections/glf-home-hero.liquid", fs.readFileSync(heroSectionPath, "utf8")],
    ["assets/glf-brand.css", fs.readFileSync(cssPath, "utf8")],
    [
      "config/settings_data.json",
      scrubOrbi(patchSettings(fs.readFileSync(settingsPath, "utf8"))),
    ],
    ["templates/index.json", scrubOrbi(patchIndex(fs.readFileSync(indexPath, "utf8")))],
    ["layout/theme.liquid", scrubOrbi(patchThemeLiquid(fs.readFileSync(layoutPath, "utf8")))],
  ];
  if (fs.existsSync(headerGroupPath)) {
    uploads.push([
      "sections/header-group.json",
      scrubOrbi(patchHeaderGroup(fs.readFileSync(headerGroupPath, "utf8"))),
    ]);
  }

  for (const [key, value] of uploads) {
    process.stdout.write(`Upload ${key}… `);
    await putAsset(main.id, key, value);
    console.log("ok");
  }

  try {
    await rest("PUT", "/shop.json", {
      shop: {
        name: "Green Lane Furniture",
        email: "contact@greenlanefurniture.co.uk",
      },
    });
    console.log("Shop name/email updated");
  } catch (e) {
    console.log("Shop update skipped:", e.message.slice(0, 80));
  }

  console.log("Done — preview:", `https://${shopHost}?preview_theme_id=${main.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
