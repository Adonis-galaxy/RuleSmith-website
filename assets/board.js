/* CivMini board renderer, shared by the project page and the promo video.
   CivBoard.prepare(game) indexes a replay from replays.js; CivBoard.svg(prepared, s, opts) returns the board at
   fractional step s as an SVG string (s = 3.4 is 40% of the way from half-turn 3 to half-turn 4). It is a pure
   function of s, so the video can render any frame and the page can scrub freely. */
(function (root) {
  const FAC = {
    E: { fill: '#3a67d9', hi: '#9fbaff', lo: '#1c3a8e', name: 'Empire' },
    N: { fill: '#15a26d', hi: '#86e6bd', lo: '#0b5a3c', name: 'Nomads' },
    F: { fill: '#6f95f0', hi: '#cddbff', lo: '#3557b5', name: 'Empire' },   // farmers: lighter Empire token
  };
  const GLYPH_FG = '#fbf4e2';
  const sideOf = id => (id === 'EC' || id[0] === 'F' || id[0] === 'S') ? 'E' : 'N';
  const isCity = id => id === 'EC' || id === 'NC';
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const prog = (u, a, b) => clamp((u - a) / (b - a));
  const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const eob = p => { const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const f2 = v => Math.round(v * 1000) / 1000;
  const NAMES = { EC: 'Empire city', NC: 'Nomads city', F: 'Farmer', S: 'Soldier', V: 'Cavalry' };
  const unitName = id => isCity(id) ? NAMES[id] : `${NAMES[id[0]]} ${id.slice(1)}`;

  // 24x24 glyphs: castle (Empire city), tent (Nomads city), wheat (farmer), shield + sword (soldier), horseshoe (cavalry)
  function glyph(id, fg, bg) {
    if (id === 'EC') return `<path d="M5 21V8h2.4v2h2.2V8h4.8v2h2.2V8H19v13z" fill="${fg}"/><path d="M10 21v-4a2 2 0 0 1 4 0v4z" fill="${bg}"/><path d="M12 8V2.4" stroke="${fg}" stroke-width="1.3"/><path d="M12.5 2.3l4.2 1.5-4.2 1.5z" fill="${fg}"/>`;
    if (id === 'NC') return `<path d="M2.4 20.6L12 5.2l9.6 15.4z" fill="${fg}"/><path d="M9.5 20.6L12 13.6l2.5 7z" fill="${bg}"/><path d="M12 5.4V1.8" stroke="${fg}" stroke-width="1.3"/><path d="M12.5 1.7l3.8 1.4-3.8 1.4z" fill="${fg}"/>`;
    if (id[0] === 'F') return `<path d="M12 21.6V7.6" stroke="${fg}" stroke-width="1.7" stroke-linecap="round"/>` +
      [9.2, 12.7, 16.2].map(y => `<ellipse cx="9.6" cy="${y}" rx="1.75" ry="3" transform="rotate(-38 9.6 ${y})" fill="${fg}"/><ellipse cx="14.4" cy="${y}" rx="1.75" ry="3" transform="rotate(38 14.4 ${y})" fill="${fg}"/>`).join('') +
      `<ellipse cx="12" cy="5" rx="1.65" ry="3" fill="${fg}"/>`;
    if (id[0] === 'S') return `<path d="M12 2.4l7.6 2.8v6c0 5.3-3.3 8.8-7.6 10.4-4.3-1.6-7.6-5.1-7.6-10.4v-6z" fill="${fg}"/><path d="M12 5.8v9.4M9.1 13.4h5.8M12 15.6v2.6" stroke="${bg}" stroke-width="1.8" stroke-linecap="round"/>`;
    return `<path d="M6.4 4.4v7.4a5.6 5.6 0 0 0 11.2 0V4.4" fill="none" stroke="${fg}" stroke-width="3.5" stroke-linecap="round"/>` +
      [[6.4, 7.2], [6.6, 10.8], [17.6, 7.2], [17.4, 10.8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".62" fill="${bg}"/>`).join('');
  }

  function piece(uid, id, x, y, o) {
    const sd = id[0] === 'F' ? 'F' : sideOf(id), f = FAC[sd], R = 0.34 * o.scale;
    if (R <= 0.001 || o.alpha <= 0.001) return '';
    let s = `<g transform="translate(${f2(x)} ${f2(y)})" opacity="${f2(o.alpha)}">`;
    if (o.ring > 0) s += `<circle r="${f2(R * 1.32)}" fill="none" stroke="${f.hi}" stroke-width=".035" opacity="${f2(o.ring)}"/>`;
    let box;
    if (isCity(id)) {
      const h = R * 1.08;
      s += `<ellipse cy="${f2(h * 1.02)}" rx="${f2(h * 1.05)}" ry="${f2(h * .26)}" fill="#000" opacity=".22"/>`;
      s += `<rect x="${f2(-h)}" y="${f2(-h * .9)}" width="${f2(2 * h)}" height="${f2(2 * h)}" rx="${f2(h * .3)}" fill="${f.lo}"/>`;
      s += `<rect x="${f2(-h)}" y="${f2(-h * 1.06)}" width="${f2(2 * h)}" height="${f2(2 * h)}" rx="${f2(h * .3)}" fill="url(#${uid}g${sd})" stroke="${f.hi}" stroke-width="${f2(h * .07)}"/>`;
      box = h * 1.62;
    } else {
      s += `<ellipse cy="${f2(R * .98)}" rx="${f2(R * .92)}" ry="${f2(R * .26)}" fill="#000" opacity=".22"/>`;
      s += `<circle r="${f2(R)}" cy="${f2(R * .1)}" fill="${f.lo}"/><circle r="${f2(R)}" fill="url(#${uid}g${sd})" stroke="${f.hi}" stroke-width="${f2(R * .075)}"/>`;
      box = R * 1.34;
    }
    s += `<g transform="translate(${f2(-box / 2)} ${f2(-box / 2 - (isCity(id) ? R * .06 : 0))}) scale(${f2(box / 24)})">${glyph(id, GLYPH_FG, f.fill)}</g>`;
    if (o.hp != null && o.hp < 0.999) {
      const w = R * 1.5, hb = 0.075, yb = R * (isCity(id) ? 1.3 : 1.22);
      const col = o.hp < 0.34 ? '#ff6b4a' : f.hi;
      s += `<rect x="${f2(-w / 2)}" y="${f2(yb)}" width="${f2(w)}" height="${hb}" rx="${hb / 2}" fill="#000" opacity=".35"/>`;
      s += `<rect x="${f2(-w / 2)}" y="${f2(yb)}" width="${f2(w * clamp(o.hp))}" height="${hb}" rx="${hb / 2}" fill="${col}"/>`;
    }
    return s + '</g>';
  }

  // Painted miniature for a unit (opts.sprites = {EC, NC, F, S, V: {href, w, h}}), standing on its cell. With the board
  // tilted in 3D, opts.upright stretches it vertically so it reads as standing up.
  const SPRITE_H = { EC: 1.28, NC: .98, F: 1.08, S: 1.16, V: 1.04 };
  function spritePiece(uid, id, x, y, o, G) {
    const key = isCity(id) ? id : id[0], sp = G.sprites[key], up = G.upright || 1, f = FAC[sideOf(id)];
    const h0 = SPRITE_H[key] * o.scale * (G.spriteScale || 1), w = h0 * sp.w / sp.h, h = h0 * up, fy = y + .3;
    if (o.alpha <= .001 || h0 <= .001) return '';
    let s = `<g opacity="${f2(o.alpha)}"><ellipse cx="${f2(x)}" cy="${f2(fy)}" rx="${f2(Math.max(w, .5) * .5)}" ry="${f2(Math.max(w, .5) * .16)}" fill="#1a1008" opacity=".32"/>`;
    if (o.ring > 0) s += `<ellipse cx="${f2(x)}" cy="${f2(fy)}" rx=".42" ry=".15" fill="none" stroke="${f.hi}" stroke-width=".05" opacity="${f2(o.ring)}"/>`;
    s += `<image href="${sp.href}" x="${f2(x - w / 2)}" y="${f2(fy - h)}" width="${f2(w)}" height="${f2(h)}" preserveAspectRatio="none"${o.ruin ? ` filter="url(#${uid}ruin)"` : ''}/>`;
    if (o.hp != null && o.hp < 0.999 && !o.ruin) {
      const bw = .56, hb = .07, col = o.hp < 0.34 ? '#ff6b4a' : f.hi;
      s += `<rect x="${f2(x - bw / 2)}" y="${f2(fy + .06)}" width="${bw}" height="${hb}" rx="${hb / 2}" fill="#000" opacity=".45"/><rect x="${f2(x - bw / 2)}" y="${f2(fy + .06)}" width="${f2(bw * clamp(o.hp))}" height="${hb}" rx="${hb / 2}" fill="${col}"/>`;
    }
    return s + '</g>';
  }

  function prepare(game) {
    const maxHp = {}, cityPos = {};
    const steps = game.steps.map(st => {
      const m = {};
      for (const [id, x, y, hp] of st.u) {
        m[id] = { x, y, hp, ox: 0, oy: 0 };
        maxHp[id] = Math.max(maxHp[id] || 0, hp);
        if (isCity(id) && !cityPos[id]) cityPos[id] = { x, y };
      }
      const cells = {};
      for (const id in m) { const k = m[id].x + ',' + m[id].y; (cells[k] = cells[k] || []).push(id); }
      for (const k in cells) {
        const ids = cells[k].filter(id => !isCity(id));
        if (ids.length > 1 || (ids.length && cells[k].some(isCity)))
          ids.forEach((id, j) => { const a = (j / Math.max(ids.length, 2)) * 2 * Math.PI + Math.PI / 4; m[id].ox = Math.cos(a) * .2; m[id].oy = Math.sin(a) * .2; });
      }
      return { t: st.t, p: st.p, m, a: st.a };
    });
    return { game, steps, maxHp, cityPos, n: steps.length - 1 };
  }

  function boardBase(uid, o) {
    const L = o.labels;
    const vb = L ? '-0.5 -0.5 7.95 7.95' : '-0.08 -0.08 7.16 7.16';
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="${o.cls || ''}" font-family="${o.font || 'Inter, sans-serif'}"${o.sprites ? ' overflow="visible"' : ''}>`;
    s += '<defs>';
    if (o.sprites) s += `<filter id="${uid}ruin"><feColorMatrix type="matrix" values=".25 .45 .1 0 0 .22 .4 .09 0 0 .2 .36 .08 0 0 0 0 0 1 0"/></filter>`;
    for (const sd of ['E', 'N', 'F']) s += `<radialGradient id="${uid}g${sd}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${FAC[sd].hi}"/><stop offset=".45" stop-color="${FAC[sd].fill}"/><stop offset="1" stop-color="${FAC[sd].lo}"/></radialGradient>`;
    s += `<radialGradient id="${uid}tE"><stop offset="0" stop-color="${FAC.E.fill}" stop-opacity=".22"/><stop offset="1" stop-color="${FAC.E.fill}" stop-opacity="0"/></radialGradient>`;
    s += `<radialGradient id="${uid}tN"><stop offset="0" stop-color="${FAC.N.fill}" stop-opacity=".22"/><stop offset="1" stop-color="${FAC.N.fill}" stop-opacity="0"/></radialGradient>`;
    s += `<radialGradient id="${uid}burst"><stop offset="0" stop-color="#fff6d8"/><stop offset=".35" stop-color="#ffc35c"/><stop offset="1" stop-color="#ff6a2b" stop-opacity="0"/></radialGradient>`;
    s += '</defs>';
    s += `<rect x="-0.06" y="-0.06" width="7.12" height="7.12" rx=".22" fill="${o.frame || '#3b2f22'}"/>`;
    s += `<rect x="0" y="0" width="7" height="7" rx=".16" fill="${o.paper || '#efe4c9'}"/>`;
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if ((x + y) % 2) s += `<rect x="${x}" y="${y}" width="1" height="1" fill="${o.paper2 || '#e5d6b4'}"/>`;
    for (let k = 1; k < 7; k++) s += `<path d="M${k} 0V7M0 ${k}H7" stroke="${o.line || '#cdb98f'}" stroke-width=".018"/>`;
    if (L) for (let k = 0; k < 7; k++) {
      s += `<text x="${k + .5}" y="-.18" font-size=".26" text-anchor="middle" fill="${o.ink || '#a08c6a'}">${k}</text>`;
      s += `<text x="-.2" y="${k + .59}" font-size=".26" text-anchor="middle" fill="${o.ink || '#a08c6a'}">${k}</text>`;
    }
    return s;
  }

  function svg(P, s, o = {}) {
    const uid = o.uid || 'cb';
    s = clamp(s, 0, P.n);
    let i = Math.floor(s), p = s - i;
    if (i >= P.n) { i = P.n; p = 0; }
    const A = P.steps[i], B = p > 0 ? P.steps[i + 1] : null;
    let out = boardBase(uid, o);
    // territory glow under each city
    for (const c of ['EC', 'NC']) { const q = P.cityPos[c]; if (q) out += `<circle cx="${q.x + .5}" cy="${q.y + .5}" r="2.3" fill="url(#${uid}t${c[0]})"/>`; }
    // ruins of destroyed cities
    const ruins = [];
    for (const c of ['EC', 'NC']) {
      const q = P.cityPos[c]; if (!q || A.m[c] && (!B || B.m[c])) continue;
      const a = A.m[c] ? prog(p, .55, .9) : 1;
      if (o.sprites) { ruins.push([q.y + .5, spritePiece(uid, c, q.x + .5, q.y + .5, { scale: .62, alpha: a * .9, ruin: true }, o)]); continue; }
      out += `<g transform="translate(${q.x + .5} ${q.y + .5})" opacity="${f2(a)}"><rect x="-.36" y="-.36" width=".72" height=".72" rx=".1" fill="#6b5f50"/><path d="M-.28 .3L-.2 -.05L-.08 .1L.02 -.22L.12 .05L.22 -.12L.3 .3z" fill="#3b332a"/><path d="M-.05 -.3L.04 -.1L-.06 .05L.06 .28" stroke="#2a241d" stroke-width=".04" fill="none"/></g>`;
    }
    const acts = B ? B.a : [];
    const lunge = {}, battles = [];
    for (const [id, k, tx, ty] of acts) if (k === 'B') { lunge[id] = [tx, ty]; battles.push([id, tx, ty]); }
    const ids = new Set(Object.keys(A.m)); if (B) for (const id in B.m) ids.add(id);
    const order = [...ids].sort((a, b) => (isCity(b) - isCity(a)));
    const fx = [], items = ruins.slice();
    for (const id of order) {
      const a = A.m[id], b = B ? B.m[id] : null, mh = P.maxHp[id] || 1;
      let x, y, scale = 1, alpha = 1, hp, ring = 0;
      if (!B) { x = a.x + a.ox; y = a.y + a.oy; hp = a.hp / mh; }
      else if (a && b) {
        const e = eio(prog(p, 0, .55));
        x = a.x + a.ox + (b.x + b.ox - a.x - a.ox) * e; y = a.y + a.oy + (b.y + b.oy - a.y - a.oy) * e;
        hp = (a.hp + (b.hp - a.hp) * prog(p, .45, .6)) / mh;
        if (b.hp < a.hp) fx.push(['dmg', a.hp - b.hp, b.x + b.ox, b.y + b.oy, p]);
      } else if (b) {
        x = b.x + b.ox; y = b.y + b.oy; hp = b.hp / mh;
        const q = prog(p, .35, .75); scale = eob(q); alpha = clamp(q * 3);
        if (q > 0 && q < 1) fx.push(['spawn', 0, x, y, q]);
      } else {
        x = a.x + a.ox; y = a.y + a.oy;
        hp = a.hp / mh * (1 - prog(p, .45, .6));
        const q = prog(p, .55, .88); alpha = 1 - q; scale = 1 + .25 * q;
        fx.push(['dmg', a.hp, x, y, p]);
      }
      if (lunge[id] && B) {
        const [tx, ty] = lunge[id], k = Math.sin(Math.PI * prog(p, .28, .72)) * .3;
        const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy) || 1;
        x += dx / d * k; y += dy / d * k;
      }
      if (B && sideOf(id) === B.p && !isCity(id)) ring = Math.sin(Math.PI * p) * .75;
      items.push([y + .5, o.sprites ? spritePiece(uid, id, x + .5, y + .5, { scale, alpha, hp, ring }, o) : piece(uid, id, x + .5, y + .5, { scale, alpha, hp, ring })]);
    }
    if (o.sprites) items.sort((a, b) => a[0] - b[0]);
    out += items.map(it => it[1]).join('');
    // battle bursts at target cells
    const lift = o.sprites ? .45 * (o.upright || 1) : 0;
    for (const [, tx0, ty0] of battles) {
      const tx = tx0, ty = ty0 - lift;
      const q = prog(p, .4, .78); if (q <= 0 || q >= 1) continue;
      const r = .18 + .42 * eio(q), al = 1 - q;
      out += `<circle cx="${tx + .5}" cy="${ty + .5}" r="${f2(r)}" fill="url(#${uid}burst)" opacity="${f2(al)}"/>`;
      let star = ''; for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4 + .3, r1 = r * .5, r2 = r * 1.15; star += `M${f2(tx + .5 + Math.cos(ang) * r1)} ${f2(ty + .5 + Math.sin(ang) * r1)}L${f2(tx + .5 + Math.cos(ang) * r2)} ${f2(ty + .5 + Math.sin(ang) * r2)}`; }
      out += `<path d="${star}" stroke="#ffd37a" stroke-width=".045" stroke-linecap="round" opacity="${f2(al)}"/>`;
    }
    // resource sparkles for gather / produce-resource
    for (const [id, k] of acts) {
      if (k !== 'G' && k !== 'R') continue;
      const u = (B && B.m[id]) || A.m[id]; if (!u) continue;
      const q = prog(p, .15, .85); if (q <= 0 || q >= 1) continue;
      const cx = u.x + u.ox + .5 + .26, cy = u.y + u.oy + .5 - .3 - .35 * q;
      out += `<g opacity="${f2(Math.sin(Math.PI * q))}"><circle cx="${f2(cx)}" cy="${f2(cy)}" r=".1" fill="#f6c453" stroke="#b9852a" stroke-width=".025"/><text x="${f2(cx)}" y="${f2(cy + .045)}" font-size=".13" font-weight="700" text-anchor="middle" fill="#7a5414">+</text></g>`;
    }
    for (const [kind, v, x, y, q] of fx) {
      if (kind === 'spawn') { out += `<circle cx="${f2(x + .5)}" cy="${f2(y + .5)}" r="${f2(.2 + .35 * q)}" fill="none" stroke="#fff3c4" stroke-width=".04" opacity="${f2(1 - q)}"/>`; continue; }
      const r = prog(q, .5, 1); if (r <= 0 || r >= 1) continue;
      const ty = y + .5 - .45 - .3 * r - lift * 1.6, up = o.upright || 1;
      out += `<text transform="translate(${f2(x + .5)} ${f2(ty)}) scale(1 ${f2(up)})" font-size=".3" font-weight="800" text-anchor="middle" fill="#ff5a36" stroke="${o.paper || '#efe4c9'}" stroke-width=".06" paint-order="stroke" opacity="${f2(1 - r * r)}">\u2212${Math.round(v * 10) / 10}</text>`;
    }
    return out + '</svg>';
  }

  // Human-readable lines for one half-turn's actions (used by the page's action feed).
  function describe(P, i) {
    const st = P.steps[i]; if (!st || !st.a) return [];
    const prev = P.steps[i - 1];
    const at = (x, y) => { if (!prev) return null; for (const id in prev.m) if (prev.m[id].x === x && prev.m[id].y === y && sideOf(id) !== st.p) return id; return null; };
    return st.a.map(([id, k, x, y]) => {
      const who = unitName(id);
      switch (k) {
        case 'M': return { side: st.p, who, what: `moves to (${x},${y})` };
        case 'B': { const t = at(x, y); return { side: st.p, who, what: `attacks ${t ? unitName(t) : `(${x},${y})`}`, hit: true }; }
        case 'G': return { side: st.p, who, what: 'gathers resources' };
        case 'R': return { side: st.p, who, what: 'produces resources' };
        case 'U': return { side: st.p, who, what: `trains a unit at (${x},${y})` };
        default: return { side: st.p, who, what: 'passes' };
      }
    });
  }

  function counts(P, i) {
    const st = P.steps[Math.min(i, P.n)], c = { E: 0, N: 0 };
    for (const id in st.m) if (!isCity(id)) c[sideOf(id)]++;
    return c;
  }

  root.CivBoard = { prepare, svg, describe, counts, FAC, glyph, sideOf, isCity, unitName };
})(typeof window !== 'undefined' ? window : globalThis);
