export type AttributeId = 'VC' | 'VR' | 'DA' | 'NO' | 'UN' | 'FR';
export type ElementId = 'FIRE' | 'PLANT' | 'WATER' | 'WIND' | 'EARTH' | 'LIGHTNING' | 'LIGHT' | 'DARK' | 'NULL' | 'ICE' | 'METAL';
export type RarityId = 'EGG' | 'BABY' | 'TRAINING' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ULTRA' | 'BURST';

export interface BaseStats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spt: number;
  spd: number;
  apt: number;
}

export interface Character {
  id: string;
  name: string;
  rarity: RarityId;
  attribute: AttributeId;
  element: ElementId;
  baseStats: BaseStats;
  description: string;
  attackName?: string;
  spiritName?: string;
  attackElement?: ElementId;
  spiritElement?: ElementId;
  spiritHitsAll?: boolean;
}

export interface StageDrop {
  type: 'bits' | 'piece';
  id?: string;
  amount: number;
  chance: number;
}

export interface MapStage {
  index: number;
  name: string;
  enemyCharacterId: string;
  enemyCharacterIds?: string[];
  randomEnemyCount?: number;
  enemyLevel: number;
  expReward: number;
  drops?: StageDrop[];
  bossMultipliers?: { hp?: number; def?: number };
  firstClearReward?: string;
  gemsFirstClear?: number;
  isBoss?: boolean;
  tamerCrestReward?: { amount: number };
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  requiredMapCleared?: string;
  requiredTamerLevel?: number;
  isDungeon?: boolean;
  isDaily?: boolean;
  backgroundImage?: number;
  bitsReward?: number;
  tamerExpReward?: number;
  stages: MapStage[];
}

// ─── Attributes ────────────────────────────────────────────────────────────────
export const ATTRIBUTES: Record<AttributeId, { label: string; abbr: string; color: string; beats: AttributeId | null; weakTo: AttributeId | null }> = {
  VC: { label: 'Vacina',       abbr: 'VC', color: '#22c55e', beats: 'VR', weakTo: 'DA' },
  VR: { label: 'Vírus',        abbr: 'VR', color: '#ef4444', beats: 'DA', weakTo: 'VC' },
  DA: { label: 'Data',         abbr: 'DA', color: '#3b82f6', beats: 'VC', weakTo: 'VR' },
  NO: { label: 'Nulo',         abbr: 'NO', color: '#6b7280', beats: null, weakTo: 'UN' },
  UN: { label: 'Desconhecido', abbr: 'UN', color: '#a855f7', beats: 'NO', weakTo: null },
  FR: { label: 'Livre',        abbr: 'FR', color: '#f59e0b', beats: null, weakTo: null },
};

// ─── Elements ──────────────────────────────────────────────────────────────────
export const ELEMENTS: Record<ElementId, { label: string; color: string; beats: ElementId | null; weakTo: ElementId | null }> = {
  FIRE:      { label: 'Fogo',      color: '#ff6b35', beats: 'PLANT',     weakTo: 'WATER' },
  PLANT:     { label: 'Planta',    color: '#22c55e', beats: 'WATER',     weakTo: 'FIRE' },
  WATER:     { label: 'Água',      color: '#3b82f6', beats: 'FIRE',      weakTo: 'PLANT' },
  WIND:      { label: 'Vento',     color: '#84cc16', beats: 'EARTH',     weakTo: 'LIGHTNING' },
  EARTH:     { label: 'Terra',     color: '#a16207', beats: 'LIGHTNING', weakTo: 'WIND' },
  LIGHTNING: { label: 'Raio',      color: '#facc15', beats: 'WIND',      weakTo: 'EARTH' },
  LIGHT:     { label: 'Luz',       color: '#fde68a', beats: 'DARK',      weakTo: 'DARK' },
  DARK:      { label: 'Trevas',    color: '#8b5cf6', beats: 'LIGHT',     weakTo: 'LIGHT' },
  NULL:      { label: 'Nulo',      color: '#6b7280', beats: null,        weakTo: null },
  ICE:       { label: 'Gelo',      color: '#a8d8f0', beats: 'WIND',      weakTo: 'FIRE' },
  METAL:     { label: 'Metal',     color: '#94a3b8', beats: 'PLANT',     weakTo: 'FIRE' },
};

