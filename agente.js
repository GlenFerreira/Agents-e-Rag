/**
 * AGENTE DE RH COM ARQUITETURA RAG
 * 
 * Estrutura:
 * - conhecimento/vagas.json      -> Requisitos e palavras-chave da vaga
 * - conhecimento/curriculos.json -> Base de conhecimento simulada (recuperação)
 * - agente.js                   -> Pipeline RAG (Retrieval -> Augmentation -> Generation)
 */

const fs = require("fs");
const path = require("path");

const API_KEY = "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";
const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

// 1. CARREGAR DADOS DA PASTA DE CONHECIMENTO
const caminhoVagas = path.join(__dirname, "conhecimento", "vagas.json");
const caminhoCurriculos = path.join(__dirname, "conhecimento", "curriculos.json");

const vagas = JSON.parse(fs.readFileSync(caminhoVagas, "utf-8"));
const curriculos = JSON.parse(fs.readFileSync(caminhoCurriculos, "utf-8"));

// Selecionamos a primeira vaga como alvo
const vagaAlvo = vagas[0];

// 2. RETRIEVAL (Busca por relevância de palavras-chave da vaga)
function recuperarCurriculosRelevantes(baseCurriculos, termosVaga, topK = 3) {
  console.log(`🔍 [1. Retrieval]: Buscando na base os Top ${topK} currículos aderentes à vaga...`);

  const avaliados = baseCurriculos.map(candidato => {
    const texto = candidato.texto.toLowerCase();
    let score = 0;

    termosVaga.forEach(termo => {
      if (texto.includes(termo.toLowerCase())) {
        score++;
      }
    });

    return { ...candidato, scoreRAG: score };
  });

  // Ordena pelo maior número de correspondências
  avaliados.sort((a, b) => b.scoreRAG - a.scoreRAG);
  const selecionados = avaliados.slice(0, topK);

  console.log(`✅ [1. Retrieval]: De ${baseCurriculos.length} currículos, foram selecionados:`);
  selecionados.forEach(c => console.log(`   - ${c.nome} (Matches de termos: ${c.scoreRAG})`));
  console.log("");

  return selecionados;
}

// 3. EXECUÇÃO DO AGENTE (Augmentation + Generation)
async function executarAgente() {
  console.log("=== INICIANDO PIPELINE RAG DO AGENTE DE RH ===\n");
  console.log(`Vaga Alvo: ${vagaAlvo.titulo}`);

  // Passo RAG: Recuperação
  const candidatosRecuperados = recuperarCurriculosRelevantes(
    curriculos,
    vagaAlvo.palavras_chave,
    3
  );

  // Passo RAG: Augmentation (Aumento de Contexto no Prompt)
  console.log("📝 [2. Augmentation]: Montando prompt com a vaga e apenas os currículos filtrados...");

  const prompt = `
Você é um Agente de IA de Recursos Humanos.
Avalie os candidatos pré-selecionados pelo RAG para a vaga abaixo:

VAGA:
${JSON.stringify({ titulo: vagaAlvo.titulo, requisitos: vagaAlvo.requisitos }, null, 2)}

CURRÍCULOS SELECIONADOS PELO RAG:
${JSON.stringify(candidatosRecuperados.map(c => ({ id: c.id, nome: c.nome, texto: c.texto })), null, 2)}

Tarefas do Agente:
1. Interprete variações textuais de experiência (ex: "três anos" = "36 meses").
2. Compare as competências com os requisitos da vaga.
3. Atribua uma nota de 0 a 100.
4. Aponte dados ausentes ou inconsistências (ex: se não informou graduação).
5. Defina a recomendação final e o status para o sistema de RH.

Responda APENAS em JSON válido (sem tags markdown):
{
  "candidatos_avaliados": [
    {
      "nome": "Nome",
      "experiencia_interpretada": "3 anos",
      "nota": 95,
      "inconsistencias_ou_faltantes": "Nenhuma",
      "recomendado": true,
      "status_rh": "Aprovado para Entrevista"
    }
  ],
  "decisao_agente": "Resumo explicativo da decisão"
}
`;

  // Passo RAG: Generation (Chamada da LLM para inferência semântica)
  console.log("🤖 [3. Generation]: Consultando LLM na API da NVIDIA...\n");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    })
  });

  const data = await response.json();
  const conteudo = data.choices[0].message.content;
  const jsonLimpo = conteudo.replace(/```json|```/g, "").trim();
  const resultado = JSON.parse(jsonLimpo);

  // 4. ATUALIZAÇÃO DO SISTEMA DE RH
  console.log("📊 [Resultado]: Atualização do Sistema de RH gerada pelo Agente:\n");
  console.table(resultado.candidatos_avaliados);

  console.log("\nDecisão Final do Agente:");
  console.log(resultado.decisao_agente);
}

executarAgente();

