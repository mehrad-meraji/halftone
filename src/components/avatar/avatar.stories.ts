import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './avatar.js';

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
  },
  args: { name: 'Ada Lovelace', src: '', size: 'md', shape: 'circle' },
  render: (a) => html`<ht-avatar name=${a.name} src=${a.src} size=${a.size} shape=${a.shape}></ht-avatar>`,
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
