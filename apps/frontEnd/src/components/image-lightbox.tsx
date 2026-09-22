'use client';

import { Dialog } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string | null;
  alt?: string;
};

export function ImageLightbox({ open, onOpenChange, src, alt = '图片预览' }: Props) {
  if (!src) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            'fixed inset-0 z-modal bg-black/70',
            'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
          )}
        />
        <Dialog.Popup
          className={cn(
            'fixed inset-0 z-toast flex items-center justify-center p-4 outline-none md:p-8',
            'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
          )}
        >
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <Dialog.Close
            className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] inline-flex size-11 items-center justify-center rounded-sm border border-white/20 bg-black/40 text-white transition hover:bg-black/60"
            aria-label="关闭预览"
          >
            <XIcon className="size-4" />
          </Dialog.Close>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[min(88vh,920px)] max-w-[min(96vw,1100px)] object-contain shadow-[0_24px_64px_-28px_rgba(0,0,0,0.75)]"
            onClick={(e) => e.stopPropagation()}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
