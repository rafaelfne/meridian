export interface StatusPageFeatureItem {
  featureId: string;
  publicName: string;
  visible: boolean;
}

export interface StatusPageProductItem {
  productId: string;
  publicName: string;
  visible: boolean;
  features: StatusPageFeatureItem[];
}

export interface WhiteLabelConfig {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  pageTitle: string | null;
  hidePoweredBy: boolean;
}

export interface StatusPageConfigData {
  enabled: boolean;
  slug: string;
  items: StatusPageProductItem[];
  whiteLabel: WhiteLabelConfig;
}

export interface StatusOverrideItem {
  id: string;
  targetType: "product" | "feature";
  targetId: string;
  targetName: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  message: string | null;
  setByName: string | null;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
}

export interface StatusPageSettingsProps {
  workspaceSlug: string;
  workspaceName: string;
  config: StatusPageConfigData | null;
  availableProducts: Array<{
    id: string;
    name: string;
    features: Array<{ id: string; name: string }>;
  }>;
}

export interface IncidentsSectionProps {
  workspaceSlug: string;
  availableProducts: Array<{
    id: string;
    name: string;
    features: Array<{ id: string; name: string }>;
  }>;
  overrides: StatusOverrideItem[];
}