// ─── Characters ───────────────────────────────────────────────────────────────
export const CHARACTERS: Record<string, Character> = {
  agumon: {
    id: 'agumon',
    name: 'Agumon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 135, mp: 132, atk: 88, def: 73, spt: 60, spd: 66, apt: 40 },
    description: 'Um dinossauro digital corajoso do tipo Vacina. Domina o fogo e possui força física notável.',
    attackName: 'Garras Afiadas ○',
    spiritName: 'Chama Bebê 🔥',
  },
  agumonSaver: {
    id: 'agumonSaver',
    name: 'Agumon (Saver)',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 135, mp: 130, atk: 94, def: 76, spt: 66, spd: 69, apt: 24 },
    description: 'Uma variante poderosa do Agumon com atributo Vacina. Lutador nato do fogo com ataque e defesa superiores à versão clássica.',
  },
  geoGreymon: {
    id: 'geoGreymon',
    name: 'GeoGreymon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 173, mp: 175, atk: 116, def: 98, spt: 71, spd: 80, apt: 35 },
    description: 'A poderosa evolução Champion do Agumon (Saver). Um dinossauro blindado do tipo Vacina com força de fogo devastadora e resistência excepcional em batalha.',
  },
  rizeGreymon: {
    id: 'rizeGreymon',
    name: 'RizeGreymon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 220, mp: 247, atk: 138, def: 108, spt: 93, spd: 110, apt: 55 },
    description: 'A forma Ultimate do GeoGreymon. Um dinossauro cibernético do tipo Vacina armado com canhões de fogo. Combina poder bruto e tecnologia para devastar qualquer inimigo.',
  },
  shineGreymon: {
    id: 'shineGreymon',
    name: 'ShineGreymon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 323, mp: 330, atk: 173, def: 140, spt: 121, spd: 127, apt: 70 },
    description: 'O ápice da linha evolutiva do Agumon (Saver). Um guerreiro solar do tipo Vacina revestido em armadura de luz solar, capaz de desencadear chamas divinas devastadoras.',
  },
  gabumon: {
    id: 'gabumon',
    name: 'Gabumon',
    rarity: 'COMMON',
    attribute: 'DA',
    element: 'WATER',
    baseStats: { hp: 113, mp: 102, atk: 86, def: 59, spt: 53, spd: 63, apt: 22 },
    description: 'Um Digimon do tipo Data coberto por pele de lobo azul. Controla as forças da água.',
  },
  demiDevimon: {
    id: 'demiDevimon',
    name: 'DemiDevimon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 100, mp: 118, atk: 75, def: 67, spt: 63, spd: 64, apt: 22 },
    description: 'Um pequeno Digimon maligno do tipo Vírus. Usa suas asas e presas para atacar com poder das trevas.',
  },
  guilmon: {
    id: 'guilmon',
    name: 'Guilmon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 120, mp: 101, atk: 87, def: 67, spt: 55, spd: 50, apt: 23 },
    description: 'Um dinossauro digital do tipo Vírus imbuído do poder do fogo. Apesar de ser Rookie, possui força de ataque que rivaliza Champions.',
    attackName: 'Garras Afiadas ○',
    spiritName: 'Respiração Pimenta 🔥',
  },
  growlmon: {
    id: 'growlmon',
    name: 'Growlmon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 175, mp: 161, atk: 117, def: 94, spt: 78, spd: 72, apt: 40 },
    description: 'A evolução Champion do Guilmon. Um dragão do tipo Vírus que combina garras afiadas com chamas explosivas devastadoras.',
    attackName: 'Growl Claw ○',
    spiritName: 'Exhaust Flame 🔥',
  },
  megaloGrowlmon: {
    id: 'megaloGrowlmon',
    name: 'MegaloGrowlmon',
    rarity: 'EPIC',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 230, mp: 226, atk: 144, def: 124, spt: 98, spd: 92, apt: 50 },
    description: 'A forma Ultimate do Growlmon. Um dragão cibernético do tipo Vírus com armadura blindada e canhões de fogo capazes de devastar qualquer oponente.',
    attackName: 'Dramon Claw ○',
    spiritName: 'Giga Flame 🔥',
  },
  gallantmon: {
    id: 'gallantmon',
    name: 'Gallantmon',
    rarity: 'LEGENDARY',
    attribute: 'VR',
    element: 'LIGHT',
    baseStats: { hp: 326, mp: 344, atk: 182, def: 165, spt: 165, spd: 137, apt: 85 },
    description: 'O Cavaleiro Sagrado do Digital. A forma Mega do MegaloGrowlmon, um guerreiro do tipo Vírus que paradoxalmente empunha a luz divina para proteger o mundo.',
    attackName: 'EX Damage ○',
    spiritName: 'Heroic Power ✨',
  },
  gallantmonCrimsonMode: {
    id: 'gallantmonCrimsonMode',
    name: 'Gallantmon Crimson Mode',
    rarity: 'ULTRA',
    attribute: 'VR',
    element: 'LIGHT',
    baseStats: { hp: 336, mp: 370, atk: 190, def: 170, spt: 168, spd: 143, apt: 99 },
    description: 'A forma transcendente do Gallantmon fundido com o poder do Seraphimon. Seu Shining Laser purifica todos os inimigos simultaneamente com luz divina absoluta.',
    attackName: 'Mach Rush ○',
    spiritName: 'Shining Laser ✨',
    spiritHitsAll: true,
  },
  lucemon: {
    id: 'lucemon',
    name: 'Lucemon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 112, mp: 116, atk: 79, def: 69, spt: 78, spd: 72, apt: 30 },
    description: 'O Anjo Caído em forma de criança. Um Rookie do tipo Vacina com poder divino imenso e uma dualidade entre a luz pura e a escuridão latente que o conduzirá a transformações devastadoras.',
    attackName: 'Holy Bolt ✨',
    spiritName: 'Grand Cross ✨',
  },
  lucemonChaosMode: {
    id: 'lucemonChaosMode',
    name: 'Lucemon Chaos Mode',
    rarity: 'LEGENDARY',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 243, mp: 265, atk: 142, def: 113, spt: 119, spd: 118, apt: 70 },
    description: 'A forma corrompida do Anjo Caído. Nascido da fusão da luz e das trevas, Lucemon Chaos Mode é um ser de poder absoluto e destruição implacável, equilibrando o divino e o demoníaco em perfeita harmonia sombria.',
    attackName: 'Divine Dasher ✨',
    spiritName: 'Chaos Blast 🌑',
  },
  lucemonSatanMode: {
    id: 'lucemonSatanMode',
    name: 'Lucemon Satan Mode',
    rarity: 'LEGENDARY',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 250, mp: 265, atk: 135, def: 113, spt: 110, spd: 110, apt: 90 },
    description: 'A encarnação definitiva da destruição. Lucemon Satan Mode é a forma final e mais aterrorizante do Anjo Caído, um ser de trevas absolutas capaz de aniquilar qualquer coisa que se oponha a ele com seu poder demoníaco incomparável.',
    attackName: 'Divine Atonement 🌑',
    spiritName: 'Purgatorial Flame 🔥',
  },
  lucemonFM: {
    id: 'lucemonFM',
    name: 'Lucemon Larva Mode',
    rarity: 'LEGENDARY',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 243, mp: 265, atk: 142, def: 113, spt: 119, spd: 118, apt: 80 },
    description: 'A verdadeira forma de Lucemon oculta dentro de Satan Mode. Após a destruição do corpo externo, a Larva emerge — um ser de trevas puras com poder que transcende o nível Mega.',
    attackName: 'Paradise Lost Kai 🌑',
    spiritName: 'Divine Atonement ⚡',
  },
  lucemonX: {
    id: 'lucemonX',
    name: 'Lucemon X',
    rarity: 'LEGENDARY',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 255, mp: 270, atk: 148, def: 118, spt: 125, spd: 122, apt: 85 },
    description: 'A variante X-Antibody do Anjo Caído. Potencializado pelo X-Antibody, Lucemon X transcende os limites normais do Mega, manifestando um poder das trevas ainda mais absoluto e aterrorizante.',
    attackName: 'Paradise Lost X 🌑',
    spiritName: 'Eternal Damnation 💀',
  },
  magnadramon: {
    id: 'magnadramon',
    name: 'Magnadramon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 261, mp: 296, atk: 139, def: 134, spt: 149, spd: 131, apt: 66 },
    description: 'O Dragão Sagrado das Chamas Rosadas. A forma Mega da Angewomon, um poderoso dragão do tipo Vacina que incorpora o poder puro da luz e do vento. Sua presença sagrada é capaz de purificar qualquer corrupção no Mundo Digital.',
    attackName: 'Giga Scissor ⚡',
    spiritName: 'Holy Bolt ✨',
  },
  ophanimon: {
    id: 'ophanimon',
    name: 'Ophanimon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 233, mp: 275, atk: 131, def: 124, spt: 141, spd: 125, apt: 80 },
    description: 'A Anja Celestial Suprema. A forma Mega da Angewomon, guardiã do Mundo Digital e uma das três anjas celestiais do tipo Vacina. Com poder divino absoluto, Ophanimon mantém o equilíbrio entre a luz e as trevas com perfeição inabalável.',
    attackName: 'Giga Scissor ⚡',
    spiritName: 'Holy Bolt ✨',
  },
  angewomon: {
    id: 'angewomon',
    name: 'Angewomon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 215, mp: 237, atk: 127, def: 99, spt: 117, spd: 114, apt: 46 },
    description: 'A Anjo Guerreira Sagrada. A forma Ultimate da Tailmon, uma bela e poderosa anja do tipo Vacina que desce dos céus com luz divina. Sua flecha celestial é capaz de purificar qualquer trevas e derrotar até as forças do mal mais obscuras.',
    attackName: 'Saint Air ✨',
    spiritName: 'Celestial Arrow ✨',
  },
  tailmon: {
    id: 'tailmon',
    name: 'Tailmon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 138, mp: 151, atk: 95, def: 77, spt: 86, spd: 89, apt: 32 },
    description: 'O Digimon Gato Sagrado. A forma Champion da Salamon, uma guerreira ágil e misteriosa do tipo Vacina. Suas garras banhadas de luz divina são capazes de dissipar as trevas, e sua velocidade surpreende até os inimigos mais poderosos.',
    attackName: 'Sharp Claw ○',
    spiritName: 'Lightning Paw ✨',
  },
  salamon: {
    id: 'salamon',
    name: 'Salamon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 105, mp: 119, atk: 76, def: 59, spt: 64, spd: 61, apt: 20 },
    description: 'O Digimon Cachorrinho Sagrado. Um Rookie do tipo Vacina pacífico e gentil, dotado de luz divina. Apesar de sua aparência inofensiva, carrega dentro de si um poder celestial capaz de evoluir em poderosas guerreiras da luz.',
    attackName: 'Petit Bite ○',
    spiritName: 'Puppy Howl ✨',
  },
  phoenixmon: {
    id: 'phoenixmon',
    name: 'Phoenixmon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 325, mp: 352, atk: 171, def: 141, spt: 167, spd: 141, apt: 80 },
    description: 'A Fênix Sagrada. A forma Mega da Garudamon, considerada a encarnação da luz e do renascimento. Dotada de poder divino inigualável, esta majestosa ave lendária do tipo Vacina representa a esperança eterna e a purificação das trevas.',
    attackName: 'Fatal Cannon ✨',
    spiritName: 'Starlight Explosion ✨',
  },
  garudamon: {
    id: 'garudamon',
    name: 'Garudamon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 215, mp: 250, atk: 128, def: 99, spt: 116, spd: 115, apt: 50 },
    description: 'O Digimon Guerreiro das Chamas. A forma Ultimate da Birdramon, uma poderosa ave de batalha do tipo Vacina revestida de armadura vermelha. Seus ataques de fogo são capazes de varrer campos inteiros de inimigos.',
    attackName: 'Crimson Claw 🔥',
    spiritName: 'Shadow Wing 🔥',
  },
  birdramon: {
    id: 'birdramon',
    name: 'Birdramon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 149, mp: 168, atk: 92, def: 75, spt: 88, spd: 90, apt: 35 },
    description: 'O Digimon Pássaro de Chamas. A forma Champion da Pyomon, uma enorme ave de fogo do tipo Vacina que domina os céus com velocidade e poder devastador. Suas asas incandescentes evaporam qualquer obstáculo.',
    attackName: 'Air Cutter 🌀',
    spiritName: 'Meteor Wing 🌀',
  },
  pyomon: {
    id: 'pyomon',
    name: 'Pyomon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 101, mp: 114, atk: 72, def: 61, spt: 66, spd: 79, apt: 21 },
    description: 'O Digimon Pássaro de Fogo. Um Rookie do tipo Vacina ágil e corajoso, com asas flamejantes e personalidade ardente. Usa ataques de fogo e impacto para surpreender os inimigos com velocidade.',
    attackName: 'Double Flick ○',
    spiritName: 'Raging Fire 🔥',
  },
  patamon: {
    id: 'patamon',
    name: 'Patamon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 121, mp: 114, atk: 68, def: 54, spt: 58, spd: 55, apt: 20 },
    description: 'O Digimon Asa-Orelha. Um Rookie do tipo Vacina com personalidade gentil e corajosa. Apesar de sua aparência fofa, esconde um poder divino capaz de evoluir para poderosos anjos guerreiros.',
    attackName: 'Tackle ○',
    spiritName: 'Air Shot 🌀',
  },
  angemon: {
    id: 'angemon',
    name: 'Angemon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 168, mp: 191, atk: 96, def: 79, spt: 89, spd: 78, apt: 37 },
    description: 'O Anjo de Seis Asas. A forma Champion do Patamon, um guerreiro celestial do tipo Vacina que usa a luz sagrada para proteger os inocentes e combater as forças das trevas.',
    attackName: 'Light Knuckle ✨',
    spiritName: 'Heart Break ✨',
  },
  magnaAngemon: {
    id: 'magnaAngemon',
    name: 'MagnaAngemon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 234, mp: 264, atk: 128, def: 112, spt: 123, spd: 102, apt: 57 },
    description: 'O Anjo Sagrado de armadura dourada. A forma Ultimate do Angemon, um guerreiro celestial do tipo Vacina que empunha a luz divina para combater o mal com precisão e poder inabaláveis.',
    attackName: 'Ring of Light ✨',
    spiritName: 'Shine Slash ✨',
  },
  goldramon: {
    id: 'goldramon',
    name: 'Goldramon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 333, mp: 349, atk: 182, def: 151, spt: 168, spd: 138, apt: 80 },
    description: 'O Dragão Divino do Céu Dourado. Forma Mega do MagnaAngemon, um imponente dragão Vacina revestido de armadura dourada que comanda a luz e a terra. Sua presença irradia poder sagrado capaz de julgar qualquer ser corrompido.',
    attackName: 'God Cannon ✨',
    spiritName: 'Burst Counter 🌍',
  },
  seraphimon: {
    id: 'seraphimon',
    name: 'Seraphimon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 308, mp: 366, atk: 178, def: 148, spt: 177, spd: 137, apt: 77 },
    description: 'O Lorde dos Anjos. A forma Mega do MagnaAngemon, guardião celestial do tipo Vacina que concentra a luz divina para purificar qualquer mal.',
    attackName: 'Starlight EX ✨',
    spiritName: '7 Heavens ✨',
  },
  devimon: {
    id: 'devimon',
    name: 'Devimon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 166, mp: 170, atk: 108, def: 82, spt: 92, spd: 79, apt: 48 },
    description: 'O Anjo das Trevas. A forma Champion do DemiDevimon, um Digimon do tipo Vírus com poderes sombrios devastadores e asas negras imponentes.',
  },
  myotismon: {
    id: 'myotismon',
    name: 'Myotismon',
    rarity: 'EPIC',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 233, mp: 260, atk: 132, def: 121, spt: 119, spd: 95, apt: 60 },
    description: 'O Lorde das Trevas. A forma Ultimate do Devimon, um vampiro Digimon do tipo Vírus com domínio sobre a escuridão e poderes de manipulação da mente.',
  },
  vnonMyotismon: {
    id: 'vnonMyotismon',
    name: 'VenomMyotismon',
    rarity: 'LEGENDARY',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 322, mp: 345, atk: 231, def: 182, spt: 186, spd: 163, apt: 66 },
    description: 'A forma Mega corrompida do Myotismon. Consumido pelo veneno das trevas, VenomMyotismon é uma força destrutiva imparável do tipo Vírus, com poder devastador e brutalidade sem limites.',
  },
  garurumon: {
    id: 'garurumon',
    name: 'Garurumon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'ICE',
    baseStats: { hp: 144, mp: 107, atk: 91, def: 80, spt: 53, spd: 61, apt: 22 },
    description: 'A evolução feroz do Gabumon. Um lobo de gelo do tipo Vacina com mandíbulas poderosas capazes de congelar qualquer inimigo.',
  },
  wereGarurumon: {
    id: 'wereGarurumon',
    name: 'WereGarurumon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'ICE',
    baseStats: { hp: 200, mp: 220, atk: 130, def: 115, spt: 80, spd: 100, apt: 30 },
    description: 'A forma Ultimate do Garurumon. Um guerreiro humanoide do gelo com força devastadora e velocidade surpreendente.',
  },
  metalGarurumon: {
    id: 'metalGarurumon',
    name: 'MetalGarurumon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'ICE',
    baseStats: { hp: 312, mp: 338, atk: 167, def: 121, spt: 124, spd: 131, apt: 72 },
    description: 'A forma Mega do WereGarurumon. Um lobo metálico blindado que domina os elementos gelo e água, disparando mísseis criogênicos devastadores. Considerado um dos Digimon Vacina mais poderosos.',
  },
  omegamon: {
    id: 'omegamon',
    name: 'Omegamon',
    rarity: 'ULTRA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 334, mp: 358, atk: 185, def: 143, spt: 170, spd: 143, apt: 99 },
    description: 'A fusão suprema entre WarGreymon e MetalGarurumon. Um Digimon Ultra lendário do tipo Vacina, portador da espada Grey Sword e do canhão Garuru Cannon. Protege o mundo digital com poder absoluto.',
    attackName: 'Espada Cinzenta ✨',
    spiritName: 'Canhão Garuru ❄️',
  },
  shineGreymonBurstMode: {
    id: 'shineGreymonBurstMode',
    name: 'ShineGreymon BM',
    rarity: 'BURST',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 332, mp: 350, atk: 187, def: 160, spt: 162, spd: 142, apt: 85 },
    description: 'A forma definitiva do ShineGreymon, amplificada ao extremo com o poder do Burst Mode. Seu corpo emana energia solar devastadora capaz de consumir qualquer Digimon das trevas. A fusão com o ImperialDramon FM desperta um poder além dos limites do Mega.',
    attackName: 'Shine Slash ✨',
    spiritName: 'Corona Blaze Sword 🔥',
  },
  veemon: {
    id: 'veemon',
    name: 'Veemon',
    rarity: 'RARE',
    attribute: 'FR',
    element: 'FIRE',
    baseStats: { hp: 116, mp: 104, atk: 81, def: 63, spt: 52, spd: 60, apt: 38 },
    description: 'Um Digimon do tipo Livre com aparência de dragão azul e espírito aguerrido. Parceiro leal de Davis, carrega uma força oculta capaz de despertar evoluções poderosas.',
    attackName: 'Vee Headbutt ○',
    attackElement: 'NULL',
    spiritName: 'Boom Boom Punch 🔥',
    spiritElement: 'FIRE',
  },
  exVeemon: {
    id: 'exVeemon',
    name: 'ExVeemon',
    rarity: 'RARE',
    attribute: 'FR',
    element: 'FIRE',
    baseStats: { hp: 204, mp: 178, atk: 131, def: 97, spt: 85, spd: 105, apt: 60 },
    description: 'A evolução poderosa do Veemon, com asas de dragão e músculos forjados em batalha. Seu corpo livre de qualquer atributo fixo o torna imprevisível. Com o parceiro certo, pode transcender ao Paildramon.',
    attackName: 'Vee Laser 🔥',
    attackElement: 'FIRE',
    spiritName: 'Flashing Wyvern ⚡',
    spiritElement: 'LIGHTNING',
  },
  paildramon: {
    id: 'paildramon',
    name: 'Paildramon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 264, mp: 271, atk: 168, def: 121, spt: 108, spd: 141, apt: 72 },
    description: 'Digimon dragão de fusão entre ExVeemon e Stingmon. Combina a força explosiva do fogo com a agilidade cortante do vento, tornando-se um dos Digimon mais versáteis do Mundo Digital.',
    attackName: 'Desperado Blaster 🔥',
    attackElement: 'FIRE',
    spiritName: 'Sonic Flapper 💨',
    spiritElement: 'WIND',
  },
  imperialDramonFM: {
    id: 'imperialDramonFM',
    name: 'Imperialdramon FM',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 320, mp: 340, atk: 174, def: 142, spt: 120, spd: 128, apt: 80 },
    description: 'A forma Fighter Mode do ImperialDramon, um cavaleiro bípede de poder incomparável. Empunha a lâmina Positron Laser com maestria absoluta e é considerado um dos Digimon mais poderosos do Mundo Digital.',
    attackName: 'Positron Laser ✨',
    attackElement: 'LIGHT',
    spiritName: 'Giga Death 🔥',
    spiritElement: 'FIRE',
  },
  imperialDramonRM: {
    id: 'imperialDramonRM',
    name: 'Imperialdramon RM',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 315, mp: 342, atk: 173, def: 141, spt: 111, spd: 127, apt: 90 },
    description: 'Forma de Rage Mode do Imperialdramon Fighter Mode. Libera uma fúria destruidora canalizando todo o poder de fogo em seu corpo de dragão. Pode alternar livremente com o Fighter Mode.',
    attackName: 'Mega Death 🔥',
    attackElement: 'FIRE',
    spiritName: 'Giga Fire 🔥',
    spiritElement: 'FIRE',
  },
  imperialDramonPM: {
    id: 'imperialDramonPM',
    name: 'Imperialdramon PM',
    rarity: 'ULTRA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 341, mp: 366, atk: 188, def: 150, spt: 166, spd: 145, apt: 95 },
    description: 'A forma suprema do ImperialDramon, o Paladin Mode. Empunha a Omni Sword forjada do Omegamon sacrificado e emana uma luz sagrada devastadora. Considerado o Digimon mais poderoso do Mundo Digital.',
    attackName: 'Burning Power 🔥',
    attackElement: 'FIRE',
    spiritName: 'Royal Slash ⚔️',
    spiritElement: 'LIGHT',
  },
  rosemon: {
    id: 'rosemon',
    name: 'Rosemon',
    rarity: 'LEGENDARY',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 251, mp: 288, atk: 139, def: 117, spt: 132, spd: 121, apt: 62 },
    description: 'A majestosa Rainha das Flores, forma Mega da Lillymon. Guerreira elegante e implacável, comanda o poder das plantas com graça absoluta. Sua beleza ofusca até os Digimon mais poderosos enquanto os perfura com sua lança de rosas.',
    attackName: 'Beauty Slap 🌸',
    spiritName: 'Rose Spear 🌹',
  },
  rosemonBurstMode: {
    id: 'rosemonBurstMode',
    name: 'Rosemon BM',
    rarity: 'BURST',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 318, mp: 378, atk: 161, def: 135, spt: 158, spd: 142, apt: 88 },
    description: 'O Burst Mode de Rosemon, forjado com o sacrifício da luz de Ophanimon. Uma força da natureza transcendente que mistura o poder das plantas com relámpagos e luz celestial. Considerada por muitos a forma mais poderosa da linhagem verde.',
    attackName: 'Beauty Shock ⚡',
    attackElement: 'LIGHTNING',
    spiritName: 'Aguichant Lèvres ✨',
    spiritElement: 'LIGHT',
  },
  lillymon: {
    id: 'lillymon',
    name: 'Lillymon',
    rarity: 'EPIC',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 209, mp: 244, atk: 112, def: 108, spt: 118, spd: 114, apt: 50 },
    description: 'A elegante fada das flores, forma Ultimate da Togemon. Seu charme encantador pode enfeitiçar qualquer adversário, e seus poderes da natureza são capazes de fazer florescer até os dados mais corrompidos do mundo digital.',
    attackName: 'Energy Shot ⚡',
    spiritName: 'Flower Temptation 🌍',
  },
  togemon: {
    id: 'togemon',
    name: 'Togemon',
    rarity: 'RARE',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 166, mp: 166, atk: 108, def: 96, spt: 67, spd: 71, apt: 35 },
    description: 'A forma Champion da Palmon, um gigantesco cacto lutador com luvas de boxe. Apesar da aparência dura e espinhosa, tem um coração gentil. Seus socos são capazes de derrubar inimigos muito maiores.',
    attackName: 'Gatling Punch 💥',
    spiritName: 'Chikuchiku Bang Bang 🌍',
  },
  palmon: {
    id: 'palmon',
    name: 'Palmon',
    rarity: 'COMMON',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 103, mp: 114, atk: 74, def: 57, spt: 55, spd: 61, apt: 20 },
    description: 'Um Digimon planta do tipo Data com pétalas coloridas e uma personalidade calorosa. Apesar da aparência delicada, suas vinhas são surpreendentemente fortes e seu veneno pode paralisar inimigos.',
    attackName: 'Poison Ivy 🌿',
    spiritName: 'Stun Whipping ⚡',
  },
  gulusGammamon: {
    id: 'gulusGammamon',
    name: 'GulusGammamon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 290, mp: 260, atk: 230, def: 170, spt: 150, spd: 210, apt: 60 },
    description: 'A forma sombria do Gammamon. Um Digimon Champion do tipo Vírus corrompido pelas trevas, com velocidade e poder de ataque devastadores.',
  },
  greymon: {
    id: 'greymon',
    name: 'Greymon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 170, mp: 165, atk: 115, def: 92, spt: 72, spd: 80, apt: 35 },
    attackName: 'Horn Thrust ○',
    spiritName: 'Mega Flame 🔥',
    description: 'A poderosa evolução do Agumon. Um Digimon de nível Champion do tipo Vacina com força de fogo devastadora.',
  },
  metalGreymon: {
    id: 'metalGreymon',
    name: 'MetalGreymon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 215, mp: 210, atk: 137, def: 117, spt: 94, spd: 100, apt: 51 },
    attackName: 'Metal Flame 🔥',
    spiritName: 'Giga Destroyer ⚙️',
    description: 'A forma Ultimate do Greymon. Metade de seu corpo foi reconstruído com metal cibernético, tornando-o um dos Digimon mais poderosos do tipo Vacina.',
  },
  warGreymon: {
    id: 'warGreymon',
    name: 'WarGreymon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 320, mp: 335, atk: 171, def: 146, spt: 126, spd: 122, apt: 72 },
    description: 'O ápice da evolução do Agumon. Guerreiro lendário do tipo Vacina revestido por armadura Dramon Destroyer, capaz de destruir qualquer Dragonoid.',
  },
  silphymon: {
    id: 'silphymon',
    name: 'Silphymon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 290, mp: 310, atk: 160, def: 135, spt: 155, spd: 165, apt: 74 },
    description: 'A forma Mega nascida da fusão de Aquilamon e Tailmon. Um Digimon do tipo Vacina que domina o vento com agilidade e poder superiores, capaz de voar a velocidades inimagináveis pelo Mundo Digital.',
    attackName: 'Top Storm 💨',
    attackElement: 'WIND',
    spiritName: 'Static Force ⚡',
    spiritElement: 'LIGHTNING',
  },
  sinduramon: {
    id: 'sinduramon',
    name: 'Sinduramon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'LIGHTNING',
    baseStats: { hp: 205, mp: 215, atk: 125, def: 105, spt: 115, spd: 110, apt: 52 },
    description: 'O Digimon Galináceo Celestial do tipo Ultimate. Um dos doze Deva, servo do Deus Digimon Baihumon. Seus poderes elétricos são capazes de acumular e descarregar energia eletromagnética devastadora.',
    attackName: 'Positron Pulse ⚡',
    attackElement: 'LIGHTNING',
    spiritName: 'Electric Charge ⚡',
    spiritElement: 'LIGHTNING',
  },
  valdurmon: {
    id: 'valdurmon',
    name: 'Valdurmon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 326, mp: 352, atk: 178, def: 146, spt: 175, spd: 143, apt: 78 },
    description: 'O Digimon Pássaro Sagrado do nível Mega. Dotado de asas enormes que irradiam luz pura, Valdurmon voa pelos céus do Mundo Digital como guardião celestial. Sua velocidade e poder mágico são temidos por todos os Digimons das trevas.',
    attackName: 'Gatling Spin 💨',
    attackElement: 'WIND',
    spiritName: 'Spiral Wave 💨',
    spiritElement: 'WIND',
  },
  blackSalamon: {
    id: 'blackSalamon',
    name: 'BlackSalamon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 110, mp: 105, atk: 78, def: 65, spt: 72, spd: 60, apt: 22 },
    description: 'A versão sombria de Salamon. Um filhote digital do tipo Vírus que emana energia das trevas, contrastando com sua aparência inofensiva.',
    attackName: 'Sombra Negra 🌑',
    spiritName: 'Pata das Trevas 🌑',
  },
  mushroomon: {
    id: 'mushroomon',
    name: 'Mushroomon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'PLANT',
    baseStats: { hp: 105, mp: 115, atk: 72, def: 62, spt: 75, spd: 58, apt: 20 },
    description: 'Um Digimon cogumelo do tipo Vírus. Libera esporos venenosos para confundir os inimigos.',
    attackName: 'Spore Attack 🍄',
    spiritName: 'Poison Spore 🍄',
  },
  tentomon: {
    id: 'tentomon',
    name: 'Tentomon',
    rarity: 'COMMON',
    attribute: 'DA',
    element: 'LIGHTNING',
    baseStats: { hp: 118, mp: 125, atk: 82, def: 68, spt: 80, spd: 64, apt: 24 },
    description: 'Um inseto digital do tipo Data que canaliza energia elétrica. Parceiro fiel e confiável com poder de raio.',
    attackName: 'Super Shocker ⚡',
    spiritName: 'Electro Shocker ⚡',
  },
  renamon: {
    id: 'renamon',
    name: 'Renamon',
    rarity: 'COMMON',
    attribute: 'DA',
    element: 'WIND',
    baseStats: { hp: 108, mp: 120, atk: 92, def: 58, spt: 78, spd: 82, apt: 26 },
    description: 'Uma raposa digital do tipo Data ágil e misteriosa. Combina velocidade excepcional com golpes certeiros.',
    attackName: 'Diamond Storm 💠',
    spiritName: 'Fox Tail Inferno 💠',
  },
  terriermon: {
    id: 'terriermon',
    name: 'Terriermon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 115, mp: 118, atk: 84, def: 70, spt: 68, spd: 76, apt: 22 },
    description: 'Um pequeno Digimon canino do tipo Vacina. Apesar do tamanho, possui agilidade e força surpreendentes.',
    attackName: 'Terrier Tornado 💨',
    spiritName: 'Bunny Blast 💨',
  },
  wormon: {
    id: 'wormon',
    name: 'Wormmon',
    rarity: 'COMMON',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 100, mp: 112, atk: 70, def: 60, spt: 65, spd: 55, apt: 18 },
    description: 'Um inseto larval digital do tipo Data. Usa fios de seda para prender inimigos e ataca com veneno.',
    attackName: 'Silk Thread 🕸️',
    spiritName: 'Sticky Net 🕸️',
  },
  kumamon: {
    id: 'kumamon',
    name: 'Kumamon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'ICE',
    baseStats: { hp: 122, mp: 110, atk: 80, def: 72, spt: 66, spd: 68, apt: 22 },
    description: 'Um urso digital do tipo Vacina coberto de neve e gelo. Utiliza o poder do frio para paralisar os inimigos.',
    attackName: 'Blizzard Blaster ❄️',
    spiritName: 'Snow Claw ❄️',
  },
  woodmon: {
    id: 'woodmon',
    name: 'Woodmon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'PLANT',
    baseStats: { hp: 168, mp: 162, atk: 112, def: 90, spt: 85, spd: 72, apt: 35 },
    description: 'Um Digimon árvore do nível Champion do tipo Vírus. Capaz de se camuflar nas florestas digitais e atacar com galhos enormes.',
    attackName: 'Branch Bash 🌿',
    spiritName: 'Leaf Storm 🌿',
  },
  gomamon: {
    id: 'gomamon',
    name: 'Gomamon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'WATER',
    baseStats: { hp: 112, mp: 108, atk: 78, def: 65, spt: 62, spd: 70, apt: 20 },
    description: 'Um Digimon aquático do tipo Vacina cheio de energia. Comanda cardumes de peixes digitais para atacar.',
    attackName: 'Marching Fishes 🐟',
    spiritName: 'Claw Attack 🐟',
  },
  kokwamon: {
    id: 'kokwamon',
    name: 'Kokuwamon',
    rarity: 'COMMON',
    attribute: 'DA',
    element: 'LIGHTNING',
    baseStats: { hp: 106, mp: 130, atk: 74, def: 60, spt: 85, spd: 58, apt: 20 },
    description: 'Um Digimon inseto mecânico do tipo Data. Gera correntes elétricas para paralisar os adversários.',
    attackName: 'Scissor Arms ⚡',
    spiritName: 'Electric Bite ⚡',
  },
  imomon: {
    id: 'imomon',
    name: 'Imomon',
    rarity: 'COMMON',
    attribute: 'FR',
    element: 'WIND',
    baseStats: { hp: 98, mp: 105, atk: 68, def: 56, spt: 60, spd: 72, apt: 18 },
    description: 'Um Digimon espiritual do tipo Livre que flutua entre as dimensões digitais com movimentos imprevisíveis.',
    attackName: 'Phantom Rush 💨',
    spiritName: 'Wind Slash 💨',
  },
  lalamon: {
    id: 'lalamon',
    name: 'Lalamon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'PLANT',
    baseStats: { hp: 105, mp: 122, atk: 72, def: 62, spt: 82, spd: 60, apt: 20 },
    description: 'Um Digimon floral do tipo Vacina. Usa sementes e pétalas como projéteis e possui habilidades curativas.',
    attackName: 'Seed Blast 🌸',
    spiritName: 'Lala Spiral 🌸',
  },
  gaomon: {
    id: 'gaomon',
    name: 'Gaomon',
    rarity: 'COMMON',
    attribute: 'DA',
    element: 'WIND',
    baseStats: { hp: 120, mp: 108, atk: 88, def: 72, spt: 60, spd: 75, apt: 24 },
    description: 'Um Digimon canino do tipo Data com extraordinária velocidade e força de combate. Especialista em golpes rápidos.',
    attackName: 'Double Back Knuckle 👊',
    spiritName: 'Rolling Upper 👊',
  },
  kotemon: {
    id: 'kotemon',
    name: 'Kotemon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 115, mp: 105, atk: 85, def: 78, spt: 58, spd: 62, apt: 22 },
    description: 'Um Digimon guerreiro do tipo Vacina que treina com espadas de fogo. Possui disciplina e força de vontade excepcionais.',
    attackName: 'Fire Kendo 🔥',
    spiritName: 'Flame Sword 🔥',
  },
  otamamon: {
    id: 'otamamon',
    name: 'Otamamon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'WATER',
    baseStats: { hp: 108, mp: 118, atk: 72, def: 64, spt: 75, spd: 58, apt: 20 },
    description: 'Um Digimon girino digital do tipo Vírus. Vive em rios de dados e usa cantos sônicos para atordoar inimigos.',
    attackName: 'Lullaby 💧',
    spiritName: 'Bubble Blow 💧',
  },
  betamon: {
    id: 'betamon',
    name: 'Betamon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'WATER',
    baseStats: { hp: 118, mp: 112, atk: 80, def: 68, spt: 65, spd: 60, apt: 22 },
    description: 'Um Digimon anfíbio do tipo Vírus. Gera descargas elétricas pela água para paralisar e derrotar inimigos.',
    attackName: 'Electric Shock 💧',
    spiritName: 'Delta Ray ⚡',
  },
  candlemon: {
    id: 'candlemon',
    name: 'Candlemon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 108, mp: 122, atk: 78, def: 60, spt: 85, spd: 56, apt: 22 },
    description: 'Um Digimon vela do tipo Vírus. Sua chama digital nunca se apaga e pode queimar até os dados mais resistentes.',
    attackName: 'Lava Gob 🔥',
    spiritName: 'Melting Wax 🔥',
  },
  falcomon: {
    id: 'falcomon',
    name: 'Falcomon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 112, mp: 105, atk: 82, def: 64, spt: 62, spd: 88, apt: 24 },
    description: 'Um Digimon falcão do tipo Vacina ágil e rápido. Mergulha em alta velocidade para atacar inimigos desprevenidos.',
    attackName: 'Scratch Smash 💨',
    spiritName: 'Shurimon Blade 💨',
  },
  hagurumon: {
    id: 'hagurumon',
    name: 'Hagurumon',
    rarity: 'COMMON',
    attribute: 'DA',
    element: 'METAL',
    baseStats: { hp: 115, mp: 112, atk: 76, def: 80, spt: 68, spd: 52, apt: 20 },
    description: 'Um Digimon engrenagem do tipo Data. Corpo formado por engrenagens metálicas interligadas que giram em alta velocidade.',
    attackName: 'Cog Crusher ⚙️',
    spiritName: 'Darkness Gear ⚙️',
  },
  kamemon: {
    id: 'kamemon',
    name: 'Kamemon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'WATER',
    baseStats: { hp: 118, mp: 108, atk: 74, def: 80, spt: 62, spd: 56, apt: 20 },
    description: 'Um Digimon tartaruga do tipo Vacina. Usa sua carapaça dura como escudo e arma ao mesmo tempo.',
    attackName: 'Shell Attack 🐢',
    spiritName: 'Hydro Tackle 💧',
  },
  monodramon: {
    id: 'monodramon',
    name: 'Monodramon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'EARTH',
    baseStats: { hp: 120, mp: 108, atk: 86, def: 70, spt: 64, spd: 68, apt: 24 },
    description: 'Um pequeno dragão digital do tipo Vírus. Possui instintos selvagens e combate com garras e chifres afiados.',
    attackName: 'Beat Knuckle 🐉',
    spiritName: 'Cracking Bite 🐉',
  },
  penguinmon: {
    id: 'penguinmon',
    name: 'Penguinmon',
    rarity: 'COMMON',
    attribute: 'DA',
    element: 'ICE',
    baseStats: { hp: 112, mp: 110, atk: 74, def: 68, spt: 65, spd: 75, apt: 20 },
    description: 'Um Digimon pinguim do tipo Data que habita regiões geladas do Mundo Digital. Surpreende inimigos com sua velocidade no gelo.',
    attackName: 'Ice Slicer ❄️',
    spiritName: 'Sliding Attack ❄️',
  },
  pipismon: {
    id: 'pipismon',
    name: 'Pipismon',
    rarity: 'RARE',
    attribute: 'FR',
    element: 'WIND',
    baseStats: { hp: 172, mp: 168, atk: 110, def: 88, spt: 90, spd: 95, apt: 35 },
    description: 'Um Digimon morcego Champion do tipo Livre. Utiliza ultrassom para desorientar inimigos e ataca com velocidade impressionante.',
    attackName: 'Ultrasonic Wave 🦇',
    spiritName: 'Night Flapper 🦇',
  },
  guardromon: {
    id: 'guardromon',
    name: 'Guardromon',
    rarity: 'RARE',
    attribute: 'DA',
    element: 'METAL',
    baseStats: { hp: 178, mp: 158, atk: 115, def: 105, spt: 82, spd: 68, apt: 35 },
    description: 'Um Digimon robô Champion do tipo Data. Construído para proteger e defender, possui armadura de aço e canhões de alarme.',
    attackName: 'Grenade Destroyer 💣',
    spiritName: 'Alarm Voice ⚠️',
  },
  solarmon: {
    id: 'solarmon',
    name: 'Solarmon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 108, mp: 112, atk: 76, def: 68, spt: 72, spd: 60, apt: 20 },
    description: 'Um Digimon sol do tipo Vacina que irradia calor e luz divina. Seus raios solares são capazes de purificar dados corrompidos.',
    attackName: 'Solar Ray ☀️',
    spiritName: 'Prominence Beam ☀️',
  },
  toyagumon: {
    id: 'toyagumon',
    name: 'ToyAgumon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 115, mp: 105, atk: 80, def: 72, spt: 58, spd: 64, apt: 20 },
    description: 'Uma versão de brinquedo do Agumon, feita de plástico colorido. Apesar da aparência frágil, possui força e determinação reais.',
    attackName: 'Plastic Blaze 🧱',
    spiritName: 'Toy Flame 🔥',
  },
  piddomon: {
    id: 'piddomon',
    name: 'Piddomon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 170, mp: 175, atk: 112, def: 90, spt: 105, spd: 80, apt: 35 },
    description: 'Um Digimon anjo Champion do tipo Vacina. Serve como mensageiro divino e utiliza chamas sagradas para combater o mal.',
    attackName: 'Fire Feather 🔥',
    spiritName: 'Apollo Tornado 💡',
  },
  reppamon: {
    id: 'reppamon',
    name: 'Reppamon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 175, mp: 165, atk: 118, def: 92, spt: 88, spd: 95, apt: 35 },
    description: 'Um Digimon felino Champion do tipo Vacina. Possui cauda de espada e lança cortes de vento devastadores a alta velocidade.',
    attackName: 'Turbulence Saber 💨',
    spiritName: 'Infinite Blade 💨',
  },
  stingmon: {
    id: 'stingmon',
    name: 'Stingmon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'PLANT',
    baseStats: { hp: 172, mp: 168, atk: 122, def: 88, spt: 90, spd: 92, apt: 38 },
    description: 'A evolução Champion de Wormmon. Um inseto guerreiro do tipo Vírus com braços em forma de estacas mortíferas.',
    attackName: 'Spiking Strike 🌿',
    spiritName: 'Hell Squeeze 🌿',
  },
  aquilamon: {
    id: 'aquilamon',
    name: 'Aquilamon',
    rarity: 'RARE',
    attribute: 'DA',
    element: 'WIND',
    baseStats: { hp: 175, mp: 162, atk: 118, def: 90, spt: 85, spd: 95, apt: 35 },
    description: 'Um Digimon águia gigante Champion do tipo Data. Usa correntes elétricas dos chifres para atacar do alto.',
    attackName: 'Grand Horn ⚡',
    spiritName: 'Blast Rings 💨',
  },
  ogremon: {
    id: 'ogremon',
    name: 'Ogremon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 180, mp: 152, atk: 125, def: 95, spt: 80, spd: 85, apt: 38 },
    description: 'Um oni digital Champion do tipo Vírus. Portador de uma clava poderosa, busca incansavelmente a batalha e a glória.',
    attackName: 'Pummel Whack 🪨',
    spiritName: 'Bone Cudgel 🌑',
  },
  airdramon: {
    id: 'airdramon',
    name: 'Airdramon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 168, mp: 168, atk: 112, def: 85, spt: 92, spd: 98, apt: 35 },
    description: 'Um dragão alado Champion do tipo Vacina que domina os ventos. Seus golpes de asa criam tornados devastadores.',
    attackName: 'Spinning Needle 💨',
    spiritName: 'Mach Storm 💨',
  },
  tyranomon: {
    id: 'tyranomon',
    name: 'Tyranomon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 182, mp: 155, atk: 120, def: 98, spt: 78, spd: 75, apt: 38 },
    description: 'Um dinossauro tirano Champion do tipo Vírus. Ataca com chamas brutais e força física avassaladora.',
    attackName: 'Fire Blast 🔥',
    spiritName: 'Mega Flames 🔥',
  },
  seadramon: {
    id: 'seadramon',
    name: 'Seadramon',
    rarity: 'RARE',
    attribute: 'DA',
    element: 'WATER',
    baseStats: { hp: 175, mp: 165, atk: 115, def: 92, spt: 85, spd: 88, apt: 35 },
    description: 'Um dragão marinho Champion do tipo Data que habita os oceanos digitais. Usa gelo e água para enredar e destruir adversários.',
    attackName: 'Ice Blast ❄️',
    spiritName: 'Maelstrom 💧',
  },
  allomon: {
    id: 'allomon',
    name: 'Allomon',
    rarity: 'RARE',
    attribute: 'DA',
    element: 'FIRE',
    baseStats: { hp: 178, mp: 155, atk: 122, def: 96, spt: 80, spd: 78, apt: 36 },
    description: 'Um dinossauro Champion do tipo Data com chifres poderosos. Especialista em ataques frontais implacáveis.',
    attackName: 'Dino Burst 🔥',
    spiritName: 'Dynamite Head 🔥',
  },
  darktyranomon: {
    id: 'darktyranomon',
    name: 'DarkTyranomon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 185, mp: 158, atk: 128, def: 102, spt: 82, spd: 78, apt: 38 },
    description: 'A variante sombria do Tyranomon, corrompida pelas trevas digitais. Mais poderosa e agressiva do que o original.',
    attackName: 'Dark Fire 🌑',
    spiritName: 'Fire Tower 🌑',
  },
  blacktailmon: {
    id: 'blacktailmon',
    name: 'BlackTailmon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 172, mp: 168, atk: 115, def: 90, spt: 100, spd: 88, apt: 36 },
    description: 'A versão Vírus de Tailmon, mergulhada nas trevas. Possui velocidade e instinto predatório amplificados pela corrupção.',
    attackName: 'Neko Punch 🌑',
    spiritName: 'Dark Claw 🌑',
  },
  darklizardmon: {
    id: 'darklizardmon',
    name: 'DarkLizardmon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 175, mp: 162, atk: 118, def: 92, spt: 85, spd: 82, apt: 36 },
    description: 'Um lagarto das trevas Champion do tipo Vírus. Rasteja pelas sombras digitais e ataca com veneno e energia sombria.',
    attackName: 'Dark Venom 🌑',
    spiritName: 'Shadow Claw 🌑',
  },
  devidramon: {
    id: 'devidramon',
    name: 'Devidramon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 178, mp: 162, atk: 122, def: 92, spt: 88, spd: 85, apt: 36 },
    description: 'Um dragão demoníaco Champion do tipo Vírus com quatro olhos que hipnotizam vítimas. Suas garras rasgam dados digitais.',
    attackName: 'Crimson Claw 🌑',
    spiritName: 'Red Eye 🌑',
  },
  skullgreymon: {
    id: 'skullgreymon',
    name: 'SkullGreymon',
    rarity: 'EPIC',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 248, mp: 225, atk: 152, def: 118, spt: 95, spd: 110, apt: 52 },
    description: 'O esqueleto de um Greymon que evoluiu pelo ódio e destruição. Um Ultimate do tipo Vírus incapaz de controlar seu próprio poder devastador.',
    attackName: 'Dark Shot 💀',
    spiritName: 'Ground Zero 💀',
  },
};

