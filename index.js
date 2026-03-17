/**
 * Cloudflare Worker - Remove.bg API Proxy
 */

const API_KEY = "7FPpE6MfmYmiepNMbxSeVKpA";

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");
    if (!imageFile) {
      return new Response(JSON.stringify({ error: "No image" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Convert to base64
    const buffer = await imageFile.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    // Call remove.bg
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_file_b64: base64,
        size: "auto",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(err, {
        status: 502,
        headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
      });
    }

    const blob = await response.blob();
    return new Response(blob, {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(e.message, {
      status: 500,
      headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
    });
  }
}

addEventListener("fetch", e => e.respondWith(handleRequest(e.request)));
