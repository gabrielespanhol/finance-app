// Interface que define como cada regra deve ser estruturada
export interface RegraCategoria {
  categoria: string;
  regex: RegExp;
}

// O dicionário propriamente dito (pode ser exportado para o arquivo principal)
export const REGRAS_EXTRATO: RegraCategoria[] = [
  { categoria: "Compras", regex: /mercadolivre|shopee|shein|amazon/i },
  { categoria: "Transporte", regex: /uber|99app|99\s*taxi|posto/i },
  { categoria: "Alimentação", regex: /ifood|restaurant|restaurante|mercado|padaria/i },
  { categoria: "Moradia", regex: /rent|aluguel|condomínio|enel/i },
  { categoria: "Lazer", regex: /netflix|spotify|steam|cinema/i }
];
