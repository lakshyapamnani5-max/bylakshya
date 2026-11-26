import type { ImgHTMLAttributes, VideoHTMLAttributes } from 'react';
import { useResolvedFileUrl } from '../utils/useResolvedFileUrl';

interface ResolvedImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
}

export function ResolvedImg({ src, ...rest }: ResolvedImgProps) {
  const resolved = useResolvedFileUrl(src);
  if (!resolved) {
    return <div className="w-full h-full bg-[#EAEAF6] animate-pulse" aria-hidden="true" />;
  }
  return <img src={resolved} {...rest} />;
}

interface ResolvedVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'poster'> {
  src: string;
  poster?: string;
}

export function ResolvedVideo({ src, poster, ...rest }: ResolvedVideoProps) {
  const resolvedSrc = useResolvedFileUrl(src);
  const resolvedPoster = useResolvedFileUrl(poster);
  if (!resolvedSrc) {
    return <div className="w-full h-full bg-[#EAEAF6] animate-pulse" aria-hidden="true" />;
  }
  return <video src={resolvedSrc} poster={resolvedPoster || undefined} {...rest} />;
}
