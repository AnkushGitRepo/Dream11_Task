import { rule } from '../ruleBuilder.ts';
import type { RuleEntry } from '../types.ts';

// Kabaddi rulebook: Pro Kabaddi League / Kabaddi Federation of India rules for the seven-a-side
// game, simplified for fans. Order of every tuple: en, hinglish (Latin), hi (Devanagari), gu (Gujarati).

export const KABADDI_RULES: readonly RuleEntry[] = [
  rule(
    'raid',
    ['Raid', 'Raid', 'रेड', 'રેડ'],
    [
      "One attacker, the raider, enters the opponents' half and tries to touch defenders and get back within 30 seconds.",
      'Ek attacker, yaani raider, opponent ke half mein jaakar defenders ko chhoota hai aur 30 second mein wapas aane ki koshish karta hai.',
      'एक अटैकर, यानी रेडर, विपक्षी के हाफ़ में जाकर डिफ़ेंडरों को छूता है और 30 सेकंड में वापस आने की कोशिश करता है।',
      'એક એટેકર, એટલે રેડર, વિરોધીના હાફમાં જઈને ડિફેન્ડર્સને અડે છે અને 30 સેકન્ડમાં પાછા આવવાનો પ્રયત્ન કરે છે.',
    ],
    [
      'The raider must keep chanting "kabaddi" in a single breath. Every defender touched is out and earns a point. If the defenders hold the raider so they cannot return, the raider is out.',
      'Raider ko ek saans mein "kabaddi" bolte rehna hota hai. Jitne defenders ko chhoota hai wo out hote hain aur point milta hai. Defenders raider ko pakad kar wapas na aane den to raider out.',
      'रेडर को एक साँस में "कबड्डी" बोलते रहना होता है। जितने डिफ़ेंडर को छूता है वे आउट होते हैं और पॉइंट मिलता है। डिफ़ेंडर रेडर को पकड़कर वापस न आने दें तो रेडर आउट।',
      'રેડરે એક શ્વાસમાં "કબડ્ડી" બોલતા રહેવું પડે છે. જેટલા ડિફેન્ડરને અડે તે આઉટ થાય છે અને પોઇન્ટ મળે છે. ડિફેન્ડર્સ રેડરને પકડી પાછો ન આવવા દે તો રેડર આઉટ.',
    ],
    ['do-or-die-raid', 'super-raid', 'bonus-line'],
  ),
  rule(
    'bonus-line',
    ['Bonus line', 'Bonus line', 'बोनस लाइन', 'બોનસ લાઇન'],
    [
      "A line near the defenders' end: a raider who reaches it with a foot in the air can earn a bonus point.",
      'Defenders ke taraf ki ek line: raider paanv hawa mein rakhkar usse paar kare to bonus point mil sakta hai.',
      'डिफ़ेंडरों की तरफ़ की एक लाइन: रेडर पाँव हवा में रखकर उसे पार करे तो बोनस पॉइंट मिल सकता है।',
      'ડિફેન્ડર્સ તરફની એક લાઇન: રેડર પગ હવામાં રાખીને તેને પાર કરે તો બોનસ પોઇન્ટ મળી શકે છે.',
    ],
    [
      'The bonus point only counts when the defending team has six or more players on the mat. The raider still has to return safely to keep it. It can score a point even if no defender is touched.',
      'Bonus point tabhi milta hai jab defending team ke chhe ya zyada player mat par ho. Raider ko ise bachane ke liye surakshit wapas aana padta hai. Kisi defender ko chhue bina bhi point mil sakta hai.',
      'बोनस पॉइंट तभी मिलता है जब डिफ़ेंडिंग टीम के छह या ज़्यादा खिलाड़ी मैट पर हों। रेडर को इसे बचाने के लिए सुरक्षित वापस आना पड़ता है। किसी डिफ़ेंडर को छुए बिना भी पॉइंट मिल सकता है।',
      'બોનસ પોઇન્ટ ત્યારે જ મળે છે જ્યારે ડિફેન્ડિંગ ટીમના છ કે વધુ ખેલાડી મેટ પર હોય. રેડરે તેને બચાવવા સુરક્ષિત પાછા આવવું પડે છે. કોઈ ડિફેન્ડરને અડ્યા વગર પણ પોઇન્ટ મળી શકે છે.',
    ],
    ['raid', 'baulk-line'],
  ),
  rule(
    'baulk-line',
    ['Baulk line', 'Baulk line', 'बॉक लाइन', 'બોક લાઇન'],
    [
      "A line in the defenders' half that every raider must cross with a foot; a raider who comes back without crossing it is out.",
      'Defenders ke half ki ek line jise har raider ko paar karna hi padta hai; bina paar kiye wapas aaya to raider out.',
      'डिफ़ेंडरों के हाफ़ की एक लाइन जिसे हर रेडर को पार करना ही होता है; बिना पार किए लौटा तो रेडर आउट।',
      'ડિફેન્ડર્સના હાફની એક લાઇન જે દરેક રેડરે પાર કરવી જ પડે; પાર કર્યા વગર પાછો આવે તો રેડર આઉટ.',
    ],
    [
      'If the raider crosses it but scores nothing and returns safely, it is an empty raid. Two empty raids in a row make the next one a do-or-die raid.',
      'Agar raider ise paar kare par koi point na le aur safe wapas aa jaaye, to wo khaali raid hai. Lagatar do khaali raid ke baad agli do-or-die raid hoti hai.',
      'अगर रेडर इसे पार करे पर कोई पॉइंट न ले और सुरक्षित लौट आए, तो वह ख़ाली रेड है। लगातार दो ख़ाली रेड के बाद अगली डू-ऑर-डाई रेड होती है।',
      'જો રેડર તેને પાર કરે પણ કોઈ પોઇન્ટ ન લે અને સલામત પાછો આવે, તો તે ખાલી રેડ છે. સતત બે ખાલી રેડ પછીની રેડ ડુ-ઓર-ડાઇ રેડ હોય છે.',
    ],
    ['bonus-line', 'do-or-die-raid'],
  ),
  rule(
    'super-tackle',
    ['Super tackle', 'Super tackle', 'सुपर टैकल', 'સુપર ટેકલ'],
    [
      'When the defending team has three or fewer players on the mat and still tackles the raider, they earn 2 points instead of 1.',
      'Mat par teen ya kam defender hon aur phir bhi raider ko tackle kar len, to 1 ki jagah 2 point milte hain.',
      'मैट पर तीन या कम डिफ़ेंडर हों और फिर भी रेडर को टैकल कर लें, तो 1 की जगह 2 पॉइंट मिलते हैं।',
      'ડિફેન્ડિંગ ટીમ પાસે મેટ પર ત્રણ કે ઓછા ખેલાડી હોય અને છતાં રેડરને ટેકલ કરે, તો 1 ની જગ્યાએ 2 પોઇન્ટ મળે છે.',
    ],
    [
      'It rewards a team for holding firm while outnumbered. A super tackle also sends the raider out as normal. It can turn a match when a team is close to an all-out.',
      'Ye sankhya mein kam hone par bhi daat kar rehne wali team ko inaam deta hai. Super tackle mein raider normal tareeke se out hota hai. All-out ke kareeb team ke liye ye match palat sakta hai.',
      'यह संख्या में कम होने पर भी डटी रहने वाली टीम को इनाम देता है। सुपर टैकल में रेडर सामान्य तरीक़े से आउट होता है। ऑल-आउट के क़रीब टीम के लिए यह मैच पलट सकता है।',
      'તે સંખ્યામાં ઓછા હોવા છતાં ટકી રહેતી ટીમને ઇનામ આપે છે. સુપર ટેકલમાં રેડર સામાન્ય રીતે આઉટ થાય છે. ઓલ-આઉટની નજીક ટીમ માટે તે મેચ પલટી શકે છે.',
    ],
    ['all-out', 'raid'],
  ),
  rule(
    'all-out',
    ['All-out', 'All-out', 'ऑल-आउट', 'ઓલ-આઉટ'],
    [
      'When every player of a team is out, the other team gets 2 bonus points and the team is revived in full.',
      'Ek team ke saare player out ho jaayen to doosri team ko 2 bonus point milte hain aur team poori wapas aati hai.',
      'एक टीम के सारे खिलाड़ी आउट हो जाएँ तो दूसरी टीम को 2 बोनस पॉइंट मिलते हैं और टीम पूरी वापस आती है।',
      'જ્યારે એક ટીમના બધા ખેલાડી આઉટ થાય, ત્યારે બીજી ટીમને 2 બોનસ પોઇન્ટ મળે છે અને ટીમ પૂરી પાછી આવી જાય છે.',
    ],
    [
      'It is one of the biggest swings in the game. Players who were out all return to the mat together. A team close to an all-out usually plays safe to avoid it.',
      'Ye khel ke sabse bade palat mein se ek hai. Out hue saare player ek saath mat par wapas aate hain. All-out ke kareeb team aksar bachne ke liye surakshit khelti hai.',
      'यह खेल के सबसे बड़े पलटावों में से एक है। आउट हुए सारे खिलाड़ी एक साथ मैट पर लौटते हैं। ऑल-आउट के क़रीब टीम अक्सर बचने के लिए सुरक्षित खेलती है।',
      'આ રમતના સૌથી મોટા પલટાઓમાંનો એક છે. આઉટ થયેલા બધા ખેલાડી એકસાથે મેટ પર પાછા આવે છે. ઓલ-આઉટની નજીક ટીમ મોટે ભાગે બચવા સુરક્ષિત રમે છે.',
    ],
    ['super-tackle', 'revival'],
  ),
  rule(
    'do-or-die-raid',
    ['Do-or-die raid', 'Do-or-die raid', 'डू-ऑर-डाई रेड', 'ડુ-ઓર-ડાઇ રેડ'],
    [
      'The third raid in a row by a team without scoring: the raider must score a point or be out.',
      'Ek team ki lagatar teesri raid jismein point nahi bana: raider ko point banana hi hoga warna out.',
      'एक टीम की लगातार तीसरी रेड जिसमें पॉइंट नहीं बना: रेडर को पॉइंट बनाना ही होगा वरना आउट।',
      'એક ટીમની સતત ત્રીજી રેડ જેમાં પોઇન્ટ ન બન્યો: રેડરે પોઇન્ટ બનાવવો જ પડશે નહીંતર આઉટ.',
    ],
    [
      'The two earlier raids were empty, so the pressure is on. An empty raid here sends the raider out and gives the other team a point. A bonus point still counts as scoring.',
      'Pehli do raid khaali thi, isliye dabav hota hai. Yahan khaali raid par raider out hota hai aur doosri team ko point milta hai. Bonus point bhi scoring maana jaata hai.',
      'पहली दो रेड ख़ाली थीं, इसलिए दबाव होता है। यहाँ ख़ाली रेड पर रेडर आउट होता है और दूसरी टीम को पॉइंट मिलता है। बोनस पॉइंट भी स्कोरिंग माना जाता है।',
      'પહેલી બે રેડ ખાલી હતી, એટલે દબાણ હોય છે. અહીં ખાલી રેડ પર રેડર આઉટ થાય છે અને બીજી ટીમને પોઇન્ટ મળે છે. બોનસ પોઇન્ટ પણ સ્કોરિંગ ગણાય છે.',
    ],
    ['raid', 'baulk-line'],
  ),
  rule(
    'super-raid',
    ['Super raid', 'Super raid', 'सुपर रेड', 'સુપર રેડ'],
    [
      'A single raid in which the raider scores three or more points.',
      'Ek hi raid jismein raider teen ya zyada point banata hai.',
      'एक ही रेड जिसमें रेडर तीन या ज़्यादा पॉइंट बनाता है।',
      'એક જ રેડ જેમાં રેડર ત્રણ કે વધુ પોઇન્ટ બનાવે છે.',
    ],
    [
      'Touching three or more defenders, or two plus the bonus, makes a super raid. Such a raid can set up an all-out. It also brings several players back to the raiding team.',
      'Teen ya zyada defenders ko chhoone se, ya do aur bonus se, super raid banti hai. Aisi raid all-out ki taraf le ja sakti hai. Isse raiding team ke kai player wapas bhi aate hain.',
      'तीन या ज़्यादा डिफ़ेंडर को छूने से, या दो और बोनस से, सुपर रेड बनती है। ऐसी रेड ऑल-आउट की ओर ले जा सकती है। इससे रेडिंग टीम के कई खिलाड़ी वापस भी आते हैं।',
      'ત્રણ કે વધુ ડિફેન્ડરને અડવાથી, કે બે અને બોનસથી, સુપર રેડ બને છે. આવી રેડ ઓલ-આઉટ તરફ લઈ જઈ શકે છે. તેનાથી રેડિંગ ટીમના ઘણા ખેલાડી પાછા પણ આવે છે.',
    ],
    ['raid', 'revival'],
  ),
  rule(
    'revival',
    ['Revival', 'Revival', 'रिवाइवल', 'રિવાઇવલ'],
    [
      'Whenever a team scores a point, one of its own out players comes back onto the mat.',
      'Jab bhi team ek point banati hai, uska ek out player wapas mat par aa jaata hai.',
      'जब भी टीम एक पॉइंट बनाती है, उसका एक आउट खिलाड़ी वापस मैट पर आ जाता है।',
      'જ્યારે પણ ટીમ એક પોઇન્ટ બનાવે છે, તેનો એક આઉટ ખેલાડી પાછો મેટ પર આવે છે.',
    ],
    [
      'Players return in the order they went out, first out and first back. So a team is never permanently down a player. A big raid can bring several players back at once.',
      'Player usi order mein wapas aate hain jis order mein out hue the, jo pehle out wo pehle wapas. Isliye team hamesha ke liye player kam nahi rehti. Badi raid se kai player ek saath wapas aa sakte hain.',
      'खिलाड़ी उसी क्रम में लौटते हैं जिसमें आउट हुए थे, जो पहले आउट वह पहले वापस। इसलिए टीम हमेशा के लिए खिलाड़ी कम नहीं रहती। बड़ी रेड से कई खिलाड़ी एक साथ वापस आ सकते हैं।',
      'ખેલાડીઓ જે ક્રમમાં આઉટ થયા તે જ ક્રમમાં પાછા આવે છે, જે પહેલાં આઉટ તે પહેલાં પાછો. એટલે ટીમ કાયમ માટે ખેલાડી ઓછો રહેતી નથી. મોટી રેડથી ઘણા ખેલાડી એકસાથે પાછા આવી શકે છે.',
    ],
    ['all-out', 'super-raid'],
  ),
];
