import { describe, it, expect } from 'vitest';
import { parseLegLineInfo, formatDuration, formatTime, formatDistance, getLineColors } from '../utils/formatters';

describe('formatters - parseLegLineInfo', () => {
  it('keeps regional train categories and line numbers together (REX 7, CJX 5, S 1, R 2)', () => {
    // "REX 7" must be written nebeneinander without splitting into subNumber
    const rex7 = parseLegLineInfo('REX 7');
    expect(rex7.lineName).toBe('REX 7');
    expect(rex7.subNumber).toBeUndefined();

    const rex2 = parseLegLineInfo('REX 2');
    expect(rex2.lineName).toBe('REX 2');
    expect(rex2.subNumber).toBeUndefined();

    const cjx5 = parseLegLineInfo('CJX 5');
    expect(cjx5.lineName).toBe('CJX 5');
    expect(cjx5.subNumber).toBeUndefined();

    const s45 = parseLegLineInfo('S 45');
    expect(s45.lineName).toBe('S 45');
    expect(s45.subNumber).toBeUndefined();

    const r2 = parseLegLineInfo('R 2');
    expect(r2.lineName).toBe('R 2');
    expect(r2.subNumber).toBeUndefined();

    // Compact notation without space
    const rexCompact = parseLegLineInfo('REX7');
    expect(rexCompact.lineName).toBe('REX 7');
    expect(rexCompact.subNumber).toBeUndefined();
  });

  it('correctly extracts train numbers when explicit Zug-Nr is provided', () => {
    // "CJX 5 (Zug-Nr. 1910)" -> lineName: CJX 5, subNumber: 1910
    const cjxWithNr = parseLegLineInfo('CJX 5 (Zug-Nr. 1910)');
    expect(cjxWithNr.lineName).toBe('CJX 5');
    expect(cjxWithNr.subNumber).toBe('1910');

    const rexWithNr = parseLegLineInfo('REX 2 (Zug-Nr. 23345)');
    expect(rexWithNr.lineName).toBe('REX 2');
    expect(rexWithNr.subNumber).toBe('23345');

    const sWithNr = parseLegLineInfo('S 1 (Zug-Nr. 19307)');
    expect(sWithNr.lineName).toBe('S 1');
    expect(sWithNr.subNumber).toBe('19307');
  });

  it('extracts train numbers for long-distance trains (Fernverkehr) without line numbers', () => {
    const rjx60 = parseLegLineInfo('RJX 60');
    expect(rjx60.lineName).toBe('RJX');
    expect(rjx60.subNumber).toBe('60');

    const rjxCompact = parseLegLineInfo('RJX19952');
    expect(rjxCompact.lineName).toBe('RJX');
    expect(rjxCompact.subNumber).toBe('19952');

    const ice = parseLegLineInfo('ICE 118');
    expect(ice.lineName).toBe('ICE');
    expect(ice.subNumber).toBe('118');

    const ec = parseLegLineInfo('EC 1216');
    expect(ec.lineName).toBe('EC');
    expect(ec.subNumber).toBe('1216');

    const wb = parseLegLineInfo('WB 79214');
    expect(wb.lineName).toBe('WB');
    expect(wb.subNumber).toBe('79214');
  });

  it('keeps subway, tram and bus lines intact as lineName', () => {
    const u1 = parseLegLineInfo('U1');
    expect(u1.lineName).toBe('U1');
    expect(u1.subNumber).toBeUndefined();

    const u3 = parseLegLineInfo('U3');
    expect(u3.lineName).toBe('U3');

    const tram71 = parseLegLineInfo('71', 'TRAM');
    expect(tram71.lineName).toBe('71');

    const bus13A = parseLegLineInfo('13A', 'BUS');
    expect(bus13A.lineName).toBe('13A');
  });

  it('handles empty line by falling back to legType or ÖPNV', () => {
    expect(parseLegLineInfo('', 'WALK').lineName).toBe('WALK');
    expect(parseLegLineInfo(undefined, undefined).lineName).toBe('ÖPNV');
  });
});

describe('formatters - other utilities', () => {
  it('formats duration correctly', () => {
    expect(formatDuration(180)).toBe('3 min');
    expect(formatDuration(3600)).toBe('1 h');
    expect(formatDuration(4500)).toBe('1 h 15 min');
  });

  it('formats distance correctly', () => {
    expect(formatDistance(350)).toBe('350 m');
    expect(formatDistance(1500)).toBe('1,5 km');
  });

  it('returns appropriate line colors', () => {
    expect(getLineColors('U1').bg).toBe('#e2001a');
    expect(getLineColors('U3').bg).toBe('#ea580c');
    expect(getLineColors('REX 7').bg).toBe('#0284c7');
    expect(getLineColors('CJX 5').bg).toBe('#0284c7');
    expect(getLineColors('RJX 60').bg).toBe('#b91c1c');
    expect(getLineColors('WB 79214').bg).toBe('#2563eb');
  });
});
