import { rule } from '../ruleBuilder.js';
import type { RuleEntry } from '../types.js';

// Football rulebook: IFAB Laws of the Game, simplified for fans.
// Order of every tuple: en, hinglish (Latin), hi (Devanagari), gu (Gujarati).

export const FOOTBALL_RULES: readonly RuleEntry[] = [
  rule(
    'offside',
    ['Offside', 'Offside', 'ऑफ़साइड', 'ઓફસાઇડ'],
    [
      'An attacker is offside if they are nearer the goal line than the ball and the second-last defender when the ball is played to them.',
      'Attacker offside hai agar pass ke waqt wo ball aur doosre aakhri defender dono se goal line ke zyada paas ho.',
      'अटैकर ऑफ़साइड है अगर पास के समय वह गेंद और दूसरे आख़िरी डिफ़ेंडर दोनों से गोल लाइन के ज़्यादा पास हो।',
      'એટેકર ઓફસાઇડ છે જો પાસ વખતે તે બોલ અને બીજા છેલ્લા ડિફેન્ડર બંનેથી ગોલ લાઇનની વધુ નજીક હોય.',
    ],
    [
      'Being in an offside position is not a foul by itself; it only counts when the player joins the play. A player cannot be offside in their own half or from a throw-in, goal kick or corner. The free kick goes to the defending team.',
      'Sirf offside position mein hona foul nahi hai; khel mein hissa lene par hi ginta hai. Apne half mein ya throw-in, goal kick, corner se offside nahi hota. Free kick defending team ko milta hai.',
      'सिर्फ़ ऑफ़साइड पोज़ीशन में होना फ़ाउल नहीं है; खेल में हिस्सा लेने पर ही गिना जाता है। अपने हाफ़ में या थ्रो-इन, गोल किक, कॉर्नर से ऑफ़साइड नहीं होता। फ़्री किक डिफ़ेंडिंग टीम को मिलती है।',
      'ફક્ત ઓફસાઇડ પોઝિશનમાં હોવું ફાઉલ નથી; રમતમાં ભાગ લે ત્યારે જ ગણાય છે. પોતાના હાફમાં કે થ્રો-ઇન, ગોલ કિક, કોર્નરથી ઓફસાઇડ થતું નથી. ફ્રી કિક ડિફેન્ડિંગ ટીમને મળે છે.',
    ],
    ['free-kick', 'var'],
  ),
  rule(
    'penalty',
    ['Penalty kick', 'Penalty', 'पेनल्टी', 'પેનલ્ટી'],
    [
      'A free shot at goal from 11 metres with only the goalkeeper to beat, given for a foul inside the penalty area.',
      'Penalty area ke andar foul hone par 11 metre se goal par seedha shot milta hai, sirf goalkeeper saamne hota hai.',
      'पेनल्टी एरिया के अंदर फ़ाउल होने पर 11 मीटर से गोल पर सीधा शॉट मिलता है, सिर्फ़ गोलकीपर सामने होता है।',
      'પેનલ્ટી એરિયાની અંદર ફાઉલ થાય ત્યારે 11 મીટરથી ગોલ પર સીધો શોટ મળે છે, સામે ફક્ત ગોલકીપર હોય છે.',
    ],
    [
      'All other players must stay outside the area until the kick is taken. The goalkeeper must keep one foot on the line until the ball is struck. If it is saved or hits the post, play can continue.',
      'Baaki sab players kick hone tak area ke bahar rehte hain. Goalkeeper ka ek pair line par rehna chahiye jab tak ball na maari jaaye. Save ho ya post lage to khel chalta rehta hai.',
      'बाक़ी सब खिलाड़ी किक होने तक एरिया के बाहर रहते हैं। गोलकीपर का एक पैर लाइन पर रहना चाहिए जब तक गेंद न मारी जाए। सेव हो या पोस्ट लगे तो खेल चलता रहता है।',
      'બાકીના બધા ખેલાડીઓ કિક થાય ત્યાં સુધી એરિયાની બહાર રહે છે. ગોલકીપરનો એક પગ લાઇન પર રહેવો જોઈએ જ્યાં સુધી બોલ મારવામાં ન આવે. સેવ થાય કે પોસ્ટ લાગે તો રમત ચાલુ રહે છે.',
    ],
    ['free-kick', 'var'],
  ),
  rule(
    'free-kick',
    ['Free kick', 'Free kick', 'फ़्री किक', 'ફ્રી કિક'],
    [
      'A restart given to a team after a foul by the opponent, taken from where the foul happened.',
      'Opponent ke foul ke baad team ko milne wala restart, jahan foul hua wahin se liya jaata hai.',
      'विपक्षी के फ़ाउल के बाद टीम को मिलने वाला रीस्टार्ट, जहाँ फ़ाउल हुआ वहीं से लिया जाता है।',
      'વિરોધીના ફાઉલ પછી ટીમને મળતી રીસ્ટાર્ટ, જ્યાં ફાઉલ થયો ત્યાંથી લેવાય છે.',
    ],
    [
      'A direct free kick can go straight into the goal; an indirect one must touch another player first. The opponents must stay at least 9.15 metres away. Fouls inside the box are penalties instead.',
      'Direct free kick seedha goal mein ja sakti hai; indirect pehle kisi aur player ko lagni chahiye. Opponents kam se kam 9.15 metre door rehte hain. Box ke andar foul par penalty milti hai.',
      'डायरेक्ट फ़्री किक सीधे गोल में जा सकती है; इनडायरेक्ट पहले किसी और खिलाड़ी को लगनी चाहिए। विपक्षी कम से कम 9.15 मीटर दूर रहते हैं। बॉक्स के अंदर फ़ाउल पर पेनल्टी मिलती है।',
      'ડાયરેક્ટ ફ્રી કિક સીધી ગોલમાં જઈ શકે છે; ઇનડાયરેક્ટ પહેલાં બીજા ખેલાડીને લાગવી જોઈએ. વિરોધીઓ ઓછામાં ઓછા 9.15 મીટર દૂર રહે છે. બોક્સની અંદર ફાઉલ પર પેનલ્ટી મળે છે.',
    ],
    ['penalty', 'offside'],
  ),
  rule(
    'yellow-card',
    ['Yellow card', 'Yellow card', 'येलो कार्ड', 'યલો કાર્ડ'],
    [
      'A caution from the referee for a reckless foul or unsporting act; the player stays on the pitch.',
      'Referee ki warning, lapravah foul ya unsporting harkat ke liye; player maidan par rehta hai.',
      'रेफ़री की चेतावनी, लापरवाह फ़ाउल या अखेलभावना वाली हरकत के लिए; खिलाड़ी मैदान पर रहता है।',
      'રેફરીની ચેતવણી, બેદરકાર ફાઉલ કે અખેલદિલી વર્તન માટે; ખેલાડી મેદાન પર રહે છે.',
    ],
    [
      'Two yellow cards in one match become a red card and the player is sent off. Yellows often follow time-wasting, dissent or a tactical foul. Cards can also carry over into suspensions in tournaments.',
      'Ek match mein do yellow card ka matlab red card aur player bahar. Yellow aksar time waste, bahas ya tactical foul par milta hai. Tournament mein cards ban bhi la sakte hain.',
      'एक मैच में दो येलो कार्ड का मतलब रेड कार्ड और खिलाड़ी बाहर। येलो अक्सर टाइम वेस्ट, बहस या टैक्टिकल फ़ाउल पर मिलता है। टूर्नामेंट में कार्ड बैन भी ला सकते हैं।',
      'એક મેચમાં બે યલો કાર્ડ એટલે રેડ કાર્ડ અને ખેલાડી બહાર. યલો ઘણી વાર સમય બગાડવા, દલીલ કે ટેક્ટિકલ ફાઉલ પર મળે છે. ટૂર્નામેન્ટમાં કાર્ડ પ્રતિબંધ પણ લાવી શકે છે.',
    ],
    ['red-card'],
  ),
  rule(
    'red-card',
    ['Red card', 'Red card', 'रेड कार्ड', 'રેડ કાર્ડ'],
    [
      'The player is sent off and cannot be replaced, so their team plays the rest of the match a player short.',
      'Player ko bahar bhej diya jaata hai aur uski jagah koi nahi aa sakta, isliye team baaki match ek player kam se khelti hai.',
      'खिलाड़ी को बाहर भेज दिया जाता है और उसकी जगह कोई नहीं आ सकता, इसलिए टीम बाक़ी मैच एक खिलाड़ी कम से खेलती है।',
      'ખેલાડીને બહાર કાઢવામાં આવે છે અને તેની જગ્યાએ કોઈ આવી શકતું નથી, એટલે ટીમ બાકીની મેચ એક ખેલાડી ઓછા સાથે રમે છે.',
    ],
    [
      'It is shown for serious foul play, violent conduct, or stopping a clear goal-scoring chance. A second yellow card also leads to red. The player usually misses the next match too.',
      'Ye gambhir foul, hinsak vyavhar ya saaf goal ka mauka rokne par dikhaya jaata hai. Doosra yellow card bhi red ban jaata hai. Player aksar agla match bhi miss karta hai.',
      'यह गंभीर फ़ाउल, हिंसक व्यवहार या साफ़ गोल का मौक़ा रोकने पर दिखाया जाता है। दूसरा येलो कार्ड भी रेड बन जाता है। खिलाड़ी अक्सर अगला मैच भी मिस करता है।',
      'આ ગંભીર ફાઉલ, હિંસક વર્તન કે સ્પષ્ટ ગોલની તક રોકવા પર બતાવાય છે. બીજું યલો કાર્ડ પણ રેડ બને છે. ખેલાડી ઘણી વાર આગલી મેચ પણ ચૂકે છે.',
    ],
    ['yellow-card'],
  ),
  rule(
    'var',
    [
      'VAR (video assistant referee)',
      'VAR (video assistant referee)',
      'वीएआर (वीडियो असिस्टेंट रेफ़री)',
      'વીએઆર (વિડિયો આસિસ્ટન્ટ રેફરી)',
    ],
    [
      'A team of officials watching video who help the referee correct clear mistakes in goals, penalties, red cards and mistaken identity.',
      'Video dekhne wale officials jo referee ko goal, penalty, red card aur galat player ke maamlon mein saaf galti sudharne mein madad karte hain.',
      'वीडियो देखने वाले अधिकारी जो रेफ़री को गोल, पेनल्टी, रेड कार्ड और ग़लत खिलाड़ी के मामलों में साफ़ ग़लती सुधारने में मदद करते हैं।',
      'વિડિયો જોતા અધિકારીઓની ટીમ જે રેફરીને ગોલ, પેનલ્ટી, રેડ કાર્ડ અને ખોટા ખેલાડીના કિસ્સામાં સ્પષ્ટ ભૂલ સુધારવામાં મદદ કરે છે.',
    ],
    [
      'VAR only steps in for a clear and obvious error, not for every close call. The referee can also go to the pitchside monitor to look again. The final decision always stays with the referee.',
      'VAR sirf saaf aur spasht galti par aata hai, har close call par nahi. Referee pitch ke kinare monitor par bhi dobara dekh sakta hai. Antim faisla hamesha referee ka hota hai.',
      'वीएआर सिर्फ़ साफ़ और स्पष्ट ग़लती पर आता है, हर क्लोज़ कॉल पर नहीं। रेफ़री पिच के किनारे मॉनिटर पर भी दोबारा देख सकता है। अंतिम फ़ैसला हमेशा रेफ़री का होता है।',
      'વીએઆર ફક્ત સ્પષ્ટ ભૂલ પર આવે છે, દરેક નજીકના નિર્ણય પર નહીં. રેફરી પિચની બાજુના મોનિટર પર ફરી જોઈ શકે છે. અંતિમ નિર્ણય હંમેશા રેફરીનો હોય છે.',
    ],
    ['offside', 'penalty'],
  ),
  rule(
    'corner',
    ['Corner kick', 'Corner', 'कॉर्नर', 'કોર્નર'],
    [
      'A kick from the corner flag awarded to the attackers when a defender last touches the ball before it crosses their goal line.',
      'Jab defender ka aakhri touch lagke ball unki goal line paar kare, to attackers ko corner flag se kick milti hai.',
      'जब डिफ़ेंडर के आख़िरी टच के बाद गेंद उनकी गोल लाइन पार करे, तो अटैकर्स को कॉर्नर फ़्लैग से किक मिलती है।',
      'જ્યારે ડિફેન્ડરના છેલ્લા ટચ પછી બોલ તેમની ગોલ લાઇન પાર કરે, ત્યારે એટેકર્સને કોર્નર ફ્લેગથી કિક મળે છે.',
    ],
    [
      'A goal can be scored directly from a corner. The ball must be placed inside the corner arc. Defenders must stay 9.15 metres away until the ball is in play.',
      'Corner se seedha goal ho sakta hai. Ball corner arc ke andar rakhi jaati hai. Defenders ball khel mein aane tak 9.15 metre door rehte hain.',
      'कॉर्नर से सीधे गोल हो सकता है। गेंद कॉर्नर आर्क के अंदर रखी जाती है। डिफ़ेंडर गेंद के खेल में आने तक 9.15 मीटर दूर रहते हैं।',
      'કોર્નરથી સીધો ગોલ થઈ શકે છે. બોલ કોર્નર આર્કની અંદર મુકાય છે. ડિફેન્ડર્સ બોલ રમતમાં આવે ત્યાં સુધી 9.15 મીટર દૂર રહે છે.',
    ],
    ['free-kick'],
  ),
  rule(
    'stoppage-time',
    ['Stoppage time', 'Stoppage time', 'स्टॉपेज टाइम', 'સ્ટોપેજ ટાઇમ'],
    [
      'Extra minutes added at the end of each half to make up for time lost to injuries, substitutions and delays.',
      'Chot, substitution aur deri mein barbaad hua waqt poora karne ke liye har half ke ant mein jode gaye extra minute.',
      'चोट, सब्स्टीट्यूशन और देरी में बर्बाद हुआ समय पूरा करने के लिए हर हाफ़ के अंत में जोड़े गए अतिरिक्त मिनट।',
      'ઈજા, સબસ્ટિટ્યુશન અને વિલંબમાં ગયેલો સમય પૂરો કરવા દરેક હાફના અંતે ઉમેરાયેલી વધારાની મિનિટો.',
    ],
    [
      'The referee decides the amount and the fourth official shows the minimum on a board. It can be longer if more delays happen. It is also called added time or injury time.',
      'Kitna time dena hai ye referee tay karta hai aur fourth official board par kam se kam time dikhata hai. Aur deri ho to ye badh sakta hai. Ise added time ya injury time bhi kehte hain.',
      'कितना समय देना है यह रेफ़री तय करता है और चौथा अधिकारी बोर्ड पर कम से कम समय दिखाता है। और देरी हो तो यह बढ़ सकता है। इसे एडेड टाइम या इंजरी टाइम भी कहते हैं।',
      'કેટલો સમય આપવો તે રેફરી નક્કી કરે છે અને ચોથો અધિકારી બોર્ડ પર ઓછામાં ઓછો સમય બતાવે છે. વધુ વિલંબ થાય તો તે વધી શકે છે. તેને એડેડ ટાઇમ કે ઇન્જરી ટાઇમ પણ કહે છે.',
    ],
    ['extra-time'],
  ),
  rule(
    'handball',
    ['Handball', 'Handball', 'हैंडबॉल', 'હેન્ડબોલ'],
    [
      'A foul when a player deliberately touches the ball with their hand or arm, or makes their body unnaturally bigger.',
      'Foul tab jab player jaan-boojh kar haath ya baanh se ball chhue, ya apne sharir ko ajeeb tareeke se bada kare.',
      'फ़ाउल तब जब खिलाड़ी जान-बूझकर हाथ या बाँह से गेंद छुए, या अपने शरीर को अस्वाभाविक रूप से बड़ा करे।',
      'ફાઉલ ત્યારે જ્યારે ખેલાડી જાણીજોઈને હાથ કે બાંયથી બોલને અડે, કે શરીરને અસ્વાભાવિક રીતે મોટું કરે.',
    ],
    [
      'Accidental contact is not always a foul, but a goal scored straight off a hand or arm is disallowed. Inside the penalty area, a handball by a defender gives a penalty. The goalkeeper can use their hands inside their own area.',
      'Anjaane mein chhoo jana hamesha foul nahi hota, par haath se lagke hua goal nahi ginta. Penalty area mein defender ka handball penalty deta hai. Goalkeeper apne area mein haath use kar sakta hai.',
      'अनजाने में छू जाना हमेशा फ़ाउल नहीं होता, पर हाथ से लगकर हुआ गोल नहीं गिना जाता। पेनल्टी एरिया में डिफ़ेंडर का हैंडबॉल पेनल्टी देता है। गोलकीपर अपने एरिया में हाथ इस्तेमाल कर सकता है।',
      'અજાણતા અડી જવું હંમેશા ફાઉલ નથી, પણ હાથથી લાગીને થયેલો ગોલ માન્ય ગણાતો નથી. પેનલ્ટી એરિયામાં ડિફેન્ડરનો હેન્ડબોલ પેનલ્ટી અપાવે છે. ગોલકીપર પોતાના એરિયામાં હાથ વાપરી શકે છે.',
    ],
    ['penalty', 'free-kick'],
  ),
  rule(
    'extra-time',
    ['Extra time', 'Extra time', 'एक्स्ट्रा टाइम', 'એક્સ્ટ્રા ટાઇમ'],
    [
      'Two extra halves of 15 minutes played when a knockout match is level after 90 minutes.',
      'Knockout match 90 minute baad barabar ho to khele jaane wale 15-15 minute ke do extra half.',
      'नॉकआउट मैच 90 मिनट बाद बराबर हो तो खेले जाने वाले 15-15 मिनट के दो अतिरिक्त हाफ़।',
      'નોકઆઉટ મેચ 90 મિનિટ પછી બરાબર હોય તો રમાતા 15-15 મિનિટના બે વધારાના હાફ.',
    ],
    [
      'If the score is still level after extra time, the match goes to a penalty shoot-out. Goals scored in extra time count in the final score.',
      'Extra time ke baad bhi barabar ho to match penalty shoot-out mein jaata hai. Extra time ke goal final score mein ginte hain.',
      'एक्स्ट्रा टाइम के बाद भी बराबरी हो तो मैच पेनल्टी शूट-आउट में जाता है। एक्स्ट्रा टाइम के गोल फ़ाइनल स्कोर में गिने जाते हैं।',
      'એક્સ્ટ્રા ટાઇમ પછી પણ બરાબરી હોય તો મેચ પેનલ્ટી શૂટ-આઉટમાં જાય છે. એક્સ્ટ્રા ટાઇમના ગોલ ફાઇનલ સ્કોરમાં ગણાય છે.',
    ],
    ['stoppage-time', 'penalty'],
  ),
];
