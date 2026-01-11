export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const sitemapUrl = url.searchParams.get("sitemap");
    const days = parseInt(url.searchParams.get("days") || "30");

    if (!sitemapUrl) {
      return new Response(
        JSON.stringify({ error: "Sitemap URL missing" }),
        { status: 400, headers }
      );
    }

    try {
      const res = await fetch(sitemapUrl);
      if (!res.ok) throw new Error("Failed to fetch sitemap");

      const xmlText = await res.text();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const urlRegex = /<url>([\s\S]*?)<\/url>/g;
      const locRegex = /<loc>(.*?)<\/loc>/;
      const lastmodRegex = /<lastmod>(.*?)<\/lastmod>/;

      let match;
      const results = [];

      while ((match = urlRegex.exec(xmlText)) !== null) {
        const block = match[1];
        const loc = block.match(locRegex)?.[1];
        const lastmod = block.match(lastmodRegex)?.[1];

        if (!loc || !lastmod) continue;

        const lastmodDate = new Date(lastmod);
        if (lastmodDate >= cutoffDate) {
          results.push({
            url: loc,
            lastmod: lastmod
          });
        }
      }

      return new Response(
        JSON.stringify({
          count: results.length,
          days: days,
          urls: results
        }),
        { headers }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers }
      );
    }
  }
};
