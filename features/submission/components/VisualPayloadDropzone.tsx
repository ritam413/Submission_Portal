import React from "react";

export function VisualPayloadDropzone() {
  return (
    <section>
      <label className="font-headline font-bold uppercase text-lg tracking-tight mb-4 block">
        Artifact Thumbnail / Video Preview
      </label>
      <div className="relative group comic-panel">
        <div className="aspect-video bg-surface-container-highest overflow-hidden flex flex-col items-center justify-center text-center p-8 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
          <img
            alt="Stylized comic book panel illustration"
            className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlciUxJY5O9I33JIvJepKQXV9yExPF9T7NQyyL_Vt1Y2-mKHsBOnNse6blkjHGlBkDDRWZGhM3spGddPwE6w7YlWrOfGSJmF7wkmS5-nfTibke9RyB_px0WjZZujUde_TKhDx-KoeS7H9DCp0G-wBBqll4O_-8hBLEADoS2CKdjH6MFsuo8C8uXfdJ9dnBzgMHhagsy2Zwf1BLPNFeovSCJ3pFAxryAQORf-3coaZansFss4BJQTwrmzjbzB47M48P0OVpznEUo90"
          />
          <div className="relative z-10 flex flex-col items-center">
            <span
              className="material-symbols-outlined text-6xl text-primary mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              add_photo_alternate
            </span>
            <p className="font-headline font-extrabold uppercase text-2xl leading-tight text-on-background">
              Drop Your Visual Payload Here
            </p>
            <p className="font-label text-xs mt-4 uppercase tracking-widest text-on-surface-variant">
              JPG / PNG / GIF / MP4 • MAX 10MB (16:9 Recommended)
            </p>
            <input 
              type="file" 
              name="visualPayload"
              id="visualPayload"
              className="hidden" 
              accept="image/jpeg, image/png, image/gif, video/mp4" 
            />
            <button
              type="button"
              onClick={() => document.getElementById('visualPayload')?.click()}
              className="mt-8 border-2 border-on-background px-8 py-3 font-headline font-bold uppercase hover:bg-on-background hover:text-surface transition-colors bg-white cursor-pointer z-20"
            >
              Select File
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
