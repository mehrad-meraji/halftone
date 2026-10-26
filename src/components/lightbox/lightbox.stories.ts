import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../button/button.js';
import './lightbox.js';
import type { HtLightbox } from './lightbox.js';

// The lightbox is modal, so docs render each story in its own iframe.
const docs = { story: { inline: false, height: '520px' } };

const meta: Meta = {
  title: 'Components/Lightbox',
  component: 'ht-lightbox',
  tags: ['autodocs'],
  parameters: { docs, layout: 'centered' },
};
export default meta;

/**
 * Placeholder screenshots drawn as inline SVG, so the stories load nothing from the network.
 * Each is a fake app window: a title bar, a sidebar, a heading, lines and a gradient block.
 */
function shot(w: number, h: number, from: string, to: string) {
  const bar = 28;
  const side = Math.round(w * 0.24);
  const pad = Math.round(w * 0.04);
  const x = side + pad;
  const mainW = w - x - pad;
  const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="#fbfafd"/>
    <rect width="${w}" height="${bar}" fill="#ebe9f0"/>
    <circle cx="16" cy="14" r="5" fill="#cbc7d4"/><circle cx="32" cy="14" r="5" fill="#cbc7d4"/><circle cx="48" cy="14" r="5" fill="#cbc7d4"/>
    <rect x="${pad}" y="${bar + pad}" width="${side - pad}" height="${h - bar - pad * 2}" rx="4" fill="#efedf3"/>
    <rect x="${x}" y="${bar + pad}" width="${mainW * 0.55}" height="${Math.round(h * 0.05)}" rx="3" fill="#3a3646"/>
    <rect x="${x}" y="${bar + pad + h * 0.09}" width="${mainW}" height="${Math.round(h * 0.025)}" rx="3" fill="#dcd9e3"/>
    <rect x="${x}" y="${bar + pad + h * 0.14}" width="${mainW * 0.8}" height="${Math.round(h * 0.025)}" rx="3" fill="#dcd9e3"/>
    <rect x="${x}" y="${bar + pad + h * 0.2}" width="${mainW}" height="${h * 0.48}" rx="6" fill="url(#g)"/>
    <rect x="${x}" y="${h - pad - h * 0.07}" width="${mainW * 0.3}" height="${h * 0.05}" rx="3" fill="#7c3aed"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svgText)}`;
}

const IMAGES = [
  { src: shot(1440, 900, '#a7e3c9', '#c9e6ee'), name: 'paste-1026-0938.png', alt: 'Screenshot of the board view with three columns' },
  { src: shot(1440, 900, '#d6bdf5', '#bccdf2'), name: 'paste-1026-0942.png', alt: 'Screenshot of the upload settings page' },
  { src: shot(900, 1200, '#f4d9a8', '#f6dccf'), name: 'mobile-inbox.png', alt: 'Portrait screenshot of the inbox on a phone' },
  { src: shot(1200, 1200, '#b9cfe6', '#dedde6'), name: 'empty-state.png', alt: 'Square screenshot of an empty project' },
];

const images = (list = IMAGES) =>
  list.map((img) => html`<img src=${img.src} alt=${img.alt} data-name=${img.name} />`);

const openNext = (e: Event) => ((e.currentTarget as HTMLElement).nextElementSibling as HtLightbox).show();

export const Default: StoryObj = {
  render: () => html`
    <ht-button @click=${openNext}>View Images</ht-button>
    <ht-lightbox label="Task images">${images()}</ht-lightbox>`,
};

export const SingleImage: StoryObj = {
  render: () => html`
    <ht-button @click=${openNext}>View Image</ht-button>
    <ht-lightbox label="Task image">${images(IMAGES.slice(1, 2))}</ht-lightbox>`,
};

const thumbStyles = html`<style>
  .lb-thumbs { display: flex; gap: 8px; }
  .lb-thumb {
    appearance: none;
    width: 96px;
    height: 64px;
    padding: 0;
    overflow: hidden;
    background: var(--ht-surface-sunken);
    border: 1px solid var(--ht-border);
    border-radius: var(--ht-radius-md);
    cursor: zoom-in;
  }
  .lb-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .lb-thumb:focus-visible { outline: 2px solid var(--ht-focus); outline-offset: 2px; }
</style>`;

/** Each thumbnail opens the lightbox at its image. Close it and focus is back on the thumbnail you clicked. */
export const OpenedFromThumbnails: StoryObj = {
  render: () => {
    const open = (e: Event, i: number) =>
      (e.currentTarget as HTMLElement).closest('.lb-demo')!.querySelector('ht-lightbox')!.show(i);
    return html`
      ${thumbStyles}
      <div class="lb-demo">
        <div class="lb-thumbs">
          ${IMAGES.map(
            (img, i) => html`<button class="lb-thumb" type="button" aria-label="Open ${img.name}" @click=${(e: Event) => open(e, i)}>
              <img src=${img.src} alt="" />
            </button>`,
          )}
        </div>
        <ht-lightbox label="Task images">${images()}</ht-lightbox>
      </div>`;
  },
};
