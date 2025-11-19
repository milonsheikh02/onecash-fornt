var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-n5tR1z/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// index.js
var ETHERSCAN_API_KEY = "PGMJTCIY14W8IT81NYR557NIDDUUU9Z5C1";
var ADMIN_USERNAME = "admin";
var ADMIN_PASSWORD = "password123";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};
var orders = /* @__PURE__ */ new Map();
var userBalances = /* @__PURE__ */ new Map();
var adminData = {
  orders: [],
  wallets: [],
  transactions: []
};
var exchangeRates = {
  "BTC": 89,270.25,
  // 1 BTC = 89,270.25 USDT
  "ETH": 2,900.45
  // 1 ETH = 2,900.45 USDT
  "TRX": 0.28210
  // 1 TRX = 0.28210 USDT
};
function handleOptions(request) {
  return new Response(null, {
    headers: corsHeaders
  });
}
__name(handleOptions, "handleOptions");
function handleHealthCheck() {
  return new Response(JSON.stringify({
    success: true,
    message: "ONE\u26A1CASH Payment API is running",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
__name(handleHealthCheck, "handleHealthCheck");
function generateOrderId() {
  return "ORD" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}
__name(generateOrderId, "generateOrderId");
function generateUserId() {
  return "USER" + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
}
__name(generateUserId, "generateUserId");
function getUserBalance(userId, currency) {
  if (!userBalances.has(userId)) {
    userBalances.set(userId, {});
  }
  const balances = userBalances.get(userId);
  return balances[currency] || 0;
}
__name(getUserBalance, "getUserBalance");
function updateUserBalance(userId, currency, amount) {
  if (!userBalances.has(userId)) {
    userBalances.set(userId, {});
  }
  const balances = userBalances.get(userId);
  balances[currency] = (balances[currency] || 0) + amount;
  if (balances[currency] < 0) {
    balances[currency] = 0;
  }
  userBalances.set(userId, balances);
  return balances[currency];
}
__name(updateUserBalance, "updateUserBalance");
function performInternalSwap(userId, fromCoin, fromAmount, toCoin, toAmount) {
  updateUserBalance(userId, fromCoin, -fromAmount);
  updateUserBalance(userId, toCoin, toAmount);
  return {
    success: true,
    fromCoin,
    fromAmount,
    toCoin,
    toAmount,
    userId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(performInternalSwap, "performInternalSwap");
async function checkTronTransactions(address) {
  try {
    const url = `https://apilist.tronscan.org/api/transaction?address=${address}&limit=50`;
    const response = await fetch(url);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error checking Tron transactions:", error);
    return [];
  }
}
__name(checkTronTransactions, "checkTronTransactions");
async function checkBitcoinTransactions(address) {
  try {
    const url = `https://blockchain.info/rawaddr/${address}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.txs || [];
  } catch (error) {
    console.error("Error checking Bitcoin transactions:", error);
    return [];
  }
}
__name(checkBitcoinTransactions, "checkBitcoinTransactions");
async function checkEthereumTransactions(address, startBlock = 0) {
  try {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "1" && data.message === "OK") {
      return data.result || [];
    }
    return [];
  } catch (error) {
    console.error("Error checking Ethereum transactions:", error);
    return [];
  }
}
__name(checkEthereumTransactions, "checkEthereumTransactions");
function generatePaymentAddress(coin, userId, orderId) {
  const mainWallets = {
    "BTC": "bc1qk263esw8mxpcmmml0mus7nfnscp9fryyqqzgwq",
    "ETH": "0x2bb183CC12315a2acd0bfA89e815E1fC2C58815B",
    "TRX": "TUop15AqkgbB7uXjiHDp1XDpDfBJEQUB7w"
  };
  const mainWallet = mainWallets[coin] || "0x0000000000000000000000000000000000000000";
  const prefixes = {
    "BTC": "bc1",
    "ETH": "0x",
    "TRX": "T"
  };
  const prefix = prefixes[coin] || "0x";
  const seed = `${mainWallet}${userId}${coin}${orderId || ""}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  let address = prefix;
  if (coin === "ETH") {
    const hexChars = "0123456789abcdef";
    for (let i = 0; i < 40; i++) {
      const index = (hash + i) % hexChars.length;
      address += hexChars.charAt(Math.abs(index));
    }
  } else {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const length = coin === "BTC" ? 42 : coin === "ETH" ? 40 : coin === "TRX" ? 34 : 40;
    for (let i = 0; i < length - prefix.length; i++) {
      const index = (hash + i) % chars.length;
      address += chars.charAt(Math.abs(index));
    }
  }
  return address;
}
__name(generatePaymentAddress, "generatePaymentAddress");
async function createOrder(request) {
  try {
    const data = await request.json();
    if (!data.sendCoin || !data.sendAmount || !data.receiveMethod || !data.receiveWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const userId = data.userId || generateUserId();
    const orderId = generateOrderId();
    const paymentAddress = generatePaymentAddress(data.sendCoin, userId, orderId);
    const exchangeRate = exchangeRates[data.sendCoin] || 5e4;
    const usdValue = parseFloat(data.sendAmount) * exchangeRate;
    let receiveCoin = "USDT";
    if (data.receiveMethod.includes("TRC20")) {
      receiveCoin = "USDT_TRC20";
    } else if (data.receiveMethod.includes("ERC20")) {
      receiveCoin = "USDT_ERC20";
    }
    const order = {
      id: Date.now(),
      // Simple ID for demo
      order_id: orderId,
      user_id: userId,
      send_network: data.sendCoin,
      receive_network: receiveCoin,
      send_amount: parseFloat(data.sendAmount),
      receive_amount: usdValue,
      // For simplicity, 1 USD = 1 USDT
      deposit_address: paymentAddress,
      status: "pending",
      confirmations: 0,
      tx_hash: "",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1e3).toISOString()
      // 10 minutes from now
    };
    orders.set(orderId, order);
    adminData.orders.push({
      id: order.id,
      order_id: order.order_id,
      send_network: order.send_network,
      receive_network: order.receive_network,
      send_amount: order.send_amount,
      receive_amount: order.receive_amount,
      deposit_address: order.deposit_address,
      status: order.status,
      confirmations: order.confirmations,
      tx_hash: order.tx_hash,
      created_at: order.created_at
    });
    return new Response(JSON.stringify({
      success: true,
      order
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(createOrder, "createOrder");
async function getOrder(request, env, orderId) {
  try {
    const order = orders.get(orderId);
    if (!order) {
      return new Response(JSON.stringify({
        success: false,
        error: "Order not found"
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      order
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to retrieve order: " + error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(getOrder, "getOrder");
async function updateOrderStatus(request, env, orderId) {
  try {
    const data = await request.json();
    const order = orders.get(orderId);
    if (!order) {
      return new Response(JSON.stringify({
        success: false,
        error: "Order not found"
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const oldStatus = order.status;
    order.status = data.status;
    orders.set(orderId, order);
    if (oldStatus !== "paid" && data.status === "paid") {
      const swapResult = performInternalSwap(
        order.user_id,
        order.send_network,
        order.send_amount,
        order.receive_network,
        order.receive_amount
      );
      console.log("Internal swap performed:", swapResult);
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Order status updated"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(updateOrderStatus, "updateOrderStatus");
var index_default = {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }
    const url = new URL(request.url);
    const path = url.pathname;
    console.log("Request method:", request.method);
    console.log("Request path:", path);
    console.log("Path length:", path.length);
    console.log("Path parts:", path.split("/"));
    if (request.method === "GET" && path === "/health") {
      console.log("Matched GET /health route");
      return handleHealthCheck();
    } else if (request.method === "GET" && path === "/test") {
      console.log("Matched GET /test route");
      return new Response(JSON.stringify({
        success: true,
        message: "Test endpoint working"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else if (request.method === "GET" && path === "/test-swap") {
      console.log("Matched GET /test-swap route");
      const testUserId = "TEST_USER";
      const initialBalance = getUserBalance(testUserId, "BTC");
      const swapResult = performInternalSwap(testUserId, "BTC", 0.1, "USDT", 5e3);
      const finalBalance = {
        BTC: getUserBalance(testUserId, "BTC"),
        USDT: getUserBalance(testUserId, "USDT")
      };
      return new Response(JSON.stringify({
        success: true,
        message: "Test swap completed",
        initialBalance,
        swapResult,
        finalBalance
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else if (request.method === "POST" && path === "/api/order") {
      console.log("Matched POST /api/order route");
      return createOrder(request);
    } else if (request.method === "GET" && path.startsWith("/api/order/")) {
      const pathParts = path.split("/");
      const orderId = pathParts[3];
      console.log("Matched GET /api/order/ route, pathParts:", pathParts, "orderId:", orderId);
      return getOrder(request, env, orderId);
    } else if (request.method === "PUT" && path.startsWith("/api/order/")) {
      const pathParts = path.split("/");
      const orderId = pathParts[3];
      console.log("Matched PUT /api/order/ route, pathParts:", pathParts, "orderId:", orderId);
      return updateOrderStatus(request, env, orderId);
    } else if (request.method === "GET" && path.startsWith("/api/user/")) {
      const pathParts = path.split("/");
      const userId = pathParts[3];
      console.log("Matched GET /api/user/ route, pathParts:", pathParts, "userId:", userId);
      if (pathParts[4] === "balance") {
        const balances = userBalances.get(userId) || {};
        return new Response(JSON.stringify({
          success: true,
          userId,
          balances
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } else if (request.method === "GET" && path.startsWith("/api/check-payment/")) {
      const pathParts = path.split("/");
      const orderId = pathParts[3];
      console.log("Matched GET /api/check-payment/ route, pathParts:", pathParts, "orderId:", orderId);
      const order = orders.get(orderId);
      if (!order) {
        return new Response(JSON.stringify({
          success: false,
          error: "Order not found"
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      let transactions = [];
      if (order.send_network === "BTC") {
        transactions = await checkBitcoinTransactions(order.deposit_address);
      } else if (order.send_network === "ETH") {
        transactions = await checkEthereumTransactions(order.deposit_address);
      } else if (order.send_network === "TRX") {
        transactions = await checkTronTransactions(order.deposit_address);
      }
      const paymentInfo = {
        orderId,
        expectedAmount: order.send_amount,
        receivedAmount: 0,
        transactions: transactions.length,
        status: "pending"
      };
      return new Response(JSON.stringify({
        success: true,
        paymentInfo
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else if (request.method === "GET" && path === "/api/admin/data") {
      console.log("Matched GET /api/admin/data route");
      const auth = request.headers.get("Authorization");
      if (!auth || !auth.startsWith("Basic ")) {
        return new Response("Unauthorized", {
          status: 401,
          headers: {
            ...corsHeaders,
            "WWW-Authenticate": 'Basic realm="Admin Panel"'
          }
        });
      }
      const credentials = atob(auth.split(" ")[1]);
      const [username, password] = credentials.split(":");
      const adminUsername = ADMIN_USERNAME;
      const adminPassword = ADMIN_PASSWORD;
      if (username !== adminUsername || password !== adminPassword) {
        return new Response("Unauthorized", {
          status: 401,
          headers: {
            ...corsHeaders,
            "WWW-Authenticate": 'Basic realm="Admin Panel"'
          }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        data: adminData
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else if (request.method === "GET" && path === "/admin") {
      console.log("Matched GET /admin route");
      const auth = request.headers.get("Authorization");
      if (!auth || !auth.startsWith("Basic ")) {
        return new Response("Unauthorized", {
          status: 401,
          headers: {
            ...corsHeaders,
            "WWW-Authenticate": 'Basic realm="Admin Panel"'
          }
        });
      }
      const credentials = atob(auth.split(" ")[1]);
      const [username, password] = credentials.split(":");
      const adminUsername = ADMIN_USERNAME;
      const adminPassword = ADMIN_PASSWORD;
      if (username !== adminUsername || password !== adminPassword) {
        return new Response("Unauthorized", {
          status: 401,
          headers: {
            ...corsHeaders,
            "WWW-Authenticate": 'Basic realm="Admin Panel"'
          }
        });
      }
      return new Response("Admin panel endpoint - in production, this would serve the admin.html file", {
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    } else {
      console.log("No route matched");
      return new Response(JSON.stringify({
        success: false,
        error: "Route not found: " + request.method + " " + path
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};

// C:/Users/RATUL/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/RATUL/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-n5tR1z/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = index_default;

// C:/Users/RATUL/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-n5tR1z/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
