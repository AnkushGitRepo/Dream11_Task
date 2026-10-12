import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';

export interface ErrorStateProps {
  readonly title: string;
  readonly text: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
}

export function ErrorState({ title, text, actionLabel, onAction }: ErrorStateProps) {
  return (
    <EmptyState
      role="alert"
      title={title}
      text={text}
      action={
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      }
    />
  );
}
