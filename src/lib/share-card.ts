/** Rasterizes the share card with resolved theme colors and the exact on-screen Sprout. */
export async function renderShareCard(element: HTMLElement, name: string, date: string) {
  const canvas = document.createElement("canvas"); canvas.width = 1000; canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image rendering unavailable");
  const style = getComputedStyle(element);
  ctx.fillStyle = style.backgroundColor;
  ctx.beginPath(); ctx.roundRect(0, 0, 1000, 800, [108, 108, 108, 27]); ctx.fill();
  ctx.fillStyle = style.color; ctx.textAlign = "center";
  ctx.font = '600 32px Outfit'; ctx.fillText("Clearday", 500, 95);
  ctx.fillStyle = style.getPropertyValue("--shine").trim();
  ctx.beginPath(); ctx.arc(500, 255, 130, 0, Math.PI * 2); ctx.fill();
  const svg = element.querySelector("svg[aria-label]");
  if (svg) {
    const clone = svg.cloneNode(true) as SVGElement;
    const originals = [svg, ...svg.querySelectorAll("*")];
    const copies = [clone, ...clone.querySelectorAll("*")];
    originals.forEach((node, i) => {
      const target = copies[i]; if (!target) return;
      const computed = getComputedStyle(node);
      target.setAttribute("fill", computed.fill); target.setAttribute("stroke", computed.stroke);
      target.removeAttribute("class");
    });
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], {type: "image/svg+xml"}));
    try { const image = new Image(); image.src = url; await image.decode(); ctx.drawImage(image, 380, 135, 240, 240); } finally { URL.revokeObjectURL(url); }
  }
  ctx.fillStyle = style.color;
  let size = 66; ctx.font = `700 ${size}px Outfit`;
  while (ctx.measureText(`${name}'s free day`).width > 850 && size > 24) { size -= 2; ctx.font = `700 ${size}px Outfit`; }
  ctx.fillText(`${name}'s free day`, 500, 480);
  ctx.font = '600 44px Outfit'; ctx.fillText(date, 500, 565);
  ctx.font = '600 28px Manrope'; ctx.fillText("Debt free. A new chapter begins.", 500, 675);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image unavailable")), "image/png"));
}