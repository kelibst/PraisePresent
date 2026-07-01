import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideStage } from './SlideStage';

// SlideStage is the ONE slide surface shared by the projector (AudienceView) and
// every preview twin (SlidePreview). We assert the load-bearing markup from plain-
// data props. Rendered via react-dom/server (node env, no jsdom).
const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe('SlideStage', () => {
  it('paints the theme-INDEPENDENT stage backdrop, not the old themed --background gradient', () => {
    const out = html(<SlideStage lines={['x']} />);
    expect(out).toContain('pp-stage-backdrop');
    // Regression guard for the light/dark scripture-background leak (F1): the
    // backdrop must never reference the operator-UI theme token `--background`.
    expect(out).not.toContain('--background');
  });

  it('renders each text line and the reference', () => {
    const out = html(<SlideStage lines={['line one', 'line two']} reference="John 3:16" />);
    expect(out).toContain('line one');
    expect(out).toContain('line two');
    expect(out).toContain('John 3:16');
  });

  it('renders a color background as an inline fill', () => {
    const out = html(<SlideStage background={{ type: 'color', color: '#123456' }} />);
    expect(out).toContain('background-color:#123456');
  });

  it('renders an image background element', () => {
    const out = html(
      <SlideStage background={{ type: 'media', kind: 'image', url: 'app-media://media/7' }} />,
    );
    expect(out).toContain('<img');
    expect(out).toContain('app-media://media/7');
  });

  it('renders a looping, autoplaying video background — the preview no longer freezes', () => {
    const out = html(
      <SlideStage
        surface="preview"
        background={{ type: 'media', kind: 'video', url: 'app-media://media/8' }}
      />,
    );
    expect(out).toContain('<video');
    expect(out).toContain('app-media://media/8');
    expect(out).toContain('loop');
    expect(out).toContain('autoplay');
  });

  it('autoplays + loops a foreground video in a preview too (motion, but muted)', () => {
    const out = html(
      <SlideStage surface="preview" media={{ kind: 'video', url: 'app-media://media/9' }} />,
    );
    expect(out).toContain('<video');
    expect(out).toContain('loop');
    expect(out).toContain('autoplay');
  });

  it('plays audio media only on the projector, never in a (silent) preview', () => {
    const projector = html(
      <SlideStage surface="projector" media={{ kind: 'audio', url: 'app-media://media/10' }} />,
    );
    const preview = html(
      <SlideStage surface="preview" media={{ kind: 'audio', url: 'app-media://media/10' }} />,
    );
    expect(projector).toContain('<audio');
    expect(preview).not.toContain('<audio');
  });

  it('paints media over the background (both present → paint order preserved)', () => {
    const out = html(
      <SlideStage
        background={{ type: 'color', color: '#000000' }}
        media={{ kind: 'image', url: 'app-media://media/11' }}
      />,
    );
    expect(out).toContain('background-color:#000000');
    expect(out).toContain('app-media://media/11');
  });
});
