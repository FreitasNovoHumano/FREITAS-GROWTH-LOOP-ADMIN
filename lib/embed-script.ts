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
      const allowedIcons = ["none", "sparkles", "gift", "users", "heart", "arrow-right"];
      const allowedStyles = ["solid", "gradient", "outline", "glass"];
      const allowedPositions = ["bottom-right", "bottom-left", "top-right", "top-left"];
      const allowedAnimations = ["fade", "slide", "pulse", "none"];
      const icon = allowedIcons.includes(config.buttonIcon) ? config.buttonIcon : "none";
      const buttonStyle = allowedStyles.includes(config.buttonStyle) ? config.buttonStyle : "solid";
      const position = allowedPositions.includes(config.position) ? config.position : "bottom-right";
      const animation = allowedAnimations.includes(config.animation) ? config.animation : "fade";
      const delayMs = Number.isFinite(config.delayMs)
        ? Math.min(30000, Math.max(0, Math.round(config.delayMs)))
        : 0;
      const initiallyExpanded = config.initiallyExpanded === true;
      const primaryColor = /^#[0-9a-f]{6}$/i.test(config.primaryColor || "")
        ? config.primaryColor
        : "#7c3aed";
      const accentColor = /^#[0-9a-f]{6}$/i.test(config.accentColor || "")
        ? config.accentColor
        : "#c4b5fd";
      const buttonLabel = typeof config.buttonLabel === "string" && config.buttonLabel.trim()
        ? config.buttonLabel.trim()
        : "Participar agora";
      const iconCharacters = {
        sparkles: "✦",
        gift: "🎁",
        users: "👥",
        heart: "♥",
        "arrow-right": "→"
      };

      const host = document.createElement("div");
      host.id = widgetId;
      host.setAttribute("data-growth-loop-embed", campaign);
      host.setAttribute("data-expanded", "false");
      host.style.setProperty("--gl-primary", primaryColor);
      host.style.setProperty("--gl-accent", accentColor);
      document.body.appendChild(host);

      const root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
      const style = document.createElement("style");
      style.textContent =
        ":host{all:initial;color-scheme:light;--gl-primary:#7c3aed;--gl-accent:#c4b5fd}" +
        "*,*::before,*::after{box-sizing:border-box}" +
        ".gl-button{position:fixed;z-index:2147483000;display:inline-flex;align-items:center;justify-content:center;gap:9px;max-width:calc(100vw - 28px);min-height:50px;border:1px solid transparent;border-radius:999px;padding:13px 19px;color:#fff;font:750 14px/1.2 system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 16px 38px #0f0b1f4d,0 4px 12px #0003;cursor:pointer;transition:transform .22s ease,box-shadow .22s ease,filter .22s ease,opacity .24s ease}" +
        ".gl-button:hover{transform:translateY(-2px);filter:brightness(1.04);box-shadow:0 20px 44px #0f0b1f5c,0 6px 16px #0004}" +
        ".gl-button:active{transform:translateY(0) scale(.98)}" +
        ".gl-button:focus-visible,.gl-close:focus-visible{outline:3px solid #fff;outline-offset:3px;box-shadow:0 0 0 6px var(--gl-primary),0 18px 40px #0005}" +
        ".gl-button-icon{display:grid;place-items:center;width:20px;height:20px;flex:0 0 auto;border-radius:50%;background:#ffffff24;font:800 13px/1 system-ui}" +
        ".gl-style-solid{background:var(--gl-primary)}" +
        ".gl-style-gradient{background:linear-gradient(135deg,var(--gl-primary),var(--gl-accent))}" +
        ".gl-style-outline{border-color:var(--gl-primary);background:#17131feF;color:#fff}" +
        ".gl-style-glass{border-color:#ffffff52;background:#17131fd9;color:#fff;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}" +
        ".gl-bottom-right{right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom))}" +
        ".gl-bottom-left{left:max(18px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom))}" +
        ".gl-top-right{right:max(18px,env(safe-area-inset-right));top:max(18px,env(safe-area-inset-top))}" +
        ".gl-top-left{left:max(18px,env(safe-area-inset-left));top:max(18px,env(safe-area-inset-top))}" +
        ".gl-hidden{visibility:hidden;opacity:0;pointer-events:none}" +
        ".gl-animation-fade:not(.gl-hidden){animation:gl-fade .38s cubic-bezier(.2,.8,.2,1) both}" +
        ".gl-animation-slide:not(.gl-hidden){animation:gl-slide .42s cubic-bezier(.2,.9,.25,1) both}" +
        ".gl-animation-pulse:not(.gl-hidden){animation:gl-fade .35s ease both,gl-pulse 2.8s ease-in-out .8s 2}" +
        ".gl-overlay{position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;padding:24px;background:#100b18c7;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:gl-overlay-in .22s ease both}" +
        ".gl-dialog{position:relative;width:min(1120px,100%);height:min(760px,calc(100dvh - 48px));overflow:hidden;border:1px solid #ffffff47;border-radius:24px;background:#fff;box-shadow:0 34px 100px #0009;animation:gl-dialog-in .32s cubic-bezier(.2,.85,.25,1) both}" +
        ".gl-frame{display:block;width:100%;height:100%;border:0;background:#fff}" +
        ".gl-close{position:absolute;right:14px;top:14px;z-index:2;display:grid;place-items:center;width:42px;height:42px;border:1px solid #e8e5ed;border-radius:50%;background:#fffffff2;color:#17151f;font:500 25px/1 system-ui;box-shadow:0 8px 24px #0003;cursor:pointer;transition:transform .2s ease,background .2s ease}" +
        ".gl-close:hover{transform:rotate(4deg) scale(1.04);background:#fff}" +
        ".gl-loading{position:absolute;inset:0;display:grid;place-items:center;color:#716d7d;font:650 14px system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#fff,#f8f6fc)}" +
        ".gl-loading::before{content:\"\";width:28px;height:28px;margin-bottom:54px;border:3px solid #e7e1f2;border-top-color:var(--gl-primary);border-radius:50%;animation:gl-spin .8s linear infinite}" +
        ".gl-loading{grid-template-rows:1fr auto 1fr}" +
        "@keyframes gl-fade{from{opacity:0}to{opacity:1}}" +
        "@keyframes gl-slide{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}" +
        "@keyframes gl-pulse{0%,100%{box-shadow:0 16px 38px #0f0b1f4d,0 4px 12px #0003}50%{box-shadow:0 18px 44px #0f0b1f55,0 0 0 7px #7c3aed20}}" +
        "@keyframes gl-overlay-in{from{opacity:0}to{opacity:1}}" +
        "@keyframes gl-dialog-in{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}" +
        "@keyframes gl-spin{to{transform:rotate(360deg)}}" +
        "@media(max-width:640px){.gl-button{min-height:48px;padding:12px 17px}.gl-bottom-right,.gl-top-right{right:max(14px,env(safe-area-inset-right))}.gl-bottom-left,.gl-top-left{left:max(14px,env(safe-area-inset-left))}.gl-bottom-right,.gl-bottom-left{bottom:max(14px,env(safe-area-inset-bottom))}.gl-top-right,.gl-top-left{top:max(14px,env(safe-area-inset-top))}.gl-overlay{align-items:end;padding:0}.gl-dialog{width:100%;height:min(92dvh,820px);border-width:1px 0 0;border-radius:24px 24px 0 0}.gl-close{right:12px;top:12px}}" +
        "@media(prefers-reduced-motion:reduce){.gl-button,.gl-dialog,.gl-overlay{animation:none!important;transition:none!important}.gl-button:hover{transform:none}}";
      root.appendChild(style);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "gl-button gl-hidden gl-" + position + " gl-style-" + buttonStyle + " gl-animation-" + animation;
      button.setAttribute("aria-label", buttonLabel + " — abrir campanha " + config.name);
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-expanded", "false");
      if (icon !== "none") {
        const iconElement = document.createElement("span");
        iconElement.className = "gl-button-icon";
        iconElement.setAttribute("aria-hidden", "true");
        iconElement.textContent = iconCharacters[icon];
        button.appendChild(iconElement);
      }
      button.appendChild(document.createTextNode(buttonLabel));
      root.appendChild(button);

      let dialogOpen = false;
      const openCampaign = () => {
        if (dialogOpen) return;
        dialogOpen = true;
        host.setAttribute("data-expanded", "true");
        button.setAttribute("aria-expanded", "true");

        const overlay = document.createElement("div");
        overlay.className = "gl-overlay";

        const dialog = document.createElement("div");
        dialog.className = "gl-dialog";
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-label", config.name);
        dialog.tabIndex = -1;

        const loading = document.createElement("div");
        loading.className = "gl-loading";
        loading.textContent = "Carregando campanha...";
        const frame = document.createElement("iframe");
        frame.className = "gl-frame";
        frame.src = config.publicUrl;
        frame.title = config.name;
        frame.loading = initiallyExpanded ? "eager" : "lazy";
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
          if (!dialogOpen) return;
          dialogOpen = false;
          host.setAttribute("data-expanded", "false");
          button.setAttribute("aria-expanded", "false");
          overlay.remove();
          document.removeEventListener("keydown", onKeyDown);
          button.focus();
          window.dispatchEvent(new CustomEvent("growthloop:close", {
            detail: { campaign: config.slug }
          }));
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
        window.dispatchEvent(new CustomEvent("growthloop:open", {
          detail: { campaign: config.slug }
        }));
      };

      button.addEventListener("click", openCampaign);
      window.setTimeout(() => {
        button.classList.remove("gl-hidden");
        if (initiallyExpanded) openCampaign();
        window.dispatchEvent(new CustomEvent("growthloop:ready", {
          detail: { campaign: config.slug }
        }));
      }, delayMs);
    })
    .catch((error) => reportError(error.message || "Erro inesperado no embed.", error));
})();`;
