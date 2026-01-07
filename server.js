const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3333;

// Middleware pro parsování JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));

// Proměnná pro aktuální projektovou složku
let projectRoot = null;

// Statické soubory pro UI
app.use('/app', express.static(path.join(__dirname, 'public')));

// Hlavní stránka
app.get('/', (req, res) => {
  res.redirect('/app/');
});

// API: Nastavení projektové složky
app.post('/api/set-project', (req, res) => {
  const { folder } = req.body;
  
  if (!folder) {
    return res.status(400).json({ error: 'Chybí cesta ke složce' });
  }
  
  const absolutePath = path.resolve(folder);
  
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'Složka neexistuje' });
  }
  
  projectRoot = absolutePath;
  console.log(`📁 Projekt nastaven: ${projectRoot}`);
  res.json({ success: true, path: projectRoot });
});

// API: Seznam HTML souborů v projektu (hierarchická struktura)
app.get('/api/files', (req, res) => {
  if (!projectRoot) {
    return res.status(400).json({ error: 'Není nastavena projektová složka' });
  }
  
  function buildTree(dir, relativePath = '') {
    const tree = {
      name: relativePath ? path.basename(relativePath) : path.basename(projectRoot),
      path: relativePath,
      type: 'directory',
      children: []
    };
    
    const items = fs.readdirSync(dir);
    
    // Seřadit položky: index.html první, pak ostatní HTML soubory, pak složky
    const sortedItems = items.sort((a, b) => {
      const aPath = path.join(dir, a);
      const bPath = path.join(dir, b);
      const aStat = fs.statSync(aPath);
      const bStat = fs.statSync(bPath);
      
      const aIsFile = aStat.isFile();
      const bIsFile = bStat.isFile();
      const aIsIndex = a === 'index.html' || a === 'index.htm';
      const bIsIndex = b === 'index.html' || b === 'index.htm';
      
      // index.html má vždy přednost
      if (aIsIndex && !bIsIndex) return -1;
      if (!aIsIndex && bIsIndex) return 1;
      
      // Soubory před složkami (ale index.html už je vyřešený výše)
      if (aIsFile && !bIsFile) return -1;
      if (!aIsFile && bIsFile) return 1;
      
      // Ostatní řazení abecedně
      return a.localeCompare(b);
    });
    
    for (const item of sortedItems) {
      // Přeskočit skryté soubory a node_modules
      if (item.startsWith('.') || item === 'node_modules') continue;
      
      const fullPath = path.join(dir, item);
      const relPath = relativePath ? path.join(relativePath, item) : item;
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const subTree = buildTree(fullPath, relPath);
        tree.children.push(subTree);
      } else if (item.endsWith('.html') || item.endsWith('.htm')) {
        tree.children.push({
          name: item,
          path: relPath,
          fullPath: fullPath,
          type: 'file'
        });
      }
    }
    
    return tree;
  }
  
  const tree = buildTree(projectRoot);
  res.json({ tree, projectRoot });
});