// ─── Fusion paths ─────────────────────────────────────────────────────────────
export interface FusionRecipe {
  partner: string;
  resultId: string;
  resultName: string;
  requiredLevel: number;
}

export const FUSIONS: Record<string, FusionRecipe> = {
  warGreymon:    { partner: 'metalGarurumon', resultId: 'omegamon',              resultName: 'Omegamon',              requiredLevel: 60 },
  metalGarurumon:{ partner: 'warGreymon',     resultId: 'omegamon',              resultName: 'Omegamon',              requiredLevel: 60 },
  gallantmon:    { partner: 'seraphimon',     resultId: 'gallantmonCrimsonMode', resultName: 'Gallantmon Crimson Mode', requiredLevel: 60 },
  angemon:       { partner: 'devimon',        resultId: 'lucemonChaosMode',      resultName: 'Lucemon Chaos Mode',      requiredLevel: 60 },
  devimon:       { partner: 'angemon',        resultId: 'lucemonChaosMode',      resultName: 'Lucemon Chaos Mode',      requiredLevel: 60 },
};

// ─── Evolution paths ──────────────────────────────────────────────────────────
export const EVOLUTIONS: Record<string, { evolvesTo: string; requiredLevel: number; label: string; requiredItem?: string }> = {
  agumon:       { evolvesTo: 'greymon',       requiredLevel: 16, label: 'Greymon' },
  agumonSaver:  { evolvesTo: 'geoGreymon',    requiredLevel: 20, label: 'GeoGreymon' },
  geoGreymon:   { evolvesTo: 'rizeGreymon',   requiredLevel: 35, label: 'RizeGreymon' },
  rizeGreymon:  { evolvesTo: 'shineGreymon',  requiredLevel: 59, label: 'ShineGreymon' },
  greymon:      { evolvesTo: 'metalGreymon',  requiredLevel: 34, label: 'MetalGreymon' },
  metalGreymon: { evolvesTo: 'warGreymon',    requiredLevel: 52, label: 'WarGreymon' },
  gabumon:      { evolvesTo: 'garurumon',     requiredLevel: 19, label: 'Garurumon' },
  garurumon:    { evolvesTo: 'wereGarurumon',   requiredLevel: 35, label: 'WereGarurumon' },
  wereGarurumon:{ evolvesTo: 'metalGarurumon', requiredLevel: 52, label: 'MetalGarurumon' },
  guilmon:      { evolvesTo: 'growlmon',      requiredLevel: 16, label: 'Growlmon' },
  growlmon:       { evolvesTo: 'megaloGrowlmon', requiredLevel: 40, label: 'MegaloGrowlmon' },
  megaloGrowlmon: { evolvesTo: 'gallantmon',   requiredLevel: 60, label: 'Gallantmon' },
  lucemon:          { evolvesTo: 'lucemonChaosMode', requiredLevel: 40, label: 'Lucemon Chaos Mode' },
  lucemonSatanMode: { evolvesTo: 'lucemonFM', requiredLevel: 70, label: 'Lucemon Larva Mode' },
  pyomon:         { evolvesTo: 'birdramon',    requiredLevel: 16, label: 'Birdramon' },
  birdramon:      { evolvesTo: 'garudamon',    requiredLevel: 32, label: 'Garudamon' },
  garudamon:      { evolvesTo: 'phoenixmon',   requiredLevel: 48, label: 'Phoenixmon' },
  salamon:        { evolvesTo: 'tailmon',      requiredLevel: 13, label: 'Tailmon' },
  tailmon:        { evolvesTo: 'angewomon',    requiredLevel: 35, label: 'Angewomon' },
  blackSalamon:   { evolvesTo: 'blacktailmon', requiredLevel: 13, label: 'BlackTailmon' },
  palmon:         { evolvesTo: 'togemon',       requiredLevel: 19, label: 'Togemon' },
  togemon:        { evolvesTo: 'lillymon',      requiredLevel: 33, label: 'Lillymon' },
  lillymon:       { evolvesTo: 'rosemon',       requiredLevel: 50, label: 'Rosemon' },
  angewomon:      { evolvesTo: 'magnadramon',  requiredLevel: 60, label: 'Magnadramon' },
  patamon:        { evolvesTo: 'angemon',      requiredLevel: 19, label: 'Angemon' },
  angemon:        { evolvesTo: 'magnaAngemon', requiredLevel: 33, label: 'MagnaAngemon' },
  magnaAngemon:   { evolvesTo: 'goldramon',    requiredLevel: 60, label: 'Goldramon' },
  veemon:       { evolvesTo: 'exVeemon',         requiredLevel: 22, label: 'ExVeemon' },
  paildramon:   { evolvesTo: 'imperialDramonFM', requiredLevel: 60, label: 'Imperialdramon FM' },
  demiDevimon:  { evolvesTo: 'devimon',     requiredLevel: 21, label: 'Devimon' },
  devimon:      { evolvesTo: 'myotismon',     requiredLevel: 32, label: 'Myotismon' },
  myotismon:    { evolvesTo: 'vnonMyotismon', requiredLevel: 56, label: 'VenomMyotismon' },
};

