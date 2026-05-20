const moodColors = {
  happy: '#ffd65a',
  calm: '#7ab8ff',
  romantic: '#ff94cc',
  energetic: '#ffad5f',
  focused: '#ae8cff'
};

const photoInput = document.getElementById('photoInput');
const moodyToggle = document.getElementById('moodyToggle');
const moodSelect = document.getElementById('moodSelect');
const captionInput = document.getElementById('captionInput');
const shareButton = document.getElementById('shareButton');
const previewImage = document.getElementById('previewImage');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const feed = document.getElementById('feed');
const moodFeed = document.getElementById('moodFeed');
const moodFilter = document.getElementById('moodFilter');
const summaryList = document.getElementById('summaryList');
const notif = document.getElementById('notif');

const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = {
  feed: document.getElementById('feedTab'),
  mood: document.getElementById('moodTab'),
  summary: document.getElementById('summaryTab')
};

let localPostCount = 0;
const posts = [
  {
    id: 'seed-1',
    by: 'Avery',
    image: 'https://picsum.photos/seed/moodsnap-1/400/300',
    mood: 'calm',
    caption: 'Sunset walk',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000
  },
  {
    id: 'seed-2',
    by: 'Kai',
    image: 'https://picsum.photos/seed/moodsnap-2/400/300',
    mood: 'happy',
    caption: 'Coffee + catchup',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000
  }
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderPosts(list, target, filterMood = 'all') {
  const items = list.filter((post) => filterMood === 'all' || post.mood === filterMood);

  if (!items.length) {
    target.innerHTML = '<p>No posts for this mood yet.</p>';
    return;
  }

  target.innerHTML = items
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(
      (post) => `
      <article class="post" style="border-color:${moodColors[post.mood] || '#9aa6b2'}">
        <img src="${post.image}" alt="${escapeHtml(post.by)}'s post" />
        <div class="meta">
          <strong>${escapeHtml(post.by)}</strong><br>
          <span>${escapeHtml(post.mood)}</span><br>
          <span>${escapeHtml(post.caption || '')}</span>
        </div>
      </article>`
    )
    .join('');
}

function renderSummary() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyPosts = posts.filter((post) => post.createdAt >= weekAgo);

  const counts = Object.keys(moodColors).reduce((acc, mood) => {
    acc[mood] = weeklyPosts.filter((post) => post.mood === mood).length;
    return acc;
  }, {});

  summaryList.innerHTML = Object.entries(counts)
    .map(
      ([mood, count]) =>
        `<li><span style="color:${moodColors[mood]}">●</span> ${escapeHtml(mood)}: ${count} post(s)</li>`
    )
    .join('');
}

function renderAll() {
  renderPosts(posts, feed);
  renderPosts(posts, moodFeed, moodFilter.value);
  renderSummary();
}

function showNotification(message) {
  notif.textContent = message;

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('MoodSnap', { body: message });
  }

  setTimeout(() => {
    notif.textContent = '';
  }, 3000);
}

function requestNotifications() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {
      // permission request can fail in unsupported contexts
    });
  }
}

moodyToggle.addEventListener('change', () => {
  moodSelect.disabled = !moodyToggle.checked;
  const mood = moodSelect.value;
  const color = moodyToggle.checked ? moodColors[mood] : '#c8ceda';
  previewImage.style.border = `6px solid ${color}`;
  previewPlaceholder.style.borderColor = color;
});

moodSelect.addEventListener('change', () => {
  if (moodyToggle.checked) {
    previewImage.style.border = `6px solid ${moodColors[moodSelect.value]}`;
    previewPlaceholder.style.borderColor = moodColors[moodSelect.value];
  }
});

photoInput.addEventListener('change', () => {
  const file = photoInput.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = String(reader.result);
    previewImage.hidden = false;
    previewPlaceholder.hidden = true;
  };
  reader.readAsDataURL(file);
});

shareButton.addEventListener('click', () => {
  if (!previewImage.src) {
    showNotification('Please select a photo before sharing.');
    return;
  }

  localPostCount += 1;

  const mood = moodyToggle.checked ? moodSelect.value : 'calm';
  const post = {
    id: `me-${localPostCount}`,
    by: 'You',
    image: previewImage.src,
    mood,
    caption: captionInput.value.trim(),
    createdAt: Date.now()
  };

  posts.push(post);
  renderAll();
  showNotification(`Shared! Friends see your post with a ${mood} frame.`);
});

moodFilter.addEventListener('change', renderAll);

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    Object.values(panels).forEach((panel) => panel.classList.add('hidden'));
    panels[tab.dataset.tab].classList.remove('hidden');
  });
}

setInterval(() => {
  const moods = Object.keys(moodColors);
  const mood = moods[Math.floor(Math.random() * moods.length)];
  posts.push({
    id: `friend-${Date.now()}`,
    by: 'Friend',
    image: `https://picsum.photos/seed/${Date.now()}/400/300`,
    mood,
    caption: 'Real-time mood post',
    createdAt: Date.now()
  });
  renderAll();
  showNotification('New real-time post from a friend.');
}, 45000);

requestNotifications();
renderAll();
