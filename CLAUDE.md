# Plantmagneten

Kleine web-app (PWA) waarmee mijn vader magneetjes maakt voor het teeltbord in de moestuin. Op dat bord staan de maanden. Per plant komt er een magneet met naam, zaai-/plantperiode, oogstperiode, een letter en een nummer. Hij vult alles in, en de app maakt een A4 met de magneten op exacte maat om af te drukken of als PDF op te slaan.

Tot nu toe deed hij dit manueel in Word. Dat was traag en de maten klopten niet.

## Gebruiker en context

- De gebruiker is mijn vader. Hij is niet technisch en gebruikt vooral een **iPad**, als PWA via "Zet op beginscherm".
- De interface is volledig in het **Nederlands (Vlaams)**. Houd teksten kort en duidelijk, gebruik grote knoppen en invoervelden.
- Gehost op **GitHub Pages**. Er is geen build-stap, backend of framework: gewoon statische bestanden.

## Bestanden

| Pad | Wat |
|---|---|
| `index.html` | De hele app: HTML, CSS en JS in één bestand |
| `sw.js` | Service worker voor offline gebruik, met de constante `CACHE` als versienummer |
| `manifest.webmanifest` | PWA-manifest (naam, kleuren, iconen) |
| `icons/` | `icon-180.png` (apple-touch-icon), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` |
| `fonts/` | Atkinson Hyperlegible Regular en Bold (TTF) plus `OFL.txt` (licentie, moet erbij blijven) |
| `vendor/jspdf.umd.min.js` | jsPDF 2.5.2, lokaal meegeleverd zodat de PDF ook offline werkt |
| `planten.json` | Plantenlijst (gewassen + rassen) voor de suggesties bij de naam |
| `.claude/launch.json` | Lokale testserver (`python -m http.server 8000`) |

## Specificaties van een magneet

- **Maat:** 105 × 30 mm (breedte × hoogte). Dat is de standaard, aanpasbaar in de instellingen.
- **Linksboven:** de naam van de plant, groot en vet. Een te lange naam krimpt automatisch tot ze past, minimaal tot 40% van de basisgrootte.
- **Toevoeging:** optioneel woord achter de naam, niet vet en zonder haakjes, bv. **Appel Jonagold** winter. Naam en toevoeging krimpen samen. Oude data met "(winter)" in de naam zet `splitNote()` om.
- **Rechtsboven:** een letter van A tot L, groot maar niet vet.
- **Linksonder:** maximaal twee regels, elk met een klein label en daarnaast de periode in het vet.
  - Regel 1: een dropdown met Zaaien, Voorzaaien, Planten, Uitplanten, Poten of Snoeien (zonder label erboven, enkel `aria-label`), met een periode van/tot. Via "+ Tweede periode" kan er een tweede periode bij (bv. winter- en zomersnoei); die komt op dezelfde regel: `dec – feb, jul – aug`.
  - Via "+ Nog een handeling" kan er een tweede handeling bij, met eigen type en periode (`step2`, standaard Uitplanten). Die komt als aparte regel tussen regel 1 en Oogsten, dus maximaal 3 regels op de magneet.
  - Regel 2: "Oogsten" met een periode van/tot. Optioneel via een vinkje (`harvest`), standaard aan.
  - Een regel zonder maanden wordt weggelaten.
  - Een periode wordt getoond als `apr – mei`. Is het één maand, dan enkel `apr`.
  - Maandafkortingen: `jan feb mrt apr mei jun jul aug sep okt nov dec`.
- **Rechtsonder:** het nummer met een hekje ervoor, bv. `#12`, niet vet. Het nummer is de plaats op het bord en telt niet vanzelf op.
- Zwart op wit, om printerinkt te sparen. Snijlijnen zijn optioneel (lichtgrijs, 0,2 mm).

**Bewuste keuzes:**
- Een algemeen Nederlands woord voor "zaaien of planten" bestaat niet. Daarom kiest hij het label via een dropdown, niet via vrij typen.
- Een veld "aantal keer" is bewust verwijderd. Voor een tweede exemplaar gebruikt hij "Kopiëren".

## Plantenlijst en suggesties