// ─── Sacrifice System ────────────────────────────────────────────────────────

export const ALTERNATE_EVOLUTIONS: Record<string, { evolvesTo: string; requiredLevel: number; label: string; requiredItem?: string; requiredSacrificeCharacter?: string }> = {
  angewomon:        { evolvesTo: 'ophanimon',      requiredLevel: 60, label: 'Ophanimon',          requiredItem: 'anel_sagrado' },
  magnaAngemon:     { evolvesTo: 'seraphimon',     requiredLevel: 60, label: 'Seraphimon',         requiredItem: 'anel_sagrado' },
  lucemonChaosMode: { evolvesTo: 'lucemonSatanMode', requiredLevel: 50, label: 'Lucemon Satan Mode', requiredItem: 'gehenna' },
  shineGreymon:      { evolvesTo: 'shineGreymonBurstMode', requiredLevel: 68, label: 'ShineGreymon Burst Mode', requiredSacrificeCharacter: 'imperialDramonFM' },
  rosemon:           { evolvesTo: 'rosemonBurstMode',      requiredLevel: 64, label: 'Rosemon Burst Mode',      requiredSacrificeCharacter: 'ophanimon' },
  imperialDramonFM:  { evolvesTo: 'imperialDramonPM',     requiredLevel: 60, label: 'Imperialdramon PM',       requiredSacrificeCharacter: 'omegamon' },
  exVeemon:          { evolvesTo: 'paildramon',            requiredLevel: 36, label: 'Paildramon',              requiredSacrificeCharacter: 'stingmon' },
  stingmon:          { evolvesTo: 'paildramon',            requiredLevel: 36, label: 'Paildramon',              requiredSacrificeCharacter: 'exVeemon' },
  silphymon:         { evolvesTo: 'valdurmon',             requiredLevel: 63, label: 'Valdurmon',               requiredSacrificeCharacter: 'sinduramon' },
};

export const SACRIFICE_DROPS: Record<string, { itemId: string; chance: number }[]> = {
  magnaAngemon:     [{ itemId: 'piece_anel_sagrado', chance: 0.30 }],
  angewomon:        [{ itemId: 'piece_anel_sagrado', chance: 0.30 }],
  lucemonChaosMode: [{ itemId: 'piece_anel_sagrado', chance: 0.40 }],
  angemon:          [{ itemId: 'piece_anel_sagrado', chance: 0.10 }],
  tailmon:          [{ itemId: 'piece_anel_sagrado', chance: 0.10 }],
  // ── Fragmentos do Gehenna (7 Lordes das Trevas) ───────────────────────────
  lilithmon:  [{ itemId: 'piece_gehenna', chance: 1.0 }],
  barbamon:   [{ itemId: 'piece_gehenna', chance: 1.0 }],
  beelzemon:  [{ itemId: 'piece_gehenna', chance: 1.0 }],
  leviamon:   [{ itemId: 'piece_gehenna', chance: 1.0 }],
  belphemon:  [{ itemId: 'piece_gehenna', chance: 1.0 }],
  demon:      [{ itemId: 'piece_gehenna', chance: 1.0 }],
};

