import * as React from 'react';
import { Rect } from './Rect';
import Sprite from './Sprite';

import './SpriteMapper.scss';

interface IProps {
  sequences: {
    [sequenceName: string]: number[];
  };
  cuts: Rect[];
  src: string;
  children: any;
  fps?: number;
  style?: { [key: string]: string };
}

export default class SpriteMapper extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }

  render() {
    const { sequences, cuts, src, fps, style } = this.props;

    return (
      <div className="SpriteMapper">
        {React.Children.map(this.props.children, (child: any) => {
          if (!child) {
            return null;
          }
          return React.cloneElement(child, {
            cuts,
            fps: child.props.fps || fps,
            sequences,
            src,
            style,
          });
        })}
      </div>
    );
  }
}
