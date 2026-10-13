import { rule } from '../ruleBuilder.ts';
import type { RuleEntry } from '../types.ts';
import { CRICKET_EXTRAS_RULES } from './rulesExtras.ts';

// Cricket rulebook: MCC Laws of Cricket and ICC men's T20I playing conditions, simplified for fans.
// Order of every tuple: en, hinglish (Latin), hi (Devanagari), gu (Gujarati).

const CRICKET_CORE_RULES: readonly RuleEntry[] = [
  rule(
    'run-out',
    ['Run out', 'Run out', 'रन आउट', 'રન આઉટ'],
    [
      'A batter is out when a fielder breaks the stumps with the ball before the batter reaches the crease.',
      'Batter tab out hota hai jab fielder ball se stumps tod de aur batter crease tak na pahunche.',
      'बल्लेबाज़ तब आउट होता है जब फ़ील्डर गेंद से स्टंप तोड़ दे और बल्लेबाज़ क्रीज़ तक न पहुँचे।',
      'બેટર ત્યારે આઉટ થાય છે જ્યારે ફિલ્ડર બોલથી સ્ટમ્પ તોડે અને બેટર ક્રીઝ સુધી ન પહોંચે.',
    ],
    [
      'It can happen while running or even on a wide or no-ball. The bowler does not get credit for a run out. Whichever batter was short of the crease is the one who is out.',
      'Ye run daudte waqt ya wide aur no-ball par bhi ho sakta hai. Run out ka credit bowler ko nahi milta. Jo batter crease se bahar tha wahi out hota hai.',
      'यह रन दौड़ते समय या वाइड और नो-बॉल पर भी हो सकता है। रन आउट का श्रेय गेंदबाज़ को नहीं मिलता। जो बल्लेबाज़ क्रीज़ से बाहर था वही आउट होता है।',
      'આ રન દોડતી વખતે કે વાઇડ અને નો-બોલ પર પણ થઈ શકે છે. રન આઉટનો શ્રેય બોલરને મળતો નથી. જે બેટર ક્રીઝની બહાર હોય તે જ આઉટ થાય છે.',
    ],
    ['stumped', 'free-hit'],
  ),
  rule(
    'stumped',
    ['Stumped', 'Stumped', 'स्टंप आउट', 'સ્ટમ્પ આઉટ'],
    [
      'The wicketkeeper breaks the stumps with the ball while the batter is out of the crease and not running.',
      'Wicketkeeper ball se stumps tod de jab batter crease se bahar ho aur run ke liye na daud raha ho.',
      'विकेटकीपर गेंद से स्टंप तोड़ दे जब बल्लेबाज़ क्रीज़ से बाहर हो और रन के लिए न दौड़ रहा हो।',
      'વિકેટકીપર બોલથી સ્ટમ્પ તોડે જ્યારે બેટર ક્રીઝની બહાર હોય અને રન માટે દોડતો ન હોય.',
    ],
    [
      "It usually happens when a batter steps out to hit a spinner and misses. It is counted as the bowler's wicket. It is not possible off a no-ball.",
      'Ye aksar tab hota hai jab batter spinner ko maarne aage nikalta hai aur ball miss kar deta hai. Ye bowler ka wicket ginta hai. No-ball par stumped nahi ho sakta.',
      'यह अक्सर तब होता है जब बल्लेबाज़ स्पिनर को मारने आगे निकलता है और गेंद चूक जाता है। यह गेंदबाज़ का विकेट गिना जाता है। नो-बॉल पर स्टंप आउट नहीं हो सकता।',
      'આ મોટે ભાગે ત્યારે થાય છે જ્યારે બેટર સ્પિનરને મારવા આગળ આવે અને બોલ ચૂકી જાય. તે બોલરની વિકેટ ગણાય છે. નો-બોલ પર સ્ટમ્પ આઉટ થઈ શકતો નથી.',
    ],
    ['run-out', 'wide'],
  ),
  rule(
    'lbw',
    [
      'LBW (leg before wicket)',
      'LBW (leg before wicket)',
      'एलबीडब्ल्यू (लेग बिफ़ोर विकेट)',
      'એલબીડબ્લ્યુ (લેગ બિફોર વિકેટ)',
    ],
    [
      "Out when the ball hits the batter's pad or body and the umpire judges it would have gone on to hit the stumps.",
      'Out tab jab ball batter ke pad ya body se lage aur umpire ko lage ki wo stumps par lagti.',
      'आउट तब जब गेंद बल्लेबाज़ के पैड या शरीर से लगे और अंपायर को लगे कि वह स्टंप पर लगती।',
      'આઉટ ત્યારે જ્યારે બોલ બેટરના પેડ કે શરીરને લાગે અને અમ્પાયરને લાગે કે તે સ્ટમ્પ પર લાગત.',
    ],
    [
      'The ball must not have pitched outside leg stump, and it must have hit the batter in line with the stumps unless the batter was not playing a shot. If the bat hit the ball first, it is not LBW.',
      'Ball leg stump ke bahar pitch nahi honi chahiye, aur wo stumps ki line mein lagni chahiye. Pehle bat se lagi ho to LBW nahi hota.',
      'गेंद लेग स्टंप के बाहर पिच नहीं होनी चाहिए, और वह स्टंप की सीध में लगनी चाहिए। पहले बल्ले से लगी हो तो एलबीडब्ल्यू नहीं होता।',
      'બોલ લેગ સ્ટમ્પની બહાર પિચ થયો ન હોવો જોઈએ, અને તે સ્ટમ્પની લાઇનમાં લાગવો જોઈએ. પહેલાં બેટને લાગ્યો હોય તો એલબીડબ્લ્યુ નથી.',
    ],
    ['drs', 'bowled'],
  ),
  rule(
    'caught',
    ['Caught', 'Caught', 'कैच आउट', 'કેચ આઉટ'],
    [
      "Out when a fielder catches the ball cleanly, before it bounces, after it touches the bat or the batter's glove.",
      'Out tab jab fielder ball ko bounce hone se pehle saaf pakad le, bat ya glove se lagne ke baad.',
      'आउट तब जब फ़ील्डर बल्ले या दस्ताने से लगने के बाद गेंद को उछलने से पहले साफ़ पकड़ ले।',
      'આઉટ ત્યારે જ્યારે ફિલ્ડર બેટ કે ગ્લવ્સને લાગ્યા પછી બોલને ઉછળે તે પહેલાં સાફ પકડી લે.',
    ],
    [
      'The catch is only valid if the fielder is in control of the ball and not touching the boundary. The wicketkeeper can also take catches. The bowler gets credit for the wicket.',
      'Catch tabhi valid hai jab fielder ball ko control mein rakhe aur boundary ko na chhue. Wicketkeeper bhi catch le sakta hai. Wicket ka credit bowler ko milta hai.',
      'कैच तभी वैध है जब फ़ील्डर गेंद पर नियंत्रण रखे और बाउंड्री को न छुए। विकेटकीपर भी कैच ले सकता है। विकेट का श्रेय गेंदबाज़ को मिलता है।',
      'કેચ ત્યારે જ માન્ય છે જ્યારે ફિલ્ડર બોલ પર કાબૂ રાખે અને બાઉન્ડ્રીને અડે નહીં. વિકેટકીપર પણ કેચ લઈ શકે છે. વિકેટનો શ્રેય બોલરને મળે છે.',
    ],
    ['bowled', 'lbw'],
  ),
  rule(
    'bowled',
    ['Bowled', 'Bowled', 'बोल्ड', 'બોલ્ડ'],
    [
      'Out when the bowled ball hits the stumps and knocks off a bail, even if it touched the bat or body first.',
      'Out tab jab ball stumps par lage aur bail gir jaye, chahe pehle bat ya body se lagi ho.',
      'आउट तब जब गेंद स्टंप पर लगे और बेल गिर जाए, चाहे पहले बल्ले या शरीर से लगी हो।',
      'આઉટ ત્યારે જ્યારે બોલ સ્ટમ્પને લાગે અને બેલ પડી જાય, ભલે પહેલાં બેટ કે શરીરને લાગ્યો હોય.',
    ],
    [
      "It is the bowler's wicket. It does not count on a no-ball, so a bowled batter on a free hit stays in. A wide cannot be a bowled dismissal either.",
      'Ye bowler ka wicket hota hai. No-ball par ye nahi ginta, isliye free hit par bowled hua batter out nahi hota. Wide par bhi bowled nahi hota.',
      'यह गेंदबाज़ का विकेट होता है। नो-बॉल पर यह नहीं गिना जाता, इसलिए फ्री हिट पर बोल्ड हुआ बल्लेबाज़ आउट नहीं होता। वाइड पर भी बोल्ड नहीं होता।',
      'આ બોલરની વિકેટ છે. નો-બોલ પર તે ગણાતું નથી, એટલે ફ્રી હિટ પર બોલ્ડ થયેલો બેટર આઉટ થતો નથી. વાઇડ પર પણ બોલ્ડ ગણાતું નથી.',
    ],
    ['free-hit-bowled-not-out', 'caught'],
  ),
  rule(
    'drs',
    ['DRS (review)', 'DRS (review)', 'डीआरएस (रिव्यू)', 'ડીઆરએસ (રિવ્યૂ)'],
    [
      'A team can ask the third umpire to check an on-field decision using ball tracking and sound technology.',
      'Team third umpire se on-field decision ko ball tracking aur sound technology se check karwa sakti hai.',
      'टीम तीसरे अंपायर से ऑन-फ़ील्ड फ़ैसले को बॉल ट्रैकिंग और साउंड तकनीक से जँचवा सकती है।',
      'ટીમ થર્ડ અમ્પાયર પાસે ઓન-ફિલ્ડ નિર્ણયને બોલ ટ્રેકિંગ અને સાઉન્ડ ટેકનોલોજીથી તપાસાવી શકે છે.',
    ],
    [
      "Each team gets a limited number of reviews per innings and loses one if the decision stays the same. If the replay is marginal, the umpire's original call stands and the review is kept.",
      'Har team ko innings mein limited reviews milte hain aur decision wahi rahe to ek review chala jaata hai. Replay marginal ho to umpire ka original call rehta hai aur review bacha rehta hai.',
      'हर टीम को पारी में सीमित रिव्यू मिलते हैं और फ़ैसला वही रहे तो एक रिव्यू चला जाता है। रीप्ले मार्जिनल हो तो अंपायर का मूल फ़ैसला रहता है और रिव्यू बचा रहता है।',
      'દરેક ટીમને ઇનિંગમાં મર્યાદિત રિવ્યૂ મળે છે અને નિર્ણય એ જ રહે તો એક રિવ્યૂ જાય છે. રીપ્લે માર્જિનલ હોય તો અમ્પાયરનો મૂળ નિર્ણય રહે છે અને રિવ્યૂ બચે છે.',
    ],
    ['lbw'],
  ),
  rule(
    'maiden',
    ['Maiden over', 'Maiden over', 'मेडन ओवर', 'મેડન ઓવર'],
    [
      'An over of six legal balls in which the bowler gives away no runs.',
      'Chhe legal balls ka ek over jismein bowler koi run nahi deta.',
      'छह वैध गेंदों का वह ओवर जिसमें गेंदबाज़ कोई रन नहीं देता।',
      'છ કાયદેસર બોલનો એવો ઓવર જેમાં બોલર કોઈ રન આપતો નથી.',
    ],
    [
      'Byes and leg-byes do not spoil a maiden because they are not charged to the bowler. A wide or a no-ball does. Maidens are rare and valuable in T20.',
      'Byes aur leg-byes se maiden kharab nahi hota kyunki wo bowler ke naam nahi jaate. Wide ya no-ball se hota hai. T20 mein maiden bahut kam aur keemti hota hai.',
      'बाई और लेग-बाई से मेडन ख़राब नहीं होता क्योंकि वे गेंदबाज़ के नाम नहीं जातीं। वाइड या नो-बॉल से होता है। टी20 में मेडन बहुत कम और क़ीमती होता है।',
      'બાય અને લેગ-બાયથી મેડન બગડતો નથી કારણ કે તે બોલરના નામે નથી જતા. વાઇડ કે નો-બોલથી બગડે છે. ટી20માં મેડન બહુ ઓછા અને કિંમતી હોય છે.',
    ],
    ['wide', 'no-ball'],
  ),
  rule(
    'powerplay',
    ['Powerplay', 'Powerplay', 'पावरप्ले', 'પાવરપ્લે'],
    [
      'The first six overs of a T20 innings, when only two fielders may stand outside the 30-yard circle.',
      'T20 innings ke pehle chhe over, jab sirf do fielder 30-yard circle ke bahar khade ho sakte hain.',
      'टी20 पारी के पहले छह ओवर, जब सिर्फ़ दो फ़ील्डर 30-यार्ड सर्कल के बाहर खड़े हो सकते हैं।',
      'ટી20 ઇનિંગના પહેલા છ ઓવર, જ્યારે ફક્ત બે ફિલ્ડર 30-યાર્ડ સર્કલની બહાર ઊભા રહી શકે છે.',
    ],
    [
      'With fewer fielders deep, batters can hit boundaries more easily. After the sixth over, up to five fielders may be outside the circle.',
      'Kam fielders door hone se batters ko boundary maarna aasaan hota hai. Chhathe over ke baad paanch fielder tak circle ke bahar ho sakte hain.',
      'कम फ़ील्डर दूर होने से बल्लेबाज़ों के लिए बाउंड्री मारना आसान होता है। छठे ओवर के बाद पाँच फ़ील्डर तक सर्कल के बाहर हो सकते हैं।',
      'ઓછા ફિલ્ડર દૂર હોવાથી બેટર્સ માટે બાઉન્ડ્રી મારવી સરળ બને છે. છઠ્ઠા ઓવર પછી પાંચ ફિલ્ડર સુધી સર્કલની બહાર હોઈ શકે છે.',
    ],
    ['required-rate'],
  ),
  rule(
    'required-rate',
    ['Required run rate', 'Required run rate', 'आवश्यक रन रेट', 'જરૂરી રન રેટ'],
    [
      'The runs per over the chasing team must score from here on to win.',
      'Chase kar rahi team ko jeetne ke liye yahan se har over mein kitne run banane hain.',
      'पीछा कर रही टीम को जीतने के लिए यहाँ से हर ओवर में कितने रन बनाने हैं।',
      'પીછો કરતી ટીમે જીતવા માટે અહીંથી દર ઓવરમાં કેટલા રન બનાવવા પડશે.',
    ],
    [
      'It is the runs still needed divided by the overs left. If it climbs above the current run rate, the chase is getting harder. It changes after every ball.',
      'Ye bache hue runs ko bache hue overs se bhaag dene par aata hai. Current run rate se upar jaaye to chase mushkil ho raha hai. Ye har ball ke baad badalta hai.',
      'यह बचे हुए रनों को बचे हुए ओवरों से भाग देने पर आता है। करंट रन रेट से ऊपर जाए तो चेज़ मुश्किल हो रहा है। यह हर गेंद के बाद बदलता है।',
      'આ બાકી રહેલા રનને બાકી ઓવરથી ભાગવાથી આવે છે. કરંટ રન રેટથી ઉપર જાય તો ચેઝ અઘરો બની રહ્યો છે. તે દરેક બોલ પછી બદલાય છે.',
    ],
    ['powerplay'],
  ),
];

export const CRICKET_RULES: readonly RuleEntry[] = [...CRICKET_EXTRAS_RULES, ...CRICKET_CORE_RULES];
