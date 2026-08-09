export const growthLoopEmbedScript = String.raw`(() => {
  "use strict";

  const script = document.currentScript;
  if (!script) return;

  const token = script.dataset.growthLoopToken;
  const campaign = script.dataset.growthLoopCampaign;
  const source = new URL(script.src, window.location.href);

  const reportError = (message, cause) => {
    console.error("[Growth Loop Embed] " + message, cause || "");
    window.dispatchEvent(new CustomEvent("growthloop:error", {
      detail: { message, campaign, cause }
    }));
  };

  if (!token || !campaign) {
    reportError("Token público e campanha são obrigatórios.");
    return;
  }

  const widgetId = "growth-loop-embed-" + campaign;
  if (document.getElementById(widgetId)) return;

  const endpoint = new URL("/api/public/embed", source.origin);
  endpoint.searchParams.set("token", token);
  endpoint.searchParams.set("campaign", campaign);

  fetch(endpoint, { mode: "cors", credentials: "omit", headers: { accept: "application/json" } })
    .then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || "Não foi possível carregar a campanha.");
      }
      return body;
    })
    .then((config) => {
      const host = document.createElement("div");
      host.id = widgetId;
      host.setAttribute("data-growth-loop-embed", campaign);
      document.body.appendChild(host);

      const root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
      const style = document.createElement("style");
      style.textContent =
        ":host{all:initial}" +
        ".gl-button{position:fixed;right:24px;bottom:24px;z-index:2147483000;border:0;border-radius:999px;padding:14px 20px;background:" + config.primaryColor + ";color:#fff;font:700 14px/1.2 system-ui,-apple-system,sans-serif;box-shadow:0 12px 34px #0003;cursor:pointer}" +
        ".gl-button:hover{filter:brightness(.94);transform:translateY(-1px)}" +
        ".gl-overlay{position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;padding:20px;background:#110c1bcc}" +
        ".gl-dialog{position:relative;width:min(1120px,100%);height:min(760px,92vh);overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 28px 80px #0008}" +
        ".gl-frame{width:100%;height:100%;border:0}" +
        ".gl-close{position:absolute;right:12px;top:12px;z-index:2;width:38px;height:38px;border:0;border-radius:50%;background:#fff;color:#17151f;font:700 22px/1 system-ui;box-shadow:0 4px 18px #0003;cursor:pointer}" +
        ".gl-loading{position:absolute;inset:0;display:grid;place-items:center;color:#716d7d;font:600 14px system-ui;background:#fff}" +
        "@media(max-width:640px){.gl-button{right:14px;bottom:14px}.gl-overlay{padding:0}.gl-dialog{width:100%;height:100%;border-radius:0}}";
      root.appendChild(style);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "gl-button";
      button.textContent = config.buttonLabel || ("Participar de " + config.name);
      button.setAttribute("aria-label", "Abrir campanha " + config.name);
      root.appendChild(button);

      const openCampaign = () => {
        const overlay = document.createElement("div");
        overlay.className = "gl-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", config.name);

        const dialog = document.createElement("div");
        dialog.className = "gl-dialog";
        const loading = document.createElement("div");
        loading.className = "gl-loading";
        loading.textContent = "Carregando campanha...";
        const frame = document.createElement("iframe");
        frame.className = "gl-frame";
        frame.src = config.publicUrl;
        frame.title = config.name;
        frame.loading = "lazy";
        frame.addEventListener("load", () => loading.remove());
        frame.addEventListener("error", () => {
          loading.textContent = "Não foi possível abrir a campanha.";
          reportError("Falha ao carregar a página da campanha no iframe.");
        });
        const close = document.createElement("button");
        close.type = "button";
        close.className = "gl-close";
        close.textContent = "×";
        close.setAttribute("aria-label", "Fechar campanha");

        const closeDialog = () => {
          overlay.remove();
          document.removeEventListener("keydown", onKeyDown);
          button.focus();
        };
        const onKeyDown = (event) => {
          if (event.key === "Escape") closeDialog();
        };
        close.addEventListener("click", closeDialog);
        overlay.addEventListener("click", (event) => {
          if (event.target === overlay) closeDialog();
        });
        document.addEventListener("keydown", onKeyDown);

        dialog.append(loading, frame, close);
        overlay.appendChild(dialog);
        root.appendChild(overlay);
        close.focus();
      };

      button.addEventListener("click", openCampaign);
      window.dispatchEvent(new CustomEvent("growthloop:ready", {
        detail: { campaign: config.slug }
      }));
    })
    .catch((error) => reportError(error.message || "Erro inesperado no embed.", error));
})();`;
