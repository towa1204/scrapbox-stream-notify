import { assertEquals } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { createApi } from "./api.ts";

describe("receive from cosense", () => {
  let kv: Deno.Kv;

  beforeEach(async () => {
    kv = await Deno.openKv(":memory:");
  });

  afterEach(() => {
    kv.close();
  });

  it("登録されていない webhookId のとき 400 を返す", async () => {
    const api = createApi(kv);
    const req = new Request("http://localhost/api/webhooks/hogehoge/slack", {
      method: "POST",
    });

    const res = await api.request(req);
    const json = await res.json();

    assertEquals(res.status, 400);
    assertEquals(json, { message: "Not Found Webhook ID" });
  });
});
