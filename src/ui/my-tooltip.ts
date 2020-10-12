import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import '@polymer/paper-button';
import { addMessageHandler, Message } from '../common/message';

@customElement('my-tooltip')
export class MyTooltip extends LitElement {
  static styles = css`
/* Tooltip container */
    .tooltip {
      position: relative;
      display: inline-block;
    }

    /* Tooltip text */
    .tooltip .tooltiptext {
      visibility: hidden;

      bottom: 100%;
      left: 50%;
      transform: translate(-50%, 0);

      min-width: 200px;

      background-color: rgba(0, 0, 0, 0.75);
      color: #eee;
      text-align: center;
      padding: 5px;
      border-radius: 6px;
    
      /* Position the tooltip text - see examples below! */
      position: absolute;
      z-index: 1;
    }

    .tooltip .tooltiptext::after {
      content: " ";
      position: absolute;
      top: 100%; /* At the bottom of the tooltip */
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: black transparent transparent transparent;
    }

    /* Show the tooltip text when you mouse over the tooltip container */
    .tooltip:hover .tooltiptext {
      visibility: visible;
    }
  `;

  render() {
    return html`
    <div class="tooltip">
      <slot name="tooltip">Hover over me</slot>
      <span class="tooltiptext">
        <slot name="tooltiptext">Tooltip text</slot>
      </span>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-tooltip': MyTooltip;
  }
}
