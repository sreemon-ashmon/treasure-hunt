// ============================================
// Shared engine used by every station page.
// Each station page just sets STATION_ID and IMAGE_URL, then calls initStation().
// ============================================

function initStation(STATION_ID, IMAGE_URL) {
  const gateEl = document.getElementById('gate');
  const gameEl = document.getElementById('game');
  const clueEl = document.getElementById('clue-box');
  const clueText = document.getElementById('clue-text');

  const team = localStorage.getItem('qrhunt_team');
  const secret = localStorage.getItem('qrhunt_secret');

  if (!team || !secret) {
    showGate('Not registered', 'Go back to the login page and select your department first.', false);
    return;
  }

  const teamRef = db.ref('teams/' + team);

  teamRef.get().then(snap => {
    if (!snap.exists()) {
      showGate('Team not found', 'Something went wrong — re-register from the login page.', false);
      return;
    }
    const data = snap.val();
    const required = data.order[data.currentIndex];

    if (required !== STATION_ID) {
      showGate("Not your QR yet!", "Think back to the last clue you cracked — it points somewhere else. Keep searching.", true);
      return;
    }

    // Correct station — show the mini-game
    gateEl.style.display = 'none';
    gameEl.style.display = 'block';
    startPuzzle(IMAGE_URL, () => onSolved(teamRef, team, secret, STATION_ID));
  });

  function showGate(title, message, isWrong) {
    gateEl.style.display = 'flex';
    gameEl.style.display = 'none';
    gateEl.classList.toggle('wrong', isWrong);
    document.getElementById('gate-title').textContent = title;
    document.getElementById('gate-msg').textContent = message;
  }

  function onSolved(teamRef, team, secret, STATION_ID) {
    // Re-verify before writing, guards against double-fire / stale state
    teamRef.get().then(snap => {
      const data = snap.val();
      const required = data.order[data.currentIndex];
      if (required !== STATION_ID) return; // already advanced, ignore duplicate solve

      const newIndex = data.currentIndex + 1;
      const totalStations = data.order.length;
      const updates = {
        currentIndex: newIndex,
        secretToken: secret
      };
      if (newIndex >= totalStations) {
        updates.finishedAt = Date.now();
      }

      teamRef.update(updates).then(() => {
        gameEl.style.display = 'none';
        clueEl.style.display = 'block';

        if (newIndex >= totalStations) {
          // No stations left — this was the last one
          clueText.textContent = "🏆 You've cracked the final checkpoint — head to the FINISH QR and claim your win!";
        } else {
          // Reveal the clue for the NEXT station in their sequence, not this one
          const nextStationId = data.order[newIndex];
          db.ref('stations/' + nextStationId + '/clue').get().then(clueSnap => {
            clueText.textContent = clueSnap.val();
          });
        }
      });
    });
  }
}

// ---- Sliding tile puzzle (reused from the demo puzzle) ----
function startPuzzle(IMAGE_URL, onSolve) {
  const GRID = 3;
  const TILE_COUNT = GRID * GRID;
  const BLANK_INDEX = TILE_COUNT - 1;
  const puzzleEl = document.getElementById('puzzle');
  const statusEl = document.getElementById('puzzle-status');
  let tiles = [];

  function originalPosition(tileIndex) {
    const row = Math.floor(tileIndex / GRID);
    const col = tileIndex % GRID;
    return `${-col * 100}% ${-row * 100}%`;
  }

  function render() {
    puzzleEl.innerHTML = '';
    tiles.forEach((tileIndex, position) => {
      const div = document.createElement('div');
      div.className = 'tile';
      if (tileIndex === BLANK_INDEX) {
        div.classList.add('blank');
      } else {
        div.style.backgroundImage = `url("${IMAGE_URL}")`;
        div.style.backgroundPosition = originalPosition(tileIndex);
      }
      div.addEventListener('click', () => attemptMove(position));
      puzzleEl.appendChild(div);
    });
  }

  function isAdjacent(a, b) {
    const rowA = Math.floor(a / GRID), colA = a % GRID;
    const rowB = Math.floor(b / GRID), colB = b % GRID;
    return (Math.abs(rowA - rowB) + Math.abs(colA - colB)) === 1;
  }

  function attemptMove(position) {
    const blankPos = tiles.indexOf(BLANK_INDEX);
    if (isAdjacent(position, blankPos)) {
      [tiles[position], tiles[blankPos]] = [tiles[blankPos], tiles[position]];
      render();
      checkSolved();
    }
  }

  function checkSolved() {
    const solved = tiles.every((t, p) => t === p);
    if (solved) {
      statusEl.textContent = "Solved!";
      onSolve();
    }
  }

  function isSolvable(arr) {
    const flat = arr.filter(v => v !== BLANK_INDEX);
    let inversions = 0;
    for (let i = 0; i < flat.length; i++)
      for (let j = i + 1; j < flat.length; j++)
        if (flat[i] > flat[j]) inversions++;
    return inversions % 2 === 0;
  }

  do {
    tiles = Array.from({ length: TILE_COUNT }, (_, i) => i);
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while (!isSolvable(tiles) || tiles.every((v, i) => v === i));

  render();
}
