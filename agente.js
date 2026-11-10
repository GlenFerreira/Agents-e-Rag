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


// 2. RETRIEVAL (Busca por relevância de palavras-chave da vaga)

  // Ordena pelo maior número de correspondências

// 3. EXECUÇÃO DO AGENTE (Augmentation + Generation)

  // Passo RAG: Augmentation (Aumento de Contexto no Prompt)

  // Passo RAG: Generation (Chamada da LLM para inferência semântica)

  // 4. ATUALIZAÇÃO DO SISTEMA DE RH
