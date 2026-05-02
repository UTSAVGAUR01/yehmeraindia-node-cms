document.addEventListener('DOMContentLoaded', () => {
  const ideaBtn = document.getElementById('generateIdea');
  const outlineBtn = document.getElementById('generateOutline');
  const draftBtn = document.getElementById('generateDraft');
  const aiOutput = document.getElementById('aiOutput');

  function payload() {
    return {
      topic: document.getElementById('aiTopic')?.value || 'Top 10 positive India updates',
      tone: document.getElementById('aiTone')?.value || 'insightful',
      format: document.getElementById('aiFormat')?.value || 'article'
    };
  }

  async function generate(type) {
    aiOutput.innerHTML = `
      <div class="bg-white border rounded-2xl p-5">
        <p class="font-bold text-slate-700">Generating ${type}...</p>
      </div>
    `;

    const res = await fetch(`/api/admin/ai/generate-${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload())
    });

    const data = await res.json();

    if (!res.ok) {
      aiOutput.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 font-bold">
          ${data.message || 'AI generation failed'}
        </div>
      `;
      return;
    }

    if (data.type === 'idea') {
      aiOutput.innerHTML = `
        <div class="bg-white border rounded-2xl p-6 shadow-sm">
          <p class="text-sm font-black text-blue-600 mb-2">AI Reporter Idea</p>
          <h3 class="text-2xl font-black">${data.title}</h3>
          <p class="text-slate-600 mt-4">${data.summary}</p>
          <ul class="list-disc pl-6 mt-5 space-y-2">
            ${data.points.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      `;
      return;
    }

    if (data.type === 'outline') {
      aiOutput.innerHTML = `
        <div class="bg-white border rounded-2xl p-6 shadow-sm">
          <p class="text-sm font-black text-indigo-600 mb-2">AI Reporter Outline</p>
          <h3 class="text-2xl font-black">${data.title}</h3>
          <ol class="list-decimal pl-6 mt-5 space-y-2">
            ${data.sections.map(p => `<li>${p}</li>`).join('')}
          </ol>
        </div>
      `;
      return;
    }

    aiOutput.innerHTML = `
      <div class="bg-white border rounded-2xl p-6 shadow-sm">
        <p class="text-sm font-black text-green-600 mb-2">AI Reporter Draft</p>
        <h3 class="text-2xl font-black">${data.title}</h3>
        <p class="text-slate-600 mt-3">${data.excerpt}</p>
        <pre class="whitespace-pre-wrap bg-slate-50 border rounded-2xl p-5 mt-5 text-slate-700">${data.content}</pre>
        <button type="button" onclick="navigator.clipboard.writeText(document.querySelector('#aiOutput pre').innerText); alert('Draft copied')" class="mt-5 px-5 py-3 bg-slate-900 text-white rounded-xl font-black">
          Copy Draft
        </button>
      </div>
    `;
  }

  if (ideaBtn) ideaBtn.addEventListener('click', () => generate('idea'));
  if (outlineBtn) outlineBtn.addEventListener('click', () => generate('outline'));
  if (draftBtn) draftBtn.addEventListener('click', () => generate('draft'));
});