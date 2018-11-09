import * as React from 'react';
import './App.scss';
import { Rect } from './components/Rect';
import Sprite from './components/Sprite';
import SpriteMapper from './components/SpriteMapper';

const JUMP_FORCE = 1.9;
const GRAVITY_FORCE = 0.007;
const GROUND_SPEED = 15;
const INITIAL_PLAYER_POSITION = 331;
const INITIAL_PLAYER_LEFT = 80;

const KEYCODES = {
  DOWN: 40,
  SPACE: 32,
  UP: 38,
};

const lpad = (num: number, fill: string | number, length: number) => {
  const numString = num.toString();
  return new Array(length)
    .fill(fill)
    .concat(numString.split(''))
    .slice(-Math.max(length, numString.length))
    .join('');
};

const cuts = [
  new Rect(0, 0, 75, 70),
  new Rect(75, 0, 90, 100),
  new Rect(165, 0, 95, 100),
  new Rect(260, 5, 90, 62),
  new Rect(350, 5, 90, 62),
  new Rect(440, 0, 40, 70),
  new Rect(480, 0, 68, 70),
  new Rect(548, 0, 100, 70),
  new Rect(648, 0, 55, 100),
  new Rect(703, 0, 100, 100),
  new Rect(803, 0, 150, 100),
  new Rect(953, 25, 385, 50),
  new Rect(1338, 0, 88, 100),
  new Rect(1426, 0, 88, 100),
  new Rect(1514, 0, 88, 100),
  new Rect(1602, 0, 88, 100),
  new Rect(1690, 0, 88, 100),
  new Rect(1778, 0, 88, 100),
  new Rect(1866, 40, 118, 50),
  new Rect(1984, 40, 118, 50),
  new Rect(2, 101, 99999999999, 30),
];

const sequences = {
  refreshButton: [0],
  // tslint:disable-next-line:object-literal-sort-keys
  iddle: [1],
  cloud: [2],
  flyingEnemy: [3, 3, 3, 4, 4, 4],
  smallCactus1: [5],
  smallCactus2: [6],
  smallCactus3: [7],
  bigCactus1: [8],
  bigCactus2: [9],
  bigCactus3: [10],
  gameOver: [11],
  iddle2: [12, 13],
  run: [14, 14, 14, 15, 15, 15],
  die: [16, 17],
  loweredRun: [18, 19],
  ground: [20],
};

class App extends React.Component {
  jumpTimeout?: NodeJS.Timeout;

  state = {
    activeSequence: 'iddle',
    cactus: [
      {
        sequence: 'smallCactus1',
        x:
          Math.random() * document.body.offsetWidth +
          document.body.offsetWidth / 2,

        y: 355,
      },
      {
        sequence: 'smallCactus2',
        x:
          Math.random() * document.body.offsetWidth + document.body.offsetWidth,
        y: 355,
      },
      {
        sequence: 'smallCactus3',
        x:
          Math.random() * document.body.offsetWidth +
          document.body.offsetWidth * 2,
        y: 355,
      },
    ],
    cloud: [
      {
        speed: 5,
        x: document.body.offsetWidth,
        y: 230,
      },
      {
        speed: 1.5,
        x: 500,
        y: 300,
      },
    ],
    falling: false,
    fps: 30,
    gameOver: false,
    invertColor: false,
    jumpForce: 0,
    jumpStartTime: 0,
    play: false,
    position: INITIAL_PLAYER_POSITION,
    pterodactyl: [
      {
        x: document.body.offsetWidth * Math.random() * 15,
        y: 280,
      },
    ],
    runnerFPS: 30,
    score: 0,
  };

  constructor(props: any) {
    super(props);
    this.setControls();
    setInterval(() => {
      if (!this.state.play) {
        return;
      }

      this.setState({
        ...(+this.state.runnerFPS.toFixed(1) % 50 === 0
          ? {
              invertColor: !this.state.invertColor,
            }
          : {}),
        runnerFPS: this.state.runnerFPS + 0.1,
        score: Math.ceil(this.state.score + 0.01 * this.state.runnerFPS),
      });
    }, 100);
  }

  setControls = () => {
    document.addEventListener('keydown', e => {
      const { play, jumpForce, gameOver } = this.state;
      if (gameOver) {
        return window.location.reload();
      }

      switch (e.which) {
        case KEYCODES.SPACE:
        case KEYCODES.UP:
          if (!play) {
            return this.play();
          }
          if (jumpForce === 0) {
            return this.jump();
          }
          return;
        case KEYCODES.DOWN:
          !play ? this.play() : this.lower();
          return;
        default:
          return;
      }
    });

    document.addEventListener('keyup', e => {
      const { falling, gameOver } = this.state;
      if (gameOver) {
        return;
      }

      switch (e.which) {
        case KEYCODES.SPACE:
        case KEYCODES.UP:
          return this.jump(true);
        default:
          if (!falling) {
            return this.run();
          }
      }
    });
  };

  gameOver = () => {
    if (this.state.play) {
      setTimeout(
        () =>
          this.setState({
            activeSequence: 'die',
            gameOver: true,
            play: false,
          }),
        0,
      );
    }
  };

  play = () => {
    if (!this.state.play) {
      this.setState(
        {
          activeSequence: 'run',
          play: true,
        },
        () => this.gravity(),
      );
    }
  };

  run = () => {
    this.setState({
      activeSequence: 'run',
      falling: false,
      jumpForce: 0,
      position: INITIAL_PLAYER_POSITION,
    });
  };