// Bidirectional form changes — no level reset, no requirement, toggle freely
export const FORM_CHANGES: Record<string, string> = {
  imperialDramonFM: 'imperialDramonRM',
  imperialDramonRM: 'imperialDramonFM',
  lucemonFM:        'lucemonSatanMode',
  lucemonSatanMode: 'lucemonFM',
};

export const ROOKIE_OF: Record<string, string> = {
  greymon: 'agumon',          metalGreymon: 'agumon',         warGreymon: 'agumon',
  geoGreymon: 'agumonSaver',  rizeGreymon: 'agumonSaver',     shineGreymon: 'agumonSaver',    shineGreymonBurstMode: 'agumonSaver',
  garurumon: 'gabumon',       wereGarurumon: 'gabumon',       metalGarurumon: 'gabumon',
  growlmon: 'guilmon',        megaloGrowlmon: 'guilmon',      gallantmon: 'guilmon',          gallantmonCrimsonMode: 'guilmon',
  birdramon: 'pyomon',        garudamon: 'pyomon',            phoenixmon: 'pyomon',
  angemon: 'patamon',         magnaAngemon: 'patamon',        seraphimon: 'patamon',          goldramon: 'patamon',
  tailmon: 'salamon',         angewomon: 'salamon',           ophanimon: 'salamon',           magnadramon: 'salamon',
  blacktailmon: 'blackSalamon',
  togemon: 'palmon',          lillymon: 'palmon',             rosemon: 'palmon',              rosemonBurstMode: 'palmon',
  devimon: 'demiDevimon',     myotismon: 'demiDevimon',       vnonMyotismon: 'demiDevimon',
  lucemonChaosMode: 'lucemon',
  lucemonSatanMode: 'lucemon',
  lucemonFM:        'lucemon',
  lucemonX:         'lucemon',
  exVeemon:         'veemon',
  paildramon:       'veemon',
  imperialDramonFM: 'veemon',
  imperialDramonRM: 'veemon',
  imperialDramonPM: 'veemon',
  valdurmon:        'silphymon',
};

export const SACRIFICE_SCAN_OVERRIDES: Record<string, { characterId: string; percent: number }> = {
  lucemonChaosMode: { characterId: 'lucemon', percent: 0.05 },
};

export const SACRIFICE_SCAN_PCT: Partial<Record<RarityId, number>> = {
  RARE:      0.10,
  EPIC:      0.20,
  LEGENDARY: 0.50,
};

export const ITEM_NAMES: Record<string, string> = {
  anel_sagrado:         'Anel Sagrado ✨',
  piece_anel_sagrado:   'Fragmento do Anel Sagrado',
  permissao_real:       'Permição Real da Deusa ⚔️',
  gehenna:              'Gehenna 🌑',
  piece_gehenna:        'Fragmento do Gehenna',
  piece_battery_green:  'Bateria Verde',
  piece_battery_blue:   'Bateria Azul',
  piece_battery_purple: 'Bateria Roxa',
  piece_battery_gold:   'Bateria Dourada',
};

// Characters that can be scanned (encountered as enemies in battle)
// Only normal-phase Rookie (COMMON rarity) Digimon can be scanned
export const SCANNABLE_CHARACTERS: string[] = [
  // Original Rookies
  'agumon', 'gabumon', 'demiDevimon', 'patamon', 'pyomon', 'salamon', 'palmon',
  // World 2 — Santuário de Gelo
  'blackSalamon', 'mushroomon', 'tentomon', 'renamon', 'terriermon', 'wormon', 'kumamon',
  // World 3 — Catacumbas Sombrias
  'gomamon', 'kokwamon', 'imomon', 'lalamon',
  // World 4 — Floresta Encantada
  'gaomon', 'kotemon', 'otamamon', 'betamon',
  // World 5 — Mina de Crômio
  'candlemon', 'falcomon', 'hagurumon', 'kamemon', 'monodramon', 'penguinmon',
  // World 6 — Costa da Luz
  'solarmon', 'toyagumon',
];

// Display order in the Codex (grouped by evolution line)
export const CODEX_ORDER: string[] = ['agumon', 'agumonSaver', 'geoGreymon', 'rizeGreymon', 'shineGreymon', 'shineGreymonBurstMode', 'veemon', 'exVeemon', 'paildramon', 'imperialDramonFM', 'imperialDramonRM', 'imperialDramonPM', 'greymon', 'metalGreymon', 'warGreymon', 'gabumon', 'garurumon', 'wereGarurumon', 'metalGarurumon', 'omegamon', 'guilmon', 'growlmon', 'megaloGrowlmon', 'gallantmon', 'gallantmonCrimsonMode', 'lucemon', 'lucemonChaosMode', 'lucemonSatanMode', 'lucemonFM', 'lucemonX', 'patamon', 'angemon', 'magnaAngemon', 'goldramon', 'seraphimon', 'pyomon', 'birdramon', 'garudamon', 'phoenixmon', 'salamon', 'tailmon', 'angewomon', 'magnadramon', 'ophanimon', 'palmon', 'togemon', 'lillymon', 'rosemon', 'rosemonBurstMode', 'demiDevimon', 'devimon', 'myotismon', 'vnonMyotismon', 'gulusGammamon', 'silphymon', 'sinduramon', 'valdurmon'];