- Bij het typen van de naam (vanaf 2 letters) toont een lijst onder het veld maximaal 8 suggesties. Een suggestie aantikken vult naam, type, van/tot (en eventueel de tweede periode), het vinkje Oogsten en de oogstmaanden in. Letter en nummer blijven staan. De omschrijving van de lijst komt in het veld "Toevoeging" (`note`).
- De lijst sluit met de knop "Sluiten, zelf verder invullen" onderaan, door ergens anders te tikken, of met Escape. Dat is belangrijk op de iPad: daar verliest het naamveld de focus niet altijd als je ernaast tikt.
- **Bewuste keuze:** er wordt niets op internet opgezocht. De lijst zit in `planten.json`, komt mee met de app en staat in de cache van de service worker (werkt dus offline).
- Eerst komen de eigen magneten (label "eigen"): wat hij zelf al eens gemaakt heeft, met zijn eigen maanden. Daarna de lijst, met gewassen vóór rassen.
- Zoeken (`findSuggestions()`, `score()`): zonder rekening te houden met hoofdletters of accenten. Elk getypt woord moet passen bij een woord uit de gewasnaam, de omschrijving, de zoekwoorden of de rasnaam.
  - Volgorde: exact woord, dan achteraan in een woord, dan vooraan, dan ergens middenin. In het Nederlands staat het hoofdwoord achteraan, dus "sla" geeft eerst Kropsla, IJsbergsla, ... en niet Slaapmutsje. "kool" geeft Rode kool, Spruitkool, ...
  - Een treffer in de rasnaam telt minder dan in de gewasnaam: "tom" geeft eerst Tomaat, niet "Kropsla Tom Thumb". Daarna komen gewassen voor rassen, en dan alfabetisch.
- Formaat van `planten.json`: `{ versie, uitleg, planten: [...] }`. Per gewas: `naam`, optioneel `omschrijving` (bv. "vroeg", "winter"), `type`, `van`, `tot`, `oogstVan`, `oogstTot` (maandafkortingen, of `null` voor geen oogst), optioneel `van2`/`tot2` (tweede periode), optioneel `daarna: { type, van, tot }` (tweede handeling, bv. Uitplanten), optioneel `zoekwoorden` (Vlaamse of andere namen, bv. Ajuin, Kroot, Warmoes) en optioneel `rassen`. Een ras wordt getoond als `naam + " " + ras` en krijgt de kalender van het gewas. Hebben rassen een andere kalender, dan staat hetzelfde gewas er meerdere keren in, met een andere `omschrijving`.
- Inhoud: ongeveer 2150 namen (ruim 400 gewassen en 1700 rassen): groenten, kruiden, fruit, bloemen voor de moestuin en groenbemesters. Rassen zijn deels nagekeken in catalogi van Vreeken, De Bolster en Welkoop. Aanpassen kan rechtstreeks in `planten.json`, de volgorde maakt niet uit.
- De lijst is opgesteld voor Vlaanderen. `type` is de eerste handeling van een hobbytuinier: voorzaaien (binnen of onder glas), zaaien (ter plaatse), planten (plantgoed, struiken, bomen) of poten (knollen, bollen, plantuien). Bij fruitbomen en -struiken staat `Snoeien` met de snoeiperiode (pitfruit en bessen in de winter, steenvruchten en walnoot in de zomer, perzik rond de bloei). Elk gewas met `Voorzaaien` heeft ook `daarna: Uitplanten` met de uitplantperiode (vorstgevoelige planten mei – jun, na de IJsheiligen).
- `loadCatalog()` slaat ongeldige regels gewoon over. Een fout in het bestand breekt de app dus niet, maar die plant verschijnt dan ook niet.

## Indeling op A4

- `layout()` berekent het aantal kolommen en rijen uit maat, rand (`margin`) en tussenruimte (`gap`), en centreert het geheel.
- **Standaard:** rand 0 en tussenruimte 0. Dat geeft 2 × 9 = 18 magneten per blad. Twee keer 105 mm is precies de A4-breedte, dus de buitenrand van de magneten valt samen met de rand van het papier.
- **Risico:** veel printers laten 3 à 5 mm wit aan de rand. Daarom is de horizontale binnenmarge van de kaart groter (`padX: .14` × hoogte = 4,2 mm).
  - **Nog niet getest op de echte printer.** Als er tekst wegvalt, zijn er twee opties:
    - Zet de rand op 5 mm. Dan past maar 1 kolom, dus 9 per blad.
    - Bouw een liggende indeling (A4 landscape, 2 × 6 = 12 per blad).
- Met "Begin op plaats nr." kan hij een half gebruikt blad verder opvullen. Plaatsen tellen van linksboven, van links naar rechts.

## Belangrijk bij wijzigingen

