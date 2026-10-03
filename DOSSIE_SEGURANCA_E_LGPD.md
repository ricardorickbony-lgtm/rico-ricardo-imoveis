# 🛡️ Dossiê de Segurança Cibernética, Governança & LGPD
### Sistema SaaS & CRM de Gestão Imobiliária de Alta Performance
**Padrão Oficial de Engenharia: Severino & Ricardo • Impacto Digital**  
*Documento Técnico e Comercial para Apresentação a Diretorias, Departamentos Jurídicos e DPOs*

---

## 1. Resumo Executivo
No mercado imobiliário moderno, a informação é o ativo mais valioso de uma empresa. Uma imobiliária lida diariamente com dados ultra-sensíveis: **patrimônio imobiliário de famílias, contratos de locação, chaves PIX de proprietários, CPFs de inquilinos e listas exclusivas de clientes investidores**.

A maioria dos sistemas disponíveis no mercado brasileiro opera sobre plataformas desatualizadas, sem trilhas de auditoria e com risco iminente de perda de dados por erro humano ou invasão externa.

Este sistema foi projetado sob os mais rigorosos padrões internacionais de segurança da informação (**OWASP Top 10, SOC 2 Type II e LGPD — Lei Federal nº 13.709/2018**), entregando uma solução **blindada, auditável e imutável**.

---

## 2. As 7 Camadas de Blindagem do Sistema

### Camada 1: Imutabilidade de Código na Nuvem & CDN Global
* **Hospedagem em Cluster Global de Borda (Edge):** O sistema não utiliza servidores tradicionais com portas abertas de SSH, FTP ou bancos MySQL vulneráveis expostos na internet.
* **Sem Riscos de "Pichação" ou Invasão por Plugins:** Ao contrário de 90% dos sites em WordPress que sofrem invasões por plugins desatualizados, a nossa arquitetura é compilada e imutável. Um concorrente ou hacker externo não possui meio técnico para alterar ou deletar os arquivos do portal.

---

### Camada 2: Escudo Ativo Anti-Força Bruta (*Anti-Brute Force Lockout*)
* **Proteção contra Robôs e Dicionários de Senhas:** Tentativas automatizadas de invasão para adivinhar a senha mestra são neutralizadas na raiz.
* **Bloqueio Automático:** Ao atingir **5 tentativas incorretas consecutivas**, o sistema trava imediatamente o acesso por **15 minutos**.
* **Alerta Pericial:** O incidente é imediatamente registrado na Trilha de Auditoria como *Tentativa de Ataque Bloqueada*, acompanhado de data, hora e registro pericial.

---

### Camada 3: Controle de Acesso por Perfis (RBAC — Role-Based Access Control)
Hierarquia estrita de permissões que protege o segredo de negócio da imobiliária:

| Nível Operacional | O Que Visualiza | O Que Fica Protegido / Oculto |
| :--- | :--- | :--- |
| 👑 **Diretor (Master)** | Acesso irrestrito a todos os imóveis, comissões brutas, repasses bancários e expurgo de dados. | Nenhuma restrição. Acesso de governança plena. |
| 👔 **Gerente** | Funil de todos os corretores, aprovação de vistorias técnicas e contratos ativos. | Documentos pessoais de locadores são parcialmente mascarados (`123.•••.•••-00`). |
| 💼 **Corretor** | Catálogo de imóveis e atendimento dos seus próprios leads no Pipeline Kanban. | **Tarja de Sigilo Absoluto** em repasses financeiros, contas bancárias e PIX de proprietários. |

---

### Camada 4: Lixeira Segura com *Soft Delete* (Retenção de 30 Dias)
* **Zero Risco de Prejuízo por Clique Acidental:** Nenhum imóvel, proposta ou lead de cliente é excluído definitivamente por um simples clique.
* **Isolamento de Segurança:** Ao ser "deletado", o registro sai da vitrine pública do site e dos feeds dos portais (ZAP, VivaReal, OLX), mas é transferido para o cofre da **Lixeira Segura**.
* **Restauração em 1 Clique:** A Diretoria tem até 30 dias para restaurar qualquer imóvel ou contato com histórico 100% preservado.

---

### Camada 5: Trilha de Auditoria Forense Inviolável (*Audit Trail*)
* **Registro em Tempo Real de Todas as Ações Operacionais:**
  * Logins e encerramentos de sessão com carimbo de autor;
  * Alterações de preços de venda ou aluguel;
  * Mudanças de status para "Vendido" ou "Alugado";
  * Emissão de laudos de vistoria digital de entrada e saída;
  * Geração de contratos de locação e relatórios financeiros;
  * Movimentações na Lixeira Segura.
