# Clube Reconecte-se - Sistema de Inscrições

Sistema completo para inscrição na Oficina de Pintura em Tela do Clube Reconecte-se, com página pública, painel administrativo e backend em Google Apps Script conectado ao Google Sheets.

## Arquivos

- `index.html`: página pública de inscrição.
- `admin.html`: painel administrativo.
- `style.css`: identidade visual e responsividade.
- `script.js`: formulário público, máscara de WhatsApp, pagamentos e integração.
- `admin.js`: login, dashboard, filtros e ações administrativas.
- `apps-script.gs`: backend para Google Apps Script.

## Como criar a planilha

1. Acesse o Google Drive.
2. Crie uma nova planilha do Google Sheets.
3. Renomeie para `Clube Reconecte-se - Inscrições`.
4. Não é necessário criar colunas manualmente. O Apps Script cria as colunas automaticamente:
   `Data`, `Hora`, `Nome`, `WhatsApp`, `Status`, `Origem`, `Observações`, `ID`.

## Como instalar o Apps Script

1. Com a planilha aberta, acesse `Extensões > Apps Script`.
2. Apague o conteúdo inicial do editor.
3. Copie o conteúdo de `apps-script.gs`.
4. Cole no editor do Apps Script.
5. Salve o projeto.

## Como publicar como Web App

1. No Apps Script, clique em `Implantar > Nova implantação`.
2. Selecione o tipo `App da Web`.
3. Em `Executar como`, escolha `Eu`.
4. Em `Quem pode acessar`, escolha `Qualquer pessoa`.
5. Clique em `Implantar`.
6. Autorize as permissões solicitadas.
7. Copie a URL gerada do Web App.

## Como conectar ao HTML

Abra `script.js` e altere:

```js
apiUrl: "",
```

para:

```js
apiUrl: "SUA_URL_DO_WEB_APP_AQUI",
```

Enquanto `apiUrl` estiver vazio, o sistema funciona em modo demonstração usando o armazenamento local do navegador. Isso serve apenas para testar o visual e os fluxos antes da publicação.

## Como alterar informações das próximas oficinas

Edite os textos diretamente em `index.html`, principalmente nas áreas:

- Cabeçalho.
- Informações da oficina.
- Itens inclusos.
- Pagamento.
- Mensagem final.

## Como alterar o limite de vagas

No frontend, abra `script.js` e altere:

```js
capacity: 9,
```

No backend, abra `apps-script.gs` e altere:

```js
CAPACITY: 9,
```

Mantenha os dois valores iguais.

## Como alterar link do Mercado Pago

No `index.html`, procure o botão `Pagar com cartão` e altere o valor de `href`:

```html
href="https://mpago.li/1HUCjPr"
```

## Como alterar chave PIX

No `index.html`, altere o texto dentro de:

```html
<strong id="pixKey">(44) 99966-5209</strong>
```

No `script.js`, altere também:

```js
pixKey: "(44) 99966-5209",
```

## Como alterar WhatsApp do comprovante

No `index.html`, procure o botão `Enviar comprovante pelo WhatsApp` e altere:

```html
href="https://wa.link/44toih"
```

## Como alterar data, local e valor

Edite a seção `INFORMAÇÕES DA OFICINA` em `index.html`.

## Como alterar cores

Abra `style.css` e edite as variáveis no início do arquivo:

```css
--crimson: #8c031c;
--rose: #f2486a;
--olive: #718c49;
--orange: #f27405;
--coral: #f26668;
```

## Como alterar senha do painel

No frontend, abra `admin.js` e altere:

```js
password: "reconecte2026",
```

No backend, abra `apps-script.gs` e altere:

```js
ADMIN_PASSWORD: 'reconecte2026',
```

Mantenha os dois valores iguais.

## Como usar o painel

1. Abra `admin.html`.
2. Digite a senha configurada.
3. Acompanhe os cartões do dashboard.
4. Use os filtros por nome, telefone e status.
5. Nas ações da tabela, você pode:
   - Confirmar pagamento.
   - Cancelar inscrição.
   - Mover para lista de espera.
   - Reabrir como aguardando pagamento.
   - Excluir.
   - Abrir WhatsApp.

## Observações importantes

- O visitante não vê contador de vagas.
- Quando houver 9 inscrições com status `Confirmado`, o formulário principal é escondido e a lista de espera aparece.
- Inscrições novas entram como `Aguardando pagamento`.
- A confirmação real da vaga acontece pelo painel administrativo, após conferência do pagamento.
- Sem a URL do Apps Script, os dados ficam apenas no navegador usado no teste.
