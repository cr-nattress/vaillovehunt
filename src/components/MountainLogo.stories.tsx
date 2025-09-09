import type { Meta, StoryObj } from '@storybook/react';
import MountainLogo from './MountainLogo';

const meta: Meta<typeof MountainLogo> = {
  title: 'Components/MountainLogo',
  component: MountainLogo,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

export const Default: StoryObj<typeof MountainLogo> = {
  args: {},
};