// Skript pro editaci - injektuje se do stránek
const editScript = `
<script data-text-editor="true">
(function() {
  // Zabránit vícenásobnému spuštění - kontrola pomocí globální proměnné
  if (window.__textEditorInitialized) {
    return;
  }
  window.__textEditorInitialized = true;
  
  // Stav editoru
  let editMode = false;
  let isModified = false;

  // Zvýraznění editovatelných elementů
  const style = document.createElement('style');
  style.setAttribute('data-text-editor', 'true');
  style.textContent = \`
    /* Edit mód - zablokovat interakce */
    body.edit-mode-active a:not([data-editable]),
    body.edit-mode-active button:not([data-text-editor] button):not([data-editable]),
    body.edit-mode-active input:not([data-editable]),
    body.edit-mode-active select:not([data-editable]),
    body.edit-mode-active [onclick]:not([data-editable]),
    body.edit-mode-active [role="button"]:not([data-editable]) {
      pointer-events: none !important;
    }
    
    body.edit-mode-active [data-editable] {
      pointer-events: auto !important;
      cursor: text !important;
    }
    
    /* Zajistit že data-editable má vždy přednost */
    body.edit-mode-active button[data-editable],
    body.edit-mode-active a[data-editable],
    body.edit-mode-active [onclick][data-editable] {
      pointer-events: auto !important;
      cursor: text !important;
    }
    
    /* Vizuální indikace edit módu */
    body.edit-mode-active {
      outline: 4px solid #ff6600 !important;
      outline-offset: -4px;
    }
    
    body.edit-mode-active::before {
      content: '✏️ EDIT MÓD AKTIVNÍ - klikni na text pro editaci';
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #ff6600;
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      font-weight: 500;
      z-index: 999998;
      box-shadow: 0 4px 20px rgba(255, 102, 0, 0.4);
      pointer-events: none;
    }
    
    /* Hover efekty jen v edit módu */
    body.edit-mode-active [data-editable]:hover {
      outline: 2px dashed #ff6600 !important;
      outline-offset: 2px;
      background: rgba(255, 102, 0, 0.1) !important;
    }
    
    [data-editable][contenteditable="true"] {
      outline: 2px solid #ff6600 !important;
      outline-offset: 2px;
      background: rgba(255, 102, 0, 0.15) !important;
    }
    
    #text-editor-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    #text-editor-toast.show {
      opacity: 1;
    }
    /* Toolbar je nyní v hlavní aplikaci, ne v iframe */
  \`;
  document.head.appendChild(style);

  // Toolbar je nyní v hlavní aplikaci, ne v iframe

  // Toast pro notifikace
  const toast = document.createElement('div');
  toast.id = 'text-editor-toast';
  document.body.appendChild(toast);

  function showToast(message, duration = 2000) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  // Označit textové elementy jako editovatelné
  const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, a, span, button, label, td, th, figcaption, blockquote, cite, strong, em, b, i');
  textElements.forEach((el, index) => {
    // Přeskočit elementy bez textu nebo které jsou součástí editoru
    if (el.closest('[data-text-editor]')) return;
    if (!el.textContent.trim()) return;
    // Přeskočit pokud parent už je editable (vnořené elementy)
    if (el.parentElement && el.parentElement.hasAttribute('data-editable')) return;
    
    el.setAttribute('data-editable', 'true');
    el.setAttribute('data-original', el.innerHTML);
  });

  // Funkce pro odeslání statusu do hlavní aplikace
  function sendStatusToParent() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'text-editor-status',
        editMode: editMode,
        status: isModified ? '● Neuložené změny' : 'Připraveno',
        modified: isModified
      }, '*');
    }
  }

  // Toggle Edit mód
  function toggleEditMode() {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode-active', editMode);
    const editModeBtn = document.getElementById('edit-mode-btn');
    if (editModeBtn) {
      editModeBtn.classList.toggle('active', editMode);
      editModeBtn.textContent = editMode ? '✓ Edit mód ON' : '✏️ Edit mód';
    }
    
    sendStatusToParent();
    
    if (editMode) {
      showToast('✏️ Edit mód zapnutý - klikni na text');
    } else {
      // Ukončit všechny editace
      document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.contentEditable = 'false';
      });
      
      // Automaticky uložit změny při vypnutí Edit módu
      if (isModified) {
        saveChanges();
        showToast('💾 Změny automaticky uloženy');
      } else {
        showToast('Edit mód vypnutý');
      }
    }
  }
  
  // Poslouchat zprávy z hlavní aplikace
  window.addEventListener('message', (e) => {
    if (e.data.type === 'text-editor-toggle-edit') {
      toggleEditMode();
    } else if (e.data.type === 'text-editor-save') {
      saveChanges();
    }
  });

  // Klávesová zkratka E pro toggle edit módu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'e' && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement.contentEditable !== 'true') {
      e.preventDefault();
      toggleEditMode();
    }
  });

  // Klik pro editaci (v edit módu)
  document.addEventListener('click', (e) => {
    if (!editMode) return;
    if (e.target.closest('[data-text-editor]')) return; // Povolit toolbar
    
    const el = e.target.closest('[data-editable]');
    if (el) {
      // Ukončit předchozí editace jiných elementů
      document.querySelectorAll('[contenteditable="true"]').forEach(other => {
        if (other !== el) other.contentEditable = 'false';
      });
      
      const wasEditable = el.contentEditable === 'true';
      
      // Pokud element NEBYL editovatelný, aktivovat ho a umístit kurzor
      if (!wasEditable) {
        e.preventDefault();
        e.stopPropagation();
        
        el.contentEditable = 'true';
        el.focus();
        
        // Umístit kurzor na pozici kliknutí
        if (document.caretRangeFromPoint) {
          const range = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (range) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
      // Pokud UŽ BYL editovatelný, nechat normální chování (výběr textu funguje)
    }
  }, true); // capture phase

  // Blokovat všechny akce v edit módu
  document.addEventListener('click', (e) => {
    if (!editMode) return;
    if (e.target.closest('[data-text-editor]')) return; // Povolit toolbar
    
    const el = e.target.closest('a, button, [onclick], [role="button"]');
    if (el && !el.hasAttribute('data-editable')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Sledování změn - funkce pro označení změn
  function markAsModified() {
    if (!isModified) {
      isModified = true;
      const status = document.getElementById('edit-status');
      if (status) {
        status.textContent = '● Neuložené změny';
        status.classList.add('modified');
      }
      sendStatusToParent();
    }
  }

  // Sledování změn - input event
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-editable]');
    if (el) markAsModified();
  });
  
  // Sledování změn - keyup jako záloha (input někdy nefunguje s contenteditable)
  document.addEventListener('keyup', (e) => {
    const el = e.target.closest('[data-editable]');
    if (el && el.contentEditable === 'true') {
      // Kontrola jestli se obsah změnil
      if (el.innerHTML !== el.getAttribute('data-original')) {
        markAsModified();
      }
    }
  });
  
  // Sledování změn - paste event
  document.addEventListener('paste', (e) => {
    const el = e.target.closest('[data-editable]');
    if (el) {
      setTimeout(markAsModified, 10);
    }
  });

  // Escape pro ukončení editace nebo edit módu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const el = document.activeElement;
      if (el.hasAttribute && el.hasAttribute('data-editable') && el.contentEditable === 'true') {
        el.contentEditable = 'false';
        el.blur();
      } else if (editMode) {
        toggleEditMode();
      }
    }
  });

  // Uložení
  async function saveChanges() {
    // Ukončit editaci
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
      el.contentEditable = 'false';
    });

    // Vytvořit kopii dokumentu bez editor elementů
    const clone = document.documentElement.cloneNode(true);
    
    // Odstranit editor elementy - všechny možné selektory
    clone.querySelectorAll('[data-text-editor]').forEach(el => el.remove());
    clone.querySelectorAll('#text-editor-toolbar').forEach(el => el.remove());
    clone.querySelectorAll('#text-editor-toast').forEach(el => el.remove());
    clone.querySelectorAll('#edit-mode-banner').forEach(el => el.remove());
    
    // Odstranit data-editable a data-original atributy + vyčistit inline styly
    clone.querySelectorAll('[data-editable]').forEach(el => {
      el.removeAttribute('data-editable');
      el.removeAttribute('data-original');
      el.removeAttribute('contenteditable');
      
      // Odstranit inline styly přidané editorem
      if (el.style) {
        el.style.removeProperty('outline');
        el.style.removeProperty('outline-style');
        el.style.removeProperty('outline-offset');
        el.style.removeProperty('background');
        el.style.removeProperty('background-color');
        el.style.removeProperty('cursor');
        
        // Pokud je style atribut prázdný, odstranit ho úplně
        if (!el.getAttribute('style') || el.getAttribute('style').trim() === '') {
          el.removeAttribute('style');
        }
      }
    });
    
    // Odstranit contenteditable z jakéhokoli elementu (pro jistotu)
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
    });
    
    // Odstranit edit-mode-active třídu z body
    clone.querySelector('body').classList.remove('edit-mode-active');

    const html = '<!DOCTYPE html>\\n' + clone.outerHTML;

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: window.location.pathname.replace('/preview/', ''),
          content: html
        })
      });

      if (response.ok) {
        showToast('✅ Uloženo!');
        isModified = false;
        const status = document.getElementById('edit-status');
        if (status) {
          status.textContent = 'Uloženo';
          status.classList.remove('modified');
        }
        
        sendStatusToParent();
        
        // Aktualizovat originály
        document.querySelectorAll('[data-editable]').forEach(el => {
          el.setAttribute('data-original', el.innerHTML);
        });
      } else {
        const error = await response.json();
        showToast('❌ Chyba: ' + error.error);
      }
    } catch (err) {
      showToast('❌ Chyba při ukládání');
      console.error(err);
    }
  }

  // Ctrl+S pro uložení
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveChanges();
    }
  });

  // Ctrl+Shift+Space pro vložení nedělitelné mezery (&nbsp;)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Space') {
      e.preventDefault();
      
      const el = document.activeElement;
      if (el && el.hasAttribute && el.hasAttribute('data-editable') && el.contentEditable === 'true') {
        // Vložit nedělitelnou mezeru na pozici kurzoru
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          // Vytvořit textový uzel s nedělitelnou mezerou (Unicode \\u00A0)
          const nbsp = document.createTextNode('\\u00A0');
          range.insertNode(nbsp);
          
          // Posunout kurzor za vloženou mezeru
          range.setStartAfter(nbsp);
          range.setEndAfter(nbsp);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Označit jako změněné
          markAsModified();
          showToast('Nedělitelná mezera vložena');
        }
      }
    }
  });

  // Varování před zavřením s neuloženými změnami
  window.addEventListener('beforeunload', (e) => {
    if (isModified) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  console.log('📝 Text Editor: Stiskni E pro Edit mód, Ctrl+S pro uložení');
  
  // Odeslat počáteční status do hlavní aplikace
  setTimeout(() => {
    sendStatusToParent();
  }, 100);
})();
</script>
`;

