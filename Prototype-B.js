(() => {
    'use strict';
  
    const correctAnswer = 'sit';
    const answerLabels = { wash: 'Wash body', brush: 'Brush teeth', sit: 'Sit at table' };
    const answerSymbols = { wash: '🧼', brush: '🪥', sit: '🪑' };
    const routineSymbols = ['👋', '✍️', '🎒'];
    const routineLabels = ['Arrive at school', 'Sign in', 'Put bag away'];
    const supportButtons = [...document.querySelectorAll('[data-support]')];
    const responseButtons = [...document.querySelectorAll('[data-answer]')];
    const recordBtn = document.getElementById('recordBtn');
    const feedback = document.getElementById('feedback');
    const logRows = document.getElementById('logRows');
    const settingsDialog = document.getElementById('settingsDialog');
    const app = document.getElementById('app');
    const logs = [];
    const customImages = {};
    const originalImageSources = {
      'routine-0': 'images/Arrive.png',
      'routine-1': 'images/Sign.png',
      'routine-2': 'images/PutBag.png',
      wash: 'images/WashBody.png',
      brush: 'images/Brush.png',
      sit: 'images/Sit.png'
    };
    let selectedSupport = 'Independent';
    let selectedAnswer = null;
    let locked = false;
    let representation = 'images';
    let speechMode = 'manual';
  
    const fileMap = {
      'upload-arrive': 'routine-0',
      'upload-sign': 'routine-1',
      'upload-bag': 'routine-2',
      'upload-wash': 'wash',
      'upload-brush': 'brush',
      'upload-sit': 'sit'
    };
  
    function selectSupport(value) {
      selectedSupport = value;
      supportButtons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.support === value));
      });
      document.getElementById('selectedSupportText').textContent = `Support selected: ${value}`;
    }
  
    function speakText(text) {
      if (speechMode === 'off') {
        feedback.textContent = 'Speech output is turned off in educator settings.';
        return false;
      }
      if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
        feedback.textContent = 'Speech output is not supported in this browser.';
        return false;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-AU';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
      return true;
    }
  
    function renderVisuals() {
      document.querySelectorAll('.step-card').forEach((card, index) => {
        const wrap = card.querySelector('.symbol-wrap');
        const img = wrap.querySelector('img');
        const key = `routine-${index}`;
        applyVisual(wrap, img, key, routineSymbols[index], routineLabels[index]);
      });
  
      responseButtons.forEach(button => {
        const key = button.dataset.answer;
        const wrap = button.querySelector('.symbol-wrap');
        const img = wrap.querySelector('img');
        applyVisual(wrap, img, key, answerSymbols[key], answerLabels[key]);
      });
    }
  
    function applyVisual(wrap, img, key, symbol, label) {
      wrap.replaceChildren();
      if (representation === 'text') {
        const text = document.createElement('span');
        text.className = 'text-visual';
        text.textContent = label;
        wrap.appendChild(text);
        return;
      }
      if (representation === 'symbols') {
        const symbolEl = document.createElement('span');
        symbolEl.className = 'emoji-visual';
        symbolEl.textContent = symbol;
        wrap.appendChild(symbolEl);
        return;
      }
      const image = document.createElement('img');
      image.className = 'symbol';
      image.alt = '';
      image.loading = 'lazy';
      const uploaded = customImages[key];
      const originalSrc = originalImageSources[key];
      if (representation === 'photos' && uploaded) {
        image.src = uploaded;
      } else if (originalSrc) {
        image.src = originalSrc;
      } else {
        image.src = uploaded || '';
      }
      if (!image.src) {
        const fallback = document.createElement('span');
        fallback.className = 'photo-fallback';
        fallback.textContent = 'Add photo';
        wrap.appendChild(fallback);
      } else {
        wrap.appendChild(image);
      }
    }
  
    function updateSelection(button) {
      if (locked) return;
      selectedAnswer = button.dataset.answer;
      responseButtons.forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      recordBtn.disabled = false;
      feedback.className = 'feedback';
      feedback.textContent = 'Response selected. The educator can record the outcome and support level.';
      if (speechMode === 'automatic') speakText(answerLabels[selectedAnswer]);
    }
  
    responseButtons.forEach(button => {
      button.addEventListener('click', () => updateSelection(button));
    });
  
    supportButtons.forEach(button => {
      button.addEventListener('click', () => selectSupport(button.dataset.support));
    });
  
    document.getElementById('speakOptionsBtn').addEventListener('click', () => {
      if (speechMode === 'off') {
        feedback.textContent = 'Speech output is turned off in educator settings.';
        return;
      }
      speakText(responseButtons.map(button => answerLabels[button.dataset.answer]).join('. '));
    });
  
    function performanceCategory(accuracy, support) {
      if (accuracy === 'Correct' && support === 'Independent') return 'Correct independently';
      if (accuracy === 'Correct') return 'Correct with support';
      if (accuracy === 'Incorrect') return 'Incorrect response';
      if (accuracy === 'No response') return 'No response';
      return 'Not assessed';
    }
  
    function addLog({ answer, accuracy, support, status, notes = '' }) {
      const record = {
        time: new Date().toLocaleString('en-AU'),
        learner: document.getElementById('learnerName').value.trim() || 'Not specified',
        routine: document.getElementById('routineName').value.trim() || 'My School Routine',
        answer: answer || 'No response recorded',
        accuracy,
        support,
        performanceCategory: performanceCategory(accuracy, support),
        assessmentStatus: status,
        notes
      };
      logs.push(record);
      renderLogs();
      return record;
    }
  
    function recordSelectedResponse() {
      if (!selectedAnswer || locked) return;
      const correct = selectedAnswer === correctAnswer;
      const accuracy = correct ? 'Correct' : 'Incorrect';
      const record = addLog({
        answer: answerLabels[selectedAnswer],
        accuracy,
        support: selectedSupport,
        status: 'Assessed',
        notes: document.getElementById('educatorNotes').value.trim()
      });
      locked = true;
      responseButtons.forEach(button => { button.disabled = true; });
      recordBtn.disabled = true;
      feedback.className = 'feedback ' + (correct ? 'good' : 'retry');
      feedback.textContent = correct
        ? 'Response recorded. The educator can review the result and support level.'
        : 'Response recorded. The educator can review the routine with the learner.';
      document.getElementById('instructionText').textContent = 'This opportunity has been recorded. The educator can reset the activity to try again.';
    }
  
    recordBtn.addEventListener('click', recordSelectedResponse);
  
    document.getElementById('noResponseBtn').addEventListener('click', () => {
      if (locked) return;
      addLog({
        answer: 'No response',
        accuracy: 'No response',
        support: 'Not applicable',
        status: 'No response',
        notes: document.getElementById('educatorNotes').value.trim()
      });
      finishOpportunity('No response recorded. This is not automatically classified as incorrect.');
    });
  
    document.getElementById('notAssessedBtn').addEventListener('click', () => {
      if (locked) return;
      addLog({
        answer: selectedAnswer ? answerLabels[selectedAnswer] : 'Not assessed',
        accuracy: 'Not assessed',
        support: selectedAnswer ? selectedSupport : 'Not recorded',
        status: 'Not assessed',
        notes: document.getElementById('educatorNotes').value.trim()
      });
      finishOpportunity('Opportunity marked as not assessed.');
    });
  
    function finishOpportunity(message) {
      locked = true;
      responseButtons.forEach(button => { button.disabled = true; });
      recordBtn.disabled = true;
      feedback.className = 'feedback';
      feedback.textContent = message;
      document.getElementById('instructionText').textContent = 'This opportunity has been recorded. The educator can reset the activity to try again.';
    }
  
    function renderLogs() {
      logRows.replaceChildren();
      if (!logs.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.textContent = 'No responses recorded yet.';
        tr.appendChild(td);
        logRows.appendChild(tr);
        return;
      }
      logs.slice().reverse().forEach(item => {
        const tr = document.createElement('tr');
        [item.time, item.answer, item.accuracy, item.support, item.performanceCategory].forEach(value => {
          const td = document.createElement('td');
          td.textContent = value;
          tr.appendChild(td);
        });
        logRows.appendChild(tr);
      });
    }
  
    document.getElementById('resetBtn').addEventListener('click', () => {
      selectedAnswer = null;
      locked = false;
      responseButtons.forEach(button => {
        button.disabled = false;
        button.setAttribute('aria-pressed', 'false');
      });
      recordBtn.disabled = true;
      feedback.className = 'feedback';
      feedback.textContent = '';
      document.getElementById('instructionText').textContent = 'Choose the card that shows what we do after putting our bag away.';
      document.getElementById('educatorNotes').value = '';
      selectSupport('Independent');
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    });
  
    document.getElementById('exportBtn').addEventListener('click', () => {
      if (!logs.length) {
        window.alert('There are no records to export yet.');
        return;
      }
      const columns = ['time', 'learner', 'routine', 'answer', 'accuracy', 'support', 'performanceCategory', 'assessmentStatus', 'notes'];
      const escapeCsv = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
      const csv = [
        columns.join(','),
        ...logs.map(row => columns.map(key => escapeCsv(row[key])).join(','))
      ].join('\r\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'school_routine_log.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  
    document.getElementById('clearLogBtn').addEventListener('click', () => {
      if (!logs.length) return;
      if (window.confirm('Clear all response records from this page session?')) {
        logs.length = 0;
        renderLogs();
      }
    });
  
    document.getElementById('educatorModeBtn').addEventListener('click', event => {
      const enabled = !document.body.classList.contains('educator-mode');
      document.body.classList.toggle('educator-mode', enabled);
      event.currentTarget.setAttribute('aria-pressed', String(enabled));
      event.currentTarget.textContent = enabled ? 'Hide educator tools' : 'Show educator tools';
      if (!enabled && settingsDialog.open) settingsDialog.close();
    });
  
    document.getElementById('settingsBtn').addEventListener('click', () => settingsDialog.showModal());
    document.getElementById('closeSettings').addEventListener('click', () => settingsDialog.close());
  
    Object.entries(fileMap).forEach(([inputId, key]) => {
      document.getElementById(inputId).addEventListener('change', event => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          feedback.textContent = 'Please select an image file.';
          event.target.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          customImages[key] = reader.result;
          if (representation === 'photos') renderVisuals();
        };
        reader.readAsDataURL(file);
      });
    });
  
    document.getElementById('clearCustomImages').addEventListener('click', () => {
      Object.keys(customImages).forEach(key => delete customImages[key]);
      Object.keys(fileMap).forEach(id => { document.getElementById(id).value = ''; });
      renderVisuals();
    });
  
    document.getElementById('saveSettings').addEventListener('click', () => {
      representation = document.getElementById('representationSet').value;
      speechMode = document.getElementById('speechMode').value;
      const routineName = document.getElementById('routineName').value.trim() || 'My School Routine';
      document.getElementById('routineHeading').textContent = routineName;
      document.title = routineName;
      renderVisuals();
      settingsDialog.close();
    });
  
    // Start with the learner-facing activity; educator tools are revealed on request.
    renderVisuals();
    renderLogs();
    selectSupport('Independent');
  })();