// ─── Maps & Stages ─────────────────────────────────────────────────────────────
export const GAME_MAPS: GameMap[] = [
  // ── WORLD 1: Floresta dos Dados ─────────────────────────────────────────────
  {
    id: 'map_forest',
    name: 'Floresta dos Dados',
    description: 'Uma floresta encantada onde a luz digital brilha entre as árvores ancestrais. O primeiro passo de todo Tamer começa aqui.',
    backgroundImage: require('../assets/images/maps/chip_forest.png'),
    bitsReward: 100,
    tamerExpReward: 10,
    stages: [
      { index: 0, name: 'Entrada da Floresta', enemyCharacterId: 'demiDevimon', enemyLevel: 3,  expReward: 50,  gemsFirstClear: 50,  enemyCharacterIds: ['demiDevimon', 'agumon', 'gabumon'], randomEnemyCount: 1 },
      { index: 1, name: 'Clareira dos Dados',  enemyCharacterId: 'gabumon',     enemyLevel: 6,  expReward: 90,  gemsFirstClear: 100, enemyCharacterIds: ['gabumon', 'pyomon', 'salamon'], randomEnemyCount: 1 },
      { index: 2, name: 'Núcleo da Floresta',  enemyCharacterId: 'pyomon',      enemyLevel: 9,  expReward: 160, gemsFirstClear: 150, enemyCharacterIds: ['pyomon', 'patamon', 'palmon'], randomEnemyCount: 1 },
      { index: 3, name: '⚔️ Boss — Patamon', enemyCharacterId: 'patamon', enemyLevel: 12, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 1.8, def: 1.3 }, enemyCharacterIds: ['patamon'] },
    ],
  },
  // ── WORLD 2: Santuário de Gelo ──────────────────────────────────────────────
  {
    id: 'map_city',
    name: 'Santuário de Gelo',
    description: 'Um castelo de cristal erguido nas montanhas digitais congeladas sob o luar. Rookies variados patrulham suas muralhas geladas.',
    backgroundImage: require('../assets/images/maps/acess_glacier.png'),
    requiredMapCleared: 'map_forest',
    bitsReward: 250,
    tamerExpReward: 20,
    stages: [
      { index: 0, name: 'Portal Congelado',  enemyCharacterId: 'blackSalamon', enemyLevel: 12, expReward: 220,  gemsFirstClear: 50,  enemyCharacterIds: ['blackSalamon', 'mushroomon', 'tentomon'], randomEnemyCount: 1 },
      { index: 1, name: 'Muralhas de Gelo',  enemyCharacterId: 'renamon',      enemyLevel: 15, expReward: 380,  gemsFirstClear: 100, enemyCharacterIds: ['renamon', 'terriermon', 'wormon'], randomEnemyCount: 1 },
      { index: 2, name: 'Trono de Cristal',  enemyCharacterId: 'kumamon',      enemyLevel: 18, expReward: 650,  gemsFirstClear: 150, enemyCharacterIds: ['kumamon', 'blackSalamon', 'mushroomon'], randomEnemyCount: 1 },
      { index: 3, name: '⚔️ Boss — Woodmon', enemyCharacterId: 'woodmon', enemyLevel: 21, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 1.8, def: 1.3 }, enemyCharacterIds: ['woodmon'] },
    ],
  },
  // ── WORLD 3: Catacumbas Sombrias ────────────────────────────────────────────
  {
    id: 'map_shadow',
    name: 'Catacumbas Sombrias',
    description: 'Corredores de pedra cobertos por raízes digitais e iluminados por tochas antigas. As trevas aqui consomem até os mais corajosos.',
    backgroundImage: require('../assets/images/maps/chaos_brain.png'),
    requiredMapCleared: 'map_city',
    bitsReward: 500,
    tamerExpReward: 35,
    stages: [
      { index: 0, name: 'Entrada das Catacumbas', enemyCharacterId: 'wormon',   enemyLevel: 20, expReward: 800,  gemsFirstClear: 50,  enemyCharacterIds: ['wormon', 'salamon', 'patamon'], randomEnemyCount: 1 },
      { index: 1, name: 'Corredor das Almas',     enemyCharacterId: 'gomamon',  enemyLevel: 23, expReward: 1200, gemsFirstClear: 100, enemyCharacterIds: ['gomamon', 'kokwamon', 'imomon'], randomEnemyCount: 1 },
      { index: 2, name: 'Câmara das Trevas',      enemyCharacterId: 'lalamon',  enemyLevel: 26, expReward: 1800, gemsFirstClear: 150, enemyCharacterIds: ['lalamon', 'wormon', 'salamon'], randomEnemyCount: 1 },
      { index: 3, name: '⚔️ Boss — Devimon', enemyCharacterId: 'devimon', enemyLevel: 29, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.0, def: 1.3 }, enemyCharacterIds: ['devimon'] },
    ],
  },
  // ── WORLD 4: Floresta Encantada ─────────────────────────────────────────────
  {
    id: 'map_plant',
    name: 'Floresta Encantada',
    description: 'Uma floresta mágica repleta de flores digitais coloridas. Rookies habitam as bordas, mas Champions surgem no interior.',
    backgroundImage: require('../assets/images/maps/map_metal_bg.jpg'),
    requiredMapCleared: 'map_shadow',
    bitsReward: 800,
    tamerExpReward: 50,
    stages: [
      { index: 0, name: 'Prado das Flores',   enemyCharacterId: 'gaomon',   enemyLevel: 28, expReward: 2200,  gemsFirstClear: 50,  enemyCharacterIds: ['gaomon', 'kotemon', 'gabumon'], randomEnemyCount: 1 },
      { index: 1, name: 'Estufa Selvagem',    enemyCharacterId: 'otamamon', enemyLevel: 31, expReward: 3000,  gemsFirstClear: 100, enemyCharacterIds: ['otamamon', 'betamon', 'gaomon'], randomEnemyCount: 1 },
      { index: 2, name: 'Rainha da Floresta', enemyCharacterId: 'greymon',  enemyLevel: 34, expReward: 4200,  gemsFirstClear: 150, enemyCharacterIds: ['greymon', 'garurumon'] },
      { index: 3, name: '⚔️ Boss — Garurumon', enemyCharacterId: 'garurumon', enemyLevel: 37, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.0, def: 1.3 }, enemyCharacterIds: ['garurumon'] },
    ],
  },
  // ── WORLD 5: Mina de Crômio ─────────────────────────────────────────────────
  {
    id: 'map_metal',
    name: 'Mina de Crômio',
    description: 'Túneis subterrâneos repletos de cristais de dados brilhantes. Rookies trabalham as entradas enquanto Champions dominam as profundezas.',
    backgroundImage: require('../assets/images/maps/map_plant_bg.jpg'),
    requiredMapCleared: 'map_plant',
    bitsReward: 1200,
    tamerExpReward: 70,
    stages: [
      { index: 0, name: 'Túnel de Entrada',  enemyCharacterId: 'candlemon',  enemyLevel: 36, expReward: 5000,  gemsFirstClear: 50,  enemyCharacterIds: ['candlemon', 'falcomon', 'hagurumon'], randomEnemyCount: 1 },
      { index: 1, name: 'Veio dos Cristais', enemyCharacterId: 'kamemon',    enemyLevel: 39, expReward: 6500,  gemsFirstClear: 100, enemyCharacterIds: ['kamemon', 'monodramon', 'penguinmon'], randomEnemyCount: 1 },
      { index: 2, name: 'Câmara de Crômio',  enemyCharacterId: 'pipismon',   enemyLevel: 42, expReward: 8500,  gemsFirstClear: 150, enemyCharacterIds: ['pipismon', 'candlemon'] },
      { index: 3, name: '⚔️ Boss — Guardromon', enemyCharacterId: 'guardromon', enemyLevel: 45, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.0, def: 1.3 }, enemyCharacterIds: ['guardromon'] },
    ],
  },
  // ── WORLD 6: Costa da Luz ───────────────────────────────────────────────────
  {
    id: 'map_angel',
    name: 'Costa da Luz',
    description: 'Uma praia tropical banhada pela luz divina do Mundo Digital. Rookies marcham pelas dunas enquanto Champions guardam o litoral sagrado.',
    backgroundImage: require('../assets/images/maps/map_angel_bg.jpg'),
    requiredMapCleared: 'map_metal',
    bitsReward: 1800,
    tamerExpReward: 90,
    stages: [
      { index: 0, name: 'Dunas Sagradas',     enemyCharacterId: 'salamon',  enemyLevel: 44, expReward: 9500,  gemsFirstClear: 50,  enemyCharacterIds: ['salamon', 'solarmon', 'toyagumon'], randomEnemyCount: 1 },
      { index: 1, name: 'Litoral Celestial',  enemyCharacterId: 'patamon',  enemyLevel: 47, expReward: 11500, gemsFirstClear: 100, enemyCharacterIds: ['patamon', 'tailmon', 'angemon'], randomEnemyCount: 1 },
      { index: 2, name: 'Santuário Costeiro', enemyCharacterId: 'piddomon', enemyLevel: 50, expReward: 14000, gemsFirstClear: 150, enemyCharacterIds: ['piddomon', 'angemon'] },
      { index: 3, name: '⚔️ Boss — Reppamon', enemyCharacterId: 'reppamon', enemyLevel: 53, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.0, def: 1.3 }, enemyCharacterIds: ['reppamon'] },
    ],
  },
  // ── WORLD 7: Deserto de Areia ───────────────────────────────────────────────
  {
    id: 'map_dark_abyss',
    name: 'Deserto de Areia',
    description: 'Uma arena natural esculpida pelos cânions digitais sob um céu alaranjado. Champions dominam este território implacável.',
    backgroundImage: require('../assets/images/maps/map_dark_abyss_bg.jpg'),
    requiredMapCleared: 'map_angel',
    bitsReward: 2500,
    tamerExpReward: 120,
    stages: [
      { index: 0, name: 'Cânion das Sombras', enemyCharacterId: 'guardromon', enemyLevel: 51, expReward: 15000, gemsFirstClear: 50,  enemyCharacterIds: ['guardromon', 'greymon', 'birdramon'] },
      { index: 1, name: 'Arena do Deserto',   enemyCharacterId: 'togemon',    enemyLevel: 54, expReward: 17000, gemsFirstClear: 100, enemyCharacterIds: ['togemon', 'woodmon', 'stingmon'] },
      { index: 2, name: 'Senhor das Areias',  enemyCharacterId: 'aquilamon',  enemyLevel: 57, expReward: 20000, gemsFirstClear: 150, enemyCharacterIds: ['aquilamon', 'guardromon'] },
      { index: 3, name: '⚔️ Boss — Ogremon', enemyCharacterId: 'ogremon', enemyLevel: 60, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.0, def: 1.3 }, enemyCharacterIds: ['ogremon'] },
    ],
  },
  // ── WORLD 8: Templo dos Dragões ─────────────────────────────────────────────
  {
    id: 'map_dragon',
    name: 'Templo dos Dragões',
    description: 'Um templo ancestral onde dados digitais caem como chuva. Champions de todas as linhas habitam estes corredores.',
    backgroundImage: require('../assets/images/maps/dungeon_gulus.png'),
    requiredMapCleared: 'map_dark_abyss',
    bitsReward: 3500,
    tamerExpReward: 150,
    stages: [
      { index: 0, name: 'Salão dos Guerreiros', enemyCharacterId: 'greymon',     enemyLevel: 58, expReward: 21000, gemsFirstClear: 50,  enemyCharacterIds: ['greymon', 'geoGreymon', 'airdramon'] },
      { index: 1, name: 'Câmara dos Campeões',  enemyCharacterId: 'tyranomon',   enemyLevel: 61, expReward: 23500, gemsFirstClear: 100, enemyCharacterIds: ['tyranomon', 'seadramon', 'allomon'] },
      { index: 2, name: 'Trono Dracônico',      enemyCharacterId: 'darktyranomon', enemyLevel: 64, expReward: 26000, gemsFirstClear: 150, enemyCharacterIds: ['darktyranomon', 'airdramon'] },
      { index: 3, name: '⚔️ Boss — DarkTyranomon', enemyCharacterId: 'darktyranomon', enemyLevel: 67, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.2, def: 1.3 }, enemyCharacterIds: ['darktyranomon'] },
    ],
  },
  // ── WORLD 9: Pradaria dos Tamers ────────────────────────────────────────────
  {
    id: 'map_final_domain',
    name: 'Pradaria dos Tamers',
    description: 'Uma vasta pradaria digital ensolarada. Champions variados se enfrentam nesta terra aberta antes dos Ultimates no horizonte.',
    backgroundImage: require('../assets/images/maps/map_final_domain_bg.jpg'),
    requiredMapCleared: 'map_dragon',
    bitsReward: 5000,
    tamerExpReward: 180,
    stages: [
      { index: 0, name: 'Campos da Glória',   enemyCharacterId: 'angemon',   enemyLevel: 65, expReward: 27000, gemsFirstClear: 50,  enemyCharacterIds: ['angemon', 'tailmon', 'devimon'] },
      { index: 1, name: 'Centro da Pradaria', enemyCharacterId: 'garurumon', enemyLevel: 68, expReward: 29500, gemsFirstClear: 100, enemyCharacterIds: ['garurumon', 'geoGreymon', 'birdramon'] },
      { index: 2, name: 'Altar dos Tamers',   enemyCharacterId: 'geoGreymon',enemyLevel: 71, expReward: 32000, gemsFirstClear: 150, enemyCharacterIds: ['geoGreymon', 'togemon', 'angemon'] },
      { index: 3, name: '⚔️ Boss — MetalGreymon', enemyCharacterId: 'metalGreymon', enemyLevel: 74, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.2, def: 1.4 }, enemyCharacterIds: ['metalGreymon'] },
    ],
  },
  // ── WORLD 10: Templo das Sombras ────────────────────────────────────────────
  {
    id: 'map_ruins',
    name: 'Templo das Sombras',
    description: 'Corredores roxos de um templo amaldiçoado. Os últimos Champions resistem aqui, mas forças Ultimates ameaçam consumir este lugar.',
    backgroundImage: require('../assets/images/maps/map_ruins.png'),
    requiredMapCleared: 'map_final_domain',
    bitsReward: 7000,
    tamerExpReward: 210,
    stages: [
      { index: 0, name: 'Entrada Maldita', enemyCharacterId: 'devimon',      enemyLevel: 72, expReward: 33000, gemsFirstClear: 50,  enemyCharacterIds: ['devimon', 'blacktailmon', 'ogremon'] },
      { index: 1, name: 'Salão dos Olhos', enemyCharacterId: 'darklizardmon',enemyLevel: 75, expReward: 35500, gemsFirstClear: 100, enemyCharacterIds: ['darklizardmon', 'devidramon', 'devimon'] },
      { index: 2, name: 'Sanctum Sombrio', enemyCharacterId: 'blacktailmon', enemyLevel: 78, expReward: 38000, gemsFirstClear: 150, enemyCharacterIds: ['blacktailmon', 'devidramon', 'ogremon'] },
      { index: 3, name: '⚔️ Boss — SkullGreymon', enemyCharacterId: 'skullgreymon', enemyLevel: 81, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.2, def: 1.4 }, enemyCharacterIds: ['skullgreymon'] },
    ],
  },
  // ── WORLD 11: Castelo Esquecido ─────────────────────────────────────────────
  {
    id: 'map_ocean',
    name: 'Castelo Esquecido',
    description: 'Uma fortaleza em ruínas onde os primeiros Ultimates surgem. Champions ainda guardam as portas, mas Ultimates dominam o interior.',
    backgroundImage: require('../assets/images/maps/map_ocean.png'),
    requiredMapCleared: 'map_ruins',
    bitsReward: 9000,
    tamerExpReward: 240,
    stages: [
      { index: 0, name: 'Portão em Ruínas', enemyCharacterId: 'tailmon',      enemyLevel: 76, expReward: 38500, gemsFirstClear: 50,  enemyCharacterIds: ['tailmon', 'geoGreymon'] },
      { index: 1, name: 'Torre Caída',      enemyCharacterId: 'metalGreymon', enemyLevel: 79, expReward: 40500, gemsFirstClear: 100, enemyCharacterIds: ['metalGreymon', 'wereGarurumon'] },
      { index: 2, name: 'Trono Abandonado', enemyCharacterId: 'myotismon',    enemyLevel: 82, expReward: 42500, gemsFirstClear: 150, enemyCharacterIds: ['myotismon', 'metalGreymon'] },
      { index: 3, name: '⚔️ Boss — Angewomon', enemyCharacterId: 'angewomon', enemyLevel: 85, expReward: 0, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['angewomon'] },
    ],
  },
  // ── WORLD 12: Vale dos Fósseis ───────────────────────────────────────────────
  {
    id: 'map_volcano',
    name: 'Vale dos Fósseis',
    description: 'Um vale árido repleto de ossadas gigantescas. Ultimates dominam completamente este território ressecado.',
    backgroundImage: require('../assets/images/maps/map_volcano.png'),
    requiredMapCleared: 'map_ocean',
    bitsReward: 11000,
    tamerExpReward: 265,
    stages: [
      { index: 0, name: 'Cânion dos Ossos',   enemyCharacterId: 'angewomon',    enemyLevel: 80, expReward: 43000, gemsFirstClear: 50,  enemyCharacterIds: ['angewomon', 'wereGarurumon'] },
      { index: 1, name: 'Gruta dos Fósseis',  enemyCharacterId: 'metalGreymon', enemyLevel: 83, expReward: 44500, gemsFirstClear: 100, enemyCharacterIds: ['metalGreymon', 'myotismon'] },
      { index: 2, name: 'Guardião Ancestral', enemyCharacterId: 'garudamon',    enemyLevel: 86, expReward: 46000, gemsFirstClear: 150, enemyCharacterIds: ['garudamon', 'angewomon'] },
      { index: 3, name: '⚔️ Boss — MagnaAngemon', enemyCharacterId: 'magnaAngemon', enemyLevel: 89, expReward: 0, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['magnaAngemon'] },
    ],
  },
  // ── WORLD 13: Base Secreta ───────────────────────────────────────────────────
  {
    id: 'map_lab',
    name: 'Base Secreta',
    description: 'Uma instalação industrial abandonada. Ultimates corruptos foram reativados para defender cada setor desta base sombria.',
    backgroundImage: require('../assets/images/maps/map_lab.png'),
    requiredMapCleared: 'map_volcano',
    bitsReward: 14000,
    tamerExpReward: 290,
    stages: [
      { index: 0, name: 'Setor de Armazenamento', enemyCharacterId: 'magnaAngemon', enemyLevel: 83, expReward: 46000, gemsFirstClear: 50,  enemyCharacterIds: ['magnaAngemon', 'garudamon'] },
      { index: 1, name: 'Câmara de Controle',     enemyCharacterId: 'wereGarurumon',enemyLevel: 86, expReward: 47500, gemsFirstClear: 100, enemyCharacterIds: ['wereGarurumon', 'myotismon'] },
      { index: 2, name: 'Núcleo da Base',         enemyCharacterId: 'rizeGreymon',  enemyLevel: 89, expReward: 49000, gemsFirstClear: 150, enemyCharacterIds: ['rizeGreymon', 'magnaAngemon'] },
      { index: 3, name: '⚔️ Boss — Myotismon', enemyCharacterId: 'myotismon', enemyLevel: 92, expReward: 0, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['myotismon'] },
    ],
  },
  // ── WORLD 14: Monte Infernus ─────────────────────────────────────────────────
  {
    id: 'map_quarantine',
    name: 'Monte Infernus',
    description: 'Um campo de vulcões ativos sob um céu carmesim. Ultimates de luz, sombra e natureza dominam estas terras de fogo digital.',
    backgroundImage: require('../assets/images/maps/map_quarantine.png'),
    requiredMapCleared: 'map_lab',
    bitsReward: 17000,
    tamerExpReward: 315,
    stages: [
      { index: 0, name: 'Planícies de Lava',  enemyCharacterId: 'myotismon',   enemyLevel: 86, expReward: 48000, gemsFirstClear: 50,  enemyCharacterIds: ['myotismon', 'wereGarurumon'] },
      { index: 1, name: 'Fendas Vulcânicas',  enemyCharacterId: 'garudamon',   enemyLevel: 89, expReward: 49500, gemsFirstClear: 100, enemyCharacterIds: ['garudamon', 'angewomon'] },
      { index: 2, name: 'Cume do Infernus',   enemyCharacterId: 'lillymon',    enemyLevel: 92, expReward: 50500, gemsFirstClear: 150, enemyCharacterIds: ['lillymon', 'rizeGreymon'] },
      { index: 3, name: '⚔️ Boss — Rosemon', enemyCharacterId: 'rosemon', enemyLevel: 95, expReward: 0, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['rosemon'] },
    ],
  },
  // ── WORLD 15: Pântano Digital ────────────────────────────────────────────────
  {
    id: 'map_battlefield',
    name: 'Pântano Digital',
    description: 'Terras alagadas cobertas por plantas digitais. Os Ultimates mais poderosos habitam estas profundezas, o último reduto antes das Megas.',
    backgroundImage: require('../assets/images/maps/map_battlefield.png'),
    requiredMapCleared: 'map_quarantine',
    bitsReward: 20000,
    tamerExpReward: 340,
    stages: [
      { index: 0, name: 'Margem do Pântano',   enemyCharacterId: 'rizeGreymon',  enemyLevel: 89, expReward: 49000, gemsFirstClear: 50,  enemyCharacterIds: ['rizeGreymon', 'garudamon'] },
      { index: 1, name: 'Profundeza do Brejo', enemyCharacterId: 'lillymon',     enemyLevel: 92, expReward: 50000, gemsFirstClear: 100, enemyCharacterIds: ['lillymon', 'magnaAngemon'] },
      { index: 2, name: 'Raiz das Trevas',     enemyCharacterId: 'vnonMyotismon',enemyLevel: 95, expReward: 51000, gemsFirstClear: 150, enemyCharacterIds: ['vnonMyotismon', 'rosemon'] },
      { index: 3, name: '⚔️ Boss — WarGreymon', enemyCharacterId: 'warGreymon', enemyLevel: 98, expReward: 0, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['warGreymon'] },
    ],
  },
  // ── WORLD 16: Desfiladeiro dos Ventos ───────────────────────────────────────
  {
    id: 'map_fog',
    name: 'Desfiladeiro dos Ventos',
    description: 'Um corredor de rocha dourada esculpido pelos ventos digitais. As primeiras Megas dominam cada passagem deste desfiladeiro lendário.',
    backgroundImage: require('../assets/images/maps/map_fog.png'),
    requiredMapCleared: 'map_battlefield',
    bitsReward: 24000,
    tamerExpReward: 370,
    stages: [
      { index: 0, name: 'Entrada do Desfiladeiro', enemyCharacterId: 'warGreymon',    enemyLevel: 91, expReward: 50000, gemsFirstClear: 50,  enemyCharacterIds: ['warGreymon', 'metalGarurumon'] },
      { index: 1, name: 'Passagem dos Ventos',     enemyCharacterId: 'seraphimon',    enemyLevel: 94, expReward: 50000, gemsFirstClear: 100, enemyCharacterIds: ['seraphimon', 'warGreymon'] },
      { index: 2, name: 'Saída dos Guerreiros',    enemyCharacterId: 'metalGarurumon',enemyLevel: 97, expReward: 51000, gemsFirstClear: 150, enemyCharacterIds: ['metalGarurumon', 'goldramon'] },
      { index: 3, name: '⚔️ Boss — Ophanimon', enemyCharacterId: 'ophanimon', enemyLevel: 99, expReward: 0, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['ophanimon'] },
    ],
  },
  // ── WORLD 17: Clareira Sagrada ───────────────────────────────────────────────
  {
    id: 'map_core',
    name: 'Clareira Sagrada',
    description: 'Uma clareira iluminada pelo sol digital onde Digimons Celestiais Mega guardam este lugar sagrado em silêncio eterno.',
    backgroundImage: require('../assets/images/maps/map_core.png'),
    requiredMapCleared: 'map_fog',
    bitsReward: 28000,
    tamerExpReward: 405,
    stages: [
      { index: 0, name: 'Caminho Iluminado', enemyCharacterId: 'ophanimon',  enemyLevel: 92, expReward: 50000, gemsFirstClear: 50,  enemyCharacterIds: ['ophanimon', 'seraphimon'] },
      { index: 1, name: 'Altar da Floresta', enemyCharacterId: 'goldramon',  enemyLevel: 95, expReward: 51000, gemsFirstClear: 100, enemyCharacterIds: ['goldramon', 'magnadramon'] },
      { index: 2, name: 'Centro da Clareira',enemyCharacterId: 'phoenixmon', enemyLevel: 98, expReward: 52000, gemsFirstClear: 150, enemyCharacterIds: ['phoenixmon', 'goldramon'] },
      { index: 3, name: '⚔️ Boss — ShineGreymon', enemyCharacterId: 'shineGreymon', enemyLevel: 100, expReward: 0, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 3.0, def: 1.5 }, enemyCharacterIds: ['shineGreymon'] },
    ],
  },
  // ── WORLD 18: Zona Kernel ────────────────────────────────────────────────────
  {
    id: 'map_void',
    name: 'Zona Kernel',
    description: 'Plataformas flutuantes de dados suspensas num espaço digital infinito. O núcleo do Mundo Digital pulsa com energia primordial de Megas.',
    backgroundImage: require('../assets/images/maps/map_void.png'),
    requiredMapCleared: 'map_core',
    bitsReward: 33000,
    tamerExpReward: 440,
    stages: [
      { index: 0, name: 'Plataformas Flutuantes', enemyCharacterId: 'shineGreymon', enemyLevel: 93, expReward: 51000, gemsFirstClear: 50,  enemyCharacterIds: ['shineGreymon', 'warGreymon'] },
      { index: 1, name: 'Corredor de Dados',      enemyCharacterId: 'magnadramon',  enemyLevel: 96, expReward: 52000, gemsFirstClear: 100, enemyCharacterIds: ['magnadramon', 'rosemon'] },
      { index: 2, name: 'Coração do Kernel',      enemyCharacterId: 'rosemon',      enemyLevel: 99, expReward: 53000, gemsFirstClear: 150, enemyCharacterIds: ['rosemon', 'phoenixmon', 'magnadramon'] },
      { index: 3, name: '⚔️ Boss — Sinduramon', enemyCharacterId: 'sinduramon', enemyLevel: 100, expReward: 0, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 3.0, def: 1.5 }, enemyCharacterIds: ['sinduramon'] },
    ],
  },
  // ── WORLD 19: Setor Omega ────────────────────────────────────────────────────
  {
    id: 'map_apocalypse',
    name: 'Setor Omega',
    description: 'Uma instalação urbana de aço e concreto digital. Entidades de dados corrompidos patrulham cada corredor desta fortaleza sombria.',
    backgroundImage: require('../assets/images/maps/map_apocalypse.png'),
    requiredMapCleared: 'map_void',
    bitsReward: 40000,
    tamerExpReward: 490,
    stages: [
      { index: 0, name: 'Setor Industrial',   enemyCharacterId: 'sinduramon',     enemyLevel: 94, expReward: 51000, gemsFirstClear: 50,  enemyCharacterIds: ['sinduramon', 'shineGreymon'] },
      { index: 1, name: 'Núcleo de Controle', enemyCharacterId: 'gulusGammamon',  enemyLevel: 97, expReward: 52000, gemsFirstClear: 100, enemyCharacterIds: ['gulusGammamon', 'sinduramon'] },
      { index: 2, name: 'Câmara Omega',       enemyCharacterId: 'valdurmon',      enemyLevel: 100, expReward: 53000, gemsFirstClear: 150, enemyCharacterIds: ['valdurmon', 'gulusGammamon'] },
      { index: 3, name: '⚔️ Boss — GulusGammamon', enemyCharacterId: 'gulusGammamon', enemyLevel: 100, expReward: 0, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 3.0, def: 2.0 }, enemyCharacterIds: ['gulusGammamon'] },
    ],
  },
  // ── WORLD 20: Corredor Final ─────────────────────────────────────────────────
  {
    id: 'map_omega',
    name: 'Corredor Final',
    description: 'Um corredor interminável de aço e luz — a última fronteira antes do fim. Apenas as formas mais poderosas sobrevivem aqui.',
    backgroundImage: require('../assets/images/maps/map_omega.png'),
    requiredMapCleared: 'map_apocalypse',
    bitsReward: 45000,
    tamerExpReward: 545,
    stages: [
      { index: 0, name: 'Corredor de Aço',    enemyCharacterId: 'valdurmon',         enemyLevel: 95,  expReward: 52000, gemsFirstClear: 50,  enemyCharacterIds: ['valdurmon', 'sinduramon'] },
      { index: 1, name: 'Sala de Julgamento', enemyCharacterId: 'shineGreymonBurstMode', enemyLevel: 98, expReward: 53000, gemsFirstClear: 100, enemyCharacterIds: ['shineGreymonBurstMode', 'warGreymon'] },
      { index: 2, name: 'Portal do Fim',      enemyCharacterId: 'rosemonBurstMode',  enemyLevel: 100, expReward: 54000, gemsFirstClear: 150, enemyCharacterIds: ['rosemonBurstMode', 'shineGreymonBurstMode', 'valdurmon'] },
      { index: 3, name: '⚔️ Boss — RosemonBurstMode', enemyCharacterId: 'rosemonBurstMode', enemyLevel: 100, expReward: 0, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 3.5, def: 2.0 }, enemyCharacterIds: ['rosemonBurstMode'] },
    ],
  },
  // ── WORLD 21: Arena dos Dados ───────────────────────────────────────────────
  {
    id: 'map_pixel_arena',
    name: 'Arena dos Dados',
    description: 'Uma arena pixel art flutuante no coração do Mundo Digital. Os guerreiros mais poderosos se enfrentam aqui na batalha final.',
    backgroundImage: require('../assets/images/maps/dungeon_gulus_bg.jpg'),
    requiredMapCleared: 'map_omega',
    bitsReward: 50000,
    tamerExpReward: 600,
    stages: [
      { index: 0, name: 'Pista de Entrada', enemyCharacterId: 'shineGreymonBurstMode', enemyLevel: 96,  expReward: 52000, gemsFirstClear: 50,  enemyCharacterIds: ['shineGreymonBurstMode', 'rosemonBurstMode'] },
      { index: 1, name: 'Centro da Arena',  enemyCharacterId: 'valdurmon',             enemyLevel: 99,  expReward: 54000, gemsFirstClear: 100, enemyCharacterIds: ['valdurmon', 'gulusGammamon', 'sinduramon'] },
      { index: 2, name: 'Final do Torneio', enemyCharacterId: 'rosemonBurstMode',      enemyLevel: 100, expReward: 55000, gemsFirstClear: 200, enemyCharacterIds: ['rosemonBurstMode', 'shineGreymonBurstMode', 'metalGarurumon', 'warGreymon'] },
      { index: 3, name: '⚔️ Boss — Omegamon', enemyCharacterId: 'omegamon', enemyLevel: 100, expReward: 0, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 4.0, def: 2.5 }, enemyCharacterIds: ['omegamon'] },
    ],
  },
  // ── DUNGEONS (ao final) ──────────────────────────────────────────────────────
  {
    id: 'dungeon_daily_xp',
    name: 'Treinamento Diário',
    description: 'Enfrente Lucemon Chaos Mode para ganhar EXP massiva. Reseta todo dia à meia-noite. Apenas 1x por dia.',
    isDungeon: true,
    isDaily: true,
    requiredTamerLevel: 10,
    backgroundImage: require('../assets/images/maps/dungeon_gulus_bg.jpg'),
    bitsReward: 500,
    stages: [
      {
        index: 0,
        name: 'Boss — Lucemon Chaos Mode',
        enemyCharacterId: 'lucemonChaosMode',
        enemyLevel: 10,
        expReward: 3600,
        bossMultipliers: { hp: 1.5, def: 1.2 },
        drops: [
          { type: 'bits', amount: 500, chance: 1.00 },
        ],
      },
    ],
  },
  {
    id: 'dungeon_gulus',
    name: 'Covil do Gulus',
    description: 'Uma masmorra digital sombria onde GulusGammamon reina. Derrote-o para obter Bits e Fragmentos de Brasão.',
    isDungeon: true,
    requiredTamerLevel: 15,
    backgroundImage: require('../assets/images/maps/dungeon_gulus.png'),
    stages: [
      {
        index: 0,
        name: 'Boss — GulusGammamon',
        enemyCharacterId: 'gulusGammamon',
        enemyLevel: 25,
        expReward: 0,
        bossMultipliers: { hp: 2, def: 4 / 3 },
        firstClearReward: 'digivice_d2',
        drops: [
          { type: 'bits',  amount: 1000,  chance: 1.00 },
          { type: 'piece', id: 'piece_brasao_coragem',      amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_esperanca',    amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_amizade',      amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_confianca',    amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_pureza',       amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_conhecimento', amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_luz',          amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_amor',         amount: 1, chance: 0.10 },
        ],
      },
    ],
  },
];

