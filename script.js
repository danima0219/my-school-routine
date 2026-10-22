(() => {
    const correctAnswer = 'sit';
    const answerLabels = { wash: 'Wash body', brush: 'Brush Teeth', sit: 'Sit at table' };
    const answerSymbols = { sit: '🪑', brush: '🪥', wash: '🧼' };
    const supportButtons = [...document.querySelectorAll('[data-support]')];
    const responseButtons = [...document.querySelectorAll('[data-answer]')];
    const recordBtn = document.getElementById('recordBtn');
    const feedback = document.getElementById('feedback');
    const logRows = document.getElementById('logRows');
    const settingsDialog = document.getElementById('settingsDialog');
    let selectedSupport = 'Independent';
    let selectedAnswer = null;
    let logs = [];
    let locked = false;
    let representation = 'emoji';

    function selectSupport(value) {
      selectedSupport = value;
      supportButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.support === value)));
      document.getElementById('selectedSupportText').textContent = 'Support selected: ' + value;
    }

    function speakCardLabel(label) {
      if (!window.speechSynthesis ||
        typeof window.SpeechSynthesisUtterance === 'undefined') {
        feedback.textContent = 'Audio is not supported in this browser.';
        return false;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(label);
      utterance.lang = 'en-AU';
      utterance.rate = 0.85;

      window.speechSynthesis.speak(utterance);
      return true;
    }


    supportButtons.forEach(button => button.addEventListener('click', () => selectSupport(button.dataset.support)));


    responseButtons.forEach(button => button.addEventListener('click', () => {
      if (locked) return;
      selectedAnswer = button.dataset.answer;
      responseButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      speakCardLabel(answerLabels[selectedAnswer]);
      recordBtn.disabled = false;
      feedback.className = 'feedback';
      feedback.textContent = 'Response selected. The educator can record accuracy and the level of support provided.';
    }));

    recordBtn.addEventListener('click', () => {
      if (!selectedAnswer || locked) return;
      const correct = selectedAnswer === correctAnswer;
      const record = { time: new Date().toLocaleString('en-AU'), learner: document.getElementById('learnerName').value.trim() || 'Not specified', answer: answerLabels[selectedAnswer], accuracy: correct ? 'Correct' : 'Incorrect', support: selectedSupport, independentCorrect: correct && selectedSupport === 'Independent' };
      logs.push(record);
      renderLogs();
      locked = true;
      responseButtons.forEach(button => button.disabled = true);
      recordBtn.disabled = true;
      feedback.className = 'feedback ' + (correct ? 'good' : 'retry');
      feedback.textContent = correct ? 'Thank you for responding! The educator has recorded your answer.' : 'Response recorded. You can review the sequence with the educator.';
      document.getElementById('instructionText').textContent = 'The activity has been recorded. The educator can reset it to try again.';
    });

    function renderLogs() {
      logRows.innerHTML = '';
      if (!logs.length) { logRows.innerHTML = '<tr><td colspan="4">No responses recorded yet.</td></tr>'; return; }
      logs.slice().reverse().forEach(item => {
        const tr = document.createElement('tr');
        [item.time, item.answer, item.accuracy + (item.independentCorrect ? ' · independent' : (item.accuracy === 'Correct' ? ' · supported' : '')), item.support].forEach(value => {
          const td = document.createElement('td'); td.textContent = value; tr.appendChild(td);
        });
        logRows.appendChild(tr);
      });
    }

    document.getElementById('resetBtn').addEventListener('click', () => {
      selectedAnswer = null; locked = false;
      responseButtons.forEach(button => { button.disabled = false; button.setAttribute('aria-pressed', 'false'); });
      recordBtn.disabled = true;
      feedback.className = 'feedback'; feedback.textContent = '';
      document.getElementById('instructionText').textContent = 'Choose the card that shows what we do after putting our bag away.';
      selectSupport('Independent');
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      if (!logs.length) { alert('There are no records to export yet.'); return; }
      const columns = ['time', 'learner', 'answer', 'accuracy', 'support', 'independentCorrect'];
      const escapeCsv = value => '"' + String(value).replaceAll('"', '""') + '"';
      const csv = [columns.join(','), ...logs.map(row => columns.map(key => escapeCsv(row[key])).join(','))].join('\r\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = 'school_routine_log.csv'; link.click(); URL.revokeObjectURL(url);
    });

    document.getElementById('settingsBtn').addEventListener('click', () => settingsDialog.showModal());
    document.getElementById('closeSettings').addEventListener('click', () => settingsDialog.close());
    document.getElementById('saveSettings').addEventListener('click', () => {
      representation = document.getElementById('representationSet').value;
      const routineName = document.getElementById('routineName').value.trim() || 'My School Routine';
      document.querySelector('h1').textContent = routineName;
      document.title = routineName;
      document.querySelector('.brand-mark').textContent = representation === 'text' ? 'ABC' : representation === 'photo' ? '▧' : '☀';
      document.querySelectorAll('.step-card .symbol').forEach(el => {
        if (representation === 'text') { el.textContent = 'Image'; el.style.fontSize = '22px'; }
        else if (representation === 'photo') { el.textContent = 'Add photo'; el.style.fontSize = '20px'; }
        else { const symbols = ['👋', '✍️', '🎒']; el.textContent = symbols[[...document.querySelectorAll('.step-card .symbol')].indexOf(el)]; el.style.fontSize = ''; }
      });
      responseButtons.forEach(button => {
        const key = button.dataset.answer;
        const symbol = button.querySelector('.symbol');
        if (representation === 'text') { symbol.textContent = 'Image'; symbol.style.fontSize = '22px'; }
        else if (representation === 'photo') { symbol.textContent = 'Add photo'; symbol.style.fontSize = '20px'; }
        else { symbol.textContent = answerSymbols[key]; symbol.style.fontSize = ''; }
      });
      settingsDialog.close();
    });
  })();