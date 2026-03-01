export type DocumentSummary = {
  id: string;
  title: string;
  slug: string;
  updatedAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
};

export type DocumentDetail = {
  id: string;
  title: string;
  slug: string;
  content: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
  system: {
    name: string;
  };
};

export type DocumentEditorData = {
  id: string;
  title: string;
  slug: string;
  content: string;
};