export const RARITY_COLORS: Record<RarityId, string> = {
  EGG:       '#fde68a',
  BABY:      '#fbcfe8',
  TRAINING:  '#6ee7b7',
  COMMON:    '#94a3b8',
  RARE:      '#3b82f6',
  EPIC:      '#8b5cf6',
  LEGENDARY: '#f59e0b',
  ULTRA:     '#ff3c6e',
  BURST:     '#ff3c6e',
};

export const RARITY_LABELS: Record<RarityId, string> = {
  EGG:       'Ovo',
  BABY:      'Bebê',
  TRAINING:  'Treinamento',
  COMMON:    'Rookie',
  RARE:      'Champion',
  EPIC:      'Ultimate',
  LEGENDARY: 'Mega',
  ULTRA:     'Ultra',
  BURST:     'Burst',
};

export const PRE_ROOKIE_STAGE_RARITIES = new Set<RarityId>(['EGG', 'BABY', 'TRAINING']);

// ─── Tamer Equipment ──────────────────────────────────────────────────────────
export type EquipSlot = 'blusa' | 'calca' | 'sapato' | 'brasao' | 'digivice' | 'pulseira' | 'oculos';
export type TamerGender = 'M' | 'F' | 'N';

export interface ElementBonus {
  elements: ElementId[];
  percent: number;
}

export interface EquipItem {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: RarityId;
  description: string;
  bonuses: Partial<BaseStats>;
  percentBonuses?: Partial<BaseStats>;
  xpBonusPercent?: number;
  xpSharePercent?: number;
  tamerXpBonusPercent?: number;
  elementBonus?: ElementBonus;
}

export const EQUIP_SLOT_LABELS: Record<EquipSlot, string> = {
  blusa:    'Blusa',
  calca:    'Calça',
  sapato:   'Sapato',
  brasao:   'Brasão',
  digivice: 'Digivice',
  pulseira: 'Pulseira',
  oculos:   'Óculos',
};

export const EQUIP_SLOT_ICONS: Record<EquipSlot, string> = {
  blusa:    'wind',
  calca:    'align-justify',
  sapato:   'chevrons-down',
  brasao:   'shield',
  digivice: 'cpu',
  pulseira: 'link',
  oculos:   'eye',
};

