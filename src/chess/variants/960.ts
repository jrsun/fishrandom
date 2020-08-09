import {Game} from '../game';
import {BoardState} from '../state';
import {Move} from '../move';
import {Color} from '../const';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from '../piece';

export class Chess960 extends Game {
  name = 'Chess960';
  // TODO: Castling is broken. it eats pieces
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }
}

function generateStartState(): BoardState {
  const pieceFiles: {[key: string]: number} = {};

  const allFiles = [0, 1, 2, 3, 4, 5, 6, 7];
  const usedFiles: number[] = [];
  const bishop1File = randomChoice([0, 2, 4, 6]);
  const bishop2File = randomChoice([1, 3, 5, 7]);
  usedFiles.push(bishop1File);
  usedFiles.push(bishop2File);
  const queenFile = randomChoice(
    allFiles.filter((file) => !usedFiles.includes(file))
  );
  usedFiles.push(queenFile);

  const n1file = randomChoice(
    allFiles.filter((file) => !usedFiles.includes(file))
  );
  usedFiles.push(n1file);
  const n2file = randomChoice(
    allFiles.filter((file) => !usedFiles.includes(file))
  );
  usedFiles.push(n2file);
  const [r1file, kfile, r2file] = allFiles.filter(
    (file) => !usedFiles.includes(file)
  );

  const positions = {
    0: {},
    1: {},
    6: {},
    7: {},
  };
  for (const row of [0, 7]) {
    const color = row === 0 ? Color.BLACK : Color.WHITE;
    positions[row][bishop1File] = new Bishop(color);
    positions[row][bishop2File] = new Bishop(color);
    positions[row][queenFile] = new Queen(color);
    positions[row][n1file] = new Knight(color);
    positions[row][n2file] = new Knight(color);
    positions[row][r1file] = new Rook(color);
    positions[row][kfile] = new King(color);
    positions[row][r2file] = new Rook(color);
  }

  for (let col = 0; col < 8; col++) {
    positions[1][col] = new Pawn(Color.BLACK);
    positions[6][col] = new Pawn(Color.WHITE);
  }

  const squares: Square[][] = [];
  for (let i = 0; i < 8; i++) {
    const row: Square[] = [];
    for (let j = 0; j < 8; j++) {
      const square = new Square(i, j);
      row.push(square);
      if (positions[i]?.[j]) {
        square.place(positions[i][j]);
      }
    }
    squares.push(row);
  }
  return new BoardState(squares, Color.WHITE);
}
