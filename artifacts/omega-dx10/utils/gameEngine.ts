import type { OwnedCharacter } from "@/context/GameContext";

// ==========================================
// SISTEMA DE GACHA AVANÇADO (ABA ADMIN + POOL DINÂMICO)
// ==========================================

export interface RecompensaGacha {
  id: string;
  nome: string;
  tipo: "ITEM" | "FRAGMENTO" | "DIGIMON";
  raridade: "COMUM" | "ESPECIAL" | "RARO";
  imagemUrl: string;
  dadosDigimon?: any;
}

export interface JogadorGacha {
  id: string;
  username: string;
  gemas: number;
  inventario: any[];
  digibank: any[];
  gachaContadorPity: number;
}

export class AbaAdmin {
  private poolGachaAtual: RecompensaGacha[] = [];
  private itemRaroEmDestaque: RecompensaGacha | null = null;
  private itemEspecialGarantido: RecompensaGacha | null = null;

  public adminAdicionarItemAoGacha(item: RecompensaGacha): void {
    this.poolGachaAtual.push(item);
    if (item.raridade === "RARO") {
      this.itemRaroEmDestaque = item;
    } else if (item.raridade === "ESPECIAL") {
      this.itemEspecialGarantido = item;
    }
    console.log(`⚙️ [ABA ADMIN] ${item.tipo} adicionado ao Gacha: "${item.nome}" (${item.raridade})`);
  }

  public adminLimparRotaçãoGacha(): void {
    this.poolGachaAtual = [];
    this.itemRaroEmDestaque = null;
    this.itemEspecialGarantido = null;
    console.log("⚙️ [ABA ADMIN] Toda a rotação antiga do Gacha foi removida.");
  }

  public obterPoolGacha(): RecompensaGacha[] { return this.poolGachaAtual; }
  public obterDestaqueRaro(): RecompensaGacha | null { return this.itemRaroEmDestaque; }
  public obterGarantidoEspecial(): RecompensaGacha | null { return this.itemEspecialGarantido; }
}

export class SistemaGacha {
  private painelAdmin: AbaAdmin;

  constructor(painelAdmin: AbaAdmin) {
    this.painelAdmin = painelAdmin;
  }

  public exibirInterfaceGachaParaJogador(): void {
    const itemRaro = this.painelAdmin.obterDestaqueRaro();
    console.log("\n=============================================");
    console.log("             🌌 INVOCAÇÃO GACHA 🌌            ");
    console.log("=============================================");
    if (itemRaro) {
      console.log(`🔥 [DESTAQUE RARO DO PERÍODO]: ${itemRaro.nome} (${itemRaro.tipo})`);
      console.log(`🖼️ [IMAGEM DO ITEM]: ${itemRaro.imagemUrl}`);
      if (itemRaro.tipo === "DIGIMON" && itemRaro.dadosDigimon) {
        console.log(`📊 Nível: ${itemRaro.dadosDigimon.nivel} | Atributo: ${itemRaro.dadosDigimon.atributo}`);
      }
    } else {
      console.log("✨ Destaque do período: Verifique os prêmios com os administradores!");
    }
    console.log("---------------------------------------------");
    console.log("💎 Custo Solo: 100 Gemas  (1º Tiro do dia Grátis)");
    console.log("💎 Pacote Completo: 900 Gemas (Multi-Tiro x10)");
    console.log("🛡️ Garantias: Item Especial em 10 tiros | Raro Garantido em 50 tiros");
    console.log("=============================================\n");
  }

