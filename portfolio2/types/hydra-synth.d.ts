declare module "hydra-synth" {
  export type HydraSynthOptions = {
    canvas?: HTMLCanvasElement | null;
    width?: number;
    height?: number;
    detectAudio?: boolean;
    makeGlobal?: boolean;
    autoLoop?: boolean;
    enableStreamCapture?: boolean;
  };

  /** Minimal chain typing for common Hydra patterns (extend as needed). */
  type HydraChain = {
    out: (target?: unknown) => HydraChain | void;
  };

  export default class HydraRenderer {
    constructor(opts?: HydraSynthOptions);
    synth: {
      setResolution: (width: number, height: number) => void;
      render: (output?: unknown) => void;
      osc: (...args: number[]) => HydraChain;
    };
    tick: (dt: number) => void;
    loadScript: (url?: string) => Promise<void>;
    eval: (code: string) => void;
    hush: () => void;
  }
}
