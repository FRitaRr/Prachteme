let apiKey = localStorage.getItem('theme_api_key') || '';
let selectedModel = localStorage.getItem('theme_model') || 'gemini-3.7-flash';
let currentSentence = "";
let selectedTextContext = "";

let ankiCards = JSON.parse(localStorage.getItem('theme_anki_cards'));
if(!Array.isArray(ankiCards)) ankiCards = [];
let currentAnkiFormat = 'Actif'; // État initial de l'affichage

function saveAnkiCards() {
    localStorage.setItem('theme_anki_cards', JSON.stringify(ankiCards));
}

const themesList = [
    "Les achats au supermarché", "La cuisine et les recettes", "Le ménage et les tâches ménagères",
    "Les transports en commun", "Conduire une voiture", "Le vélo en ville", "Les animaux de compagnie",
    "Le jardinage", "Le bricolage et les réparations", "Les routines matinales", "Les entretiens d'embauche",
    "Les réunions de travail", "Les examens et les études", "Les relations entre collègues", "Le télétravail",
    "Le choix de carrière", "La gestion du temps", "Le stress et le surmenage", "L'apprentissage des langues",
    "Le travail en équipe", "Le sport et l'exercice physique", "Le cinéma et les séries",
    "La littérature et la lecture", "Les jeux vidéo", "La musique et les instruments",
    "Les concerts et festivals", "Les voyages à l'étranger", "Les vacances à la plage",
    "Le camping et la nature", "La photographie", "L'amitié de longue date", "Les disputes et les conflits",
    "La réconciliation", "Les repas en famille", "Les rencontres amoureuses", "La rupture amoureuse",
    "La jalousie", "La confiance en soi", "Le bonheur et la joie", "L'éducation des enfants",
    "L'écologie et le climat", "L'économie et l'argent", "La surconsommation", "Les réseaux sociaux",
    "L'intelligence artificielle", "L'addiction aux smartphones", "L'égalité et les droits",
    "La santé physique", "La santé mentale", "La nutrition et les régimes", "La justice et les lois",
    "La publicité et le marketing", "Le hasard et la chance", "Le destin", "La patience",
    "Le mensonge et la vérité", "L'ambition personnelle", "L'échec et la résilience",
    "Le succès et la réussite", "La liberté individuelle", "La créativité", "L'ennui",
    "L'humour et les blagues", "Le temps qui passe", "L'histoire et le passé",
    "Les prédictions sur l'avenir", "La vie en ville", "La vie à la campagne", "Les changements de météo",
    "L'exploration spatiale", "La protection des océans", "Les traditions culturelles",
    "Les croyances et superstitions", "L'immobilier et le logement", "Les déménagements",
    "Les anniversaires", "Les mariages", "Les accidents de la route", "Les maladies courantes",
    "Les urgences médicales", "Aller au restaurant", "Le shopping et les vêtements",
    "Les pannes informatiques", "La perte d'objets personnels", "Les retards et imprévus",
    "Les annulations de dernière minute", "Faire des surprises", "Les compétitions sportives",
    "Les négociations commerciales", "Les débats d'idées", "L'art et les musées",
    "La mode et les tendances", "Le bénévolat et l'entraide", "Les phénomènes naturels",
    "Le sommeil et les rêves", "L'architecture et le design", "Les actualités et le journalisme",
    "Le système éducatif", "L'industrie du divertissement", "Les inventions et découvertes"
];

const tensesList = [
    "Présent de l'indicatif", "Imparfait de l'indicatif", "Passé composé",
    "Passé simple", "Plus-que-parfait", "Futur simple", "Futur antérieur",
    "Conditionnel présent", "Conditionnel passé", "Subjonctif présent", "Impératif"
];

