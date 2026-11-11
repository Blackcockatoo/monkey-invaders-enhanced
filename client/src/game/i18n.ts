/**
 * Cabinet menu translations (English, Japanese, Hindi).
 *
 * Covers the DOM cabinet controls and the canvas menu screens (title, pause,
 * game over, info close hint). Game names, pilot names (BOLT, NOVA, REX,
 * GLITCH), boss names, review quips, achievement toasts and in-wave call-outs
 * stay English.
 */
export type Lang = "en" | "ja" | "hi";
export const LANGS: readonly Lang[] = ["en", "ja", "hi"];
export const LANG_LABEL: Record<Lang, string> = { en: "EN", ja: "日本語", hi: "हिन्दी" };
export const LANG_STORAGE_KEY = "monkey-invaders-lang";

export type ModeId = "classic" | "endless" | "bossRush" | "daily";

export type CabinetCopy = {
  modes: Record<ModeId, string>;
  colors: Record<"bolt" | "nova" | "rex" | "glitch", string>;
  arcade: string;
  pilotSignal: string;
  missionMode: string;
  waveLives: string;
  scoreCredits: string;
  start: string;
  pilot: string;
  mode: string;
  archive: string;
  pause: string;
  soundOn: string;
  soundOff: string;
  fire: string;
  blast: string;
  moveLeft: string;
  moveRight: string;
  throwBanana: string;
  bananaBlast: string;
  cabinetLabel: string;
  gameLabel: string;
  pilotChoice: string;
  pilotNote: string;
  online: string;
  warming: string;
  wave: string;
  hi: string;
  desktopHint: string;
  mobileHint: string;
  turnTitle: string;
  turnBody: string;
  language: string;
  // Canvas menu screens
  pressStart: string;
  titleHint: string;
  hallOfFame: string;
  credits: string;
  modePrefix: string;
  today: string;
  pressIClose: string;
  paused: string;
  pausedHint: string;
  signalLost: string;
  score: string;
  high: string;
  redeploy: string;
  infoHint: string;
  channel: string;
};

