import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState } from '@/components/ErrorState';
import { MOCK_MATCH_ID, mockTimeline } from '@/mocks/match.mock';
import { getSportUi } from '@/sports/uiRegistry';
import { MatchRoomView } from './matchRoom/MatchRoomView';
import styles from './MatchRoom.module.scss';

export default function MatchRoom() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const timeline = matchId === MOCK_MATCH_ID ? mockTimeline : null;
  const sportUi = timeline ? getSportUi(timeline.meta.sport) : null;

  if (!timeline || !sportUi) {
    return (
      <main className={styles.error}>
        <ErrorState
          title={timeline ? 'Sport not supported yet' : 'Match not found'}
          text={timeline ? 'This sport is coming soon.' : "We couldn't find that match."}
          actionLabel="Browse matches"
          onAction={() => navigate('/matches')}
        />
      </main>
    );
  }

  return <MatchRoomView key={timeline.meta.id} timeline={timeline} sportUi={sportUi} />;
}
