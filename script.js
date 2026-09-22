let apiKey = localStorage.getItem('theme_api_key') || '';
let selectedModel = localStorage.getItem('theme_model') || 'gemini-3-flash-preview';
let currentSentence = "";
let ankiCards = [];
let selectedTextContext = "";

const els = {
    tabs: document.querySelectorAll('.tab-btn'),
    panes: document.querySelectorAll('.tab-pane'),
    btnSettings: document.getElementById('btn-settings'),
    modalSettings: document.getElementById('settings-modal'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    apiKeyInput: document.getElementById('api-key-input'),
    modelSelect: document.getElementById('model-select'),
    toastContainer: document.getElementById('toast-container'),
    
    btnGenerate: document.getElementById('btn-generate'),
    sourceText: document.getElementById('source-text'),
    sourceAuthor: document.getElementById('source-author'),
    userInput: document.getElementById('user-translation'),
    btnCorrect: document.getElementById('btn-correct'),
    
    loader: document.getElementById('correction-loader'),
    corrSource: document.getElementById('corr-source'),
    corrUser: document.getElementById('corr-user'),
    corrIdeal: document.getElementById('corr-ideal'),
    corrExplanations: document.getElementById('corr-explanations'),
    btnExplain: document.getElementById('btn-explain-action'),
    btnAnkiSel: document.getElementById('btn-anki-action'),
    
    ankiContent: document.getElementById('anki-content')
};

// Auto-extensibilité textarea
els.userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

function parseMarkdown(text) {
    if (!text) return "";
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000); 
}

function switchTab(targetId) {
    els.tabs.forEach(t => t.classList.remove('active'));
    els.panes.forEach(p => p.classList.remove('active'));
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
    document.getElementById(targetId).classList.add('active');
}

async function callGemini(prompt, isJson = false) {
    if (!apiKey) {
        showToast("Veuillez configurer votre clé API (Réglages en haut à droite)", "error");
        return null;
    }
    
    try {
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
        
        const body = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 }
        };

        if (isJson) {
            body.generationConfig.responseMimeType = "application/json";
        }

        let response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.error.message);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        const textResult = data.candidates[0].content.parts[0].text;
        return isJson ? JSON.parse(textResult) : textResult;
        
    } catch (err) {
        showToast("Erreur API : " + err.message, "error");
        return null;
    }
}

els.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.target));
});

els.btnSettings.addEventListener('click', () => {
    els.apiKeyInput.value = apiKey;
    els.modelSelect.value = selectedModel;
    els.modalSettings.classList.remove('hidden');
});

els.btnCloseSettings.addEventListener('click', () => els.modalSettings.classList.add('hidden'));

els.btnSaveSettings.addEventListener('click', () => {
    apiKey = els.apiKeyInput.value.trim();
    selectedModel = els.modelSelect.value;
    localStorage.setItem('theme_api_key', apiKey);
    localStorage.setItem('theme_model', selectedModel);
    els.modalSettings.classList.add('hidden');
    showToast("Réglages sauvegardés", "success");
});

els.btnGenerate.addEventListener('click', async () => {
    els.sourceText.innerHTML = "<em>Recherche dans les classiques...</em>";
    els.sourceAuthor.textContent = "";
    els.userInput.value = "";
    els.userInput.style.height = 'auto'; 
    
    const prompt = `Génère une phrase en français d'un niveau littéraire, tirée ou inspirée d'un classique, idéale pour un exercice de thème. 
    Renvoie UNIQUEMENT un objet JSON avec 2 clés: "phrase" (la phrase sans guillemets) et "source" (Auteur, Livre).`;
    
    const result = await callGemini(prompt, true);
    if (result && result.phrase) {
        currentSentence = result.phrase;
        els.sourceText.textContent = currentSentence;
        els.sourceAuthor.textContent = "- " + result.source;
    } else {
        els.sourceText.textContent = "Erreur lors de la génération. Réessayez.";
    }
});

