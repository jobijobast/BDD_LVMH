#!/usr/bin/env node
/**
 * LVMH Voice-to-Tag — Site Testing Agent
 * Tests: visual screenshots, static analysis, cross-file ID consistency, JS errors
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SCREENSHOTS_DIR = path.join(ROOT, 'test_screenshots');
const REPORT_FILE = path.join(ROOT, 'test_report.md');
const BASE_URL = 'http://localhost:8080';
const CHROMIUM = (() => {
  try {
    const r = execSync('find ~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64 -name "Google Chrome for Testing" -not -path "*.framework*" 2>/dev/null | head -1', { shell: '/bin/zsh' });
    return r.toString().trim();
  } catch { return null; }
})();

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const issues = { critical: [], warning: [], info: [] };
const screenshots = [];

function addIssue(level, category, message) {
  issues[level].push({ category, message });
}

// ═══════════════════════════════════════════════════════
// 1. SCREENSHOTS — Login page + app shell states
// ═══════════════════════════════════════════════════════
function takeScreenshot(url, filename, jsToInject = '', width = 1440, height = 900) {
  if (!CHROMIUM) { console.log('  ⚠ Chromium not found, skipping screenshot'); return false; }
  const outPath = path.join(SCREENSHOTS_DIR, filename);
  try {
    // Use --virtual-time-budget for faster rendering
    const cmd = `"${CHROMIUM}" --headless --no-sandbox --disable-gpu --window-size=${width},${height} --screenshot="${outPath}" "${url}" 2>/dev/null`;
    execSync(cmd, { timeout: 12000, shell: '/bin/zsh' });
    screenshots.push({ file: filename, url });
    console.log(`  ✓ ${filename}`);
    return true;
  } catch (e) {
    console.log(`  ✗ ${filename} — ${e.message.substring(0, 80)}`);
    return false;
  }
}

function takeScreenshotWithJS(jsCode, filename, width = 1440, height = 900) {
  // Write a standalone HTML that injects state and redirects
  const htmlPath = path.join(SCREENSHOTS_DIR, `_inject_${Date.now()}.html`);
  const outPath = path.join(SCREENSHOTS_DIR, filename);
  if (!CHROMIUM) return false;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<script>
// Pre-inject localStorage state before the app loads
${jsCode}
window.location.href = '${BASE_URL}';
</script></head><body></body></html>`;
  fs.writeFileSync(htmlPath, html);

  try {
    const cmd = `"${CHROMIUM}" --headless --no-sandbox --disable-gpu --window-size=${width},${height} --screenshot="${outPath}" "file://${htmlPath}" 2>/dev/null`;
    execSync(cmd, { timeout: 12000, shell: '/bin/zsh' });
    screenshots.push({ file: filename, url: 'injected-state' });
    console.log(`  ✓ ${filename}`);
    fs.unlinkSync(htmlPath);
    return true;
  } catch (e) {
    console.log(`  ✗ ${filename} — ${e.message.substring(0, 80)}`);
    if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
    return false;
  }
}

function getDOMContent(url) {
  if (!CHROMIUM) return '';
  try {
    const cmd = `"${CHROMIUM}" --headless --no-sandbox --disable-gpu --dump-dom "${url}" 2>/dev/null`;
    return execSync(cmd, { timeout: 8000, shell: '/bin/zsh' }).toString();
  } catch { return ''; }
}

// ═══════════════════════════════════════════════════════
// 2. STATIC ANALYSIS — HTML
// ═══════════════════════════════════════════════════════
function analyzeHTML() {
  console.log('\n[HTML Analysis]');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  // Extract all IDs defined in HTML (exclude HTML comments)
  const htmlNoComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const htmlIds = new Set();
  const idMatches = htmlNoComments.matchAll(/\bid=["']([^"']+)["']/g);
  for (const m of idMatches) htmlIds.add(m[1]);
  console.log(`  IDs définis dans index.html: ${htmlIds.size}`);

  // Check for duplicate IDs (strip comments first)
  const idCount = {};
  for (const m of htmlNoComments.matchAll(/\bid=["']([^"']+)["']/g)) {
    idCount[m[1]] = (idCount[m[1]] || 0) + 1;
  }
  const duplicateIds = Object.entries(idCount).filter(([, c]) => c > 1);
  if (duplicateIds.length > 0) {
    duplicateIds.forEach(([id, count]) => {
      addIssue('critical', 'HTML', `ID dupliqué: "${id}" apparaît ${count} fois`);
    });
    console.log(`  ✗ ${duplicateIds.length} IDs dupliqués détectés`);
  } else {
    console.log(`  ✓ Pas d'IDs dupliqués`);
  }

  // Check for unclosed tags (basic)
  const openTags = (html.match(/<div[^>]*>/g) || []).length;
  const closeTags = (html.match(/<\/div>/g) || []).length;
  if (openTags !== closeTags) {
    addIssue('warning', 'HTML', `Déséquilibre <div>: ${openTags} ouvrants vs ${closeTags} fermants`);
    console.log(`  ⚠ <div> déséquilibré: ${openTags} open / ${closeTags} close`);
  } else {
    console.log(`  ✓ <div> équilibrés (${openTags})`);
  }

  // Check page-canvas pages
  // Only match div/section tags, not CSS class definitions or comments
  const canvasPages = htmlNoComments.matchAll(/<(?:div|section|main)[^>]+id="(page-[^"]+)"[^>]+class="([^"]+)"|<(?:div|section|main)[^>]+class="([^"]+)"[^>]+id="(page-[^"]+)"/g);
  let pageCount = 0;
  const pagesWithCanvas = [];
  const pagesWithoutCanvas = [];
  // Known IDs that start with "page-" but are NOT page containers
  const nonPageIds = new Set(['page-badge', 'page-header', 'page-header-actions', 'page-title', 'page-subtitle']);
  for (const m of canvasPages) {
    pageCount++;
    const id = m[1] || m[4];
    const cls = m[2] || m[3];
    if (!id || nonPageIds.has(id)) continue;
    if (cls && cls.includes('page-canvas')) pagesWithCanvas.push(id);
    else pagesWithoutCanvas.push(id);
  }
  if (pagesWithoutCanvas.length > 0) {
    pagesWithoutCanvas.forEach(id => {
      addIssue('warning', 'HTML', `Page "${id}" manque la classe "page-canvas"`);
    });
    console.log(`  ⚠ ${pagesWithoutCanvas.length} pages sans .page-canvas: ${pagesWithoutCanvas.join(', ')}`);
  } else {
    console.log(`  ✓ Toutes les pages (${pageCount}) ont la classe "page-canvas"`);
  }

  // Check forms have proper IDs
  const formIds = ['loginForm', 'addSellerForm'];
  formIds.forEach(id => {
    if (!htmlIds.has(id)) addIssue('critical', 'HTML', `Formulaire manquant: id="${id}"`);
  });

  // Check critical containers
  const criticalIds = [
    'appShell', 'loginPage', 'sidebar', 'sidebarNav', 'menuToggle',
    'pageTitle', 'boutiqueNameDisplay', 'userNameDisplay', 'userRoleDisplay',
    'logoutBtn', 'loading', 'toastContainer', 'mobileNav',
    'page-v-home', 'page-clients', 'page-nba', 'page-products',
    'page-v-brief', 'page-followup', 'page-coach',
    'page-m-dashboard', 'page-m-privacy', 'page-m-sentiment',
    'page-m-boutique', 'page-m-pulse', 'page-m-import', 'page-m-team', 'page-admin'
  ];
  const missingIds = criticalIds.filter(id => !htmlIds.has(id));
  if (missingIds.length > 0) {
    missingIds.forEach(id => addIssue('critical', 'HTML', `ID critique manquant dans index.html: "${id}"`));
    console.log(`  ✗ IDs critiques manquants: ${missingIds.join(', ')}`);
  } else {
    console.log(`  ✓ Tous les IDs critiques présents`);
  }

  return htmlIds;
}

// ═══════════════════════════════════════════════════════
// 3. STATIC ANALYSIS — JS cross-reference
// ═══════════════════════════════════════════════════════
function analyzeJS(htmlIds) {
  console.log('\n[JS Analysis]');
  const files = ['app.js', 'engine.js'];

  files.forEach(filename => {
    const filePath = path.join(ROOT, filename);
    if (!fs.existsSync(filePath)) {
      addIssue('critical', 'JS', `Fichier manquant: ${filename}`);
      return;
    }
    const js = fs.readFileSync(filePath, 'utf8');

    // Check syntax (basic — node --check)
    try {
      execSync(`node --check "${filePath}" 2>&1`, { timeout: 5000 });
      console.log(`  ✓ ${filename}: syntaxe OK`);
    } catch (e) {
      addIssue('critical', 'JS', `Erreur syntaxe ${filename}: ${e.stdout?.toString().substring(0, 120) || e.message.substring(0, 120)}`);
      console.log(`  ✗ ${filename}: erreur syntaxe`);
    }

    // Check getElementById / $() references
    const getByIdRefs = [...js.matchAll(/(?:getElementById|[$])\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
    const missingRefs = getByIdRefs.filter(id => !htmlIds.has(id));
    if (missingRefs.length > 0) {
      // Filter known false positives (dynamic IDs, etc.)
      const realMissing = missingRefs.filter(id =>
        !id.startsWith('nav-') &&
        !id.startsWith('ck-') &&
        !id.includes('-') === false // keep compound IDs that seem static
      );
      const uniqueMissing = [...new Set(missingRefs)];
      if (uniqueMissing.length > 0) {
        // Only flag as warning not critical (some IDs are dynamically generated)
        uniqueMissing.slice(0, 10).forEach(id => {
          addIssue('warning', `JS:${filename}`, `getElementById("${id}") — ID absent de index.html (peut être dynamique)`);
        });
        console.log(`  ⚠ ${filename}: ${uniqueMissing.length} refs getElementById potentiellement manquantes`);
      }
    } else {
      console.log(`  ✓ ${filename}: toutes les refs getElementById trouvées`);
    }

    // Check for console.error patterns (debugging left in)
    const consoleLogs = (js.match(/console\.(log|warn|error)\(/g) || []).length;
    if (consoleLogs > 20) {
      addIssue('info', `JS:${filename}`, `${consoleLogs} console.log/warn/error — à nettoyer avant démo`);
    }
  });

  // Check page IDs in VENDEUR_NAV / MANAGER_NAV match HTML
  // Only match inside the NAV definition arrays (before the first function definition)
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  // Extract only the nav definition blocks (up to first 'function ')
  const navBlock = appJs.substring(0, appJs.indexOf('\nfunction ') || appJs.length);
  const navPageRefs = [...navBlock.matchAll(/page:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const missingNavPages = navPageRefs.filter(id => !htmlIds.has(id));
  if (missingNavPages.length > 0) {
    missingNavPages.forEach(id => addIssue('critical', 'NAV', `Page de navigation introuvable dans HTML: "${id}"`));
    console.log(`  ✗ Pages nav manquantes dans HTML: ${missingNavPages.join(', ')}`);
  } else {
    console.log(`  ✓ Toutes les pages des menus nav existent dans HTML (${navPageRefs.length} pages)`);
  }
}

// ═══════════════════════════════════════════════════════
// 4. STATIC ANALYSIS — CSS
// ═══════════════════════════════════════════════════════
function analyzeCSS() {
  console.log('\n[CSS Analysis]');
  const cssPath = path.join(ROOT, 'index.css');
  if (!fs.existsSync(cssPath)) {
    addIssue('critical', 'CSS', 'index.css introuvable');
    return;
  }
  const css = fs.readFileSync(cssPath, 'utf8');
  const lines = css.split('\n').length;
  console.log(`  index.css: ${lines} lignes`);

  // Check critical CSS classes referenced in new layout
  const criticalClasses = [
    'icon-rail', 'app-body', 'page-canvas', 'page-header',
    'top-nav', 'rail-icon', 'rail-footer', 'rail-avatar'
  ];

  const inHtmlStyle = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const inlineStyle = (inHtmlStyle.match(/<style>([\s\S]*?)<\/style>/i) || ['', ''])[1];

  criticalClasses.forEach(cls => {
    const inCss = css.includes(`.${cls}`) || css.includes(`${cls}`);
    const inInline = inlineStyle.includes(`.${cls}`);
    if (!inCss && !inInline) {
      addIssue('warning', 'CSS', `Classe "${cls}" non définie dans index.css ni dans <style> inline`);
      console.log(`  ⚠ Classe manquante: .${cls}`);
    }
  });

  // Check for :root CSS variables
  const cssVars = ['--gold', '--sidebar-bg', '--content-bg', '--font-display', '--font-body'];
  const missingVars = cssVars.filter(v => !css.includes(v));
  if (missingVars.length > 0) {
    missingVars.forEach(v => addIssue('warning', 'CSS', `Variable CSS manquante dans :root: ${v}`));
    console.log(`  ⚠ Variables :root manquantes: ${missingVars.join(', ')}`);
  } else {
    console.log(`  ✓ Variables :root présentes`);
  }

  // Check for old layout classes that may conflict
  const oldClasses = ['sidebar', 'main-content', 'app-header'];
  oldClasses.forEach(cls => {
    if (css.includes(`.${cls}`)) {
      addIssue('info', 'CSS', `Ancienne classe ".${cls}" encore définie dans index.css — vérifier conflit avec nouveau layout`);
    }
  });

  // Check CSS syntax (unclosed braces)
  let openBraces = (css.match(/\{/g) || []).length;
  let closeBraces = (css.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    addIssue('critical', 'CSS', `Accolades déséquilibrées: ${openBraces} { vs ${closeBraces} }`);
    console.log(`  ✗ Accolades déséquilibrées: ${openBraces} open / ${closeBraces} close`);
  } else {
    console.log(`  ✓ Accolades CSS équilibrées (${openBraces})`);
  }
}

// ═══════════════════════════════════════════════════════
// 5. DESIGN VISUAL CHECK — Screenshots
// ═══════════════════════════════════════════════════════
function takeScreenshots() {
  console.log('\n[Screenshots]');
  if (!CHROMIUM) {
    console.log('  ✗ Chromium non disponible');
    addIssue('warning', 'Screenshots', 'Chromium non disponible pour les screenshots');
    return;
  }

  // Login page — full desktop
  takeScreenshot(BASE_URL, 'login_desktop_1440.png', '', 1440, 900);
  // Login page — mobile
  takeScreenshot(BASE_URL, 'login_mobile_390.png', '', 390, 844);
  // Login page — tablet
  takeScreenshot(BASE_URL, 'login_tablet_768.png', '', 768, 1024);
}

// ═══════════════════════════════════════════════════════
// 6. CONNECTIVITY CHECK
// ═══════════════════════════════════════════════════════
function checkConnectivity() {
  console.log('\n[Connectivity]');
  try {
    const result = execSync(`curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}" --max-time 3`, { timeout: 5000 });
    const code = result.toString().trim();
    if (code === '200') {
      console.log(`  ✓ Frontend accessible: ${BASE_URL} (HTTP ${code})`);
      addIssue('info', 'Connectivity', `Frontend OK: ${BASE_URL}`);
    } else {
      addIssue('critical', 'Connectivity', `Frontend retourne HTTP ${code}`);
      console.log(`  ✗ Frontend HTTP ${code}`);
    }
  } catch {
    addIssue('critical', 'Connectivity', `Frontend inaccessible: ${BASE_URL}`);
    console.log(`  ✗ Frontend inaccessible`);
  }

  // Backend
  try {
    const result = execSync(`curl -s -o /dev/null -w "%{http_code}" "http://localhost:5001/api/process" -X POST --max-time 3`, { timeout: 5000 });
    const code = result.toString().trim();
    console.log(`  ✓ Backend Flask port 5001 accessible (HTTP ${code})`);
  } catch {
    addIssue('warning', 'Connectivity', 'Backend Flask (port 5001) inaccessible — IA et Supabase non testables');
    console.log(`  ⚠ Backend Flask inaccessible (normal si non démarré)`);
  }

  // Check static assets
  const assets = ['index.css', 'engine.js', 'app.js', 'bg-luxury.png'];
  assets.forEach(asset => {
    try {
      const code = execSync(`curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/${asset}" --max-time 3`, { timeout: 5000 }).toString().trim();
      if (code === '200') {
        console.log(`  ✓ ${asset} (HTTP 200)`);
      } else {
        addIssue('warning', 'Assets', `Asset "${asset}" retourne HTTP ${code}`);
        console.log(`  ⚠ ${asset} HTTP ${code}`);
      }
    } catch {
      addIssue('warning', 'Assets', `Asset "${asset}" inaccessible`);
      console.log(`  ✗ ${asset} inaccessible`);
    }
  });
}

// ═══════════════════════════════════════════════════════
// 7. DESIGN AUDIT — Visual analysis of screenshots
// ═══════════════════════════════════════════════════════
function designAudit() {
  console.log('\n[Design Audit — auto-detection]');

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'index.css'), 'utf8');

  // Check if bg-luxury.png is referenced in CSS for login
  if (!css.includes('bg-luxury') && !html.includes('bg-luxury')) {
    addIssue('warning', 'Design', 'bg-luxury.png non référencé — fond login peut être absent');
  }

  // Check for responsive breakpoints
  const hasMediaQueries = (css.match(/@media/g) || []).length;
  if (hasMediaQueries < 3) {
    addIssue('warning', 'Design', `Seulement ${hasMediaQueries} media queries dans index.css — responsive limité`);
    console.log(`  ⚠ ${hasMediaQueries} media queries`);
  } else {
    console.log(`  ✓ ${hasMediaQueries} media queries`);
  }

  // Check icon-rail is defined in <style> inline
  if (!html.includes('.icon-rail')) {
    addIssue('critical', 'Design', 'Styles .icon-rail manquants — rail invisible');
    console.log(`  ✗ .icon-rail non défini dans <style>`);
  } else {
    console.log(`  ✓ .icon-rail défini inline`);
  }

  // Check .app-shell display flex in inline style or CSS
  const appShellFlex = html.includes('display: flex') || css.match(/\.app-shell\s*\{[^}]*display\s*:\s*flex/);
  if (!appShellFlex) {
    addIssue('warning', 'Design', '.app-shell flex layout peut ne pas être appliqué');
  }

  // Check page-canvas overflow
  if (!html.includes('overflow-y: auto') && !css.includes('overflow-y: auto')) {
    addIssue('warning', 'Design', 'page-canvas scroll (overflow-y:auto) non détecté');
  }

  // Check font loading
  if (!html.includes('Cormorant+Garamond') && !html.includes('Cormorant Garamond')) {
    addIssue('warning', 'Design', 'Font Cormorant Garamond non chargée');
  } else {
    console.log(`  ✓ Fonts Google (Cormorant Garamond + DM Sans) chargées`);
  }

  // Check gold color token
  if (!css.includes('#B8965A') && !css.includes('--gold')) {
    addIssue('warning', 'Design', 'Token --gold (#B8965A) non défini dans index.css');
  } else {
    console.log(`  ✓ Token --gold défini`);
  }
}

// ═══════════════════════════════════════════════════════
// 8. GENERATE REPORT
// ═══════════════════════════════════════════════════════
function generateReport() {
  console.log('\n[Report Generation]');
  const date = new Date().toLocaleString('fr-FR');
  const total = issues.critical.length + issues.warning.length + issues.info.length;

  let report = `# Rapport de Test — LVMH Voice-to-Tag
> Généré le ${date} · ${total} points détectés

---

## Résumé

| Niveau | Nombre |
|--------|--------|
| 🔴 Critique | ${issues.critical.length} |
| 🟡 Avertissement | ${issues.warning.length} |
| 🔵 Info | ${issues.info.length} |

---

`;

  if (issues.critical.length > 0) {
    report += `## 🔴 Problèmes Critiques (${issues.critical.length})\n\n`;
    issues.critical.forEach(i => {
      report += `- **[${i.category}]** ${i.message}\n`;
    });
    report += '\n---\n\n';
  }

  if (issues.warning.length > 0) {
    report += `## 🟡 Avertissements (${issues.warning.length})\n\n`;
    issues.warning.forEach(i => {
      report += `- **[${i.category}]** ${i.message}\n`;
    });
    report += '\n---\n\n';
  }

  if (issues.info.length > 0) {
    report += `## 🔵 Informations (${issues.info.length})\n\n`;
    issues.info.forEach(i => {
      report += `- **[${i.category}]** ${i.message}\n`;
    });
    report += '\n---\n\n';
  }

  if (screenshots.length > 0) {
    report += `## 📸 Screenshots (${screenshots.length})\n\n`;
    screenshots.forEach(s => {
      report += `- \`test_screenshots/${s.file}\` — ${s.url}\n`;
    });
    report += '\n';
  }

  fs.writeFileSync(REPORT_FILE, report, 'utf8');

  const critCount = issues.critical.length;
  const warnCount = issues.warning.length;
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`RAPPORT: test_report.md`);
  console.log(`SCREENSHOTS: test_screenshots/`);
  console.log(`Critiques: ${critCount} | Avertissements: ${warnCount} | Infos: ${issues.info.length}`);
  console.log('═'.repeat(50));

  return { critCount, warnCount };
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
console.log('╔═══════════════════════════════════════════╗');
console.log('║  LVMH Voice-to-Tag — Site Testing Agent  ║');
console.log('╚═══════════════════════════════════════════╝');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Chromium: ${CHROMIUM ? '✓ disponible' : '✗ non trouvé'}`);

checkConnectivity();
const htmlIds = analyzeHTML();
analyzeJS(htmlIds);
analyzeCSS();
designAudit();
takeScreenshots();
const { critCount } = generateReport();

process.exit(critCount > 0 ? 1 : 0);
