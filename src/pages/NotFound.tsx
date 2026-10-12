import PlaceholderPage from '@/components/PlaceholderPage';
import { useStrings } from '@/i18n/useStrings';

export default function NotFound() {
  const { t } = useStrings();
  return <PlaceholderPage title={t.notFoundTitle} note={t.notFoundText} />;
}
