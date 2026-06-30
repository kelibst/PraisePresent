import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlidePreview } from './SlidePreview';
import { PaneHeader } from './PaneHeader';
import { ScheduleRow } from './ScheduleRow';
import { MiniSlideThumb } from './MiniSlideThumb';

// These atoms are pure presentational components — we assert the load-bearing
// markup they emit from plain-data props (text, reference, badge, blank
// fallback, semantic <button> when interactive). Rendered via react-dom/server
// (node env, no jsdom dependency).
const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe('SlidePreview', () => {
  it('renders each text line and the reference', () => {
    const out = html(
      <SlidePreview lines={['For God so loved the world', 'that he gave']} reference="John 3:16" />,
    );
    expect(out).toContain('For God so loved the world');
    expect(out).toContain('that he gave');
    expect(out).toContain('John 3:16');
  });

  it('renders a corner badge when provided', () => {
    const out = html(<SlidePreview lines={['x']} badge={{ label: 'Scripture · read-only' }} />);
    expect(out).toContain('Scripture · read-only');
  });

  it('renders a 16:9 container-query box and marks active state', () => {
    const out = html(<SlidePreview lines={['x']} active />);
    expect(out).toContain('aspect-video');
    expect(out).toContain('[container-type:inline-size]');
    expect(out).toContain('ring-pp-accent');
  });

  it('renders an image media element when media kind is image', () => {
    const out = html(<SlidePreview media={{ kind: 'image', url: 'app-media://media/1' }} />);
    expect(out).toContain('app-media://media/1');
    expect(out).toContain('<img');
  });
});

describe('PaneHeader', () => {
  it('renders an uppercase-tracked label and right-side meta', () => {
    const out = html(<PaneHeader label="Schedule" meta="12 items" />);
    expect(out).toContain('Schedule');
    expect(out).toContain('12 items');
    expect(out).toContain('uppercase');
  });

  it('prefers actions over meta when both supplied', () => {
    const out = html(<PaneHeader label="Deck" meta="hidden-meta" actions={<button>Add</button>} />);
    expect(out).toContain('Add');
    expect(out).not.toContain('hidden-meta');
  });
});

describe('ScheduleRow', () => {
  it('renders as a button with title/meta/duration when interactive', () => {
    const out = html(
      <ScheduleRow
        type="song"
        title="Amazing Grace"
        meta="John Newton"
        duration="3:20"
        onClick={() => {}}
      />,
    );
    expect(out).toContain('<button');
    expect(out).toContain('Amazing Grace');
    expect(out).toContain('John Newton');
    expect(out).toContain('3:20');
  });

  it('renders a static row (no button) when no onClick', () => {
    const out = html(<ScheduleRow type="scripture" title="John 3:16" />);
    expect(out).not.toContain('<button');
    expect(out).toContain('John 3:16');
  });

  it('shows a Live marker when live', () => {
    const out = html(<ScheduleRow type="media" title="Logo" live />);
    expect(out).toContain('Live');
    expect(out).toContain('aria-current="true"');
  });
});

describe('MiniSlideThumb', () => {
  it('renders the index and first line', () => {
    const out = html(<MiniSlideThumb index={4} firstLine="Holy holy holy" reference="Rev 4:8" />);
    expect(out).toContain('4');
    expect(out).toContain('Holy holy holy');
    expect(out).toContain('Rev 4:8');
  });

  it('falls back to (blank) when first line is empty', () => {
    const out = html(<MiniSlideThumb index={1} firstLine="   " />);
    expect(out).toContain('(blank)');
  });

  it('is a button when interactive and marks live state', () => {
    const out = html(<MiniSlideThumb index={2} firstLine="x" live onClick={() => {}} />);
    expect(out).toContain('<button');
    expect(out).toContain('ring-pp-success');
  });
});
