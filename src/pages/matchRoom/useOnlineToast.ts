import { useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { useStrings } from '@/i18n/useStrings';

/** Tells the fan when the connection drops: the replay continues, AI needs internet. */
export function useOnlineToast(): void {
  const { show } = useToast();
  const { t } = useStrings();
  useEffect(() => {
    const onOffline = () => show(t.offline);
    const onOnline = () => show(t.online);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [show, t]);
}
