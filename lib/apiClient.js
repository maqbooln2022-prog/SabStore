// Calls one of the app/api/* route handlers with the current session's
// access token attached, so the server can verify who's asking. Shared
// by ShopContext's callStaffApi and the platform admin page, since both
// just need "authenticated fetch that throws on failure."
export async function callApi(supabase, path, body, method = "POST") {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: method === "GET" ? undefined : JSON.stringify(body || {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}
