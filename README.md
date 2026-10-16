# PS4 Smart Controller Startup

Interface web estática de inicialização que verifica os controles conectados por cabo USB e mostra quais estão disponíveis. Feita para ser aberta pelo navegador de um PlayStation 4 desbloqueado, sem servidor, sem banco de dados e sem dependências externas.

> **Aviso importante**
> Este projeto é apenas uma interface web. Ele **não** liga um DualShock 4 desligado, **não** controla o sistema do console e **não** faz acesso USB de baixo nível. A inicialização automática e o acesso USB cru exigem recursos adicionais compatíveis com o PS4 desbloqueado. O site funciona apenas quando o navegador do console o abre e quando a Gamepad API está disponível.

## Recursos

- Tema escuro inspirado na interface do PS4.
- Animação de inicialização.
- Título "PS4 SMART CONTROLLER STARTUP".
- Mensagem "Verificando controles conectados...".
- Cartões por controle com estado **conectado**, **aguardando ativação** e **desconhecido**.
- Botão **TENTAR NOVAMENTE** e botão **CONTINUAR** (habilitado só quando há controle utilizável).
- Navegação por direcional, X e círculo via Gamepad API quando suportada.
- Atualização em tempo real sem recarregar a página.
- Nenhum dado simulado: só é exibido o que o navegador reconhece.

## Estrutura do repositório

```text
ps4-smart-controller-startup/
├── index.html
├── README.md
├── LICENSE
├── .nojekyll
└── assets/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── app.js
    │   └── controller.js
    └── images/
        └── controller.svg
```

## Publicação no GitHub Pages

1. Crie um repositório público chamado `ps4-smart-controller-startup`.
2. Envie todos os arquivos para a raiz do repositório (mantendo a pasta `assets/`).
3. Abra **Settings → Pages**.
4. Em **Source**, selecione **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`.
6. Salve e aguarde a publicação.
7. Acesse `https://SEU-USUARIO.github.io/ps4-smart-controller-startup/`.

### Atualizando o site

Basta enviar novos commits para a branch `main`. O GitHub Pages republica automaticamente. Em geral leva de alguns segundos a poucos minutos.

## Limitações reais

- O site **não** liga um controle desligado. O usuário precisa pressionar o botão PS.
- O navegador pode não reconhecer um dispositivo USB imediatamente; nesse caso, use **TENTAR NOVAMENTE**.
- Se a Gamepad API não existir no navegador do PS4, o site exibe uma mensagem explicando a limitação.
- Não há backend, chaves secretas ou tokens.

## Licença

MIT — veja `LICENSE`.
