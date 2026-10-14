import type { Lang } from '../sports/types.js';

// Area strings. Add keys to `en`, then give EVERY key a value in hinglish, hi and gu.
// `satisfies` makes a missing translation a type error. Hinglish = Hindi in Latin script.
const en = {
  momentsTitle: 'Moments',
  momentsFilterLabel: 'Filter moments',
  momentsEmpty: 'Nothing yet — hit play.',
  momentsEmptyFiltered: 'Nothing here yet. Try another filter.',
  momentsRecapFrom: 'Recap from here',
  momentsRecapFromAria: 'Recap from {clock}',
  shortcutHint: 'Space play · C catch up · / ask · L language',
} as const;

type Keys = keyof typeof en;
export const momentsStrings = {
  en,
  hinglish: {
    momentsTitle: 'Moments',
    momentsFilterLabel: 'Moments filter karo',
    momentsEmpty: 'Abhi kuch nahi — play dabao.',
    momentsEmptyFiltered: 'Yahan abhi kuch nahi. Doosra filter try karo.',
    momentsRecapFrom: 'Yahan se recap',
    momentsRecapFromAria: '{clock} se recap',
    shortcutHint: 'Space play · C catch up · / poocho · L bhasha',
  },
  hi: {
    momentsTitle: 'अहम पल',
    momentsFilterLabel: 'पल फ़िल्टर करें',
    momentsEmpty: 'अभी कुछ नहीं — प्ले दबाइए।',
    momentsEmptyFiltered: 'यहाँ अभी कुछ नहीं। दूसरा फ़िल्टर आज़माइए।',
    momentsRecapFrom: 'यहाँ से रीकैप',
    momentsRecapFromAria: '{clock} से रीकैप',
    shortcutHint: 'Space प्ले · C कैच अप · / पूछें · L भाषा',
  },
  gu: {
    momentsTitle: 'મહત્વના પળો',
    momentsFilterLabel: 'પળો ફિલ્ટર કરો',
    momentsEmpty: 'હજી કંઈ નથી — પ્લે દબાવો.',
    momentsEmptyFiltered: 'અહીં હજી કંઈ નથી. બીજું ફિલ્ટર અજમાવો.',
    momentsRecapFrom: 'અહીંથી રીકેપ',
    momentsRecapFromAria: '{clock} થી રીકેપ',
    shortcutHint: 'Space પ્લે · C કેચ અપ · / પૂછો · L ભાષા',
  },
} satisfies Record<Lang, Record<Keys, string>>;
