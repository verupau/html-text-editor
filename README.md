# Text Editor App

Jednoduchá webová appka pro vizuální editaci textů v HTML souborech.

## Jak to funguje

1. Spustíš server
2. Otevřeš appku v prohlížeči
3. Zadáš cestu ke složce s projektem
4. Vybereš HTML soubor
5. Zapneš **Edit mód** a klikneš na text
6. Ctrl+S uloží změny zpět do souboru

## Instalace

```bash
cd text-editor-app
npm install
```

## Spuštění

```bash
npm start
```

Nebo:

```bash
node server.js
```

Appka poběží na: **http://localhost:3333**

## Použití

1. Otevři http://localhost:3333 v prohlížeči
2. Do pole "cesta ke složce" zadej absolutní cestu k projektu, např:
   ```
   /Users/username/projects/my-website
   ```
3. Klikni na "Načíst"
4. V levém panelu se zobrazí všechny HTML soubory
5. Kliknutím na soubor ho otevřeš v náhledu

### Edit mód

Pro editaci textů (včetně tlačítek a odkazů) použij **Edit mód**:

1. **Klikni na `✏️ Edit mód`** v toolbaru vpravo nahoře
2. Stránka se "zamrazí" - odkazy a tlačítka přestanou reagovat
3. **Klikni na text**, který chceš upravit
4. Uprav text
5. **Ctrl+S** pro uložení změn
6. **Klikni znovu na tlačítko** nebo stiskni **Escape** pro vypnutí Edit módu

## Klávesové zkratky

| Klávesa | Akce |
|---------|------|
| **E** | Zapnout/vypnout Edit mód |
| **Escape** | Ukončit editaci textu / Vypnout Edit mód |
| **Ctrl+S** / **Cmd+S** | Uložit změny do souboru |

## Funkce

- ✅ Načtení celé složky s projektem
- ✅ Správné zobrazení CSS, JS, obrázků
- ✅ **Edit mód** pro editaci tlačítek a interaktivních prvků
- ✅ Editace textů kliknutím (v Edit módu)
- ✅ Automatické ukládání do původních souborů
- ✅ Zálohy při ukládání (.backup soubory)
- ✅ Varování před zavřením s neuloženými změnami
- ✅ Vizuální indikace neuložených změn

## Tipy

- **Zálohy**: Před každým uložením se vytvoří `.backup` soubor. Přidej `*.backup` do `.gitignore`.
- **Více souborů**: Můžeš přepínat mezi soubory v levém panelu bez ztráty změn (budou uloženy).
- **Vnořené elementy**: Pokud text obsahuje `<strong>` nebo `<em>`, edituje se celý rodičovský element.

## Poznámky

- Port: 3333 (můžeš změnit v `server.js`)
- Funguje pouze s lokálními soubory
- Podporuje HTML soubory v libovolné hloubce podsložek
