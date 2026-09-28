import { safeUrl } from './books';

export type ShopContact = { label: string; href: string };

export function getShopContacts(): ShopContact[] {
  const contacts: ShopContact[] = [];
  for (const [label, value] of [
    ['Facebook', process.env.SHOP_FACEBOOK_URL],
    ['LINE', process.env.SHOP_LINE_URL],
  ]) {
    const href = safeUrl(value || '');
    if (href) contacts.push({ label: label!, href });
  }
  const email = process.env.SHOP_EMAIL?.trim();
  if (email && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)) {
    contacts.push({ label: 'อีเมล', href: `mailto:${email}` });
  }
  return contacts;
}
