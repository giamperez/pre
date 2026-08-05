/** Convierte un teléfono en texto libre (ej. "+51 999 999 999" o "999 999 999") al JID de WhatsApp. */
export function normalizeToWaJid(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  // Celular peruano local (9 dígitos, empieza en 9) sin código de país -> anteponer 51.
  // Sin esto el JID queda incompleto y WhatsApp lo acepta "silenciosamente" sin entregarlo a nadie.
  if (digits.length === 9 && digits.startsWith('9')) {
    digits = `51${digits}`;
  }

  return `${digits}@s.whatsapp.net`;
}

/** Extrae solo los dígitos de un JID de WhatsApp (ej. "51999999999@s.whatsapp.net" -> "51999999999"). */
export function waJidToDigits(jid: string): string {
  return jid.split('@')[0].split(':')[0];
}
