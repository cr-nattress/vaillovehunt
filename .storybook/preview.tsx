import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    docs: {
      toc: true,
    },
  },
};

export default preview;
