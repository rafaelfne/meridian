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

export interface StatusPageConfigData {
  enabled: boolean;
  slug: string;
  items: StatusPageProductItem[];
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