const els = {
    tabs: document.querySelectorAll('.tab-btn'),
    panes: document.querySelectorAll('.tab-pane'),
    tabSlider: document.getElementById('tab-slider'),
    btnSettings: document.getElementById('btn-settings'),
    modalSettings: document.getElementById('settings-modal'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    apiKeyInput: document.getElementById('api-key-input'),
    toastContainer: document.getElementById('toast-container'),
    headerModelDisplay: document.getElementById('header-model-display'),
    
    customSelectTrigger: document.querySelector('.custom-select-trigger'),
    customOptionsPanel: document.getElementById('model-options'),
    customOptions: document.querySelectorAll('.custom-option'),
    selectedModelText: document.getElementById('selected-model-text'),
    
    btnGenerate: document.getElementById('btn-generate'),
    sourceTextWrapper: document.getElementById('sentence-text-wrapper'),
    hypnoticLoader: document.getElementById('hypnotic-loader'),
    sourceText: document.getElementById('source-text'),
    sourceAuthor: document.getElementById('source-author'),
    userInput: document.getElementById('user-translation'),
    btnCorrect: document.getElementById('btn-correct'),
    
    corrSource: document.getElementById('corr-source'),
    corrUser: document.getElementById('corr-user'),
    corrIdealBlock: document.getElementById('corr-ideal-block'),
    corrIdeal: document.getElementById('corr-ideal'),
    correctionLoaderInline: document.getElementById('correction-loader-inline'),
    corrExplanations: document.getElementById('corr-explanations'),
    btnExplain: document.getElementById('btn-explain-action'),
    btnAnkiSel: document.getElementById('btn-anki-action'),
    
    // Nouveaux éléments de l'architecture Anki
    ankiLayout: document.getElementById('anki-layout'),
    ankiMain: document.getElementById('anki-main'),
    ankiEmpty: document.getElementById('anki-empty'),
    btnAnkiToggleAll: document.getElementById('btn-anki-toggle-all'),
    btnAnkiExport: document.getElementById('btn-anki-export'),
    btnResetAnkiTrigger: document.getElementById('btn-reset-anki-trigger'),
    formatBtns: document.querySelectorAll('.format-btn'),
    
    resetModal: document.getElementById('reset-modal'),
    btnCancelReset: document.getElementById('btn-cancel-reset'),
    btnConfirmReset: document.getElementById('btn-confirm-reset'),
};

function initTabSlider() {
    const activeTab = document.querySelector('.tab-btn.active');
    updateTabSlider(activeTab);
}

function updateTabSlider(tabElement) {
    if(!tabElement) return;
    els.tabSlider.style.width = `${tabElement.offsetWidth}px`;
    els.tabSlider.style.transform = `translateX(${tabElement.offsetLeft}px)`;
}

window.addEventListener('resize', initTabSlider);
document.addEventListener('DOMContentLoaded', () => {
    initTabSlider();
    renderAnkiTab();
});

els.tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        updateTabSlider(e.target);
        switchTab(tab.dataset.target);
    });
});

function switchTab(targetId) {
    els.tabs.forEach(t => t.classList.remove('active'));
    els.panes.forEach(p => p.classList.remove('active'));
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
    document.getElementById(targetId).classList.add('active');
}

function updateCustomSelectUI(val) {
    els.customOptions.forEach(opt => {
        if(opt.dataset.value === val) {
            opt.classList.add('selected');
            els.selectedModelText.textContent = opt.textContent;
            els.headerModelDisplay.textContent = opt.textContent;
        } else {
            opt.classList.remove('selected');
        }
    });
}
updateCustomSelectUI(selectedModel);

els.customSelectTrigger.addEventListener('click', () => els.customOptionsPanel.classList.toggle('hidden'));
els.customOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        selectedModel = opt.dataset.value;
        updateCustomSelectUI(selectedModel);
        els.customOptionsPanel.classList.add('hidden');
    });
});

document.addEventListener('click', (e) => {
    if(!e.target.closest('#custom-select-container')) els.customOptionsPanel.classList.add('hidden');
});

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
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 4000); 
}

async function callGemini(prompt, isJson = false) {
    if (!apiKey) {
        showToast("Veuillez configurer votre clé API (Réglages)", "error");
        return null;
    }
    
    try {
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
        const body = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 }
        };

        if (isJson) body.generationConfig.responseMimeType = "application/json";

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

els.btnSettings.addEventListener('click', () => {
    els.apiKeyInput.value = apiKey;
    updateCustomSelectUI(selectedModel);
    els.modalSettings.classList.remove('hidden');
});

els.btnCloseSettings.addEventListener('click', () => els.modalSettings.classList.add('hidden'));

els.btnSaveSettings.addEventListener('click', () => {
    apiKey = els.apiKeyInput.value.trim();
    selectedModel = Array.from(els.customOptions).find(opt => opt.classList.contains('selected')).dataset.value;
    localStorage.setItem('theme_api_key', apiKey);
    localStorage.setItem('theme_model', selectedModel);
    els.modalSettings.classList.add('hidden');
    showToast("Réglages sauvegardés", "success");
});

