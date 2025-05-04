import secrets from "./secrets.json" with { type: "json" };
import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger";
import { prettyJSON } from "@hono/hono/pretty-json";

import { Page, PageKey, ScrapboxWebhookRequest } from "./types.ts";
import { dateJSTTimeFormat } from "./util.ts";
import { execCron } from "./cron.ts";

execCron();

const kv = await Deno.openKv();
const api = new Hono().basePath("/api");

api.use("*", prettyJSON());
api.use("*", logger());

api.post("/webhooks/:webhookId/slack", async (c) => {
  // リクエストURLに、登録されているWebhookURLが含まれているか検証
  const { webhookId } = c.req.param();
  const userSecret = secrets.find((secret) => secret.webhookId === webhookId);
  if (typeof userSecret === "undefined") {
    return c.json({
      "message": "Not Found Webhook ID",
    }, 400);
  }

  const body = await c.req.json() as ScrapboxWebhookRequest;
  const projectName = new URL(body.attachments[0].title_link)
    .pathname.split("/")[1];

  /**
   * Scrapboxから受け取った情報をDeno KVに書き込む
   */
  for (const attachment of body.attachments) {
    const page: Page = {
      projectName: projectName,
      name: attachment.title,
      link: attachment.title_link,
      authors: [attachment.author_name],
      updatedAt: dateJSTTimeFormat(new Date()),
    };
    const pageKey: PageKey = [
      "webhookId",
      webhookId,
      "projectName",
      projectName,
      "pageName",
      page.name,
    ];

    // 同じページが更新済で異なるユーザであればユーザ追記
    const entry = await kv.get<Page>(pageKey);
    if (entry.value != null) {
      const oldPage = entry.value;
      page.authors = [...new Set([...page.authors, ...oldPage.authors])];
    }
    // KVに書き込む
    kv.set(pageKey, page); // 5秒ぐらいかかるので非同期
    console.log(page);
  }

  return c.json("Success");
});

Deno.serve(api.fetch);
