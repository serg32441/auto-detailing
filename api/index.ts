/**
 * Vercel Serverless Adapter for Hono
 * 
 * This converts the Hono app to work with Vercel's serverless environment.
 * DO NOT import @hono/node-server here — Vercel provides its own runtime.
 */

import app from "./boot";

// Vercel serverless handler
export default async function handler(request: Request): Promise<Response> {
  const origin = request.headers.get("origin") || "*";
  
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-trpc-source",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = await app.fetch(request);
  
  // Add CORS headers
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  
  return response;
}

export const config = {
  runtime: "nodejs",
};
