export const BANNERS = [
  {
    title: 'Svačiny, které vás nabijí',
    subtitle: 'Přes 180 zdravých produktů, ořechů a superpotravin. Bez kompromisů v chuti.',
    ctaText: 'Nakupovat', ctaLink: '/obchod', emoji: '🥑',
    background: 'linear-gradient(135deg, #14532d 0%, #16a34a 55%, #4ade80 100%)', textColor: '#ffffff',
    placement: 'hero', sortOrder: 1,
  },
  {
    title: 'Protein týdne: −15 % na Whey 80',
    subtitle: 'Poctivá čokoláda a 24 g bílkovin v dávce. Akce platí do vyprodání zásob.',
    ctaText: 'Chci protein', ctaLink: '/obchod/syrovatkove-proteiny', emoji: '💪',
    background: 'linear-gradient(135deg, #312e81 0%, #6366f1 60%, #a5b4fc 100%)', textColor: '#ffffff',
    placement: 'hero', sortOrder: 2,
  },
  {
    title: 'Vařte zdravě s našimi recepty',
    subtitle: 'Každá surovina z receptu je jedním kliknutím v košíku.',
    ctaText: 'Prohlédnout recepty', ctaLink: '/recepty', emoji: '🍳',
    background: 'linear-gradient(135deg, #9a3412 0%, #f97316 60%, #fdba74 100%)', textColor: '#ffffff',
    placement: 'hero', sortOrder: 3,
  },
  {
    title: 'Keto & low-carb', subtitle: 'Méně sacharidů, více chuti', ctaText: 'Prozkoumat', ctaLink: '/obchod/keto-a-low-carb',
    emoji: '🥑', background: '#dcfce7', textColor: '#14532d', placement: 'promo', sortOrder: 1,
  },
  {
    title: 'Vítejte! −10 % na první nákup', subtitle: 'Použijte kód VITEJ10 v košíku', ctaText: 'Do obchodu', ctaLink: '/obchod',
    emoji: '🎉', background: '#ffedd5', textColor: '#7c2d12', placement: 'promo', sortOrder: 2,
  },
  {
    title: 'Dárkové boxy', subtitle: 'Zdravá radost pro vaše blízké', ctaText: 'Vybrat dárek', ctaLink: '/obchod/darkove-balicky',
    emoji: '🎁', background: '#ede9fe', textColor: '#4c1d95', placement: 'promo', sortOrder: 3,
  },
];

