import {
  buildShopifySaleEmail,
  buildShopifySaleTelegram,
  shouldNotifyShopifyOrder,
  type ShopifyWebhookOrder,
} from "@/lib/shopify-order-notify";
import { sendSaleNotifyEmail } from "@/lib/sale-notify-email";
import { sendTelegramText } from "@/lib/telegram-order-notify";

export async function notifyShopifySale(order: ShopifyWebhookOrder) {
  if (!shouldNotifyShopifyOrder(order)) {
    return { email: false, telegram: false, skipped: true };
  }

  const { subject, text } = buildShopifySaleEmail(order);
  const telegramText = buildShopifySaleTelegram(order);

  const [emailResult, telegramResult] = await Promise.allSettled([
    sendSaleNotifyEmail(subject, text),
    sendTelegramText(telegramText),
  ]);

  if (emailResult.status === "rejected") {
    console.error("[sale-notify] email", emailResult.reason);
  }
  if (telegramResult.status === "rejected") {
    console.error("[sale-notify] telegram", telegramResult.reason);
  }

  return {
    email: emailResult.status === "fulfilled" && emailResult.value,
    telegram: telegramResult.status === "fulfilled" && telegramResult.value,
    skipped: false,
  };
}