els.btnCorrect.addEventListener('click', async () => {
    const userText = els.userInput.value.trim();
    if (!currentSentence || !userText) {
        showToast("Veuillez générer une phrase et saisir votre traduction.", "error");
        return;
    }

    switchTab('tab-correction');
    els.loader.classList.remove('hidden');
    els.corrSource.textContent = currentSentence;
    els.corrUser.textContent = userText;
    els.corrExplanations.innerHTML = '';

    const prompt = `
    Tu es correcteur aux concours CPGE (filière scientifique).
    Phrase source : "${currentSentence}"
    Traduction de l'élève : "${userText}"
    
    Tâche :
    1. Fournis la traduction idéale (littéraire, niveau concours).
    2. Analyse les erreurs de l'élève de manière concise et rigoureuse. Utilise **le gras** pour mettre en évidence les mots importants.
    3. Propose des cartes Anki pertinentes basées SEULEMENT sur ses erreurs.
    
    Réponds STRICTEMENT au format JSON suivant :
    {
        "traduction_ideale": "String",
        "erreurs": [
            { "type": "grammaire|orthographe|style", "element": "mot erroné", "explication": "pourquoi et comment corriger" }
        ],
        "anki": [
            { "format": "Actif", "col1": "français", "col2": "anglais", "col3": "exemple" },
            { "format": "Passif", "col1": "anglais", "col2": "français", "col3": "" },
            { "format": "Regle", "col1": "question ou règle", "col2": "réponse", "col3": "" }
        ]
    }`;

    const data = await callGemini(prompt, true);
    els.loader.classList.add('hidden');

    if (data) {
        els.corrIdeal.textContent = data.traduction_ideale;
        
        if(data.erreurs && data.erreurs.length > 0) {
            data.erreurs.forEach((err, index) => {
                setTimeout(() => {
                    renderCard(err.type, err.element, err.explication);
                }, index * 100);
            });
        } else {
            els.corrExplanations.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <p>Parfait ! Aucune erreur détectée.</p>
            </div>`;
        }

        if(data.anki) {
            data.anki.forEach(card => {
                ankiCards.push({ ...card, id: Date.now() + Math.random(), selected: false });
            });
            renderAnkiTab();
        }
    }
});

function renderCard(type, title, text) {
    const card = document.createElement('div');
    const classes = { 'grammaire': 'grammar', 'orthographe': 'spelling', 'style': 'style', 'explication': 'explanation' };
    const labels = { 'grammaire': 'Grammaire', 'orthographe': 'Orthographe', 'style': 'Style', 'explication': 'Info' };
    
    card.className = `error-card ${classes[type] || 'style'}`;
    const parsedText = parseMarkdown(text);
    
    card.innerHTML = `
        <div class="card-header">
            <strong>${title}</strong>
            <span class="card-badge">${labels[type] || type}</span>
        </div>
        <p class="mono-text">${parsedText}</p>
    `;
    els.corrExplanations.insertBefore(card, els.corrExplanations.firstChild);
}

// Gestion de la sélection de texte (Boutons intégrés)
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const node = selection.anchorNode;
        // Vérifie si la sélection est dans le bloc corrIdeal
        if (els.corrIdeal.contains(node)) {
            const text = selection.toString().trim();
            if (text.length > 0) {
                selectedTextContext = text;
                els.btnExplain.disabled = false;
                els.btnAnkiSel.disabled = false;
                return;
            }
        }
    }
    // Si rien de valide n'est sélectionné
    selectedTextContext = "";
    els.btnExplain.disabled = true;
    els.btnAnkiSel.disabled = true;
});

els.btnExplain.addEventListener('click', async () => {
    if (!selectedTextContext) return;
    
    const prompt = `Agis comme un correcteur d'anglais aux concours CPGE (filière scientifique).
    Phrase originale en français : "${currentSentence}"
    Traduction idéale complète : "${els.corrIdeal.textContent}"
    
    L'élève te demande d'expliquer spécifiquement le choix de ce passage en anglais : "${selectedTextContext}".
    
    Explique de manière très claire, concise et pertinente pourquoi cette expression, nuance ou règle grammaticale a été choisie par rapport au français original. Tu peux utiliser **le gras** pour mettre en évidence les termes clés.
    Ne renvoie QUE l'explication en texte brut, sans introduction ni conclusion de politesse.`;
    
    showToast("Recherche d'explication...", "info");
    const explication = await callGemini(prompt, false);
    if(explication) {
        renderCard('explication', selectedTextContext, explication);
    }
});

els.btnAnkiSel.addEventListener('click', async () => {
    if (!selectedTextContext) return;
    
    const prompt = `Génère 3 cartes Anki strictement à partir de ce segment "${selectedTextContext}" issu de "${els.corrIdeal.textContent}".
    Renvoie JSON: { "anki": [
        { "format": "Actif", "col1": "français", "col2": "anglais", "col3": "exemple" },
        { "format": "Passif", "col1": "anglais", "col2": "français", "col3": "" },
        { "format": "Regle", "col1": "question", "col2": "réponse", "col3": "" }
    ]}`;
    
    showToast("Génération des cartes...", "info");
    const data = await callGemini(prompt, true);
    if(data && data.anki) {
        data.anki.forEach(card => {
            ankiCards.push({ ...card, id: Date.now() + Math.random(), selected: false });
        });
        renderAnkiTab();
        showToast("Cartes Anki ajoutées !", "success");
    }
});

function renderAnkiTab() {
    if (ankiCards.length === 0) {
        els.ankiContent.innerHTML = `
        <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3; margin-bottom:1rem;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            <p>Aucune carte générée pour le moment.</p>
        </div>`;
        return;
    }

    const formats = ['Actif', 'Passif', 'Regle'];
    els.ankiContent.innerHTML = '';

    formats.forEach((format, sectionIdx) => {
        const cards = ankiCards.filter(c => c.format === format);
        if(cards.length === 0) return;

        const section = document.createElement('div');
        section.className = 'anki-section';
        section.style.animationDelay = `${sectionIdx * 0.1}s`;
        
        const header = document.createElement('div');
        header.className = 'anki-header';
        
        const titleContainer = document.createElement('div');
        titleContainer.innerHTML = `<h3 style="margin-bottom:0.4rem; font-size:1.05rem;">Format ${format}</h3>`;
        
        const btnToggleAll = document.createElement('button');
        btnToggleAll.className = 'secondary-btn';
        btnToggleAll.style.padding = '0.35rem 0.8rem';
        btnToggleAll.style.fontSize = '0.75rem';
        btnToggleAll.textContent = 'Tout (dé)sélectionner';
        btnToggleAll.onclick = () => {
            const allSelected = cards.every(c => c.selected);
            ankiCards = ankiCards.map(c => c.format === format ? { ...c, selected: !allSelected } : c);
            renderAnkiTab(); 
        };
        titleContainer.appendChild(btnToggleAll);

        const btnExport = document.createElement('button');
        btnExport.className = 'primary-btn';
        btnExport.innerHTML = `Exporter ${format} (.tsv)`;
        btnExport.onclick = () => exportTSV(format);

        header.appendChild(titleContainer);
        header.appendChild(btnExport);
        section.appendChild(header);

        const list = document.createElement('div');
        list.className = 'anki-list';
        
        cards.forEach(card => {
            const item = document.createElement('div');
            item.className = 'anki-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = card.selected;
            checkbox.onchange = (e) => {
                const idx = ankiCards.findIndex(c => c.id === card.id);
                ankiCards[idx].selected = e.target.checked;
            };

            const data = document.createElement('div');
            data.className = 'anki-data';
            data.innerHTML = `
                <div class="anki-col-label">Col 1:</div>
                <div class="anki-col-val">${card.col1}</div>
                <div class="anki-col-label">Col 2:</div>
                <div class="anki-col-val">${card.col2}</div>
                ${card.col3 ? `<div class="anki-col-label">Col 3:</div><div class="anki-col-val">${card.col3}</div>` : ''}
            `;

            item.appendChild(checkbox);
            item.appendChild(data);
            list.appendChild(item);
        });

        section.appendChild(list);
        els.ankiContent.appendChild(section);
    });
}

function exportTSV(format) {
    const cardsToExport = ankiCards.filter(c => c.format === format && c.selected);
    if (cardsToExport.length === 0) {
        showToast("Veuillez sélectionner au moins une carte à exporter.", "warning");
        return;
    }

    let tsvContent = "";
    cardsToExport.forEach(card => {
        const c1 = card.col1.replace(/\n/g, " ");
        const c2 = card.col2.replace(/\n/g, " ");
        const c3 = card.col3 ? card.col3.replace(/\n/g, " ") : "";
        
        if(format === "Actif") {
            tsvContent += `${c1}\t${c2}\t${c3}\n`;
        } else {
            tsvContent += `${c1}\t${c2}\n`;
        }
    });

    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Anki_${format}_Theme.tsv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`${cardsToExport.length} cartes exportées !`, "success");
}