import { useEffect, useState } from 'react';
import PinAuth from '../components/PinAuth';
import './ParentDashboardPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const buildNewChoreState = (kids = []) =>
  kids.reduce((acc, kid) => {
    acc[kid.id] = { name: '', pointValue: ''};
    return acc;
  }, {});

const normalizeKidPayload = (data = []) =>
  data.map((kid) => ({
    ...kid,
    chores: (kid.chores || []).map((chore) => ({
      ...chore,
      pointValue: chore.pointValue !== undefined && chore.pointValue !== null
        ? String(chore.pointValue)
        : '0'
    })),
  }));

const formatUnlockTime = (unlockTime) => {
  if (!unlockTime) {
    return null;
  }

  try {
    const date = new Date(unlockTime);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleString();
  } catch (error) {
    return null;
  }
};

function ParentDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [kids, setKids] = useState([]);
  const [newChores, setNewChores] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusByKid, setStatusByKid] = useState({});
  const [savingByChore, setSavingByChore] = useState({});
  const [addingByKid, setAddingByKid] = useState({});
  const [deletingByChore, setDeletingByChore] = useState({});

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const resetStatusAfterDelay = (kidId) => {
    if (!kidId) return;
    setTimeout(() => {
      setStatusByKid((prev) => {
        const next = { ...prev };
        delete next[kidId];
        return next;
      });
    }, 4000);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/parent/children-with-chores`);
      if (!response.ok) {
        throw new Error('Failed to load parent dashboard data');
      }
      const payload = await response.json();
      const normalized = normalizeKidPayload(payload);
      setKids(normalized);
      setNewChores(buildNewChoreState(normalized));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong loading the dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const handleChoreFieldChange = (kidId, kidsChoreId, field, value) => {
    setKids((prev) => prev.map((kid) => {
      if (kid.id !== kidId) return kid;
      return {
        ...kid,
        chores: kid.chores.map((chore) => {
          if (chore.kidsChoreId !== kidsChoreId) return chore;
          return {
            ...chore,
            [field]: field === 'pointValue' ? value : value,
          };
        }),
      };
    }));
  };

  const handleNewChoreFieldChange = (kidId, field, value) => {
    setNewChores((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        [field]: field === 'pointValue' ? value : value,
      },
    }));
  };

  const handleSaveChore = async (kidId, chore) => {
    const payload = {
      name: chore.name,
      pointValue: chore.pointValue,
    };

    if (!payload.name || payload.name.trim().length === 0) {
      setStatusByKid((prev) => ({
        ...prev,
        [kidId]: { type: 'error', message: 'Chore name cannot be empty.' },
      }));
      resetStatusAfterDelay(kidId);
      return;
    }

    setSavingByChore((prev) => ({ ...prev, [chore.kidsChoreId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/parent/kids/${kidId}/chores/${chore.kidsChoreId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save chore changes');
      }

      const updated = await response.json();

      setKids((prev) => prev.map((kid) => {
        if (kid.id !== kidId) return kid;
        return {
          ...kid,
          chores: kid.chores.map((existing) => {
            if (existing.kidsChoreId !== updated.kidsChoreId) return existing;
            return {
              ...existing,
              name: updated.name,
              pointValue: String(updated.pointValue),
              unlockTime: updated.unlockTime,
            };
          }),
        };
      }));

      setStatusByKid((prev) => ({
        ...prev,
        [kidId]: { type: 'success', message: 'Chore updated successfully.' },
      }));
      resetStatusAfterDelay(kidId);
    } catch (err) {
      console.error(err);
      setStatusByKid((prev) => ({
        ...prev,
        [kidId]: { type: 'error', message: err.message || 'Unable to save chore.' },
      }));
      resetStatusAfterDelay(kidId);
    } finally {
      setSavingByChore((prev) => {
        const next = { ...prev };
        delete next[chore.kidsChoreId];
        return next;
      });
    }
  };

  const handleDeleteChore = async (kidId, chore) => {
    const confirmation = window.confirm(`Delete "${chore.name}" for ${kids.find((kid) => kid.id === kidId)?.name || 'this child'}?`);
    if (!confirmation) {
      return;
    }

    setDeletingByChore((prev) => ({ ...prev, [chore.kidsChoreId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/parent/kids/${kidId}/chores/${chore.kidsChoreId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chore');
      }

      setKids((prev) => prev.map((kid) => {
        if (kid.id !== kidId) return kid;
        return {
          ...kid,
          chores: kid.chores.filter((existing) => existing.kidsChoreId !== chore.kidsChoreId),
        };
      }));

      setStatusByKid((prev) => ({
        ...prev,
        [kidId]: { type: 'success', message: 'Chore deleted.' },
      }));
      resetStatusAfterDelay(kidId);
    } catch (err) {
      console.error(err);
      setStatusByKid((prev) => ({
        ...prev,
        [kidId]: { type: 'error', message: err.message || 'Unable to delete chore.' },
      }));
      resetStatusAfterDelay(kidId);
    } finally {
      setDeletingByChore((prev) => {
        const next = { ...prev };
        delete next[chore.kidsChoreId];
        return next;
      });
    }
  };

  const handleAddChore = async (kidId) => {
    const newChore = newChores[kidId] || { name: '', pointValue: '' };
    const payload = {
      name: newChore.name,
      pointValue: newChore.pointValue,
    };

    if (!payload.name || payload.name.trim().length === 0) {
      setStatusByKid((prev) => ({
        ...prev,
        [kidId]: { type: 'error', message: 'Please enter a chore name.' },
      }));
      resetStatusAfterDelay(kidId);
      return;
    }

    setAddingByKid((prev) => ({ ...prev, [kidId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/parent/kids/${kidId}/chores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to add chore');
      }

      const created = await response.json();

      setKids((prev) => prev.map((kid) => {
        if (kid.id !== kidId) return kid;
        return {
          ...kid,
          chores: [
            ...kid.chores,
            {
              ...created,
              pointValue: String(created.pointValue ?? '0'),
            },
          ],
        };
      }));

      setNewChores((prev) => ({
        ...prev,
        [kidId]: { name: '', pointValue: ''},
      }));

      setStatusByKid((prev) => ({
        ...prev,
        [kidId]: { type: 'success', message: 'New chore added.' },
      }));
      resetStatusAfterDelay(kidId);
    } catch (err) {
      console.error(err);
      setStatusByKid((prev) => ({
        ...prev,
        [kidId]: { type: 'error', message: err.message || 'Unable to add chore.' },
      }));
      resetStatusAfterDelay(kidId);
    } finally {
      setAddingByKid((prev) => {
        const next = { ...prev };
        delete next[kidId];
        return next;
      });
    }
  };

  if (!isAuthenticated) {
    return <PinAuth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="parent-dashboard-container">
      <div className="dashboard-header">
        <h1>Parent Dashboard</h1>
        <p>Manage each child's chores and points.</p>
      </div>

      {loading && (
        <div className="dashboard-loading">Loading dashboard…</div>
      )}

      {error && !loading && (
        <div className="dashboard-error">{error}</div>
      )}

      {!loading && !error && kids.length === 0 && (
        <div className="dashboard-empty">No children found. Add some in the database to get started.</div>
      )}

      {!loading && !error && kids.length > 0 && (
        <div className="dashboard-grid">
          {kids.map((kid) => (
            <div key={kid.id} className="kid-card">
              <div className="kid-card-header">
                <div>
                  <h3>{kid.name}</h3>
                  <p className="kid-card-meta">
                    {kid.points ?? 0} point{(kid.points ?? 0) === 1 ? '' : 's'} available
                  </p>
                </div>
                {statusByKid[kid.id] && (
                  <div className={`kid-status kid-status--${statusByKid[kid.id].type}`}>
                    {statusByKid[kid.id].message}
                  </div>
                )}
              </div>

              <div className="chore-list">
                <div className="chore-row chore-row--header">
                  <span>Chore</span>
                  <span>Points</span>
                  <span className="chore-actions-label">Actions</span>
                </div>

                {kid.chores.map((chore) => (
                  <div key={chore.kidsChoreId} className="chore-row">
                    <div className="chore-name">
                      <input
                        type="text"
                        value={chore.name}
                        onChange={(event) => handleChoreFieldChange(kid.id, chore.kidsChoreId, 'name', event.target.value)}
                        placeholder="Chore name"
                      />
                      {formatUnlockTime(chore.unlockTime) && (
                        <small className="unlock-hint">Unlocks {formatUnlockTime(chore.unlockTime)}</small>
                      )}
                    </div>
                    <div className="chore-points">
                      <input
                        type="number"
                        min="0"
                        value={chore.pointValue}
                        onChange={(event) => handleChoreFieldChange(kid.id, chore.kidsChoreId, 'pointValue', event.target.value)}
                      />
                    </div>
                    <div className="chore-actions">
                      <button
                        type="button"
                        className="pd-btn pd-btn--primary"
                        onClick={() => handleSaveChore(kid.id, chore)}
                        disabled={Boolean(savingByChore[chore.kidsChoreId])}
                      >
                        {savingByChore[chore.kidsChoreId] ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="pd-btn pd-btn--danger"
                        onClick={() => handleDeleteChore(kid.id, chore)}
                        disabled={Boolean(deletingByChore[chore.kidsChoreId])}
                      >
                        {deletingByChore[chore.kidsChoreId] ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="chore-row chore-row--new">
                  <div className="chore-name">
                    <input
                      type="text"
                      placeholder="New chore name"
                      value={newChores[kid.id]?.name || ''}
                      onChange={(event) => handleNewChoreFieldChange(kid.id, 'name', event.target.value)}
                    />
                  </div>
                  <div className="chore-points">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newChores[kid.id]?.pointValue || ''}
                      onChange={(event) => handleNewChoreFieldChange(kid.id, 'pointValue', event.target.value)}
                    />
                  </div>
                  <div className="chore-actions">
                    <button
                      type="button"
                      className="pd-btn pd-btn--success"
                      onClick={() => handleAddChore(kid.id)}
                      disabled={Boolean(addingByKid[kid.id])}
                    >
                      {addingByKid[kid.id] ? 'Adding…' : 'Add chore'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ParentDashboardPage;