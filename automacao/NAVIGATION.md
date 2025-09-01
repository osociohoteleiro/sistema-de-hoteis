# Sistema de Navegação - OSH Automação

## Estrutura do Layout

### Header Principal
- **Logo e Branding**: OSH Automação com ícone
- **Navegação Principal**: Dashboard, Editor de Fluxo, Relatórios, Configurações
- **Search**: Busca de fluxos (desktop)
- **Notificações**: Sino com badge de alertas
- **Perfil**: Menu de usuário
- **Mobile**: Menu hambúrguer responsivo

### Navegação
- **Dashboard** (`/`) - Visão geral dos fluxos e métricas
- **Editor de Fluxo** (`/flow-builder`) - Criar e editar fluxos de automação
- **Relatórios** (`/reports`) - Analytics e relatórios (em desenvolvimento)
- **Configurações** (`/settings`) - Configurações do sistema (em desenvolvimento)

### Layout Responsivo
- **Desktop**: Menu horizontal completo
- **Mobile**: Menu hambúrguer com navegação vertical

### Status Bar
- Status do sistema (online/offline)
- Versão da aplicação
- Última atualização

## Componentes

### Layout (`/src/components/Layout/Layout.jsx`)
- Header com navegação
- Gerenciamento de estado do menu mobile
- Indicação de página ativa
- Status bar inferior

### Integração
- Todas as páginas são envolvidas pelo Layout
- Estado de navegação centralizado
- Design consistente em toda a aplicação

## Funcionalidades

### Navegação Ativa
- Destaque visual da página atual
- Breadcrumb dinâmico no header
- Indicadores de status

### Responsive Design
- Adaptação automática para mobile
- Menu hambúrguer em telas pequenas
- Layout otimizado para diferentes resoluções

### Acessibilidade
- Navegação por teclado
- ARIA labels
- Tooltips descritivos