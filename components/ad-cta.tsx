import React, { useState } from 'react';
import adService from '../lib/ad-service';

type Props = {
  gameEngine?: any; // GameEngine instance
  powerUpManager?: any; // PowerUpManager instance
  player?: any; // player object expected by PowerUpManager
  placementId?: string;
};

export default function AdCTA({ gameEngine, powerUpManager, player, placementId = 'reward_shield' }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const onWatch = async () => {
    if (!gameEngine || !powerUpManager) {
      setStatus('Ad system not ready');
      setTimeout(() => setStatus(null), 1200);
      return;
    }
    setLoading(true);
    setStatus('Loading ad...');
    try {
      await adService.load(placementId);
      setStatus('Showing ad...');
      // Pause game before showing
      gameEngine.pauseForAd();
      const result = await adService.show(placementId);
      if (result === 'completed') {
        setStatus('Ad completed — granting reward');
        await powerUpManager.grantReward('shield', player);
      } else if (result === 'skipped') {
        setStatus('Ad skipped — no reward');
      } else {
        setStatus('Ad failed to play');
      }
    } catch (err) {
      setStatus('Ad error');
    } finally {
      // Resume with a short grace period
      gameEngine.resumeFromAd(600);
      setLoading(false);
      setTimeout(() => setStatus(null), 2200);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={onWatch} disabled={loading} style={{ padding: '8px 12px' }}>
        {loading ? 'Please wait...' : 'Watch to get Shield'}
      </button>
      {status && <div style={{ color: '#fff' }}>{status}</div>}
    </div>
  );
}
