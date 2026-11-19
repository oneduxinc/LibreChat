import { useEffect } from 'react';
import { render, act } from '@testing-library/react';
import type { BrowserProductFact } from 'librechat-data-provider';
import { TrackingProvider, useProductTracking } from '../TrackingContext';

jest.mock('~/data-provider', () => ({
  useGetStartupConfig: () => ({ data: { productTracking: { enabled: true } } }),
}));

function Observer({ fact }: { fact: BrowserProductFact }) {
  const track = useProductTracking();
  useEffect(() => {
    void track(fact);
  }, [fact, track]);
  return <button>{'Chat remains usable'}</button>;
}

const opened: BrowserProductFact = {
  name: 'librechat.feature.observed',
  feature: 'prompts',
  observation: 'opened',
  entryPoint: 'sidebar',
};

it('passes valid facts to the browser host callback once', async () => {
  const track = jest.fn();
  render(
    <TrackingProvider track={track}>
      <Observer fact={opened} />
    </TrackingProvider>,
  );
  await act(async () => {});
  expect(track).toHaveBeenCalledTimes(1);
  expect(track.mock.calls[0][0]).toEqual(opened);
});

it('drops malformed facts without interrupting the browser action', async () => {
  const track = jest.fn();
  const malformed = { ...opened, arguments: 'private' };
  const view = render(
    <TrackingProvider track={track}>
      <Observer fact={malformed} />
    </TrackingProvider>,
  );
  await act(async () => {});
  expect(track).not.toHaveBeenCalled();
  expect(view.getByRole('button', { name: 'Chat remains usable' })).toBeInTheDocument();
});
