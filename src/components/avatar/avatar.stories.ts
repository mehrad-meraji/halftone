import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { AVATAR_ARTS, avatarDataUri, generateAvatar } from './avatar.js';

const people = ['Ada Lovelace', 'Grace Brewster Murray Hopper', 'Linus', 'Katherine Johnson', 'Margaret Hamilton', 'Alan Turing', 'Radia Perlman'];
const sizes = ['xs', 'sm', 'md', 'lg'];

/** A neutral 120px picture as a data URI, so stories do not need the network. */
const photo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#6c5a8a"/><circle cx="60" cy="48" r="22" fill="#d9cfe8"/><path d="M16 120c4-28 22-42 44-42s40 14 44 42z" fill="#d9cfe8"/></svg>',
  );

const dot = (color: string) =>
  html`<span slot="status" style="display:block;width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 0 2px var(--ht-surface)"></span>`;

const meta: Meta = {
  title: 'Components/Avatar',
  component: 'ht-avatar',
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: sizes },
    shape: { control: 'select', options: ['circle', 'square'] },
    art: { control: 'select', options: ['', ...AVATAR_ARTS] },
  },
  args: { name: 'Ada Lovelace', src: '', seed: '', art: '', size: 'md', shape: 'circle' },
  render: (a) =>
    html`<ht-avatar name=${a.name} src=${a.src} seed=${a.seed} art=${a.art} size=${a.size} shape=${a.shape}></ht-avatar>`,
};
export default meta;

export const Initials: StoryObj = {};
export const WithImage: StoryObj = { args: { src: photo } };
export const Square: StoryObj = { args: { shape: 'square' } };
export const SingleName: StoryObj = { args: { name: 'Linus' } };
export const NoName: StoryObj = { args: { name: '' } };

/** A bad URL falls back to the initials. */
export const BrokenImage: StoryObj = { args: { src: 'https://invalid.invalid/missing.png' } };

export const Sizes: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:16px">
      ${['circle', 'square'].map((shape) => html`<div style="display:flex;gap:12px;align-items:center">
        ${sizes.map((s) => html`<ht-avatar name="Ada Lovelace" size=${s} shape=${shape}></ht-avatar>`)}
        ${sizes.map((s) => html`<ht-avatar name="Ada Lovelace" src=${photo} size=${s} shape=${shape}></ht-avatar>`)}
      </div>`)}
    </div>`,
};

/** The tint comes from the name, so the same person is always the same colour. */
export const Tints: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      ${people.map((p) => html`<ht-avatar name=${p} size="lg"></ht-avatar>`)}
    </div>`,
};

/** `status-label` is read out with the name; the dot itself is only colour. */
export const WithStatus: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:16px;align-items:center">
      <ht-avatar name="Ada Lovelace" size="lg" status-label="Online">${dot('var(--ht-success)')}</ht-avatar>
      <ht-avatar name="Alan Turing" size="md" status-label="Away">${dot('var(--ht-warning)')}</ht-avatar>
      <ht-avatar name="Radia Perlman" size="sm" status-label="Busy" shape="square">${dot('var(--ht-danger)')}</ht-avatar>
    </div>`,
};

export const Group: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:20px">
      <ht-avatar-group label="Reviewers">
        ${people.slice(0, 4).map((p) => html`<ht-avatar name=${p}></ht-avatar>`)}
      </ht-avatar-group>
      <ht-avatar-group label="Reviewers" max="3">
        ${people.map((p, i) => html`<ht-avatar name=${p} src=${i === 1 ? photo : ''}></ht-avatar>`)}
      </ht-avatar-group>
      ${sizes.map((s) => html`<ht-avatar-group label="Team" size=${s} max="4">
        ${people.map((p) => html`<ht-avatar name=${p}></ht-avatar>`)}
      </ht-avatar-group>`)}
    </div>`,
};

export const GroupEmpty: StoryObj = {
  render: () => html`<ht-avatar-group label="Reviewers"></ht-avatar-group>`,
};

const seeds = [
  'ada@example.com', 'grace@example.com', 'linus@example.com', 'katherine@example.com', 'margaret@example.com', 'alan@example.com',
  'radia@example.com', 'barbara@example.com', 'tim@example.com', 'dennis@example.com', 'frances@example.com', 'ken@example.com',
  'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9', 'user-10', 'user-11', 'user-12',
];

/** Set `art` and the avatar draws a picture from `seed` (or from `name` when there is no seed). The same seed always gives the same picture. */
export const Generated: StoryObj = { args: { seed: 'ada@example.com', art: 'pixel', size: 'lg' } };

