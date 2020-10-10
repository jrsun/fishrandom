import { Piece } from "../chess/piece";
import { LitElement } from "lit-element";
import { SelectEventType } from "./utils";
import { equals, Pair } from "../chess/pair";

interface GameContainerElement extends LitElement {
  selectedSquare: Pair|undefined;
  selectedPiece: Piece|undefined;
}

export class GameListener {
  c: GameContainerElement;

  constructor(public container: GameContainerElement) {
    this.c = container;
  }

  attach() { 
    console.log('attaching to', this.c);
    this.c.addEventListener(SelectEventType.PIECE_TOGGLE, this.onPieceToggle);
    this.c.addEventListener(SelectEventType.PIECE_ON, this.onPieceOn);
    this.c.addEventListener(SelectEventType.PIECE_OFF, this.onPieceOff);
  }

  detach() {
    this.c.removeEventListener(SelectEventType.PIECE_TOGGLE, this.onPieceToggle);
    this.c.removeEventListener(SelectEventType.PIECE_ON, this.onPieceOn);
    this.c.removeEventListener(SelectEventType.PIECE_OFF, this.onPieceOff);
  }

  onPieceOff = () => {
    this.c.selectedSquare = undefined;
    this.c.selectedPiece = undefined;
  }
  onPieceOn = (e: CustomEvent) => this.onPieceSelected(e, false);
  onPieceToggle = (e: CustomEvent) => this.onPieceSelected(e, true);
  private onPieceSelected = (e: CustomEvent, toggle: boolean) => {
    console.log(e, toggle);
    const {piece, square} = e.detail;
    if (
      piece &&
      square?.row !== undefined &&
      square?.col !== undefined &&
      (!toggle || !equals(square, this.c.selectedSquare))
    ) {
      this.c.selectedSquare = {row: square.row, col: square.col};
    } else {
      this.c.selectedSquare = undefined;
    }
    this.c.selectedPiece = piece as Piece;
  }

}