export type ProductTier = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tier: ProductTier;
  _count: { systems: number };
}

export interface ProductDetailSystem {
  id: string;
  name: string;
  slug: string;
  language: string | null;
  framework: string | null;
  domain: { name: string };
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tier: ProductTier;
  createdAt: Date;
  updatedAt: Date;
  systems: ProductDetailSystem[];
}
