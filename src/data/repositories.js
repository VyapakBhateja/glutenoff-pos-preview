/** Supabase repositories. Query details live here; callers own presentation and state. */
export function createRepositories(client) {
  if (!client?.from || !client?.rpc) throw new Error("A valid Supabase client is required.");
  return {
    products: {
      async list() { const { data, error } = await client.from("products").select("*").order("sort_order").order("name"); if (error) throw error; return data || []; },
      async createMany(rows) { const { data, error } = await client.from("products").insert(rows).select("*"); if (error) throw error; return data || []; },
      async update(id, patch) { const { error } = await client.from("products").update(patch).eq("id", id); if (error) throw error; },
      async remove(id) { const { error } = await client.from("products").delete().eq("id", id); if (error) throw error; }
    },
    settings: {
      async get() { const { data, error } = await client.from("store_settings").select("*").limit(1).single(); if (error) throw error; return data; },
      async update(id, patch) { const { error } = await client.from("store_settings").update(patch).eq("id", id); if (error) throw error; }
    },
    orders: {
      async list(orderNumber = null) { let q = client.from("orders").select("*").order("created_at", { ascending: false }).limit(100); if (orderNumber !== null && orderNumber !== "") q = q.eq("order_number", Number(orderNumber)); const { data, error } = await q; if (error) throw error; return data || []; },
      async get(id) { const { data, error } = await client.from("orders").select("*").eq("id", id).single(); if (error) throw error; return data; },
      async listItems(id) { const { data, error } = await client.from("order_items").select("*").eq("order_id", id).order("created_at"); if (error) throw error; return data || []; },
      async create(payload) { const { data, error } = await client.rpc("create_order", payload); if (error) throw error; return data; },
      async updatePaymentMethod(id, paymentMethod) { const { error } = await client.from("orders").update({ payment_method: paymentMethod }).eq("id", id); if (error) throw error; },
      async remove(id) { const { error } = await client.from("orders").delete().eq("id", id); if (error) throw error; }
    },
    variations: {
      async list() { const { data, error } = await client.from("product_variants").select("*").order("sort_order").order("name"); if (error) throw error; return data || []; },
      async remove(id) { const { error } = await client.from("product_variants").delete().eq("id", id); if (error) throw error; },
      async save(id, payload) { const q = id ? client.from("product_variants").update(payload).eq("id", id) : client.from("product_variants").insert(payload); const { error } = await q; if (error) throw error; }
    },
    reports: {
      async summary(from, to) {
        const start = new Date(from + "T00:00:00+05:30").toISOString();
        const end = new Date(new Date(to + "T00:00:00+05:30").getTime() + 86400000).toISOString();
        const [sales, products, payments] = await Promise.all([
          client.from("orders").select("subtotal,discount,total").eq("status","completed").gte("created_at",start).lt("created_at",end),
          client.rpc("product_sales_summary",{p_from:from,p_to:to}),
          client.from("orders").select("payment_method,total").eq("status","completed").gte("created_at",start).lt("created_at",end)
        ]);
        if (sales.error) throw sales.error; if (products.error) throw products.error; if (payments.error) throw payments.error;
        return { sales: sales.data || [], products: products.data || [], payments: payments.data || [] };
      }
    }
  };
}
