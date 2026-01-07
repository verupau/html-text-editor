# Text Editor App

Jednoduchá webová appka pro vizuální editaci textů v HTML souborech přímo v prohlížeči.

## Jak to funguje

1. Spustíš lokální server.
2. Otevřeš appku v prohlížeči.
3. Zadáš cestu ke složce se svým webovým projektem.
4. Vybereš HTML soubor, který chceš upravit.
5. Zapneš **Edit mód**, klikneš na text a píšeš.
6. Uložíš změny (`Ctrl+S`), které se propíší přímo do tvého zdrojového souboru.

## Instalace

1. Musíš mít nainstalovaný [Node.js](https://nodejs.org/) (doporučujeme verzi LTS).
2. Stáhni si tento projekt jako ZIP nebo ho naklonuj:
   ```bash
   git clone https://github.com/verupau/html-text-editor.git
   ```
3. V terminálu přejdi do složky projektu a nainstaluj závislosti:
   ```bash
   npm install
   ```

## Spuštění

```bash
npm start
```

Appka poběží na: **http://localhost:3333**

## Použití

1. Otevři **http://localhost:3333** v prohlížeči.
2. Do pole pro cestu zadej **absolutní cestu** k tvé projektové složce, např.:
   - Windows: `C:\Users\Jmeno\Projects\muj-web`
   - Mac/Linux: `/Users/jmeno/projects/muj-web`
3. Klikni na **Načíst**.
4. V levém panelu se zobrazí stromová struktura tvých HTML souborů.
5. Kliknutím na soubor ho otevřeš v náhledu.

### Edit mód

Pro editaci textů (včetně tlačítek a odkazů) použij **Edit mód**:

1. **Klikni na `✏️ Edit mód`** v horním panelu (nebo stiskni klávesu **E**).
2. Stránka se "zamrazí" - odkazy a tlačítka přestanou reagovat a stanou se editovatelnými.
3. **Klikni na text**, který chceš upravit, a rovnou piš.
4. Pro uložení stiskni **Ctrl+S** (nebo **Cmd+S** na Macu).
5. Edit mód vypneš opětovným kliknutím na tlačítko nebo klávesou **Escape**.

## Klávesové zkratky

| Klávesa | Akce |
|---------|------|
| **E** | Zapnout / vypnout Edit mód |
| **Ctrl + S** / **Cmd + S** | Uložit změny do souboru |
| **Ctrl + Shift + Space** | Vložit nedělitelnou mezeru (`&nbsp;`) |
| **Escape** | Ukončit editaci textu / Vypnout Edit mód |

## Funkce

- ✅ **Hierarchické načítání**: Podporuje vnořené složky a složité struktury projektů.
- ✅ **Bezpečné ukládání**: Při každém uložení se vytvoří `.backup` soubor původní verze.
- ✅ **Chytrá editace**: Umožňuje editovat i texty uvnitř odkazů a tlačítek bez jejich aktivace.
- ✅ **Vizuální indikace**: Jasně vidíš, kdy máš neuložené změny.
- ✅ **nbsp support**: Snadné vkládání nedělitelných mezer pro správnou typografii.

## Tipy

- **Zálohy**: Před každým uložením se vytvoří `.backup` soubor. Doporučujeme přidat `*.backup` do tvého `.gitignore`.
- **Vnořené elementy**: Pokud text obsahuje značky jako `<strong>` nebo `<em>`, aplikace se snaží zachovat strukturu.
- **Node_modules**: Složky `node_modules` a skryté složky (začínající tečkou) jsou automaticky ignorovány pro vyšší rychlost.

## Poznámky

- **Bezpečnost**: Tato aplikace je určena pro **lokální vývoj**. Nikdy ji nevystavujte veřejně na internet bez dalšího zabezpečení, protože umožňuje zápis do souborů na disku.
- **Port**: Výchozí port je `3333` (lze změnit v `server.js`).
