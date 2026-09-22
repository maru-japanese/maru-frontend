# Continuidade do manual

Referência: maru-arquitetura/maru-arquitetura.html, versão 1.2.
A direção Dojo escolhida é **Tinta e papel**. Arcade mantém sua identidade.

## Implementado nesta etapa

| Peça | Entrega |
| --- | --- |
| Duas entradas | Começar do zero com escolha de meta; diagnóstico para quem já estudou. |
| Diagnóstico | 15 perguntas, retomada, explicações, sugestão por etapa e ajuste manual. Não concede XP nem conclui lições. |
| Dojo | Papel washi em SVG estático, tinta escura, vermelho de hanko e tipografia Shippori Mincho. |
| Celular | Caractere e círculo inteiros dentro do card, nos dois modos. Scanline removida em telas pequenas e com movimento reduzido. |
| Apoio | Página e links discretos no dashboard e configurações; destinos reais configuráveis para Brasil/exterior. |
| Contas | Google OAuth, SQLite, sessões com hash, migração do navegador e isolamento ao sair/trocar conta. |
| Progresso | Selos por etapa realmente concluída e um dia de pausa protegido por semana. |
| Cultura | Oito cápsulas vinculadas a lições, reutilizando expressões já explicadas. |
| Temas | Viagem, anime/mangá e trabalho; palavras, frases, expressões e práticas do acervo existente. |
| Editorial | Gerador de rascunhos, checklist e backlog. Nenhum rascunho é publicado automaticamente. |
| Operação | Dockerfile e backup consistente de SQLite; guia de configuração e restauração. |

## Ativação externa

- Criar o cliente OAuth Google e informar as credenciais e o domínio em .env.
- Definir a página real de Apoia.se e/ou Ko-fi; nenhum destino foi inventado.
- Escolher hospedagem com volume persistente e configurar domínio/HTTPS.
- Agendar backups e armazenar uma cópia fora do servidor. O comando está no `maru-backend`;
  nenhum provedor ou despesa foi contratado.

## Fases posteriores do manual

| Prioridade | Ideia | Etapa/bloco | Critério para começar |
| --- | --- | --- | --- |
| Alta | Prática diária personalizada, retomada de lições e pontos fracos | Experiência transversal | Unificar metadados, histórico e recomendações, preservando IDs existentes. |
| Alta | Consolidar o básico, por temas pequenos | Bloco 2 | Mais palavras e kanji revisados, objetivos e exemplos contextualizados; sem prometer curso N5/N4 completo. |
| Média | Corrigir frases livres com IA | Serviço opcional para contas | Escolher provedor/modelo, teto de gastos e limite por conta/dia. Resultado separado do corretor por modelos, com incertezas visíveis. |
| Média | Exemplos extras com IA | Serviço opcional para contas | Mesmo controle de custo; resposta estruturada e avaliação antes da exposição pública. |
| Média | Link mágico por e-mail | Contas, fase 2 | Escolher serviço de e-mail, configurar domínio e definir expiração/uso único; não guardar senhas. |
| Média | Texto curto e gramática conectiva | Bloco 3 | Preparar sequência didática e critérios de revisão antes de ampliar o catálogo. |
| Baixa | Leitura longa e contrastes de registro | Bloco 4 | Base intermediária disponível e revisada. |
| Baixa | Nuance, registros literários/jornalísticos | Bloco 5 | Curadoria própria para conteúdo avançado. |
| Baixa | Conversa aberta | Beta fechado | Só após definir escopo, avaliação, custo e proteção contra abuso. |

O áudio continua por API, sem geração em lote, exportação ou arquivos de voz.
Melhorias de disponibilidade não devem transformar essa escolha em download de áudios.
Os recursos de IA e link mágico não estão ativos nem são simulados na interface.
