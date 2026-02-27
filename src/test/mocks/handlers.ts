import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/inventories", () => {
    return HttpResponse.json([]);
  }),

  http.post("/api/inventories", () => {
    return HttpResponse.json(
      { success: true, message: "Inventory uploaded" },
      { status: 201 },
    );
  }),

  http.get("/api/systems", () => {
    return HttpResponse.json([]);
  }),

  http.get("/api/dependencies", () => {
    return HttpResponse.json([]);
  }),

  http.get("/api/graph", () => {
    return HttpResponse.json({ nodes: [], edges: [] });
  }),
];
