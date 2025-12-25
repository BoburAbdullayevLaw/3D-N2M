/**
 * script.js - Markaziy 3D Dvigatel va Interaktiv Effektlar
 * Professional darajadagi AI 3D Mind Map tizimi
 */

const graphContainer = document.getElementById('graph-container');
const tooltip = document.getElementById('node-tooltip');

let allNodes = [];
let allLinks = [];
let currentChatId = null;
let chats = {};

// Ranglar va Dizayn Konstantalari
const COLOR_CYAN = '#cf0505';
const COLOR_DEEP_BLUE = '#0033ff';
const COLOR_LINK = '#ffffff'; // Yorqin moviy neon
const COLOR_HIGHLIGHT = '#ffffff';

// 1. 3D Grafika obyektini yaratish
const Graph = ForceGraph3D({
    controlType: 'trackball'
})(graphContainer)
    .backgroundColor('rgba(0,0,0,0)')
    .showNavInfo(false)
    .forceEngine('d3')
    // --- YANGI QO'SHILADIGAN QISM ---
    .d3Force('link', d3.forceLink().distance(150)) // Liniyalar uzunligini 150 birimga o'rnatadi
    .d3Force('charge', d3.forceManyBody().strength(-300)) // Tugunlarni bir-biridan itaradi
    // -------------------------------
    .cooldownTime(3000)

    // TUGUN USTIGA SICHQONCHA KELGANDA (HOVER)
    .onNodeHover((node, prevNode) => {
        if (node) {
            const summary = node.summary ||
                node.description ||
                "Bu mavzu bo'yicha qo'shimcha ma'lumot olish uchun tugunni bosing.";

            const icon = node.icon || '📌';

            tooltip.style.display = 'block';
            tooltip.innerHTML = `
                <b>${icon} ${node.label || node.id}</b>
                <span style="color: #a8b2d1; font-size: 12px;">${summary}</span>
            `;
        } else {
            tooltip.style.display = 'none';
        }
    })

    // TUGUN BOSILGANDA EFFEKTLAR
    .onNodeClick(node => {
        const distance = 120;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

        Graph.cameraPosition(
            {
                x: node.x * distRatio,
                y: node.y * distRatio,
                z: node.z * distRatio
            },
            node,
            1500
        );

        highlightNodeEffects(node);
    });

// Grafikni global oynaga ulash
window.Graph = Graph;

// 2. Render funksiyasi (Yozuvlar va masofani sozlash)
function renderGraph() {
    if (allNodes.length === 0) return;

    Graph.graphData({
        nodes: allNodes.map(node => ({ ...node })),
        links: allLinks.map(link => ({ ...link }))
    });

    // MASOFANI SOZLASH (Liniyalarni uzaytirish)
    Graph.d3Force('link').distance(300); // 150 dan 200 ga oshirdik, yozuvlar yopishmasligi uchun
    Graph.d3Force('charge').strength(-400); // Tugunlarni kuchliroq itarish

    Graph.nodeThreeObject(node => {
        // SpriteText mavjudligini tekshirish
        const SpriteTextClass = window.SpriteText || (typeof SpriteText !== 'undefined' ? SpriteText : null);
        
        if (SpriteTextClass) {
            const sprite = new SpriteTextClass(node.label || node.id);
            const isHighlight = node.id === 'root' || node.isRoot;
            
            sprite.color = node.color || (isHighlight ? COLOR_DEEP_BLUE : COLOR_CYAN);
            sprite.textHeight = 8; 
            sprite.fontWeight = 'bold';
            
            // Yozuv fonini shaffof qilish (yozuvlar o'qilishi oson bo'ladi)
            sprite.padding = 2;
            
            return sprite;
        }
        return false; 
    });

    // Bog'lanishlar dizayni
    Graph.linkColor(() => COLOR_LINK)
         .linkOpacity(0.6)
         .linkWidth(1.5)
         .linkDirectionalParticles(2)
         .linkDirectionalParticleSpeed(0.005);
}
    
    // Agar SpriteText bo'lmasa, oddiy sharchalar chizsin (grafik to'xtab qolmasligi uchun)
    return false; 
});

        // Rang tanlash
        sprite.color = node.color || (isHighlight ? COLOR_DEEP_BLUE : COLOR_CYAN);
        sprite.textHeight = 6; // Matn o'lchamini oshirdik chunki shakl yo'q
        sprite.fontWeight = 'bold';

        return sprite;
    });

    // Bog'lanishlar dizayni (yorqinroq va ko'rinarliroq)
    Graph.linkColor(() => COLOR_LINK)
         .linkOpacity(0.8)  // Shaffoflikni oshirdik (0.4 dan 0.8 ga)
         .linkWidth(1)      // Qalinligini oshirdik (1 dan 2 ga)
         .linkDirectionalParticles(1)  // Zarralar sonini oshirdik
         .linkDirectionalParticleWidth(1)  // Zarralar o'lchamini oshirdik
         .linkDirectionalParticleSpeed(0.01);  // Tezlikni oshirdik
}

