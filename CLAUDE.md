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

## Specificaties van een magneet

- **Maat:** 105 × 30 mm (breedte × hoogte). Dat is de standaard, aanpasbaar in de instellingen.
- **Linksboven:** de naam van de plant, groot en vet. Een te lange naam krimpt automatisch tot ze past, minimaal tot 40% van de basisgrootte.
- **Rechtsboven:** een letter van A tot L, groot maar niet vet.
- **Linksonder:** maximaal twee regels, elk met een klein label en daarnaast de periode in het vet.
  - Regel 1: een dropdown met Zaaien, Voorzaaien, Planten, Uitplanten of Poten, met een periode van/tot.
  - Regel 2: "Oogsten" met een periode van/tot. Optioneel via een vinkje (`harvest`), standaard aan.
  - Een regel zonder maanden wordt weggelaten.
  - Een periode wordt getoond als `apr – mei`. Is het één maand, dan enkel `apr`.
  - Maandafkortingen: `jan feb mrt apr mei jun jul aug sep okt nov dec`.
- **Rechtsonder:** het nummer met een hekje ervoor, bv. `#12`, niet vet. Het nummer is de plaats op het bord en telt niet vanzelf op.
- Zwart op wit, om printerinkt te sparen. Snijlijnen zijn optioneel (lichtgrijs, 0,2 mm).

**Bewuste keuzes:**
- Een algemeen Nederlands woord voor "zaaien of planten" bestaat niet. Daarom kiest hij het label via een dropdown, niet via vrij typen.
- Een veld "aantal keer" is bewust verwijderd. Voor een tweede exemplaar gebruikt hij "Kopiëren".

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
   - In de CSS staan ze als `calc(var(--h) * …)` in `.card`, `.c-name span`, `.c-letter`, `.c-type`, `.c-period` en `.c-num`.
   - In de JS staan ze in het object `R`, dat `makePDF()` gebruikt.
   - Pas je er één aan, pas dan ook de andere aan. Anders verschillen het scherm en de afdruk van de PDF.
2. **Verhoog `CACHE` in `sw.js` bij elke wijziging** (nu `plantmagneten-v4`). Anders kan de geïnstalleerde PWA een oude versie blijven tonen. De service worker werkt network-first, met de cache als fallback.
3. **Houd `makePDF()` en `navigator.share()` synchroon binnen de klik.** Safari op iOS weigert `share()` als er eerst een `await` zat (de user activation is dan verlopen). Daarom worden de lettertypes bij het opstarten voorgeladen als base64 in `fontData`. Kunnen ze niet geladen worden, dan valt de PDF terug op Helvetica.
4. **Opslag:** `localStorage` met sleutel `plantmagneten-v1`, als `{ labels: [...], settings: {...} }`.
   - Een label ziet er zo uit: `{ id, name, type, from, to, hFrom, hTo, harvest, letter, number, print }`. Maanden zijn index 0–11 of `null`.
   - `normalize()` maakt oude of geïmporteerde data veilig.
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
