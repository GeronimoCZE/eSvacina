/**
 * Category tree with sample products.
 * Product tuple: [name, brand, price, salePrice|null, weight, emoji, tags, short description]
 * Tags: vegan, bez-lepku, bio, keto, bez-cukru, high-protein, bez-laktozy, raw
 */
export const CATEGORIES = [
  {
    name: 'Proteiny a sportovní výživa', icon: '💪', color: '#6366f1', profile: 'protein',
    description: 'Kvalitní bílkoviny pro regeneraci, růst svalů i zasycení během dne.',
    children: [
      { name: 'Syrovátkové proteiny', icon: '🥛', products: [
        ['Whey Protein 80 Čokoláda', 'Proteinárna', 699, 599, '1000 g', '🍫', 'high-protein,bez-lepku', 'Syrovátkový koncentrát s 80 % bílkovin a poctivou chutí belgické čokolády.'],
        ['Whey Protein 80 Vanilka', 'Proteinárna', 699, null, '1000 g', '🍦', 'high-protein,bez-lepku', 'Krémová vanilka, která se skvěle hodí do kaše i smoothie.'],
        ['Whey Isolate 90 Slaný karamel', 'PureFuel', 899, null, '1000 g', '🍮', 'high-protein,bez-lepku,bez-laktozy', 'Izolát s minimem laktózy a tuku, rozpustí se i ve shakeru.'],
        ['Clear Whey Malina–limetka', 'PureFuel', 749, 649, '500 g', '🍋', 'high-protein,bez-lepku', 'Osvěžující průhledný protein, chutná jako limonáda.'],
      ]},
      { name: 'Rostlinné proteiny', icon: '🌱', products: [
        ['Vegan Protein Blend Kakao', 'GreenLeaf', 649, null, '1000 g', '🌿', 'vegan,high-protein,bez-lepku', 'Hrách, rýže a dýně v jednom – kompletní aminokyselinové spektrum.'],
        ['Hrachový protein natural', 'GreenLeaf', 389, null, '1000 g', '🫛', 'vegan,high-protein,bez-lepku,bio', 'Čistý hrachový izolát bez příchutí na vaření i pečení.'],
        ['Konopný protein BIO', 'Horská Bylina', 299, 259, '500 g', '🌱', 'vegan,high-protein,bio,raw', 'Za studena lisovaný, s vlákninou a omega-3 mastnými kyselinami.'],
      ]},
      { name: 'Proteinové tyčinky', icon: '🍫', products: [
        ['Protein Bar Arašídy & karamel', 'Proteinárna', 49, null, '60 g', '🥜', 'high-protein,bez-cukru', '20 g bílkovin, bez přidaného cukru, s křupavými arašídy.'],
        ['Protein Bar Bílá čokoláda & malina', 'Proteinárna', 49, 39, '60 g', '🍓', 'high-protein,bez-cukru', 'Krémová bílá čokoláda a kousky lyofilizovaných malin.'],
        ['Vegan Protein Bar Kokos', 'GreenLeaf', 45, null, '55 g', '🥥', 'vegan,high-protein', 'Rostlinná tyčinka s kokosem a hořkou čokoládou.'],
        ['Crispy Protein Wafer Lískový oříšek', 'PureFuel', 39, null, '40 g', '🧇', 'high-protein', 'Křupavá oplatka s proteinovým krémem z lískových oříšků.'],
        ['Protein Bar Box 12× Mix', 'Proteinárna', 549, 469, '12 × 60 g', '📦', 'high-protein,bez-cukru', 'Výhodné balení dvanácti oblíbených příchutí.'],
      ]},
      { name: 'Proteinové sušenky a snacky', icon: '🍪', products: [
        ['Protein Cookie Double Chocolate', 'PureFuel', 59, null, '75 g', '🍪', 'high-protein', 'Měkká sušenka s 16 g bílkovin.'],
        ['Proteinové chipsy Sour Cream', 'KetoLab', 55, null, '50 g', '🥔', 'high-protein,bez-lepku', 'Pečené, ne smažené, s 50 % bílkovin.'],
        ['Proteinové křupky Pizza', 'KetoLab', 45, 35, '45 g', '🍕', 'high-protein,bez-lepku', 'Lehké křupky z mléčné bílkoviny s pizza kořením.'],
      ]},
      { name: 'Kreatin a aminokyseliny', icon: '⚡', products: [
        ['Kreatin monohydrát Creapure®', 'PureFuel', 549, null, '500 g', '⚡', 'vegan,bez-lepku', 'Nejprozkoumanější doplněk pro sílu a výkon.'],
        ['EAA Zelené jablko', 'PureFuel', 599, 529, '400 g', '🍏', 'vegan,bez-cukru', 'Všech 9 esenciálních aminokyselin pro regeneraci.'],
        ['Elektrolyty Citron', 'NutriVita', 249, null, '300 g', '💧', 'vegan,bez-cukru', 'Sodík, draslík a hořčík pro hydrataci při sportu.'],
      ]},
      { name: 'Proteinové pudinky a dezerty', icon: '🍮', products: [
        ['Proteinový pudink Čokoláda', 'Proteinárna', 39, null, '200 g', '🍮', 'high-protein,bez-lepku', 'Krémový pudink s 20 g bílkovin, ideální po tréninku.'],
        ['Protein Mug Cake Brownie', 'Proteinárna', 199, null, '500 g', '🧁', 'high-protein', 'Hrnkový dortík za 60 sekund v mikrovlnce.'],
      ]},
    ],
  },
  {
    name: 'Zdravé svačiny', icon: '🍎', color: '#f97316', profile: 'snack',
    description: 'Svačiny do kabelky, na výlet i do práce. Bez zbytečností.',
    children: [
      { name: 'Ovocné a ořechové tyčinky', icon: '🌰', products: [
        ['Datlová tyčinka Kakao & kešu', 'Sladká Příroda', 29, null, '45 g', '🌰', 'vegan,raw,bez-lepku', 'Jen datle, kešu a kakao. Nic víc.'],
        ['Datlová tyčinka Mandle & skořice', 'Sladká Příroda', 29, 24, '45 g', '🥮', 'vegan,raw,bez-lepku', 'Chuť vánočního cukroví po celý rok.'],
        ['Ořechová tyčinka Mořská sůl', 'OříškovNa', 35, null, '40 g', '🧂', 'vegan,bez-lepku,keto', 'Mandle, arašídy a špetka mořské soli.'],
        ['Ovesná tyčinka Jablko & skořice', 'BioZrnko', 25, null, '50 g', '🍎', 'vegan,bio', 'Měkká ovesná tyčinka s kousky jablek.'],
      ]},
      { name: 'Chipsy a krekry', icon: '🥨', products: [
        ['Cizrnové chipsy Paprika', 'GreenLeaf', 49, null, '70 g', '🌶️', 'vegan,bez-lepku', 'O 40 % méně tuku než klasické chipsy.'],
        ['Zeleninové chipsy Mix', 'GreenLeaf', 69, 59, '90 g', '🥕', 'vegan,bez-lepku', 'Červená řepa, mrkev a pastinák.'],
        ['Semínkové krekry Rozmarýn', 'BioZrnko', 79, null, '100 g', '🌿', 'vegan,bez-lepku,bio,keto', 'Lněná, slunečnicová a dýňová semínka.'],
        ['Kokosové chipsy pražené', 'Sladká Příroda', 59, null, '80 g', '🥥', 'vegan,bez-lepku,keto', 'Křupavé plátky kokosu s jemnou sladkostí.'],
      ]},
      { name: 'Rýžové a kukuřičné chlebíčky', icon: '🍘', products: [
        ['Rýžové chlebíčky s quinoou BIO', 'BioZrnko', 39, null, '100 g', '🍘', 'vegan,bez-lepku,bio', 'Lehké a křupavé, s celozrnnou rýží a quinoou.'],
        ['Kukuřičné chlebíčky Mořská sůl', 'BioZrnko', 35, null, '120 g', '🌽', 'vegan,bez-lepku', 'Základ pro sladké i slané svačinky.'],
        ['Rýžové chlebíčky v hořké čokoládě', 'Sladká Příroda', 55, 45, '100 g', '🍫', 'vegan,bez-lepku', 'Polité 70% hořkou čokoládou.'],
      ]},
      { name: 'Sušené ovoce', icon: '🍑', products: [
        ['Mango sušené nesířené', 'Sladká Příroda', 119, null, '200 g', '🥭', 'vegan,bez-lepku,raw', 'Šťavnaté mango bez cukru a síry.'],
        ['Datle Medjool', 'Sladká Příroda', 189, 159, '500 g', '🌴', 'vegan,bez-lepku,raw', 'Královské datle s karamelovou chutí.'],
        ['Lyofilizované jahody', 'Horská Bylina', 129, null, '40 g', '🍓', 'vegan,bez-lepku,raw', 'Křupavé jahody s plnou chutí léta.'],
        ['Sušené švestky bez pecky', 'Sladká Příroda', 79, null, '250 g', '🫐', 'vegan,bez-lepku', 'Klasika pro dobré trávení.'],
      ]},
      { name: 'Raw dezerty', icon: '🧁', products: [
        ['Raw kuličky Kokos & limetka', 'Sladká Příroda', 69, null, '120 g', '⚪', 'vegan,raw,bez-lepku', 'Osvěžující kuličky z datlí a kokosu.'],
        ['Raw brownies', 'Sladká Příroda', 59, null, '60 g', '🟫', 'vegan,raw,bez-lepku', 'Vláčné brownies z ořechů a kakaa.'],
      ]},
      { name: 'Jerky a masové snacky', icon: '🥩', products: [
        ['Hovězí jerky Teriyaki', 'Proteinárna', 89, null, '40 g', '🥩', 'high-protein,bez-lepku,keto', 'Sušené hovězí s 45 % bílkovin.'],
        ['Krůtí jerky Pepř', 'Proteinárna', 85, 75, '40 g', '🦃', 'high-protein,bez-lepku,keto', 'Libové krůtí maso s černým pepřem.'],
      ]},
    ],
  },
  {
    name: 'Ořechy a semínka', icon: '🥜', color: '#b45309', profile: 'nuts',
    description: 'Zdroj zdravých tuků, bílkovin a minerálů. Pražené i natural.',
    children: [
      { name: 'Ořechy', icon: '🌰', products: [
        ['Mandle natural', 'OříškovNa', 189, null, '500 g', '🌰', 'vegan,bez-lepku,raw,keto', 'Kalifornské mandle nejvyšší kvality.'],
        ['Kešu ořechy natural', 'OříškovNa', 219, 189, '500 g', '🥜', 'vegan,bez-lepku,raw', 'Celé kešu W320 z Vietnamu.'],
        ['Vlašské ořechy půlky', 'OříškovNa', 169, null, '500 g', '🧠', 'vegan,bez-lepku,raw,keto', 'Bohaté na omega-3, sklizeň letošního roku.'],
        ['Makadamové ořechy', 'OříškovNa', 249, null, '250 g', '⚪', 'vegan,bez-lepku,raw,keto', 'Máslová chuť a nejvíce mononenasycených tuků.'],
        ['Para ořechy', 'OříškovNa', 159, null, '250 g', '🥥', 'vegan,bez-lepku,raw,keto', 'Přirozený zdroj selenu.'],
        ['Pistácie pražené solené', 'OříškovNa', 199, null, '250 g', '💚', 'vegan,bez-lepku', 'Pražené ve skořápce, lehce osolené.'],
      ]},
      { name: 'Semínka', icon: '🌻', products: [
        ['Chia semínka BIO', 'BioZrnko', 89, null, '500 g', '⚫', 'vegan,bez-lepku,bio,raw,keto', 'Vláknina a omega-3 do pudinků i pečiva.'],
        ['Lněné semínko zlaté', 'BioZrnko', 49, null, '500 g', '🟡', 'vegan,bez-lepku,raw', 'Jemnější chuť než hnědé lněné semínko.'],
        ['Dýňová semínka BIO', 'BioZrnko', 129, 109, '500 g', '🎃', 'vegan,bez-lepku,bio,raw,keto', 'Štýrská dýňová semínka bez slupky.'],
        ['Konopná semínka loupaná', 'Horská Bylina', 149, null, '250 g', '🌱', 'vegan,bez-lepku,raw,keto,high-protein', 'Ořechová chuť, 30 % bílkovin.'],
        ['Slunečnicová semínka loupaná', 'BioZrnko', 39, null, '500 g', '🌻', 'vegan,bez-lepku,raw', 'Do salátů, pečiva i müsli.'],
      ]},
      { name: 'Ořechová másla', icon: '🫙', products: [
        ['Arašídové máslo jemné 100 %', 'OříškovNa', 99, null, '500 g', '🥜', 'vegan,bez-lepku,keto,high-protein', 'Jen pražené arašídy. Bez soli, cukru a palmového oleje.'],
        ['Arašídové máslo křupavé', 'OříškovNa', 99, 85, '500 g', '🥜', 'vegan,bez-lepku,keto', 'S kousky arašídů pro správný křup.'],
        ['Mandlový krém 100 %', 'OříškovNa', 229, null, '250 g', '🌰', 'vegan,bez-lepku,raw,keto', 'Z nepražených mandlí, jemně mletý.'],
        ['Kešu krém s bílou čokoládou', 'OříškovNa', 159, null, '250 g', '🤍', 'bez-lepku', 'Hříšně dobrý krém na palačinky.'],
        ['Lískooříškový krém s kakaem', 'OříškovNa', 149, 129, '250 g', '🍫', 'vegan,bez-lepku,bez-cukru', 'Zdravější alternativa oblíbené pomazánky.'],
      ]},
      { name: 'Ořechové mixy', icon: '🥗', products: [
        ['Studentská směs Premium', 'OříškovNa', 129, null, '400 g', '🎓', 'vegan,bez-lepku', 'Ořechy, rozinky a brusinky.'],
        ['Keto mix ořechů', 'KetoLab', 179, null, '400 g', '🥑', 'vegan,bez-lepku,keto', 'Jen nízkosacharidové ořechy, bez sušeného ovoce.'],
      ]},
    ],
  },
  {
    name: 'Superpotraviny', icon: '🌿', color: '#059669', profile: 'superfood',
    description: 'Koncentrovaná výživa z přírody: řasy, prášky, kakao a superovoce.',
    children: [
      { name: 'Zelené prášky a řasy', icon: '🟢', products: [
        ['Spirulina BIO prášek', 'Horská Bylina', 199, null, '200 g', '🟢', 'vegan,bez-lepku,bio,raw,high-protein', 'Modrozelená řasa s 60 % bílkovin.'],
        ['Chlorella BIO tablety', 'Horská Bylina', 249, 219, '250 g', '💊', 'vegan,bez-lepku,bio', 'Přes 1000 tablet z kvalitní chlorelly.'],
        ['Matcha Ceremonial Grade', 'Horská Bylina', 399, null, '50 g', '🍵', 'vegan,bez-lepku,bio', 'Japonská matcha z prvního sběru.'],
        ['Mladý ječmen BIO', 'Horská Bylina', 179, null, '200 g', '🌾', 'vegan,bio,raw', 'Zelená šťáva z mladých lístků ječmene.'],
      ]},
      { name: 'Kořeny a adaptogeny', icon: '🍄', products: [
        ['Maca prášek BIO', 'Horská Bylina', 159, null, '250 g', '🟤', 'vegan,bez-lepku,bio,raw', 'Peruánský kořen pro energii a vitalitu.'],
        ['Ashwagandha prášek', 'Horská Bylina', 189, 169, '200 g', '🌿', 'vegan,bez-lepku,bio', 'Ajurvédský adaptogen pro klidnou mysl.'],
        ['Kurkuma mletá BIO', 'Horská Bylina', 89, null, '250 g', '🟠', 'vegan,bez-lepku,bio', 'Zlaté koření do kari i zlatého mléka.'],
        ['Reishi houbový extrakt', 'Horská Bylina', 349, null, '60 kapslí', '🍄', 'vegan,bez-lepku', 'Tradiční houba pro podporu imunity.'],
      ]},
      { name: 'Kakao a karob', icon: '🍫', products: [
        ['Kakaový prášek raw BIO', 'Sladká Příroda', 149, null, '250 g', '🍫', 'vegan,bez-lepku,bio,raw,keto', 'Nepražené kakao plné antioxidantů.'],
        ['Kakaové boby drcené (nibs)', 'Sladká Příroda', 129, null, '250 g', '🟫', 'vegan,bez-lepku,raw,keto', 'Hořce křupavé do granoly i smoothie bowl.'],
        ['Karobový prášek', 'Sladká Příroda', 69, null, '300 g', '🤎', 'vegan,bez-lepku', 'Přirozeně sladký, bez kofeinu.'],
        ['Hořká čokoláda 85 %', 'Sladká Příroda', 69, 59, '100 g', '🍫', 'vegan,bez-lepku,keto', 'Z kakaových bobů z Ekvádoru.'],
      ]},
      { name: 'Superovoce', icon: '🫐', products: [
        ['Goji kustovnice BIO', 'Horská Bylina', 139, null, '250 g', '🔴', 'vegan,bez-lepku,bio,raw', 'Sušené plody s vysokým obsahem vitaminu C.'],
        ['Acai prášek lyofilizovaný', 'Horská Bylina', 299, null, '100 g', '🫐', 'vegan,bez-lepku,raw', 'Základ pro fialové smoothie bowl.'],
        ['Rakytník sušený', 'Horská Bylina', 119, null, '150 g', '🟠', 'vegan,bez-lepku,raw', 'Česká superpotravina plná vitaminů.'],
        ['Inca berries (mochyně)', 'Horská Bylina', 159, 139, '250 g', '🟡', 'vegan,bez-lepku,raw', 'Sladkokyselá chuť a spousta vlákniny.'],
      ]},
      { name: 'Kolagen', icon: '✨', products: [
        ['Hovězí kolagen hydrolyzovaný', 'NutriVita', 499, 449, '300 g', '✨', 'bez-lepku,keto,high-protein', 'Peptidy kolagenu typu I a III bez chuti.'],
        ['Mořský kolagen s vitaminem C', 'NutriVita', 649, null, '300 g', '🐟', 'bez-lepku,high-protein', 'Rybí kolagen pro pleť, vlasy a klouby.'],
      ]},
    ],
  },
  {
    name: 'Snídaně a cereálie', icon: '🥣', color: '#eab308', profile: 'cereal',
    description: 'Kaše, granoly a pomazánky pro snídaně, které zasytí.',
    children: [
      { name: 'Ovesné vločky a kaše', icon: '🥣', products: [
        ['Ovesné vločky jemné BIO', 'BioZrnko', 49, null, '500 g', '🌾', 'vegan,bio', 'Česká ovesná zrna, válcovaná za studena.'],
        ['Ovesné vločky bezlepkové', 'BioZrnko', 89, null, '500 g', '🌾', 'vegan,bez-lepku', 'Certifikované bez lepku pro celiaky.'],
        ['Proteinová kaše Čokoláda & banán', 'Proteinárna', 249, 219, '1000 g', '🍌', 'high-protein', 'Hotová kaše s 25 g bílkovin v porci.'],
        ['Jáhlová kaše Skořice & jablko', 'BioZrnko', 89, null, '400 g', '🍎', 'vegan,bez-lepku', 'Rychlá jáhlová kaše za 3 minuty.'],
      ]},
      { name: 'Granola a müsli', icon: '🥄', products: [
        ['Granola Lískový oříšek & kakao', 'eSvačina', 139, null, '400 g', '🌰', 'vegan', 'Pečená v malých várkách s javorovým sirupem.'],
        ['Proteinová granola Jahoda', 'Proteinárna', 159, 139, '400 g', '🍓', 'high-protein', 'Křupavá granola s 25 % bílkovin.'],
        ['Keto granola Kokos & mandle', 'KetoLab', 189, null, '300 g', '🥥', 'vegan,bez-lepku,keto,bez-cukru', 'Bez obilovin, jen 4 g sacharidů v porci.'],
        ['Müsli bez přidaného cukru', 'BioZrnko', 99, null, '500 g', '🥣', 'vegan,bez-cukru', 'Vločky, ořechy a sušené ovoce.'],
      ]},
      { name: 'Proteinové palačinky a vafle', icon: '🥞', products: [
        ['Proteinové palačinky Natural', 'Proteinárna', 229, null, '1000 g', '🥞', 'high-protein', 'Stačí přidat vodu a palačinky jsou za 5 minut.'],
        ['Proteinové vafle Mix', 'Proteinárna', 249, 199, '1000 g', '🧇', 'high-protein', 'Nadýchané vafle s 30 % bílkovin.'],
      ]},
      { name: 'Pomazánky a džemy bez cukru', icon: '🍯', products: [
        ['Džem jahodový bez cukru', 'Sladká Příroda', 79, null, '320 g', '🍓', 'vegan,bez-lepku,bez-cukru', '80 % ovoce, slazeno erythritolem.'],
        ['Med květový český', 'Sladká Příroda', 169, null, '500 g', '🍯', 'bez-lepku', 'Od včelaře z Vysočiny.'],
        ['Proteinová pomazánka Lískový oříšek', 'Proteinárna', 149, 129, '250 g', '🌰', 'high-protein,bez-cukru,bez-lepku', 'Jako nutella, ale s 20 % bílkovin.'],
      ]},
    ],
  },
  {
    name: 'Mouky a pečení', icon: '🌾', color: '#a16207', profile: 'flour',
    description: 'Vše pro zdravější pečení: alternativní mouky, sladidla a kypřidla.',
    children: [
      { name: 'Bezlepkové mouky', icon: '🌾', products: [
        ['Pohanková mouka BIO', 'BioZrnko', 59, null, '500 g', '🌾', 'vegan,bez-lepku,bio', 'Celozrnná mouka z loupané pohanky.'],
        ['Rýžová mouka hladká', 'BioZrnko', 45, null, '500 g', '🍚', 'vegan,bez-lepku', 'Univerzální bezlepková mouka.'],
        ['Cizrnová mouka', 'BioZrnko', 59, null, '500 g', '🫘', 'vegan,bez-lepku,high-protein', 'Základ pro placky, falafel i vaječnou náhražku.'],
        ['Bezlepková směs na chleba', 'BioZrnko', 99, 85, '1000 g', '🍞', 'vegan,bez-lepku', 'Vyvážená směs pro domácí bezlepkový chléb.'],
      ]},
      { name: 'Ořechové a keto mouky', icon: '🥥', products: [
        ['Mandlová mouka blanšírovaná', 'OříškovNa', 189, null, '500 g', '🌰', 'vegan,bez-lepku,keto', 'Jemně mletá, ideální na makronky.'],
        ['Kokosová mouka BIO', 'BioZrnko', 79, 65, '500 g', '🥥', 'vegan,bez-lepku,bio,keto', 'Vysoký obsah vlákniny, nízké sacharidy.'],
        ['Psyllium rozpustná vláknina', 'BioZrnko', 129, null, '250 g', '🌿', 'vegan,bez-lepku,keto', 'Pojivo pro keto a bezlepkové pečení.'],
        ['Keto směs na pizzu', 'KetoLab', 149, null, '300 g', '🍕', 'bez-lepku,keto,high-protein', 'Pizza s 5 g sacharidů na porci.'],
      ]},
      { name: 'Sladidla', icon: '🍬', products: [
        ['Erythritol', 'Sladká Příroda', 129, null, '1000 g', '🧊', 'vegan,bez-lepku,keto,bez-cukru', 'Přírodní sladidlo s nulovou energetickou hodnotou.'],
        ['Stévie kapky', 'Sladká Příroda', 99, null, '50 ml', '💧', 'vegan,bez-lepku,keto,bez-cukru', 'Pár kapek osladí celý hrnek.'],
        ['Datlový sirup', 'Sladká Příroda', 119, 99, '400 g', '🌴', 'vegan,bez-lepku', 'Karamelová sladkost s minerály z datlí.'],
        ['Javorový sirup Grade A', 'Sladká Příroda', 249, null, '250 ml', '🍁', 'vegan,bez-lepku', 'Kanadský sirup na palačinky.'],
        ['Kokosový cukr BIO', 'Sladká Příroda', 89, null, '500 g', '🥥', 'vegan,bez-lepku,bio', 'Nerafinovaný cukr z květů kokosové palmy.'],
      ]},
      { name: 'Kypřidla a přísady', icon: '🧁', products: [
        ['Kypřicí prášek bez fosfátů', 'BioZrnko', 25, null, '4 × 12 g', '🧁', 'vegan,bez-lepku', 'Bez fosfátů a lepku.'],
        ['Vanilkový lusk Bourbon', 'Sladká Příroda', 69, null, '2 ks', '🌼', 'vegan,bez-lepku', 'Pravá vanilka z Madagaskaru.'],
      ]},
    ],
  },
  {
    name: 'Těstoviny, rýže a luštěniny', icon: '🍝', color: '#dc2626', profile: 'pasta',
    description: 'Sytá jídla s více bílkovinami a vlákninou.',
    children: [
      { name: 'Luštěninové těstoviny', icon: '🍝', products: [
        ['Těstoviny z červené čočky penne', 'GreenLeaf', 69, null, '250 g', '🍝', 'vegan,bez-lepku,high-protein', 'Jediná surovina: mouka z červené čočky.'],
        ['Těstoviny z cizrny fusilli', 'GreenLeaf', 69, 59, '250 g', '🌀', 'vegan,bez-lepku,high-protein', 'Pevné na skus, 21 g bílkovin na 100 g.'],
        ['Edamame špagety', 'GreenLeaf', 99, null, '200 g', '🫛', 'vegan,bez-lepku,high-protein,keto', '44 % bílkovin a jen 9 g sacharidů.'],
      ]},
      { name: 'Celozrnné a shirataki těstoviny', icon: '🍜', products: [
        ['Celozrnné špagety BIO', 'BioZrnko', 49, null, '500 g', '🍝', 'vegan,bio', 'Z celozrnné semoliny tvrdé pšenice.'],
        ['Shirataki nudle', 'KetoLab', 59, null, '200 g', '🍜', 'vegan,bez-lepku,keto', 'Konjakové nudle s 9 kcal na 100 g.'],
        ['Shirataki rýže', 'KetoLab', 59, 49, '200 g', '🍚', 'vegan,bez-lepku,keto', 'Keto alternativa k rýži.'],
      ]},
      { name: 'Rýže a obiloviny', icon: '🍚', products: [
        ['Quinoa bílá BIO', 'BioZrnko', 119, null, '500 g', '⚪', 'vegan,bez-lepku,bio,high-protein', 'Kompletní bílkovina z pseudoobiloviny.'],
        ['Pohanka loupaná', 'BioZrnko', 59, null, '500 g', '🟤', 'vegan,bez-lepku', 'Česká pohanka, rychlá na vaření.'],
        ['Jasmínová rýže natural', 'BioZrnko', 69, null, '1000 g', '🍚', 'vegan,bez-lepku', 'Celozrnná jasmínová rýže z Thajska.'],
        ['Bulgur celozrnný', 'BioZrnko', 49, null, '500 g', '🌾', 'vegan', 'Hotový za 10 minut, ideální do tabouleh.'],
        ['Jáhly loupané BIO', 'BioZrnko', 55, null, '500 g', '🟡', 'vegan,bez-lepku,bio', 'Královna obilovin, na sladko i slano.'],
      ]},
      { name: 'Luštěniny', icon: '🫘', products: [
        ['Červená čočka loupaná', 'BioZrnko', 49, null, '500 g', '🔴', 'vegan,bez-lepku,high-protein', 'Uvařená za 15 minut, ideální na dal.'],
        ['Cizrna BIO', 'BioZrnko', 59, null, '500 g', '🫘', 'vegan,bez-lepku,bio,high-protein', 'Na hummus, kari i pečené snacky.'],
        ['Černé fazole', 'BioZrnko', 59, 49, '500 g', '⚫', 'vegan,bez-lepku,high-protein', 'Do burrit, chilli i brownies.'],
        ['Mungo fazole', 'BioZrnko', 55, null, '500 g', '🟢', 'vegan,bez-lepku,high-protein', 'Na klíčení i indické polévky.'],
      ]},
    ],
  },
  {
    name: 'Oleje, octy a dochucovadla', icon: '🫒', color: '#65a30d', profile: 'oil',
    description: 'Kvalitní tuky, koření a omáčky bez cukru.',
    children: [
      { name: 'Oleje', icon: '🫒', products: [
        ['Extra panenský olivový olej', 'Horská Bylina', 299, null, '750 ml', '🫒', 'vegan,bez-lepku,keto', 'Z řeckých oliv Koroneiki, první lisování.'],
        ['Kokosový olej panenský BIO', 'Horská Bylina', 189, 159, '1000 ml', '🥥', 'vegan,bez-lepku,bio,keto', 'Za studena lisovaný s vůní kokosu.'],
        ['MCT olej C8', 'KetoLab', 349, null, '500 ml', '🧈', 'vegan,bez-lepku,keto', 'Rychlá energie pro keto i neprůstřelnou kávu.'],
        ['Ghí přepuštěné máslo', 'Horská Bylina', 219, null, '300 g', '🧈', 'bez-lepku,keto', 'Ideální na smažení, bez laktózy a kaseinu.'],
      ]},
      { name: 'Octy', icon: '🍶', products: [
        ['Jablečný ocet nefiltrovaný BIO', 'Horská Bylina', 89, null, '500 ml', '🍏', 'vegan,bez-lepku,bio', 'S „matkou“ octa, nepasterizovaný.'],
        ['Balzamikový ocet z Modeny', 'Horská Bylina', 149, null, '250 ml', '🍇', 'vegan,bez-lepku', 'Zrající v dubových sudech.'],
      ]},
      { name: 'Koření a směsi', icon: '🧂', products: [
        ['Himálajská sůl růžová', 'Horská Bylina', 49, null, '500 g', '🧂', 'vegan,bez-lepku', 'Nerafinovaná sůl s minerály.'],
        ['Kari směs Madras', 'Horská Bylina', 59, null, '100 g', '🍛', 'vegan,bez-lepku', 'Pikantní kari bez glutamátu.'],
        ['Lahůdkové droždí', 'GreenLeaf', 89, 75, '150 g', '🧀', 'vegan,bez-lepku,high-protein', 'Sýrová chuť pro veganské omáčky, s B12.'],
        ["Za'atar směs", 'Horská Bylina', 69, null, '80 g', '🌿', 'vegan,bez-lepku', 'Tymián, sezam a sumak.'],
      ]},
      { name: 'Omáčky a zero sirupy', icon: '🍯', products: [
        ['Zero sirup Slaný karamel', 'KetoLab', 99, null, '350 ml', '🍮', 'vegan,bez-lepku,keto,bez-cukru', 'Sladký sirup s nulou kalorií.'],
        ['Zero sirup Javor', 'KetoLab', 99, 85, '350 ml', '🍁', 'vegan,bez-lepku,keto,bez-cukru', 'Na palačinky bez výčitek.'],
        ['Kečup bez přidaného cukru', 'GreenLeaf', 79, null, '350 g', '🍅', 'vegan,bez-lepku,bez-cukru', 'O 80 % méně cukru než klasika.'],
        ['Tamari sójová omáčka', 'GreenLeaf', 119, null, '250 ml', '🥢', 'vegan,bez-lepku', 'Bezlepková japonská sójová omáčka.'],
        ['Tahini sezamová pasta', 'OříškovNa', 129, null, '300 g', '🫙', 'vegan,bez-lepku,keto', 'Ze 100 % loupaného sezamu.'],
      ]},
    ],
  },
  {
    name: 'Nápoje', icon: '☕', color: '#0ea5e9', profile: 'drink',
    description: 'Čaje, káva, rostlinná mléka a funkční nápoje.',
    children: [
      { name: 'Čaje', icon: '🍵', products: [
        ['Zelený čaj Sencha BIO', 'Horská Bylina', 129, null, '100 g', '🍵', 'vegan,bez-lepku,bio', 'Japonská sencha s jemnou travnatou chutí.'],
        ['Bylinný čaj Klidný večer', 'Horská Bylina', 89, null, '20 sáčků', '🌙', 'vegan,bez-lepku,bio', 'Meduňka, levandule a heřmánek.'],
        ['Rooibos s vanilkou', 'Horská Bylina', 99, 85, '100 g', '🌺', 'vegan,bez-lepku', 'Jihoafrický čaj bez kofeinu.'],
      ]},
      { name: 'Káva a alternativy', icon: '☕', products: [
        ['Výběrová káva Etiopie zrnková', 'eSvačina', 289, null, '250 g', '☕', 'vegan,bez-lepku', 'Ovocné tóny borůvek a jasmínu.'],
        ['Houbová káva s lion\'s mane', 'Horská Bylina', 349, 299, '200 g', '🍄', 'vegan,bez-lepku', 'Méně kofeinu, více soustředění.'],
        ['Cikorková káva', 'BioZrnko', 79, null, '200 g', '🟤', 'vegan', 'Bez kofeinu, s chutí po kávě.'],
      ]},
      { name: 'Rostlinná mléka', icon: '🥛', products: [
        ['Ovesné mléko Barista', 'GreenLeaf', 49, null, '1 l', '🥛', 'vegan', 'Krásně se napění na cappuccino.'],
        ['Mandlové mléko bez cukru', 'GreenLeaf', 59, 49, '1 l', '🌰', 'vegan,bez-lepku,bez-cukru,keto', 'Jen 13 kcal na 100 ml.'],
        ['Kokosové mléko na vaření', 'GreenLeaf', 45, null, '400 ml', '🥥', 'vegan,bez-lepku,keto', '17 % tuku pro krémová kari.'],
        ['Sójové mléko proteinové', 'GreenLeaf', 45, null, '1 l', '🫘', 'vegan,bez-lepku,high-protein', '4 g bílkovin na 100 ml.'],
      ]},
      { name: 'Funkční nápoje', icon: '🧃', products: [
        ['Kombucha Zázvor & citron', 'GreenLeaf', 69, null, '330 ml', '🫚', 'vegan,bez-lepku,bio', 'Živá fermentovaná kombucha.'],
        ['Proteinový nápoj Čokoláda', 'Proteinárna', 59, 49, '330 ml', '🧋', 'high-protein,bez-lepku', 'Hotový shake s 25 g bílkovin.'],
        ['Kokosová voda 100 %', 'GreenLeaf', 49, null, '330 ml', '🥥', 'vegan,bez-lepku', 'Přírodní izotonický nápoj.'],
      ]},
    ],
  },
  {
    name: 'Vitamíny a doplňky', icon: '💊', color: '#e11d48', profile: 'supplement',
    description: 'Doplňky stravy pro imunitu, energii a celkovou vitalitu.',
    children: [
      { name: 'Vitamíny', icon: '🍊', products: [
        ['Vitamin D3 + K2 kapky', 'NutriVita', 249, null, '30 ml', '☀️', 'bez-lepku', '1000 IU D3 s menachinonem K2 MK-7.'],
        ['Vitamin C 1000 mg s šípkem', 'NutriVita', 199, 169, '100 tablet', '🍊', 'vegan,bez-lepku', 'S postupným uvolňováním.'],
        ['B-komplex aktivní', 'NutriVita', 229, null, '60 kapslí', '🅱️', 'vegan,bez-lepku', 'Aktivní formy vitaminů skupiny B.'],
      ]},
      { name: 'Minerály', icon: '🪨', products: [
        ['Hořčík bisglycinát', 'NutriVita', 299, null, '90 kapslí', '🌙', 'vegan,bez-lepku', 'Dobře vstřebatelná forma hořčíku.'],
        ['Zinek pikolinát 25 mg', 'NutriVita', 179, null, '90 kapslí', '🛡️', 'vegan,bez-lepku', 'Pro imunitu, pleť a vlasy.'],
      ]},
      { name: 'Omega-3', icon: '🐟', products: [
        ['Omega-3 rybí olej 1000 mg', 'NutriVita', 349, 299, '120 kapslí', '🐟', 'bez-lepku', 'Vysoký obsah EPA a DHA.'],
        ['Vegan omega-3 z řas', 'NutriVita', 449, null, '60 kapslí', '🌊', 'vegan,bez-lepku', 'DHA z mořských řas pro vegany.'],
      ]},
      { name: 'Probiotika a trávení', icon: '🦠', products: [
        ['Probiotika 20 kmenů', 'NutriVita', 399, null, '30 kapslí', '🦠', 'vegan,bez-lepku', '20 miliard CFU v jedné kapsli.'],
        ['Inulin z čekanky', 'BioZrnko', 129, null, '250 g', '🌼', 'vegan,bez-lepku,keto', 'Prebiotická vláknina pro střevní mikrobiom.'],
      ]},
    ],
  },
  {
    name: 'Keto a low-carb', icon: '🥑', color: '#16a34a', profile: 'keto',
    description: 'Produkty s minimem sacharidů pro keto a nízkosacharidové stravování.',
    children: [
      { name: 'Keto snacky', icon: '🥓', products: [
        ['Keto tyčinka Čokoláda & mandle', 'KetoLab', 49, null, '40 g', '🍫', 'keto,bez-cukru,bez-lepku', 'Jen 2 g čistých sacharidů.'],
        ['Sýrové chipsy Parmazán', 'KetoLab', 79, 69, '60 g', '🧀', 'keto,bez-lepku,high-protein', '100% pečený parmazán.'],
        ['Keto sušenky Kokos', 'KetoLab', 89, null, '120 g', '🥥', 'keto,bez-cukru,bez-lepku', 'Mandlová mouka, kokos a máslo.'],
      ]},
      { name: 'Low-carb pečivo', icon: '🍞', products: [
        ['Proteinový chléb low-carb', 'KetoLab', 89, null, '250 g', '🍞', 'keto,high-protein', 'Jen 4 g sacharidů v plátku.'],
        ['Keto tortilly', 'KetoLab', 99, 85, '6 ks', '🌮', 'keto,high-protein', 'Pružné tortilly s vlákninou.'],
      ]},
    ],
  },
  {
    name: 'Vegan a rostlinné', icon: '🌱', color: '#22c55e', profile: 'vegan',
    description: 'Rostlinné alternativy, které chutnají i nevegánům.',
    children: [
      { name: 'Rostlinné alternativy masa', icon: '🍔', products: [
        ['Tofu natural BIO', 'GreenLeaf', 59, null, '200 g', '⬜', 'vegan,bez-lepku,bio,high-protein', 'Pevné tofu na grilování i do woku.'],
        ['Tempeh BIO', 'GreenLeaf', 79, null, '200 g', '🟫', 'vegan,bez-lepku,bio,high-protein', 'Fermentovaná sója s ořechovou chutí.'],
        ['Sójové kostky', 'GreenLeaf', 49, 39, '250 g', '🧱', 'vegan,high-protein', 'Textured soy protein na guláše a omáčky.'],
      ]},
      { name: 'Veganské sladkosti', icon: '🍬', products: [
        ['Veganské gumové bonbony Ovoce', 'Sladká Příroda', 59, null, '100 g', '🍬', 'vegan,bez-lepku', 'Bez želatiny, s ovocnými šťávami.'],
        ['Veganská mléčná čokoláda rýžová', 'Sladká Příroda', 79, null, '100 g', '🍫', 'vegan,bez-lepku', 'Krémová čokoláda s rýžovým mlékem.'],
      ]},
    ],
  },
  {
    name: 'Pro děti', icon: '🧒', color: '#ec4899', profile: 'snack',
    description: 'Zdravé svačinky, které děti opravdu snědí.',
    children: [
      { name: 'Dětské svačinky', icon: '🍪', products: [
        ['Dětské ovesné sušenky Banán', 'BioZrnko', 49, null, '120 g', '🍌', 'vegan,bio,bez-cukru', 'Slazené jen banánem.'],
        ['Ovocné kostky Jablko & jahoda', 'Sladká Příroda', 39, null, '5 × 20 g', '🧩', 'vegan,bez-lepku', '100% ovoce, bez přidaného cukru.'],
      ]},
      { name: 'Ovocné kapsičky', icon: '🍐', products: [
        ['Ovocná kapsička Jablko & hruška', 'Sladká Příroda', 29, null, '120 g', '🍐', 'vegan,bez-lepku,bio', 'Pyré z bio ovoce bez cukru.'],
        ['Ovocná kapsička Borůvka & banán', 'Sladká Příroda', 29, 25, '120 g', '🫐', 'vegan,bez-lepku,bio', 'Oblíbená kombinace pro malé jedlíky.'],
      ]},
    ],
  },
  {
    name: 'Dárkové balíčky', icon: '🎁', color: '#8b5cf6', profile: 'snack',
    description: 'Zdravé dárky pro každou příležitost.',
    children: [
      { name: 'Dárkové boxy', icon: '🎁', products: [
        ['Dárkový box Zdravé mlsání', 'eSvačina', 599, 499, '1 box', '🎁', 'vegan', 'Ořechy, tyčinky, čokoláda a sušené ovoce.'],
        ['Dárkový box Fitness', 'eSvačina', 899, null, '1 box', '🏋️', 'high-protein', 'Protein, tyčinky, shaker a kreatin.'],
        ['Dárkový box Čajový rituál', 'eSvačina', 549, null, '1 box', '🫖', 'vegan,bio', 'Výběr čajů, med a keramický hrnek.'],
      ]},
    ],
  },
];

