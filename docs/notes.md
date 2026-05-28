# Notes

Anotações técnicas, decisões e ideias do projeto.

---

## Decisões iniciais

- O projeto será desenvolvido inicialmente com HTML, CSS e JavaScript puro.
- A primeira versão usará armazenamento local com `localStorage`.
- O foco inicial é criar uma base simples, funcional e fácil de expandir.
- O projeto será construído por versões pequenas, começando pela v0.1.
- A v1.0 deve ser uma versão base realmente usável para estudos.
- Login, banco de dados online e sincronização em nuvem ficam para versões futuras.
- A interface deve seguir um estilo simples, minimalista e responsivo.
- O sistema deve priorizar clareza, organização e facilidade de uso.

---

## Ideia central

A Central de Estudos Web tem como objetivo organizar o ciclo de estudo:

"Estudar → Resolver questões → Corrigir → Revisar erros"

A proposta é evitar que matérias, temas, questões, anotações e correções fiquem espalhados em vários lugares diferentes.

---

## Estrutura inicial do projeto

- `index.html`: estrutura principal da aplicação.
- `src/css/style.css`: estilos visuais do projeto.
- `src/js/main.js`: lógica principal da interface.
- `src/js/storage.js`: futuro controle de armazenamento local.
- `src/js/subjects.js`: futuro sistema de matérias.
- `src/js/themes.js`: futuro sistema de temas.
- `src/js/questions.js`: futuro sistema de questões.
- `src/assets/`: imagens, ícones e outros arquivos visuais.
- `docs/`: documentação e anotações técnicas.

---

## Funcionalidades iniciais implementadas

- Tela inicial de apresentação.
- Cards com áreas planejadas do sistema.
- Navegação visual entre seções.
- Seções iniciais para Dashboard, Matérias, Temas, Questões, Anotações, Revisões e Roadmap.
- Alternância entre tema claro e escuro.
- Salvamento da preferência de tema no navegador.

---

## Próximas decisões

- Definir como será a estrutura de dados das matérias.
- Definir o formato base dos objetos salvos no `localStorage`.
- Criar o primeiro formulário real do sistema.
- Começar a implementação da v0.2 com o cadastro de matérias.

- Nos cards de anotações: Substituir "Mais" pela adição de 📁, ✏️ e 🗑️, juntamente com ⭐ e 📌

---

## Ideias futuras

- Importação rápida de questões copiadas do ChatGPT.
- Exportação de dados em `.json`.
- Exportação de flashcards em `.csv`.
- Sistema de revisão por erros.
- Filtros por matéria, tema, acerto e erro.
- Instalação como PWA.
- Uso offline melhorado.
- Sincronização em nuvem.
- Login de usuário.
- Banco de dados online.

---

## Problemas encontrados

Nenhum problema técnico registrado até o momento.

---

## Observações

A v0.1 tem como objetivo preparar a base visual e estrutural do projeto.

O sistema ainda não precisa cadastrar dados reais nesta versão. O foco é deixar a fundação pronta para iniciar o sistema de matérias na v0.2.