import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { normalizeExcelXmlBuffer } from './excel-patch';

describe('normalizeExcelXmlBuffer', () => {
  it('makes ExcelJS follow an SVG source instead of its blank PNG fallback', async () => {
    const zip = new JSZip();
    zip.file(
      'xl/drawings/drawing1.xml',
      '<xdr:wsDr><a:blip r:embed="pngRelation"><a:extLst><a:ext><asvg:svgBlip r:embed="svgRelation" /></a:ext></a:extLst></a:blip></xdr:wsDr>',
    );
    const input = await zip.generateAsync({ type: 'nodebuffer' });

    const output = await normalizeExcelXmlBuffer(input);
    const normalizedZip = await JSZip.loadAsync(output);
    const drawing = await normalizedZip
      .file('xl/drawings/drawing1.xml')!
      .async('string');

    expect(drawing).toContain('<a:blip r:embed="svgRelation">');
    expect(drawing).toContain('<asvg:svgBlip r:embed="svgRelation" />');
    expect(drawing).not.toContain('pngRelation');
  });
});
