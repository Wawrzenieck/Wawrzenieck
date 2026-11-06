# Free My TV — versão Murici + Maceió

Versão personalizada do [Free My TV](https://github.com/simbasjungles/free-my-tv) para a TV TCL (Google TV).

- Base: `simbasjungles/free-my-tv` @ `a9e10278b20de9e5700eeacb1503bca8145f220d` (v1.3.0)
- Mudança: clima de **duas cidades** — Murici (principal, também define o tema dia/noite) e Maceió —
  na tela inicial, no cartão de clima da gaveta e na tela de descanso.
- `config.properties`: configurações usadas no build (sem nenhuma chave).
- `murici-maceio.patch`: as mudanças no código, aplicáveis com `git apply` sobre o commit acima.
- `FreeMyTV.apk`: o app compilado (SHA-256 `370f914299a9302c4cb5dfd4c28d8b895bcaccc98874da5d20e623fe2a3397f4`).

Assinado com uma chave própria (não a do projeto): atualizações automáticas da versão oficial
não se aplicam; para atualizar, refaça o build com o patch e a mesma chave.
