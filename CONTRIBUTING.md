# Guia de Contribuição - Equipe de Dados

Bem-vindo ao repositório! Este documento define o fluxo de trabalho unificado para nossa equipe. O objetivo é garantir agilidade sem quebrar o código de produção.

## 1. O Contrato de Autonomia
Cada sub-projeto (`apps/` ou `data-science/`) tem liberdade de stack. No entanto, é **obrigatório** que cada pasta contenha:
1. Um arquivo `README.md` próprio explicando como rodar o ambiente local.
2. Um script de instalação de dependências (ex: `requirements.txt`, `pom.xml` ou `package.json`).

## 2. Estrutura do Repositório (Monorepo)

Este projeto segue a estrutura de **Monorepo por Produto**.

| Diretório | Quem trabalha aqui? | O que contém? |
| :--- | :--- | :--- |
| `apps/backend/` | Dev Backend | API, Lógica de Negócio |
| `apps/frontend/` | Dev Frontend | Interface Web, Dashboards |
| `data-science/` | Cientista de Dados | Notebooks, Treinamento de Modelos, Análises |

---

## 3. Fluxo de Branches (Git Flow Simplificado)

Adotamos um modelo robusto para evitar que erros parem a produção, mas simples o suficiente para nossa equipe.

### As Branches Principais
*   **`main` (Produção):** Contém código estável, testado e pronto para uso/deploy. **Ninguém commita direto aqui.**
*   **`dev` (Integração/Staging):** É a branch de trabalho. Todo PR deve ser apontado para cá. É onde testamos se o Front conversa com o Back e se o Modelo roda na API.

### Regras de Criação de Branch
Sempre crie sua branch a partir da `dev` atualizada. Use os prefixos abaixo:

*   **`feat/nome-da-funcionalidade`**
    *   *Origem:* `dev` | *Destino:* `dev`
    *   *Uso:* Novas features de software (Front ou Back).
*   **`fix/nome-do-erro`**
    *   *Origem:* `dev` | *Destino:* `dev`
    *   *Uso:* Correção de bugs durante o desenvolvimento.
*   **`hotfix/nome-do-erro-critico`**
    *   *Origem:* `main` | *Destino:* `main` E `dev`
    *   *Uso:* **Emergência.** Algo quebrou em produção e precisa de correção imediata.
*   **`exp/nome-do-experimento`**
    *   *Origem:* `dev` | *Destino:* `dev`
    *   *Uso:* **Exclusivo para Data Science**.
    *   *Regra:* Se o experimento falhar, a branch é deletada/arquivada. Se funcionar e for virar produto, abre-se PR para `dev`.
*   **`chore/nome-da-tarefa`**
    *   *Uso:* Limpeza, dependências, configs.

---

## 4. Padrão de Commits

Escreva mensagens claras. Seus commits contam a história do projeto.

**Formato:** `tipo: descrição curta`

*   `feat`: Nova funcionalidade.
*   `fix`: Correção de bug.
*   `exp`: Experimento de IA/Dados.
*   `docs`: Alteração apenas em documentação.
*   `style`: Formatação, ponto e vírgula (sem mudar lógica).
*   `refactor`: Melhoria de código (sem mudar funcionalidade).
*   `test`: Adição ou correção de testes.

✅ **Bons exemplos:**
*   `feat: adiciona gráfico de descarga da bateria`
*   `fix: corrige erro de divisão por zero na API`
*   `exp: treina modelo com janela de 30s`

❌ **Evite:** `ajustes`, `wip`, `arrumando`, `final`

---

## 5. Regras de Ouro para Dados (DVC)

⚠️ **ATENÇÃO:** O Git não foi feito para arquivos grandes (datasets, modelos `.h5`, `.pkl`).

1.  **Nunca dê `git add`** em arquivos de dados/modelos (maiores que 10MB).
2.  Use o DVC para versionar esses arquivos:bash
    ### 1. Rastrear o arquivo grande
    ```bash
    dvc add data-science/models/meu_modelo.h5
    ```

    ### 2. O comando acima cria um arquivo .dvc. ESSE arquivo vai pro Git.
    ```bash
    git add data-science/models/meu_modelo.h5.dvc
    git commit -m "feat: atualiza modelo de bateria v2"
    ```

    ### 3. Enviar o arquivo grande para o storage (S3/SharePoint)
    ``` bash
    dvc push
    ```

---

## 6. Processo de Pull Request (PR)

Nenhuma branch entra na `dev` sem um Pull Request aprovado.

1.  **Abra o PR:** Aponte para a branch `dev`.
2.  **Solicite Revisão:**
    *   **Frontend:** Revisão do Backend + Líder Técnico.
    *   **Backend:** Revisão do Frontend + Líder Técnico.
    *   **Data Science:** Revisão do Líder Técnico.
3.  **Merge:** Só clique em "Squash and Merge" após aprovação.
4.  **Release:** Periodicamente, o Líder Técnico abrirá um PR de `dev` para `main` (Release).

---

## 7. Release e Versionamento

Utilizamos o **Versionamento Semântico (SemVer)** no formato `vMAJOR.MINOR.PATCH` (ex: `v1.2.0`).

### Significado dos Números
*   **MAJOR (`2`.0.0):** **Quebra tudo.** Mudanças incompatíveis (ex: API mudou parâmetros, Modelo exige novas inputs).
*   **MINOR (1.`3`.0):** **Feature Nova.** Adição de funcionalidade ou melhora de modelo mantendo compatibilidade.
*   **PATCH (1.3.`1`):** **Bugfix.** Correções simples de erro.

### Como fazer o Release
O Release é responsabilidade do **Líder Técnico**.

1.  Garanta que a branch `dev` está estável.
2.  Abra um PR de `dev` -> `main`. Título: `Release v1.2.0`.
3.  Após o Merge, crie a tag no Git:
    ```bash
    git checkout main
    git pull
    git tag -a v1.2.0 -m "Release da funcionalidade X e Modelo Y"
    git push origin v1.2.0
    ```


---