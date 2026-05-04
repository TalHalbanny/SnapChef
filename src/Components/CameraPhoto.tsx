import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@heroui/react";
import { Camera } from "lucide-react";


//

type CameraCaptureProps = {
  onPhotoTaken?: (photoDataUrl: string) => void;
};

const CameraCapture = ({ onPhotoTaken }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastCapturedImageRef = useRef<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);


  //start camera fucnction

  const stopStream = () => {
    if (!stream) return;
    stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    setStream(null);
  };

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera is not available. Open this app in Chrome/Safari over HTTPS.");
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
        alert(
          "Camera permission was denied. Allow camera access in your browser settings and try again.",
        );
        return;
      }

      if (error.name === "NotFoundError") {
        alert("No camera found on this device.");
        return;
      }

      if (error.name === "NotReadableError") {
        alert("Camera is currently in use by another app. Close it and try again.");
        return;
      }

      if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        alert("On phones, camera access usually requires HTTPS. Open the app with an HTTPS URL.");
        return;
      }

      alert(`Could not access camera: ${error.name}`);
    }
  };

  //take picture function

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !stream) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/png');
    lastCapturedImageRef.current = dataUrl;
    
  
    stopStream();

    if (onPhotoTaken) onPhotoTaken(dataUrl);
  };

  const isIdle = !stream;

  return (
    <Card
      className={`p-4 flex flex-col items-center gap-4 ${
        isIdle
          ? "cursor-pointer shadow-[0_0_28px_rgba(156,171,132,0.85)]"
          : ""
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
      <>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          style={{ width: '100%', borderRadius: '12px', display: stream ? 'block' : 'none' }} 
        />
        {!stream ? (
          <div className="flex items-center gap-3 text-[#9CAB84]" aria-label="Take Ingredients Photo">
            <Camera size={32} />
            <p>Take Ingredients Photo</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={takePhoto}>Take Photo</Button>
            <Button variant="outline" onClick={stopStream}>Cancel</Button>
          </div>
        )}
      </>
    </Card>
  );
};

export default CameraCapture;