  public puxarGacha(
    jogador: JogadorGacha,
    quantidadeTiros: 1 | 10
  ): { mensagem: string; sorteados: RecompensaGacha[] } {
    const pool = this.painelAdmin.obterPoolGacha();
    const itemRaroGarantido = this.painelAdmin.obterDestaqueRaro();
    const itemEspecialGarantido = this.painelAdmin.obterGarantidoEspecial();

    if (pool.length === 0) {
      return { mensagem: "❌ O Gacha está vazio no momento. Aguarde o Admin abastecer!", sorteados: [] };
    }

    const custo = quantidadeTiros === 10 ? 900 : 100;
    if (jogador.gemas < custo) {
      return { mensagem: "❌ Gemas insuficientes.", sorteados: [] };
    }

    jogador.gemas -= custo;
    const itensSorteados: RecompensaGacha[] = [];

    for (let i = 0; i < quantidadeTiros; i++) {
      jogador.gachaContadorPity++;

      if (jogador.gachaContadorPity >= 50 && itemRaroGarantido) {
        itensSorteados.push(itemRaroGarantido);
        jogador.gachaContadorPity = 0;
        continue;
      }

      if (jogador.gachaContadorPity % 10 === 0 && itemEspecialGarantido) {
        itensSorteados.push(itemEspecialGarantido);
        continue;
      }

      const dado = Math.random();
      let raridadeSorteada: "COMUM" | "ESPECIAL" | "RARO" = "COMUM";

      if (dado < 0.02) {
        raridadeSorteada = "RARO";
        jogador.gachaContadorPity = 0;
      } else if (dado < 0.12) {
        raridadeSorteada = "ESPECIAL";
      }

      let opcoes = pool.filter((item) => item.raridade === raridadeSorteada);
      if (opcoes.length === 0) opcoes = pool.filter((item) => item.raridade === "COMUM");

      const itemGanho = opcoes[Math.floor(Math.random() * opcoes.length)];
      itensSorteados.push(itemGanho);
    }

    itensSorteados.forEach((premio) => {
      if (premio.tipo === "DIGIMON") {
        jogador.digibank.push(premio.dadosDigimon || { nome: premio.nome, nivel: "Rookie" });
      } else {
        jogador.inventario.push({ id: premio.id, nome: premio.nome, tipo: premio.tipo });
      }
    });

    return {
      mensagem: `🎉 Sorteio Concluído! Pity Atual: ${jogador.gachaContadorPity}/50`,
      sorteados: itensSorteados,
    };
  }
}

// ==========================================
// 1. INTERFACES E TIPOS BASE DE SISTEMA
// ==========================================

export type NetworkMode = "ONLINE" | "OFFLINE";

export interface Item {
  id: string;
  nome: string;
  tipo: "Item" | "Fragmento" | "Digiovo" | "Digimon";
  trocavel: boolean;
}

export interface GachaRewardItem extends Item {
  raridade: "Comum" | "Raro" | "Especial";
}

export interface PlayerData {
  id: string;
  username: string;
  gemas: number;
  moedas: number;
  digibank: OwnedCharacter[];
  inventario: Item[];
  amigos: string[];
  rankingPontos: number;
  ultimoTiroGratis: string | null;
  gachaContadorPity: number;
}

export interface GachaConfig {
  itensDisponiveis: GachaRewardItem[];
  garantido10Tiros: GachaRewardItem;
  garantido50Tiros: GachaRewardItem;
  taxasDrop: {
    Comum: number;
    Especial: number;
    Raro: number;
  };
}

// ==========================================
// 2. SISTEMA CENTRAL DE MECÂNICAS (GAME ENGINE)
// ==========================================

export class DigimonGameEngine {
  private modoAtual: NetworkMode = "OFFLINE";
  private configGacha: GachaConfig;
  private tabelaAdminTrocas: Map<string, boolean> = new Map();

  constructor(gachaConfigInicial: GachaConfig) {
    this.configGacha = gachaConfigInicial;
  }

  // --- GERENCIAMENTO ONLINE / OFFLINE ---

  public alternarModoRede(modo: NetworkMode, dadosLocais?: PlayerData): void {
    this.modoAtual = modo;
    if (modo === "ONLINE") {
      console.log("🌐 Conectado! Enviando dados locais e baixando atualizações do Admin...");
      if (dadosLocais) this.sincronizarComServidor(dadosLocais);
    } else {
      console.log("📴 Modo Offline Ativado. Progresso salvando localmente na memória do aparelho.");
    }
  }

  public getModoAtual(): NetworkMode {
    return this.modoAtual;
  }

  private async sincronizarComServidor(dados: PlayerData): Promise<void> {
    console.log(`Dados do jogador ${dados.username} sincronizados em nuvem.`);
  }

  // --- RECURSOS EXCLUSIVOS ONLINE ---

