# Central de Estudos Web

Aplicação web para organizar estudos, questões, anotações, revisões e indicadores de desempenho em um único lugar.

---

## Sobre o projeto

A **Central de Estudos Web** é um projeto pessoal criado para centralizar o processo de estudo.

A aplicação permite cadastrar matérias, organizar temas, criar questões, resolver exercícios, registrar tentativas, revisar erros, criar anotações independentes e acompanhar a evolução por meio de um Dashboard inteligente.

---

## Objetivo

Criar uma central de estudos prática, organizada e fácil de usar, focada no ciclo:

```txt
Organizar conteúdos → Resolver questões → Corrigir → Revisar erros → Registrar aprendizados → Acompanhar evolução
```

A proposta é ajudar o estudante a entender não apenas o que já foi cadastrado, mas também o que precisa ser praticado, revisado ou completado.

---

## Funcionalidades implementadas

- Cadastro de matérias
- Cadastro de temas vinculados a matérias
- Cadastro, edição, movimentação e exclusão de questões
- Modo de resolução de questões
- Alternativas embaralhadas visualmente
- Feedback de acerto e erro
- Registro de tentativas no `localStorage`
- Histórico de resoluções
- Revisão de erros pendentes
- Registro de motivo do erro, regra de correção e observação
- Separação entre erros pendentes e erros revisados
- Sistema de anotações independentes
- Vínculo opcional de anotações com matéria e tema
- Busca e filtros de anotações
- Tags, status, favoritas, fixadas e arquivadas
- Visualização de anotações em modal
- Edição rápida e edição completa de anotações
- Formatação básica em Markdown
- Dashboard organizado por abas
- Indicadores gerais de estudos
- Indicadores de desempenho
- Indicadores de revisão
- Lacunas da base de conteúdos
- Anotações prioritárias
- Atalhos inteligentes entre Dashboard e seções do sistema
- Alternância entre tema claro e escuro
- Botão de reset geral dos dados
- Salvamento local no navegador
- Exportação geral dos dados em arquivo `.json`
- Importação de backup em `.json`
- Validação de estrutura do backup importado
- Prévia do conteúdo do backup antes da importação
- Confirmação antes de substituir dados existentes
- Importação em lote de matérias por texto
- Importação em lote de temas por texto
- Importação de questões por formato textual estruturado
- Tratamento de duplicatas ignorando diferenças entre maiúsculas, minúsculas e acentos
- Limpeza de registros relacionados ao excluir matérias, temas ou questões
- Início inteligente de estudos pelo botão “Começar estudos”
- Modal “Sobre” com resumo, objetivo, propósito e autoria da aplicação

---

## Dashboard inteligente

O Dashboard funciona como uma central de acompanhamento dos estudos.

Ele é dividido em quatro abas principais:

```txt
Resumo      → visão geral da central
Desempenho  → acertos, erros, tentativas e rankings de erro
Revisão     → pendências de revisão e atalhos para revisar erros
Conteúdos   → lacunas da base e anotações prioritárias
```

A ideia do Dashboard é ajudar o usuário a decidir o próximo passo de estudo sem precisar abrir todas as seções manualmente.

---

## Status do projeto

Versão atual:

```txt
v1.0 — Backup, importação e uso seguro
```

Status:

```txt
Concluída
```

---

## Tecnologias

- HTML
- CSS
- JavaScript
- `localStorage`

---

## Estrutura do projeto

```txt
central-estudos-web/
│
├── index.html
├── README.md
├── ROADMAP.md
├── .gitignore
│
├── docs/
│   └── notes.md
│
└── src/
    ├── css/
    │   ├── style.css
    │   ├── base/
    │   ├── components/
    │   ├── layout/
    │   └── sections/
    │
    ├── js/
    │   ├── main.js
    │   ├── core/
    │   ├── ui/
    │   └── features/
    │
    └── assets/
        ├── icons/
        └── images/
```

> A estrutura pode variar conforme a organização dos arquivos evoluir durante o desenvolvimento.

---

## Roadmap

O planejamento das versões está disponível no arquivo:

```txt
ROADMAP.md
```

---

## Ideia central

Este projeto busca transformar o estudo em um processo mais organizado e consciente.

A proposta é evitar que conteúdos, questões, correções e anotações fiquem espalhados em vários lugares diferentes.

O sistema caminha para funcionar como uma central que responde:

```txt
O que tenho cadastrado?
O que já pratiquei?
Onde estou errando?
O que preciso revisar?
O que falta completar?
```

---

## Próximos passos

- Fechar a v1.0 com revisão final da documentação
- Criar a tag `v1.0`
- Fazer merge da branch `dev/v1.0` para `main`
- Iniciar a v1.1 com foco em PWA e instalação da aplicação
- Planejar `manifest.json`, `service-worker.js` e ícones da aplicação

---

## Autor

Desenvolvido por **Vinícius Sidney** em 2026.
