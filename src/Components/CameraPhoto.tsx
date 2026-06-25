import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

type CameraCaptureProps = {
  onPhotoTaken?: (photoDataUrl: string) => void;
};

const CameraCapture = ({ onPhotoTaken }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { t } = useLanguage();

  const stopStream = () => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    setStream(null);
  };

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert(t("cameraNotAvailable"));
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error Accessing Camera:", err);
      const error = err as DOMException;

      if (error.name === "NotAllowedError") {
        alert(t("cameraDenied"));
        return;
      }
      if (error.name === "NotFoundError") {
        alert(t("noCamera"));
        return;
      }
      if (error.name === "NotReadableError") {
        alert(t("cameraInUse"));
        return;
      }
      if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        alert(t("httpsRequired"));
        return;
      }
      alert(`${t("cameraError")}: ${error.name}`);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !stream) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopStream();
    onPhotoTaken?.(canvas.toDataURL("image/png"));
  };

  const isIdle = !stream;

  return (
    <div
      className={`snap-card flex flex-col items-center gap-4 p-5 transition-shadow ${
        isIdle ? "cursor-pointer hover:shadow-[var(--snap-shadow-lg)]" : ""
      }`}
      onClick={isIdle ? startCamera : undefined}
      role={isIdle ? "button" : undefined}
      tabIndex={isIdle ? 0 : undefined}
      onKeyDown={
        isIdle
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                void startCamera();
              }
            }
          : undefined
      }
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-xl"
        style={{ display: stream ? "block" : "none" }}
      />

      {!stream ? (
        <div
          className="flex flex-col items-center gap-3 py-6 text-[var(--snap-text-muted)]"
          aria-label={t("takeIngredientsPhoto")}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-[var(--snap-accent-mid)]">
            <Camera size={32} />
          </div>
          <p className="text-base font-medium text-[var(--snap-text)]">{t("takeIngredientsPhoto")}</p>
        </div>
      ) : (
        <div
          className="flex w-full flex-wrap items-center justify-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={takePhoto} className="snap-btn-primary !w-auto min-w-[8rem]">
            {t("takePhoto")}
          </button>
          <button type="button" onClick={stopStream} className="snap-btn-secondary">
            {t("cancel")}
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
