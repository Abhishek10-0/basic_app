export const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function template(
  title: string,
  rows: Record<string, unknown>,
  logoUrl: string,
) {
  return `<div style="font-family:Arial;max-width:620px;margin:auto;color:#152b48;border:1px solid #dce4ee"><div style="background:#123667;padding:24px;color:white"><img alt="SME Chamber of India" width="64" src="${escapeHtml(logoUrl)}"><h2>${escapeHtml(title)}</h2></div><div style="padding:24px">${Object.entries(
    rows,
  )
    .map(
      ([k, v]) => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</p>`,
    )
    .join(
      "",
    )}<hr><p>SME Chamber of India ? Empowering SMEs. Building India.</p></div></div>`;
}
