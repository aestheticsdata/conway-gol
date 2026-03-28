type SeenStateEntry = {
  iteration: number;
  state: Uint32Array;
};

export type PlaybackTelemetrySnapshot = {
  stableAfter: number | null;
  cyclePeriod: number | null;
};

export default class PlaybackTelemetryTracker {
  private _stableAfter: number | null = null;
  private _cyclePeriod: number | null = null;
  private readonly _seenStates = new Map<string, SeenStateEntry[]>();
  private _previousPackedState: Uint32Array | null = null;

  public get stableAfter(): number | null {
    return this._stableAfter;
  }

  public get cyclePeriod(): number | null {
    return this._cyclePeriod;
  }

  public reset(): void {
    this._stableAfter = null;
    this._cyclePeriod = null;
    this._seenStates.clear();
    this._previousPackedState = null;
  }

  public observe(iteration: number, state: Uint8Array, changedCells: number | null): PlaybackTelemetrySnapshot {
    const packedState = this._packState(state);

    if (changedCells === null) {
      this.reset();
      this._rememberState(iteration, packedState);
      this._previousPackedState = packedState;
      return this.snapshot();
    }

    if (
      this._stableAfter === null &&
      this._previousPackedState !== null &&
      this._packedStatesEqual(this._previousPackedState, packedState)
    ) {
      this._stableAfter = Math.max(0, iteration - 1);
      this._previousPackedState = packedState;
      return this.snapshot();
    }

    if (this._cyclePeriod === null) {
      const cycleDetectedAtIteration = this._findSeenStateIteration(packedState, iteration - 1);
      if (cycleDetectedAtIteration !== null) {
        this._cyclePeriod = iteration - cycleDetectedAtIteration;
        this._previousPackedState = packedState;
        return this.snapshot();
      }
    }

    this._rememberState(iteration, packedState);
    this._previousPackedState = packedState;
    return this.snapshot();
  }

  public snapshot(): PlaybackTelemetrySnapshot {
    return {
      stableAfter: this._stableAfter,
      cyclePeriod: this._cyclePeriod,
    };
  }

  private _findSeenStateIteration(state: Uint32Array, maxIteration: number): number | null {
    const bucket = this._seenStates.get(this._hashPackedState(state));
    if (!bucket) {
      return null;
    }

    for (const entry of bucket) {
      if (entry.iteration <= maxIteration && this._packedStatesEqual(entry.state, state)) {
        return entry.iteration;
      }
    }

    return null;
  }

  private _rememberState(iteration: number, state: Uint32Array): void {
    const hash = this._hashPackedState(state);
    const bucket = this._seenStates.get(hash);
    if (bucket) {
      bucket.push({ iteration, state });
      return;
    }

    this._seenStates.set(hash, [{ iteration, state }]);
  }

  private _packState(state: Uint8Array): Uint32Array {
    const packed = new Uint32Array(Math.ceil(state.length / 32));
    for (let index = 0; index < state.length; index++) {
      if (state[index] === 0) {
        continue;
      }

      packed[index >>> 5] |= 1 << (index & 31);
    }
    return packed;
  }

  private _hashPackedState(state: Uint32Array): string {
    let hash = 2166136261;
    for (let index = 0; index < state.length; index++) {
      hash ^= state[index] >>> 0;
      hash = Math.imul(hash, 16777619) >>> 0;
    }

    return hash.toString(16);
  }

  private _packedStatesEqual(left: Uint32Array, right: Uint32Array): boolean {
    if (left.length !== right.length) {
      return false;
    }

    for (let index = 0; index < left.length; index++) {
      if (left[index] !== right[index]) {
        return false;
      }
    }

    return true;
  }
}
