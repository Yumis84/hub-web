// Public browser configuration for Hub Auth. Publishable keys are not secrets.
const params = new URLSearchParams(location.search);
const acceptance = params.get("mode") === "acceptance";
window.HUB_CONFIG = acceptance ? {
  mode: "acceptance",
  supabaseUrl: "https://trrhyahuzqbozxanaczw.supabase.co",
  supabasePublishableKey: "sb_publishable_gJ2s1m3TcfLlVymFoOHfkQ_iMxO7rB5",
  acceptanceFunction: "mcp-project-acceptance"
} : {
  mode: "production",
  supabaseUrl: "https://enhcnvzzkyvusthfjnci.supabase.co",
  supabasePublishableKey: "sb_publishable_yB-n6QNvwR3754j32bLBmQ_a9sSfxyY"
};