/** Typical nutrition per 100 g by category profile (energy kcal, g otherwise). */
export const NUTRITION = {
  protein: { energy: 380, fat: 6, saturated: 3, carbs: 8, sugar: 4, fiber: 2, protein: 75, salt: 0.4 },
  snack: { energy: 410, fat: 16, saturated: 4, carbs: 52, sugar: 24, fiber: 7, protein: 9, salt: 0.3 },
  nuts: { energy: 600, fat: 52, saturated: 6, carbs: 14, sugar: 4, fiber: 9, protein: 21, salt: 0.02 },
  superfood: { energy: 330, fat: 7, saturated: 2, carbs: 35, sugar: 12, fiber: 18, protein: 22, salt: 0.5 },
  cereal: { energy: 390, fat: 9, saturated: 2, carbs: 60, sugar: 9, fiber: 9, protein: 14, salt: 0.1 },
  flour: { energy: 360, fat: 6, saturated: 1, carbs: 65, sugar: 3, fiber: 8, protein: 12, salt: 0.02 },
  pasta: { energy: 345, fat: 2, saturated: 0.4, carbs: 55, sugar: 3, fiber: 10, protein: 22, salt: 0.05 },
  oil: { energy: 820, fat: 90, saturated: 14, carbs: 1, sugar: 0.5, fiber: 0, protein: 0.5, salt: 0.1 },
  drink: { energy: 45, fat: 1.5, saturated: 0.3, carbs: 6, sugar: 3, fiber: 0.5, protein: 1.5, salt: 0.1 },
  supplement: { energy: 250, fat: 5, saturated: 1, carbs: 20, sugar: 1, fiber: 3, protein: 10, salt: 0.2 },
  keto: { energy: 480, fat: 38, saturated: 12, carbs: 6, sugar: 2, fiber: 12, protein: 24, salt: 0.8 },
  vegan: { energy: 190, fat: 9, saturated: 1.5, carbs: 8, sugar: 1, fiber: 4, protein: 18, salt: 0.6 },
};