  public realizarBatalhaAmigo(player: PlayerData, amigoId: string): string {
    if (this.modoAtual === "OFFLINE") {
      return "❌ Você precisa estar Online para desafiar seus amigos em batalhas PvP!";
    }
    if (!player.amigos.includes(amigoId)) {
      return "❌ Este jogador não está na sua lista de amigos.";
    }
    return `⚔️ Iniciando Batalha de Amigos contra o ID: ${amigoId}...`;
  }

  public consultarRankingGeral(): string {
    if (this.modoAtual === "OFFLINE") {
      return "❌ Conecte-se à internet para visualizar o Ranking Global.";
    }
    return "🏆 [ONLINE] Carregando Top 100 Líderes do Servidor...";
  }

  // --- SISTEMA: TROCA HUNTER (GERENCIADO PELO ADMIN) ---

  public adminConfigurarTrocaHunter(itemId: string, podeSerTrocado: boolean): void {
    this.tabelaAdminTrocas.set(itemId, podeSerTrocado);
    console.log(`⚙️ [ADMIN] Troca Hunter atualizado: Item ${itemId} -> Trocável: ${podeSerTrocado}`);
  }

  public executarTrocaHunter(
    remetente: PlayerData,
    destinatario: PlayerData,
    itemRemetente: Item
  ): string {
    const permissaoAdmin = this.tabelaAdminTrocas.has(itemRemetente.id)
      ? this.tabelaAdminTrocas.get(itemRemetente.id)
      : itemRemetente.trocavel;

    if (!permissaoAdmin) {
      return `🔒 O sistema Troca Hunter bloqueou esta operação: ${itemRemetente.nome} não é autorizado para trocas pelo Admin.`;
    }

    const index = remetente.inventario.findIndex((i) => i.id === itemRemetente.id);
    if (index === -1) return "❌ O remetente não possui este item.";

    remetente.inventario.splice(index, 1);
    destinatario.inventario.push(itemRemetente);

    return `🔄 Troca Hunter Concluída! ${itemRemetente.nome} enviado para ${destinatario.username}.`;
  }

  // --- SISTEMA: ECONOMIA E GACHA ---

  public adminAtualizarGacha(novaConfig: GachaConfig): void {
    this.configGacha = novaConfig;
    console.log("⚙️ [ADMIN] Nova rotação e recompensas configuradas no Gacha com sucesso.");
  }

  public getGachaConfig(): GachaConfig {
    return this.configGacha;
  }

  public realizarTiroGacha(player: PlayerData, quantidade: 1 | 10): {
    mensagem: string;
    recompensas: GachaRewardItem[];
    custoGemas: number;
  } {
    const { taxasDrop, itensDisponiveis, garantido10Tiros, garantido50Tiros } = this.configGacha;

    const getTiroAleatorio = (): GachaRewardItem => {
      const rng = Math.random();
      let raridade: GachaRewardItem["raridade"];
      if (rng < taxasDrop.Raro) {
        raridade = "Raro";
      } else if (rng < taxasDrop.Raro + taxasDrop.Especial) {
        raridade = "Especial";
      } else {
        raridade = "Comum";
      }
      const pool = itensDisponiveis.filter((i) => i.raridade === raridade);
      return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : itensDisponiveis[0];
    };

    const custoGemas = quantidade === 1 ? 100 : 900;
    if (player.gemas < custoGemas) {
      return { mensagem: "❌ Gemas insuficientes!", recompensas: [], custoGemas: 0 };
    }

    const recompensas: GachaRewardItem[] = [];
    for (let i = 0; i < quantidade; i++) {
      player.gachaContadorPity += 1;

      if (player.gachaContadorPity >= 50) {
        recompensas.push(garantido50Tiros);
        player.gachaContadorPity = 0;
        continue;
      }
      if (player.gachaContadorPity % 10 === 0) {
        recompensas.push(garantido10Tiros);
        continue;
      }
      recompensas.push(getTiroAleatorio());
    }

    player.gemas -= custoGemas;

    return {
      mensagem: `🎉 Sorteio concluído! Gastou ${custoGemas} gemas. Pity: ${player.gachaContadorPity}/50`,
      recompensas,
      custoGemas,
    };
  }
}