// Servírování projektových souborů s injektovaným skriptem
app.get('/preview/*', (req, res) => {
  if (!projectRoot) {
    return res.status(400).send('Není nastavena projektová složka');
  }
  
  const relativePath = req.params[0];
  const filePath = path.join(projectRoot, relativePath);
  
  // Bezpečnostní kontrola - zůstat v rámci projektu
  if (!filePath.startsWith(projectRoot)) {
    return res.status(403).send('Přístup odepřen');
  }
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Soubor nenalezen');
  }
  
  // Pro HTML soubory injektovat editační skript
  if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Injektovat skript před </body>
    if (content.includes('</body>')) {
      content = content.replace('</body>', editScript + '</body>');
    } else {
      content += editScript;
    }
    
    res.type('html').send(content);
  } else {
    // Ostatní soubory servírovat normálně
    res.sendFile(filePath);
  }
});

// API: Uložení souboru
app.post('/api/save', (req, res) => {
  if (!projectRoot) {
    return res.status(400).json({ error: 'Není nastavena projektová složka' });
  }
  
  const { file, content } = req.body;
  
  if (!file || !content) {
    return res.status(400).json({ error: 'Chybí soubor nebo obsah' });
  }
  
  const filePath = path.join(projectRoot, file);
  
  // Bezpečnostní kontrola
  if (!filePath.startsWith(projectRoot)) {
    return res.status(403).json({ error: 'Přístup odepřen' });
  }
  
  try {
    // Vytvořit zálohu
    const backupPath = filePath + '.backup';
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    
    // Uložit nový obsah
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`💾 Uloženo: ${file}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Chyba při ukládání:', err);
    res.status(500).json({ error: 'Chyba při ukládání souboru' });
  }
});

// API: Získání aktuálního projektu
app.get('/api/current-project', (req, res) => {
  res.json({ projectRoot });
});

// Fallback pro absolutní cesty k assetům (/assets/*, /favicon*, atd.)
// Toto zachytí requesty z iframe, které používají absolutní cesty
app.use((req, res, next) => {
  // Přeskočit API a app routes
  if (req.path.startsWith('/api') || req.path.startsWith('/app') || req.path.startsWith('/preview')) {
    return next();
  }
  
  // Pokud není projekt nastaven, pokračovat
  if (!projectRoot) {
    return next();
  }
  
  const filePath = path.join(projectRoot, req.path);
  
  // Bezpečnostní kontrola
  if (!filePath.startsWith(projectRoot)) {
    return next();
  }
  
  // Pokud soubor existuje, servírovat ho
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  
  next();
});

// Spuštění serveru
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║   📝 TEXT EDITOR APP                                      ║');
  console.log('║                                                           ║');
  console.log(`║   🌐 Otevři: http://localhost:${PORT}                        ║`);
  console.log('║                                                           ║');
  console.log('║   Jak používat:                                           ║');
  console.log('║   1. Zadej cestu ke složce s projektem                    ║');
  console.log('║   2. Vyber HTML soubor ze seznamu                         ║');
  console.log('║   3. Zapni Edit mód (E) a klikni na text                  ║');
  console.log('║   4. Ctrl+S pro uložení                                   ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
});

