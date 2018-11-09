import * as React from 'react';
import { Rect } from './Rect';

import './Sprite.scss';

interface IInjectedProps {
  sequences?: {
    [sequenceName: string]: number[];
  };
  cuts?: Rect[];
  src?: string;
}

interface IProps {
  play?: boolean;
  sequence: string;
  fps?: number;
  style?: { [key: string]: string };
  className?: string;
  movingX?: number;
  movingY?: number;
  x?: number;
  y?: number;
  hitTest?: {
    rect: Rect;
    position: { x: number; y: number };
  };
  onHit?: () => any;
  onDisappear?: () => any;
}

interface IState {
  frame: number;
  sequence: string;
  translateX: number;
  translateY: number;
}

class Sprite extends React.Component<IProps & IInjectedProps, IState> {
  static getDerivedStateFromProps(
    props: IProps & IInjectedProps,
    state: IState,
  ) {
    if (props.sequence !== state.sequence) {
      return {
        frame: 0,
        sequence: props.sequence,
      };
    }
    return null;
  }

  interval?: NodeJS.Timeout;

  state = {
    frame: 0,
    sequence: 'iddle',
    translateX: 0,
    translateY: 0,
  };

  constructor(props: IProps & IInjectedProps) {
    super(props);
    if (props.play) {
      this.play();
    }
  }

  componentDidUpdate(prevProps: IProps) {
    if (this.props.play && this.props.play !== prevProps.play) {
      this.play();
    }
  }

  play = () => {
    const { play, fps } = this.props;
    if (play) {
      this.loop();
      setTimeout(this.play, 1000 / fps!);
    }
  };

  loop = () => {
    const { frame, translateX, translateY } = this.state;
    const { sequences, sequence, movingX, movingY } = this.props;

    this.setState({
      frame: (frame + 1) % sequences![sequence].length,
      translateX: movingX ? translateX + movingX : 0,
      translateY: movingY ? translateY + movingY : 0,
    });
  };

  onDisappear = () => {
    if (this.props.onDisappear) {
      setTimeout(() => {
        this.setState(
          {
            translateX: 0,
            translateY: 0,
          },
          () => {
            this.props.onDisappear!();
          },
        );
      }, 0);
    }
  };

  onHit = () => {
    this.props.onHit!();
  };

  render() {
    const { frame, translateX, translateY } = this.state;
    const {
      sequence,
      sequences,
      cuts,
      src,
      style,
      className,
      x = 0,
      y = 0,
      hitTest,
    } = this.props;
    const sequenceCuts = sequences![sequence].map(e => cuts![e]);

    const currentCut = sequenceCuts[frame];

    const thisLeft = x + translateX;
    const thisRight = x + currentCut.width + translateX;
    const thisTop = y + translateY;
    const thisBottom = y + currentCut.height + translateY;

    if (thisRight < 0) {
      this.onDisappear();
    }

    if (hitTest) {
      const tolerance = 10;

      const thatLeft = hitTest.position.x;
      const thatRight = hitTest.position.x + hitTest.rect.width;
      const thatTop = hitTest.position.y;
      const thatBottom = hitTest.position.y + hitTest.rect.height;

      const hitted =
        thatLeft + tolerance > thisRight - tolerance ||
        thatRight - tolerance < thisLeft + tolerance ||
        thatTop + tolerance > thisBottom - tolerance ||
        thatBottom - tolerance < thisTop + tolerance;

      if (!hitted) {
        this.onHit();
      }
    }

    return (
      <div
        className={`Sprite ${className || ''}`}
        style={{
          ...style,
          ...(translateX || translateY
            ? {
                transform: `${
                  translateX
                    ? `translateX(${translateX}px)`
                    : `translateY(${translateY}px)`
                }`,
              }
            : {}),
          ...(x ? { left: `${x}px` } : {}),
          ...(y ? { top: `${y}px` } : {}),
          backgroundImage: `url(${src})`,
          backgroundPosition: `-${currentCut.x}px -${currentCut.y}px`,
          height: `${currentCut.height}px`,
          width: `${currentCut.width}px`,
        }}
      />
    );
  }
}

export default Sprite;
