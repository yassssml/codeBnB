## Requisitos

### 1.1 Requisitos Funcionais do Sistema

| ID | Requisito | Descrição |
| --- | --- | --- |
| RF01 | Realizar Login | Permitir que um usuário cadastrado acesse o sistema informando nome e senha válidos. |
| RF02 | Exibir Tela Principal | Apresentar a página inicial com acesso às funcionalidades do sistema após autenticação. |
| RF03 | Cadastrar | Permitir o cadastro de clientes, imóveis e aluguéis com dados válidos e consistentes. |
| RF04 | Consultar | Permitir a visualização e busca dos registros cadastrados por nome, CPF ou outros filtros relevantes. |
| RF05 | Atualizar | Permitir a edição de informações já cadastradas em clientes, imóveis e aluguéis. |
| RF06 | Pesquisar Registros | Permitir a busca por registros específicos para facilitar a localização rápida de dados. |
| RF07 | Excluir | Permitir a remoção de registros existentes, respeitando regras de integridade e dependências. |
| RF08 | Encerrar Login | Permitir que o usuário finalize a sessão e seja redirecionado para a página de login. |
| RF09 | Gerenciar Clientes | Registrar e manter os dados pessoais dos clientes, incluindo CPF, endereço e celular. |
| RF10 | Gerenciar Imóveis | Registrar e manter os imóveis vinculados aos clientes para controle do patrimônio. |
| RF11 | Gerenciar Aluguéis | Registrar datas e relacionar imóveis aos aluguéis correspondentes. |

### 1.2 Requisitos Não Funcionais

| ID | Requisito | Descrição |
| --- | --- | --- |
| RNF01 | Proteção de Dados | As senhas e dados sensíveis devem ser armazenados e tratados com segurança, utilizando hash e criptografia. |
| RNF02 | Integridade dos Dados | O sistema deve impedir registros duplicados e manter a consistência das relações entre clientes, imóveis e aluguéis. |
| RNF03 | Controle de Acesso | Apenas usuários autenticados podem acessar áreas internas do sistema, evitando navegação sem sessão válida. |
| RNF04 | Desempenho | As operações de consulta e cadastro devem responder de forma rápida e eficiente em volumes pequenos e médios de dados. |
| RNF05 | Usabilidade | A interface deve ser intuitiva, com formulários claros e feedback visual para ações realizadas com sucesso ou erro. |

## 2 Requisitos de Infraestrutura

| Tecnologia | Versão / ambiente |
| --- | --- |
| JavaScript | Node.js 24 |
| Next.js | 16 |
| React e React DOM | 19 |
| bcryptjs | 3 |
| jsonwebtoken | 9 |
| node:crypto | Integrado ao Node.js |
| PostgreSQL | 18 |
| Prisma e Prisma Client | 6 |
| Ant Design | 6 |

## 3 Contexto do Sistema

O sistema foi desenvolvido para controlar operações básicas de uma imobiliária, incluindo autenticação de usuários, cadastro de clientes, gerenciamento de imóveis e registro de aluguéis. A aplicação utiliza Next.js para a interface web, Prisma para a persistência de dados em PostgreSQL e Ant Design para a composição de telas e componentes interativos.