els.btnGenerate.addEventListener('click', async () => {
    els.sourceTextWrapper.classList.add('hidden');
    els.hypnoticLoader.classList.remove('hidden');
    els.userInput.value = "";
    els.userInput.style.height = 'auto'; 
    
    const randomTheme = themesList[Math.floor(Math.random() * themesList.length)];
    const randomTense = tensesList[Math.floor(Math.random() * tensesList.length)];
    
    const prompt = `Génère une phrase en français d'un niveau littéraire, tirée ou inspirée d'un classique, idéale pour un exercice de thème. 
    Pour cette phrase, inspire-toi de ce thème précis : "${randomTheme}".
    La phrase doit utiliser principalement le temps de conjugaison suivant : "${randomTense}".
    Renvoie UNIQUEMENT un objet JSON avec 2 clés: "phrase" (la phrase sans guillemets) et "source" (Auteur, Livre).`;
    
    const result = await callGemini(prompt, true);
    
    els.hypnoticLoader.classList.add('hidden');
    els.sourceTextWrapper.classList.remove('hidden');

    if (result && result.phrase) {
        currentSentence = result.phrase;
        els.sourceText.textContent = currentSentence;
        els.sourceAuthor.textContent = "- " + result.source;
    } else {
        els.sourceText.textContent = "Erreur lors de la génération. Réessayez.";
        els.sourceAuthor.textContent = "";
    }
});

els.btnCorrect.addEventListener('click', async () => {
    const userText = els.userInput.value.trim();
    if (!currentSentence || !userText) {
        showToast("Veuillez générer une phrase et saisir votre traduction.", "error");
        return;
    }

    const corrTab = document.querySelector('[data-target="tab-correction"]');
    updateTabSlider(corrTab);
    switchTab('tab-correction');
    
    els.corrSource.textContent = currentSentence;
    els.corrUser.textContent = userText;
    els.corrIdealBlock.classList.add('hidden');
    els.corrExplanations.classList.add('hidden');
    els.correctionLoaderInline.classList.remove('hidden');

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
    
    els.correctionLoaderInline.classList.add('hidden');
    els.corrIdealBlock.classList.remove('hidden');
    els.corrExplanations.classList.remove('hidden');
    els.corrExplanations.innerHTML = '';

    if (data) {
        els.corrIdeal.textContent = data.traduction_ideale;
        
        if(data.erreurs && data.erreurs.length > 0) {
            data.erreurs.forEach((err, index) => {
                setTimeout(() => renderCard(err.type, err.element, err.explication), index * 100);
            });
        } else {
            els.corrExplanations.innerHTML = `
            <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-elegant)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <p>Parfait ! Aucune erreur détectée.</p>
            </div>`;
        }

        if(data.anki) {
            data.anki.forEach(card => {
                ankiCards.push({ ...card, id: Date.now() + Math.random(), selected: false, source: 'auto' });
            });
            saveAnkiCards();
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

document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const node = selection.anchorNode;
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
    Explique de manière très claire, concise et pertinente pourquoi cette expression, nuance ou règle grammaticale a été choisie par rapport au français original. Utilise **le gras** pour mettre en évidence les termes clés.
    Ne renvoie QUE l'explication en texte brut.`;
    
    showToast("Recherche d'explication...", "info");
    const explication = await callGemini(prompt, false);
    if(explication) renderCard('explication', selectedTextContext, explication);
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
            ankiCards.push({ ...card, id: Date.now() + Math.random(), selected: false, source: 'manual' });
        });
        saveAnkiCards();
        renderAnkiTab();
        showToast("Cartes Anki ajoutées !", "success");
    }
});


// === Événements et logique de l'onglet Anki ===

els.formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.disabled) return;
        currentAnkiFormat = btn.dataset.format;
        els.formatBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderAnkiCards();
    });
});

els.btnAnkiToggleAll.addEventListener('click', () => {
    const cards = ankiCards.filter(c => c.format === currentAnkiFormat);
    const allSelected = cards.every(c => c.selected);
    ankiCards = ankiCards.map(c => c.format === currentAnkiFormat ? { ...c, selected: !allSelected } : c);
    saveAnkiCards();
    renderAnkiCards();
});

els.btnAnkiExport.addEventListener('click', () => exportTSV(currentAnkiFormat));

els.btnResetAnkiTrigger.addEventListener('click', () => {
    els.resetModal.classList.remove('hidden');
});