// 3. Tugun bosilganda bog'lanishlarni ajratib ko'rsatish
function highlightNodeEffects(selectedNode) {
    Graph.linkDirectionalParticleSpeed(link => {
        const s = (typeof link.source === 'object') ? link.source.id : link.source;
        const t = (typeof link.target === 'object') ? link.target.id : link.target;
        return (s === selectedNode.id || t === selectedNode.id) ? 0.05 : 0.01;
    });

    Graph.linkWidth(link => {
        const s = (typeof link.source === 'object') ? link.source.id : link.source;
        const t = (typeof link.target === 'object') ? link.target.id : link.target;
        return (s === selectedNode.id || t === selectedNode.id) ? 4 : 2;
    });

    setTimeout(() => {
        Graph.linkDirectionalParticleSpeed(0.01);
        Graph.linkWidth(2);
    }, 3000);
}

// 4. Ma'lumotlarni aqlli birlashtirish (Smart Merging)
function addNewData(newData) {
    console.log("AI dan kelgan grafik ma'lumotlari:", newData); // Konsolda tekshirish uchun
    
    if (!newData || !Array.isArray(newData.nodes)) {
        console.error("Noto'g'ri grafik formati keldi");
        return;
    }
    const idMapping = {};

    newData.nodes.forEach(newNode => {
        const labelKey = newNode.label.toLowerCase();
        if (labelToIdMap[labelKey]) {
            idMapping[newNode.id] = labelToIdMap[labelKey];

            // Agar tugun mavjud bo'lsa, summary va icon ni yangilash
            const existingNode = allNodes.find(n => n.id === labelToIdMap[labelKey]);
            if (existingNode) {
                existingNode.summary = newNode.summary || existingNode.summary;
                existingNode.icon = newNode.icon || existingNode.icon;
                existingNode.color = newNode.color || existingNode.color;
            }
        } else {
            if (!allNodes.find(n => n.id === newNode.id)) {
                allNodes.push({
                    ...newNode,
                    summary: newNode.summary || "Ma'lumot yuklanmoqda...",
                    icon: newNode.icon || '📌'
                });
                labelToIdMap[labelKey] = newNode.id;
                idMapping[newNode.id] = newNode.id;
            }
        }
    });

    if (newData.links) {
        newData.links.forEach(newLink => {
            const sourceId = idMapping[newLink.source] || newLink.source;
            const targetId = idMapping[newLink.target] || newLink.target;
            const exists = allLinks.find(l => {
                const s = (typeof l.source === 'object') ? l.source.id : l.source;
                const t = (typeof l.target === 'object') ? l.target.id : l.target;
                return (s === sourceId && t === targetId) || (s === targetId && t === sourceId);
            });
            if (!exists && sourceId !== targetId) {
                allLinks.push({ source: sourceId, target: targetId });
            }
        });
    }
    renderGraph();
}