1. **De verhoudingen op twee plaatsen synchroon houden.** De lettergroottes en marges zijn fracties van de hoogte van de magneet.
   - In de CSS staan ze als `calc(var(--h) * …)` in `.card`, `.c-name span`, `.c-note`, `.c-letter`, `.c-type`, `.c-period` en `.c-num`.
   - In de JS staan ze in het object `R`, dat `makePDF()` gebruikt.
   - Pas je er één aan, pas dan ook de andere aan. Anders verschillen het scherm en de afdruk van de PDF.
2. **Verhoog `CACHE` in `sw.js` bij elke wijziging** (nu `plantmagneten-v18`). Anders kan de geïnstalleerde PWA een oude versie blijven tonen. Het nummer verschijnt ook klein rechtsboven op de pagina: `index.html` leest het uit `sw.js`, houd dus de vorm `'plantmagneten-vN'`. De service worker werkt network-first, met de cache als fallback.
3. **Houd `makePDF()` en `navigator.share()` synchroon binnen de klik.** Safari op iOS weigert `share()` als er eerst een `await` zat (de user activation is dan verlopen). Daarom worden de lettertypes bij het opstarten voorgeladen als base64 in `fontData`. Kunnen ze niet geladen worden, dan valt de PDF terug op Helvetica.
   - Geef aan `share()` enkel `files` mee, geen `title` of `text`. Anders bewaart iOS die bij "Bewaar in Bestanden" als extra `.txt`-bestand.
4. **Opslag:** `localStorage` met sleutel `plantmagneten-v1`, als `{ labels: [...], settings: {...} }`.
   - Een label ziet er zo uit: `{ id, name, note, type, from, to, from2, to2, step2, hFrom, hTo, harvest, letter, number, print }`. Maanden zijn index 0–11 of `null`. `step2` is `{ type, from, to }` of `null`.
   - `normalize()` maakt oude of geïmporteerde labels veilig, `normalizeList()` filtert ongeldige regels weg.
   - `normalizeSettings()` doet hetzelfde voor de instellingen. `load()` en de import gebruiken allebei deze functies.
   - `settings.v` is een schemaversie. Instellingen zonder `v` worden vervangen door de nieuwe standaard (105 × 30).
   - Verander je de structuur, voeg dan een migratie toe in `load()` en `normalize()` en verhoog `v`. Bestaande data mag nooit verloren gaan.
5. **Export en import:** "Lijst opslaan als bestand" maakt een JSON-bestand. Op aanraakschermen gebeurt dat via het deelvenster, op een computer als download. Hetzelfde formaat kan weer ingeladen worden. Houd dit compatibel.
6. **Afdrukken:** `@page { size: A4; margin: 0 }`.
   - Bij het afdrukken worden de bladen gekloond naar `#printRoot` (functie `buildPrint()`, ook via `beforeprint`). Alles behalve `#printRoot` wordt dan verborgen.
   - Op een computer moet de gebruiker schaal 100% en marges "geen" kiezen.
   - Op een iPad bestaat die instelling niet. De PDF is daar de betrouwbaardere weg.

## iPad / iOS aandachtspunten

- Safari wist `localStorage` van een website die 7 dagen niet bezocht is. Een PWA op het beginscherm valt daar niet onder. Daarom verschijnt er een installatietip (`#installHint`) als de app op iOS niet standalone draait, en roept de app `navigator.storage.persist()` aan.
- Een PWA op het beginscherm heeft op iOS een **eigen opslag, los van Safari**. Data uit een Safari-tabblad is daar niet zichtbaar. Verhuizen kan via export en import.
- Invoervelden zijn minstens 16 px groot, zodat iOS niet inzoomt bij het typen.

## Deploy

- GitHub Pages: Settings → Pages → Deploy from a branch → `main`, map `/ (root)`.
- Alle paden zijn relatief (`./`), zodat het werkt onder `https://<user>.github.io/<repo>/`.
- De service worker registreert alleen over https, dus lokaal testen kan het best met `python3 -m http.server` (staat ook in `.claude/launch.json`). Via `file://` werken de service worker en het laden van de lettertypes voor de PDF niet.

## Git-afspraken

- Voeg **geen** `Co-authored-by`-trailers toe aan commits.
- Schrijf commitberichten kort en in het Nederlands of Engels.

## Mogelijke volgende stappen

- Op de echte printer controleren of de randen goed afgedrukt worden. Indien nodig een liggende indeling toevoegen.
- Eventueel: sorteren of filteren per letter, en een zoekveld in de lijst als die lang wordt.
