# Notes

Anotações técnicas, decisões e ideias do projeto.

---

## Decisões do projeto

- O projeto será desenvolvido inicialmente com HTML, CSS e JavaScript puro.
- A aplicação usa `localStorage` como armazenamento local inicial.
- O foco é criar uma base simples, funcional, organizada e fácil de expandir.
- O projeto será construído por versões pequenas e fechadas gradualmente.
- A v1.0 deve ser uma versão base realmente usável para estudos.
- Login, banco de dados online e sincronização em nuvem ficam para versões futuras.
- A interface deve seguir um estilo simples, minimalista e responsivo.
- O sistema deve priorizar clareza, organização e facilidade de uso.
- Cada seção deve cuidar de sua própria função principal.
- O Dashboard deve apenas ler dados e orientar o usuário, sem substituir as seções completas.
- A navegação principal deve ser centralizada para evitar conflitos entre abas, cards e seções visíveis.

---

## Ideia central

A Central de Estudos Web tem como objetivo organizar o ciclo de estudo:

```txt
Organizar conteúdos → Resolver questões → Corrigir → Revisar erros → Registrar aprendizados → Acompanhar evolução
```

A proposta é evitar que matérias, temas, questões, anotações, correções e indicadores fiquem espalhados em vários lugares diferentes.

---

## Princípios de uso

- Registrar informações de forma simples.
- Organizar conteúdos por matéria e tema.
- Praticar com questões cadastradas.
- Transformar erros em regras de correção.
- Criar anotações livres ou vinculadas.
- Usar indicadores para decidir o próximo passo de estudo.

---

## Estrutura lógica atual

```txt
Matérias
└── Temas
    └── Questões
        └── Tentativas
            └── Revisões de erro

Anotações
├── Livres
├── Vinculadas a uma matéria
└── Vinculadas a uma matéria e tema

Dashboard
├── Resumo
├── Desempenho
├── Revisão
└── Conteúdos
```

---

## Funcionalidades implementadas até a v1.0

- Tela inicial de apresentação.
- Navegação visual por grupos: Resumo, Cadastro e Estudo.
- Alternância entre tema claro e escuro.
- Cadastro de matérias.
- Cadastro de temas vinculados a matérias.
- Cadastro, edição, movimentação e exclusão de questões.
- Modo de resolução de questões.
- Alternativas embaralhadas visualmente.
- Registro de tentativas.
- Histórico completo de resoluções.
- Revisão de erros pendentes.
- Separação entre erros pendentes e erros revisados.
- Anotações independentes.
- Anotações com vínculos opcionais a matéria e tema.
- Tags, status, favoritas, fixadas e arquivadas.
- Busca e filtros de anotações.
- Visualização e edição de anotações em modal.
- Formatação Markdown básica.
- Dashboard inteligente com abas.
- Indicadores de resumo, desempenho, revisão e conteúdos.
- Atalhos inteligentes do Dashboard para seções específicas.
- Ações rápidas nos cards de anotações.
- Tooltips nos botões de ações e tags ocultas.
- Botão para apagar todos os dados com confirmação dupla.
- Seção Opções para ações gerais da aplicação.
- Exportação geral dos dados em `.json`.
- Importação de backup em `.json`.
- Prévia do conteúdo do backup antes da importação.
- Importação em lote de matérias.
- Importação em lote de temas.
- Importação de questões por texto estruturado.
- Validação de importações antes de salvar dados.
- Tratamento de duplicatas com normalização de acentos.
- Limpeza de registros relacionados ao excluir conteúdos.
- Botão “Começar estudos” com fluxo inteligente.
- Modal “Sobre” com informações da aplicação.

---

## Decisões técnicas recentes

### Dashboard

- O Dashboard não deve armazenar dados próprios.
- O Dashboard deve ler as coleções existentes e calcular indicadores derivados.
- O Dashboard deve exibir listas curtas, preferencialmente Top 5.
- A aba Revisão do Dashboard deve seguir a mesma lógica da seção Revisões.
- Erros pendentes no Dashboard representam questões erradas ainda não revisadas.
- A seção Revisões continua sendo o lugar completo para histórico, filtros e gestão de erros.

### Navegação

- A navegação principal deve controlar a seção visível e o grupo ativo.
- Outros módulos devem solicitar navegação por eventos, como `app:navigate`.
- O Dashboard não deve trocar seções diretamente.
- Atalhos do Dashboard podem levar para seções específicas e preparar formulários.

### Anotações

- Anotações são entidades independentes.
- Excluir matéria ou tema não deve apagar anotações automaticamente.
- Ao excluir matéria, o vínculo da anotação deve ser removido.
- Ao excluir tema, apenas o vínculo do tema deve ser removido.
- Cards de anotações devem priorizar leitura rápida e ações visíveis.
- O botão `Mais` foi substituído por ações rápidas: favoritar, fixar, arquivar, editar e excluir.
- Tags ocultas podem ser visualizadas por tooltip no indicador `+N`.

---

## Problemas encontrados e resolvidos

### Dependências antigas do Dashboard

Alguns módulos ainda dependiam de IDs antigos do Dashboard, como contadores específicos de matérias, temas e questões. Isso podia impedir a inicialização correta de formulários.

Solução:

```txt
Remover dependências diretas do Dashboard antigo.
Permitir que o Dashboard inteligente leia as coleções e atualize os indicadores sozinho.
```

---

### Navegação visual dessincronizada

Ao abrir atalhos pelo Dashboard, a seção correta aparecia, mas o grupo visual da navegação podia continuar incorreto.

Solução:

```txt
Centralizar a navegação em um evento app:navigate.
Sincronizar grupo ativo, cards visíveis e seção aberta.
```

---

### Diferença entre Dashboard e seção Revisões

O Dashboard e a seção Revisões estavam numerando e filtrando erros pendentes de formas diferentes.

Solução:

```txt
Alinhar a lógica de erros pendentes.
Numerar questões dentro do tema, como na seção Revisões.
Remover apenas tentativas realmente revisadas da lista de pendências.
```

---

### Tooltip das tags ocultas

O tooltip das tags ocultas herdava estilos de pílulas das tags comuns.

Solução:

```txt
Criar seletores mais específicos para o tooltip.
Remover borda, fundo e arredondamento herdados dos spans internos.
```

---

## Ideias futuras

- Exportação de flashcards em `.csv`.
- Sistema de simulados.
- Revisão espaçada.
- Transformar erro revisado em anotação.
- Transformar anotação em flashcard.
- Exportação de anotações.
- Instalação como PWA.
- Uso offline melhorado.
- Sincronização em nuvem.
- Login de usuário.
- Banco de dados online.

---

## Observações

A v1.0 consolidou a aplicação como uma versão mais segura para uso pessoal, adicionando backup, importação, exportação e mecanismos de integridade dos dados.

Com isso, a Central de Estudos Web já pode ser usada de forma mais confiável para estudos reais, desde que o usuário mantenha backups periódicos dos dados.

A próxima etapa natural é transformar a aplicação em instalável com PWA, mantendo a segurança dos dados como prioridade.