els.btnCancelReset.addEventListener('click', () => els.resetModal.classList.add('hidden'));

els.btnConfirmReset.addEventListener('click', () => {
    ankiCards = [];
    saveAnkiCards();
    renderAnkiTab();
    els.resetModal.classList.add('hidden');
    showToast("Toutes les cartes ont été réinitialisées.", "success");
});

function renderAnkiTab() {
    if (ankiCards.length === 0) {
        els.ankiLayout.classList.add('hidden');
        els.ankiEmpty.classList.remove('hidden');
        return;
    }

    els.ankiEmpty.classList.add('hidden');
    els.ankiLayout.classList.remove('hidden');

    const formats = ['Actif', 'Passif', 'Regle'];
    let hasCurrentFormat = false;

    // Mise à jour des compteurs sur les boutons de la barre latérale
    formats.forEach(fmt => {
        const count = ankiCards.filter(c => c.format === fmt).length;
        const btn = document.querySelector(`.format-btn[data-format="${fmt}"]`);
        if(btn) {
            btn.querySelector('.fmt-count').textContent = count;
            btn.disabled = count === 0;
            if (fmt === currentAnkiFormat && count > 0) hasCurrentFormat = true;
        }
    });

    // Si le format courant n'a plus de cartes, on bascule vers le premier format disponible
    if (!hasCurrentFormat) {
        const firstAvailable = formats.find(fmt => ankiCards.filter(c => c.format === fmt).length > 0);
        if (firstAvailable) currentAnkiFormat = firstAvailable;
    }

    els.formatBtns.forEach(b => b.classList.toggle('active', b.dataset.format === currentAnkiFormat));
    
    renderAnkiCards();
}

function renderAnkiCards() {
    els.ankiMain.innerHTML = '';
    const cards = ankiCards.filter(c => c.format === currentAnkiFormat);
    
    if (cards.length === 0) return;

    // Met à jour le texte du bouton de sélection global en fonction des cartes affichées
    const allSelected = cards.every(c => c.selected);
    els.btnAnkiToggleAll.textContent = allSelected ? 'Tout désélectionner' : 'Tout sélectionner';

    cards.forEach((card, index) => {
        const item = document.createElement('div');
        // Nouvelles classes pour un affichage plus large et soigné
        item.className = 'anki-item glass-panel large-card fade-up';
        item.style.animationDelay = `${index * 0.05}s`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = card.selected;
        checkbox.onchange = (e) => {
            const idx = ankiCards.findIndex(c => c.id === card.id);
            ankiCards[idx].selected = e.target.checked;
            saveAnkiCards();
            renderAnkiCards(); // Re-rendu pour ajuster le bouton 'Tout sélectionner'
        };

        const data = document.createElement('div');
        data.className = 'anki-data';
        
        const sourceClass = card.source === 'manual' ? 'manual' : 'auto';
        const sourceTitle = card.source === 'manual' ? 'Créée manuellement depuis la sélection' : 'Générée automatiquement lors de la correction';

        data.innerHTML = `
            <div class="anki-col-label">
                <span class="source-indicator ${sourceClass}" title="${sourceTitle}"></span>COL 1:
            </div>
            <div class="anki-col-val">${card.col1}</div>
            <div class="anki-col-label">COL 2:</div>
            <div class="anki-col-val">${card.col2}</div>
            ${card.col3 ? `<div class="anki-col-label">COL 3:</div><div class="anki-col-val">${card.col3}</div>` : ''}
        `;

        const btnDelete = document.createElement('button');
        btnDelete.className = 'delete-card-btn';
        btnDelete.title = "Supprimer cette carte";
        btnDelete.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
        btnDelete.onclick = () => {
            ankiCards = ankiCards.filter(c => c.id !== card.id);
            saveAnkiCards();
            renderAnkiTab();
        };

        item.appendChild(checkbox);
        item.appendChild(data);
        item.appendChild(btnDelete);
        els.ankiMain.appendChild(item);
    });
}

function exportTSV(format) {
    const cardsToExport = ankiCards.filter(c => c.format === format && c.selected);
    if (cardsToExport.length === 0) {
        showToast("Veuillez sélectionner au moins une carte à exporter.", "error");
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
    link.setAttribute("download", `Anki_${format}_PRACTHEME.tsv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`${cardsToExport.length} cartes exportées !`, "success");
}