* **Exportação Oficial em CSV:** A Diretoria pode gerar relatórios de auditoria a qualquer momento com cabeçalho pericial para apresentar a auditorias contábeis ou processos jurídicos.

---

### Camada 6: Gestor de Senha Mestra com Avaliação de Força
* **Eliminação de Senhas Vulneráveis:** Alerta em destaque no painel caso a credencial de demonstração ainda esteja em uso.
* **Medidor de Entropia Dinâmica:** Exige e orienta a criação de senhas fortes calculando números, maiúsculas e símbolos especiais para garantir nível de proteção máxima.

---

### Camada 7: Auto-Logout por Inatividade (Anti-Espionagem de Salão)
* **Proteção de Espaço Físico:** Se um corretor ou funcionário deixar o computador destravado no salão de vendas e se ausentar, o sistema encerra a sessão automaticamente após **30 minutos sem movimento**.
* **Prevenção contra Olhar por Cima do Ombro (*Shoulder Surfing*):** Impede que terceiros, estagiários ou clientes em visita visualizem dados sigilosos no balcão de atendimento.

---

## 3. Conformidade com a LGPD (Lei Federal nº 13.709/2018)

| Exigência Legal da LGPD | Como o Nosso Sistema Atende |
| :--- | :--- |
| **Art. 6º (Princípio da Segurança e Confidencialidade)** | Dados bancários, chaves PIX e documentos de identidade possuem blindagem visual seletiva por perfil de acesso. |
| **Art. 18 (Direito à Eliminação e Expurgo de Dados)** | Função de expurgo permanente autorizada exclusivamente pela Diretoria Master com registro na trilha de auditoria. |
| **Art. 37 (Registro das Operações de Tratamento)** | Trilha de Auditoria (*Audit Trail*) inalterável registrando quem acessou, modificou ou restaurou qualquer dado pessoal. |
| **Art. 46 (Medidas de Segurança Técnicas e Administrativas)** | Criptografia em trânsito (TLS 1.3), isolamento em sandbox de dados e autenticação protegida por rate limiting. |

---

## 4. Tabela Comparativa de Mercado

| Recurso de Segurança | Sites e CRMs Convencionais | Nosso Sistema SaaS |
| :--- | :---: | :---: |
| **Proteção contra Hackers / Concorrentes** | ❌ Alta vulnerabilidade (bancos expostos) | ✅ **100% Blindado (CDN Imutável)** |
| **Escudo Anti-Força Bruta (Rate Limiting)** | ❌ Inexistente (permite ataques de robôs) | ✅ **Trava após 5 erros com 15 min de bloqueio** |
| **Proteção contra Exclusão Acidental** | ❌ Apagou, perdeu para sempre | ✅ **Lixeira Segura com retenção de 30 dias** |
| **Trilha de Auditoria Forense em Tempo Real** | ❌ Não possui ou cobra módulos caros | ✅ **Nativa com exportação oficial em CSV** |
| **Mascaramento Bancário de Proprietários** | ❌ Qualquer usuário vê dados do PIX | ✅ **Protegido por perfil RBAC (Diretor/Gerente)** |
| **Auto-Logout por Inatividade** | ❌ Sessões ficam abertas dias a fio | ✅ **Encerra em 30 min sem uso** |

---

## 5. Roteiro de Apresentação Comercial para Fechamento de Vendas

Use estes argumentos de impacto nas reuniões com os proprietários da imobiliária:

> 💬 **Argumento 1 — Proteção da Carteira de Clientes:**  
> *"Doutor, você sabia que na maioria dos sistemas qualquer corretor consegue ver ou exportar a lista inteira dos proprietários e chaves PIX da imobiliária? No nosso sistema, o corretor só atende o lead dele; os dados bancários dos donos dos imóveis ficam sob sigilo absoluto."*

> 💬 **Argumento 2 — O Fim do Erro Humano:**  
> *"Se um estagiário ou corretor novo apertar para excluir uma cobertura de R$ 5 milhões por engano, você não perde nada. O imóvel vai para uma Lixeira Segura de 30 dias e você restaura com um único clique na sua mesa."*

> 💬 **Argumento 3 — Segurança Jurídica Total (Audit Trail):**  
> *"Se algum dia houver qualquer dúvida sobre quem alterou o valor de um imóvel de R$ 1 milhão para R$ 800 mil, ou quem cadastrou um contrato, o nosso sistema tem uma Trilha de Auditoria inviolável que exporta relatórios periciais em CSV prontos para o seu advogado ou contador."*

---
*Desenvolvido sob medida para Imobiliárias e Administradoras de Alto Padrão.*  
**Ricardo & Severino • Engenharia Digital de Alto Impacto**
