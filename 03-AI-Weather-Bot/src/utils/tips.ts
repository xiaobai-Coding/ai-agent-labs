type TipType = "info" | "success" | "warning" | "error";

let styleInjected = false;
let container: HTMLElement | null = null;

const injectStyle = () => {
  if (styleInjected) return;
  const style = document.createElement("style");
  style.textContent = `
    .tips-container{position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:10px}
    .tip{min-width:220px;max-width:70vw;background:#ffffff;color:#333;border-radius:14px;padding:12px 14px;box-shadow:0 8px 24px rgba(102,126,234,0.18);border:1px solid rgba(102,126,234,0.22);display:flex;align-items:center;gap:10px;animation:tip-enter .22s ease-out;cursor:pointer;user-select:none;backdrop-filter:saturate(140%) blur(6px)}
    .tip-info{border-left:4px solid #667eea}
    .tip-success{border-left:4px solid #10b981}
    .tip-warning{border-left:4px solid #f59e0b}
    .tip-error{border-left:4px solid #ef4444}
    .tip-icon{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;box-shadow:0 2px 8px rgba(118,75,162,0.3)}
    .tip-info .tip-icon{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}
    .tip-success .tip-icon{background:linear-gradient(135deg,#10b981 0%,#34d399 100%)}
    .tip-warning .tip-icon{background:linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%)}
    .tip-error .tip-icon{background:linear-gradient(135deg,#ef4444 0%,#f87171 100%)}
    .tip-message{font-size:14px;line-height:1.5;word-break:break-word}
    .tip:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(102,126,234,0.22)}
    @keyframes tip-enter{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes tip-leave{to{opacity:0;transform:translateY(-8px)}}
  `;
  document.head.appendChild(style);
  styleInjected = true;
};

const getContainer = () => {
  if (container && document.body.contains(container)) return container;
  const el = document.createElement("div");
  el.className = "tips-container";
  document.body.appendChild(el);
  container = el;
  return el;
};

const createTipElement = (message: string, type: TipType, duration: number) => {
  const tip = document.createElement("div");
  tip.className = `tip tip-${type}`;
  const icon = document.createElement("div");
  icon.className = "tip-icon";
  const iconText = {
    info: "i",
    success: "✓",
    warning: "!",
    error: "✕"
  }[type];
  icon.textContent = iconText;
  const text = document.createElement("div");
  text.className = "tip-message";
  text.textContent = message;
  tip.appendChild(icon);
  tip.appendChild(text);

  const remove = () => {
    tip.style.animation = "tip-leave .18s ease-in forwards";
    setTimeout(() => {
      tip.remove();
    }, 180);
  };

  tip.addEventListener("click", remove);
  setTimeout(remove, Math.max(1000, duration));
  return tip;
};

export const tips = {
  show(message: string, opts?: { type?: TipType; duration?: number }) {
    injectStyle();
    const c = getContainer();
    const type = opts?.type || "info";
    const duration = opts?.duration ?? 3000;
    const tip = createTipElement(message, type, duration);
    c.appendChild(tip);
  },
  info(message: string, duration?: number) {
    this.show(message, { type: "info", duration });
  },
  success(message: string, duration?: number) {
    this.show(message, { type: "success", duration });
  },
  warning(message: string, duration?: number) {
    this.show(message, { type: "warning", duration });
  },
  error(message: string, duration?: number) {
    this.show(message, { type: "error", duration });
  }
};
