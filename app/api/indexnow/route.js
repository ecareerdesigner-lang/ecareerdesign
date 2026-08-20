const INDEXNOW_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";
const HOST = "ecareerdesign.net";

export async function POST(req) {
  try {
    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return Response.json(
        { error: "Provide a non-empty 'urls' array" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });

    return Response.json({
      status: res.status,
      submitted: urls.length,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}