export const POSTS = [
  {
    title: 'Kolik bílkovin opravdu potřebujete?', emoji: '💪', tags: ['výživa', 'protein'], daysAgo: 3,
    excerpt: 'Doporučení se liší podle toho, jestli sportujete, hubnete nebo jen chcete jíst zdravě. Rozebíráme čísla.',
    content: `Bílkoviny jsou stavebním kamenem svalů, enzymů i hormonů. Kolik jich ale potřebujeme?

## Základní doporučení

Pro běžného dospělého je minimum **0,8 g na kilogram tělesné hmotnosti** denně. Pro 70kg člověka to je zhruba 56 g.

## Sportujete?

Pokud pravidelně trénujete, doporučuje se **1,6–2,2 g/kg**. Bílkoviny podporují regeneraci a růst svalové hmoty.

## Hubnete?

Při kalorickém deficitu pomáhá vyšší příjem bílkovin udržet svaly a navíc dobře zasytí.

## Jak to pokrýt

- Snídaně: proteinová kaše nebo tvaroh s ořechy
- Svačina: proteinová tyčinka, jerky nebo jogurt
- Oběd a večeře: maso, ryby, tofu, tempeh nebo luštěniny

> Rozložte příjem rovnoměrně do 3–5 jídel denně. Tělo tak bílkoviny využije nejlépe.`,
  },
  {
    title: '7 zdravých svačin do práce, které připravíte za 5 minut', emoji: '🥜', tags: ['svačiny', 'tipy'], daysAgo: 8,
    excerpt: 'Konec automatům se sladkostmi. Tyto svačiny zvládnete i v ranním shonu.',
    content: `Odpolední útlum zná každý. Správná svačina vás ale udrží v kondici až do večera.

1. **Hrst ořechů a kousek hořké čokolády** – zdravé tuky a hořčík.
2. **Rýžový chlebíček s arašídovým máslem a banánem** – rychlá energie.
3. **Řecký jogurt s granolou** – bílkoviny a vláknina.
4. **Hummus a zeleninové hranolky** – sytý a lehký.
5. **Datlová tyčinka** – když potřebujete něco sladkého.
6. **Jerky** – vysoký obsah bílkovin, téměř bez sacharidů.
7. **Chia pudink připravený večer** – stačí vytáhnout z lednice.

Všechny suroviny najdete v naší kategorii *Zdravé svačiny*.`,
  },
  {
    title: 'Keto dieta pro začátečníky: na co si dát pozor', emoji: '🥑', tags: ['keto', 'výživa'], daysAgo: 15,
    excerpt: 'Keto může fungovat, ale jen když víte, co děláte. Shrnuli jsme nejčastější chyby.',
    content: `Ketogenní dieta omezuje sacharidy obvykle pod 50 g denně a tělo začne jako hlavní zdroj energie využívat tuky.

## Nejčastější chyby

- **Málo elektrolytů** – na začátku tělo ztrácí vodu a s ní sodík, draslík a hořčík. Odtud „keto chřipka“.
- **Málo zeleniny** – listová zelenina má minimum sacharidů a spoustu vlákniny.
- **Skryté sacharidy** – omáčky, kečupy a „fit“ produkty často obsahují cukr.

## Co jíst

Ořechy, semínka, avokádo, olivový olej, vejce, ryby, maso, sýry a nízkosacharidová zelenina.

*Před zásadní změnou jídelníčku se poraďte s lékařem nebo nutričním terapeutem.*`,
  },
  {
    title: 'Superpotraviny: marketing, nebo opravdový přínos?', emoji: '🌿', tags: ['superpotraviny', 'výživa'], daysAgo: 22,
    excerpt: 'Spirulina, maca, goji… Které superpotraviny mají smysl a které jsou jen drahé?',
    content: `Termín „superpotravina“ není vědecký. Přesto některé potraviny mají mimořádně hustý obsah živin.

## Co má smysl

- **Chia a lněné semínko** – levný zdroj vlákniny a omega-3.
- **Spirulina** – bílkoviny, železo, ale pozor na kvalitu původu.
- **Kakao** – flavanoly prospěšné pro cévy.

## Na co nespoléhat

Žádná jednotlivá potravina nevyváží nevhodný jídelníček. Superpotraviny jsou **doplněk**, ne náhrada pestré stravy.`,
  },
  {
    title: 'Jak číst etikety potravin a nenechat se nachytat', emoji: '🔍', tags: ['tipy', 'nákup'], daysAgo: 30,
    excerpt: 'Pořadí surovin, skryté cukry a „light“ produkty. Praktický návod pro nakupování.',
    content: `Etiketa prozradí víc než barevný obal.

## Pořadí surovin

Suroviny se uvádějí sestupně podle hmotnosti. Je-li cukr na prvních místech, jde o sladkost.

## Skryté názvy cukru

Glukózový sirup, dextróza, maltodextrin, invertní cukr, fruktóza…

## Na 100 g, ne na porci

Porovnávejte vždy hodnoty na 100 g. Výrobci rádi uvádějí nesmyslně malé porce.`,
  },
  {
    title: 'Rostlinné bílkoviny: kompletní průvodce', emoji: '🌱', tags: ['vegan', 'protein'], daysAgo: 40,
    excerpt: 'Jak pokrýt bílkoviny na rostlinné stravě a proč kombinovat zdroje.',
    content: `Rostlinné zdroje bílkovin jsou plnohodnotné, pokud je kombinujete.

## Nejlepší zdroje

| Potravina | Bílkoviny na 100 g |
|---|---|
| Tempeh | 19 g |
| Tofu | 13 g |
| Čočka (suchá) | 25 g |
| Konopná semínka | 30 g |
| Edamame těstoviny | 44 g |

## Kombinujte

Luštěniny + obiloviny = kompletní spektrum aminokyselin. Klasika: rýže s fazolemi nebo hummus s pitou.`,
  },
];

const today = new Date().toLocaleDateString('cs-CZ');