  jump = (fall?: boolean) => {
    const { jumpStartTime, fps, falling, jumpForce } = this.state;
    if (!falling && !fall) {
      this.setState({
        activeSequence: 'iddle2',
        jumpForce: -JUMP_FORCE,
        jumpStartTime: Date.now(),
        position: INITIAL_PLAYER_POSITION,
      });
      this.jumpTimeout = setTimeout(() => this.jump(true), 120);
    } else if (fall && !falling) {
      clearTimeout(this.jumpTimeout!);

      const timeAdjust = Date.now() - 120 - (jumpStartTime || Date.now());
      const initialForce = jumpForce * Math.min(0, timeAdjust);

      this.setState({
        falling: true,
        jumpForce: jumpForce + initialForce / 4 / fps,
        jumpStartTime: 0,
      });
    }
  };

  lower = () => {
    this.setState({
      activeSequence: 'loweredRun',
      position: Math.min(
        INITIAL_PLAYER_POSITION + 42,
        this.state.position + 42,
      ),
    });
  };

  gravity = () => {
    const { jumpForce, fps, position, play, falling } = this.state;

    const newPosition = position + jumpForce * fps;
    if (newPosition < INITIAL_PLAYER_POSITION) {
      const newJumpForce = jumpForce + GRAVITY_FORCE * fps;
      this.setState({
        jumpForce: newJumpForce,
        position: newPosition,
      });
    } else if (falling) {
      this.run();
    }

    if (play) {
      setTimeout(this.gravity, 1000 / fps);
    }
  };

  render() {
    const {
      play,
      activeSequence,
      fps,
      cloud,
      cactus,
      runnerFPS,
      pterodactyl,
      score,
      position,
      gameOver,
      invertColor,
    } = this.state;

    return (
      <div
        className="App"
        style={{
          filter: `invert(${+invertColor})`,
        }}
      >
        <div className="title">React to this T-Rex!</div>
        <div className="sub-title">SCORE: {lpad(score, 0, 5)}</div>

        <SpriteMapper
          src="/images/t-rex-sprite.png"
          cuts={cuts}
          sequences={sequences}
          fps={fps}
        >
          {cloud.map((e, i) => (
            <Sprite
              key={i}
              play={play}
              sequence="cloud"
              movingX={-e.speed}
              y={e.y}
              x={e.x}
              fps={runnerFPS}
              onDisappear={this.onDisappearCloud(i)}
            />
          ))}

          {cactus.map((e, i) => (
            <Sprite
              key={i}
              play={play}
              sequence={e.sequence}
              movingX={-GROUND_SPEED}
              y={e.y}
              x={e.x}
              fps={runnerFPS}
              hitTest={{
                position: { x: INITIAL_PLAYER_LEFT, y: position },
                rect: cuts[sequences[activeSequence][0]],
              }}
              onHit={this.gameOver}
              onDisappear={this.onDisappearCactus(i)}
            />
          ))}

          {pterodactyl.map((e, i) => (
            <Sprite
              key={i}
              play={play}
              sequence="flyingEnemy"
              movingX={-(1.2 * runnerFPS)}
              y={e.y}
              x={e.x}
              fps={18}
              hitTest={{
                position: { x: INITIAL_PLAYER_LEFT, y: position },
                rect: cuts[sequences[activeSequence][0]],
              }}
              onHit={this.gameOver}
              onDisappear={this.onDisappearPterodactyl(i)}
            />
          ))}

          <Sprite
            play={play}
            sequence={activeSequence}
            y={position}
            x={INITIAL_PLAYER_LEFT}
          />

          {gameOver ? (
            <Sprite
              sequence="gameOver"
              y={200}
              x={
                document.body.offsetWidth / 2 -
                cuts[sequences.gameOver[0]].width / 2
              }
            />
          ) : null}

          <Sprite
            play={play}
            sequence="ground"
            y={400}
            movingX={-GROUND_SPEED}
            fps={runnerFPS}
          />
        </SpriteMapper>
      </div>
    );
  }

  private onDisappearCloud = (cloudIndex: number) => () => {
    const { cloud } = this.state;
    cloud[cloudIndex].x = document.body.offsetWidth + Math.random() * 300;
    cloud[cloudIndex].y = 200 + Math.random() * 150;
    cloud[cloudIndex].speed = 1 + Math.random() * 6;

    this.setState({});
  };

  private onDisappearCactus = (cactusIndex: number) => () => {
    const { cactus } = this.state;
    const otherCactus = [...cactus].sort((a, b) => (a.x < b.x ? 1 : -1))[0];

    const sequences = [
      'smallCactus1',
      'smallCactus2',
      'smallCactus3',
      'bigCactus1',
      'bigCactus2',
      'bigCactus3',
    ];
    const randomIndex = Math.floor(Math.random() * sequences.length);

    cactus[cactusIndex].x = Math.max(
      document.body.offsetWidth,
      otherCactus.x - 100 + Math.random() * 200,
    );

    cactus[cactusIndex].sequence = sequences[randomIndex];
    if (randomIndex > 2) {
      cactus[cactusIndex].y = 325;
    } else {
      cactus[cactusIndex].y = 355;
    }

    this.setState({});
  };

  private onDisappearPterodactyl = (pterodactylIndex: number) => () => {
    const { pterodactyl } = this.state;
    pterodactyl[pterodactylIndex].x =
      document.body.offsetWidth +
      Math.random() * document.body.offsetWidth * 10;
    pterodactyl[pterodactylIndex].y = 200 + Math.random() * 5 * 20;

    this.setState({});
  };
}

export default App;