// 5. QIDIRUV FUNKSIYASI
function searchNode(query) {
    if (!query || query.trim() === '') {
        // Agar qidiruv bo'sh bo'lsa, barcha tugunlarni ko'rsatish
        allNodes.forEach(n => n.hidden = false);
        renderGraph();
        return;
    }

    const searchTerm = query.toLowerCase().trim();
    let foundNode = null;

    allNodes.forEach(node => {
        const labelMatch = (node.label || '').toLowerCase().includes(searchTerm);
        const summaryMatch = (node.summary || '').toLowerCase().includes(searchTerm);

        if (labelMatch || summaryMatch) {
            node.hidden = false;
            if (!foundNode) foundNode = node;
        } else {
            node.hidden = false; // Barcha tugunlarni ko'rsatamiz
        }
    });

    renderGraph();

    // Agar topilgan tugun bo'lsa, unga kamera bilan fokuslanish
    if (foundNode) {
        const distance = 120;
        const distRatio = 1 + distance / Math.hypot(foundNode.x, foundNode.y, foundNode.z);

        Graph.cameraPosition(
            {
                x: foundNode.x * distRatio,
                y: foundNode.y * distRatio,
                z: foundNode.z * distRatio
            },
            foundNode,
            1500
        );

        highlightNodeEffects(foundNode);

        // Qidiruv natijasini ko'rsatish
        const searchResult = document.getElementById('search-result');
        if (searchResult) {
            searchResult.textContent = `✓ Topildi: ${foundNode.label}`;
            searchResult.style.color = '#39ff14';
            setTimeout(() => {
                searchResult.textContent = '';
            }, 3000);
        }
    } else {
        const searchResult = document.getElementById('search-result');
        if (searchResult) {
            searchResult.textContent = '✗ Natija topilmadi';
            searchResult.style.color = '#ca0505';
            setTimeout(() => {
                searchResult.textContent = '';
            }, 3000);
        }
    }
}

// Global qidiruv funksiyasini expose qilish
window.searchNode = searchNode;

// 6. API bilan ishlash
async function sendRequest() {
    const inputField = document.getElementById("userInput");
    const input = inputField.value.trim();
    if (!input) return;

    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML += `<div class="user-msg">${escapeHtml(input)}</div>`;
    inputField.value = "";
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Yuklanish animatsiyasi
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'ai-msg';
    loadingMsg.innerHTML = 'AI javob tayyorlayapti...';
    loadingMsg.id = 'loading-msg';
    messagesDiv.appendChild(loadingMsg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
        const response = await fetch("https://threed-n2m.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: input,
                chat_id: currentChatId
            })
        });

        const data = await response.json();

        // Yuklanish xabarini o'chirish
        const loading = document.getElementById('loading-msg');
        if (loading) loading.remove();

        messagesDiv.innerHTML += `<div class="ai-msg">${escapeHtml(data.text_answer)}</div>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        addNewData(data.graph_data);

    } catch (err) {
        console.error("Xatolik:", err);
        const loading = document.getElementById('loading-msg');
        if (loading) loading.remove();
        messagesDiv.innerHTML += `<div class="ai-msg" style="color: #ff6b6b;">Xatolik: Server bilan bog'lanishda muammo.</div>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// 7. Chatlarni boshqarish
function createNewChat() {
    const id = "chat_" + Date.now();
    chats[id] = {
        nodes: [{
            id: "root",
            label: "MARKAZ",
            isRoot: true,
            summary: "Barcha tushunchalar bu markazdan boshlanadi",
            icon: "⭐"
        }],
        links: [],
        messages: ""
    };
    switchChat(id);
}

function switchChat(id) {
    if (currentChatId && chats[currentChatId]) {
        chats[currentChatId].nodes = [...allNodes];
        chats[currentChatId].links = [...allLinks];
        chats[currentChatId].messages = document.getElementById("messages").innerHTML;
    }
    currentChatId = id;
    allNodes = chats[id].nodes || [];
    allLinks = chats[id].links || [];
    document.getElementById("messages").innerHTML = chats[id].messages || "";
    renderGraph();
    updateSidebar();
}

function updateSidebar() {
    const list = document.getElementById("chat-list");
    if (!list) return;
    list.innerHTML = "";
    Object.keys(chats).forEach(id => {
        const div = document.createElement("div");
        div.className = `chat-item ${id === currentChatId ? 'active-chat' : ''}`;
        div.innerText = "Mavzu: " + id.slice(-8);
        div.onclick = () => switchChat(id);
        list.appendChild(div);
    });
}

// 8. Tooltip pozitsiyasini boshqarish
window.addEventListener('mousemove', (e) => {
    if (tooltip && tooltip.style.display === 'block') {
        tooltip.style.left = (e.pageX + 20) + 'px';
        tooltip.style.top = (e.pageY - 60) + 'px';
    }
});

// 9. XSS himoyasi
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 10. Sahifa yuklanganda birinchi chatni yaratish
window.onload = createNewChat;
