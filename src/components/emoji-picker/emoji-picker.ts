import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/** [glyph, name, keywords]. Names are CLDR short names; keywords are extra search terms. */
type Entry = readonly [emoji: string, name: string, keywords?: string];
type Cell = { emoji: string; name: string };
type Section = { id: string; label: string; cells: Cell[] };

const CATEGORIES: readonly { id: string; label: string; icon: string; items: readonly Entry[] }[] = [
  {
    id: 'faces',
    label: 'Faces',
    icon: '😀',
    items: [
      ['😀', 'grinning face', 'happy smile'],
      ['😃', 'grinning face with big eyes', 'happy smile'],
      ['😄', 'grinning face with smiling eyes', 'happy smile'],
      ['😁', 'beaming face with smiling eyes', 'grin'],
      ['😆', 'grinning squinting face', 'laugh'],
      ['😅', 'grinning face with sweat', 'phew'],
      ['😂', 'face with tears of joy', 'lol laugh'],
      ['🤣', 'rolling on the floor laughing', 'rofl lol'],
      ['🙂', 'slightly smiling face', 'smile'],
      ['🙃', 'upside-down face', 'silly'],
      ['😉', 'winking face', 'wink'],
      ['😊', 'smiling face with smiling eyes', 'blush happy'],
      ['😇', 'smiling face with halo', 'angel innocent'],
      ['😍', 'smiling face with heart-eyes', 'love crush'],
      ['🤩', 'star-struck', 'wow amazed'],
      ['😘', 'face blowing a kiss', 'kiss love'],
      ['😋', 'face savoring food', 'yum delicious'],
      ['😛', 'face with tongue', 'playful'],
      ['😜', 'winking face with tongue', 'silly joke'],
      ['🤪', 'zany face', 'crazy wild'],
      ['🤔', 'thinking face', 'hmm consider'],
      ['🤐', 'zipper-mouth face', 'secret quiet'],
      ['😐', 'neutral face', 'meh'],
      ['😑', 'expressionless face', 'blank'],
      ['😶', 'face without mouth', 'silent speechless'],
      ['😏', 'smirking face', 'smug'],
      ['😒', 'unamused face', 'bored annoyed'],
      ['🙄', 'face with rolling eyes', 'eyeroll whatever'],
      ['😬', 'grimacing face', 'awkward yikes'],
      ['😌', 'relieved face', 'calm'],
      ['😔', 'pensive face', 'sad thoughtful'],
      ['😴', 'sleeping face', 'zzz tired'],
      ['😷', 'face with medical mask', 'sick covid'],
      ['🤒', 'face with thermometer', 'ill fever'],
      ['🤢', 'nauseated face', 'sick gross'],
      ['🥵', 'hot face', 'heat sweating'],
      ['🥶', 'cold face', 'freezing'],
      ['😵', 'face with crossed-out eyes', 'dizzy knocked out'],
      ['🤯', 'exploding head', 'mind blown'],
      ['🤠', 'cowboy hat face', 'yeehaw'],
      ['😎', 'smiling face with sunglasses', 'cool'],
      ['🤓', 'nerd face', 'geek'],
      ['😕', 'confused face', 'puzzled'],
      ['😟', 'worried face', 'anxious'],
      ['😮', 'face with open mouth', 'surprised'],
      ['😲', 'astonished face', 'shocked'],
      ['😳', 'flushed face', 'embarrassed'],
      ['🥺', 'pleading face', 'puppy eyes please'],
      ['😢', 'crying face', 'sad tear'],
      ['😭', 'loudly crying face', 'sob'],
      ['😱', 'face screaming in fear', 'shock scared'],
      ['😖', 'confounded face', 'frustrated'],
      ['😞', 'disappointed face', 'sad'],
      ['😤', 'face with steam from nose', 'frustrated triumph'],
      ['😡', 'pouting face', 'angry mad'],
      ['🤬', 'face with symbols on mouth', 'swearing cursing'],
      ['😈', 'smiling face with horns', 'devil'],
      ['💀', 'skull', 'dead'],
      ['💩', 'pile of poo', 'poop'],
      ['🤡', 'clown face', 'joker'],
      ['👻', 'ghost', 'halloween boo'],
      ['👽', 'alien', 'ufo'],
      ['🤖', 'robot', 'bot machine'],
    ],
  },
  {
    id: 'people',
    label: 'People',
    icon: '👋',
    items: [
      ['👋', 'waving hand', 'hello goodbye hi'],
      ['🤚', 'raised back of hand', 'stop'],
      ['✋', 'raised hand', 'stop high five'],
      ['🖖', 'vulcan salute', 'spock'],
      ['👌', 'OK hand', 'perfect'],
      ['✌️', 'victory hand', 'peace'],
      ['🤞', 'crossed fingers', 'luck hope'],
      ['🤟', 'love-you gesture', 'rock'],
      ['🤘', 'sign of the horns', 'rock metal'],
      ['🤙', 'call me hand', 'shaka'],
      ['👈', 'backhand index pointing left', 'point'],
      ['👉', 'backhand index pointing right', 'point'],
      ['👆', 'backhand index pointing up', 'point'],
      ['👇', 'backhand index pointing down', 'point'],
      ['☝️', 'index pointing up', 'point'],
      ['👍', 'thumbs up', 'like approve yes plus one'],
      ['👎', 'thumbs down', 'dislike no'],
      ['✊', 'raised fist', 'power'],
      ['👊', 'oncoming fist', 'punch bump'],
      ['👏', 'clapping hands', 'applause bravo'],
      ['🙌', 'raising hands', 'celebrate hooray'],
      ['👐', 'open hands', 'hug'],
      ['🤝', 'handshake', 'deal agreement'],
      ['🙏', 'folded hands', 'please thanks pray'],
      ['💪', 'flexed biceps', 'strong muscle'],
      ['👀', 'eyes', 'look watching'],
      ['🧠', 'brain', 'smart think'],
      ['👶', 'baby', 'child'],
      ['🧑', 'person', 'adult'],
      ['👩', 'woman', 'person'],
      ['👨', 'man', 'person'],
      ['🧑‍💻', 'technologist', 'developer coder programmer'],
      ['🦸', 'superhero', 'hero'],
      ['🤷', 'person shrugging', 'dunno idk'],
      ['🤦', 'person facepalming', 'facepalm'],
      ['🙋', 'person raising hand', 'question volunteer'],
      ['🙇', 'person bowing', 'sorry respect'],
    ],
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌳',
    items: [
      ['🐶', 'dog face', 'puppy pet'],
      ['🐱', 'cat face', 'kitten pet'],
      ['🐭', 'mouse face', 'rodent'],
      ['🐹', 'hamster', 'pet'],
      ['🐰', 'rabbit face', 'bunny'],
      ['🦊', 'fox', 'animal'],
      ['🐻', 'bear', 'animal'],
      ['🐼', 'panda', 'animal'],
      ['🐨', 'koala', 'animal'],
      ['🐯', 'tiger face', 'animal'],
      ['🦁', 'lion', 'animal'],
      ['🐮', 'cow face', 'animal'],
      ['🐷', 'pig face', 'animal'],
      ['🐸', 'frog', 'animal'],
      ['🐵', 'monkey face', 'animal'],
      ['🐔', 'chicken', 'bird'],
      ['🐧', 'penguin', 'bird'],
      ['🐦', 'bird', 'tweet'],
      ['🦆', 'duck', 'bird'],
      ['🦉', 'owl', 'bird wise'],
      ['🦄', 'unicorn', 'magic'],
      ['🐝', 'honeybee', 'bee insect'],
      ['🦋', 'butterfly', 'insect'],
      ['🐛', 'bug', 'insect caterpillar'],
      ['🐌', 'snail', 'slow'],
      ['🐢', 'turtle', 'slow'],
      ['🐍', 'snake', 'python'],
      ['🐙', 'octopus', 'sea'],
      ['🐬', 'dolphin', 'sea'],
      ['🐳', 'spouting whale', 'whale sea'],
      ['🦈', 'shark', 'sea'],
      ['🌵', 'cactus', 'desert plant'],
      ['🌲', 'evergreen tree', 'pine forest'],
      ['🌳', 'deciduous tree', 'forest'],
      ['🌴', 'palm tree', 'tropical'],
      ['🌱', 'seedling', 'sprout plant grow'],
      ['🍀', 'four leaf clover', 'luck'],
      ['🍁', 'maple leaf', 'autumn fall'],
      ['🌸', 'cherry blossom', 'flower spring'],
      ['🌹', 'rose', 'flower'],
      ['🌻', 'sunflower', 'flower'],
      ['🌈', 'rainbow', 'pride weather'],
      ['☀️', 'sun', 'sunny weather'],
      ['🌙', 'crescent moon', 'night'],
      ['⭐', 'star', 'favorite'],
      ['🔥', 'fire', 'flame hot lit'],
      ['⚡', 'high voltage', 'lightning zap'],
      ['❄️', 'snowflake', 'cold winter'],
      ['💧', 'droplet', 'water drop'],
      ['🌊', 'water wave', 'ocean sea'],
    ],
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍕',
    items: [
      ['🍎', 'red apple', 'fruit'],
      ['🍊', 'tangerine', 'orange fruit'],
      ['🍋', 'lemon', 'fruit'],
      ['🍌', 'banana', 'fruit'],
      ['🍉', 'watermelon', 'fruit'],
      ['🍇', 'grapes', 'fruit'],
      ['🍓', 'strawberry', 'fruit'],
      ['🍒', 'cherries', 'fruit'],
      ['🍑', 'peach', 'fruit'],
      ['🍍', 'pineapple', 'fruit'],
      ['🥑', 'avocado', 'fruit'],
      ['🍅', 'tomato', 'vegetable'],
      ['🥕', 'carrot', 'vegetable'],
      ['🌽', 'ear of corn', 'maize'],
      ['🥔', 'potato', 'vegetable'],
      ['🍞', 'bread', 'loaf toast'],
      ['🥐', 'croissant', 'pastry'],
      ['🧀', 'cheese wedge', 'dairy'],
      ['🍳', 'cooking', 'fried egg breakfast'],
      ['🥓', 'bacon', 'breakfast'],
      ['🍔', 'hamburger', 'burger'],
      ['🍟', 'french fries', 'chips'],
      ['🍕', 'pizza', 'slice'],
      ['🌭', 'hot dog', 'sausage'],
      ['🌮', 'taco', 'mexican'],
      ['🌯', 'burrito', 'wrap'],
      ['🍣', 'sushi', 'japanese'],
      ['🍜', 'steaming bowl', 'ramen noodles'],
      ['🍝', 'spaghetti', 'pasta'],
      ['🍩', 'doughnut', 'donut sweet'],
      ['🍪', 'cookie', 'biscuit sweet'],
      ['🎂', 'birthday cake', 'party'],
      ['🍰', 'shortcake', 'cake dessert'],
      ['🍫', 'chocolate bar', 'sweet'],
      ['🍿', 'popcorn', 'movie snack'],
      ['☕', 'hot beverage', 'coffee tea'],
      ['🍵', 'teacup without handle', 'tea matcha'],
      ['🍺', 'beer mug', 'drink pub'],
      ['🍷', 'wine glass', 'drink'],
      ['🥂', 'clinking glasses', 'cheers toast'],
      ['🍾', 'bottle with popping cork', 'champagne celebrate'],
    ],
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: '🎮',
    items: [
      ['⚽', 'soccer ball', 'football sport'],
      ['🏀', 'basketball', 'sport'],
      ['🏈', 'american football', 'sport'],
      ['⚾', 'baseball', 'sport'],
      ['🎾', 'tennis', 'sport'],
      ['🏐', 'volleyball', 'sport'],
      ['🏓', 'ping pong', 'table tennis sport'],
      ['🥊', 'boxing glove', 'sport'],
      ['🎯', 'bullseye', 'direct hit target goal'],
      ['🎳', 'bowling', 'sport'],
      ['🎮', 'video game', 'controller play'],
      ['🕹️', 'joystick', 'game arcade'],
      ['🎲', 'game die', 'dice random'],
      ['🧩', 'puzzle piece', 'jigsaw'],
      ['🎨', 'artist palette', 'paint art design'],
      ['🎭', 'performing arts', 'theatre drama'],
      ['🎬', 'clapper board', 'movie film'],
      ['🎤', 'microphone', 'karaoke sing'],
      ['🎧', 'headphone', 'music'],
      ['🎸', 'guitar', 'music'],
      ['🎹', 'musical keyboard', 'piano music'],
      ['🥁', 'drum', 'music'],
      ['🏆', 'trophy', 'win prize'],
      ['🥇', '1st place medal', 'gold first win'],
      ['🎉', 'party popper', 'celebrate tada congrats'],
      ['🎊', 'confetti ball', 'celebrate'],
      ['🎈', 'balloon', 'party'],
      ['🎁', 'wrapped gift', 'present'],
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: '🚀',
    items: [
      ['🚗', 'automobile', 'car drive'],
      ['🚕', 'taxi', 'cab'],
      ['🚌', 'bus', 'transit'],
      ['🚓', 'police car', 'cop'],
      ['🚑', 'ambulance', 'emergency'],
      ['🚒', 'fire engine', 'truck emergency'],
      ['🚚', 'delivery truck', 'shipping'],
      ['🚲', 'bicycle', 'bike cycle'],
      ['🛴', 'kick scooter', 'ride'],
      ['🚂', 'locomotive', 'train'],
      ['🚀', 'rocket', 'launch ship space'],
      ['✈️', 'airplane', 'flight plane'],
      ['🚁', 'helicopter', 'flight'],
      ['⛵', 'sailboat', 'boat'],
      ['🚢', 'ship', 'boat cruise'],
      ['⚓', 'anchor', 'boat'],
      ['🏠', 'house', 'home'],
      ['🏢', 'office building', 'work'],
      ['🏥', 'hospital', 'health'],
      ['🏫', 'school', 'education'],
      ['🏰', 'castle', 'fortress'],
      ['🗼', 'Tokyo tower', 'japan'],
      ['🗽', 'Statue of Liberty', 'new york'],
      ['⛰️', 'mountain', 'hike'],
      ['🌋', 'volcano', 'eruption'],
      ['🏖️', 'beach with umbrella', 'holiday vacation'],
      ['🏝️', 'desert island', 'vacation'],
      ['🌍', 'globe showing Europe-Africa', 'earth world'],
      ['🌎', 'globe showing Americas', 'earth world'],
      ['🌐', 'globe with meridians', 'internet web world'],
      ['🗺️', 'world map', 'travel'],
      ['🧭', 'compass', 'navigate direction'],
      ['⏰', 'alarm clock', 'time wake'],
      ['⌛', 'hourglass done', 'time wait'],
      ['🌅', 'sunrise', 'morning'],
      ['🌃', 'night with stars', 'city evening'],
    ],
  },
  {
    id: 'objects',
    label: 'Objects',
    icon: '💡',
    items: [
      ['💻', 'laptop', 'computer'],
      ['🖥️', 'desktop computer', 'monitor'],
      ['⌨️', 'keyboard', 'type'],
      ['🖱️', 'computer mouse', 'click'],
      ['📱', 'mobile phone', 'cell smartphone'],
      ['☎️', 'telephone', 'call'],
      ['📷', 'camera', 'photo'],
      ['📹', 'video camera', 'record'],
      ['📺', 'television', 'tv'],
      ['🔋', 'battery', 'power'],
      ['🔌', 'electric plug', 'power'],
      ['💡', 'light bulb', 'idea'],
      ['🔦', 'flashlight', 'torch'],
      ['💰', 'money bag', 'cash rich'],
      ['💵', 'dollar banknote', 'money cash'],
      ['💳', 'credit card', 'payment'],
      ['💎', 'gem stone', 'diamond jewel'],
      ['🔧', 'wrench', 'tool fix'],
      ['🔨', 'hammer', 'tool build'],
      ['🛠️', 'hammer and wrench', 'tools build'],
      ['⚙️', 'gear', 'settings cog'],
      ['🔩', 'nut and bolt', 'hardware'],
      ['🧰', 'toolbox', 'tools'],
      ['🔒', 'locked', 'security private'],
      ['🔓', 'unlocked', 'open'],
      ['🔑', 'key', 'password access'],
      ['🛡️', 'shield', 'security protect'],
      ['📦', 'package', 'box parcel'],
      ['✉️', 'envelope', 'email mail letter'],
      ['📝', 'memo', 'note write pencil'],
      ['📄', 'page facing up', 'document file'],
      ['📁', 'file folder', 'directory'],
      ['📅', 'calendar', 'date schedule'],
      ['📌', 'pushpin', 'pin'],
      ['📎', 'paperclip', 'attachment'],
      ['✂️', 'scissors', 'cut'],
      ['🗑️', 'wastebasket', 'trash delete bin'],
      ['📊', 'bar chart', 'graph stats'],
      ['📈', 'chart increasing', 'growth up trend'],
      ['📉', 'chart decreasing', 'decline down trend'],
      ['🔍', 'magnifying glass tilted left', 'search find zoom'],
      ['🔔', 'bell', 'notification alert'],
      ['🔕', 'bell with slash', 'mute silent'],
      ['📢', 'loudspeaker', 'announce'],
      ['💬', 'speech balloon', 'chat comment message'],
      ['💭', 'thought balloon', 'think'],
      ['🏷️', 'label', 'tag price'],
      ['🔖', 'bookmark', 'save'],
      ['📚', 'books', 'library read'],
      ['📖', 'open book', 'read docs'],
      ['🧪', 'test tube', 'experiment lab'],
      ['🔬', 'microscope', 'science'],
      ['💊', 'pill', 'medicine'],
      ['🧲', 'magnet', 'attract'],
      ['🧹', 'broom', 'clean sweep'],
      ['🛒', 'shopping cart', 'buy store'],
    ],
  },
  {
    id: 'symbols',
    label: 'Symbols',
    icon: '❤️',
    items: [
      ['❤️', 'red heart', 'love like'],
      ['🧡', 'orange heart', 'love'],
      ['💛', 'yellow heart', 'love'],
      ['💚', 'green heart', 'love'],
      ['💙', 'blue heart', 'love'],
      ['💜', 'purple heart', 'love'],
      ['🖤', 'black heart', 'love'],
      ['🤍', 'white heart', 'love'],
      ['💔', 'broken heart', 'sad heartbreak'],
      ['💖', 'sparkling heart', 'love'],
      ['💯', 'hundred points', '100 perfect score'],
      ['✅', 'check mark button', 'done yes complete'],
      ['✔️', 'check mark', 'tick done'],
      ['❌', 'cross mark', 'no wrong delete'],
      ['➕', 'plus', 'add'],
      ['➖', 'minus', 'remove subtract'],
      ['❓', 'red question mark', 'help why'],
      ['❗', 'red exclamation mark', 'alert important'],
      ['⚠️', 'warning', 'caution alert'],
      ['🚫', 'prohibited', 'forbidden no'],
      ['⛔', 'no entry', 'stop'],
      ['🔴', 'red circle', 'dot'],
      ['🟠', 'orange circle', 'dot'],
      ['🟡', 'yellow circle', 'dot'],
      ['🟢', 'green circle', 'dot'],
      ['🔵', 'blue circle', 'dot'],
      ['🟣', 'purple circle', 'dot'],
      ['⚫', 'black circle', 'dot'],
      ['⚪', 'white circle', 'dot'],
      ['⬆️', 'up arrow', 'direction'],
      ['⬇️', 'down arrow', 'direction'],
      ['⬅️', 'left arrow', 'direction back'],
      ['➡️', 'right arrow', 'direction next'],
      ['🔄', 'counterclockwise arrows button', 'refresh sync reload'],
      ['🔁', 'repeat button', 'loop'],
      ['♻️', 'recycling symbol', 'recycle'],
      ['✨', 'sparkles', 'magic new shiny'],
      ['💫', 'dizzy', 'star'],
      ['💥', 'collision', 'boom crash'],
      ['💤', 'zzz', 'sleep'],
      ['🆗', 'OK button', 'okay'],
      ['🆕', 'NEW button', 'new'],
      ['🔗', 'link', 'chain url'],
      ['🏁', 'chequered flag', 'finish race'],
      ['🚩', 'triangular flag', 'red flag'],
      ['🏳️', 'white flag', 'surrender'],
    ],
  },
];

const BY_EMOJI = new Map<string, Cell>();
for (const c of CATEGORIES) for (const [emoji, name] of c.items) if (!BY_EMOJI.has(emoji)) BY_EMOJI.set(emoji, { emoji, name });

const HAYSTACK = new Map<string, string>();
for (const c of CATEGORIES) for (const [emoji, name, kw] of c.items) HAYSTACK.set(emoji, `${name} ${kw ?? ''}`.toLowerCase());

const RECENT_ICON = '🕒';

/**
 * Emoji picker: search box, category buttons and a scrolling grid of about 330 common emoji, built in so there is
 * nothing to fetch. It is a panel, not a popup: put it inside `ht-popover` (or any container) to float it.
 *
 * The grid follows the WAI-ARIA grid pattern with one tab stop: arrows move by cell and row, Home and End go to the
 * row ends, Ctrl+Home and Ctrl+End to the first and last emoji, Page Up and Page Down to the previous and next
 * category. Arrow Down in the search box enters the grid, and Enter there picks the first match.
 * Skin tones are not supported.
 *
 * @tag ht-emoji-picker
 * @summary Searchable emoji grid.
 *
 * @slot empty - Shown instead of the grid when a search matches nothing.
 *
 * @csspart picker - The outer panel.
 * @csspart search - The search field.
 * @csspart categories - The category button row.
 * @csspart grid - The scrolling emoji grid.
 * @csspart emoji - One emoji button.
 * @csspart preview - The name strip under the grid.
 *
 * @cssprop [--ht-emoji-picker-width=19rem] - Picker width.
 * @cssprop [--ht-emoji-picker-height=22rem] - Picker height.
 *
 * @fires ht-select - An emoji was picked by click, Enter or Space. `detail` is `{ emoji, name }`.
 */
export class HtEmojiPicker extends LitElement {
  /** @internal */
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    /** Accessible name of the picker. */
    label: {},
    /** Placeholder, and accessible name, of the search box. */
    placeholder: {},
    /** Emoji to list first under "Recent", for example `['👍', '🎉']`. The picker does not store them: keep the list and update it on `ht-select`. Shows the first two rows. */
    recent: { attribute: false },
    /** Emoji per row. */
    columns: { type: Number, reflect: true },
    _query: { state: true },
    _active: { state: true },
    _category: { state: true },
    _catTab: { state: true },
    _preview: { state: true },
  };

  declare label: string;
  declare placeholder: string;
  declare recent: string[];
  declare columns: number;
  declare _query: string;
  declare _active: number;
  declare _category: string;
  declare _catTab: string;
  declare _preview: Cell | null;

  #raf = 0;

  constructor() {
    super();
    this.label = 'Emoji Picker';
    this.placeholder = 'Search Emoji';
    this.recent = [];
    this.columns = 8;
    this._query = '';
    this._active = 0;
    this._category = '';
    this._catTab = '';
    this._preview = null;
  }

  static styles = css`
    :host { display: block; width: var(--ht-emoji-picker-width, 19rem); }
    [hidden] { display: none !important; }
    .picker {
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      height: var(--ht-emoji-picker-height, 22rem);
      overflow: hidden;
      font: 400 0.875rem/1.5 var(--ht-font-ui);
      color: var(--ht-text);
      background: var(--ht-surface);
      border: 1px solid var(--ht-border);
      border-radius: var(--ht-radius-lg);
    }
    .search-wrap { flex: none; padding: 8px 8px 4px; }
    .search {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      height: 2rem;
      padding-inline: 10px;
      color: var(--ht-text-subtle);
      background: color-mix(in oklab, var(--ht-text) 3%, transparent);
      border: 1px solid var(--ht-border-input);
      border-radius: var(--ht-radius-md);
      box-shadow: inset 0 1px 0 0 var(--ht-border-input);
      transition: box-shadow var(--ht-duration) var(--ht-ease);
    }
    .search:focus-within { box-shadow: inset 0 1px 0 0 var(--ht-border-input), 0 0 0 2px var(--ht-focus); }
    .search svg { flex: none; }
    input {
      all: unset;
      flex: 1;
      min-width: 0;
      height: 100%;
      font: 400 0.875rem/1rem var(--ht-font-ui);
      color: var(--ht-text);
    }
    input::placeholder { color: var(--ht-text-subtle); }
    input::-webkit-search-cancel-button { appearance: none; }

    .cats {
      flex: none;
      display: flex;
      gap: 2px;
      padding: 4px 8px 8px;
      border-bottom: 1px solid var(--ht-border);
    }
    .cat {
      all: unset;
      box-sizing: border-box;
      flex: 1;
      display: grid;
      place-items: center;
      height: 28px;
      min-width: 0;
      font: 400 1rem/1 var(--ht-font-ui);
      cursor: pointer;
      border-radius: var(--ht-radius-md);
      transition: background-color var(--ht-duration) var(--ht-ease);
    }
    .cat:hover { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    .cat[aria-current='true'] { background: var(--ht-accent-soft); }
    .cat:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -1px; }
    .cat:disabled { cursor: not-allowed; opacity: 0.4; background: transparent; }

    .grid {
      position: relative;
      flex: 1;
      min-height: 0;
      padding: 0 8px 8px;
      overflow-x: hidden;
      overflow-y: auto;
      scrollbar-width: thin;
    }
    .row { display: grid; grid-template-columns: repeat(var(--_cols), minmax(0, 1fr)); }
    .head-row { position: sticky; top: 0; z-index: 1; background: var(--ht-surface); }
    .head {
      display: block;
      padding: 8px 2px 4px;
      font: 400 0.6875rem/1.2 var(--ht-font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ht-text-subtle);
    }
    .cell { display: block; }
    .emoji {
      all: unset;
      box-sizing: border-box;
      display: grid;
      place-items: center;
      width: 100%;
      height: 2rem;
      font: 400 1.25rem/1 var(--ht-font-ui);
      cursor: pointer;
      border-radius: var(--ht-radius-md);
      scroll-margin-top: 28px;
      transition: background-color var(--ht-duration) var(--ht-ease);
    }
    .emoji:hover { background: color-mix(in oklab, var(--ht-text) 7.5%, transparent); }
    .emoji:active { background: color-mix(in oklab, var(--ht-text) 5%, transparent); }
    .emoji:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: -2px; }

    .empty {
      flex: 1;
      display: grid;
      place-items: center;
      padding: 16px;
      text-align: center;
      color: var(--ht-text-muted);
    }
    .preview {
      flex: none;
      display: flex;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
      height: 2.25rem;
      padding: 0 12px;
      font: 400 0.75rem/1rem var(--ht-font-ui);
      color: var(--ht-text-muted);
      border-top: 1px solid var(--ht-border);
    }
    .preview .glyph { font-size: 1.25rem; line-height: 1; }
    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    @media (prefers-reduced-motion: reduce) {
      .search, .cat, .emoji { transition: none; }
    }
  `;

  /** The sections on screen: Recent plus the categories, or one "Results" section while searching. */
  #sections(): Section[] {
    const q = this._query.trim().toLowerCase();
    if (q) {
      const tokens = q.split(/\s+/);
      const hits: { cell: Cell; score: number }[] = [];
      for (const c of CATEGORIES) {
        for (const [emoji, name] of c.items) {
          if (emoji === q) {
            hits.push({ cell: { emoji, name }, score: 0 });
            continue;
          }
          const hay = HAYSTACK.get(emoji)!;
          if (!tokens.every((t) => hay.includes(t))) continue;
          hits.push({ cell: { emoji, name }, score: name.toLowerCase().startsWith(tokens[0]) ? 1 : name.toLowerCase().includes(tokens[0]) ? 2 : 3 });
        }
      }
      hits.sort((a, b) => a.score - b.score);
      return [{ id: 'results', label: 'Results', cells: hits.map((h) => h.cell) }];
    }
    const out: Section[] = [];
    const recent = (this.recent ?? []).slice(0, this.columns * 2).map((e) => BY_EMOJI.get(e) ?? { emoji: e, name: e });
    if (recent.length) out.push({ id: 'recent', label: 'Recent', cells: recent });
    for (const c of CATEGORIES) out.push({ id: c.id, label: c.label, cells: c.items.map(([emoji, name]) => ({ emoji, name })) });
    return out;
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('_query')) this._active = 0;
  }

  get #input() {
    return this.renderRoot.querySelector('input');
  }
  get #grid() {
    return this.renderRoot.querySelector<HTMLElement>('.grid');
  }
  #cell(i: number) {
    return this.renderRoot.querySelector<HTMLElement>(`[data-i="${i}"]`);
  }

  #select(cell: Cell) {
    this.dispatchEvent(new CustomEvent('ht-select', { bubbles: true, composed: true, detail: { emoji: cell.emoji, name: cell.name } }));
  }

  #onInput = (e: Event) => {
    this._query = (e.target as HTMLInputElement).value;
  };

  #onSearchKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.#cell(this._active)?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const first = this.#sections().flatMap((s) => s.cells)[0];
      if (first && this._query.trim()) this.#select(first);
    } else if (e.key === 'Escape' && this._query) {
      e.preventDefault();
      e.stopPropagation();
      this._query = '';
      (e.target as HTMLInputElement).value = '';
    }
  };

  #onGridKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (!btn) return;
    const sections = this.#sections();
    const rows: number[][] = [];
    const starts: number[] = [];
    let n = 0;
    for (const s of sections) {
      starts.push(n);
      for (let i = 0; i < s.cells.length; i += this.columns) {
        rows.push(Array.from({ length: Math.min(this.columns, s.cells.length - i) }, (_, k) => n + i + k));
      }
      n += s.cells.length;
    }
    const total = n;
    const cur = Number(btn.dataset.i);
    const r = rows.findIndex((row) => row.includes(cur));
    const col = rows[r].indexOf(cur);
    let next = cur;
    switch (e.key) {
      case 'ArrowRight': next = Math.min(cur + 1, total - 1); break;
      case 'ArrowLeft': next = Math.max(cur - 1, 0); break;
      case 'ArrowDown': if (r < rows.length - 1) next = rows[r + 1][Math.min(col, rows[r + 1].length - 1)]; break;
      case 'ArrowUp':
        if (r > 0) next = rows[r - 1][Math.min(col, rows[r - 1].length - 1)];
        else { e.preventDefault(); this.#input?.focus(); return; }
        break;
      case 'Home': next = e.ctrlKey ? 0 : rows[r][0]; break;
      case 'End': next = e.ctrlKey ? total - 1 : rows[r][rows[r].length - 1]; break;
      case 'PageDown': next = starts.find((s) => s > cur) ?? cur; break;
      case 'PageUp': {
        const here = [...starts].reverse().find((s) => s <= cur) ?? 0;
        next = here < cur ? here : ([...starts].reverse().find((s) => s < cur) ?? 0);
        break;
      }
      default: return;
    }
    e.preventDefault();
    this.#focusCell(next);
  };

  #focusCell(i: number) {
    this._active = i;
    this.#cell(i)?.focus();
  }

  #onGridPointer = (e: Event) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (!btn) return;
    this._preview = { emoji: btn.dataset.emoji!, name: btn.getAttribute('aria-label')! };
  };

  #goTo(id: string) {
    const target = this.renderRoot.querySelector<HTMLElement>(`[data-section="${id}"]`);
    const grid = this.#grid;
    if (!target || !grid) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    grid.scrollTo({ top: target.offsetTop, behavior: reduce ? 'auto' : 'smooth' });
    this._category = id;
  }

  #onScroll = () => {
    if (this.#raf) return;
    this.#raf = requestAnimationFrame(() => {
      this.#raf = 0;
      const grid = this.#grid;
      if (!grid || this._query) return;
      let current = '';
      for (const el of grid.querySelectorAll<HTMLElement>('[data-section]')) {
        if (el.offsetTop <= grid.scrollTop + 8) current = el.dataset.section!;
      }
      if (current && current !== this._category) this._category = current;
    });
  };

  #onCatKey = (e: KeyboardEvent) => {
    const btns = [...this.renderRoot.querySelectorAll<HTMLButtonElement>('.cat')].filter((b) => !b.disabled);
    const i = btns.indexOf(e.target as HTMLButtonElement);
    if (i < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % btns.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + btns.length) % btns.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = btns.length - 1;
    if (next < 0) return;
    e.preventDefault();
    btns[next].focus();
  };

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
  }

  render() {
    const sections = this.#sections();
    const searching = !!this._query.trim();
    const total = sections.reduce((n, s) => n + s.cells.length, 0);
    const active = Math.min(this._active, Math.max(total - 1, 0));
    const cats = [
      ...(sections[0]?.id === 'recent' ? [{ id: 'recent', label: 'Recent', icon: RECENT_ICON }] : []),
      ...CATEGORIES,
    ];
    const currentCat = this._category && cats.some((c) => c.id === this._category) ? this._category : cats[0].id;
    const tabCat = this._catTab && cats.some((c) => c.id === this._catTab) ? this._catTab : currentCat;

    let index = 0;
    const grid = total
      ? html`<div
          part="grid"
          class="grid"
          role="grid"
          aria-label="Emoji"
          style="--_cols:${this.columns}"
          @keydown=${this.#onGridKey}
          @scroll=${this.#onScroll}
          @pointerover=${this.#onGridPointer}
          @focusin=${(e: Event) => {
            this.#onGridPointer(e);
            const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
            if (btn) this._active = Number(btn.dataset.i);
          }}
        >
          ${sections.map((s) => {
            const rows: Cell[][] = [];
            for (let i = 0; i < s.cells.length; i += this.columns) rows.push(s.cells.slice(i, i + this.columns));
            return html`<div role="rowgroup" data-section=${s.id}>
              <div role="row" class="head-row"><div role="rowheader" class="head" aria-colspan=${this.columns}>${s.label}</div></div>
              ${rows.map(
                (row) => html`<div role="row" class="row">
                  ${row.map((c) => {
                    const i = index++;
                    return html`<div role="gridcell" class="cell">
                      <button
                        part="emoji"
                        class="emoji"
                        type="button"
                        tabindex=${i === active ? 0 : -1}
                        data-i=${i}
                        data-emoji=${c.emoji}
                        aria-label=${c.name}
                        @click=${() => this.#select(c)}
                      >${c.emoji}</button>
                    </div>`;
                  })}
                </div>`,
              )}
            </div>`;
          })}
        </div>`
      : html`<div class="empty"><slot name="empty">Nothing matches that.</slot></div>`;

    return html`
      <div part="picker" class="picker" role="group" aria-label=${ifDefined(this.label || undefined)}>
        <div class="search-wrap">
          <div part="search" class="search">
            <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/></svg>
            <input
              type="search"
              autocomplete="off"
              spellcheck="false"
              placeholder=${this.placeholder}
              aria-label=${ifDefined(this.placeholder || undefined)}
              .value=${this._query}
              @input=${this.#onInput}
              @keydown=${this.#onSearchKey}
            />
          </div>
        </div>
        <div part="categories" class="cats" role="toolbar" aria-label="Categories" @keydown=${this.#onCatKey}>
          ${cats.map(
            (c) => html`<button
              class="cat"
              type="button"
              title=${c.label}
              aria-label=${c.label}
              aria-current=${ifDefined(!searching && c.id === currentCat ? 'true' : undefined)}
              tabindex=${c.id === tabCat ? 0 : -1}
              ?disabled=${searching}
              @focus=${() => (this._catTab = c.id)}
              @click=${() => this.#goTo(c.id)}
            ><span aria-hidden="true">${c.icon}</span></button>`,
          )}
        </div>
        ${grid}
        <div part="preview" class="preview" aria-hidden="true">
          ${this._preview
            ? html`<span class="glyph">${this._preview.emoji}</span><span>${this._preview.name}</span>`
            : html`<span>Pick an emoji.</span>`}
        </div>
        <div class="sr" role="status">${searching ? (total ? `${total} ${total === 1 ? 'result' : 'results'}` : 'No results') : nothing}</div>
      </div>
    `;
  }
}

if (!customElements.get('ht-emoji-picker')) customElements.define('ht-emoji-picker', HtEmojiPicker);

declare global {
  interface HTMLElementTagNameMap {
    'ht-emoji-picker': HtEmojiPicker;
  }
}
