import { rule } from '../ruleBuilder.ts';
import type { RuleEntry } from '../types.ts';

// Cricket rulebook, part 1: extras and the free hit.
// Order of every tuple: en, hinglish (Latin), hi (Devanagari), gu (Gujarati).

export const CRICKET_EXTRAS_RULES: readonly RuleEntry[] = [
  rule(
    'no-ball',
    ['No-ball', 'No-ball', 'नो-बॉल', 'નો-બોલ'],
    [
      'An illegal delivery, usually from overstepping: the batting side gets 1 run and the ball is bowled again.',
      'Ye illegal ball hai, aksar pair line ke aage padne par: batting team ko 1 run milta hai aur ball dobara dalni padti hai.',
      'यह अवैध गेंद है, अक्सर पैर लाइन से आगे पड़ने पर: बल्लेबाज़ी टीम को 1 रन मिलता है और गेंद दोबारा डाली जाती है।',
      'આ ગેરકાયદેસર બોલ છે, ઘણી વાર પગ લાઇનથી આગળ પડે ત્યારે: બેટિંગ ટીમને 1 રન મળે છે અને બોલ ફરી નખાય છે.',
    ],
    [
      'A dangerous high full toss is also a no-ball. The batter cannot be bowled, caught, LBW or stumped off it. The next ball is a free hit.',
      'Khatarnak high full toss bhi no-ball hota hai. Is ball par batter bowled, caught, LBW ya stumped nahi ho sakta. Agli ball free hit hoti hai.',
      'ख़तरनाक ऊँची फुल टॉस भी नो-बॉल होती है। इस गेंद पर बल्लेबाज़ बोल्ड, कैच, एलबीडब्ल्यू या स्टंप आउट नहीं हो सकता। अगली गेंद फ्री हिट होती है।',
      'જોખમી ઊંચો ફુલ ટોસ પણ નો-બોલ ગણાય છે. આ બોલ પર બેટર બોલ્ડ, કેચ, એલબીડબ્લ્યુ કે સ્ટમ્પ આઉટ થઈ શકતો નથી. પછીનો બોલ ફ્રી હિટ હોય છે.',
    ],
    ['free-hit', 'wide'],
  ),
  rule(
    'free-hit',
    ['Free hit', 'Free hit', 'फ्री हिट', 'ફ્રી હિટ'],
    [
      'The ball after a no-ball: the batter cannot be out in most ways, so they can swing freely.',
      'No-ball ke baad ki ball: batter zyadatar tareekon se out nahi ho sakta, isliye khul ke shot khel sakta hai.',
      'नो-बॉल के बाद की गेंद: बल्लेबाज़ ज़्यादातर तरीक़ों से आउट नहीं हो सकता, इसलिए खुलकर शॉट खेल सकता है।',
      'નો-બોલ પછીનો બોલ: બેટર મોટા ભાગની રીતે આઉટ થઈ શકતો નથી, એટલે ખુલ્લા મને શોટ મારી શકે છે.',
    ],
    [
      'Only a run out, hitting the ball twice or obstructing the field can get the batter out on a free hit. Bowled, caught, LBW and stumped do not count. Runs still count.',
      'Free hit par sirf run out, ball do baar maarna ya fielder ko rokna out hota hai. Bowled, caught, LBW aur stumped nahi lagte. Runs phir bhi jodte hain.',
      'फ्री हिट पर सिर्फ़ रन आउट, गेंद को दो बार मारना या फ़ील्डर को रोकना आउट होता है। बोल्ड, कैच, एलबीडब्ल्यू और स्टंप नहीं लगते। रन फिर भी जुड़ते हैं।',
      'ફ્રી હિટ પર ફક્ત રન આઉટ, બોલને બે વાર મારવો કે ફિલ્ડરને રોકવો આઉટ ગણાય છે. બોલ્ડ, કેચ, એલબીડબ્લ્યુ અને સ્ટમ્પ લાગતા નથી. રન છતાં ગણાય છે.',
    ],
    ['no-ball', 'free-hit-bowled-not-out'],
  ),
  rule(
    'free-hit-bowled-not-out',
    ['Bowled on a free hit', 'Free hit par bowled', 'फ्री हिट पर बोल्ड', 'ફ્રી હિટ પર બોલ્ડ'],
    [
      'Hitting the stumps on a free hit does not get the batter out, and the batters may still run.',
      'Free hit par ball stumps par lage to batter out nahi hota, aur batters phir bhi run daud sakte hain.',
      'फ्री हिट पर गेंद स्टंप पर लगे तो बल्लेबाज़ आउट नहीं होता, और बल्लेबाज़ फिर भी रन दौड़ सकते हैं।',
      'ફ્રી હિટ પર બોલ સ્ટમ્પને લાગે તો બેટર આઉટ થતો નથી, અને બેટર્સ છતાં રન દોડી શકે છે.',
    ],
    [
      'The ball stays live after it hits the stumps. If the batters run, those runs are counted as byes because the bat did not touch the ball. Only a run out can still dismiss them.',
      'Stumps lagne ke baad bhi ball live rehti hai. Batters run lein to wo runs byes gine jaate hain kyunki bat ball se nahi laga. Sirf run out hi unhe out kar sakta hai.',
      'स्टंप लगने के बाद भी गेंद लाइव रहती है। बल्लेबाज़ रन लें तो वे रन बाई गिने जाते हैं क्योंकि बल्ला गेंद से नहीं लगा। सिर्फ़ रन आउट ही उन्हें आउट कर सकता है।',
      'સ્ટમ્પ લાગ્યા પછી પણ બોલ લાઇવ રહે છે. બેટર્સ રન લે તો તે રન બાય ગણાય છે કારણ કે બેટ બોલને અડ્યું નથી. ફક્ત રન આઉટ જ તેમને આઉટ કરી શકે છે.',
    ],
    ['free-hit', 'bye', 'bowled'],
  ),
  rule(
    'wide',
    ['Wide', 'Wide', 'वाइड', 'વાઇડ'],
    [
      'A ball too wide for the batter to reach: 1 run to the batting side and it is bowled again.',
      'Ball itni door ki ki batter tak nahi pahunch sakta: batting team ko 1 run milta hai aur ball dobara dalni padti hai.',
      'गेंद इतनी दूर की कि बल्लेबाज़ तक न पहुँचे: बल्लेबाज़ी टीम को 1 रन मिलता है और गेंद दोबारा डाली जाती है।',
      'બોલ એટલો દૂર કે બેટર સુધી ન પહોંચે: બેટિંગ ટીમને 1 રન મળે છે અને બોલ ફરી નખાય છે.',
    ],
    [
      'A wide does not count as one of the six legal balls in the over. If the batters also run, those runs are added as wides. The batter can only be run out, stumped or hit wicket off a wide.',
      'Wide over ki chhe legal balls mein nahi ginti jaati. Batters run lein to wo bhi wides mein jodte hain. Wide par batter sirf run out, stumped ya hit wicket ho sakta hai.',
      'वाइड ओवर की छह वैध गेंदों में नहीं गिनी जाती। बल्लेबाज़ रन लें तो वे भी वाइड में जुड़ते हैं। वाइड पर बल्लेबाज़ सिर्फ़ रन आउट, स्टंप या हिट विकेट हो सकता है।',
      'વાઇડ ઓવરના છ કાયદેસર બોલમાં ગણાતો નથી. બેટર્સ રન લે તો તે પણ વાઇડમાં ઉમેરાય છે. વાઇડ પર બેટર ફક્ત રન આઉટ, સ્ટમ્પ કે હિટ વિકેટ થઈ શકે છે.',
    ],
    ['no-ball', 'bye'],
  ),
  rule(
    'bye',
    ['Bye', 'Bye', 'बाई', 'બાય'],
    [
      "Runs taken when the ball misses the bat and the batter's body: they count as extras, not to the batter or bowler.",
      'Jab ball bat aur batter ke body se bacha kar nikal jaye aur run bane: ye extras hain, na batter ke, na bowler ke naam.',
      'जब गेंद बल्ले और बल्लेबाज़ के शरीर को छुए बिना निकल जाए और रन बनें: ये एक्स्ट्रा हैं, न बल्लेबाज़ के नाम, न गेंदबाज़ के।',
      'જ્યારે બોલ બેટ અને બેટરના શરીરને અડ્યા વગર નીકળી જાય અને રન બને: આ એક્સ્ટ્રા છે, બેટર કે બોલરના નામે નથી.',
    ],
    [
      'Byes are added to the team total only. The ball still counts as a legal ball in the over. Byes usually happen when the wicketkeeper misses the ball.',
      'Byes sirf team total mein judte hain. Ball over ki legal ball hi ginti hai. Byes aksar tab hote hain jab wicketkeeper ball chhod deta hai.',
      'बाई सिर्फ़ टीम के स्कोर में जुड़ती हैं। गेंद ओवर की वैध गेंद गिनी जाती है। बाई अक्सर तब होती हैं जब विकेटकीपर गेंद चूक जाता है।',
      'બાય ફક્ત ટીમના સ્કોરમાં ઉમેરાય છે. બોલ ઓવરનો કાયદેસર બોલ ગણાય છે. બાય મોટે ભાગે વિકેટકીપર બોલ ચૂકી જાય ત્યારે થાય છે.',
    ],
    ['leg-bye', 'wide'],
  ),
  rule(
    'leg-bye',
    ['Leg-bye', 'Leg-bye', 'लेग-बाई', 'લેગ-બાય'],
    [
      "Runs taken after the ball hits the batter's body, not the bat: they go down as extras.",
      'Ball batter ke body se lagke jaye, bat se nahi, aur run bane to wo extras mein jaate hain.',
      'गेंद बल्लेबाज़ के शरीर से लगकर जाए, बल्ले से नहीं, और रन बनें तो वे एक्स्ट्रा में जाते हैं।',
      'બોલ બેટરના શરીરને લાગીને જાય, બેટને નહીં, અને રન બને તો તે એક્સ્ટ્રામાં જાય છે.',
    ],
    [
      'It only counts if the batter was playing a shot or trying to avoid the ball. The runs are not given to the batter or the bowler. The ball is still a legal ball.',
      'Ye tabhi gina jaata hai jab batter shot khel raha ho ya ball se bachne ki koshish kar raha ho. Runs na batter ko milte hain na bowler ko. Ball legal ball hi rehti hai.',
      'यह तभी गिना जाता है जब बल्लेबाज़ शॉट खेल रहा हो या गेंद से बचने की कोशिश कर रहा हो। रन न बल्लेबाज़ को मिलते हैं न गेंदबाज़ को। गेंद वैध ही रहती है।',
      'આ ત્યારે જ ગણાય છે જ્યારે બેટર શોટ રમતો હોય કે બોલથી બચવાનો પ્રયત્ન કરતો હોય. રન બેટર કે બોલરને મળતા નથી. બોલ કાયદેસર જ રહે છે.',
    ],
    ['bye', 'lbw'],
  ),
];