export const PAGES = [
  {
    slug: 'obchodni-podminky', title: 'Obchodní podmínky',
    content: `*Platné od ${today}*

## 1. Úvodní ustanovení

1.1 Tyto obchodní podmínky (dále jen „podmínky“) upravují vzájemná práva a povinnosti mezi provozovatelem internetového obchodu eSvačina (dále jen „prodávající“) a kupujícím při nákupu zboží prostřednictvím webu esvacina.cz.

1.2 Prodávající: eSvačina s.r.o., Zdravá 12, 110 00 Praha 1, IČO 12345678, DIČ CZ12345678, zapsaná v obchodním rejstříku vedeném Městským soudem v Praze.

1.3 Kontakt: info@esvacina.cz, +420 777 123 456.

1.4 Vztahy neupravené těmito podmínkami se řídí zákonem č. 89/2012 Sb., občanský zákoník, a zákonem č. 634/1992 Sb., o ochraně spotřebitele.

## 2. Uživatelský účet

2.1 Kupující se může zaregistrovat a vytvořit si uživatelský účet. Je povinen uvádět pravdivé údaje a chránit přístupové heslo.

2.2 Prodávající může účet zrušit, pokud jej kupující nepoužívá déle než 3 roky nebo porušuje tyto podmínky.

2.3 Recenze produktů mohou psát pouze registrovaní zákazníci, kteří daný produkt zakoupili. Dotazy k produktům mohou pokládat všichni registrovaní uživatelé. Prodávající si vyhrazuje právo odstranit obsah, který je vulgární, nepravdivý nebo porušuje práva třetích osob.

## 3. Uzavření kupní smlouvy

3.1 Prezentace zboží na webu je informativní a není návrhem na uzavření smlouvy.

3.2 Kupní smlouva vzniká odesláním potvrzení objednávky prodávajícím na e-mail kupujícího.

3.3 Prodávající je oprávněn objednávku zrušit, pokud zboží není dostupné nebo byla uvedena zjevně chybná cena.

## 4. Cena a platební podmínky

4.1 Ceny jsou uvedeny včetně DPH. Cena dopravy a platby se zobrazuje v košíku před odesláním objednávky.

4.2 Kupující může platit kartou online, bankovním převodem nebo na dobírku.

4.3 Při platbě převodem je splatnost 5 dnů. Po uplynutí lhůty může být objednávka zrušena.

## 5. Doprava a dodání

5.1 Zboží skladem expedujeme zpravidla do 1 pracovního dne.

5.2 Při převzetí zkontrolujte neporušenost zásilky. Poškození oznamte dopravci a prodávajícímu.

## 6. Odstoupení od smlouvy

6.1 Spotřebitel má právo odstoupit od smlouvy bez udání důvodu do 14 dnů od převzetí zboží.

6.2 Odstoupit nelze u potravin s krátkou dobou trvanlivosti a u zboží v uzavřeném obalu, které bylo z hygienických důvodů rozbaleno.

6.3 Peníze vrátíme do 14 dnů od odstoupení stejným způsobem, jakým byly přijaty.

## 7. Práva z vadného plnění

7.1 Reklamaci lze uplatnit e-mailem nebo písemně na adrese prodávajícího. Reklamace bude vyřízena do 30 dnů.

7.2 Podrobnosti najdete na stránce [Reklamace a vrácení](/stranka/reklamace-a-vraceni).

## 8. Ochrana osobních údajů

Zpracování osobních údajů se řídí [Zásadami ochrany osobních údajů](/stranka/ochrana-osobnich-udaju).

## 9. Mimosoudní řešení sporů

K mimosoudnímu řešení spotřebitelských sporů je příslušná Česká obchodní inspekce, www.coi.cz.

## 10. Závěrečná ustanovení

Prodávající může podmínky měnit. Pro kupujícího platí znění účinné v okamžiku odeslání objednávky.`,
  },
  {
    slug: 'cookies', title: 'Zásady používání cookies',
    content: `*Platné od ${today}*

## Co jsou cookies

Cookies jsou malé textové soubory, které si web ukládá ve vašem prohlížeči. Pomáhají webu fungovat a pamatovat si vaše nastavení.

## Jaké cookies používáme

### Nezbytné (vždy aktivní)

| Název | Účel | Platnost |
|---|---|---|
| esv_token | Přihlášení k uživatelskému účtu | 7 dní |
| esv_cart | Obsah nákupního košíku (localStorage) | do smazání |
| esv_consent | Uložení vašeho souhlasu s cookies | 12 měsíců |

Bez těchto cookies by nefungovalo přihlášení ani košík. Jejich použití je oprávněným zájmem a nevyžaduje souhlas.

### Analytické (se souhlasem)

Pomáhají nám pochopit, jak návštěvníci web používají, abychom jej mohli zlepšovat. Data jsou anonymizována.

### Marketingové (se souhlasem)

Umožňují zobrazovat relevantní reklamu na jiných webech a měřit účinnost kampaní.

## Jak souhlas změnit

Souhlas můžete kdykoli změnit kliknutím na odkaz **Nastavení cookies** v patičce webu. Cookies lze také smazat v nastavení prohlížeče.

## Kontakt

S dotazy se obracejte na info@esvacina.cz.`,
  },
  {
    slug: 'ochrana-osobnich-udaju', title: 'Ochrana osobních údajů',
    content: `*Platné od ${today}*

## Správce

Správcem osobních údajů je eSvačina s.r.o., IČO 12345678, Zdravá 12, 110 00 Praha 1.

## Jaké údaje zpracováváme

- identifikační a kontaktní údaje (jméno, e-mail, telefon, adresa),
- údaje o objednávkách a platbách,
- obsah, který vložíte (recenze, dotazy),
- technické údaje (IP adresa, cookies).

## Účely a právní základ

- **plnění smlouvy** – vyřízení objednávky a vedení účtu,
- **právní povinnost** – účetnictví a daně,
- **oprávněný zájem** – zabezpečení webu, zasílání obchodních sdělení stávajícím zákazníkům,
- **souhlas** – newsletter, analytické a marketingové cookies.

## Doba uložení

Údaje uchováváme po dobu trvání účtu a dále po dobu nutnou ke splnění zákonných povinností (zpravidla 10 let u účetních dokladů).

## Vaše práva

Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost a vznesení námitky. Svůj účet můžete kdykoli smazat v sekci *Můj účet*. Stížnost můžete podat u Úřadu pro ochranu osobních údajů (www.uoou.cz).`,
  },
  {
    slug: 'doprava-a-platba', title: 'Doprava a platba',
    content: `## Doprava

| Způsob | Cena |
|---|---|
| Zásilkovna – výdejní místo | 69 Kč |
| Balíkovna | 59 Kč |
| PPL – doručení na adresu | 119 Kč |
| Osobní odběr Praha | zdarma |

**Při nákupu nad 1 500 Kč je doprava zdarma.**

## Platba

- Platba kartou online – zdarma
- Bankovní převod – zdarma
- Dobírka – 39 Kč

Objednávky skladem expedujeme do 24 hodin v pracovní dny.`,
  },
  {
    slug: 'reklamace-a-vraceni', title: 'Reklamace a vrácení',
    content: `## Vrácení zboží do 14 dnů

Nerozbalené zboží s dostatečnou trvanlivostí můžete vrátit do 14 dnů bez udání důvodu. Napište nám na info@esvacina.cz číslo objednávky a zboží zašlete na naši adresu.

## Reklamace

Pokud vám přišlo poškozené zboží nebo zboží s vadou, pošlete nám fotografii a číslo objednávky. Reklamaci vyřídíme nejpozději do 30 dnů, obvykle do 3 pracovních dnů.`,
  },
  {
    slug: 'o-nas', title: 'O nás',
    content: `## Jsme eSvačina 🥑

Věříme, že zdravé jídlo nemusí být nudné. Vybíráme produkty, které sami jíme: s krátkým složením, bez zbytečného cukru a s poctivou chutí.

- **180+ produktů** od ověřených výrobců
- **Recepty**, ve kterých je každá surovina na jedno kliknutí
- **Expedice do 24 hodin** přes Zásilkovnu, Českou poštu, PPL, DPD i GLS
- **Ověřené recenze** jen od zákazníků, kteří produkt opravdu koupili

## Co nás žene

Chceme, aby zdravé nakupování bylo stejně snadné jako to obyčejné. Proto u každého produktu najdete nutriční hodnoty, složení i alergeny a ke každé surovině recept, ve kterém ji využijete.

## Kdo za webem stojí

Návrh a vývoj e-shopu eSvačina: **Nikolas Malík**, tvorba rychlých a přehledných webů a e-shopů na míru. Portfolio a kontakt najdete na [malikweb.eu](https://malikweb.eu).

## Kontakt

Máte tip na produkt, který by u nás neměl chybět, nebo dotaz k objednávce? Napište nám na info@esvacina.cz.`,
    showInFooter: true,
  },
];
