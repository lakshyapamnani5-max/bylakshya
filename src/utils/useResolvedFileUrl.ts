import { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  extractFirestoreFileId,
  resolveFirestoreFileBlobUrl,
} from './firestoreFiles';

export function useResolvedFileUrl(rawUrl: string | undefined | null): string {
  const fileId = extractFirestoreFileId(rawUrl);
  const [resolvedUrl, setResolvedUrl] = useState<string>(() => (fileId ? '' : rawUrl || ''));

  useEffect(() => {
    if (!fileId) {
      setResolvedUrl(rawUrl || '');
      return;
    }

    let active = true;
    resolveFirestoreFileBlobUrl(db, fileId)
      .then((blobUrl) => {
        if (active) setResolvedUrl(blobUrl);
      })
      .catch(() => {
        if (active) setResolvedUrl('');
      });

    return () => {
      active = false;
    };
  }, [fileId, rawUrl]);

  return resolvedUrl;
}
