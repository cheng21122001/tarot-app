import { describe, expect, it } from 'vitest';
import type { Stamped } from './merge';
import { idsToPush, mergeDocs as mergeReadings } from './merge';

const make = (id: string, created: string, updated: string, name = id): Stamped & { clientName: string } => ({
  id, createdAt: created, updatedAt: updated, clientName: name,
});

describe('mergeReadings', () => {
  it('keeps the newer copy of each record and sorts by createdAt desc', () => {
    const local = [make('a', '2026-09-01T00:00:00Z', '2026-09-10T00:00:00Z', 'local-a'), make('b', '2026-09-02T00:00:00Z', '2026-09-02T00:00:00Z', 'local-b')];
    const remote = [make('a', '2026-09-01T00:00:00Z', '2026-09-05T00:00:00Z', 'remote-a'), make('b', '2026-09-02T00:00:00Z', '2026-09-08T00:00:00Z', 'remote-b'), make('c', '2026-09-03T00:00:00Z', '2026-09-03T00:00:00Z')];
    const merged = mergeReadings(local, remote);
    expect(merged.map((r) => r.id)).toEqual(['c', 'b', 'a']);
    expect(merged.find((r) => r.id === 'a')!.clientName).toBe('local-a');
    expect(merged.find((r) => r.id === 'b')!.clientName).toBe('remote-b');
  });

  it('prefers remote on equal timestamps', () => {
    const t = '2026-09-01T00:00:00Z';
    expect(mergeReadings([make('a', t, t, 'L')], [make('a', t, t, 'R')])[0].clientName).toBe('R');
  });

  it('keeps unpushed local records but drops ones deleted on another device', () => {
    const t = '2026-09-01T00:00:00Z';
    const merged = mergeReadings([make('unpushed', t, t), make('gone', t, t)], [], ['unpushed']);
    expect(merged.map((r) => r.id)).toEqual(['unpushed']);
  });

  it('hides remote records that are being deleted locally', () => {
    const t = '2026-09-01T00:00:00Z';
    expect(mergeReadings([], [make('a', t, t), make('b', t, t)], [], ['a']).map((r) => r.id)).toEqual(['b']);
  });
});

describe('idsToPush', () => {
  it('pushes pending and locally newer records', () => {
    const t1 = '2026-09-01T00:00:00Z';
    const t2 = '2026-09-02T00:00:00Z';
    const local = [make('pending', t1, t1), make('newer', t1, t2), make('same', t1, t1)];
    const remote = [make('pending', t1, t1), make('newer', t1, t1), make('same', t1, t1)];
    expect(idsToPush(local, remote, ['pending']).sort()).toEqual(['newer', 'pending']);
  });
});
