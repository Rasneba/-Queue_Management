'use client';

export function playPleasantChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const notes = [523.25, 659.25, 783.99, 987.77];
    const now = audioCtx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const noteDelay = idx * 0.08;
      const attackTime = 0.04;
      const decayTime = 0.8 - idx * 0.1;

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + noteDelay + attackTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + noteDelay + attackTime + decayTime);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(now + noteDelay);
      osc.stop(now + noteDelay + attackTime + decayTime + 0.1);
    });
  } catch (error) {
    console.error("Failed to play pleasant chime:", error);
  }
}
