"use client";

import { useEffect, useRef } from "react";

const MODEL_URL = "/live2d/nahida/Nahida_1080.model3.json";
const SCRIPT_URLS = [
  "/vendor/live2d/live2dcubismcore.min.js",
  "/vendor/live2d/pixi.min.js",
  "/vendor/live2d/pixi-live2d-display-cubism4.min.js",
];

const scriptPromises = new Map<string, Promise<void>>();

type NahidaLive2DProps = {
  onError?: (error: unknown) => void;
  mood?: "idle" | "thinking" | "happy" | "speaking";
  speaking?: boolean;
};

function loadScript(src: string) {
  const cachedPromise = scriptPromises.get(src);
  if (cachedPromise) return cachedPromise;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-nahida-live2d="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Live2D runtime failed to load: ${src}`)), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.nahidaLive2d = src;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Live2D runtime failed to load: ${src}`));
    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

function setParameter(core: any, id: string, value: number) {
  try {
    core?.setParameterValueById(id, value);
  } catch {
    // Different model versions can expose different parameter names.
  }
}

export default function NahidaLive2D({ onError, mood = "idle", speaking = false }: NahidaLive2DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef(mood);
  const speakingRef = useRef(speaking);

  useEffect(() => {
    moodRef.current = mood;
    speakingRef.current = speaking;
  }, [mood, speaking]);

  useEffect(() => {
    let disposed = false;
    let app: any = null;
    let model: any = null;
    let resizeObserver: ResizeObserver | null = null;
    let pointerMoveHandler: ((event: PointerEvent) => void) | null = null;

    const init = async () => {
      try {
        for (const src of SCRIPT_URLS) {
          await loadScript(src);
        }

        const host = hostRef.current;
        const pixi = (window as any).PIXI;
        const Live2DModel = pixi?.live2d?.Live2DModel;

        if (!host || !pixi?.Application || !Live2DModel) {
          throw new Error("Live2D runtime is unavailable");
        }

        app = new pixi.Application({
          width: host.clientWidth,
          height: host.clientHeight,
          transparent: true,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: window.devicePixelRatio || 1,
        });

        const canvas = app.view as HTMLCanvasElement;
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "auto";
        host.appendChild(canvas);

        model = await Live2DModel.from(MODEL_URL, {
          autoInteract: true,
        });

        if (disposed) return;

        app.stage.addChild(model);
        model.interactive = true;
        model.buttonMode = true;

        const baseWidth = Math.max(model.width, 1);
        const baseHeight = Math.max(model.height, 1);
        let fittedScale = 1;
        let baseY = 0;

        const layout = () => {
          if (!model || !app || !host) return;

          const width = Math.max(host.clientWidth, 1);
          const height = Math.max(host.clientHeight, 1);
          app.renderer.resize(width, height);

          fittedScale = Math.min(width / baseWidth, height / baseHeight) * 0.94;
          baseY = height * 0.99;
          model.scale.set(fittedScale);
          model.anchor.set(0.5, 1);
          model.x = width / 2;
          model.y = baseY;
        };

        let idleVariant = Math.floor(Math.random() * 4);
        let previousIdleVariant = idleVariant;
        let variantChangedAt = performance.now() / 1000;
        let nextVariantAt = variantChangedAt + 8 + Math.random() * 6;

        const getIdlePose = (variant: number, time: number) => {
          switch (variant) {
            case 1:
              return {
                angleX: Math.sin(time * 0.34) * 5.5,
                angleY: Math.sin(time * 0.48 + 1) * 2.2,
                angleZ: Math.sin(time * 0.28) * 1.6,
                eyeY: Math.sin(time * 0.62) * 0.14,
              };
            case 2:
              return {
                angleX: Math.sin(time * 0.72) * 3.2,
                angleY: -1.7 + Math.sin(time * 0.82) * 1.1,
                angleZ: Math.sin(time * 0.5) * 1.2,
                eyeY: -0.18 + Math.sin(time * 0.7) * 0.07,
              };
            case 3:
              return {
                angleX: Math.sin(time * 1.05) * 2.4,
                angleY: Math.sin(time * 0.9 + 0.7) * 2.3,
                angleZ: Math.sin(time * 0.78) * 2.8,
                eyeY: Math.sin(time * 1.25) * 0.1,
              };
            default:
              return {
                angleX: Math.sin(time * 0.58) * 2.8,
                angleY: Math.sin(time * 0.8 + 1) * 1.5,
                angleZ: Math.sin(time * 0.42) * 1.4,
                eyeY: Math.sin(time * 0.38) * 0.06,
              };
          }
        };

        pointerMoveHandler = (event: PointerEvent) => {
          if (!model?.focus || !host) return;
          const rect = host.getBoundingClientRect();
          model.focus(event.clientX - rect.left, event.clientY - rect.top);
        };

        const animate = () => {
          if (!model?.internalModel?.coreModel) return;

          const time = performance.now() / 1000;
          const core = model.internalModel.coreModel;
          const currentMood = moodRef.current;
          const isSpeaking = speakingRef.current;

          if (currentMood === "idle" && time >= nextVariantAt) {
            previousIdleVariant = idleVariant;
            idleVariant = (idleVariant + 1 + Math.floor(Math.random() * 3)) % 4;
            variantChangedAt = time;
            nextVariantAt = time + 8 + Math.random() * 7;
          }

          const idleA = getIdlePose(previousIdleVariant, time);
          const idleB = getIdlePose(idleVariant, time);
          const idleBlend = Math.min(1, Math.max(0, (time - variantChangedAt) / 1.5));
          const idlePose = {
            angleX: idleA.angleX + (idleB.angleX - idleA.angleX) * idleBlend,
            angleY: idleA.angleY + (idleB.angleY - idleA.angleY) * idleBlend,
            angleZ: idleA.angleZ + (idleB.angleZ - idleA.angleZ) * idleBlend,
            eyeY: idleA.eyeY + (idleB.eyeY - idleA.eyeY) * idleBlend,
          };

          const effectiveMood = currentMood;
          const headX = effectiveMood === "thinking"
            ? Math.sin(time * 1.1) * 4.5
            : effectiveMood === "happy"
              ? Math.sin(time * 1.25) * 3.8
              : effectiveMood === "speaking"
                ? Math.sin(time * 0.9) * 2.8
                : idlePose.angleX;
          const headY = effectiveMood === "thinking"
            ? -2 + Math.sin(time * 0.8) * 1.3
            : effectiveMood === "happy"
              ? 1.2 + Math.sin(time * 0.75) * 1.4
              : effectiveMood === "speaking"
                ? Math.sin(time * 0.8 + 1) * 1.6
                : idlePose.angleY;
          const bodyZ = effectiveMood === "happy"
            ? Math.sin(time * 0.85) * 2.6
            : effectiveMood === "thinking"
              ? Math.sin(time * 0.5) * 1.8
              : effectiveMood === "speaking"
                ? Math.sin(time * 0.65) * 1.8
                : idlePose.angleZ;

          setParameter(core, "ParamAngleX", headX);
          setParameter(core, "ParamAngleY", headY);
          setParameter(core, "ParamAngleZ", bodyZ * 0.55);
          setParameter(core, "ParamBodyAngleZ", bodyZ);
          setParameter(core, "ParamBreath", 0.5 + Math.sin(time * 1.7) * 0.15);

          const visualMotion = { x: 1.4, y: 1.8, rotation: 0.006, scale: 0.006 };
          const motionPhase = time * 1.65;
          model.x = host.clientWidth / 2 + Math.sin(motionPhase) * visualMotion.x;
          model.y = baseY + Math.sin(motionPhase * 1.07) * visualMotion.y;
          model.rotation = Math.sin(motionPhase * 0.72) * visualMotion.rotation;
          model.scale.set(fittedScale * (1 + Math.sin(motionPhase * 1.08) * visualMotion.scale));

          // A slow, regular blink keeps the idle state alive without using a
          // motion group that this particular model does not provide.
          const blinkPhase = (time % 5.8) / 5.8;
          const blink = blinkPhase > 0.88
            ? Math.sin(((blinkPhase - 0.88) / 0.12) * Math.PI)
            : 0;
          const eyeOpen = Math.max(0.08, 1 - blink);
          setParameter(core, "ParamEyeLOpen", eyeOpen);
          setParameter(core, "ParamEyeROpen", eyeOpen);

          // Move the eyes toward the pointer, then add a small thinking glance.
          setParameter(core, "ParamEyeBallY", effectiveMood === "thinking"
            ? -0.22 + Math.sin(time * 1.5) * 0.12
            : effectiveMood === "happy"
              ? 0.08 + Math.sin(time * 0.7) * 0.08
              : effectiveMood === "idle"
                ? idlePose.eyeY
                : Math.sin(time * 0.35) * 0.08);

          if (isSpeaking || effectiveMood === "speaking") {
            setParameter(core, "ParamMouthOpenY", 0.12 + (Math.sin(time * 11) + 1) * 0.16);
          } else {
            setParameter(core, "ParamMouthOpenY", effectiveMood === "happy" ? 0.18 : 0.03);
          }

          setParameter(core, "ParamMouthForm2", effectiveMood === "happy" ? 0.7 : 0);
          setParameter(core, "ParamMouthForm3", effectiveMood === "happy" ? 0.45 : 0);
          setParameter(core, "ParamBrowLAngle", effectiveMood === "thinking" ? -0.25 : 0);
          setParameter(core, "ParamBrowRAngle", effectiveMood === "thinking" ? -0.25 : 0);
        };

        host.addEventListener("pointermove", pointerMoveHandler);
        app.ticker.add(animate);
        resizeObserver = new ResizeObserver(layout);
        resizeObserver.observe(host);
        layout();
      } catch (error) {
        if (!disposed) {
          console.error("[NahidaLive2D] failed to initialize", error);
          onError?.(error);
        }
      }
    };

    init();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();

      const host = hostRef.current;
      if (host && pointerMoveHandler) {
        host.removeEventListener("pointermove", pointerMoveHandler);
      }
      if (host) {
        host.replaceChildren();
      }

      try {
        app?.destroy(true, { children: true, texture: false, baseTexture: false });
      } catch {
        app?.destroy?.(true);
      }

      model = null;
      app = null;
      pointerMoveHandler = null;
    };
  }, [onError]);

  return <div ref={hostRef} className="h-full w-full" aria-label="纳西妲 Live2D" />;
}