export const CABINET_COPY: Record<Lang, CabinetCopy> = {
  en: {
    modes: { classic: "CLASSIC", endless: "ENDLESS", bossRush: "BOSS RUSH", daily: "DAILY CHALLENGE" },
    colors: { bolt: "BLUE", nova: "PINK", rex: "AMBER", glitch: "GREEN" },
    arcade: "BLUE $NAKE ARCADE",
    pilotSignal: "PILOT SIGNAL",
    missionMode: "MISSION MODE",
    waveLives: "WAVE / LIVES",
    scoreCredits: "SCORE / CREDITS",
    start: "START",
    pilot: "PILOT",
    mode: "MODE",
    archive: "ARCHIVE",
    pause: "PAUSE",
    soundOn: "SOUND ON",
    soundOff: "SOUND OFF",
    fire: "FIRE",
    blast: "BLAST",
    moveLeft: "Move left",
    moveRight: "Move right",
    throwBanana: "Throw banana",
    bananaBlast: "Banana blast",
    cabinetLabel: "Monkey Invaders arcade cabinet",
    gameLabel: "Playable Monkey Invaders game",
    pilotChoice: "Pilot channel selection",
    pilotNote: "Two core signals. More pilots unlock inside the cabinet.",
    online: "CABINET ONLINE",
    warming: "WARMING TUBES",
    wave: "WAVE",
    hi: "HI",
    desktopHint: "MOVE A/D OR ←/→ · FIRE SPACE/X/Z · BLAST C/W/↑ · ENTER START · P PAUSE · Q PILOT · M MODE · I INFO",
    mobileHint: "MULTI-TOUCH READY · TURN LANDSCAPE FOR THE FULL CABINET",
    turnTitle: "TURN THE CABINET",
    turnBody: "Monkey Invaders is made for comfortable landscape play.",
    language: "Language",
    pressStart: "PRESS START",
    titleHint: "MOVE A/D OR ←/→ · FIRE X/Z/SPACE · BLAST C/W/↑ · Q PILOT · M MODE · I INFO",
    hallOfFame: "HALL OF FAME",
    credits: "CREDITS",
    modePrefix: "MODE:",
    today: "TODAY:",
    pressIClose: "PRESS I TO CLOSE",
    paused: "ARCHIVE PAUSED",
    pausedHint: "PRESS P OR PAUSE TO RETURN TO THE SIGNAL",
    signalLost: "SIGNAL LOST",
    score: "SCORE",
    high: "HIGH",
    redeploy: "PRESS START TO REDEPLOY",
    infoHint: "PRESS I FOR CABINET INFO",
    channel: "CHANNEL",
  },
  ja: {
    modes: { classic: "クラシック", endless: "エンドレス", bossRush: "ボスラッシュ", daily: "デイリーチャレンジ" },
    colors: { bolt: "ブルー", nova: "ピンク", rex: "アンバー", glitch: "グリーン" },
    arcade: "BLUE $NAKE アーケード",
    pilotSignal: "パイロット",
    missionMode: "モード",
    waveLives: "ウェーブ / 残機",
    scoreCredits: "スコア / クレジット",
    start: "スタート",
    pilot: "パイロット",
    mode: "モード",
    archive: "一時",
    pause: "停止",
    soundOn: "サウンド ON",
    soundOff: "サウンド OFF",
    fire: "発射",
    blast: "ブラスト",
    moveLeft: "左へ移動",
    moveRight: "右へ移動",
    throwBanana: "バナナを投げる",
    bananaBlast: "バナナ・ブラスト",
    cabinetLabel: "Monkey Invaders アーケード筐体",
    gameLabel: "プレイできる Monkey Invaders",
    pilotChoice: "パイロットの選択",
    pilotNote: "基本のパイロットは2人。ほかのパイロットはプレイ中に解放されます。",
    online: "筐体オンライン",
    warming: "起動中",
    wave: "ウェーブ",
    hi: "ハイスコア",
    desktopHint: "移動 A/D か ←/→ · 発射 SPACE/X/Z · ブラスト C/W/↑ · ENTER スタート · P 一時停止 · Q パイロット · M モード · I 情報",
    mobileHint: "マルチタッチ対応 · 横向きにすると筐体全体が見られます",
    turnTitle: "画面を横にしてね",
    turnBody: "Monkey Invaders は横向きで遊ぶように作られています。",
    language: "言語",
    pressStart: "スタートを押してね",
    titleHint: "移動 A/D か ←/→ · 発射 X/Z/SPACE · ブラスト C/W/↑ · Q パイロット · M モード · I 情報",
    hallOfFame: "殿堂入り",
    credits: "クレジット",
    modePrefix: "モード:",
    today: "今日:",
    pressIClose: "I で閉じる",
    paused: "一時停止中",
    pausedHint: "P か「一時停止」でゲームに戻る",
    signalLost: "シグナル消失",
    score: "スコア",
    high: "ハイ",
    redeploy: "スタートで再出撃",
    infoHint: "I で筐体の情報",
    channel: "チャンネル",
  },
  hi: {
    modes: { classic: "क्लासिक", endless: "एंडलेस", bossRush: "बॉस रश", daily: "आज का चैलेंज" },
    colors: { bolt: "नीला", nova: "गुलाबी", rex: "एम्बर", glitch: "हरा" },
    arcade: "BLUE $NAKE आर्केड",
    pilotSignal: "पायलट",
    missionMode: "मोड",
    waveLives: "वेव / जानें",
    scoreCredits: "स्कोर / क्रेडिट",
    start: "शुरू",
    pilot: "पायलट",
    mode: "मोड",
    archive: "थोड़ा",
    pause: "रुकें",
    soundOn: "साउंड ऑन",
    soundOff: "साउंड ऑफ़",
    fire: "फ़ायर",
    blast: "ब्लास्ट",
    moveLeft: "बाएँ चलें",
    moveRight: "दाएँ चलें",
    throwBanana: "केला फेंकें",
    bananaBlast: "केला ब्लास्ट",
    cabinetLabel: "Monkey Invaders आर्केड कैबिनेट",
    gameLabel: "खेलने लायक Monkey Invaders",
    pilotChoice: "पायलट चुनें",
    pilotNote: "दो मुख्य पायलट। बाकी पायलट खेलते-खेलते खुलते हैं।",
    online: "कैबिनेट ऑनलाइन",
    warming: "चालू हो रहा है",
    wave: "वेव",
    hi: "हाई",
    desktopHint: "चलें A/D या ←/→ · फ़ायर SPACE/X/Z · ब्लास्ट C/W/↑ · ENTER शुरू · P रुकें · Q पायलट · M मोड · I जानकारी",
    mobileHint: "मल्टी-टच तैयार · पूरा कैबिनेट देखने के लिए फ़ोन आड़ा करें",
    turnTitle: "फ़ोन आड़ा करें",
    turnBody: "Monkey Invaders आड़े (लैंडस्केप) मोड में आराम से खेलने के लिए बना है।",
    language: "भाषा",
    pressStart: "START दबाएँ",
    titleHint: "चलें A/D या ←/→ · फ़ायर X/Z/SPACE · ब्लास्ट C/W/↑ · Q पायलट · M मोड · I जानकारी",
    hallOfFame: "हॉल ऑफ़ फ़ेम",
    credits: "क्रेडिट",
    modePrefix: "मोड:",
    today: "आज:",
    pressIClose: "बंद करने के लिए I दबाएँ",
    paused: "खेल रुका है",
    pausedHint: "वापस आने के लिए P या रुकें दबाएँ",
    signalLost: "सिग्नल खो गया",
    score: "स्कोर",
    high: "हाई",
    redeploy: "फिर से उतरने के लिए START दबाएँ",
    infoHint: "कैबिनेट जानकारी के लिए I दबाएँ",
    channel: "चैनल",
  },
};

function isLang(value: string | null | undefined): value is Lang {
  return value === "en" || value === "ja" || value === "hi";
}

/** ?lang= wins, then the saved choice, then the browser language, then English. */
export function detectLang(
  search = typeof location === "undefined" ? "" : location.search,
  stored: string | null = safeGet(),
  browser: readonly string[] = typeof navigator === "undefined" ? [] : navigator.languages ?? [navigator.language],
): Lang {
  const fromQuery = new URLSearchParams(search).get("lang");
  if (isLang(fromQuery)) return fromQuery;
  if (isLang(stored)) return stored;
  for (const tag of browser) {
    const base = tag?.toLowerCase().split("-")[0];
    if (isLang(base)) return base;
  }
  return "en";
}

function safeGet(): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(LANG_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Private mode: the choice lasts for this visit only.
  }
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}
