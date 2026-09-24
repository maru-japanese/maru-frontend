# Continuidade do manual

Referência: maru-arquitetura/maru-arquitetura.html, versão 1.4. O documento é um mapa de propostas, não o estado atual da hospedagem: Vercel + Supabase e o Dojo Tinta e papel já foram escolhidos.
A direção Dojo escolhida é **Tinta e papel**. Arcade mantém sua identidade.

**Princípio do produto:** ninguém paga para acessar o Maru e não há pedidos de apoio financeiro. Se uma integração futura tiver custo por uso (como IA), só será lançada com orçamento e limites internos que preservem o acesso gratuito.

## Implementado nesta etapa

| Peça | Entrega |
| --- | --- |
| Duas entradas | Começar do zero com escolha de meta; diagnóstico para quem já estudou. |
| Diagnóstico | 15 perguntas, retomada, explicações, sugestão por etapa e ajuste manual. Não concede XP nem conclui lições. |
| Dojo | Papel washi em SVG estático, tinta escura, vermelho de hanko e tipografia Shippori Mincho. |
| Celular | Navegação acessível nos dois estilos; sem camada escurecendo o Arcade. Animações decorativas podem ser pausadas e respeitam movimento reduzido. |
| Contas | Supabase Auth por e-mail/senha, confirmação e recuperação; cookies HttpOnly, migração do navegador e isolamento ao sair/trocar conta. Google permanece desativado. |
| Descoberta | Trilha, prática, impressão e materiais para professores ficam visíveis na navegação e na home. |
| Progresso | Selos por etapa realmente concluída e um dia de pausa protegido por semana. |
| Cultura | Oito cápsulas vinculadas a lições, reutilizando expressões já explicadas. |
| Temas | Viagem, anime/mangá e trabalho; palavras, frases, expressões e práticas do acervo existente. |
| Editorial | Gerador de rascunhos, checklist e backlog. Nenhum rascunho é publicado automaticamente. |
| Operação | Frontend na Vercel, API e Postgres no Supabase; adaptador SQLite legado preservado. |
| Impressão | Livro 1 compila as 37 lições e atividades atuais em um volume A4 com gabarito; exercícios de partículas também podem ser impressos separadamente. |
| Professores | Seleção de etapa ou tema gera um link público com as lições e acesso ao Livro 1, sem turma, notas ou progresso individual. |
| Ilustrações | Artes do Irasutoya com créditos e inventário; autorização informada pela responsável para o uso educacional gratuito, sem o antigo teto interno de 20. |

## Ativação externa

- Configurar SMTP próprio e permitir `https://maru-frontend.vercel.app` como retorno de e-mail no Supabase Auth.
- Publicar o frontend na Vercel e a Edge Function no Supabase; validar o domínio HTTPS.
- Configurar a política de backup e retenção do Postgres no Supabase.

## Fases posteriores do manual

| Prioridade | Ideia | Etapa/bloco | Critério para começar |
| --- | --- | --- | --- |
| Alta | Prática diária personalizada, retomada de lições e pontos fracos | Experiência transversal | Unificar metadados, histórico e recomendações, preservando IDs existentes. |
| Alta | Consolidar o básico, por temas pequenos | Bloco 2 | Mais palavras e kanji revisados, objetivos e exemplos contextualizados; sem prometer curso N5/N4 completo. |
| Média | Corrigir frases livres com IA | Serviço opcional gratuito para contas | Escolher provedor/modelo, orçamento interno e limite de uso justo. Sem assinatura ou compra; resultado separado do corretor por modelos, com incertezas visíveis. |
| Média | Exemplos extras com IA | Serviço opcional gratuito para contas | Mesmo controle de custo, resposta estruturada e avaliação antes da exposição pública; sem cobrança ao aluno. |
| Média | Link mágico por e-mail | Contas, fase 2 | Escolher serviço de e-mail, configurar domínio e definir expiração/uso único; não guardar senhas. |
| Média | Texto curto e gramática conectiva | Bloco 3 | Preparar sequência didática e critérios de revisão antes de ampliar o catálogo. |
| Baixa | Leitura longa e contrastes de registro | Bloco 4 | Base intermediária disponível e revisada. |
| Baixa | Nuance, registros literários/jornalísticos | Bloco 5 | Curadoria própria para conteúdo avançado. |
| Baixa | Conversa aberta | Beta fechado | Só após definir escopo, avaliação, custo e proteção contra abuso. |

O áudio continua por API, sem geração em lote, exportação ou arquivos de voz.
Melhorias de disponibilidade não devem transformar essa escolha em download de áudios.
Os recursos de IA e link mágico não estão ativos nem são simulados na interface.
