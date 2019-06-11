module.exports = async (api, { clean, url }) => {
  const { webhooks } = await api.webhooks();
  console.log({ webhooks });

  if (clean) {
    for (const webhook of webhooks) {
      if (webhook.url !== url) {
        await api.deleteWebhook(webhook.id);
        console.log(`Removed ${webhook.id} (${webhook.url})`);
      }
    }
  }

  const hook = webhooks.find(webhook => webhook.url === url);
  console.log({ hook });
  if (hook) return;

  console.log("Hook not found. Registering...");
  const { webhook } = await api.registerWebhook(url);
  console.log(`Registered ${webhook.id} for ${webhook.url}`);

  return;
};
