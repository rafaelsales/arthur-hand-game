# Mão Sapeca

Mão Sapeca é um jogo onde um personagem que é uma mão cujo objetivo é pegar caixinhas que flutuam no cenário. Uma caixa é capturada quando a mão toca bate na parte dela dando um pulo.

## Características

- O jogo ocorre em um cenário 3D
- O personagem principal é uma luva cheia de água -- no jogo ela é rígida suficiente para ficar em pé
- O jogo é em terceira pessoa, onde o jogador vê a mão por trás dela
- O personagem pode se mover tridimensionalmente no cenário
- O personagem pode pular
- Assim como no Mario, o personagem ganha pontos ao pular e encostar na parte de baixo da caixinha, como se estivesse quebrando ou pegando ela por baixo. Quando isso acontece, a caixa fica cinza
- A quantidade de pontos dentro de cada caixa é aleatória (de 1 a 10, invisível)
- Ao ganhar pontos, a quantidade de pontos é atualizada na tela
- As caixas são fixas em posição flutuante no cenário. A mão pode pular sobre elas.
- As dimensões são definidas em metros.
- O cenário é inspirado no jogo Mario, com fundo azul e paisagem de montanhas.
- O cenário é composto por um plano de chão com textura de grama (exceto quando houver outros tipos de terreno), um plano de céu com textura de céu e um plano de montanhas com textura de montanhas.
- O cenário é iluminado por uma luz direcional (como sol) que está sempre atrás da mão, iluminando tudo que está na frente dela.

# Jogabilidade

- O jogador pode se mover tridimensionalmente no cenário
- Colisões realisticas
- Gravidade da Terra: 9,81 m/s²
- Vento variável em direção e velocidade (entre 0 e 200m/s).
- O jogador pode pular com o botão de pulo

# Características técnicas

- Three.js
- Mobile-first
- On-screen controls (analog-style joystick on the left and a jump button on the right)
- Todo o código é escrito em JavaScript puro (sem TypeScript)
- O jogo é escrito em um único arquivo de cada tipo: HTML, CSS e JavaScript

# Assets

- Na pasta `assets` há um arquivo `hand.glb` que é o modelo 3D da mão - tem 0.18m de altura e 0.18m de largura e 0.07m de profundidade.
  - O arquivo .glb tem 3 animações:
    - `Walking` - caminhada normal quando o joystick está pressionado até a metade da extremidade do joystick.
    - `Running` - caminhada rápida quando o joystick está pressionado a partir da metade da extremidade do joystick.
    - `All_Night_Dance`: pulo.
- Crie uma caixa 3D diretamente no Three.js já que ainda não tenho o modelo 3D da caixa. Tem 0.04m em cada dimensão.