export const EQUIPMENT_ITEMS: EquipItem[] = [
  { id: 'blusa_tamer',    name: 'Camiseta de Tamer',  slot: 'blusa',    rarity: 'COMMON',    description: 'Camiseta padrão dos Tamers. Aumenta o ataque do parceiro.',          bonuses: { atk: 5 } },
  { id: 'calca_treino',   name: 'Calça de Treino',    slot: 'calca',    rarity: 'COMMON',    description: 'Calça confortável para treinamento. Aumenta a defesa.',              bonuses: { def: 5 } },
  { id: 'sapato_tenis',   name: 'Tênis de Corrida',   slot: 'sapato',   rarity: 'COMMON',    description: 'Leve e rápido. Aumenta a velocidade do parceiro.',                  bonuses: { spd: 6 } },
  { id: 'brasao_digital',  name: 'Brasão Digital',      slot: 'brasao',   rarity: 'COMMON',    description: 'Símbolo de um Tamer legítimo. Aumenta o HP do parceiro.',                           bonuses: { hp: 15 } },
  { id: 'brasao_coragem',   name: 'Brasão da Coragem',   slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Coragem de Tai. Aumenta em 20% todos os status de Digimon do tipo Fogo.',                          bonuses: {}, elementBonus: { elements: ['FIRE'],          percent: 0.20 } },
  { id: 'brasao_esperanca', name: 'Brasão da Esperança', slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Esperança de TK. Aumenta em 20% todos os status de Digimon do tipo Luz.',                           bonuses: {}, elementBonus: { elements: ['LIGHT'],         percent: 0.20 } },
  { id: 'brasao_amizade',   name: 'Brasão da Amizade',   slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Amizade de Matt. Aumenta em 20% todos os status de Digimon do tipo Água e Gelo.', bonuses: {}, elementBonus: { elements: ['WATER', 'ICE'], percent: 0.20 } },
  { id: 'brasao_confianca', name: 'Brasão da Confiança', slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Confiança. Aumenta em 20% todos os status de Digimon do tipo Água e Metal.', bonuses: {}, elementBonus: { elements: ['WATER', 'METAL'], percent: 0.20 } },
  { id: 'brasao_pureza',    name: 'Brasão da Pureza',    slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Pureza. Aumenta em 20% todos os status de Digimon do tipo Planta.',          bonuses: {}, elementBonus: { elements: ['PLANT'],          percent: 0.20 } },
  { id: 'brasao_amor',      name: 'Brasão do Amor',      slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão do Amor. Aumenta em 15% todos os status de Digimon do tipo Fogo e Vento.',     bonuses: {}, elementBonus: { elements: ['FIRE', 'WIND'],   percent: 0.15 } },
  { id: 'brasao_luz',           name: 'Brasão da Luz',           slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Luz. Aumenta em 15% todos os status de Digimon do tipo Luz e Trevas.',           bonuses: {}, elementBonus: { elements: ['LIGHT', 'DARK'],        percent: 0.15 } },
  { id: 'brasao_conhecimento',  name: 'Brasão do Conhecimento',  slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão do Conhecimento. Aumenta em 15% todos os status de Digimon do tipo Trovão e Planta.', bonuses: {}, elementBonus: { elements: ['LIGHTNING', 'PLANT'], percent: 0.15 } },
  { id: 'digivice_d2',    name: 'Digivice D-2',       slot: 'digivice', rarity: 'EPIC',      description: 'Recompensa por derrotar GulusGammamon. +20% XP para o Digimon em batalha, +25% XP para a reserva e +20% XP Tamer.', bonuses: {}, xpBonusPercent: 0.20, xpSharePercent: 0.25, tamerXpBonusPercent: 0.20 },
  { id: 'digivice_d3',    name: 'Digivice Quebrado',  slot: 'digivice', rarity: 'COMMON',    description: 'Digivice danificado, mas ainda funcional. Potencializa levemente o espírito do parceiro.',             bonuses: { spt: 6 } },
  { id: 'pulseira_forca', name: 'Pulseira de Força',  slot: 'pulseira', rarity: 'COMMON',    description: 'Amplifica a força bruta do Digimon parceiro.',                      bonuses: { atk: 7 } },
  { id: 'pulseira_ouro',  name: 'Pulseira Dourada',   slot: 'pulseira', rarity: 'RARE',      description: 'Pulseira lendária que amplifica múltiplos atributos de batalha.',   bonuses: { atk: 10, spt: 8 } },
  { id: 'oculos_escuro_fitado', name: 'Óculos Escuro Fitado', slot: 'oculos', rarity: 'RARE', description: 'Recompensa do Trono do Caos. Aumenta em 1% a DEF do Digimon e +10% ao XP Tamer.', bonuses: {}, percentBonuses: { def: 0.01 }, tamerXpBonusPercent: 0.10 },
  { id: 'oculos_scanner', name: 'Óculos de Scanner',  slot: 'oculos',   rarity: 'COMMON',    description: 'Analisa inimigos em tempo real. Aumenta o MP do parceiro.',         bonuses: { mp: 8 } },
  // ── Artesanal (crafted from sewing materials) ─────────────────────────────
  // ── Costura Premium (multi-material crafts) ───────────────────────────────
  { id: 'blusa_social',      name: 'Blusa Social',       slot: 'blusa',  rarity: 'RARE', description: 'Blusa social costurada com materiais premium. Aumenta em 2% o ATK e HP do Digimon.', bonuses: {}, percentBonuses: { atk: 0.02, hp: 0.02 } },
  { id: 'bermuda_poliester', name: 'Bermuda de Poliéster', slot: 'calca', rarity: 'RARE', description: 'Bermuda leve de poliéster digital. Aumenta em 3% a DEF do Digimon.', bonuses: {}, percentBonuses: { def: 0.03 } },
  { id: 'tenis_corrida',     name: 'Tênis de Corrida',   slot: 'sapato', rarity: 'RARE', description: 'Tênis aerodinâmico de corrida. Aumenta em 3% a SPD do Digimon.',                    bonuses: {}, percentBonuses: { spd: 0.03 } },
];

export const EQUIP_SLOTS_ORDER: EquipSlot[] = ['blusa', 'calca', 'sapato', 'brasao', 'digivice', 'pulseira', 'oculos'];

export const DEFAULT_INVENTORY: string[] = [];

// ─── Crafting / Pieces ─────────────────────────────────────────────────────────
export interface PieceRequirement {
  pieceId: string;
  count: number;
  pieceName: string;
  pieceIcon: string;
  pieceColor: string;
}

export interface CraftRecipe {
  pieceId: string;
  pieceName: string;
  pieceDescription: string;
  pieceIcon: string;
  pieceColor: string;
  requiredCount: number;
  pieceRequirements?: PieceRequirement[];
  bitsCost?: number;
  resultItemId: string;
  resultItemName: string;
  resultRarity: RarityId;
}

// ─── Tamers ───────────────────────────────────────────────────────────────────
export interface TamerOption {
  id: string;
  name: string;
  fullName: string;
  description: string;
  accentColor: string;
  image: number;
  forGender: 'M' | 'F' | 'N';
  avatarOffset: number;  // vertical px: negative = clip from top, positive = show from very top
  avatarOffsetX: number; // horizontal px: negative = shift left, positive = shift right (0 = centered)
}

export const TAMERS: TamerOption[] = [
  // Female tamers
  {
    id: 'tamer_mimi',
    name: 'Mimi',
    fullName: 'Mimi Tachikawa',
    description: 'Gentil e determinada, sua amizade com seus Digimon é inabalável.',
    accentColor: '#22c55e',
    image: require('../assets/tamers/mimi_bg.png'),
    forGender: 'F',
    avatarOffset: -8,
    avatarOffsetX: 0,
  },
  {
    id: 'tamer_sora',
    name: 'Sora',
    fullName: 'Sora Takenouchi',
    description: 'Corajosa e protetora, cuida dos seus companheiros em qualquer batalha.',
    accentColor: '#ef4444',
    image: require('../assets/tamers/sora_bg.png'),
    forGender: 'F',
    avatarOffset: -8,
    avatarOffsetX: 0,
  },
  {
    id: 'tamer_kari',
    name: 'Kari',
    fullName: 'Hikari Kamiya',
    description: 'Bondosa e iluminada, sua luz guia os Digimon pelo mundo digital.',
    accentColor: '#ec4899',
    image: require('../assets/tamers/kari_bg.png'),
    forGender: 'F',
    avatarOffset: -8,
    avatarOffsetX: -2,
  },
  // Male tamers
  {
    id: 'tamer_matt',
    name: 'Matt',
    fullName: 'Yamato Ishida',
    description: 'Frio e determinado, lidera com amizade e força inabalável.',
    accentColor: '#3b82f6',
    image: require('../assets/tamers/matt.png'),
    forGender: 'M',
    avatarOffset: -8,
    avatarOffsetX: 0,
  },
  {
    id: 'tamer_tai',
    name: 'Tai',
    fullName: 'Taichi Kamiya',
    description: 'Destemido e impulsivo, enfrenta qualquer desafio de cabeça.',
    accentColor: '#f97316',
    image: require('../assets/tamers/tai_bg.png'),
    forGender: 'M',
    avatarOffset: -8,
    avatarOffsetX: 0,
  },
  {
    id: 'tamer_tk',
    name: 'TK',
    fullName: 'Takeru Takaishi',
    description: 'Esperançoso e resiliente, sua esperança nunca se apaga nas trevas.',
    accentColor: '#eab308',
    image: require('../assets/tamers/tk.png'),
    forGender: 'M',
    avatarOffset: -23,
    avatarOffsetX: 0,
  },
];

export const CRAFT_RECIPES: CraftRecipe[] = [
  // ── Anel Sagrado: sacrifice drops ─────────────────────────────────────────
  {
    pieceId: 'piece_anel_sagrado',
    pieceName: 'Fragmento do Anel Sagrado',
    pieceDescription: 'Obtido sacrificando Angemon, Tailmon, MagnaAngemon, Angewomon ou Lucemon Chaos Mode. Junte 10 para forjar o Anel Sagrado.',
    pieceIcon: 'circle',
    pieceColor: '#fde68a',
    requiredCount: 10,
    bitsCost: 0,
    resultItemId: 'anel_sagrado',
    resultItemName: 'Anel Sagrado ✨',
    resultRarity: 'EPIC',
  },
  // ── Gehenna: Dark Lords sacrifice ─────────────────────────────────────────
  {
    pieceId: 'piece_gehenna',
    pieceName: 'Fragmento do Gehenna',
    pieceDescription: 'Obtido sacrificando um dos 7 Lordes das Trevas (Lilithmon, Barbamon, Beelzemon, Leviamon, Belphemon ou Demon). Junte 6 para forjar o Gehenna.',
    pieceIcon: 'zap',
    pieceColor: '#6d28d9',
    requiredCount: 6,
    bitsCost: 0,
    resultItemId: 'gehenna',
    resultItemName: 'Gehenna 🌑',
    resultRarity: 'LEGENDARY',
  },
  // ── Chip Forest drops: piece_coragem ──────────────────────────────────────
  // ── Dungeon Gulus drop: piece_brasao_coragem ─────────────────────────────
  {
    pieceId: 'piece_brasao_coragem',
    pieceName: 'Fragmento do Brasão',
    pieceDescription: 'Drop raro da masmorra do GulusGammamon. Necessário para forjar o lendário Brasão da Coragem.',
    pieceIcon: 'sun',
    pieceColor: '#f97316',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_coragem',
    resultItemName: 'Brasão da Coragem',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_esperanca',
    pieceName: 'Fragmento da Esperança',
    pieceDescription: 'Drop raro da masmorra do GulusGammamon. Necessário para forjar o lendário Brasão da Esperança.',
    pieceIcon: 'sun',
    pieceColor: '#eab308',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_esperanca',
    resultItemName: 'Brasão da Esperança',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_amizade',
    pieceName: 'Fragmento da Amizade',
    pieceDescription: 'Drop raro da masmorra do GulusGammamon. Necessário para forjar o lendário Brasão da Amizade.',
    pieceIcon: 'users',
    pieceColor: '#3b82f6',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_amizade',
    resultItemName: 'Brasão da Amizade',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_confianca',
    pieceName: 'Fragmento da Confiança',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão da Confiança.',
    pieceIcon: 'shield',
    pieceColor: '#94a3b8',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_confianca',
    resultItemName: 'Brasão da Confiança',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_pureza',
    pieceName: 'Fragmento da Pureza',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão da Pureza.',
    pieceIcon: 'droplet',
    pieceColor: '#22c55e',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_pureza',
    resultItemName: 'Brasão da Pureza',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_conhecimento',
    pieceName: 'Fragmento do Conhecimento',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão do Conhecimento.',
    pieceIcon: 'book',
    pieceColor: '#a855f7',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_conhecimento',
    resultItemName: 'Brasão do Conhecimento',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_luz',
    pieceName: 'Fragmento da Luz',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão da Luz.',
    pieceIcon: 'star',
    pieceColor: '#c084fc',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_luz',
    resultItemName: 'Brasão da Luz',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_amor',
    pieceName: 'Fragmento do Amor',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão do Amor.',
    pieceIcon: 'heart',
    pieceColor: '#f43f5e',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_amor',
    resultItemName: 'Brasão do Amor',
    resultRarity: 'LEGENDARY',
  },
  // ── Acess Glacier drops: piece_gelo ──────────────────────────────────────
  // ── Costura Premium: multi-material recipes ──────────────────────────────
  {
    pieceId: 'piece_tecido',
    pieceName: 'Tecido Colorido',
    pieceDescription: 'Receita premium de múltiplos materiais. Forja a Blusa Social com bônus percentuais.',
    pieceIcon: 'layers',
    pieceColor: '#ec4899',
    requiredCount: 20,
    pieceRequirements: [
      { pieceId: 'piece_tecido', count: 20, pieceName: 'Tecido Colorido', pieceIcon: 'layers', pieceColor: '#ec4899' },
      { pieceId: 'piece_linha',  count: 30, pieceName: 'Linha Colorida',  pieceIcon: 'wind',   pieceColor: '#06b6d4' },
      { pieceId: 'piece_agulha', count: 20, pieceName: 'Agulha Média',    pieceIcon: 'edit-2', pieceColor: '#8b5cf6' },
    ],
    bitsCost: 10000,
    resultItemId: 'blusa_social',
    resultItemName: 'Blusa Social',
    resultRarity: 'RARE',
  },
  {
    pieceId: 'piece_tecido',
    pieceName: 'Tecido Colorido',
    pieceDescription: 'Receita premium de múltiplos materiais. Forja a Bermuda de Poliéster com bônus percentuais.',
    pieceIcon: 'layers',
    pieceColor: '#ec4899',
    requiredCount: 20,
    pieceRequirements: [
      { pieceId: 'piece_tecido', count: 20, pieceName: 'Tecido Colorido', pieceIcon: 'layers', pieceColor: '#ec4899' },
      { pieceId: 'piece_linha',  count: 30, pieceName: 'Linha Colorida',  pieceIcon: 'wind',   pieceColor: '#06b6d4' },
      { pieceId: 'piece_agulha', count: 20, pieceName: 'Agulha Média',    pieceIcon: 'edit-2', pieceColor: '#8b5cf6' },
    ],
    bitsCost: 10000,
    resultItemId: 'bermuda_poliester',
    resultItemName: 'Bermuda de Poliéster',
    resultRarity: 'RARE',
  },
  {
    pieceId: 'piece_tecido',
    pieceName: 'Tecido Colorido',
    pieceDescription: 'Receita premium de múltiplos materiais. Forja o Tênis de Corrida com bônus percentuais.',
    pieceIcon: 'layers',
    pieceColor: '#ec4899',
    requiredCount: 20,
    pieceRequirements: [
      { pieceId: 'piece_tecido', count: 20, pieceName: 'Tecido Colorido', pieceIcon: 'layers', pieceColor: '#ec4899' },
      { pieceId: 'piece_linha',  count: 30, pieceName: 'Linha Colorida',  pieceIcon: 'wind',   pieceColor: '#06b6d4' },
      { pieceId: 'piece_agulha', count: 20, pieceName: 'Agulha Média',    pieceIcon: 'edit-2', pieceColor: '#8b5cf6' },
    ],
    bitsCost: 10000,
    resultItemId: 'tenis_corrida',
    resultItemName: 'Tênis de Corrida',
    resultRarity: 'RARE',
  },
  // ── Chaos Brain drops: piece_caos ────────────────────────────────────────
  {
    pieceId: 'piece_caos',
    pieceName: 'Fragmento do Caos',
    pieceDescription: 'Drop do Chaos Brain. Usado para forjar itens épicos.',
    pieceIcon: 'cpu',
    pieceColor: '#a855f7',
    requiredCount: 5,
    bitsCost: 500,
    resultItemId: 'pulseira_ouro',
    resultItemName: 'Pulseira Dourada',
    resultRarity: 'RARE',
  },
];

export function expToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function tamerExpToNextLevel(level: number): number {
  if (level <= 4) {
    return Math.round(100 * Math.pow(1.276, level - 1));
  }
  return Math.round(528 * Math.pow(1.218, level - 5));
}

export function getScaledStats(base: BaseStats, level: number): BaseStats {
  const mult = 1 + (level - 1) * 0.05;
  return {
    hp:  Math.floor(base.hp  * mult),
    mp:  Math.floor(base.mp  * mult),
    atk: Math.floor(base.atk * mult),
    def: Math.floor(base.def * mult),
    spt: Math.floor(base.spt * mult),
    spd: Math.floor(base.spd * mult),
    apt: Math.floor(base.apt * mult),
  };
}
