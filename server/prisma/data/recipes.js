/**
 * Recipes. Ingredient tuple: [name, amount, linked product name | null]
 * Linked names must match product names in catalog.js exactly.
 */
export const RECIPES = [
  {
    title: 'Proteinová ovesná kaše s arašídovým máslem', emoji: '🥣', prepMinutes: 10, servings: 1, difficulty: 'EASY',
    tags: ['snídaně', 'high-protein', 'rychlovka'],
    excerpt: 'Krémová kaše s 35 g bílkovin, která vás zasytí až do oběda.',
    ingredients: [
      ['Ovesné vločky', '50 g', 'Ovesné vločky jemné BIO'],
      ['Syrovátkový protein vanilka', '30 g', 'Whey Protein 80 Vanilka'],
      ['Arašídové máslo', '1 lžíce', 'Arašídové máslo jemné 100 %'],
      ['Ovesné mléko', '250 ml', 'Ovesné mléko Barista'],
      ['Banán', '1 ks', null],
      ['Chia semínka', '1 lžička', 'Chia semínka BIO'],
    ],
    instructions: `1. Vločky zalijte mlékem a vařte 3–4 minuty za stálého míchání.
2. Odstavte z plotny a nechte minutu vychladnout – protein se pak nesrazí.
3. Vmíchejte protein a případně přilijte trochu mléka na požadovanou hustotu.
4. Přendejte do misky, ozdobte nakrájeným banánem, lžící arašídového másla a chia semínky.

**Tip:** Večer si připravte vločky s mlékem do sklenice a ráno jen vmíchejte protein – máte *overnight oats*.`,
  },
  {
    title: 'Chia pudink s mangem a kokosem', emoji: '🥭', prepMinutes: 10, servings: 2, difficulty: 'EASY',
    tags: ['snídaně', 'vegan', 'bez-lepku', 'dezert'],
    excerpt: 'Tropický pudink, který si připravíte večer a ráno jen vytáhnete z lednice.',
    ingredients: [
      ['Chia semínka', '4 lžíce', 'Chia semínka BIO'],
      ['Kokosové mléko', '400 ml', 'Kokosové mléko na vaření'],
      ['Sušené mango', '60 g', 'Mango sušené nesířené'],
      ['Datlový sirup', '1 lžíce', 'Datlový sirup'],
      ['Kokosové chipsy', 'na ozdobu', 'Kokosové chipsy pražené'],
    ],
    instructions: `1. Smíchejte chia semínka s kokosovým mlékem a datlovým sirupem.
2. Po 10 minutách znovu promíchejte, aby se nevytvořily hrudky.
3. Nechte v lednici alespoň 4 hodiny, ideálně přes noc.
4. Sušené mango nakrájejte, krátce namočte v horké vodě a rozmixujte na pyré.
5. Do sklenic vrstvěte pudink a mangové pyré, navrch nasypte kokosové chipsy.`,
  },
  {
    title: 'Červený čočkový dal s kurkumou', emoji: '🍛', prepMinutes: 30, servings: 4, difficulty: 'EASY',
    tags: ['oběd', 'vegan', 'bez-lepku', 'high-protein'],
    excerpt: 'Hřejivý indický dal plný bílkovin, hotový za půl hodiny.',
    ingredients: [
      ['Červená čočka', '250 g', 'Červená čočka loupaná'],
      ['Kokosové mléko', '400 ml', 'Kokosové mléko na vaření'],
      ['Kurkuma', '1 lžička', 'Kurkuma mletá BIO'],
      ['Kari směs', '2 lžičky', 'Kari směs Madras'],
      ['Kokosový olej', '1 lžíce', 'Kokosový olej panenský BIO'],
      ['Cibule', '1 ks', null],
      ['Česnek', '3 stroužky', null],
      ['Zázvor', '2 cm', null],
      ['Rajčata v plechovce', '400 g', null],
      ['Jasmínová rýže', 'k podávání', 'Jasmínová rýže natural'],
    ],
    instructions: `1. Na kokosovém oleji orestujte nadrobno nakrájenou cibuli, česnek a zázvor.
2. Přidejte kurkumu a kari a minutu opékejte, až koření zavoní.
3. Přisypte propláchnutou čočku, rajčata a 500 ml vody.
4. Vařte 15–20 minut, dokud se čočka nerozpadne.
5. Vmíchejte kokosové mléko, osolte a podávejte s rýží a čerstvým koriandrem.`,
  },
  {
    title: 'Keto pizza na mandlovém těstě', emoji: '🍕', prepMinutes: 35, servings: 2, difficulty: 'MEDIUM',
    tags: ['večeře', 'keto', 'bez-lepku'],
    excerpt: 'Křupavá pizza s pouhými 6 g sacharidů na porci.',
    ingredients: [
      ['Mandlová mouka', '120 g', 'Mandlová mouka blanšírovaná'],
      ['Psyllium', '1 lžíce', 'Psyllium rozpustná vláknina'],
      ['Mozzarella strouhaná', '170 g', null],
      ['Vejce', '1 ks', null],
      ['Olivový olej', '1 lžíce', 'Extra panenský olivový olej'],
      ['Rajčatové pyré', '4 lžíce', null],
      ['Šunka, žampiony, rukola', 'podle chuti', null],
    ],
    instructions: `1. Mozzarellu rozpusťte v mikrovlnce (2 × 30 s), promíchejte.
2. Přidejte mandlovou mouku, psyllium a vejce a vypracujte hladké těsto.
3. Těsto rozválejte mezi dvěma pečicími papíry na tenký kruh.
4. Pečte 10 minut na 200 °C, pak potřete rajčaty a obložte.
5. Dopečte 8–10 minut, pokapejte olivovým olejem a ozdobte rukolou.`,
  },
  {
    title: 'Raw brownies bez pečení', emoji: '🟫', prepMinutes: 15, servings: 12, difficulty: 'EASY',
    tags: ['dezert', 'vegan', 'raw', 'bez-lepku'],
    excerpt: 'Čokoládové brownies jen z ořechů, datlí a kakaa.',
    ingredients: [
      ['Vlašské ořechy', '200 g', 'Vlašské ořechy půlky'],
      ['Datle Medjool', '250 g', 'Datle Medjool'],
      ['Raw kakao', '50 g', 'Kakaový prášek raw BIO'],
      ['Kakaové boby', '2 lžíce', 'Kakaové boby drcené (nibs)'],
      ['Himálajská sůl', 'špetka', 'Himálajská sůl růžová'],
    ],
    instructions: `1. Ořechy rozmixujte na hrubou drť.
2. Přidejte vypeckované datle, kakao a sůl a mixujte, dokud se hmota nezačne lepit.
3. Natlačte do formy vyložené pečicím papírem a posypte kakaovými boby.
4. Nechte 2 hodiny ztuhnout v lednici a nakrájejte na kostky.`,
  },
  {
    title: 'Smoothie bowl s acai a granolou', emoji: '🫐', prepMinutes: 10, servings: 1, difficulty: 'EASY',
    tags: ['snídaně', 'vegan', 'bez-lepku'],
    excerpt: 'Fialová miska plná antioxidantů a křupavé granoly.',
    ingredients: [
      ['Acai prášek', '1 lžíce', 'Acai prášek lyofilizovaný'],
      ['Mražené borůvky', '150 g', null],
      ['Banán (mražený)', '1 ks', null],
      ['Mandlové mléko', '80 ml', 'Mandlové mléko bez cukru'],
      ['Granola', '30 g', 'Granola Lískový oříšek & kakao'],
      ['Goji', '1 lžíce', 'Goji kustovnice BIO'],
    ],
    instructions: `1. Mražené ovoce, acai prášek a mléko rozmixujte na hustý krém.
2. Přendejte do misky – konzistence má připomínat zmrzlinu.
3. Ozdobte granolou, goji a čerstvým ovocem. Podávejte ihned.`,
  },
  {
    title: 'Pohankové palačinky s tvarohem', emoji: '🥞', prepMinutes: 25, servings: 3, difficulty: 'EASY',
    tags: ['snídaně', 'bez-lepku', 'high-protein'],
    excerpt: 'Nadýchané bezlepkové palačinky s jahodovým džemem bez cukru.',
    ingredients: [
      ['Pohanková mouka', '150 g', 'Pohanková mouka BIO'],
      ['Vejce', '2 ks', null],
      ['Mléko', '300 ml', null],
      ['Kypřicí prášek', '1 lžička', 'Kypřicí prášek bez fosfátů'],
      ['Tvaroh', '250 g', null],
      ['Džem bez cukru', '4 lžíce', 'Džem jahodový bez cukru'],
      ['Ghí na smažení', '1 lžíce', 'Ghí přepuštěné máslo'],
    ],
    instructions: `1. Vejce prošlehejte s mlékem, přidejte mouku a kypřicí prášek.
2. Těsto nechte 10 minut odpočinout.
3. Na rozpáleném ghí smažte malé lívance z obou stran dozlatova.
4. Podávejte s tvarohem a lžící jahodového džemu.`,
  },
  {
    title: 'Buddha bowl s tempehem a tahini', emoji: '🥗', prepMinutes: 30, servings: 2, difficulty: 'MEDIUM',
    tags: ['oběd', 'vegan', 'high-protein'],
    excerpt: 'Barevná miska plná bílkovin, zeleniny a krémové tahini zálivky.',
    ingredients: [
      ['Tempeh', '200 g', 'Tempeh BIO'],
      ['Quinoa', '120 g', 'Quinoa bílá BIO'],
      ['Tahini', '3 lžíce', 'Tahini sezamová pasta'],
      ['Tamari', '2 lžíce', 'Tamari sójová omáčka'],
      ['Batát', '1 ks', null],
      ['Avokádo', '1 ks', null],
      ['Cizrna (vařená)', '150 g', 'Cizrna BIO'],
      ['Dýňová semínka', '2 lžíce', 'Dýňová semínka BIO'],
    ],
    instructions: `1. Quinou propláchněte a uvařte ve dvojnásobku vody (15 minut).
2. Batát nakrájejte na kostky a pečte 25 minut na 200 °C.
3. Tempeh nakrájejte, marinujte v tamari a opečte na pánvi dozlatova.
4. Tahini rozmíchejte s citronovou šťávou a vodou na hladkou zálivku.
5. Do misek naskládejte všechny složky, přelijte zálivkou a posypte semínky.`,
  },
  {
    title: 'Matcha latte s ovesným mlékem', emoji: '🍵', prepMinutes: 5, servings: 1, difficulty: 'EASY',
    tags: ['nápoje', 'vegan', 'bez-lepku'],
    excerpt: 'Klidná energie bez kávového nakopnutí.',
    ingredients: [
      ['Matcha', '1 lžička', 'Matcha Ceremonial Grade'],
      ['Ovesné mléko Barista', '200 ml', 'Ovesné mléko Barista'],
      ['Javorový sirup', '1 lžička', 'Javorový sirup Grade A'],
    ],
    instructions: `1. Matchu prosejte do misky a zalijte 50 ml vody o teplotě 80 °C.
2. Šlehejte bambusovou metličkou do tvaru „W“, dokud se nevytvoří pěna.
3. Mléko ohřejte a napěňte, přidejte sirup.
4. Matchu přelijte do hrnku a dolijte napěněným mlékem.`,
  },
  {
    title: 'Pečené cizrnové snacky s paprikou', emoji: '🫘', prepMinutes: 40, servings: 4, difficulty: 'EASY',
    tags: ['svačina', 'vegan', 'bez-lepku', 'high-protein'],
    excerpt: 'Křupavá náhrada chipsů s vysokým obsahem bílkovin.',
    ingredients: [
      ['Cizrna (uvařená)', '400 g', 'Cizrna BIO'],
      ['Olivový olej', '1 lžíce', 'Extra panenský olivový olej'],
      ['Uzená paprika', '1 lžička', null],
      ['Himálajská sůl', '½ lžičky', 'Himálajská sůl růžová'],
    ],
    instructions: `1. Uvařenou cizrnu důkladně osušte utěrkou – čím sušší, tím křupavější.
2. Promíchejte s olejem, paprikou a solí.
3. Pečte na plechu 30–35 minut na 200 °C, v polovině promíchejte.
4. Nechte vychladnout – až pak úplně zkřupavějí.`,
  },
  {
    title: 'Proteinové banánové muffiny', emoji: '🧁', prepMinutes: 30, servings: 12, difficulty: 'MEDIUM',
    tags: ['svačina', 'high-protein', 'pečení'],
    excerpt: 'Vláčné muffiny s 10 g bílkovin v kusu, slazené banánem.',
    ingredients: [
      ['Zralé banány', '3 ks', null],
      ['Ovesné vločky', '150 g', 'Ovesné vločky jemné BIO'],
      ['Protein čokoláda', '60 g', 'Whey Protein 80 Čokoláda'],
      ['Vejce', '2 ks', null],
      ['Řecký jogurt', '150 g', null],
      ['Kypřicí prášek', '1 lžička', 'Kypřicí prášek bez fosfátů'],
      ['Hořká čokoláda', '40 g', 'Hořká čokoláda 85 %'],
    ],
    instructions: `1. Vločky rozmixujte na mouku.
2. Banány rozmačkejte, přidejte vejce a jogurt a prošlehejte.
3. Vmíchejte vločkovou mouku, protein a kypřicí prášek.
4. Přidejte nasekanou čokoládu, rozdělte do formiček.
5. Pečte 20 minut na 180 °C.`,
  },
  {
    title: 'Edamame špagety s pestem', emoji: '🍝', prepMinutes: 15, servings: 2, difficulty: 'EASY',
    tags: ['večeře', 'vegan', 'keto', 'high-protein'],
    excerpt: 'Zelená večeře s 40 g bílkovin za čtvrt hodiny.',
    ingredients: [
      ['Edamame špagety', '200 g', 'Edamame špagety'],
      ['Bazalka', '1 svazek', null],
      ['Kešu ořechy', '40 g', 'Kešu ořechy natural'],
      ['Lahůdkové droždí', '2 lžíce', 'Lahůdkové droždí'],
      ['Olivový olej', '60 ml', 'Extra panenský olivový olej'],
      ['Česnek', '1 stroužek', null],
    ],
    instructions: `1. Špagety vařte 6–7 minut v osolené vodě.
2. Bazalku, kešu, droždí, česnek a olej rozmixujte na pesto.
3. Scezené těstoviny promíchejte s pestem a podávejte s cherry rajčaty.`,
  },
];