/** The three styles at the same seed. `pixel` is a creature, `dots` a halftone screen, `tiles` nine turned shapes. */
export const Styles: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:16px;align-items:center">
      ${AVATAR_ARTS.map((art) => html`<ht-avatar name="Ada Lovelace" seed="ada@example.com" art=${art} size="lg"></ht-avatar>`)}
    </div>`,
};

/** Twenty-four seeds in each style, so you can judge the variety. Seeds can be emails, ids or names. */
export const SeedGrid: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:24px">
      ${AVATAR_ARTS.map((art) => html`<div>
        <div style="font:500 12px var(--ht-font-ui);color:var(--ht-text-muted);margin-bottom:8px">${art}</div>
        <div style="display:grid;grid-template-columns:repeat(12,40px);gap:10px">
          ${seeds.map((s) => html`<ht-avatar seed=${s} art=${art} size="lg"></ht-avatar>`)}
        </div>
      </div>`)}
    </div>`,
};

/** Same seed, same picture, every time. Case counts, spaces around the seed do not. */
export const Deterministic: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:12px;align-items:center">
      <ht-avatar seed="ada@example.com" art="pixel" size="lg"></ht-avatar>
      <ht-avatar seed="  ada@example.com  " art="pixel" size="lg"></ht-avatar>
      <ht-avatar seed="Ada@example.com" art="pixel" size="lg"></ht-avatar>
    </div>`,
};

export const ArtSizes: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:16px">
      ${AVATAR_ARTS.map((art) => ['circle', 'square'].map((shape) => html`<div style="display:flex;gap:12px;align-items:center">
        ${sizes.map((s) => html`<ht-avatar seed="grace@example.com" art=${art} size=${s} shape=${shape}></ht-avatar>`)}
      </div>`))}
    </div>`,
};

/** With a `name` the picture has an accessible name. With a seed alone it is decoration and is hidden from assistive technology. */
export const Labelled: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:16px;align-items:center">
      <ht-avatar name="Ada Lovelace" seed="ada@example.com" art="dots" size="lg"></ht-avatar>
      <ht-avatar seed="ada@example.com" art="dots" size="lg"></ht-avatar>
      <ht-avatar name="Ada Lovelace" art="tiles" size="lg"></ht-avatar>
      <ht-avatar art="pixel" size="lg"></ht-avatar>
    </div>`,
};

/** The picture sits under the image: it shows while the image loads and when it fails. */
export const ArtFallback: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:16px;align-items:center">
      <ht-avatar name="Ada Lovelace" seed="ada@example.com" art="pixel" src=${photo} size="lg"></ht-avatar>
      <ht-avatar name="Alan Turing" seed="alan@example.com" art="pixel" src="https://invalid.invalid/missing.png" size="lg"></ht-avatar>
    </div>`,
};

export const ArtWithStatus: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:16px;align-items:center">
      <ht-avatar name="Ada Lovelace" seed="ada@example.com" art="pixel" size="lg" status-label="Online">${dot('var(--ht-success)')}</ht-avatar>
      <ht-avatar name="Alan Turing" seed="alan@example.com" art="dots" size="md" shape="square" status-label="Away">${dot('var(--ht-warning)')}</ht-avatar>
    </div>`,
};

export const ArtInGroup: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:20px">
      ${AVATAR_ARTS.map((art) => html`<ht-avatar-group label="Reviewers (${art})" max="5">
        ${seeds.slice(0, 8).map((s, i) => html`<ht-avatar name=${people[i % people.length]} seed=${s} art=${art}></ht-avatar>`)}
      </ht-avatar-group>`)}
      <ht-avatar-group label="Mixed">
        <ht-avatar name="Ada Lovelace" seed="ada@example.com" art="pixel"></ht-avatar>
        <ht-avatar name="Grace Hopper" src=${photo}></ht-avatar>
        <ht-avatar name="Linus"></ht-avatar>
        <ht-avatar name="Alan Turing" seed="alan@example.com" art="tiles"></ht-avatar>
      </ht-avatar-group>
    </div>`,
};

/** Outside the element: `generateAvatar` returns SVG markup, `avatarDataUri` a `data:` URI for `<img>` or CSS. */
export const OutsideTheElement: StoryObj = {
  render: () => html`
    <div style="display:flex;gap:16px;align-items:center">
      <img alt="Ada Lovelace" width="48" height="48" style="border-radius:50%" src=${avatarDataUri('ada@example.com', { art: 'pixel', size: 48 })} />
      <img alt="" width="48" height="48" style="border-radius:10px" src=${avatarDataUri('ada@example.com', { art: 'dots', size: 48 })} />
      <span .innerHTML=${generateAvatar('ada@example.com', { art: 'tiles', size: 48, label: 'Ada Lovelace' })}></span>
    </div>`,
};
