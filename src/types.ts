export type Coordinate = { x: number; y: number };

export type Player = {
  id: string;
  name: string;
  number: number;
  team: 'red' | 'blue' | 'ball';
  x: number;
  y: number;
};

export type Line = {
  id: string;
  points: Coordinate[];
  color: string;
  style: 'solid' | 'dashed';
};

export type AppState = {
  players: Player[];
  lines: Line[];
  currentMode: 'drag' | 'draw';
  lineColor: string;
  lineStyle: 'solid' | 'dashed';
};
