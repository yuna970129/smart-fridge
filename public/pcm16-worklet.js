// AudioWorklet: downsamples mic audio to 16kHz PCM16 and posts 640-byte
// (20ms) frames to the main thread for streaming to the STT backend.
class PCM16Downsampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = [];
    this._inRate = sampleRate; // worklet global (input context rate)
    this._outRate = 16000;
    this._ratio = this._inRate / this._outRate;
    this._pos = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const ch = input[0];

    // Linear resample to 16kHz.
    for (let i = this._pos; i < ch.length; i += this._ratio) {
      const idx = Math.floor(i);
      const frac = i - idx;
      const s0 = ch[idx] ?? 0;
      const s1 = ch[idx + 1] ?? s0;
      const sample = s0 + (s1 - s0) * frac;
      const clamped = Math.max(-1, Math.min(1, sample));
      this._buf.push(clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff);
    }
    this._pos = 0;

    // Emit full 320-sample (640-byte) frames.
    while (this._buf.length >= 320) {
      const frame = this._buf.splice(0, 320);
      const pcm = new Int16Array(frame);
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true;
  }
}

registerProcessor("pcm16-downsampler", PCM16Downsampler);
