/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, customElement, property, css } from 'lit-element';
/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
let MyPiece = class MyPiece extends LitElement {
    render() {
        return html `
      <div
        class="piece"
        style="background-image:url(/dist/img/${this.piece.img})"
      ></div>
    `;
    }
};
MyPiece.styles = css `
    .piece {
      height: 100%;
      width: 100%;
      display: inline-block;
      background-image: url('/dist/img/_dt.png');
      background-size: cover;
    }
  `;
__decorate([
    property({ type: Object })
], MyPiece.prototype, "piece", void 0);
MyPiece = __decorate([
    customElement('my-piece')
], MyPiece);
export { MyPiece };
//# sourceMappingURL=my-piece.js.map