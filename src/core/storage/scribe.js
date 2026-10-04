import { browserAPI } from '../browser';

const SCRIBE_KEY = 'mochi_scribe_notebooks';

export async function getNotebooks() {
  try {
    const data = await browserAPI.storage.local.get([SCRIBE_KEY]);
    return data[SCRIBE_KEY] || { global: '' };
  } catch (e) {
    const local = localStorage.getItem(SCRIBE_KEY);
    return local ? JSON.parse(local) : { global: '' };
  }
}

export async function saveNotebooks(notebooks) {
  try {
    await browserAPI.storage.local.set({ [SCRIBE_KEY]: notebooks });
  } catch (e) {
    localStorage.setItem(SCRIBE_KEY, JSON.stringify(notebooks));
  }
}
