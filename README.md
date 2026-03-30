# Notes App — Aplicativo de Notas Markdown com Acrílico

Uma aplicação de anotações minimalista que combina um editor Markdown em tempo real com uma interface moderna que aproveita efeitos de transparência (acrílico / vibrancy) quando executada como app de desktop via Tauri.

Este README serve como documentação: descreve o projeto, funcionalidades, arquitetura, tecnologias utilizadas e instruções completas para rodar, desenvolver e empacotar o aplicativo.

Índice
- [O que é este projeto](#o-que-é-este-projeto)
- [Funcionalidades principais](#funcionalidades-principais)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Arquitetura e pontos-chave do código](#arquitetura-e-pontos-chave-do-código)
- [Estrutura do repositório (visão rápida)](#estrutura-do-repositório-visão-rápida)
- [Como rodar (desenvolvimento e build)](#como-rodar-desenvolvimento-e-build)
- [Guia de uso — operações de arquivo](#guia-de-uso---operações-de-arquivo)
- [Customização visual (Acrílico / Blur)](#customização-visual-acrílico--blur)
- [Limitações e melhorias sugeridas](#limitações-e-melhorias-sugeridas)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## O que é este projeto

O Notes App é um editor de notas baseado em Markdown pensado para uso local (privado). Ele oferece edição em tempo real, visualização ao vivo, gerenciamento de arquivos locais e integração nativa com o sistema operacional para efeitos visuais (vibrancy/acrylic) e controles de janela personalizados.

Foco: simplicidade, performance e integração nativa (Tauri + Rust) com a interface moderna em React + TypeScript.

## Funcionalidades principais

- Editor Markdown em tempo real com pré-visualização (via `@uiw/react-md-editor`).
- Explorador de arquivos (File Tree) que trabalha diretamente sobre uma pasta workspace local.
- Criação de arquivos e pastas (inline), com template inicial para novos arquivos `.md`.
- Drag'n'drop para mover arquivos entre pastas.
- Menu de contexto (clique direito) na árvore: **Copiar**, **Colar**, **Excluir** (suporta exclusão recursiva de pastas).
- Operação de copiar/colar com prevenção de colisão de nomes (gera `-copyN` quando necessário).
- Barra lateral redimensionável (arraste para ajustar largura, persistida em `localStorage`).
- Auto-save com debounce: edições são salvas automaticamente após curto atraso.
- Barra de título personalizada (controle de janela integrado ao Tauri) e janela transparente para efeito acrílico.
- Filtros: a árvore mostra por padrão apenas pastas e arquivos `.md`.

## Tecnologias utilizadas

- Frontend: `React` + `TypeScript` (via Vite).
- Estilos: Tailwind CSS (importado), além de CSS customizado em `src/index.css`.
- Estado global: `zustand`.
- Editor Markdown: `@uiw/react-md-editor`.
- Ícones: `lucide-react`.
- Desktop / Shell: `Tauri` (Rust) para empacotamento, integração com o sistema de arquivos e diálogo nativo.
- Plugins Tauri: `tauri-plugin-fs` (I/O), `tauri-plugin-dialog` (confirm dialogs), `tauri-plugin-opener`.
- Efeito de vibrancy / blur: `window-vibrancy` (aplicado no código Rust, suporte a macOS/windows conforme biblioteca).

## Arquitetura e pontos-chave do código

- Frontend (UI): `src/` — componentes React responsáveis pela UI.
   - Componentes principais: `src/components/Sidebar.tsx`, `src/components/FileTree.tsx`, `src/components/Editor.tsx`, `src/components/CustomTitleBar.tsx`.
   - Estado global: `src/store/useAppStore.ts` — guarda workspace atual, arquivo aberto, largura da sidebar, clipboard interno, etc.
   - Estilos globais e variáveis CSS: `src/index.css` (onde estão as variáveis de acrílico/blur e tema).

- Backend (Tauri/Rust): `src-tauri/` — integrações nativas.
   - `src-tauri/src/lib.rs` — aplica vibrancy/blur em Windows/macOS e inicializa o builder do Tauri.
   - `src-tauri/tauri.conf.json` — configuração da janela (transparente, sem decorações) e comandos de build/dev.

# Operações de arquivo
- A árvore usa `tauri-plugin-fs` para: leitura de diretórios, criar pastas, escrever arquivos, renomear/mover e remover (remoção recursiva implementada para pastas).

## Estrutura do repositório (visão rápida)

```
├─ src/                   # Frontend (React)
│  ├─ components/         # Sidebar, FileTree, Editor, Titlebar
│  ├─ store/              # Zustand global store (useAppStore.ts)
│  ├─ index.css           # Variáveis CSS e estilo global
│  └─ ...
├─ src-tauri/             # Código Rust e configuração Tauri
│  ├─ src/
│  └─ tauri.conf.json
├─ package.json
└─ README.md
```

## Como rodar (desenvolvimento e build)

Pré-requisitos
- Node.js (v18+)
- npm (ou yarn/pnpm)
- Rust toolchain (cargo) para executar/compilar a parte Tauri
- Ferramentas de build nativas (Windows: Visual Studio Build Tools / MSVC)

Passos rápidos (desenvolvimento)

1. Instale dependências:

```bash
npm install
```

2. Inicie apenas o frontend (Vite) — útil para desenvolvimento UI isolado:

```bash
npm run dev
# abre o frontend em http://localhost:5173 (ou porta configurada)
```

3. Para executar o app desktop completo (frontend + Tauri):

- Com o cargo (recomendado se você tem Rust instalado):

```bash
cargo tauri dev
```

- Ou via npm script (se preferir delegar ao binário instalado localmente):

```bash
npm run tauri -- dev
```

Build para produção

```bash
npm run build
cargo tauri build
```

Observações
- O campo `devUrl` em `src-tauri/tauri.conf.json` define a URL do frontend em modo de desenvolvimento (o Tauri abre a janela apontando para essa URL durante `tauri dev`).

## Guia de uso — operações de arquivo (resumo)

- Abrir workspace: selecione a pasta que contém suas notas (persistida localmente).
- Navegação: árvore de arquivos à esquerda lista pastas e arquivos `.md`.
- Criar nova nota/pasta: use os botões no cabeçalho da sidebar (criação inline aparece na árvore).
- Mover arquivos: arraste arquivos sobre pastas dentro da árvore.
- Copiar / Colar: clique com o botão direito sobre arquivo ou pasta → **Copiar**; vá até pasta alvo e **Colar**.
- Excluir: clique com o botão direito → **Excluir** (confirmação nativa, remoção recursiva para pastas).
- Redimensionar sidebar: arraste a borda direita da sidebar; largura é armazenada em `localStorage`.
- Editor: as edições são salvas automaticamente (auto-save com debounce); histórico de salvamento indicado na barra de ferramentas.

## Customização visual (Acrílico / Blur)

- Variáveis CSS principais: `src/index.css`. Ajuste:
   - `--panel-backdrop` (controla `backdrop-filter`, ex.: `blur(14px) saturate(130%)`).
   - `--panel-bg-acrylic` e `--panel-bg` (tons e opacidade das camadas translucidas).

- Ponto nativo: `src-tauri/src/lib.rs` aplica `apply_vibrancy` (macOS) ou `apply_blur` (Windows). Alterações ali controlam comportamento nativo.

## Limitações e melhorias sugeridas

- A árvore de arquivos atualmente lista apenas arquivos `.md` e pastas — isso é intencional para focar nas notas.
- A cópia de diretórios replica apenas arquivos `.md` (evita copiar binários automaticamente).
- Ainda não há funcionalidade de "Cortar" (mover via contexto); apenas copiar/colar e arrastar/mover estão disponíveis.
- Recomendação: adicionar opção de sobrescrever ao colar e progress indicator para operações grandes.

## Contribuindo

1. Abra uma issue descrevendo a proposta/bug.
2. Crie um branch com a sua feature/bugfix.
3. Envie um pull request com descrição clara e testes quando aplicável.

Dicas para desenvolvedores
- Componentes UI importantes: [src/components/Sidebar.tsx](src/components/Sidebar.tsx), [src/components/FileTree.tsx](src/components/FileTree.tsx), [src/components/Editor.tsx](src/components/Editor.tsx).
- Estado global: [src/store/useAppStore.ts](src/store/useAppStore.ts).
- Efeito nativo (vibrancy): [src-tauri/src/lib.rs](src-tauri/src/lib.rs).

## Licença

Este repositório não contém um arquivo `LICENSE`. Se pretende publicar em GitHub e permitir contribuições, adicione um arquivo de licença (por exemplo MIT, Apache-2.0, etc.).

## Agradecimentos

- Projeto usa Tauri, React, @uiw/react-md-editor e outras bibliotecas excelentes — obrigado às comunidades por suas ferramentas.

---

Se quiser, eu posso:
- adicionar um LICENSE (sugira qual),
- gerar um CHANGELOG básico,
- ou abrir PRs com melhorias pontuais (ex.: suporte a "Cortar" no menu de contexto, cópia completa de binários, ou confirmação de sobrescrita ao colar).

Quer que eu adicione algum desses pontos agora? 
