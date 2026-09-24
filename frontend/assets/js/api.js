// Anonymous browser profile. This is persistence isolation, not account authentication.
let browserProfile;
let accountId = "";
export const setApiAccount = id => { accountId = id || ""; };
function profileId() {
  if (browserProfile) return browserProfile;
  try { browserProfile = localStorage.getItem("maru-profile-id"); } catch {}
  if (!/^browser-[a-f0-9-]{20,60}$/.test(browserProfile || "")) {
    browserProfile = "browser-" + (crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2,"0")).join(""));
    try { localStorage.setItem("maru-profile-id", browserProfile); } catch {}
  }
  return browserProfile;
}

const JSON_HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json"
};

export function canUseBackend(){
  return typeof fetch === "function" &&
    typeof window !== "undefined" &&
    window.location &&
    window.location.protocol !== "file:";
}

async function request(path, options){
  if(!canUseBackend()) throw new Error("Backend indisponivel");
  const res = await fetch(path, Object.assign({
    headers: { ...JSON_HEADERS, "x-maru-user": profileId(), ...(accountId ? { "x-maru-account": accountId } : {}) },
    signal: AbortSignal.timeout(5000),
    keepalive: !options?.body || new TextEncoder().encode(options.body).byteLength < 60000
  }, options || {}));

  if(!res.ok){
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || "Não foi possível concluir a solicitação."), { status: res.status });
  }

  if(res.status === 204) return null;
  return res.json();
}
export const getAccount = () => request("/api/account");
export const signOut = () => request("/api/auth/logout", { method: "POST" });
const authPost = (path, body) => request("/api/auth/email/" + path, {
  method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(15000)
});
export const signUpWithEmail = (email, password) => authPost("signup", { email, password });
export const signInWithEmail = (email, password) => authPost("login", { email, password });
export const recoverEmail = email => authPost("recover", { email });
export const completeEmailLink = refreshToken => authPost("complete", { refreshToken });
export const changeEmailPassword = password => authPost("password", { password });

export function getProgress(){
  return request("/api/progress");
}

export function saveProgress(snapshot){
  return request("/api/progress", {
    method: "PUT",
    body: JSON.stringify(snapshot)
  });
}

export function checkPhrase(payload){
  return request("/api/phrase/check", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
