/**
 * Fafaj felismerési minták beszédfelismeréshez
 * Magyar nevek és szinonimák
 */

export const speciesSpeechPatterns: Record<string, string[]> = {
  // Lomblevelűek
  beech: ['bükk', 'bük', 'bükkfa'],
  blackLocust: ['akác', 'akátz', 'fehér akác', 'akácfa'],
  turkeyOak: ['cser', 'cserfa', 'csertölgy'],
  hornbeam: ['gyertyán', 'gyertyánfa'],
  maple: ['juhar', 'juharfa', 'jávor', 'jávorfa'],
  pedunculateOak: ['kocsányos tölgy', 'kocsányos', 'magyar tölgy', 'kocsányostölgy'],
  sessileOak: ['kocsánytalan tölgy', 'kocsánytalan', 'kocsánytalantölgy'],
  ash: ['kőris', 'kőrisfa', 'magas kőris'],
  redOak: ['vörös tölgy', 'vöröstölgy'],
  blackWalnut: ['fekete dió', 'feketedió', 'diófa'],
  alder: ['éger', 'égerfa', 'mézgás éger'],
  linden: ['hárs', 'hársfa', 'hársak'],
  silverBirch: ['nyír', 'nyírfa', 'közönséges nyír'],

  // Nyárak
  whitePoplar: ['fehér nyár', 'fehérnyár'],
  blackPoplar: ['fekete nyár', 'feketenyár'],
  aspen: ['rezgő nyár', 'rezgőnyár', 'rezgő'],
  agathePoplar: ['agathe nyár', 'agathenyár', 'agathe'],
  i214Poplar: ['i-214 nyár', 'i214 nyár', 'olasz nyár', 'i214'],
  latePoplar: ['kései nyár', 'késeinyár'],
  earlyPoplar: ['korai nyár', 'korainyár'],
  giantPoplar: ['óriás nyár', 'óriásnyár'],

  // Fűz
  whiteWillow: ['fehér fűz', 'fehérfűz', 'fűz', 'fűzfa'],

  // Fenyők
  scotsPine: ['erdei fenyő', 'erdeifenyő', 'erdei'],
  austrianPine: ['fekete fenyő', 'feketefenyő'],
  spruce: ['lucfenyő', 'luc', 'közönséges lucfenyő'],
  silverFir: ['jegenyefenyő', 'jegenye', 'jegenyefa'],
  douglasFir: ['duglászfenyő', 'duglász', 'duglas'],
  larch: ['vörös fenyő', 'vörösfenyő'],
};

/**
 * Fafaj kulcs keresése beszéd szövegből
 * @param text A beszédfelismerő által visszaadott szöveg
 * @returns A fafaj kulcsa vagy null ha nem található
 */
export function detectSpeciesFromSpeech(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Először a hosszabb mintákat keressük (pl. "kocsányos tölgy" előbb mint "tölgy")
  const sortedEntries = Object.entries(speciesSpeechPatterns).sort((a, b) => {
    const maxLenA = Math.max(...a[1].map(p => p.length));
    const maxLenB = Math.max(...b[1].map(p => p.length));
    return maxLenB - maxLenA;
  });

  for (const [key, patterns] of sortedEntries) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return key;
      }
    }
  }

  return null;
}

/**
 * Fafaj magyar neve a kulcs alapján
 */
export const speciesNames: Record<string, string> = {
  beech: 'Bükk',
  blackLocust: 'Akác',
  turkeyOak: 'Cser',
  hornbeam: 'Gyertyán',
  maple: 'Juharok',
  pedunculateOak: 'Kocsányos tölgy',
  sessileOak: 'Kocsánytalan tölgy',
  ash: 'Kőris',
  redOak: 'Vörös tölgy',
  blackWalnut: 'Fekete dió',
  alder: 'Éger',
  linden: 'Hársak',
  silverBirch: 'Közönséges nyír',
  whitePoplar: 'Fehér nyár',
  blackPoplar: 'Fekete nyár',
  aspen: 'Rezgő nyár',
  agathePoplar: 'Agathe-F nyár',
  i214Poplar: 'I-214 nyár',
  latePoplar: 'Kései nyár',
  earlyPoplar: 'Korai nyár',
  giantPoplar: 'Óriás nyár',
  whiteWillow: 'Fehér fűz',
  scotsPine: 'Erdeifenyő',
  austrianPine: 'Feketefenyő',
  spruce: 'Lucfenyő',
  silverFir: 'Jegenyefenyő',
  douglasFir: 'Duglászfenyő',
  larch: 'Vörösfenyő',
};

/**
 * Kontrol parancsok beszédfelismeréshez
 */
export const controlCommands = {
  pause: ['szünet', 'szünetet', 'állj', 'megállás', 'pause', 'szünetet kérek'],
  cancel: ['mégsem', 'újra', 'nem jó', 'töröld', 'vissza'],
  confirm: ['igen', 'jó', 'ok', 'oké', 'rendben', 'helyes'],
};

/**
 * Kontrol parancs felismerése beszéd szövegből
 * @param text A beszédfelismerő által visszaadott szöveg
 * @returns A parancs típusa vagy null ha nem található
 */
export function detectControlCommand(text: string): 'pause' | 'cancel' | 'confirm' | null {
  const lowerText = text.toLowerCase();

  for (const [command, patterns] of Object.entries(controlCommands)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return command as 'pause' | 'cancel' | 'confirm';
      }
    }
  }

  return null;
}
