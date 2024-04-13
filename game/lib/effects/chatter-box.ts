/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
export const LANGUAGES = ['keyboard2'];

export class ChatterBox {
  public availableVoices: Record<string, AudioBuffer> = {};

  public started = false;

  public currentVoice: AudioBufferSourceNode|undefined;

  public audioContext: AudioContext;

  private nextVoiceEvent = -1;

  public constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  public start(voiceName:string, pitch: number, soundDuration: number): void {
    if (!this.started) {
      this.started = true;
      window.clearTimeout(this.nextVoiceEvent);
      this.saySomething(voiceName, pitch, soundDuration);
    }
  }

  private copyAndFade(source : AudioBuffer, target:AudioBuffer, start:number, duration:number):void {
    for (let channel = 0; channel < source.numberOfChannels; channel++) {
      const sourceBuffer = source.getChannelData(channel);
      const targetBuffer = target.getChannelData(channel);
      for (let sample = 0; sample < duration; sample++) {
        targetBuffer[sample] = sourceBuffer[sample + start];
      }
      const smoothingWindow = 30;
      let smoothedValue = targetBuffer[duration - smoothingWindow];
      let fade = (smoothedValue / smoothingWindow);
      for (let sample = duration - smoothingWindow; sample < duration; sample++) {
        targetBuffer[sample] = smoothedValue;
        smoothedValue -= fade;
      }
      smoothedValue = targetBuffer[smoothingWindow];
      fade = (smoothedValue / smoothingWindow);
      for (let sample = smoothingWindow; sample > -1; sample--) {
        targetBuffer[sample] = smoothedValue;
        smoothedValue -= fade;
      }
    }
  }

  private saySomething(voiceName:string, pitch: number, soundDuration: number):void {
    const buffer = this.availableVoices[voiceName];
    if (buffer) {
      const actualSoundDuration = soundDuration * pitch;
      this.currentVoice = this.audioContext.createBufferSource();
      const sampleBuffer = this.audioContext.createBuffer(2, Math.floor(actualSoundDuration * this.audioContext.sampleRate), this.audioContext.sampleRate);
      const start = Math.floor(Math.random() * (buffer.duration - actualSoundDuration) * this.audioContext.sampleRate);
      this.copyAndFade(buffer, sampleBuffer, start, Math.floor(actualSoundDuration * this.audioContext.sampleRate));
      this.currentVoice.buffer = sampleBuffer;
      this.currentVoice.playbackRate.value = pitch;
      this.currentVoice.connect(this.audioContext.destination);
      this.currentVoice.start();
      this.currentVoice.onended = () => {
        this.saySomething(voiceName, pitch, soundDuration);
      };
    }
  }

  public stop(): void {
    if (this.started && this.currentVoice) {
      this.currentVoice.onended = null;
    }
    window.clearTimeout(this.nextVoiceEvent);
    this.started = false;
  }

  pushLanguage(voiceName:string): Promise<string> {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return fetch(`/assets/audio/${voiceName}.ogg`)
      .then((response) => response.arrayBuffer())
      .then((buffer) => audioCtx.decodeAudioData(buffer))
      .then((buffer) => {
        this.availableVoices[voiceName] = buffer;
        return voiceName;
      });
  }
}

export const CHATTER_BOX = new ChatterBox();

export const loadAllLanguages = (): Promise<string[]> => {
  const languagesToLoad = [
    CHATTER_BOX.pushLanguage('keyboard2'),
  ];
  return Promise.all(languagesToLoad);
};
