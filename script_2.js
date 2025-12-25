/**
 * script_2.js - Mind Map & Network Logic Module
 * Ushbu modul grafning 3D fizikasi va ierarxik tuzilishini boshqaradi.
 */

const MindMapEngine = {
    // Rejim sozlamalari (Konfiguratsiya)
    settings: {
        treeDistance: 80,       // Qavatlar (level) orasidagi masofa
        treeRepulsion: -800,    // Mind Mapda tugunlarning bir-biridan qochish kuchi (kuchliroq)
        networkRepulsion: -200, // Neyron xaritada erkin suzish kuchi
        linkDistance: 45,       // Bog'lanishlar uzunligi
        transitionTime: 1500    // Kamera va simulyatsiya o'tish vaqti
    },

    /**
     * Mind Map (Daraxt/Ierarxiya) rejimini faollashtirish
     * @param {Object} graph - ForceGraph3D instansiyasi
     */
    enableTreeMode: function(graph) {
        if (!graph) return;

        // 1. Iyerarxik tartiblashni yoqish (Top-Down)
        graph
            .dagMode('td')
            .dagLevelDistance(this.settings.treeDistance)
            .linkCurvature(0.3) // Bog'lanishlarni egri qilish (vizual chiroyli ko'rinadi)
            .linkDirectionalArrowLength(4) // Yo'nalish ko'rsatkichlari (strelka)
            .linkDirectionalArrowRelPos(1); // Strelkani chiziq oxiriga qo'yish

        // 2. Kuchlarni daraxt strukturasiga moslash
        // Tugunlar ierarxiya bo'ylab chiroyli yoyilishi uchun charge kuchini oshiramiz
        graph.d3Force('charge').strength(this.settings.treeRepulsion);
        graph.d3Force('link').distance(this.settings.linkDistance);

        // 3. Simulyatsiyani qayta qizdirish (Silliq o'tish uchun)
        graph.d3ReheatSimulation();

        // 4. Kamerani tekislash
        setTimeout(() => this.resetCamera(graph), 500);

        console.log("Rejim: Mind Map (Ierarxik) faollashdi.");
    },

    /**
     * Neyron Xarita (Erkin Tarmoq) rejimini faollashtirish
     * @param {Object} graph - ForceGraph3D instansiyasi
     */
    enableNetworkMode: function(graph) {
        if (!graph) return;

        // 1. Iyerarxik cheklovlarni va vizual effektlarni o'chirish
        graph
            .dagMode(null)
            .linkCurvature(0) // Chiziqlarni tekislash
            .linkDirectionalArrowLength(0); // Strelkalarni olib tashlash

        // 2. Kuchlarni erkin "neyron" holatiga qaytarish
        // Tugunlar yaqinroq va tartibsizroq (organik) joylashadi
        graph.d3Force('charge').strength(this.settings.networkRepulsion);
        graph.d3Force('link').distance(this.settings.linkDistance - 10);

        // 3. Simulyatsiyani qayta ishga tushirish
        graph.d3ReheatSimulation();

        console.log("Rejim: Neyron Tarmoq (Erkin) faollashdi.");
    },

    /**
     * Grafni o'rtaga tekislash (Kamera reset)
     * @param {Object} graph - ForceGraph3D instansiyasi
     */
    resetCamera: function(graph) {
        if (graph) {
            // Hamma tugunlar ekranda ko'rinadigan qilib fokuslash
            graph.zoomToFit(1000, 150);
        }
    }
};

// Modulni global oynaga (window) eksport qilish
window.MindMapEngine = MindMapEngine;
