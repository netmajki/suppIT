/** Wszystkie ustawienia edytowalne w panelu: klucz → domyślna wartość i czy jest sekretem. */
export type SettingDef = { default: string; secret?: boolean };

export const SETTINGS = {
  // Firma
  "company.name": { default: "suppIT.me" },
  "company.email": { default: "kontakt@suppit.me" },
  "company.phone": { default: "+49 000 0000000" },
  "company.phoneCountryCode": { default: "49" },
  "company.address": { default: "" },
  "company.currency": { default: "EUR" },
  "company.logoUrl": { default: "" },
  "theme.default": { default: "system" },
  // Powiadomienia
  "notifications.adminEmail": { default: "" },
  "email.provider": { default: "" },
  "email.from": { default: "suppIT.me <kontakt@suppit.me>" },
  "email.smtpHost": { default: "" },
  "email.smtpPort": { default: "587" },
  "email.smtpUser": { default: "" },
  "email.smtpPass": { default: "", secret: true },
  "email.resendApiKey": { default: "", secret: true },
  "whatsapp.provider": { default: "meta" },
  "whatsapp.metaPhoneNumberId": { default: "" },
  "whatsapp.metaAccessToken": { default: "", secret: true },
  "whatsapp.metaTemplateName": { default: "" },
  "whatsapp.metaApiVersion": { default: "v21.0" },
  "whatsapp.twilioAccountSid": { default: "" },
  "whatsapp.twilioAuthToken": { default: "", secret: true },
  "whatsapp.twilioFrom": { default: "" },
  "whatsapp.twilioContentSid": { default: "" },
  // Strony prawne (Markdown)
  "legal.impressum.de": { default: "" },
  "legal.impressum.pl": { default: "" },
  "legal.impressum.en": { default: "" },
  "legal.privacy.de": { default: "" },
  "legal.privacy.pl": { default: "" },
  "legal.privacy.en": { default: "" },
} satisfies Record<string, SettingDef>;

export type SettingKey = keyof typeof SETTINGS;
export const isSettingKey = (k: string): k is SettingKey => k in SETTINGS;
