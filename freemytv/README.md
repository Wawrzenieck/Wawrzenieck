# Free My TV — versão Murici + Maceió

Versão personalizada do [Free My TV](https://github.com/simbasjungles/free-my-tv) para a TV TCL (Google TV).

- Base: `simbasjungles/free-my-tv` @ `a9e10278b20de9e5700eeacb1503bca8145f220d` (v1.3.0)
- **Tela "vidro"** (`home_style=glass`): pôr do sol desenhado pelo app, menu lateral de vidro, apps por
  categoria (Início, Apps, Filmes e Séries, TV ao Vivo, Jogos, Música, Configurações) e favoritos (segure OK).
- Clima de **duas cidades** — Murici (principal, também define o tema dia/noite) e Maceió —
  na tela inicial, no cartão de clima da gaveta e na tela de descanso.
- `config.properties`: configurações usadas no build (sem nenhuma chave).
- `murici-maceio.patch`: as mudanças no código, aplicáveis com `git apply` sobre o commit acima.
- `FreeMyTV.apk`: o app compilado (SHA-256 `ffdceb4bb6bcfbe18bad9908ab44cc00279e816701845e4b6b37620b2af7d728`).

Assinado com uma chave própria (não a do projeto): atualizações automáticas da versão oficial
não se aplicam; para atualizar, refaça o build com o patch e a mesma chave.
