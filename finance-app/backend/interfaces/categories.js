const REGEX_COMPRAS = /mercadolivre|shopee|shein|amazon|rastylehair|apple|lojas|riachuelo|cosm|fastshops|brikstore|giovani breda point c/i;
const REGEX_ALIMENTACAO = /ifood|restaurant|restaurante|mercado|padaria|paes|pizzaria|espetos|pastel|lanchonet|churros|outback|bebidas|frutas|legumes|sushi|coop|armazem|alimentacao/i;
const REGEX_MORADIA = /condomínio|enel|distri|vivo|light|comgas/i;
const REGEX_TRANSPORTE = /uber|99app|99\s*taxi|posto|shellbox|combustivel|estacionamento|mapark|allpark|zul|despachante|sbplacas|scooter|auto\s*pecas/i;
const REGEX_LAZER = /netflix|spotify|steam|cinema|hotel|cachoeira|era do gelo|lounge|dmsc|show|viagem|Seazone/i;
const REGEX_SAUDE = /tecnolab|farmacia|drogaria|hosp|mat\s*assuncao|ifor|medico|promofarma/i;
const REGEX_EDUCACAO = /curso|faculdade|escola|udemy|fiap|estudos/i;
const REGEX_AURORA = /petlove|pbweasy|petz/i;
const REGEX_FINANCIAMENTO = /financiamento|pag boleto itau unibanco|imobiliario/i;
const REGEX_INVESTIMENTOS = /investimento/i;
const REGEX_IGREJA = /pix transf igreja/i;
const REGEX_PESSOAL = /tim|rastylehair/i;

// Dicionário de regras
const REGRAS_EXTRATO = [
  { categoria: "Compras", regex: REGEX_COMPRAS },
  { categoria: "Alimentação", regex: REGEX_ALIMENTACAO },
  { categoria: "Moradia", regex: REGEX_MORADIA },
  { categoria: "Transporte", regex: REGEX_TRANSPORTE },
  { categoria: "Lazer", regex: REGEX_LAZER },
  { categoria: "Saúde", regex: REGEX_SAUDE },
  { categoria: "Educação", regex: REGEX_EDUCACAO },
  { categoria: "Aurora", regex: REGEX_AURORA },
  { categoria: "Financiamento", regex: REGEX_FINANCIAMENTO },
  { categoria: "Investimentos", regex: REGEX_INVESTIMENTOS },
  { categoria: "Dizimo", regex: REGEX_IGREJA },
  { categoria: "Pessoal", regex: REGEX_PESSOAL },
  { categoria: "Outros", regex: /.*/ } // fallback
];

module.exports = {
  REGRAS_EXTRATO
};